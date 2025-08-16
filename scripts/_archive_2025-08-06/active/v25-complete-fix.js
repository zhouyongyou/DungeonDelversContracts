#!/usr/bin/env node

/**
 * V25 完整修復腳本
 * 修復所有合約間的連接設定問題
 * 
 * 使用方式：
 * node scripts/active/v25-complete-fix.js
 * 或
 * npx hardhat run scripts/active/v25-complete-fix.js --network bsc
 */

const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// 從配置文件讀取地址
function loadV25Config() {
  const configPath = path.join(__dirname, '../../config/v25-config.js');
  if (!fs.existsSync(configPath)) {
    console.error(chalk.red('❌ 配置文件不存在，請先執行部署腳本'));
    process.exit(1);
  }
  
  const v25Config = require(configPath);
  const addresses = {};
  
  for (const [key, value] of Object.entries(v25Config.contracts)) {
    addresses[key] = value.address;
  }
  
  console.log(chalk.cyan(`📋 載入 V25 配置 (${v25Config.lastUpdated})`));
  return addresses;
}

class V25CompleteFixer {
  constructor(addresses) {
    this.addresses = addresses;
    this.contracts = {};
    this.signer = null;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    const colors = {
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      section: chalk.cyan.bold
    };
    
    const color = colors[type] || chalk.white;
    console.log(color(`[${type.toUpperCase()}] ${timestamp} ${message}`));
  }

  async init() {
    this.log('初始化合約連接...', 'section');
    
    [this.signer] = await ethers.getSigners();
    const signerAddress = await this.signer.getAddress();
    this.log(`使用錢包: ${signerAddress}`);

    // 載入所有合約
    const contractMap = {
      ORACLE: 'Oracle_V22_Adaptive',
      PLAYERVAULT: 'PlayerVault',
      DUNGEONCORE: 'DungeonCore',
      DUNGEONSTORAGE: 'DungeonStorage',
      DUNGEONMASTER: 'DungeonMasterV2_Fixed',
      HERO: 'Hero',
      RELIC: 'Relic',
      PARTY: 'PartyV3',
      VIPSTAKING: 'VIPStaking',
      PLAYERPROFILE: 'PlayerProfile',
      ALTAROFASCENSION: 'AltarOfAscensionV2Fixed'
    };

    for (const [name, contractName] of Object.entries(contractMap)) {
      try {
        const address = this.addresses[name];
        if (!address) {
          this.log(`⚠️ ${name} 地址未找到`, 'warning');
          continue;
        }
        
        const contract = await ethers.getContractAt(contractName, address);
        this.contracts[name] = contract;
        this.log(`✅ 載入 ${name}: ${address.slice(0,6)}...${address.slice(-4)}`, 'success');
      } catch (error) {
        this.log(`❌ 載入 ${name} 失敗: ${error.message}`, 'error');
      }
    }
  }

  async fixAll() {
    this.log('\n🔧 開始修復所有連接...', 'section');
    
    // 1. 設定模組 -> DungeonCore
    await this.setupModulesToCore();
    
    // 2. 設定 DungeonCore -> 模組
    await this.setupCoreToModules();
    
    // 3. 設定其他連接
    await this.setupOtherConnections();
    
    // 4. 驗證所有連接
    await this.verifyAllConnections();
    
    // 5. 顯示總結
    this.showSummary();
  }

  async setupModulesToCore() {
    this.log('\n📌 步驟 1: 設定模組 -> DungeonCore', 'section');
    
    const modules = ['HERO', 'RELIC', 'PARTY', 'PLAYERPROFILE', 'PLAYERVAULT', 'ALTAROFASCENSION'];
    
    for (const moduleName of modules) {
      const module = this.contracts[moduleName];
      if (!module) continue;
      
      try {
        // 檢查當前設定
        let currentCore = '0x0000000000000000000000000000000000000000';
        try {
          currentCore = await module.dungeonCore();
        } catch {
          try {
            currentCore = await module.dungeonCoreContract();
          } catch {}
        }
        
        if (currentCore.toLowerCase() === this.addresses.DUNGEONCORE.toLowerCase()) {
          this.log(`✅ ${moduleName} 已正確設定`, 'success');
          continue;
        }
        
        // 執行設定
        this.log(`設定 ${moduleName}.setDungeonCore...`);
        const tx = await module.setDungeonCore(this.addresses.DUNGEONCORE);
        await tx.wait();
        
        this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
        this.results.push({ action: `${moduleName}.setDungeonCore`, success: true });
        
      } catch (error) {
        this.log(`❌ ${moduleName}.setDungeonCore 失敗: ${error.message}`, 'error');
        this.results.push({ action: `${moduleName}.setDungeonCore`, success: false, error: error.message });
      }
    }
  }

  async setupCoreToModules() {
    this.log('\n📌 步驟 2: 設定 DungeonCore -> 模組', 'section');
    
    const dungeonCore = this.contracts.DUNGEONCORE;
    if (!dungeonCore) {
      this.log('❌ DungeonCore 未載入', 'error');
      return;
    }
    
    const settings = [
      { method: 'setPartyContract', address: this.addresses.PARTY, name: 'Party' },
      { method: 'setVIPStaking', address: this.addresses.VIPSTAKING, name: 'VIPStaking' },
      { method: 'setHeroContract', address: this.addresses.HERO, name: 'Hero' },
      { method: 'setRelicContract', address: this.addresses.RELIC, name: 'Relic' },
      { method: 'setPlayerProfile', address: this.addresses.PLAYERPROFILE, name: 'PlayerProfile' },
      { method: 'setPlayerVault', address: this.addresses.PLAYERVAULT, name: 'PlayerVault' },
      { method: 'setOracle', address: this.addresses.ORACLE, name: 'Oracle' }
    ];
    
    for (const setting of settings) {
      try {
        // 檢查方法是否存在
        if (!dungeonCore[setting.method]) {
          this.log(`⚠️ DungeonCore 沒有 ${setting.method} 方法`, 'warning');
          continue;
        }
        
        this.log(`設定 DungeonCore.${setting.method}...`);
        const tx = await dungeonCore[setting.method](setting.address);
        await tx.wait();
        
        this.log(`✅ DungeonCore.${setting.method} 成功`, 'success');
        this.results.push({ action: `DungeonCore.${setting.method}`, success: true });
        
      } catch (error) {
        this.log(`❌ DungeonCore.${setting.method} 失敗: ${error.message}`, 'error');
        this.results.push({ action: `DungeonCore.${setting.method}`, success: false, error: error.message });
      }
    }
  }

  async setupOtherConnections() {
    this.log('\n📌 步驟 3: 設定其他連接', 'section');
    
    // DungeonMaster 設定
    if (this.contracts.DUNGEONMASTER) {
      try {
        // 設定 SoulShard
        if (this.addresses.SOULSHARD && this.contracts.DUNGEONMASTER.setSoulShardToken) {
          this.log('設定 DungeonMaster.setSoulShardToken...');
          const tx = await this.contracts.DUNGEONMASTER.setSoulShardToken(this.addresses.SOULSHARD);
          await tx.wait();
          this.log('✅ DungeonMaster.setSoulShardToken 成功', 'success');
        }
        
        // 設定 DungeonCore
        if (this.contracts.DUNGEONMASTER.setDungeonCore) {
          this.log('設定 DungeonMaster.setDungeonCore...');
          const tx = await this.contracts.DUNGEONMASTER.setDungeonCore(this.addresses.DUNGEONCORE);
          await tx.wait();
          this.log('✅ DungeonMaster.setDungeonCore 成功', 'success');
        }
      } catch (error) {
        this.log(`❌ DungeonMaster 設定失敗: ${error.message}`, 'error');
      }
    }
    
    // Party 設定 NFT 合約
    if (this.contracts.PARTY) {
      try {
        if (this.contracts.PARTY.setHeroContract) {
          this.log('設定 Party.setHeroContract...');
          const tx = await this.contracts.PARTY.setHeroContract(this.addresses.HERO);
          await tx.wait();
          this.log('✅ Party.setHeroContract 成功', 'success');
        }
        
        if (this.contracts.PARTY.setRelicContract) {
          this.log('設定 Party.setRelicContract...');
          const tx = await this.contracts.PARTY.setRelicContract(this.addresses.RELIC);
          await tx.wait();
          this.log('✅ Party.setRelicContract 成功', 'success');
        }
      } catch (error) {
        this.log(`❌ Party NFT 設定失敗: ${error.message}`, 'error');
      }
    }
  }

  async verifyAllConnections() {
    this.log('\n📌 步驟 4: 驗證所有連接', 'section');
    
    const verificationResults = [];
    
    // 驗證 DungeonCore 的設定
    if (this.contracts.DUNGEONCORE) {
      const checks = [
        { getter: 'heroContractAddress', expected: this.addresses.HERO, name: 'Hero' },
        { getter: 'relicContractAddress', expected: this.addresses.RELIC, name: 'Relic' },
        { getter: 'partyContractAddress', expected: this.addresses.PARTY, name: 'Party' },
        { getter: 'vipStakingAddress', expected: this.addresses.VIPSTAKING, name: 'VIPStaking' },
        { getter: 'playerProfileAddress', expected: this.addresses.PLAYERPROFILE, name: 'PlayerProfile' },
        { getter: 'playerVaultAddress', expected: this.addresses.PLAYERVAULT, name: 'PlayerVault' }
      ];
      
      for (const check of checks) {
        try {
          const actual = await this.contracts.DUNGEONCORE[check.getter]();
          const matches = actual.toLowerCase() === check.expected.toLowerCase();
          
          verificationResults.push({
            contract: 'DungeonCore',
            setting: check.name,
            success: matches
          });
          
          if (matches) {
            this.log(`✅ DungeonCore.${check.name}: 正確`, 'success');
          } else {
            this.log(`❌ DungeonCore.${check.name}: 錯誤 (${actual})`, 'error');
          }
        } catch (error) {
          this.log(`⚠️ 無法驗證 DungeonCore.${check.name}`, 'warning');
        }
      }
    }
    
    // 驗證模組的 DungeonCore 設定
    const modules = ['HERO', 'RELIC', 'PARTY', 'PLAYERPROFILE', 'PLAYERVAULT'];
    for (const moduleName of modules) {
      const module = this.contracts[moduleName];
      if (!module) continue;
      
      try {
        let core = await (module.dungeonCore ? module.dungeonCore() : module.dungeonCoreContract());
        const matches = core.toLowerCase() === this.addresses.DUNGEONCORE.toLowerCase();
        
        verificationResults.push({
          contract: moduleName,
          setting: 'dungeonCore',
          success: matches
        });
        
        if (matches) {
          this.log(`✅ ${moduleName}.dungeonCore: 正確`, 'success');
        } else {
          this.log(`❌ ${moduleName}.dungeonCore: 錯誤`, 'error');
        }
      } catch (error) {
        this.log(`⚠️ 無法驗證 ${moduleName}.dungeonCore`, 'warning');
      }
    }
    
    return verificationResults;
  }

  showSummary() {
    this.log('\n📊 修復總結', 'section');
    
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;
    
    console.log(chalk.green(`\n✅ 成功: ${successCount} 項`));
    if (failureCount > 0) {
      console.log(chalk.red(`❌ 失敗: ${failureCount} 項`));
      
      console.log(chalk.yellow('\n失敗項目:'));
      this.results.filter(r => !r.success).forEach(r => {
        console.log(chalk.red(`  - ${r.action}: ${r.error}`));
      });
    }
    
    if (failureCount === 0) {
      console.log(chalk.green.bold('\n🎉 所有修復完成！'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️ 部分修復失敗，請檢查錯誤信息'));
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  console.log(chalk.cyan.bold(`
==================================================
🔧 V25 完整修復腳本
==================================================
`));
  
  try {
    // 載入配置
    const addresses = loadV25Config();
    
    // 創建修復器
    const fixer = new V25CompleteFixer(addresses);
    
    // 初始化
    await fixer.init();
    
    // 執行修復
    await fixer.fixAll();
    
    console.log(chalk.green.bold('\n✅ 修復腳本執行完成！'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ 修復腳本執行失敗:'), error);
    process.exit(1);
  }
}

// 執行腳本
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { V25CompleteFixer, loadV25Config };
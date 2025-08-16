const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// 從配置文件讀取 V25 合約地址
let ADDRESSES = {};
try {
  const configPath = path.join(__dirname, '../../config/v25-config.js');
  if (fs.existsSync(configPath)) {
    const v25Config = require(configPath);
    console.log(chalk.cyan(`📋 從配置文件讀取地址 (${v25Config.lastUpdated})`));
    
    // 轉換配置格式
    for (const [key, value] of Object.entries(v25Config.contracts)) {
      ADDRESSES[key] = value.address;
    }
    
    console.log(chalk.green('✅ 成功載入配置:'));
    console.log(chalk.gray(`  - DUNGEONCORE: ${ADDRESSES.DUNGEONCORE}`));
    console.log(chalk.gray(`  - PARTY: ${ADDRESSES.PARTY}`));
    console.log(chalk.gray(`  - VIPSTAKING: ${ADDRESSES.VIPSTAKING}`));
  } else {
    throw new Error('配置文件不存在');
  }
} catch (error) {
  console.log(chalk.yellow('⚠️ 無法讀取配置文件，使用備用地址'));
  // 備用地址（V25 正確地址）
  ADDRESSES = {
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    DUNGEONCORE: "0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a",
    DUNGEONSTORAGE: "0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77",
    DUNGEONMASTER: "0xd06470d4C6F62F6747cf02bD2b2De0981489034F",
    HERO: "0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db",
    RELIC: "0xcfB83d8545D68b796a236290b3C1bc7e4A140B11",
    PARTY: "0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    ALTAROFASCENSION: "0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
}

class ModuleSetupFixer {
  constructor() {
    this.contracts = {};
    this.signer = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    
    if (type === 'success') {
      console.log(chalk.green(`[SUCCESS] ${timestamp} ${message}`));
    } else if (type === 'error') {
      console.log(chalk.red(`[ERROR] ${timestamp} ${message}`));
    } else if (type === 'warning') {
      console.log(chalk.yellow(`[WARNING] ${timestamp} ${message}`));
    } else {
      console.log(chalk.blue(`[INFO] ${timestamp} ${message}`));
    }
  }

  async init() {
    this.log('初始化合約連接...');
    
    [this.signer] = await ethers.getSigners();
    const signerAddress = await this.signer.getAddress();
    this.log(`使用錢包: ${signerAddress}`);

    // 載入所有合約
    for (const [name, address] of Object.entries(ADDRESSES)) {
      try {
        const contractName = this.getContractName(name);
        const contract = await ethers.getContractAt(contractName, address);
        this.contracts[name] = contract;
        this.log(`✅ 載入 ${name} 合約: ${address}`, 'success');
      } catch (error) {
        this.log(`❌ 載入 ${name} 合約失敗: ${error.message}`, 'error');
      }
    }
  }

  getContractName(name) {
    const contractNameMap = {
      ORACLE: "Oracle",
      PLAYERVAULT: "PlayerVault",
      DUNGEONCORE: "DungeonCore",
      DUNGEONSTORAGE: "DungeonStorage",
      DUNGEONMASTER: "DungeonMasterV2_Fixed",
      HERO: "Hero",
      RELIC: "Relic",
      PARTY: "Party",
      VIPSTAKING: "VIPStaking",
      PLAYERPROFILE: "PlayerProfile",
      ALTAROFASCENSION: "AltarOfAscensionV2Fixed"
    };
    return contractNameMap[name] || name;
  }

  async setupModules() {
    this.log('\n🔧 開始修復模組設置...');
    
    const modulesToSetup = [
      'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
      'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
    ];
    
    const criticalModules = ['PLAYERPROFILE', 'DUNGEONMASTER', 'PLAYERVAULT'];
    const setupResults = [];
    
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName];
      if (!module) {
        this.log(`⚠️ ${moduleName} 合約未載入`, 'warning');
        continue;
      }
      
      this.log(`\n檢查 ${moduleName}...`);
      
      try {
        // 檢查是否有 setDungeonCore 方法
        if (!module.setDungeonCore) {
          this.log(`${moduleName} 沒有 setDungeonCore 方法`, 'warning');
          continue;
        }

        // 先檢查當前設置
        let currentDungeonCore = '0x0000000000000000000000000000000000000000';
        
        try {
          if (module.dungeonCore) {
            currentDungeonCore = await module.dungeonCore();
          }
        } catch (e) {
          // 如果沒有 dungeonCore getter，嘗試其他方法
          if (module.dungeonCoreContract) {
            currentDungeonCore = await module.dungeonCoreContract();
          }
        }

        this.log(`當前 DungeonCore: ${currentDungeonCore}`);
        
        if (currentDungeonCore.toLowerCase() === ADDRESSES.DUNGEONCORE.toLowerCase()) {
          this.log(`✅ ${moduleName} 已正確設置`, 'success');
          setupResults.push({ module: moduleName, success: true, message: '已正確設置' });
          continue;
        }

        // 需要設置
        this.log(`設置 ${moduleName}.setDungeonCore...`);
        
        const tx = await module.setDungeonCore(ADDRESSES.DUNGEONCORE);
        this.log(`交易發送: ${tx.hash}`);
        
        const receipt = await tx.wait();
        this.log(`交易確認，區塊: ${receipt.blockNumber}`);
        
        // 驗證設置
        await this.sleep(1000);
        
        let newDungeonCore = await (module.dungeonCore ? module.dungeonCore() : module.dungeonCoreContract());
        
        if (newDungeonCore.toLowerCase() === ADDRESSES.DUNGEONCORE.toLowerCase()) {
          this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
          setupResults.push({ module: moduleName, success: true, message: '設置成功' });
        } else {
          this.log(`❌ ${moduleName}.setDungeonCore 驗證失敗`, 'error');
          setupResults.push({ module: moduleName, success: false, message: '驗證失敗' });
        }
        
      } catch (error) {
        this.log(`❌ ${moduleName} 設置失敗: ${error.message}`, 'error');
        setupResults.push({ 
          module: moduleName, 
          success: false, 
          message: error.message,
          isCritical: criticalModules.includes(moduleName)
        });
      }
    }

    // 顯示總結
    this.log('\n📊 設置總結:');
    const successCount = setupResults.filter(r => r.success).length;
    const failureCount = setupResults.filter(r => !r.success).length;
    const criticalFailures = setupResults.filter(r => !r.success && r.isCritical);
    
    this.log(`成功: ${successCount}`, 'success');
    this.log(`失敗: ${failureCount}`, failureCount > 0 ? 'error' : 'info');
    
    if (criticalFailures.length > 0) {
      this.log(`\n⚠️ 關鍵模組設置失敗:`, 'error');
      criticalFailures.forEach(f => {
        this.log(`- ${f.module}: ${f.message}`, 'error');
      });
    }

    // 顯示詳細結果
    this.log('\n詳細結果:');
    setupResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const type = result.success ? 'success' : 'error';
      this.log(`${icon} ${result.module}: ${result.message}`, type);
    });
  }

  async verifyAllConnections() {
    this.log('\n🔍 驗證所有連接...');
    
    const verificationResults = [];
    
    // 驗證 DungeonCore 的所有連接
    this.log('\n檢查 DungeonCore 設置:');
    const dungeonCore = this.contracts.DUNGEONCORE;
    
    const dungeonCoreChecks = [
      { name: 'Oracle', getter: 'oracleAddress', expected: ADDRESSES.ORACLE },
      { name: 'PlayerVault', getter: 'playerVaultAddress', expected: ADDRESSES.PLAYERVAULT },
      { name: 'PlayerProfile', getter: 'playerProfileAddress', expected: ADDRESSES.PLAYERPROFILE },
      { name: 'VIPStaking', getter: 'vipStakingAddress', expected: ADDRESSES.VIPSTAKING },
      { name: 'DungeonMaster', getter: 'dungeonMasterAddress', expected: ADDRESSES.DUNGEONMASTER },
      { name: 'Hero', getter: 'heroContractAddress', expected: ADDRESSES.HERO },
      { name: 'Relic', getter: 'relicContractAddress', expected: ADDRESSES.RELIC },
      { name: 'Party', getter: 'partyContractAddress', expected: ADDRESSES.PARTY },
      { name: 'AltarOfAscension', getter: 'altarOfAscensionAddress', expected: ADDRESSES.ALTAROFASCENSION }
    ];
    
    for (const check of dungeonCoreChecks) {
      try {
        const actual = await dungeonCore[check.getter]();
        const matches = actual.toLowerCase() === check.expected.toLowerCase();
        
        if (matches) {
          this.log(`✅ ${check.name}: ${actual}`, 'success');
        } else {
          this.log(`❌ ${check.name}: ${actual} (應為 ${check.expected})`, 'error');
        }
        
        verificationResults.push({
          contract: 'DungeonCore',
          setting: check.name,
          success: matches,
          actual,
          expected: check.expected
        });
      } catch (error) {
        this.log(`❌ 無法檢查 ${check.name}: ${error.message}`, 'error');
      }
    }
    
    return verificationResults;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  console.log(chalk.cyan('\n=================================================='));
  console.log(chalk.cyan('🔧 V25 模組設置修復腳本'));
  console.log(chalk.cyan('==================================================\n'));
  
  const fixer = new ModuleSetupFixer();
  
  try {
    await fixer.init();
    await fixer.setupModules();
    await fixer.verifyAllConnections();
    
    console.log(chalk.green('\n✅ 修復腳本執行完成！'));
  } catch (error) {
    console.error(chalk.red('\n❌ 修復腳本執行失敗:'), error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * V25 部署狀態檢查腳本
 * 
 * 快速檢查所有合約的部署和設置狀態
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-check-status.js --network bsc
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class V25StatusChecker {
  constructor() {
    this.v25Config = null;
    this.results = {
      contracts: {},
      settings: {},
      connections: {}
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[✓]${colors.reset}`,
      error: `${colors.red}[✗]${colors.reset}`,
      warning: `${colors.yellow}[!]${colors.reset}`
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async check() {
    console.log(`${colors.bright}
==================================================
🔍 V25 部署狀態檢查
==================================================
${colors.reset}`);

    try {
      // 載入配置
      await this.loadConfig();
      
      // 檢查合約部署
      await this.checkContracts();
      
      // 檢查合約設置
      await this.checkSettings();
      
      // 檢查合約連接
      await this.checkConnections();
      
      // 顯示總結
      this.showSummary();
      
    } catch (error) {
      this.log(`檢查失敗: ${error.message}`, 'error');
      console.error(error);
    }
  }

  async loadConfig() {
    const configPath = path.join(__dirname, '../../config/v25-config.js');
    if (!fs.existsSync(configPath)) {
      throw new Error('V25 配置文件不存在');
    }
    
    this.v25Config = require(configPath);
    this.log(`已載入 V25 配置`, 'info');
  }

  async checkContracts() {
    this.log('\n檢查合約部署狀態...', 'info');
    
    for (const [name, info] of Object.entries(this.v25Config.contracts)) {
      if (info.address) {
        try {
          const code = await hre.ethers.provider.getCode(info.address);
          if (code && code !== '0x') {
            this.results.contracts[name] = { deployed: true, address: info.address };
            this.log(`${name}: ${info.address}`, 'success');
          } else {
            this.results.contracts[name] = { deployed: false, address: info.address };
            this.log(`${name}: 未部署`, 'error');
          }
        } catch (error) {
          this.results.contracts[name] = { deployed: false, error: error.message };
          this.log(`${name}: 檢查失敗 - ${error.message}`, 'error');
        }
      }
    }
  }

  async checkSettings() {
    this.log('\n檢查合約設置...', 'info');
    
    // 檢查 Hero/Relic BaseURI
    await this.checkBaseURI('HERO', 'Hero');
    await this.checkBaseURI('RELIC', 'Relic');
    await this.checkBaseURI('PARTY', 'PartyV3');
    await this.checkBaseURI('PLAYERPROFILE', 'PlayerProfile');
    await this.checkBaseURI('VIPSTAKING', 'VIPStaking');
    
    // 檢查 ContractURI
    await this.checkContractURI('HERO', 'Hero');
    await this.checkContractURI('RELIC', 'Relic');
    await this.checkContractURI('PARTY', 'PartyV3');
  }

  async checkBaseURI(contractName, artifactName) {
    try {
      const address = this.v25Config.contracts[contractName]?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory(artifactName);
      const contract = Contract.attach(address);
      
      const baseURI = await contract.baseURI();
      if (baseURI && baseURI.length > 0) {
        this.results.settings[`${contractName}_baseURI`] = true;
        this.log(`${contractName} BaseURI: ✓`, 'success');
      } else {
        this.results.settings[`${contractName}_baseURI`] = false;
        this.log(`${contractName} BaseURI: 未設置`, 'warning');
      }
    } catch (error) {
      this.results.settings[`${contractName}_baseURI`] = false;
      this.log(`${contractName} BaseURI: 檢查失敗`, 'error');
    }
  }

  async checkContractURI(contractName, artifactName) {
    try {
      const address = this.v25Config.contracts[contractName]?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory(artifactName);
      const contract = Contract.attach(address);
      
      const contractURI = await contract.contractURI();
      if (contractURI && contractURI.length > 0) {
        this.results.settings[`${contractName}_contractURI`] = true;
        this.log(`${contractName} ContractURI: ✓`, 'success');
      } else {
        this.results.settings[`${contractName}_contractURI`] = false;
        this.log(`${contractName} ContractURI: 未設置`, 'warning');
      }
    } catch (error) {
      this.results.settings[`${contractName}_contractURI`] = false;
    }
  }

  async checkConnections() {
    this.log('\n檢查合約連接...', 'info');
    
    // 檢查 Hero/Relic 的 SoulShard Token
    await this.checkSoulShardToken('HERO', 'Hero');
    await this.checkSoulShardToken('RELIC', 'Relic');
    
    // 檢查 Hero/Relic 的祭壇地址
    await this.checkAscensionAltar('HERO', 'Hero');
    await this.checkAscensionAltar('RELIC', 'Relic');
    
    // 檢查 Party 的連接
    await this.checkPartyConnections();
    
    // 檢查 PlayerProfile 的 DungeonCore
    await this.checkDungeonCoreConnection('PLAYERPROFILE', 'PlayerProfile');
    
    // 檢查 VIPStaking 的連接
    await this.checkVIPStakingConnections();
  }

  async checkSoulShardToken(contractName, artifactName) {
    try {
      const address = this.v25Config.contracts[contractName]?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory(artifactName);
      const contract = Contract.attach(address);
      
      const soulShardAddress = await contract.soulShardToken();
      if (soulShardAddress === this.v25Config.contracts.SOULSHARD.address) {
        this.results.connections[`${contractName}_soulShard`] = true;
        this.log(`${contractName} SoulShard Token: ✓`, 'success');
      } else {
        this.results.connections[`${contractName}_soulShard`] = false;
        this.log(`${contractName} SoulShard Token: 錯誤地址`, 'error');
      }
    } catch (error) {
      this.results.connections[`${contractName}_soulShard`] = false;
      this.log(`${contractName} SoulShard Token: 檢查失敗`, 'error');
    }
  }

  async checkAscensionAltar(contractName, artifactName) {
    try {
      const address = this.v25Config.contracts[contractName]?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory(artifactName);
      const contract = Contract.attach(address);
      
      const altarAddress = await contract.ascensionAltarAddress();
      if (altarAddress === this.v25Config.contracts.ALTAROFASCENSION.address) {
        this.results.connections[`${contractName}_altar`] = true;
        this.log(`${contractName} Ascension Altar: ✓`, 'success');
      } else {
        this.results.connections[`${contractName}_altar`] = false;
        this.log(`${contractName} Ascension Altar: 錯誤地址`, 'error');
      }
    } catch (error) {
      this.results.connections[`${contractName}_altar`] = false;
      this.log(`${contractName} Ascension Altar: 檢查失敗`, 'error');
    }
  }

  async checkPartyConnections() {
    try {
      const address = this.v25Config.contracts.PARTY?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory('PartyV3');
      const contract = Contract.attach(address);
      
      // 檢查 Hero Contract
      const heroAddress = await contract.heroContract();
      if (heroAddress === this.v25Config.contracts.HERO.address) {
        this.results.connections['PARTY_hero'] = true;
        this.log('Party Hero Contract: ✓', 'success');
      } else {
        this.results.connections['PARTY_hero'] = false;
        this.log('Party Hero Contract: 錯誤地址', 'error');
      }
      
      // 檢查 Relic Contract
      const relicAddress = await contract.relicContract();
      if (relicAddress === this.v25Config.contracts.RELIC.address) {
        this.results.connections['PARTY_relic'] = true;
        this.log('Party Relic Contract: ✓', 'success');
      } else {
        this.results.connections['PARTY_relic'] = false;
        this.log('Party Relic Contract: 錯誤地址', 'error');
      }
      
      // 檢查 DungeonCore
      const dungeonCoreAddress = await contract.dungeonCoreContract();
      if (dungeonCoreAddress === this.v25Config.contracts.DUNGEONCORE.address) {
        this.results.connections['PARTY_dungeonCore'] = true;
        this.log('Party DungeonCore: ✓', 'success');
      } else {
        this.results.connections['PARTY_dungeonCore'] = false;
        this.log('Party DungeonCore: 錯誤地址', 'error');
      }
    } catch (error) {
      this.log('Party 連接檢查失敗', 'error');
    }
  }

  async checkDungeonCoreConnection(contractName, artifactName) {
    try {
      const address = this.v25Config.contracts[contractName]?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory(artifactName);
      const contract = Contract.attach(address);
      
      const dungeonCoreAddress = await contract.dungeonCore();
      if (dungeonCoreAddress === this.v25Config.contracts.DUNGEONCORE.address) {
        this.results.connections[`${contractName}_dungeonCore`] = true;
        this.log(`${contractName} DungeonCore: ✓`, 'success');
      } else {
        this.results.connections[`${contractName}_dungeonCore`] = false;
        this.log(`${contractName} DungeonCore: 錯誤地址`, 'error');
      }
    } catch (error) {
      this.results.connections[`${contractName}_dungeonCore`] = false;
      this.log(`${contractName} DungeonCore: 檢查失敗`, 'error');
    }
  }

  async checkVIPStakingConnections() {
    try {
      const address = this.v25Config.contracts.VIPSTAKING?.address;
      if (!address) return;
      
      const Contract = await hre.ethers.getContractFactory('VIPStaking');
      const contract = Contract.attach(address);
      
      // 檢查 DungeonCore
      const dungeonCoreAddress = await contract.dungeonCore();
      if (dungeonCoreAddress === this.v25Config.contracts.DUNGEONCORE.address) {
        this.results.connections['VIPSTAKING_dungeonCore'] = true;
        this.log('VIPStaking DungeonCore: ✓', 'success');
      } else {
        this.results.connections['VIPSTAKING_dungeonCore'] = false;
        this.log('VIPStaking DungeonCore: 錯誤地址', 'error');
      }
      
      // 檢查 SoulShard Token
      const soulShardAddress = await contract.soulShardToken();
      if (soulShardAddress === this.v25Config.contracts.SOULSHARD.address) {
        this.results.connections['VIPSTAKING_soulShard'] = true;
        this.log('VIPStaking SoulShard Token: ✓', 'success');
      } else {
        this.results.connections['VIPSTAKING_soulShard'] = false;
        this.log('VIPStaking SoulShard Token: 錯誤地址', 'error');
      }
    } catch (error) {
      this.log('VIPStaking 連接檢查失敗', 'error');
    }
  }

  showSummary() {
    console.log(`\n${colors.bright}📊 檢查總結${colors.reset}\n`);
    
    // 合約部署統計
    const deployedCount = Object.values(this.results.contracts).filter(c => c.deployed).length;
    const totalContracts = Object.keys(this.results.contracts).length;
    console.log(`合約部署: ${deployedCount}/${totalContracts}`);
    
    // 設置統計
    const settingsCount = Object.values(this.results.settings).filter(s => s).length;
    const totalSettings = Object.keys(this.results.settings).length;
    console.log(`合約設置: ${settingsCount}/${totalSettings}`);
    
    // 連接統計
    const connectionsCount = Object.values(this.results.connections).filter(c => c).length;
    const totalConnections = Object.keys(this.results.connections).length;
    console.log(`合約連接: ${connectionsCount}/${totalConnections}`);
    
    // 建議修復
    if (settingsCount < totalSettings || connectionsCount < totalConnections) {
      console.log(`\n${colors.yellow}💡 建議執行修復腳本：${colors.reset}`);
      console.log('npx hardhat run scripts/active/v25-fix-settings.js --network bsc');
    } else {
      console.log(`\n${colors.green}✅ 所有檢查通過！${colors.reset}`);
    }
  }
}

// 執行檢查
async function main() {
  const checker = new V25StatusChecker();
  await checker.check();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
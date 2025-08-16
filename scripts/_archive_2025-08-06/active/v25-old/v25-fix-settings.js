#!/usr/bin/env node

/**
 * V25 補充設置腳本
 * 
 * 用於修復 V25 部署中缺失的設置
 * 可以在已部署的合約上執行
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-fix-settings.js --network bsc
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

class V25SettingsFixer {
  constructor() {
    this.contracts = {};
    this.v25Config = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`
    };
    console.log(`${prefix[type]} ${timestamp} ${message}`);
  }

  async fix() {
    console.log(`${colors.bright}
==================================================
🔧 V25 補充設置腳本
==================================================
${colors.reset}`);

    try {
      // 載入配置
      await this.loadConfig();
      
      // 連接合約
      await this.connectContracts();
      
      // 執行補充設置
      await this.fixMissingSettings();
      
      this.log('\n✅ 補充設置完成！', 'success');
      
    } catch (error) {
      this.log(`設置失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async loadConfig() {
    this.log('載入 V25 配置...', 'info');
    
    const configPath = path.join(__dirname, '../../config/v25-config.js');
    if (!fs.existsSync(configPath)) {
      throw new Error('V25 配置文件不存在');
    }
    
    this.v25Config = require(configPath);
    this.log(`已載入配置: ${Object.keys(this.v25Config.contracts).length} 個合約`, 'info');
  }

  async connectContracts() {
    this.log('\n連接合約...', 'info');
    const [signer] = await hre.ethers.getSigners();
    
    // 連接所有需要的合約
    const contractsToConnect = [
      { name: 'HERO', artifact: 'Hero' },
      { name: 'RELIC', artifact: 'Relic' },
      { name: 'PARTY', artifact: 'PartyV3' },
      { name: 'ALTAROFASCENSION', artifact: 'AltarOfAscensionV2Fixed' },
      { name: 'DUNGEONSTORAGE', artifact: 'DungeonStorage' },
      { name: 'PLAYERPROFILE', artifact: 'PlayerProfile' },
      { name: 'VIPSTAKING', artifact: 'VIPStaking' },
      { name: 'DUNGEONCORE', artifact: 'DungeonCore' }
    ];
    
    for (const { name, artifact } of contractsToConnect) {
      const address = this.v25Config.contracts[name]?.address;
      if (address) {
        const Contract = await hre.ethers.getContractFactory(artifact);
        this.contracts[name] = Contract.attach(address);
        this.log(`✅ 連接 ${name}: ${address}`, 'success');
      }
    }
  }

  async fixMissingSettings() {
    this.log('\n執行補充設置...', 'info');
    
    // 1. Hero/Relic 設置 SoulShard
    await this.setSoulShardTokens();
    
    // 2. 設置祭壇連接
    await this.setAltarConnections();
    
    // 3. Hero/Relic 設置祭壇地址
    await this.setAscensionAltarAddresses();
    
    // 4. Party 設置 NFT 合約
    await this.setPartyNFTContracts();
    
    // 5. 初始化地城（如果需要）
    await this.initializeDungeons();
    
    // 6. 設置 ContractURI（可選）
    await this.setContractURIs();
    
    // 7. 設置 BaseURI
    await this.setBaseURIs();
    
    // 8. 設置其他合約連接
    await this.setOtherContractConnections();
  }

  async setSoulShardTokens() {
    this.log('\n設置 Hero/Relic 的 SoulShard Token...', 'info');
    
    const soulShardAddress = this.v25Config.contracts.SOULSHARD?.address;
    if (!soulShardAddress) {
      this.log('⚠️ SoulShard 地址未找到', 'warning');
      return;
    }
    
    for (const nftName of ['HERO', 'RELIC']) {
      try {
        const nft = this.contracts[nftName];
        if (nft && nft.setSoulShardToken) {
          const tx = await nft.setSoulShardToken(soulShardAddress);
          await tx.wait();
          this.log(`✅ ${nftName}.setSoulShardToken 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${nftName}.setSoulShardToken 失敗: ${error.message}`, 'error');
      }
    }
  }

  async setAltarConnections() {
    this.log('\n設置祭壇合約連接...', 'info');
    
    const altar = this.contracts.ALTAROFASCENSION;
    if (!altar) {
      this.log('⚠️ 祭壇合約未連接', 'warning');
      return;
    }
    
    try {
      const tx = await altar.setContracts(
        this.v25Config.contracts.DUNGEONCORE.address,
        this.v25Config.contracts.HERO.address,
        this.v25Config.contracts.RELIC.address
      );
      await tx.wait();
      this.log('✅ AltarOfAscension.setContracts 成功', 'success');
    } catch (error) {
      this.log(`❌ AltarOfAscension.setContracts 失敗: ${error.message}`, 'error');
    }
  }

  async setAscensionAltarAddresses() {
    this.log('\n設置 Hero/Relic 的祭壇地址...', 'info');
    
    const altarAddress = this.v25Config.contracts.ALTAROFASCENSION?.address;
    if (!altarAddress) {
      this.log('⚠️ 祭壇地址未找到', 'warning');
      return;
    }
    
    for (const nftName of ['HERO', 'RELIC']) {
      try {
        const nft = this.contracts[nftName];
        if (nft && nft.setAscensionAltarAddress) {
          const tx = await nft.setAscensionAltarAddress(altarAddress);
          await tx.wait();
          this.log(`✅ ${nftName}.setAscensionAltarAddress 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${nftName}.setAscensionAltarAddress 失敗: ${error.message}`, 'error');
      }
    }
  }

  async setPartyNFTContracts() {
    this.log('\n設置 Party 的 NFT 合約...', 'info');
    
    const party = this.contracts.PARTY;
    if (!party) {
      this.log('⚠️ Party 合約未連接', 'warning');
      return;
    }
    
    try {
      if (party.setHeroContract) {
        const tx1 = await party.setHeroContract(this.v25Config.contracts.HERO.address);
        await tx1.wait();
        this.log('✅ Party.setHeroContract 成功', 'success');
      }
      
      if (party.setRelicContract) {
        const tx2 = await party.setRelicContract(this.v25Config.contracts.RELIC.address);
        await tx2.wait();
        this.log('✅ Party.setRelicContract 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ Party NFT 設置失敗: ${error.message}`, 'error');
    }
  }

  async initializeDungeons() {
    this.log('\n初始化地城數據...', 'info');
    
    const dungeonStorage = this.contracts.DUNGEONSTORAGE;
    if (!dungeonStorage) {
      this.log('⚠️ DungeonStorage 合約未連接', 'warning');
      return;
    }
    
    const dungeons = [
      { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
      { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
      { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
      { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
      { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
      { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
      { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
      { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
      { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
      { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 }
    ];
    
    for (const dungeon of dungeons) {
      try {
        const tx = await dungeonStorage.setDungeon(
          dungeon.id,
          dungeon.name,
          dungeon.requiredPower,
          hre.ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
          dungeon.successRate
        );
        await tx.wait();
        this.log(`✅ 地城 ${dungeon.id} - ${dungeon.name} 設置成功`, 'success');
      } catch (error) {
        this.log(`❌ 地城 ${dungeon.id} 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setContractURIs() {
    this.log('\n設置 ContractURI（OpenSea 元數據）...', 'info');
    
    const contractURIs = {
      HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/hero',
      RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/relic',
      PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/party'
    };
    
    for (const [name, uri] of Object.entries(contractURIs)) {
      try {
        const contract = this.contracts[name];
        if (contract && contract.setContractURI) {
          const tx = await contract.setContractURI(uri);
          await tx.wait();
          this.log(`✅ ${name} ContractURI 設置成功`, 'success');
        }
      } catch (error) {
        this.log(`⚠️ ${name} ContractURI 設置失敗: ${error.message}`, 'warning');
      }
    }
  }
  
  async setBaseURIs() {
    this.log('\n設置 BaseURI...', 'info');
    
    const baseURIs = {
      HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
      RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
      PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
      PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/',
      VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/'
    };
    
    for (const [name, uri] of Object.entries(baseURIs)) {
      try {
        const contract = this.contracts[name];
        if (contract && contract.setBaseURI) {
          const tx = await contract.setBaseURI(uri);
          await tx.wait();
          this.log(`✅ ${name} BaseURI 設置成功`, 'success');
        }
      } catch (error) {
        this.log(`⚠️ ${name} BaseURI 設置失敗: ${error.message}`, 'warning');
      }
    }
  }
  
  async setOtherContractConnections() {
    this.log('\n設置其他合約連接...', 'info');
    
    // 設置 PlayerProfile 的 DungeonCore
    try {
      if (this.contracts.PLAYERPROFILE && this.contracts.PLAYERPROFILE.setDungeonCore) {
        const tx = await this.contracts.PLAYERPROFILE.setDungeonCore(
          this.v25Config.contracts.DUNGEONCORE.address
        );
        await tx.wait();
        this.log('✅ PlayerProfile.setDungeonCore 成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ PlayerProfile.setDungeonCore 失敗: ${error.message}`, 'warning');
    }
    
    // 設置 VIPStaking 的 DungeonCore
    try {
      if (this.contracts.VIPSTAKING && this.contracts.VIPSTAKING.setDungeonCore) {
        const tx = await this.contracts.VIPSTAKING.setDungeonCore(
          this.v25Config.contracts.DUNGEONCORE.address
        );
        await tx.wait();
        this.log('✅ VIPStaking.setDungeonCore 成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ VIPStaking.setDungeonCore 失敗: ${error.message}`, 'warning');
    }
    
    // 設置 VIPStaking 的 SoulShardToken
    try {
      if (this.contracts.VIPSTAKING && this.contracts.VIPSTAKING.setSoulShardToken) {
        const tx = await this.contracts.VIPSTAKING.setSoulShardToken(
          this.v25Config.contracts.SOULSHARD.address
        );
        await tx.wait();
        this.log('✅ VIPStaking.setSoulShardToken 成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ VIPStaking.setSoulShardToken 失敗: ${error.message}`, 'warning');
    }
    
    // 設置 Party 的 DungeonCore
    try {
      if (this.contracts.PARTY && this.contracts.PARTY.setDungeonCore) {
        const tx = await this.contracts.PARTY.setDungeonCore(
          this.v25Config.contracts.DUNGEONCORE.address
        );
        await tx.wait();
        this.log('✅ Party.setDungeonCore 成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ Party.setDungeonCore 失敗: ${error.message}`, 'warning');
    }
  }
}

// 執行補充設置
async function main() {
  const fixer = new V25SettingsFixer();
  await fixer.fix();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
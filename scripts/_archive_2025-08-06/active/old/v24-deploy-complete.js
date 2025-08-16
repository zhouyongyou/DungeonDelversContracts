#!/usr/bin/env node

/**
 * V24 完整部署腳本
 * 整合自 V23 的所有部署經驗，一次性完成所有部署和設置
 * 
 * 使用方式：
 * node scripts/active/v24-deploy-complete.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// 合約配置
const CONTRACT_PATHS = {
  // DeFi
  ORACLE: 'defi/Oracle_V22_Adaptive.sol:Oracle_V22_Adaptive',
  SOULSHARD: 'defi/SoulShard.sol:SoulShard',
  PLAYERVAULT: 'defi/PlayerVault.sol:PlayerVault',
  
  // Core
  DUNGEONCORE: 'current/core/DungeonCore.sol:DungeonCore',
  DUNGEONMASTER: 'current/core/DungeonMaster.sol:DungeonMasterV2_Fixed',
  DUNGEONSTORAGE: 'current/core/DungeonStorage.sol:DungeonStorage',
  
  // NFT
  HERO: 'current/nft/Hero.sol:Hero',
  RELIC: 'current/nft/Relic.sol:Relic',
  PARTY: 'current/nft/Party.sol:Party',
  VIPSTAKING: 'current/nft/VIPStaking.sol:VIPStaking',
  PLAYERPROFILE: 'current/nft/PlayerProfile.sol:PlayerProfile',
  ALTAROFASCENSION: 'current/nft/AltarOfAscension.sol:AltarOfAscensionV2Fixed'
};

// 部署順序（依賴關係）
const DEPLOYMENT_ORDER = [
  'ORACLE',
  'SOULSHARD',
  'PLAYERVAULT',
  'DUNGEONCORE',
  'DUNGEONSTORAGE',
  'DUNGEONMASTER',
  'HERO',
  'RELIC',
  'PARTY',
  'VIPSTAKING',
  'PLAYERPROFILE',
  'ALTAROFASCENSION'
];

class V24Deployer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/');
    this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contracts = {};
    this.verificationData = [];
    this.startBlock = null;
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

  async deploy() {
    console.log(`${colors.bright}
==================================================
🚀 V24 完整部署腳本
==================================================
${colors.reset}`);

    try {
      // 1. 前置檢查
      await this.preDeploymentChecks();
      
      // 2. 獲取起始區塊
      this.startBlock = await this.provider.getBlockNumber();
      this.log(`起始區塊: ${this.startBlock}`, 'info');
      
      // 3. 部署合約
      await this.deployContracts();
      
      // 4. 設置合約連接
      await this.setupConnections();
      
      // 5. 初始化參數
      await this.initializeParameters();
      
      // 6. 生成配置文件
      await this.generateConfigs();
      
      // 7. 驗證部署
      await this.verifyDeployment();
      
      this.log('\\n✅ V24 部署完成！', 'success');
      
    } catch (error) {
      this.log(`部署失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    this.log('執行部署前檢查...', 'info');
    
    // 檢查環境變數
    if (!process.env.PRIVATE_KEY) {
      throw new Error('缺少 PRIVATE_KEY 環境變數');
    }
    
    // 檢查餘額
    const balance = await this.provider.getBalance(this.deployer.address);
    const balanceInBNB = ethers.formatEther(balance);
    this.log(`部署錢包餘額: ${balanceInBNB} BNB`, 'info');
    
    if (parseFloat(balanceInBNB) < 0.5) {
      throw new Error('BNB 餘額不足 (建議至少 0.5 BNB)');
    }
    
    // 檢查網路
    const network = await this.provider.getNetwork();
    if (network.chainId !== 56n) {
      throw new Error(`錯誤的網路 (期望 BSC Mainnet 56, 實際 ${network.chainId})`);
    }
  }

  async deployContracts() {
    this.log('\\n開始部署合約...', 'info');
    
    for (const contractName of DEPLOYMENT_ORDER) {
      await this.deployContract(contractName);
    }
  }

  async deployContract(contractName) {
    this.log(`\\n部署 ${contractName}...`, 'info');
    
    const contractPath = CONTRACT_PATHS[contractName];
    const [filePath, contractClass] = contractPath.split(':');
    
    const ContractFactory = await ethers.getContractFactory(contractClass, this.deployer);
    
    let contract;
    const constructorArgs = this.getConstructorArgs(contractName);
    
    try {
      contract = await ContractFactory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      this.contracts[contractName] = { address, contract };
      
      this.log(`✅ ${contractName} 部署成功: ${address}`, 'success');
      
      // 保存驗證數據
      this.verificationData.push({
        name: contractName,
        address,
        constructorArgs,
        contractPath: `contracts/${filePath}`
      });
      
    } catch (error) {
      this.log(`❌ ${contractName} 部署失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  getConstructorArgs(contractName) {
    // 基於 V23 的經驗，所有合約都使用單一 initialOwner 參數
    const owner = this.deployer.address;
    
    const args = {
      ORACLE: [owner],
      SOULSHARD: [owner],
      PLAYERVAULT: [owner],
      DUNGEONCORE: [owner],
      DUNGEONSTORAGE: [owner],
      DUNGEONMASTER: [owner],
      HERO: [owner],
      RELIC: [owner],
      PARTY: [owner],
      VIPSTAKING: [owner],
      PLAYERPROFILE: [owner],
      ALTAROFASCENSION: [owner]
    };
    
    return args[contractName] || [owner];
  }

  async setupConnections() {
    this.log('\\n設置合約連接...', 'info');
    
    // 1. DungeonCore 設置
    await this.setupDungeonCore();
    
    // 2. 各模組設置 DungeonCore
    await this.setupModules();
    
    // 3. 特殊連接
    await this.setupSpecialConnections();
  }

  async setupDungeonCore() {
    this.log('\\n配置 DungeonCore...', 'info');
    const dungeonCore = this.contracts.DUNGEONCORE.contract;
    
    const settings = [
      { method: 'setOracle', param: this.contracts.ORACLE.address, name: 'Oracle' },
      { method: 'setHeroContract', param: this.contracts.HERO.address, name: 'Hero' },
      { method: 'setRelicContract', param: this.contracts.RELIC.address, name: 'Relic' },
      { method: 'setPartyContract', param: this.contracts.PARTY.address, name: 'Party' },
      { method: 'setDungeonMaster', param: this.contracts.DUNGEONMASTER.address, name: 'DungeonMaster' },
      { method: 'setPlayerVault', param: this.contracts.PLAYERVAULT.address, name: 'PlayerVault' },
      { method: 'setPlayerProfile', param: this.contracts.PLAYERPROFILE.address, name: 'PlayerProfile' },
      { method: 'setVipStaking', param: this.contracts.VIPSTAKING.address, name: 'VIPStaking' },
      { method: 'setAltarOfAscension', param: this.contracts.ALTAROFASCENSION.address, name: 'AltarOfAscension' }
    ];
    
    for (const setting of settings) {
      try {
        const tx = await dungeonCore[setting.method](setting.param);
        await tx.wait();
        this.log(`✅ DungeonCore.${setting.method} 成功`, 'success');
      } catch (error) {
        this.log(`❌ DungeonCore.${setting.method} 失敗: ${error.message}`, 'error');
      }
    }
  }

  async setupModules() {
    this.log('\\n配置各模組...', 'info');
    
    // 需要設置 DungeonCore 的合約
    const modulesToSetup = [
      'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
      'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
    ];
    
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName].contract;
      try {
        // 檢查是否有 setDungeonCore 方法
        if (module.setDungeonCore) {
          const tx = await module.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
        }
      } catch (error) {
        this.log(`⚠️ ${moduleName}.setDungeonCore: ${error.message}`, 'warning');
      }
    }
  }

  async setupSpecialConnections() {
    this.log('\\n設置特殊連接...', 'info');
    
    // 1. 設置 SoulShard token
    const modulesNeedingSoulShard = ['HERO', 'RELIC', 'VIPSTAKING', 'PLAYERVAULT', 'DUNGEONMASTER'];
    
    for (const moduleName of modulesNeedingSoulShard) {
      const module = this.contracts[moduleName].contract;
      try {
        if (module.setSoulShardToken) {
          const tx = await module.setSoulShardToken(this.contracts.SOULSHARD.address);
          await tx.wait();
          this.log(`✅ ${moduleName}.setSoulShardToken 成功`, 'success');
        }
      } catch (error) {
        this.log(`⚠️ ${moduleName}.setSoulShardToken: ${error.message}`, 'warning');
      }
    }
    
    // 2. DungeonMaster 特殊設置
    try {
      const dungeonMaster = this.contracts.DUNGEONMASTER.contract;
      const tx = await dungeonMaster.setDungeonStorage(this.contracts.DUNGEONSTORAGE.address);
      await tx.wait();
      this.log('✅ DungeonMaster.setDungeonStorage 成功', 'success');
    } catch (error) {
      this.log(`❌ DungeonMaster.setDungeonStorage: ${error.message}`, 'error');
    }
    
    // 3. DungeonStorage 設置
    try {
      const dungeonStorage = this.contracts.DUNGEONSTORAGE.contract;
      const tx = await dungeonStorage.setLogicContract(this.contracts.DUNGEONMASTER.address);
      await tx.wait();
      this.log('✅ DungeonStorage.setLogicContract 成功', 'success');
    } catch (error) {
      this.log(`❌ DungeonStorage.setLogicContract: ${error.message}`, 'error');
    }
    
    // 4. Hero & Relic 設置 ascensionAltar
    for (const nftName of ['HERO', 'RELIC']) {
      try {
        const nft = this.contracts[nftName].contract;
        const tx = await nft.setAscensionAltar(this.contracts.ALTAROFASCENSION.address);
        await tx.wait();
        this.log(`✅ ${nftName}.setAscensionAltar 成功`, 'success');
      } catch (error) {
        this.log(`❌ ${nftName}.setAscensionAltar: ${error.message}`, 'error');
      }
    }
  }

  async initializeParameters() {
    this.log('\\n初始化參數...', 'info');
    
    // 1. 設置 BaseURI
    await this.setBaseURIs();
    
    // 2. 設置價格
    await this.setPrices();
    
    // 3. 初始化地城
    await this.initializeDungeons();
    
    // 4. 設置其他參數
    await this.setOtherParameters();
  }

  async setBaseURIs() {
    this.log('\\n設置 BaseURI...', 'info');
    
    const baseURIs = {
      HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
      RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
      PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
      VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
      PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
    };
    
    for (const [contractName, uri] of Object.entries(baseURIs)) {
      try {
        const contract = this.contracts[contractName].contract;
        const tx = await contract.setBaseURI(uri);
        await tx.wait();
        this.log(`✅ ${contractName} BaseURI 設置成功`, 'success');
      } catch (error) {
        this.log(`❌ ${contractName} BaseURI 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setPrices() {
    this.log('\\n設置價格...', 'info');
    
    // 設置 Hero 和 Relic 的鑄造價格為 $2 USD
    for (const nftName of ['HERO', 'RELIC']) {
      try {
        const nft = this.contracts[nftName].contract;
        // 注意：setMintPriceUSD 會自動乘以 1e18，所以只傳入 2
        const tx = await nft.setMintPriceUSD(2);
        await tx.wait();
        this.log(`✅ ${nftName} 鑄造價格設置為 $2 USD`, 'success');
      } catch (error) {
        this.log(`❌ ${nftName} 價格設置失敗: ${error.message}`, 'error');
      }
    }
    
    // 設置批量鑄造階層
    const batchTiers = [
      { quantity: 1, maxRarity: 7, discount: 0 },
      { quantity: 5, maxRarity: 6, discount: 5 },
      { quantity: 10, maxRarity: 5, discount: 10 },
      { quantity: 20, maxRarity: 4, discount: 15 },
      { quantity: 50, maxRarity: 3, discount: 20 }
    ];
    
    for (const nftName of ['HERO', 'RELIC']) {
      this.log(`\\n設置 ${nftName} 批量鑄造階層...`, 'info');
      const nft = this.contracts[nftName].contract;
      
      for (let i = 0; i < batchTiers.length; i++) {
        const tier = batchTiers[i];
        try {
          const tx = await nft.setBatchTier(
            i + 1,
            tier.quantity,
            tier.maxRarity,
            tier.discount
          );
          await tx.wait();
          this.log(`✅ Tier ${i + 1}: ${tier.quantity}個, 最高稀有度${tier.maxRarity}, ${tier.discount}%折扣`, 'success');
        } catch (error) {
          this.log(`❌ Tier ${i + 1} 設置失敗: ${error.message}`, 'error');
        }
      }
    }
  }

  async initializeDungeons() {
    this.log('\\n初始化地城...', 'info');
    
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
    
    const dungeonMaster = this.contracts.DUNGEONMASTER.contract;
    
    for (const dungeon of dungeons) {
      try {
        const tx = await dungeonMaster.setDungeon(
          dungeon.id,
          [
            dungeon.name,
            dungeon.requiredPower,
            ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
            dungeon.successRate
          ]
        );
        await tx.wait();
        this.log(`✅ 地城 ${dungeon.id} - ${dungeon.name} 設置成功`, 'success');
      } catch (error) {
        this.log(`❌ 地城 ${dungeon.id} 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setOtherParameters() {
    this.log('\\n設置其他參數...', 'info');
    
    // 1. 設置 DungeonMaster 錢包
    try {
      const dungeonMaster = this.contracts.DUNGEONMASTER.contract;
      if (dungeonMaster.setDungeonMasterWallet) {
        const tx = await dungeonMaster.setDungeonMasterWallet(this.deployer.address);
        await tx.wait();
        this.log('✅ DungeonMaster 錢包設置成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ DungeonMaster 錢包設置: ${error.message}`, 'warning');
    }
    
    // 2. 設置 Party 創建費用 (0.001 BNB)
    try {
      const party = this.contracts.PARTY.contract;
      const tx = await party.setPlatformFee(ethers.parseEther('0.001'));
      await tx.wait();
      this.log('✅ Party 創建費用設置為 0.001 BNB', 'success');
    } catch (error) {
      this.log(`❌ Party 創建費用設置失敗: ${error.message}`, 'error');
    }
    
    // 3. 設置 VIP 解鎖冷卻期 (15秒測試用)
    try {
      const vipStaking = this.contracts.VIPSTAKING.contract;
      const tx = await vipStaking.setUnstakeCooldown(15);
      await tx.wait();
      this.log('✅ VIP 解鎖冷卻期設置為 15 秒', 'success');
    } catch (error) {
      this.log(`❌ VIP 冷卻期設置失敗: ${error.message}`, 'error');
    }
  }

  async generateConfigs() {
    this.log('\\n生成配置文件...', 'info');
    
    // 生成 v24-config.js
    const v24Config = {
      version: 'V24',
      lastUpdated: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: this.deployer.address,
      startBlock: this.startBlock,
      contracts: {}
    };
    
    for (const [name, data] of Object.entries(this.contracts)) {
      v24Config.contracts[name] = {
        address: data.address,
        deploymentBlock: this.startBlock,
        contractName: CONTRACT_PATHS[name].split(':')[1]
      };
    }
    
    const configPath = path.join(__dirname, '../../config/v24-config.js');
    const configContent = `// V24 部署配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

module.exports = ${JSON.stringify(v24Config, null, 2)};`;
    
    fs.writeFileSync(configPath, configContent);
    this.log(`✅ 配置文件已生成: ${configPath}`, 'success');
    
    // 生成驗證腳本數據
    const verificationPath = path.join(__dirname, '../deployments', `v24-verification-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(verificationPath), { recursive: true });
    fs.writeFileSync(verificationPath, JSON.stringify(this.verificationData, null, 2));
    this.log(`✅ 驗證數據已保存: ${verificationPath}`, 'success');
  }

  async verifyDeployment() {
    this.log('\\n驗證部署...', 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    // 基本驗證
    for (const [name, data] of Object.entries(this.contracts)) {
      const code = await this.provider.getCode(data.address);
      if (code !== '0x') {
        successCount++;
        this.log(`✅ ${name} 部署驗證通過`, 'success');
      } else {
        failCount++;
        this.log(`❌ ${name} 部署驗證失敗`, 'error');
      }
    }
    
    this.log(`\\n部署驗證結果: ${successCount} 成功, ${failCount} 失敗`, 'info');
    
    // 顯示重要地址
    console.log(`\\n${colors.bright}重要合約地址:${colors.reset}`);
    console.log(`DungeonCore: ${this.contracts.DUNGEONCORE.address}`);
    console.log(`Hero: ${this.contracts.HERO.address}`);
    console.log(`Relic: ${this.contracts.RELIC.address}`);
    console.log(`SoulShard: ${this.contracts.SOULSHARD.address}`);
    
    console.log(`\\n${colors.bright}下一步:${colors.reset}`);
    console.log('1. 執行合約驗證: node scripts/active/v24-verify-contracts.js');
    console.log('2. 同步配置到各項目: node scripts/active/v24-sync-all.js');
    console.log('3. 測試批量鑄造: node scripts/active/v24-test-batch-mint.js');
  }
}

// 執行部署
if (require.main === module) {
  const deployer = new V24Deployer();
  deployer.deploy().catch(console.error);
}

module.exports = V24Deployer;
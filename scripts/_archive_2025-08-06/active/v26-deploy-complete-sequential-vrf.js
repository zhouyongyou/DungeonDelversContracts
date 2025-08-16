#!/usr/bin/env node

/**
 * V26 VRF 完整部署腳本 - 統一 VRF 版本
 * 
 * 部署所有合約使用 Chainlink VRF v2.5 Direct Funding 模式
 * 實現統一稀有度機率，全部操作使用 VRF
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v26-deploy-complete-sequential-vrf.js --network bsc
 */

const hre = require("hardhat");
const { ethers } = require("ethers");
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

// ======================== VRF 配置區域 ========================

// BSC 主網 VRF v2.5 Direct Funding 配置
const VRF_CONFIG = {
  BSC_MAINNET: {
    wrapperAddress: "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94", // BSC 主網 VRF Wrapper
    linkToken: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",      // BSC 主網 LINK
    coordinatorAddress: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9", // VRF Coordinator
    requestConfirmations: 3,
    callbackGasLimit: 200000,
    useNativePayment: true
  },
  BSC_TESTNET: {
    wrapperAddress: "0x699d428ee890d55D56d5FC6e26290f3247A762bd", // BSC 測試網 VRF Wrapper
    linkToken: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",      // BSC 測試網 LINK
    coordinatorAddress: "0x2Ed2C9D4a6Fa61D9e5d56d71486C25D088BF3066", // VRF Coordinator
    requestConfirmations: 3,
    callbackGasLimit: 200000,
    useNativePayment: true
  }
};

// 部署配置
const DEPLOYMENT_CONFIG = {
  // 是否部署新的 Token 合約（生產環境通常設為 false）
  deployNewTokens: false,  // 設為 true 會部署新的 SoulShard
  
  // 現有合約地址（如果不部署新的）
  existingContracts: {
    SOULSHARD: process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    UNISWAP_POOL: process.env.UNISWAP_POOL || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
  },
  
  // 外部地址
  externalAddresses: {
    USDT: process.env.USDT_ADDRESS || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', // BSC USDT
  },
  
  // 部署選項
  options: {
    autoVerify: true,        // 自動驗證合約
    setupConnections: true,  // 自動設置合約連接
    initializeParams: true,  // 自動初始化參數
    generateDocs: true,      // 生成部署文檔
  }
};

// VRF 合約部署順序（依賴關係）
const VRF_DEPLOYMENT_ORDER = [
  // 代幣合約
  ...(DEPLOYMENT_CONFIG.deployNewTokens ? ['Test_SoulShard'] : []),
  'Oracle_V22_Adaptive', // Oracle 現在總是重新部署
  
  // 核心合約
  'PlayerVault',
  'DungeonCore',
  'DungeonStorage',
  
  // VRF NFT 合約
  'Hero_UnifiedVRF',
  'Relic_UnifiedVRF',
  'PartyV3',
  
  // VRF 功能合約
  'VIPStaking',
  'PlayerProfile',
  'DungeonMaster_UnifiedVRF',
  'AltarOfAscension_UnifiedVRF'
];

// VRF 合約名稱映射
const VRF_CONTRACT_NAME_MAP = {
  'Oracle_V22_Adaptive': 'ORACLE',
  'Test_SoulShard': 'SOULSHARD',
  'PlayerVault': 'PLAYERVAULT',
  'DungeonCore': 'DUNGEONCORE',
  'DungeonStorage': 'DUNGEONSTORAGE',
  'Hero_UnifiedVRF': 'HERO',
  'Relic_UnifiedVRF': 'RELIC',
  'PartyV3': 'PARTY',
  'VIPStaking': 'VIPSTAKING',
  'PlayerProfile': 'PLAYERPROFILE',
  'DungeonMaster_UnifiedVRF': 'DUNGEONMASTER',
  'AltarOfAscension_UnifiedVRF': 'ALTAROFASCENSION'
};

// 統一稀有度配置
const UNIFIED_RARITY_CONFIG = {
  rarity1Chance: 44,  // 44%
  rarity2Chance: 35,  // 35%
  rarity3Chance: 15,  // 15%
  rarity4Chance: 5,   // 5%
  rarity5Chance: 1    // 1%
};

// 遊戲參數配置
const GAME_PARAMS = {
  // NFT 鑄造價格（USD）
  mintPriceUSD: 2,
  
  // 地城配置
  dungeons: [
    { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
    { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
    { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
    { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
    { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
    { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
    { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
    { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
    { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
    { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 },
    { id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 320, successRate: 39 },
    { id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 450, successRate: 34 }
  ],
  
  // 基礎 URI
  baseURIs: {
    HERO: process.env.HERO_BASE_URI || 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
    RELIC: process.env.RELIC_BASE_URI || 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
    PARTY: process.env.PARTY_BASE_URI || 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
    VIPSTAKING: process.env.VIP_BASE_URI || 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
    PLAYERPROFILE: process.env.PROFILE_BASE_URI || 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/'
  },
  
  // 合約 URI（OpenSea 元數據）
  contractURIs: {
    HERO: process.env.HERO_CONTRACT_URI || 'https://www.dungeondelvers.xyz/metadata/hero-collection.json',
    RELIC: process.env.RELIC_CONTRACT_URI || 'https://www.dungeondelvers.xyz/metadata/relic-collection.json',
    PARTY: process.env.PARTY_CONTRACT_URI || 'https://www.dungeondelvers.xyz/metadata/party-collection.json',
    VIPSTAKING: process.env.VIP_CONTRACT_URI || 'https://www.dungeondelvers.xyz/metadata/vip-staking-collection.json',
    PLAYERPROFILE: process.env.PROFILE_CONTRACT_URI || 'https://www.dungeondelvers.xyz/metadata/player-profile-collection.json'
  },
  
  // 其他參數
  partyCreationFee: '0.001', // BNB
  vipUnstakeCooldown: 86400, // 1 天（生產環境）
};

// ======================== 主部署類 ========================

class V26VRFDeployer {
  constructor() {
    this.contracts = {};
    this.verificationData = [];
    this.startBlock = null;
    this.deploymentLog = [];
    this.errors = [];
    this.vrfConfig = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`
    };
    
    const logMessage = `${prefix[type]} ${timestamp} ${message}`;
    console.log(logMessage);
    
    // 記錄到部署日誌
    this.deploymentLog.push({
      timestamp: new Date().toISOString(),
      type,
      message
    });
  }

  async deploy() {
    console.log(`${colors.bright}
==================================================
🚀 V26 VRF 完整部署腳本 - 統一 VRF 版本
==================================================
${colors.reset}`);

    try {
      // 創建原生 ethers provider 和 wallet
      const provider = new ethers.JsonRpcProvider(
        process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
      );
      
      this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      this.provider = provider;
      
      // 1. 前置檢查
      await this.preDeploymentChecks();
      
      // 2. 設置 VRF 配置
      await this.setupVRFConfig();
      
      // 3. 載入現有合約（如果有）
      await this.loadExistingContracts();
      
      // 4. 獲取起始區塊
      this.startBlock = await this.provider.getBlockNumber();
      this.log(`起始區塊: ${this.startBlock}`, 'info');
      
      // 5. 部署 VRF 合約
      await this.deployVRFContracts();
      
      // 6. 設置合約連接
      if (DEPLOYMENT_CONFIG.options.setupConnections) {
        await this.setupVRFConnections();
      }
      
      // 7. 初始化 VRF 參數
      if (DEPLOYMENT_CONFIG.options.initializeParams) {
        await this.initializeVRFParameters();
      }
      
      // 8. 生成配置文件
      await this.generateVRFConfigs();
      
      // 9. 驗證部署
      await this.verifyDeployment();
      
      // 10. 自動驗證合約（如果啟用）
      if (DEPLOYMENT_CONFIG.options.autoVerify) {
        await this.autoVerifyContracts();
      }
      
      // 11. 生成部署報告
      await this.generateVRFDeploymentReport();
      
      // 12. 自動執行同步腳本
      await this.runVRFSyncScript();
      
      this.log('\n✅ V26 VRF 部署完成！', 'success');
      
    } catch (error) {
      this.log(`部署失敗: ${error.message}`, 'error');
      this.errors.push(error);
      await this.generateErrorReport();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    this.log('執行部署前檢查...', 'info');
    
    // 檢查網路
    const network = await this.provider.getNetwork();
    if (network.chainId !== 56n) {
      throw new Error(`錯誤的網路 (期望 BSC Mainnet 56, 實際 ${network.chainId})`);
    }
    
    // 檢查餘額
    const balance = await this.provider.getBalance(this.deployer.address);
    const balanceInBNB = ethers.formatEther(balance);
    this.log(`部署錢包: ${this.deployer.address}`, 'info');
    this.log(`錢包餘額: ${balanceInBNB} BNB`, 'info');
    
    if (parseFloat(balanceInBNB) < 0.5) {
      throw new Error('BNB 餘額不足 (建議至少 0.5 BNB)');
    }
    
    // 檢查環境變數
    if (!process.env.BSCSCAN_API_KEY) {
      this.log('警告: BSCSCAN_API_KEY 未設置，無法自動驗證合約', 'warning');
    }
  }

  async setupVRFConfig() {
    this.log('\n設置 VRF 配置...', 'info');
    
    // 根據網路選擇 VRF 配置
    const network = await this.provider.getNetwork();
    if (network.chainId === 56n) {
      this.vrfConfig = VRF_CONFIG.BSC_MAINNET;
      this.log('使用 BSC 主網 VRF 配置', 'info');
    } else if (network.chainId === 97n) {
      this.vrfConfig = VRF_CONFIG.BSC_TESTNET;
      this.log('使用 BSC 測試網 VRF 配置', 'info');
    } else {
      throw new Error(`不支援的網路 Chain ID: ${network.chainId}`);
    }
    
    this.log(`VRF Wrapper: ${this.vrfConfig.wrapperAddress}`, 'info');
    this.log(`LINK Token: ${this.vrfConfig.linkToken}`, 'info');
    this.log(`VRF Coordinator: ${this.vrfConfig.coordinatorAddress}`, 'info');
    this.log(`使用原生支付: ${this.vrfConfig.useNativePayment}`, 'info');
  }

  async loadExistingContracts() {
    if (!DEPLOYMENT_CONFIG.deployNewTokens) {
      this.log('\n載入現有合約地址...', 'info');
      for (const [name, address] of Object.entries(DEPLOYMENT_CONFIG.existingContracts)) {
        this.contracts[name] = { address };
        this.log(`✅ 使用現有 ${name}: ${address}`, 'success');
      }
    }
  }

  async deployVRFContracts() {
    this.log('\n開始部署 VRF 合約...', 'info');
    
    for (const contractName of VRF_DEPLOYMENT_ORDER) {
      await this.deployContract(contractName);
    }
  }

  async deployContract(contractName) {
    const mappedName = VRF_CONTRACT_NAME_MAP[contractName];
    this.log(`\n部署 ${mappedName} (${contractName})...`, 'info');
    
    try {
      const ContractFactory = await hre.ethers.getContractFactory(contractName);
      
      // 根據合約類型設置構造函數參數
      const constructorArgs = this.getVRFConstructorArgs(contractName);
      
      // 確保參數是陣列
      const args = Array.isArray(constructorArgs) ? constructorArgs : [constructorArgs];
      this.log(`構造參數: ${JSON.stringify(args)}`, 'info');
      
      // 使用原生 ethers.js 方式部署
      let contract;
      let address;
      
      try {
        const artifact = await hre.artifacts.readArtifact(contractName);
        
        const factory = new ethers.ContractFactory(
          artifact.abi,
          artifact.bytecode,
          this.deployer
        );
        
        this.log('發送部署交易...', 'info');
        contract = await factory.deploy(...args);
        
        this.log(`交易 hash: ${contract.deploymentTransaction().hash}`, 'info');
        await contract.waitForDeployment();
        
        address = await contract.getAddress();
        
      } catch (error) {
        this.log(`部署錯誤詳情: ${error.message}`, 'error');
        throw error;
      }
      
      this.contracts[mappedName] = { 
        address, 
        contract,
        contractName: contractName
      };
      
      this.log(`✅ ${mappedName} 部署成功: ${address}`, 'success');
      
      // 保存驗證數據
      this.verificationData.push({
        name: mappedName,
        contractName: contractName,
        address,
        constructorArgs
      });
      
    } catch (error) {
      this.log(`❌ ${mappedName} 部署失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  getVRFConstructorArgs(contractName) {
    switch (contractName) {
      case 'Oracle_V22_Adaptive':
        const soulShardAddress = this.contracts.SOULSHARD?.address || 
          DEPLOYMENT_CONFIG.existingContracts.SOULSHARD;
        
        if (!soulShardAddress) {
          throw new Error('SoulShard address not found');
        }
        
        return [
          DEPLOYMENT_CONFIG.existingContracts.UNISWAP_POOL,
          soulShardAddress,
          DEPLOYMENT_CONFIG.externalAddresses.USDT
        ];
      
      case 'Test_SoulShard':
        return [];
      
      case 'DungeonCore':
        return [
          this.deployer.address,
          DEPLOYMENT_CONFIG.externalAddresses.USDT,
          this.contracts.SOULSHARD?.address || DEPLOYMENT_CONFIG.existingContracts.SOULSHARD
        ];
      
      // VRF 合約需要額外的 VRF 參數
      case 'Hero_UnifiedVRF':
      case 'Relic_UnifiedVRF':
        return [
          this.deployer.address,
          this.vrfConfig.wrapperAddress,
          this.vrfConfig.linkToken
        ];
      
      case 'AltarOfAscension_UnifiedVRF':
      case 'DungeonMaster_UnifiedVRF':
        return [
          this.deployer.address,
          this.vrfConfig.wrapperAddress,
          this.vrfConfig.linkToken
        ];
      
      default:
        return [this.deployer.address];
    }
  }

  async setupVRFConnections() {
    this.log('\n設置 VRF 合約連接...', 'info');
    
    // 順序執行以避免 nonce 衝突
    await this.setupDungeonCore();
    await this.setupVRFSpecialConnections();
    await this.setupVRFModules();
  }

  async setupDungeonCore() {
    this.log('\n配置 DungeonCore...', 'info');
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
        this.errors.push({ type: 'DungeonCore設置', setting, error });
      }
    }
  }

  async setupVRFSpecialConnections() {
    this.log('\n設置 VRF 特殊連接...', 'info');
    
    // 設置 VRF 合約的依賴關係
    const vrfModules = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'];
    
    for (const moduleName of vrfModules) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
      try {
        // 設置 DungeonCore
        if (module.setDungeonCore) {
          const tx1 = await module.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx1.wait();
          this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
        }
        
        // 設置 SoulShardToken
        if (module.setSoulShardToken) {
          const tx2 = await module.setSoulShardToken(this.contracts.SOULSHARD.address);
          await tx2.wait();
          this.log(`✅ ${moduleName}.setSoulShardToken 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${moduleName} VRF 連接失敗: ${error.message}`, 'error');
        this.errors.push({ type: 'VRF連接設置', moduleName, error });
      }
    }
    
    // Hero & Relic 設置祭壇地址
    for (const nftName of ['HERO', 'RELIC']) {
      try {
        const nft = this.contracts[nftName]?.contract;
        if (nft && nft.setAscensionAltarAddress) {
          const tx = await nft.setAscensionAltarAddress(this.contracts.ALTAROFASCENSION.address);
          await tx.wait();
          this.log(`✅ ${nftName}.setAscensionAltarAddress 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${nftName}.setAscensionAltarAddress 失敗: ${error.message}`, 'error');
      }
    }
    
    // 設置升星祭壇
    try {
      const altar = this.contracts.ALTAROFASCENSION?.contract;
      if (altar && altar.setContracts) {
        const tx = await altar.setContracts(
          this.contracts.DUNGEONCORE.address,
          this.contracts.HERO.address,
          this.contracts.RELIC.address
        );
        await tx.wait();
        this.log('✅ AltarOfAscension.setContracts 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ AltarOfAscension.setContracts 失敗: ${error.message}`, 'error');
    }
    
    // DungeonMaster & DungeonStorage 連接
    try {
      if (this.contracts.DUNGEONMASTER?.contract && this.contracts.DUNGEONSTORAGE?.contract) {
        const tx1 = await this.contracts.DUNGEONMASTER.contract.setDungeonStorage(
          this.contracts.DUNGEONSTORAGE.address
        );
        await tx1.wait();
        this.log('✅ DungeonMaster.setDungeonStorage 成功', 'success');
        
        const tx2 = await this.contracts.DUNGEONSTORAGE.contract.setLogicContract(
          this.contracts.DUNGEONMASTER.address
        );
        await tx2.wait();
        this.log('✅ DungeonStorage.setLogicContract 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ DungeonMaster/Storage 連接失敗: ${error.message}`, 'error');
    }
  }

  async setupVRFModules() {
    this.log('\n配置 VRF 模組...', 'info');
    
    const modulesToSetup = [
      'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 'PLAYERVAULT'
    ];
    
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
      try {
        if (module.setDungeonCore) {
          const tx = await module.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
        }
        
        if (module.setSoulShardToken) {
          const tx = await module.setSoulShardToken(this.contracts.SOULSHARD.address);
          await tx.wait();
          this.log(`✅ ${moduleName}.setSoulShardToken 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${moduleName} 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async initializeVRFParameters() {
    this.log('\n初始化 VRF 參數...', 'info');
    
    await this.setVRFConfigs();
    await this.setUnifiedRarityConfigs();
    await this.setBaseURIs();
    await this.initializeDungeons();
    await this.setOtherParameters();
  }

  async setVRFConfigs() {
    this.log('\n設置 VRF 配置...', 'info');
    
    const vrfContracts = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'];
    
    for (const contractName of vrfContracts) {
      try {
        const contract = this.contracts[contractName]?.contract;
        if (contract && contract.setVRFConfig) {
          const tx = await contract.setVRFConfig(
            this.vrfConfig.requestConfirmations,
            this.vrfConfig.callbackGasLimit,
            this.vrfConfig.useNativePayment
          );
          await tx.wait();
          this.log(`✅ ${contractName} VRF 配置設置成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${contractName} VRF 配置設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setUnifiedRarityConfigs() {
    this.log('\n設置統一稀有度配置...', 'info');
    
    const nftContracts = ['HERO', 'RELIC'];
    
    for (const contractName of nftContracts) {
      try {
        const contract = this.contracts[contractName]?.contract;
        if (contract && contract.setUnifiedRarityConfig) {
          const tx = await contract.setUnifiedRarityConfig(UNIFIED_RARITY_CONFIG);
          await tx.wait();
          this.log(`✅ ${contractName} 統一稀有度配置設置成功`, 'success');
          this.log(`   機率分布: 44%/35%/15%/5%/1%`, 'info');
        }
      } catch (error) {
        this.log(`❌ ${contractName} 統一稀有度配置設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setBaseURIs() {
    this.log('\n設置 BaseURI...', 'info');
    
    for (const [contractName, uri] of Object.entries(GAME_PARAMS.baseURIs)) {
      try {
        const contract = this.contracts[contractName]?.contract;
        if (contract && contract.setBaseURI) {
          const tx = await contract.setBaseURI(uri);
          await tx.wait();
          this.log(`✅ ${contractName} BaseURI 設置成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${contractName} BaseURI 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async initializeDungeons() {
    this.log('\n初始化地城...', 'info');
    
    const dungeonMaster = this.contracts.DUNGEONMASTER?.contract;
    if (!dungeonMaster) {
      this.log('⚠️ DungeonMaster 未部署，跳過地城初始化', 'warning');
      return;
    }
    
    for (const dungeon of GAME_PARAMS.dungeons) {
      try {
        const tx = await dungeonMaster.setDungeon(
          dungeon.id,
          dungeon.requiredPower,
          ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
          dungeon.successRate
        );
        await tx.wait();
        this.log(`✅ 地城 ${dungeon.id} - ${dungeon.name} 設置成功`, 'success');
      } catch (error) {
        this.log(`❌ 地城 ${dungeon.id} 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setOtherParameters() {
    this.log('\n設置其他參數...', 'info');
    
    // 設置 Party 創建費用
    try {
      const party = this.contracts.PARTY?.contract;
      if (party && party.setPlatformFee) {
        const tx = await party.setPlatformFee(ethers.parseEther(GAME_PARAMS.partyCreationFee));
        await tx.wait();
        this.log(`✅ Party 創建費用設置為 ${GAME_PARAMS.partyCreationFee} BNB`, 'success');
      }
    } catch (error) {
      this.log(`❌ Party 創建費用設置失敗: ${error.message}`, 'error');
    }
    
    // 設置 VIP 解鎖冷卻期
    try {
      const vipStaking = this.contracts.VIPSTAKING?.contract;
      if (vipStaking && vipStaking.setUnstakeCooldown) {
        const tx = await vipStaking.setUnstakeCooldown(GAME_PARAMS.vipUnstakeCooldown);
        await tx.wait();
        const days = GAME_PARAMS.vipUnstakeCooldown / 86400;
        this.log(`✅ VIP 解鎖冷卻期設置為 ${days} 天`, 'success');
      }
    } catch (error) {
      this.log(`❌ VIP 冷卻期設置失敗: ${error.message}`, 'error');
    }
  }

  async generateVRFConfigs() {
    this.log('\n生成 VRF 配置文件...', 'info');
    
    // 生成 v26-vrf-config.js
    const v26Config = {
      version: 'V26-VRF',
      lastUpdated: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: this.deployer.address,
      startBlock: this.startBlock,
      vrfConfig: this.vrfConfig,
      unifiedRarityConfig: UNIFIED_RARITY_CONFIG,
      contracts: {},
      deploymentOptions: DEPLOYMENT_CONFIG,
      gameParams: GAME_PARAMS
    };
    
    for (const [name, data] of Object.entries(this.contracts)) {
      v26Config.contracts[name] = {
        address: data.address,
        deploymentBlock: this.startBlock,
        contractName: data.contractName || name
      };
    }
    
    const configPath = path.join(__dirname, '../../config/v26-vrf-config.js');
    const configContent = `// V26 VRF 部署配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

module.exports = ${JSON.stringify(v26Config, null, 2)};`;
    
    fs.writeFileSync(configPath, configContent);
    this.log(`✅ 配置文件已生成: ${configPath}`, 'success');
    
    // 生成驗證腳本數據
    const verificationPath = path.join(__dirname, '../deployments', `v26-vrf-verification-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(verificationPath), { recursive: true });
    fs.writeFileSync(verificationPath, JSON.stringify({
      version: 'V26-VRF',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      verificationData: this.verificationData
    }, null, 2));
    this.log(`✅ 驗證數據已保存: ${verificationPath}`, 'success');
  }

  async verifyDeployment() {
    this.log('\n驗證部署...', 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const [name, data] of Object.entries(this.contracts)) {
      if (data.address) {
        const code = await this.provider.getCode(data.address);
        if (code !== '0x') {
          successCount++;
          this.log(`✅ ${name} 部署驗證通過`, 'success');
        } else {
          failCount++;
          this.log(`❌ ${name} 部署驗證失敗`, 'error');
        }
      }
    }
    
    this.log(`\n部署驗證結果: ${successCount} 成功, ${failCount} 失敗`, 'info');
  }

  async autoVerifyContracts() {
    if (!process.env.BSCSCAN_API_KEY) {
      this.log('\n跳過自動驗證（未設置 BSCSCAN_API_KEY）', 'warning');
      return;
    }
    
    this.log('\n開始自動驗證合約...', 'info');
    
    // 等待 3 秒讓 BSCScan 索引
    this.log('等待 3 秒讓 BSCScan 索引...', 'info');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    for (const data of this.verificationData) {
      try {
        this.log(`\n驗證 ${data.name}...`, 'info');
        await hre.run("verify:verify", {
          address: data.address,
          constructorArguments: data.constructorArgs,
        });
        this.log(`✅ ${data.name} 驗證成功`, 'success');
      } catch (error) {
        if (error.message.includes("already verified")) {
          this.log(`⚠️ ${data.name} 已經驗證過`, 'warning');
        } else {
          this.log(`❌ ${data.name} 驗證失敗: ${error.message}`, 'error');
        }
      }
    }
  }

  async generateVRFDeploymentReport() {
    const reportPath = path.join(__dirname, '../deployments', `v26-vrf-deployment-report-${Date.now()}.md`);
    
    let report = `# V26 VRF 部署報告

生成時間: ${new Date().toLocaleString()}

## 部署概況

- **版本**: V26 - 統一 VRF 版本
- **網路**: BSC Mainnet
- **部署者**: ${this.deployer.address}
- **起始區塊**: ${this.startBlock}
- **錯誤數量**: ${this.errors.length}

## VRF 配置

- **VRF Wrapper**: \`${this.vrfConfig.wrapperAddress}\`
- **LINK Token**: \`${this.vrfConfig.linkToken}\`
- **VRF Coordinator**: \`${this.vrfConfig.coordinatorAddress}\`
- **確認數**: ${this.vrfConfig.requestConfirmations}
- **Gas Limit**: ${this.vrfConfig.callbackGasLimit}
- **使用原生支付**: ${this.vrfConfig.useNativePayment}

## 統一稀有度配置

- **1星**: ${UNIFIED_RARITY_CONFIG.rarity1Chance}%
- **2星**: ${UNIFIED_RARITY_CONFIG.rarity2Chance}%
- **3星**: ${UNIFIED_RARITY_CONFIG.rarity3Chance}%
- **4星**: ${UNIFIED_RARITY_CONFIG.rarity4Chance}%
- **5星**: ${UNIFIED_RARITY_CONFIG.rarity5Chance}%

## 合約地址

| 合約 | 地址 | 類型 |
|------|------|------|
`;

    for (const [name, data] of Object.entries(this.contracts)) {
      const type = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'].includes(name) ? '🔮 VRF 合約' : '📦 標準合約';
      const status = data.contract ? '✅ 已部署' : '📌 使用現有';
      report += `| ${name} | \`${data.address}\` | ${type} ${status} |\n`;
    }

    report += `

## VRF 特色

### 🔮 完全統一的隨機性
- 所有鑄造操作都使用 Chainlink VRF v2.5
- 1個 NFT 和 50個 NFT 使用相同的稀有度機率
- 消除了偽隨機數的安全風險

### 💰 Direct Funding 模式
- 用戶直接用 BNB 支付 VRF 費用
- 無需預先購買或管理 LINK 代幣
- 每次操作約 $0.6-1.0 VRF 費用

### ⚡ 優化的用戶體驗
- 預計等待時間：10-30 秒（BSC 主網）
- 提供請求狀態追蹤
- 支援過期請求取消機制

## 地城配置
`;

    for (const dungeon of GAME_PARAMS.dungeons) {
      report += `- ${dungeon.id}. ${dungeon.name}: ${dungeon.requiredPower} 力量, $${dungeon.rewardUSD} 獎勵, ${dungeon.successRate}% 成功率\n`;
    }

    if (this.errors.length > 0) {
      report += `

## 錯誤報告
`;
      for (const error of this.errors) {
        report += `- **${error.type || '未知錯誤'}**: ${error.error?.message || error.message || '未知錯誤信息'}\n`;
      }
    }

    report += `

## 下一步行動

1. 執行合約驗證: \`npx hardhat run scripts/active/v26-verify-contracts-vrf.js --network bsc\`
2. 同步配置到各項目: \`node scripts/active/v26-sync-all-vrf.js\`
3. 更新前端使用 VRF 合約 ABI
4. 更新子圖索引 VRF 事件
5. 測試 VRF 功能：鑄造、升級、探索

## 重要提醒

⚠️ **這是重大架構升級**
- 所有隨機性操作改為異步 (10-30秒等待)
- 用戶成本增加 (每次操作多 $0.6-1.0)
- 稀有度機制完全改變 (統一機率)
- 需要更新前端和子圖

## VRF 成本估算 (BSC 主網)

- **鑄造 1個 NFT**: ~$2.6 (VRF $0.6 + 其他 $2.0)
- **鑄造 10個 NFT**: ~$20.6 (VRF $0.6 + 其他 $20.0)
- **升級 NFT**: ~$0.65 (VRF $0.6 + Gas $0.05)
- **地城探索**: ~$0.62 (VRF $0.6 + Gas $0.02)

## 重要地址

- **DungeonCore**: \`${this.contracts.DUNGEONCORE?.address}\`
- **Hero_UnifiedVRF**: \`${this.contracts.HERO?.address}\`
- **Relic_UnifiedVRF**: \`${this.contracts.RELIC?.address}\`
- **SoulShard**: \`${this.contracts.SOULSHARD?.address}\`
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    this.log(`\n✅ VRF 部署報告已生成: ${reportPath}`, 'success');
  }

  async generateErrorReport() {
    if (this.errors.length === 0) return;
    
    const errorPath = path.join(__dirname, '../deployments', `v26-vrf-error-report-${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(errorPath), { recursive: true });
    fs.writeFileSync(errorPath, JSON.stringify({
      version: 'V26-VRF',
      timestamp: new Date().toISOString(),
      errors: this.errors,
      deploymentLog: this.deploymentLog
    }, null, 2));
    
    this.log(`\n❌ 錯誤報告已生成: ${errorPath}`, 'error');
  }

  async runVRFSyncScript() {
    this.log('\n執行 VRF 配置同步...', 'info');
    
    try {
      const { execSync } = require('child_process');
      const syncScriptPath = path.join(__dirname, 'v26-sync-all-vrf.js');
      
      if (!fs.existsSync(syncScriptPath)) {
        this.log('⚠️ 找不到 VRF 同步腳本，跳過自動同步', 'warning');
        this.log('請手動執行: node scripts/active/v26-sync-all-vrf.js', 'warning');
        return;
      }
      
      execSync(`node ${syncScriptPath}`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });
      
      this.log('✅ VRF 配置同步完成', 'success');
      
    } catch (error) {
      this.log(`⚠️ 自動同步失敗: ${error.message}`, 'warning');
      this.log('請手動執行: node scripts/active/v26-sync-all-vrf.js', 'warning');
    }
  }
}

// ======================== 執行部署 ========================

async function main() {
  const deployer = new V26VRFDeployer();
  await deployer.deploy();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
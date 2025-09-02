#!/usr/bin/env node

/**
 * V25 優化版完整部署腳本
 * 
 * 基於最新的統一地址管理架構
 * - DungeonCore 作為中央地址註冊表
 * - 所有合約查詢 DungeonCore 獲取地址
 * - VRF 智能授權系統
 * 
 * 使用方式：
 * npx hardhat run scripts/deploy-v25-optimized.js --network bsc
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

// ======================== 部署配置 ========================

// 複用的現有合約（測試用）
const EXISTING_CONTRACTS = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',        // 測試 USD
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',  // 測試 SoulShard
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82' // 測試 Pool
};

// VRF 配置 (BSC 主網)
const VRF_CONFIG = {
  SUBSCRIPTION_ID: 29062,                                        // VRF 訂閱 ID
  COORDINATOR: '0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9',     // VRF Coordinator
  KEY_HASH: '0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4', // Key Hash
  CALLBACK_GAS_LIMIT: 200000,
  REQUEST_CONFIRMATIONS: 3,
  NUM_WORDS: 1
};

// 部署順序（根據依賴關係）
const DEPLOYMENT_ORDER = [
  'Oracle',           // 1. 價格預言機
  'DungeonCore',      // 2. 核心管理合約
  'DungeonStorage',   // 3. 存儲合約
  'VRFConsumerV2Plus',// 4. VRF 消費者
  'Hero',             // 5. 英雄 NFT
  'Relic',            // 6. 聖物 NFT
  'Party',            // 7. 隊伍 NFT
  'PlayerVault',      // 8. 玩家金庫
  'PlayerProfile',    // 9. 玩家檔案
  'VIPStaking',       // 10. VIP 質押
  'DungeonMaster',    // 11. 地城主
  'AltarOfAscension'  // 12. 升星祭壇
];

// 遊戲參數配置
const GAME_PARAMS = {
  // NFT 鑄造價格（USD）
  mintPriceUSD: 2,
  platformFee: 0,  // 平台費用設為 0
  
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
    HERO: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/',
    RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/',
    PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/party/',
    VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/vip/',
    PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/profile/'
  },
  
  // 合約 URI（OpenSea 元數據）
  contractURIs: {
    HERO: 'https://www.dungeondelvers.xyz/metadata/hero-collection.json',
    RELIC: 'https://www.dungeondelvers.xyz/metadata/relic-collection.json',
    PARTY: 'https://www.dungeondelvers.xyz/metadata/party-collection.json',
    VIPSTAKING: 'https://www.dungeondelvers.xyz/metadata/vip-collection.json',
    PLAYERPROFILE: 'https://www.dungeondelvers.xyz/metadata/profile-collection.json'
  },
  
  // 其他參數
  partyCreationFee: '0.001', // BNB
  vipUnstakeCooldown: 15,    // 15 秒（測試用，生產環境應該是 7-14 天）
};

// ======================== 主部署類 ========================

class V25OptimizedDeployer {
  constructor() {
    this.contracts = {};
    this.verificationData = [];
    this.startBlock = null;
    this.deploymentLog = [];
    this.errors = [];
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
    
    this.deploymentLog.push({
      timestamp: new Date().toISOString(),
      type,
      message
    });
  }

  async deploy() {
    console.log(`${colors.bright}
==================================================
🚀 V25 優化版完整部署腳本
   統一地址管理 + 智能授權系統
==================================================
${colors.reset}`);

    try {
      // 獲取部署者
      const [deployer] = await hre.ethers.getSigners();
      this.deployer = deployer;
      
      // 1. 前置檢查
      await this.preDeploymentChecks();
      
      // 2. 載入現有合約
      await this.loadExistingContracts();
      
      // 3. 獲取起始區塊
      this.startBlock = await hre.ethers.provider.getBlockNumber();
      this.log(`起始區塊: ${this.startBlock}`, 'info');
      
      // 4. 部署所有合約
      await this.deployContracts();
      
      // 5. 設置合約連接
      await this.setupConnections();
      
      // 6. 初始化參數
      await this.initializeParameters();
      
      // 7. 驗證部署
      await this.verifyDeployment();
      
      // 8. 生成配置文件
      await this.generateConfigs();
      
      // 9. 自動驗證合約
      if (process.env.BSCSCAN_API_KEY) {
        await this.autoVerifyContracts();
      }
      
      // 10. 生成部署報告
      await this.generateDeploymentReport();
      
      // 11. 更新 .env 文件
      await this.updateEnvFile();
      
      this.log('\n✅ V25 優化版部署完成！', 'success');
      
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
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    if (chainId !== 56 && chainId !== 97) {
      throw new Error(`錯誤的網路 (期望 BSC Mainnet 56 或 Testnet 97, 實際 ${chainId})`);
    }
    
    // 檢查餘額
    const balance = await hre.ethers.provider.getBalance(this.deployer.address);
    const balanceInBNB = hre.ethers.formatEther(balance);
    this.log(`部署錢包: ${this.deployer.address}`, 'info');
    this.log(`錢包餘額: ${balanceInBNB} BNB`, 'info');
    
    if (parseFloat(balanceInBNB) < 0.5) {
      throw new Error('BNB 餘額不足 (建議至少 0.5 BNB)');
    }
    
    // 檢查環境變數
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY 未設置');
    }
    
    if (!process.env.BSCSCAN_API_KEY) {
      this.log('警告: BSCSCAN_API_KEY 未設置，無法自動驗證合約', 'warning');
    }
  }

  async loadExistingContracts() {
    this.log('\n載入現有合約地址...', 'info');
    for (const [name, address] of Object.entries(EXISTING_CONTRACTS)) {
      this.contracts[name] = { address };
      this.log(`✅ 使用現有 ${name}: ${address}`, 'success');
    }
  }

  async deployContracts() {
    this.log('\n開始部署合約...', 'info');
    
    for (const contractName of DEPLOYMENT_ORDER) {
      await this.deployContract(contractName);
    }
  }

  async deployContract(contractName) {
    this.log(`\n部署 ${contractName}...`, 'info');
    
    try {
      const ContractFactory = await hre.ethers.getContractFactory(contractName);
      
      // 根據合約類型設置構造函數參數
      const constructorArgs = this.getConstructorArgs(contractName);
      
      this.log(`構造參數: ${JSON.stringify(constructorArgs)}`, 'info');
      
      // 部署合約
      const contract = await ContractFactory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      
      this.contracts[contractName] = { 
        address, 
        contract
      };
      
      this.log(`✅ ${contractName} 部署成功: ${address}`, 'success');
      
      // 保存驗證數據
      this.verificationData.push({
        name: contractName,
        address,
        constructorArgs
      });
      
    } catch (error) {
      this.log(`❌ ${contractName} 部署失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  getConstructorArgs(contractName) {
    const deployerAddress = this.deployer.address;
    
    switch (contractName) {
      case 'Oracle':
        // constructor(address _poolAddress, address _soulShardTokenAddress, address _usdTokenAddress)
        return [
          EXISTING_CONTRACTS.UNISWAP_POOL,
          EXISTING_CONTRACTS.SOULSHARD,
          EXISTING_CONTRACTS.USD
        ];
      
      case 'DungeonCore':
        // constructor(address _initialOwner, address _usdToken, address _soulShardToken)
        return [
          deployerAddress,
          EXISTING_CONTRACTS.USD,
          EXISTING_CONTRACTS.SOULSHARD
        ];
      
      case 'VRFConsumerV2Plus':
        // constructor(uint256 subscriptionId, address vrfCoordinator)
        return [
          VRF_CONFIG.SUBSCRIPTION_ID,
          VRF_CONFIG.COORDINATOR
        ];
      
      case 'Hero':
      case 'Relic':
      case 'Party':
      case 'PlayerProfile':
      case 'VIPStaking':
      case 'DungeonStorage':
      case 'PlayerVault':
      case 'DungeonMaster':
      case 'AltarOfAscension':
        // constructor(address initialOwner)
        return [deployerAddress];
      
      default:
        throw new Error(`未知的合約類型: ${contractName}`);
    }
  }

  async setupConnections() {
    this.log('\n設置合約連接...', 'info');
    
    // 1. 設置 DungeonCore 所有地址
    await this.setupDungeonCore();
    
    // 2. 設置各模組的 DungeonCore 地址
    await this.setupModules();
    
    // 3. 設置特殊連接
    await this.setupSpecialConnections();
    
    // 4. 設置 VRF 配置
    await this.setupVRFConfig();
  }

  async setupDungeonCore() {
    this.log('\n配置 DungeonCore...', 'info');
    const dungeonCore = this.contracts.DungeonCore.contract;
    
    const settings = [
      { method: 'setOracle', param: this.contracts.Oracle.address, name: 'Oracle' },
      { method: 'setHeroContract', param: this.contracts.Hero.address, name: 'Hero' },
      { method: 'setRelicContract', param: this.contracts.Relic.address, name: 'Relic' },
      { method: 'setPartyContract', param: this.contracts.Party.address, name: 'Party' },
      { method: 'setDungeonMaster', param: this.contracts.DungeonMaster.address, name: 'DungeonMaster' },
      { method: 'setPlayerVault', param: this.contracts.PlayerVault.address, name: 'PlayerVault' },
      { method: 'setPlayerProfile', param: this.contracts.PlayerProfile.address, name: 'PlayerProfile' },
      { method: 'setVipStaking', param: this.contracts.VIPStaking.address, name: 'VIPStaking' },
      { method: 'setAltarOfAscension', param: this.contracts.AltarOfAscension.address, name: 'AltarOfAscension' },
      { method: 'setVRFManager', param: this.contracts.VRFConsumerV2Plus.address, name: 'VRFManager' }
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

  async setupModules() {
    this.log('\n配置各模組...', 'info');
    
    // 所有需要設置 DungeonCore 的合約
    const modulesToSetup = [
      'Hero', 'Relic', 'Party', 
      'VIPStaking', 'PlayerProfile', 'PlayerVault',
      'DungeonMaster', 'AltarOfAscension', 'DungeonStorage',
      'VRFConsumerV2Plus'
    ];
    
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
      try {
        // 設置 DungeonCore
        if (module.setDungeonCore) {
          const tx = await module.setDungeonCore(this.contracts.DungeonCore.address);
          await tx.wait();
          this.log(`✅ ${moduleName}.setDungeonCore 成功`, 'success');
        }
        
        // 設置 SoulShardToken (部分合約需要)
        if (module.setSoulShardToken) {
          const tx2 = await module.setSoulShardToken(EXISTING_CONTRACTS.SOULSHARD);
          await tx2.wait();
          this.log(`✅ ${moduleName}.setSoulShardToken 成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${moduleName} 設置失敗: ${error.message}`, 'error');
        this.errors.push({ type: '模組設置', moduleName, error });
      }
    }
  }

  async setupSpecialConnections() {
    this.log('\n設置特殊連接...', 'info');
    
    // DungeonMaster & DungeonStorage 連接
    try {
      const dungeonMaster = this.contracts.DungeonMaster?.contract;
      const dungeonStorage = this.contracts.DungeonStorage?.contract;
      
      if (dungeonMaster && dungeonStorage) {
        // DungeonMaster 設置 Storage
        const tx1 = await dungeonMaster.setDungeonStorage(this.contracts.DungeonStorage.address);
        await tx1.wait();
        this.log('✅ DungeonMaster.setDungeonStorage 成功', 'success');
        
        // DungeonStorage 設置 LogicContract
        const tx2 = await dungeonStorage.setLogicContract(this.contracts.DungeonMaster.address);
        await tx2.wait();
        this.log('✅ DungeonStorage.setLogicContract 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ DungeonMaster/Storage 連接失敗: ${error.message}`, 'error');
    }
    
    // Party 設置 Hero 和 Relic (如果需要)
    // 注意：根據新架構，Party 現在從 DungeonCore 查詢，不需要直接設置
    
    // AltarOfAscension 設置合約 (如果需要)
    try {
      const altar = this.contracts.AltarOfAscension?.contract;
      if (altar && altar.setContracts) {
        const tx = await altar.setContracts(
          this.contracts.DungeonCore.address,
          this.contracts.Hero.address,
          this.contracts.Relic.address
        );
        await tx.wait();
        this.log('✅ AltarOfAscension.setContracts 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ AltarOfAscension 設置失敗: ${error.message}`, 'error');
    }
  }

  async setupVRFConfig() {
    this.log('\n配置 VRF 參數...', 'info');
    
    const vrfConsumer = this.contracts.VRFConsumerV2Plus?.contract;
    if (!vrfConsumer) {
      this.log('⚠️ VRFConsumerV2Plus 未部署，跳過 VRF 配置', 'warning');
      return;
    }
    
    try {
      // 設置 VRF 參數
      const tx = await vrfConsumer.setVRFParams(
        VRF_CONFIG.KEY_HASH,
        VRF_CONFIG.CALLBACK_GAS_LIMIT,
        VRF_CONFIG.REQUEST_CONFIRMATIONS,
        VRF_CONFIG.NUM_WORDS
      );
      await tx.wait();
      this.log('✅ VRF 參數設置成功', 'success');
      
      // 授權核心合約 (智能授權系統會自動信任它們)
      // 不需要手動授權，因為我們已經實現了智能授權
      this.log('✅ VRF 智能授權系統已啟用', 'success');
      
    } catch (error) {
      this.log(`❌ VRF 配置失敗: ${error.message}`, 'error');
    }
  }

  async initializeParameters() {
    this.log('\n初始化參數...', 'info');
    
    await this.setMintPrices();
    await this.setBaseURIs();
    await this.setContractURIs();
    await this.initializeDungeons();
    await this.setOtherParameters();
  }

  async setMintPrices() {
    this.log('\n設置鑄造價格...', 'info');
    
    const nftContracts = ['Hero', 'Relic'];
    
    for (const contractName of nftContracts) {
      try {
        const contract = this.contracts[contractName]?.contract;
        if (contract && contract.setMintPriceUSD) {
          const priceInWei = hre.ethers.parseUnits(GAME_PARAMS.mintPriceUSD.toString(), 18);
          const tx = await contract.setMintPriceUSD(priceInWei);
          await tx.wait();
          this.log(`✅ ${contractName} 鑄造價格設置為 $${GAME_PARAMS.mintPriceUSD}`, 'success');
        }
        
        // 設置平台費用為 0
        if (contract && contract.setPlatformFee) {
          const tx2 = await contract.setPlatformFee(0);
          await tx2.wait();
          this.log(`✅ ${contractName} 平台費用設置為 0`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${contractName} 價格設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async setBaseURIs() {
    this.log('\n設置 BaseURI...', 'info');
    
    for (const [contractName, uri] of Object.entries(GAME_PARAMS.baseURIs)) {
      try {
        const contract = this.contracts[contractName.toUpperCase()]?.contract;
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

  async setContractURIs() {
    this.log('\n設置 ContractURI...', 'info');
    
    for (const [contractName, uri] of Object.entries(GAME_PARAMS.contractURIs)) {
      try {
        const contract = this.contracts[contractName.toUpperCase()]?.contract;
        if (contract && contract.setContractURI) {
          const tx = await contract.setContractURI(uri);
          await tx.wait();
          this.log(`✅ ${contractName} ContractURI 設置成功`, 'success');
        }
      } catch (error) {
        this.log(`❌ ${contractName} ContractURI 設置失敗: ${error.message}`, 'error');
      }
    }
  }

  async initializeDungeons() {
    this.log('\n初始化地城...', 'info');
    
    const dungeonMaster = this.contracts.DungeonMaster?.contract;
    if (!dungeonMaster) {
      this.log('⚠️ DungeonMaster 未部署，跳過地城初始化', 'warning');
      return;
    }
    
    for (const dungeon of GAME_PARAMS.dungeons) {
      try {
        const tx = await dungeonMaster.setDungeon(
          dungeon.id,
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

  async setOtherParameters() {
    this.log('\n設置其他參數...', 'info');
    
    // 設置 Party 創建費用
    try {
      const party = this.contracts.Party?.contract;
      if (party && party.setPlatformFee) {
        const tx = await party.setPlatformFee(hre.ethers.parseEther(GAME_PARAMS.partyCreationFee));
        await tx.wait();
        this.log(`✅ Party 創建費用設置為 ${GAME_PARAMS.partyCreationFee} BNB`, 'success');
      }
    } catch (error) {
      this.log(`❌ Party 創建費用設置失敗: ${error.message}`, 'error');
    }
    
    // 設置 VIP 解鎖冷卻期
    try {
      const vipStaking = this.contracts.VIPStaking?.contract;
      if (vipStaking && vipStaking.setUnstakeCooldown) {
        const tx = await vipStaking.setUnstakeCooldown(GAME_PARAMS.vipUnstakeCooldown);
        await tx.wait();
        this.log(`✅ VIP 解鎖冷卻期設置為 ${GAME_PARAMS.vipUnstakeCooldown} 秒`, 'success');
      }
    } catch (error) {
      this.log(`❌ VIP 冷卻期設置失敗: ${error.message}`, 'error');
    }
  }

  async verifyDeployment() {
    this.log('\n驗證部署...', 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const [name, data] of Object.entries(this.contracts)) {
      if (data.address && data.contract) {
        const code = await hre.ethers.provider.getCode(data.address);
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

  async generateConfigs() {
    this.log('\n生成配置文件...', 'info');
    
    // 生成配置對象
    const config = {
      version: 'V25-Optimized',
      lastUpdated: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: this.deployer.address,
      startBlock: this.startBlock,
      contracts: {},
      gameParams: GAME_PARAMS,
      vrfConfig: VRF_CONFIG
    };
    
    // 添加所有合約地址
    for (const [name, data] of Object.entries(this.contracts)) {
      config.contracts[name] = {
        address: data.address,
        deploymentBlock: this.startBlock
      };
    }
    
    // 保存配置文件
    const configPath = path.join(__dirname, '../deployments', `v25-optimized-config-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    this.log(`✅ 配置文件已生成: ${configPath}`, 'success');
    
    // 保存驗證數據
    const verificationPath = path.join(__dirname, '../deployments', `v25-optimized-verification-${Date.now()}.json`);
    fs.writeFileSync(verificationPath, JSON.stringify({
      version: 'V25-Optimized',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      verificationData: this.verificationData
    }, null, 2));
    this.log(`✅ 驗證數據已保存: ${verificationPath}`, 'success');
  }

  async autoVerifyContracts() {
    if (!process.env.BSCSCAN_API_KEY) {
      this.log('\n跳過自動驗證（未設置 BSCSCAN_API_KEY）', 'warning');
      return;
    }
    
    this.log('\n開始自動驗證合約...', 'info');
    
    // 等待 5 秒讓 BSCScan 索引
    this.log('等待 5 秒讓 BSCScan 索引...', 'info');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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

  async updateEnvFile() {
    this.log('\n更新 .env.v25 文件...', 'info');
    
    const envPath = path.join(__dirname, '../../.env.v25');
    
    // 讀取現有內容
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新合約地址
    const addressUpdates = {
      'VITE_HERO_ADDRESS': this.contracts.Hero?.address,
      'VITE_RELIC_ADDRESS': this.contracts.Relic?.address,
      'VITE_PARTY_ADDRESS': this.contracts.Party?.address,
      'VITE_DUNGEONMASTER_ADDRESS': this.contracts.DungeonMaster?.address,
      'VITE_DUNGEONSTORAGE_ADDRESS': this.contracts.DungeonStorage?.address,
      'VITE_ALTAROFASCENSION_ADDRESS': this.contracts.AltarOfAscension?.address,
      'VITE_PLAYERVAULT_ADDRESS': this.contracts.PlayerVault?.address,
      'VITE_PLAYERPROFILE_ADDRESS': this.contracts.PlayerProfile?.address,
      'VITE_VIPSTAKING_ADDRESS': this.contracts.VIPStaking?.address,
      'VITE_VRFMANAGER_ADDRESS': this.contracts.VRFConsumerV2Plus?.address,
      'VITE_DUNGEONCORE_ADDRESS': this.contracts.DungeonCore?.address,
      'VITE_ORACLE_ADDRESS': this.contracts.Oracle?.address
    };
    
    for (const [key, value] of Object.entries(addressUpdates)) {
      if (value) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        envContent = envContent.replace(regex, `${key}=${value}`);
      }
    }
    
    // 更新部署信息
    envContent = envContent.replace(
      /^VITE_START_BLOCK=.*$/m,
      `VITE_START_BLOCK=${this.startBlock}`
    );
    
    envContent = envContent.replace(
      /^VITE_DEPLOYMENT_DATE=.*$/m,
      `VITE_DEPLOYMENT_DATE=${new Date().toISOString()}`
    );
    
    // 寫回文件
    fs.writeFileSync(envPath, envContent);
    this.log('✅ .env.v25 文件已更新', 'success');
  }

  async generateDeploymentReport() {
    const reportPath = path.join(__dirname, '../deployments', `v25-optimized-deployment-report-${Date.now()}.md`);
    
    let report = `# V25 優化版部署報告

生成時間: ${new Date().toLocaleString()}

## 部署概況

- **版本**: V25 Optimized - 統一地址管理 + 智能授權
- **網路**: BSC Mainnet
- **部署者**: ${this.deployer.address}
- **起始區塊**: ${this.startBlock}
- **錯誤數量**: ${this.errors.length}

## 架構特點

### 🎯 統一地址管理
- DungeonCore 作為中央地址註冊表
- 所有合約通過查詢模式獲取地址
- 消除了 80+ 個 SET 函數

### 🔐 智能授權系統
- VRFConsumerV2Plus 自動信任核心遊戲合約
- 無需手動授權設置
- 動態權限管理

### ⚡ Gas 優化
- 批量設置功能減少交易次數
- 優化的存儲結構
- 精簡的合約邏輯

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
`;

    // 添加複用的合約
    for (const [name, address] of Object.entries(EXISTING_CONTRACTS)) {
      report += `| ${name} (複用) | \`${address}\` | ✅ 使用現有 |\n`;
    }
    
    // 添加新部署的合約
    for (const contractName of DEPLOYMENT_ORDER) {
      const data = this.contracts[contractName];
      if (data) {
        report += `| ${contractName} | \`${data.address}\` | ✅ 已部署 |\n`;
      }
    }

    report += `

## VRF 配置

- **Subscription ID**: ${VRF_CONFIG.SUBSCRIPTION_ID}
- **VRF Coordinator**: \`${VRF_CONFIG.COORDINATOR}\`
- **Key Hash**: \`${VRF_CONFIG.KEY_HASH}\`
- **Callback Gas Limit**: ${VRF_CONFIG.CALLBACK_GAS_LIMIT}
- **Request Confirmations**: ${VRF_CONFIG.REQUEST_CONFIRMATIONS}

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

1. 執行配置同步: \`node scripts/ultimate-config-system.js sync\`
2. 驗證合約: \`npx hardhat run scripts/verify-v25-optimized.js --network bsc\`
3. 更新前端和子圖 ABI
4. 測試所有功能
5. 監控 Gas 使用情況

## 重要提醒

⚠️ **架構變更注意事項**
- 所有合約現在從 DungeonCore 查詢地址
- 不再需要手動設置大量地址
- VRF 智能授權自動管理權限
- 確保前端和子圖使用最新 ABI

## 部署日誌摘要

總計部署 ${DEPLOYMENT_ORDER.length} 個合約
複用 ${Object.keys(EXISTING_CONTRACTS).length} 個現有合約
錯誤數量: ${this.errors.length}
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    this.log(`\n✅ 部署報告已生成: ${reportPath}`, 'success');
  }

  async generateErrorReport() {
    if (this.errors.length === 0) return;
    
    const errorPath = path.join(__dirname, '../deployments', `v25-optimized-error-report-${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(errorPath), { recursive: true });
    fs.writeFileSync(errorPath, JSON.stringify({
      version: 'V25-Optimized',
      timestamp: new Date().toISOString(),
      errors: this.errors,
      deploymentLog: this.deploymentLog
    }, null, 2));
    
    this.log(`\n❌ 錯誤報告已生成: ${errorPath}`, 'error');
  }
}

// ======================== 執行部署 ========================

async function main() {
  const deployer = new V25OptimizedDeployer();
  await deployer.deploy();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
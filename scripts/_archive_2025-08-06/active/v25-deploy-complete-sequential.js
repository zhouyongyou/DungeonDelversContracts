#!/usr/bin/env node

/**
 * V25 完整部署腳本 - 順序執行版本
 * 
 * 修復所有並行交易問題，確保所有交易順序執行
 * 
 * 使用方式：
 * npx hardhat run scripts/active/v25-deploy-complete-sequential.js --network bsc
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

// ======================== 配置區域 ========================

// 部署配置
const DEPLOYMENT_CONFIG = {
  // 是否部署新的 Token 合約（生產環境通常設為 false）
  deployNewTokens: false,  // 設為 true 會部署新的 SoulShard
  
  // 現有合約地址（如果不部署新的）
  existingContracts: {
    SOULSHARD: process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    // ORACLE: 現在總是重新部署
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
    deployMarketplace: false, // 是否部署市場合約（可選）
    generateDocs: true,      // 生成部署文檔
  }
};

// 合約部署順序（依賴關係）
const DEPLOYMENT_ORDER = [
  // 代幣合約
  ...(DEPLOYMENT_CONFIG.deployNewTokens ? ['Test_SoulShard'] : []),
  'Oracle_V22_Adaptive', // Oracle 現在總是重新部署
  
  // 核心合約
  'PlayerVault',
  'DungeonCore',
  'DungeonStorage',
  'DungeonMasterV2_Fixed',
  
  // NFT 合約
  'Hero',
  'Relic',
  'PartyV3',
  
  // 功能合約
  'VIPStaking',
  'PlayerProfile',
  'AltarOfAscensionV2Fixed'
];

// 合約名稱映射
const CONTRACT_NAME_MAP = {
  'Oracle_V22_Adaptive': 'ORACLE',
  'Test_SoulShard': 'SOULSHARD',
  'PlayerVault': 'PLAYERVAULT',
  'DungeonCore': 'DUNGEONCORE',
  'DungeonStorage': 'DUNGEONSTORAGE',
  'DungeonMasterV2_Fixed': 'DUNGEONMASTER',
  'Hero': 'HERO',
  'Relic': 'RELIC',
  'PartyV3': 'PARTY',
  'VIPStaking': 'VIPSTAKING',
  'PlayerProfile': 'PLAYERPROFILE',
  'AltarOfAscensionV2Fixed': 'ALTAROFASCENSION'
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
    // 高階地城 - 為頂級玩家提供豐厚獎勵
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
  // vipUnstakeCooldown: 15, // 15 秒（測試環境）
};

// ======================== 主部署類 ========================

class V25Deployer {
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
🚀 V25 完整部署腳本 - 順序執行版本
==================================================
${colors.reset}`);

    try {
      // 創建原生 ethers provider 和 wallet
      const provider = new ethers.JsonRpcProvider(
        process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
      );
      
      // 使用原生 ethers Wallet
      this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      this.provider = provider;
      
      // 1. 前置檢查
      await this.preDeploymentChecks();
      
      // 2. 載入現有合約（如果有）
      await this.loadExistingContracts();
      
      // 3. 獲取起始區塊
      this.startBlock = await this.provider.getBlockNumber();
      this.log(`起始區塊: ${this.startBlock}`, 'info');
      
      // 4. 部署合約
      await this.deployContracts();
      
      // 5. 設置合約連接
      if (DEPLOYMENT_CONFIG.options.setupConnections) {
        await this.setupConnections();
      }
      
      // 6. 初始化參數
      if (DEPLOYMENT_CONFIG.options.initializeParams) {
        await this.initializeParameters();
      }
      
      // 7. 生成配置文件
      await this.generateConfigs();
      
      // 8. 驗證部署
      await this.verifyDeployment();
      
      // 9. 部署市場合約（可選）
      if (DEPLOYMENT_CONFIG.options.deployMarketplace) {
        await this.deployMarketplace();
      }
      
      // 10. 自動驗證合約（如果啟用）
      if (DEPLOYMENT_CONFIG.options.autoVerify) {
        await this.autoVerifyContracts();
      }
      
      // 11. 生成部署報告
      await this.generateDeploymentReport();
      
      // 12. 自動執行同步腳本
      await this.runSyncScript();
      
      this.log('\n✅ V25 部署完成！', 'success');
      
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

  async loadExistingContracts() {
    if (!DEPLOYMENT_CONFIG.deployNewTokens) {
      this.log('\n載入現有合約地址...', 'info');
      for (const [name, address] of Object.entries(DEPLOYMENT_CONFIG.existingContracts)) {
        this.contracts[name] = { address };
        this.log(`✅ 使用現有 ${name}: ${address}`, 'success');
      }
    }
  }

  async deployContracts() {
    this.log('\n開始部署合約...', 'info');
    
    for (const contractName of DEPLOYMENT_ORDER) {
      await this.deployContract(contractName);
    }
  }

  async deployContract(contractName) {
    const mappedName = CONTRACT_NAME_MAP[contractName];
    this.log(`\n部署 ${mappedName} (${contractName})...`, 'info');
    
    try {
      const ContractFactory = await hre.ethers.getContractFactory(contractName);
      
      // 根據合約類型設置構造函數參數
      const constructorArgs = this.getConstructorArgs(contractName);
      
      // 確保參數是陣列
      const args = Array.isArray(constructorArgs) ? constructorArgs : [constructorArgs];
      this.log(`構造參數: ${JSON.stringify(args)}`, 'info');
      
      // 使用原生 ethers.js 方式部署，完全避開 hardhat-ethers 的 bug
      let contract;
      let address;
      
      try {
        // 獲取合約的 bytecode 和 ABI
        const artifact = await hre.artifacts.readArtifact(contractName);
        
        // 創建原生 ethers.js 的 ContractFactory（不使用 hre.ethers）
        const factory = new ethers.ContractFactory(
          artifact.abi,
          artifact.bytecode,
          this.deployer
        );
        
        // 部署合約
        this.log('發送部署交易...', 'info');
        contract = await factory.deploy(...args);
        
        // 等待部署完成
        this.log(`交易 hash: ${contract.deploymentTransaction().hash}`, 'info');
        await contract.waitForDeployment();
        
        // 獲取地址
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

  getConstructorArgs(contractName) {
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
      
      default:
        return [this.deployer.address];
    }
  }

  async setupConnections() {
    this.log('\n設置合約連接...', 'info');
    
    // 順序執行以避免 nonce 衝突
    await this.setupDungeonCore();
    await this.setupSpecialConnections();
    await this.setupModules();
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
    
    // 順序處理以避免 nonce 衝突
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
    
    const modulesToSetup = [
      'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
      'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
    ];
    
    // 關鍵模組列表 - 這些模組設置失敗會導致系統無法正常工作
    const criticalModules = ['PLAYERPROFILE', 'DUNGEONMASTER', 'PLAYERVAULT'];
    
    // 追蹤設置結果
    const setupResults = [];
    
    // 順序處理以避免 nonce 衝突
    for (const moduleName of modulesToSetup) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
      // 檢查是否有 setDungeonCore 方法
      if (module.setDungeonCore) {
        const result = await this.setDungeonCoreWithRetry(moduleName, module, this.contracts.DUNGEONCORE.address);
        setupResults.push(result);
        
        // 對關鍵模組，設置失敗應該停止部署
        if (!result.success && criticalModules.includes(moduleName)) {
          throw new Error(`關鍵模組 ${moduleName} 設置失敗: ${result.error}`);
        }
      }
    }
    
    // 儲存結果供後續報告使用
    this.moduleSetupResults = setupResults;
  }

  async setDungeonCoreWithRetry(moduleName, contract, dungeonCoreAddress, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`${moduleName}: 嘗試 ${attempt}/${maxRetries} 設置 setDungeonCore...`, 'info');
        
        // 獲取最新的 nonce 避免衝突
        const nonce = await this.provider.getTransactionCount(this.deployer.address, 'pending');
        
        // 設置 gas 參數
        const gasPrice = await this.provider.getGasPrice();
        const adjustedGasPrice = gasPrice * 11n / 10n; // 增加 10% gas price
        
        const tx = await contract.setDungeonCore(dungeonCoreAddress, {
          nonce: nonce,
          gasPrice: adjustedGasPrice,
          gasLimit: 100000
        });
        
        await tx.wait();
        
        // 立即驗證設置是否成功
        const verifyResult = await this.verifyDungeonCoreSetting(moduleName, contract, dungeonCoreAddress);
        
        if (verifyResult.success) {
          this.log(`✅ ${moduleName}.setDungeonCore 成功並驗證`, 'success');
          return {
            module: moduleName,
            method: 'setDungeonCore',
            success: true,
            attempt: attempt,
            ...verifyResult
          };
        } else {
          this.log(`❌ ${moduleName}.setDungeonCore 設置但驗證失敗`, 'error');
          this.errors.push({ type: '依賴驗證失敗', module: moduleName, method: 'setDungeonCore' });
          return {
            module: moduleName,
            method: 'setDungeonCore',
            success: false,
            error: '設置成功但驗證失敗',
            attempt: attempt,
            ...verifyResult
          };
        }
        
      } catch (error) {
        this.log(`${moduleName} 嘗試 ${attempt} 失敗: ${error.message}`, 'error');
        
        // 檢查是否為 nonce 相關錯誤
        if (error.message.includes('nonce') || error.message.includes('NONCE_EXPIRED')) {
          this.log(`${moduleName}: 檢測到 nonce 錯誤，等待 5 秒後重試...`, 'warning');
          await this.delay(5000);
        } else if (attempt < maxRetries) {
          this.log(`${moduleName}: 其他錯誤，等待 3 秒後重試...`, 'warning');
          await this.delay(3000);
        }
        
        // 如果是最後一次嘗試，記錄最終失敗
        if (attempt === maxRetries) {
          this.log(`❌ ${moduleName}.setDungeonCore 所有重試都失敗`, 'error');
          this.errors.push({ type: '模組設置失敗', module: moduleName, error });
          return {
            module: moduleName,
            method: 'setDungeonCore',
            success: false,
            error: error.message,
            finalAttempt: attempt
          };
        }
      }
    }
  }

  async verifyDungeonCoreSetting(moduleName, contract, expectedAddress) {
    try {
      // 確定驗證方法名稱
      let verifyMethod = 'dungeonCore';
      if (moduleName === 'PARTY') {
        verifyMethod = 'dungeonCoreContract';
      } else if (['HERO', 'RELIC'].includes(moduleName)) {
        verifyMethod = 'dungeonCore';
      }
      
      let actualValue;
      try {
        actualValue = await contract[verifyMethod]();
      } catch (e) {
        // 如果方法不存在，跳過驗證
        this.log(`⚠️ ${moduleName} 沒有 ${verifyMethod} getter 方法，跳過驗證`, 'warning');
        return { success: true, skipped: true, reason: 'No getter method' };
      }
      
      const success = actualValue.toLowerCase() === expectedAddress.toLowerCase();
      
      return {
        success,
        expected: expectedAddress,
        actual: actualValue,
        verifyMethod
      };
      
    } catch (verifyError) {
      this.log(`⚠️ ${moduleName} 驗證過程出錯: ${verifyError.message}`, 'warning');
      return {
        success: false,
        verifyError: verifyError.message
      };
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setupSpecialConnections() {
    this.log('\n設置特殊連接...', 'info');
    
    const specialSetupResults = [];
    
    // 1. 設置 SoulShard token（包含所有需要的合約）
    const modulesNeedingSoulShard = ['HERO', 'RELIC', 'VIPSTAKING', 'PLAYERVAULT', 'DUNGEONMASTER'];
    
    for (const moduleName of modulesNeedingSoulShard) {
      const module = this.contracts[moduleName]?.contract;
      if (!module) continue;
      
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
    
    // 2. DungeonMaster & DungeonStorage 連接
    try {
      if (this.contracts.DUNGEONMASTER?.contract && this.contracts.DUNGEONSTORAGE?.contract) {
        // 設置 DungeonMaster 的 storage
        const tx1 = await this.contracts.DUNGEONMASTER.contract.setDungeonStorage(
          this.contracts.DUNGEONSTORAGE.address
        );
        await tx1.wait();
        this.log('✅ DungeonMaster.setDungeonStorage 成功', 'success');
        
        // 設置 DungeonStorage 的 logic contract
        const tx2 = await this.contracts.DUNGEONSTORAGE.contract.setLogicContract(
          this.contracts.DUNGEONMASTER.address
        );
        await tx2.wait();
        this.log('✅ DungeonStorage.setLogicContract 成功', 'success');
      }
    } catch (error) {
      this.log(`❌ DungeonMaster/Storage 連接失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'Storage連接', error });
    }
    
    // 3. 設置升星祭壇 (AltarOfAscension)
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
      this.errors.push({ type: '祭壇設置', error });
    }
    
    // 4. Hero & Relic 設置祭壇地址
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
        this.errors.push({ type: 'NFT祭壇設置', nftName, error });
      }
    }
    
    // 5. Party 設置 Hero 和 Relic 合約
    try {
      const party = this.contracts.PARTY?.contract;
      if (party) {
        if (party.setHeroContract) {
          const tx1 = await party.setHeroContract(this.contracts.HERO.address);
          await tx1.wait();
          this.log('✅ Party.setHeroContract 成功', 'success');
        }
        
        if (party.setRelicContract) {
          const tx2 = await party.setRelicContract(this.contracts.RELIC.address);
          await tx2.wait();
          this.log('✅ Party.setRelicContract 成功', 'success');
        }
      }
    } catch (error) {
      this.log(`❌ Party NFT 設置失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'Party設置', error });
    }
    
    // 6. PlayerProfile 設置 DungeonCore - 檢查後再設置，避免重複覆蓋
    try {
      const playerProfile = this.contracts.PLAYERPROFILE?.contract;
      if (playerProfile && playerProfile.setDungeonCore) {
        // 先檢查是否已正確設置
        let needsSetup = false;
        try {
          const currentDungeonCore = await playerProfile.dungeonCore();
          if (currentDungeonCore.toLowerCase() !== this.contracts.DUNGEONCORE.address.toLowerCase()) {
            needsSetup = true;
            this.log(`PlayerProfile DungeonCore 地址不正確: ${currentDungeonCore}`, 'warning');
          }
        } catch (error) {
          needsSetup = true; // 如果讀取失敗，假設需要設置
        }
        
        if (needsSetup) {
          this.log('設置 PlayerProfile.setDungeonCore...', 'info');
          const tx = await playerProfile.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log('✅ PlayerProfile.setDungeonCore 成功', 'success');
        } else {
          this.log('✅ PlayerProfile.setDungeonCore 已正確設置', 'success');
        }
      }
    } catch (error) {
      this.log(`❌ PlayerProfile.setDungeonCore 失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'PlayerProfile連接設置', error });
    }
    
    // 7. VIPStaking 設置 DungeonCore - 檢查後再設置，避免重複覆蓋
    try {
      const vipStaking = this.contracts.VIPSTAKING?.contract;
      if (vipStaking && vipStaking.setDungeonCore) {
        // 先檢查是否已正確設置
        let needsSetup = false;
        try {
          const currentDungeonCore = await vipStaking.dungeonCore();
          if (currentDungeonCore.toLowerCase() !== this.contracts.DUNGEONCORE.address.toLowerCase()) {
            needsSetup = true;
            this.log(`VIPStaking DungeonCore 地址不正確: ${currentDungeonCore}`, 'warning');
          }
        } catch (error) {
          needsSetup = true; // 如果讀取失敗，假設需要設置
        }
        
        if (needsSetup) {
          this.log('設置 VIPStaking.setDungeonCore...', 'info');
          const tx = await vipStaking.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log('✅ VIPStaking.setDungeonCore 成功', 'success');
        } else {
          this.log('✅ VIPStaking.setDungeonCore 已正確設置', 'success');
        }
      }
    } catch (error) {
      this.log(`❌ VIPStaking.setDungeonCore 失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'VIPStaking連接設置', error });
    }
    
    // 8. Party 設置 DungeonCore - 特殊處理因為 getter 可能會 revert
    try {
      const party = this.contracts.PARTY?.contract;
      if (party && party.setDungeonCore) {
        // Party 的 dungeonCoreContract() getter 在未初始化時會 revert
        // 所以直接設置，不嘗試讀取
        let needsSetup = true;
        
        // 嘗試讀取，但如果失敗就直接設置
        try {
          const currentDungeonCore = await party.dungeonCoreContract();
          // 如果能成功讀取，檢查地址是否正確
          if (currentDungeonCore && 
              currentDungeonCore !== '0x0000000000000000000000000000000000000000' &&
              currentDungeonCore.toLowerCase() === this.contracts.DUNGEONCORE.address.toLowerCase()) {
            needsSetup = false;
            this.log(`Party.dungeonCoreContract 已正確設置: ${currentDungeonCore}`, 'success');
          }
        } catch (readError) {
          // getter revert 是預期的，需要設置
          this.log('Party.dungeonCoreContract 未初始化（預期行為），需要設置', 'info');
          needsSetup = true;
        }
        
        if (needsSetup) {
          this.log('設置 Party.setDungeonCore...', 'info');
          const tx = await party.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log('✅ Party.setDungeonCore 成功', 'success');
          
          // 驗證設置（但不要在這裡 throw，因為 getter 可能仍會 revert）
          try {
            const verifyDungeonCore = await party.dungeonCoreContract();
            this.log(`✅ 驗證成功: Party.dungeonCoreContract = ${verifyDungeonCore}`, 'success');
          } catch (verifyError) {
            this.log('⚠️ Party.dungeonCoreContract 設置後仍無法讀取，可能需要手動檢查', 'warning');
          }
        }
      }
    } catch (error) {
      this.log(`❌ Party.setDungeonCore 失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'Party連接設置', error });
    }
    
    // 9. 🔧 修復：DungeonMaster 設置 DungeonCore (整合自 fix-connections 腳本)
    try {
      const dungeonMaster = this.contracts.DUNGEONMASTER?.contract;
      if (dungeonMaster && dungeonMaster.setDungeonCore) {
        // 先檢查是否已設置
        let needsSetup = false;
        try {
          const currentDungeonCore = await dungeonMaster.dungeonCore();
          if (currentDungeonCore === '0x0000000000000000000000000000000000000000') {
            needsSetup = true;
          } else {
            this.log(`DungeonMaster.dungeonCore 已設置: ${currentDungeonCore}`, 'info');
          }
        } catch (error) {
          needsSetup = true; // 如果讀取失敗，假設需要設置
        }
        
        if (needsSetup) {
          this.log('設置 DungeonMaster.setDungeonCore...', 'info');
          const tx = await dungeonMaster.setDungeonCore(this.contracts.DUNGEONCORE.address);
          await tx.wait();
          this.log('✅ DungeonMaster.setDungeonCore 成功', 'success');
        } else {
          this.log('✅ DungeonMaster.setDungeonCore 已正確設置', 'success');
        }
      }
    } catch (error) {
      this.log(`❌ DungeonMaster.setDungeonCore 失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'DungeonMaster連接設置', error });
    }
    
    // 保存特殊設置結果到實例變數
    this.specialSetupResults = specialSetupResults;
  }

  async initializeParameters() {
    this.log('\n初始化參數...', 'info');
    
    // 順序執行以避免 nonce 衝突
    await this.setBaseURIs();
    await this.initializeDungeons();
    await this.setOtherParameters();
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
        this.errors.push({ type: 'BaseURI設置', contractName, error });
      }
    }
    
    // 設置 ContractURI（可選，用於 OpenSea 集合元數據）
    this.log('\n設置 ContractURI（OpenSea 集合元數據）...', 'info');
    
    for (const [contractName, uri] of Object.entries(GAME_PARAMS.contractURIs)) {
      try {
        const contract = this.contracts[contractName]?.contract;
        if (contract && contract.setContractURI) {
          const tx = await contract.setContractURI(uri);
          await tx.wait();
          this.log(`✅ ${contractName} ContractURI 設置成功`, 'success');
        }
      } catch (error) {
        this.log(`⚠️ ${contractName} ContractURI 設置失敗: ${error.message}`, 'warning');
        // ContractURI 是可選的，所以使用 warning 而非 error
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
        // 使用 DungeonMaster 的 setDungeon 函數 (不包含 name 參數)
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
        this.errors.push({ type: '地城設置', dungeonId: dungeon.id, error });
      }
    }
  }

  async setOtherParameters() {
    this.log('\n設置其他參數...', 'info');
    
    // 1. 設置 Party 創建費用
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
    
    // 2. 設置 VIP 解鎖冷卻期
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

  async generateConfigs() {
    this.log('\n生成配置文件...', 'info');
    
    // 生成 v25-config.js
    const v25Config = {
      version: 'V25',
      lastUpdated: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: this.deployer.address,
      startBlock: this.startBlock,
      contracts: {},
      deploymentOptions: DEPLOYMENT_CONFIG,
      gameParams: GAME_PARAMS
    };
    
    for (const [name, data] of Object.entries(this.contracts)) {
      v25Config.contracts[name] = {
        address: data.address,
        deploymentBlock: this.startBlock,
        contractName: data.contractName || name
      };
    }
    
    const configPath = path.join(__dirname, '../../config/v25-config.js');
    const configContent = `// V25 部署配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

module.exports = ${JSON.stringify(v25Config, null, 2)};`;
    
    fs.writeFileSync(configPath, configContent);
    this.log(`✅ 配置文件已生成: ${configPath}`, 'success');
    
    // 生成驗證腳本數據
    const verificationPath = path.join(__dirname, '../deployments', `v25-verification-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(verificationPath), { recursive: true });
    fs.writeFileSync(verificationPath, JSON.stringify({
      version: 'V25',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      verificationData: this.verificationData
    }, null, 2));
    this.log(`✅ 驗證數據已保存: ${verificationPath}`, 'success');
    
    // 更新 master-config.json
    await this.updateMasterConfig(v25Config);
  }

  async updateMasterConfig(v25Config) {
    this.log('\n更新 master-config.json...', 'info');
    
    try {
      const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
      
      // 備份現有的 master-config.json
      if (fs.existsSync(masterConfigPath)) {
        const backupPath = `${masterConfigPath}.backup-${Date.now()}`;
        fs.copyFileSync(masterConfigPath, backupPath);
        this.log(`📋 已備份 master-config.json`, 'info');
      }
      
      // 讀取現有配置（如果存在）
      let masterConfig = {};
      if (fs.existsSync(masterConfigPath)) {
        masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      }
      
      // 構建新的 master-config
      const updatedMasterConfig = {
        version: v25Config.version,
        lastUpdated: v25Config.lastUpdated,
        description: "DungeonDelvers 主配置文件 - V25 (自動生成)",
        sourceConfig: "v25-config.js",
        contracts: {
          mainnet: {}
        },
        subgraph: masterConfig.subgraph || {
          studio: {
            url: "https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.2.2",
            version: "v3.2.2"
          },
          decentralized: {
            url: "https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs",
            subgraphId: "Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs",
            deploymentId: "QmaDf5fWXxGyb6oky2611NBfthvs35vR6DrFnhHMkuuRzV"
          }
        },
        network: {
          chainId: 56,
          name: "BSC Mainnet",
          rpc: "https://bsc-dataseed.binance.org/",
          explorer: "https://bscscan.com"
        },
        services: masterConfig.services || {
          frontend: "https://dungeondelvers.xyz",
          backend: "https://dungeon-delvers-metadata-server.onrender.com"
        },
        tokens: {
          real: {
            USD_ADDRESS: DEPLOYMENT_CONFIG.externalAddresses.USDT || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
            SOUL_ADDRESS: v25Config.contracts.SOULSHARD?.address,
            POOL_ADDRESS: v25Config.contracts.UNISWAP_POOL?.address
          }
        }
      };
      
      // 更新合約地址
      for (const [name, data] of Object.entries(v25Config.contracts)) {
        updatedMasterConfig.contracts.mainnet[`${name}_ADDRESS`] = data.address;
      }
      
      // 確保 USD 地址
      if (!updatedMasterConfig.contracts.mainnet.USD_ADDRESS) {
        updatedMasterConfig.contracts.mainnet.USD_ADDRESS = DEPLOYMENT_CONFIG.externalAddresses.USDT || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
      }
      
      // 確保 TESTUSD_ADDRESS 與 USD_ADDRESS 一致
      updatedMasterConfig.contracts.mainnet.TESTUSD_ADDRESS = updatedMasterConfig.contracts.mainnet.USD_ADDRESS;
      
      // 寫入更新後的配置
      fs.writeFileSync(
        masterConfigPath,
        JSON.stringify(updatedMasterConfig, null, 2)
      );
      
      this.log('✅ master-config.json 已更新', 'success');
      
      // 同時更新 config-reader.js
      await this.updateConfigReader(v25Config);
      
    } catch (error) {
      this.log(`⚠️ 更新 master-config.json 失敗: ${error.message}`, 'warning');
      this.log('請手動執行: node scripts/active/v25-sync-all.js', 'warning');
    }
  }

  async updateConfigReader(v25Config) {
    this.log('更新 config-reader.js...', 'info');
    
    try {
      const configReaderPath = path.join(__dirname, '../../config/config-reader.js');
      
      // 創建 config-reader.js 內容
      const configReaderContent = `/**
 * DungeonDelvers 配置讀取器
 * 自動生成於: ${new Date().toISOString()}
 * 從 v25-config.js 生成
 */

const v25Config = require('./v25-config.js');

module.exports = {
  version: v25Config.version,
  contracts: v25Config.contracts,
  deployer: v25Config.deployer,
  startBlock: v25Config.startBlock,
  network: v25Config.network,
  
  // 輔助方法
  getAddress(contractName) {
    const contract = this.contracts[contractName];
    return contract ? contract.address : null;
  },
  
  getAllAddresses() {
    const addresses = {};
    for (const [name, data] of Object.entries(this.contracts)) {
      addresses[\`\${name}_ADDRESS\`] = data.address;
    }
    return addresses;
  },
  
  // 原始配置
  raw: v25Config
};
`;
      
      fs.writeFileSync(configReaderPath, configReaderContent);
      this.log('✅ config-reader.js 已更新', 'success');
      
    } catch (error) {
      this.log(`⚠️ 更新 config-reader.js 失敗: ${error.message}`, 'warning');
    }
  }

  async deployMarketplace() {
    this.log('\n======== 部署市場合約 ========', 'section');
    
    try {
      // 導入市場合約部署模塊
      const { deployMarketplaceContracts } = require('./v25-marketplace-module');
      
      // 準備已部署的合約地址
      const deployedContracts = {
        SOULSHARD: this.deployedContracts.SOULSHARD,
        HERO: this.deployedContracts.HERO,
        RELIC: this.deployedContracts.RELIC,
        PARTY: this.deployedContracts.PARTY,
        DUNGEONCORE: this.deployedContracts.DUNGEONCORE
      };
      
      // 部署選項
      const options = {
        waitConfirmations: 5,
        autoVerify: DEPLOYMENT_CONFIG.options.autoVerify,
        updateConfig: true
      };
      
      // 部署市場合約
      const marketplaceAddresses = await deployMarketplaceContracts(deployedContracts, options);
      
      // 更新已部署合約列表
      this.deployedContracts.DUNGEONMARKETPLACE = marketplaceAddresses.DUNGEONMARKETPLACE;
      this.deployedContracts.OFFERSYSTEM = marketplaceAddresses.OFFERSYSTEM;
      
      this.log('✅ 市場合約部署完成', 'success');
      
    } catch (error) {
      this.log(`❌ 市場合約部署失敗: ${error.message}`, 'error');
      throw error;
    }
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

  async generateDeploymentReport() {
    const reportPath = path.join(__dirname, '../deployments', `v25-deployment-report-${Date.now()}.md`);
    
    let report = `# V25 部署報告

生成時間: ${new Date().toLocaleString()}

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: ${this.deployer.address}
- **起始區塊**: ${this.startBlock}
- **錯誤數量**: ${this.errors.length}

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
`;

    for (const [name, data] of Object.entries(this.contracts)) {
      const status = data.contract ? '✅ 已部署' : '📌 使用現有';
      report += `| ${name} | \`${data.address}\` | ${status} |\n`;
    }

    report += `
### 地城配置
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

1. 執行合約驗證: \`npx hardhat run scripts/active/v25-verify-contracts.js --network bsc\`
2. 同步配置到各項目: \`node scripts/active/v25-sync-all.js\`
3. 部署子圖: \`cd DDgraphql/dungeon-delvers && npm run deploy\`
4. 在前端測試功能

## 重要地址

- **DungeonCore**: \`${this.contracts.DUNGEONCORE?.address}\`
- **Hero**: \`${this.contracts.HERO?.address}\`
- **Relic**: \`${this.contracts.RELIC?.address}\`
- **SoulShard**: \`${this.contracts.SOULSHARD?.address}\`
`;

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    this.log(`\n✅ 部署報告已生成: ${reportPath}`, 'success');
  }

  async generateErrorReport() {
    if (this.errors.length === 0) return;
    
    const errorPath = path.join(__dirname, '../deployments', `v25-error-report-${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(errorPath), { recursive: true });
    fs.writeFileSync(errorPath, JSON.stringify({
      version: 'V25',
      timestamp: new Date().toISOString(),
      errors: this.errors,
      deploymentLog: this.deploymentLog
    }, null, 2));
    
    this.log(`\n❌ 錯誤報告已生成: ${errorPath}`, 'error');
  }

  async runSyncScript() {
    this.log('\n執行配置同步...', 'info');
    
    try {
      const { execSync } = require('child_process');
      const syncScriptPath = path.join(__dirname, 'v25-sync-all.js');
      
      // 檢查同步腳本是否存在
      if (!fs.existsSync(syncScriptPath)) {
        this.log('⚠️ 找不到同步腳本，跳過自動同步', 'warning');
        this.log('請手動執行: node scripts/active/v25-sync-all.js', 'warning');
        return;
      }
      
      // 執行同步腳本
      execSync(`node ${syncScriptPath}`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });
      
      this.log('✅ 配置同步完成', 'success');
      
    } catch (error) {
      this.log(`⚠️ 自動同步失敗: ${error.message}`, 'warning');
      this.log('請手動執行: node scripts/active/v25-unified-sync.js', 'warning');
    }
    
    // 記錄特殊設置結果（使用實例變數，避免錯誤）
    if (typeof this.specialSetupResults === 'undefined') {
      this.specialSetupResults = [];
    }
  }

  // 新增：完整的依賴驗證方法
  async verifyAllDependencies() {
    this.log('\n執行完整依賴驗證...', 'info');
    
    const validationResults = [];
    
    // 定義所有需要驗證的依賴關係
    const dependencyValidations = {
      'HERO': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'soulShardToken', expected: this.contracts.SOULSHARD.address },
        { method: 'ascensionAltarAddress', expected: this.contracts.ALTAROFASCENSION.address }
      ],
      'RELIC': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'soulShardToken', expected: this.contracts.SOULSHARD.address },
        { method: 'ascensionAltarAddress', expected: this.contracts.ALTAROFASCENSION.address }
      ],
      'PARTY': [
        { method: 'dungeonCoreContract', expected: this.contracts.DUNGEONCORE.address }, // Party 使用不同的屬性名
        { method: 'heroContract', expected: this.contracts.HERO.address },
        { method: 'relicContract', expected: this.contracts.RELIC.address }
      ],
      'DUNGEONMASTER': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'soulShardToken', expected: this.contracts.SOULSHARD.address },
        { method: 'dungeonStorage', expected: this.contracts.DUNGEONSTORAGE.address }
      ],
      'VIPSTAKING': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'soulShardToken', expected: this.contracts.SOULSHARD.address }
      ],
      'PLAYERVAULT': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'soulShardToken', expected: this.contracts.SOULSHARD.address }
      ],
      'ALTAROFASCENSION': [
        { method: 'dungeonCore', expected: this.contracts.DUNGEONCORE.address },
        { method: 'heroContract', expected: this.contracts.HERO.address },
        { method: 'relicContract', expected: this.contracts.RELIC.address }
      ],
      'DUNGEONCORE': [
        { method: 'oracleAddress', expected: this.contracts.ORACLE.address },
        { method: 'playerVaultAddress', expected: this.contracts.PLAYERVAULT.address },
        { method: 'dungeonMasterAddress', expected: this.contracts.DUNGEONMASTER.address },
        { method: 'heroContractAddress', expected: this.contracts.HERO.address },
        { method: 'relicContractAddress', expected: this.contracts.RELIC.address },
        { method: 'partyContractAddress', expected: this.contracts.PARTY.address },
        { method: 'altarOfAscensionAddress', expected: this.contracts.ALTAROFASCENSION.address },
        { method: 'vipStakingAddress', expected: this.contracts.VIPSTAKING.address },
        { method: 'playerProfileAddress', expected: this.contracts.PLAYERPROFILE.address }
      ]
    };
    
    // 驗證每個依賴
    for (const [contractName, dependencies] of Object.entries(dependencyValidations)) {
      const contract = this.contracts[contractName]?.contract;
      if (!contract) {
        this.log(`⚠️ 跳過 ${contractName} 驗證（未部署）`, 'warning');
        continue;
      }
      
      for (const dep of dependencies) {
        try {
          const actual = await contract[dep.method]();
          const success = actual.toLowerCase() === dep.expected.toLowerCase();
          
          validationResults.push({
            contract: contractName,
            dependency: dep.method,
            expected: dep.expected,
            actual,
            success,
            critical: ['dungeonCore', 'soulShardToken', 'dungeonCoreContract'].includes(dep.method)
          });
          
          if (!success) {
            this.log(`❌ ${contractName}.${dep.method} 驗證失敗`, 'error');
            this.log(`   期望: ${dep.expected}`, 'error');
            this.log(`   實際: ${actual}`, 'error');
          } else {
            this.log(`✅ ${contractName}.${dep.method} 驗證通過`, 'success');
          }
        } catch (error) {
          this.log(`⚠️ ${contractName}.${dep.method} 無法驗證: ${error.message}`, 'warning');
          validationResults.push({
            contract: contractName,
            dependency: dep.method,
            error: error.message,
            success: false,
            critical: ['dungeonCore', 'soulShardToken', 'dungeonCoreContract'].includes(dep.method)
          });
        }
      }
    }
    
    // 儲存驗證結果
    this.dependencyValidationResults = validationResults;
    
    // 統計結果
    const totalChecks = validationResults.length;
    const passedChecks = validationResults.filter(r => r.success).length;
    const failedChecks = validationResults.filter(r => !r.success).length;
    const criticalFailures = validationResults.filter(r => !r.success && r.critical).length;
    
    this.log(`\n依賴驗證完成:`, 'info');
    this.log(`- 總檢查項目: ${totalChecks}`, 'info');
    this.log(`- 通過: ${passedChecks}`, 'success');
    this.log(`- 失敗: ${failedChecks}`, failedChecks > 0 ? 'error' : 'info');
    this.log(`- 關鍵失敗: ${criticalFailures}`, criticalFailures > 0 ? 'error' : 'info');
    
    // 如果有關鍵失敗，建議執行修復腳本
    if (criticalFailures > 0) {
      this.log(`\n⚠️ 發現 ${criticalFailures} 個關鍵依賴問題`, 'warning');
      this.log('建議執行修復腳本:', 'warning');
      this.log('npx hardhat run scripts/active/v25-fix-contract-dependencies.js --network bsc', 'warning');
    }
    
    // 生成驗證報告檔案
    const validationReportPath = path.join(__dirname, '../deployments', `v25-validation-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(validationReportPath), { recursive: true });
    fs.writeFileSync(validationReportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: totalChecks,
        passed: passedChecks,
        failed: failedChecks,
        criticalFailures
      },
      details: validationResults
    }, null, 2));
    
    this.log(`\n驗證報告已保存: ${validationReportPath}`, 'info');
  }
}

// ======================== 執行部署 ========================

async function main() {
  const deployer = new V25Deployer();
  await deployer.deploy();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
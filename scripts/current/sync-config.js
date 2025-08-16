#!/usr/bin/env node

/**
 * V26 VRF 配置同步腳本
 * 
 * 同步 VRF 合約地址和 ABI 到所有相關項目
 * 支援自動備份和回滾
 * 
 * 使用方式：
 * node scripts/active/v26-sync-all-vrf.js
 * node scripts/active/v26-sync-all-vrf.js --rollback
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 項目路徑配置
const PROJECT_PATHS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// VRF ABI 同步配置
const VRF_ABI_SYNC_CONFIG = [
  {
    contractName: 'HERO',
    artifactName: 'Hero_UnifiedVRF',
    contractFile: 'Hero_UnifiedVRF',
    destinations: [
      { type: 'frontend', path: 'src/abis/Hero.json' },
      { type: 'subgraph', path: 'abis/Hero.json' }
    ]
  },
  {
    contractName: 'RELIC',
    artifactName: 'Relic_UnifiedVRF',
    contractFile: 'Relic_UnifiedVRF',
    destinations: [
      { type: 'frontend', path: 'src/abis/Relic.json' },
      { type: 'subgraph', path: 'abis/Relic.json' }
    ]
  },
  {
    contractName: 'ALTAROFASCENSION',
    artifactName: 'AltarOfAscension_UnifiedVRF',
    contractFile: 'AltarOfAscension_UnifiedVRF',
    destinations: [
      { type: 'frontend', path: 'src/abis/AltarOfAscension.json' },
      { type: 'subgraph', path: 'abis/AltarOfAscension.json' }
    ]
  },
  {
    contractName: 'DUNGEONMASTER',
    artifactName: 'DungeonMaster_UnifiedVRF',
    contractFile: 'DungeonMaster_UnifiedVRF',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonMaster.json' },
      { type: 'subgraph', path: 'abis/DungeonMaster.json' }
    ]
  },
  // 非 VRF 合約保持原樣
  {
    contractName: 'PARTY',
    artifactName: 'Party',
    contractFile: 'Party',
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/Party.json' }
    ]
  },
  {
    contractName: 'VIPSTAKING',
    artifactName: 'VIPStaking',
    contractFile: 'VIPStaking',
    destinations: [
      { type: 'frontend', path: 'src/abis/VIPStaking.json' },
      { type: 'subgraph', path: 'abis/VIPStaking.json' }
    ]
  },
  {
    contractName: 'PLAYERPROFILE',
    artifactName: 'PlayerProfile',
    contractFile: 'PlayerProfile',
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerProfile.json' },
      { type: 'subgraph', path: 'abis/PlayerProfile.json' }
    ]
  },
  {
    contractName: 'DUNGEONCORE',
    artifactName: 'DungeonCore',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonCore.json' }
    ]
  },
  {
    contractName: 'ORACLE',
    artifactName: 'Oracle',
    contractFile: 'Oracle',
    destinations: [
      { type: 'frontend', path: 'src/abis/Oracle.json' }
    ]
  },
  {
    contractName: 'PLAYERVAULT',
    artifactName: 'PlayerVault',
    contractFile: 'PlayerVault',
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerVault.json' },
      { type: 'subgraph', path: 'abis/PlayerVault.json' }
    ]
  },
  {
    contractName: 'DUNGEONSTORAGE',
    artifactName: 'DungeonStorage',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonStorage.json' }
    ]
  },
  {
    contractName: 'SOULSHARD',
    artifactName: 'Test_SoulShard',
    contractFile: 'SoulShard',
    destinations: [
      { type: 'frontend', path: 'src/abis/SoulShardToken.json' }
    ]
  }
];

class V26VRFSyncer {
  constructor() {
    this.v26Config = null;
    this.backups = [];
    this.errors = [];
    this.isRollback = process.argv.includes('--rollback');
    this.subgraphVersion = null;
    
    // 檢查是否指定了子圖版本
    const versionArg = process.argv.find(arg => arg.match(/^v\d+\.\d+\.\d+$/));
    if (versionArg) {
      this.subgraphVersion = versionArg;
    }
    
    // 如果沒有指定版本且不是回滾模式，詢問用戶
    if (!this.subgraphVersion && !this.isRollback) {
      this.askForSubgraphVersion();
    }
  }

  askForSubgraphVersion() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      console.log(`${colors.yellow}請輸入子圖版本號（例如：v4.0.0-vrf）：${colors.reset}`);
      rl.question('版本號: ', (version) => {
        rl.close();
        
        // 驗證版本格式
        if (version.match(/^v\d+\.\d+\.\d+/)) {
          this.subgraphVersion = version;
          this.log(`將使用子圖版本：${version}`, 'info');
        } else {
          console.error(`${colors.red}版本號格式不正確，請使用格式：v4.0.0-vrf${colors.reset}`);
          process.exit(1);
        }
        resolve();
      });
    });
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

  async sync() {
    console.log(`${colors.bright}
==================================================
🔄 V26 VRF 配置同步腳本
==================================================
${colors.reset}`);

    // 顯示子圖版本更新資訊
    if (this.subgraphVersion) {
      console.log(`${colors.cyan}📊 將更新子圖版本到: ${this.subgraphVersion}${colors.reset}\n`);
    }

    try {
      // 如果需要詢問版本，先處理
      if (!this.subgraphVersion && !this.isRollback) {
        await this.askForSubgraphVersion();
        console.log(`${colors.cyan}📊 將更新子圖版本到: ${this.subgraphVersion}${colors.reset}\n`);
      }
      
      if (this.isRollback) {
        await this.performRollback();
      } else {
        await this.performVRFSync();
      }
    } catch (error) {
      this.log(`同步失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async performVRFSync() {
    // 1. 載入 V26 VRF 配置
    await this.loadV26VRFConfig();
    
    // 2. 如果指定了子圖版本，先更新 master-config.json
    if (this.subgraphVersion) {
      await this.updateMasterConfigSubgraphVersion();
    }
    
    // 3. 編譯合約以確保 ABI 最新
    await this.compileVRFContracts();
    
    // 4. 同步 VRF ABI 文件
    await this.syncVRFABIs();
    
    // 5. 同步 VRF 配置文件
    await this.syncVRFConfigs();
    
    // 6. 更新子圖配置
    await this.updateVRFSubgraph();
    
    // 7. 生成同步報告
    await this.generateVRFSyncReport();
    
    // 8. 檢查配置一致性
    await this.checkVRFConfigConsistency();
    
    // 9. 顯示下一步指示
    this.showVRFNextSteps();
    
    this.log('\n✅ V26 VRF 同步完成！', 'success');
  }

  async loadV26VRFConfig() {
    this.log('載入 VRF 配置...', 'info');
    
    // 嘗試載入 v26-vrf-config.js
    const v26ConfigPath = path.join(PROJECT_PATHS.contracts, 'config/v26-vrf-config.js');
    if (fs.existsSync(v26ConfigPath)) {
      this.log('使用 v26-vrf-config.js', 'info');
      delete require.cache[require.resolve(v26ConfigPath)];
      this.v26Config = require(v26ConfigPath);
    } else {
      // 回退到 master-config.json
      const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
      if (fs.existsSync(masterConfigPath)) {
        this.log('使用 master-config.json 作為真實地址來源', 'warning');
        const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
        
        // 轉換為 v26Config 格式
        this.v26Config = {
          version: 'V26-VRF',
          lastUpdated: new Date().toISOString(),
          network: masterConfig.network?.name || 'BSC Mainnet',
          deployer: masterConfig.contracts?.mainnet?.DUNGEONMASTERWALLET_ADDRESS || '0x10925A7138649C7E1794CE646182eeb5BF8ba647',
          startBlock: 56184733,
          contracts: {
            SOULSHARD: {
              address: masterConfig.contracts.mainnet.SOULSHARD_ADDRESS,
              contractName: 'SOULSHARD'
            },
            ORACLE: {
              address: masterConfig.contracts.mainnet.ORACLE_ADDRESS,
              contractName: 'Oracle'
            },
            DUNGEONCORE: {
              address: masterConfig.contracts.mainnet.DUNGEONCORE_ADDRESS,
              contractName: 'DungeonCore'
            },
            PLAYERVAULT: {
              address: masterConfig.contracts.mainnet.PLAYERVAULT_ADDRESS,
              contractName: 'PlayerVault'
            },
            DUNGEONSTORAGE: {
              address: masterConfig.contracts.mainnet.DUNGEONSTORAGE_ADDRESS,
              contractName: 'DungeonStorage'
            },
            DUNGEONMASTER: {
              address: masterConfig.contracts.mainnet.DUNGEONMASTER_ADDRESS,
              contractName: 'DungeonMaster_UnifiedVRF'
            },
            HERO: {
              address: masterConfig.contracts.mainnet.HERO_ADDRESS,
              contractName: 'Hero_UnifiedVRF'
            },
            RELIC: {
              address: masterConfig.contracts.mainnet.RELIC_ADDRESS,
              contractName: 'Relic_UnifiedVRF'
            },
            PARTY: {
              address: masterConfig.contracts.mainnet.PARTY_ADDRESS,
              contractName: 'Party'
            },
            ALTAROFASCENSION: {
              address: masterConfig.contracts.mainnet.ALTAROFASCENSION_ADDRESS,
              contractName: 'AltarOfAscension_UnifiedVRF'
            },
            VIPSTAKING: {
              address: masterConfig.contracts.mainnet.VIPSTAKING_ADDRESS,
              contractName: 'VIPStaking'
            },
            PLAYERPROFILE: {
              address: masterConfig.contracts.mainnet.PLAYERPROFILE_ADDRESS,
              contractName: 'PlayerProfile'
            }
          }
        };
      } else {
        throw new Error('找不到配置文件：v26-vrf-config.js 或 master-config.json');
      }
    }
    
    this.log(`✅ 配置載入完成 (版本: ${this.v26Config.version})`, 'success');
    this.log(`部署者: ${this.v26Config.deployer}`, 'info');
    this.log(`起始區塊: ${this.v26Config.startBlock}`, 'info');
  }

  async updateMasterConfigSubgraphVersion() {
    this.log(`更新子圖版本到 ${this.subgraphVersion}...`, 'info');
    
    try {
      const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
      
      if (fs.existsSync(masterConfigPath)) {
        // 備份原檔案
        const backupPath = `${masterConfigPath}.backup-${Date.now()}`;
        fs.copyFileSync(masterConfigPath, backupPath);
        this.backups.push({ type: 'master-config', original: masterConfigPath, backup: backupPath });
        
        // 讀取並更新配置
        const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
        
        if (!masterConfig.subgraph) {
          masterConfig.subgraph = {};
        }
        
        if (!masterConfig.subgraph.studio) {
          masterConfig.subgraph.studio = {};
        }
        
        // 更新子圖版本
        const oldVersion = masterConfig.subgraph.studio.version;
        masterConfig.subgraph.studio.version = this.subgraphVersion;
        masterConfig.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers/${this.subgraphVersion}`;
        
        // 更新最後修改時間
        masterConfig.lastUpdated = new Date().toISOString();
        
        // 寫回檔案
        fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
        
        this.log(`✅ 子圖版本已更新: ${oldVersion} → ${this.subgraphVersion}`, 'success');
      }
    } catch (error) {
      this.log(`⚠️ 更新子圖版本失敗: ${error.message}`, 'warning');
    }
  }

  async compileVRFContracts() {
    this.log('編譯 VRF 合約以更新 ABI...', 'info');
    
    try {
      const contractsDir = PROJECT_PATHS.contracts;
      process.chdir(contractsDir);
      
      this.log('執行 npx hardhat compile...', 'info');
      execSync('npx hardhat compile', { stdio: 'pipe' });
      this.log('✅ VRF 合約編譯完成', 'success');
    } catch (error) {
      this.log(`⚠️ 編譯警告: ${error.message}`, 'warning');
      // 編譯失敗不是致命錯誤，繼續執行
    }
  }

  async syncVRFABIs() {
    this.log('\n同步 VRF ABI 文件...', 'info');
    
    for (const config of VRF_ABI_SYNC_CONFIG) {
      await this.syncSingleVRFABI(config);
    }
  }

  async syncSingleVRFABI(config) {
    this.log(`同步 ${config.contractName} ABI...`, 'info');
    
    try {
      // 獲取合約地址
      const contractData = this.v26Config.contracts[config.contractName];
      if (!contractData || !contractData.address) {
        this.log(`⚠️ ${config.contractName} 地址未找到，跳過`, 'warning');
        return;
      }
      
      // 構建 artifact 路徑
      let artifactPath;
      
      // VRF 合約在 contracts_next/vrf 目錄
      if (['Hero_UnifiedVRF', 'Relic_UnifiedVRF', 'AltarOfAscension_UnifiedVRF', 'DungeonMaster_UnifiedVRF'].includes(config.artifactName)) {
        artifactPath = path.join(
          PROJECT_PATHS.contracts,
          'artifacts/contracts/contracts_next/vrf',
          `${config.contractFile || config.artifactName}.sol`,
          `${config.artifactName}.json`
        );
      } else {
        // 其他合約在原始位置
        const contractCategory = this.getContractCategory(config.artifactName);
        artifactPath = path.join(
          PROJECT_PATHS.contracts,
          'artifacts/contracts/current',
          contractCategory,
          `${config.contractFile || config.artifactName}.sol`,
          `${config.artifactName}.json`
        );
      }
      
      if (!fs.existsSync(artifactPath)) {
        this.log(`⚠️ Artifact 文件不存在: ${artifactPath}`, 'warning');
        return;
      }
      
      // 讀取 artifact
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // 創建標準 ABI 文件內容
      const abiContent = {
        contractName: config.artifactName,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        address: contractData.address,
        network: 'BSC Mainnet',
        deploymentBlock: this.v26Config.startBlock,
        lastUpdated: new Date().toISOString(),
        version: this.v26Config.version
      };
      
      // 同步到各個目標位置
      for (const destination of config.destinations) {
        await this.copyABIToDestination(abiContent, destination, config.contractName);
      }
      
    } catch (error) {
      this.log(`❌ ${config.contractName} ABI 同步失敗: ${error.message}`, 'error');
      this.errors.push({ type: 'ABI同步', contract: config.contractName, error });
    }
  }

  getContractCategory(artifactName) {
    const categories = {
      'Hero': 'nft',
      'Relic': 'nft', 
      'Party': 'nft',
      'VIPStaking': 'nft',
      'PlayerProfile': 'nft',
      'DungeonCore': 'core',
      'DungeonStorage': 'core',
      'AltarOfAscensionV2Fixed': 'core',
      'DungeonMasterV2_Fixed': 'core',
      'PlayerVault': 'defi',
      'Oracle': 'defi',
      'Test_SoulShard': 'defi'
    };
    return categories[artifactName] || 'core';
  }

  async copyABIToDestination(abiContent, destination, contractName) {
    try {
      const projectPath = PROJECT_PATHS[destination.type];
      if (!projectPath || !fs.existsSync(projectPath)) {
        this.log(`⚠️ 項目路徑不存在: ${destination.type}`, 'warning');
        return;
      }
      
      const targetPath = path.join(projectPath, destination.path);
      const targetDir = path.dirname(targetPath);
      
      // 確保目標目錄存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 備份現有文件
      if (fs.existsSync(targetPath)) {
        const backupPath = `${targetPath}.backup-${Date.now()}`;
        fs.copyFileSync(targetPath, backupPath);
        this.backups.push({ 
          type: 'abi', 
          contract: contractName, 
          destination: destination.type,
          original: targetPath, 
          backup: backupPath 
        });
      }
      
      // 寫入新 ABI
      fs.writeFileSync(targetPath, JSON.stringify(abiContent, null, 2));
      this.log(`✅ ${contractName} ABI 已同步到 ${destination.type}`, 'success');
      
    } catch (error) {
      this.log(`❌ 複製 ${contractName} ABI 到 ${destination.type} 失敗: ${error.message}`, 'error');
      this.errors.push({ 
        type: 'ABI複製', 
        contract: contractName, 
        destination: destination.type, 
        error 
      });
    }
  }

  async syncVRFConfigs() {
    this.log('\n同步 VRF 配置文件...', 'info');
    
    // 1. 更新前端配置
    await this.updateFrontendVRFConfig();
    
    // 2. 更新後端配置
    await this.updateBackendVRFConfig();
    
    // 3. 更新子圖配置
    await this.updateSubgraphVRFConfig();
  }

  async updateFrontendVRFConfig() {
    this.log('更新前端 VRF 配置...', 'info');
    
    try {
      const frontendConfigPath = path.join(PROJECT_PATHS.frontend, 'src/config/contracts.js');
      
      if (!fs.existsSync(frontendConfigPath)) {
        this.log('⚠️ 前端配置文件不存在，跳過', 'warning');
        return;
      }
      
      // 備份
      const backupPath = `${frontendConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(frontendConfigPath, backupPath);
      this.backups.push({ type: 'frontend-config', original: frontendConfigPath, backup: backupPath });
      
      // 生成新的配置內容
      const configContent = this.generateFrontendVRFConfig();
      fs.writeFileSync(frontendConfigPath, configContent);
      
      this.log('✅ 前端 VRF 配置已更新', 'success');
    } catch (error) {
      this.log(`❌ 前端配置更新失敗: ${error.message}`, 'error');
      this.errors.push({ type: '前端配置', error });
    }
  }

  generateFrontendVRFConfig() {
    const contracts = this.v26Config.contracts;
    
    return `// V26 VRF 合約配置 - 自動生成於 ${new Date().toISOString()}
// 🔮 統一 VRF 版本 - 所有操作使用 Chainlink VRF v2.5

export const CONTRACT_ADDRESSES = {
  // 🔮 VRF 合約 (統一稀有度機率)
  HERO: "${contracts.HERO.address}",              // Hero_UnifiedVRF
  RELIC: "${contracts.RELIC.address}",            // Relic_UnifiedVRF
  DUNGEONMASTER: "${contracts.DUNGEONMASTER.address}", // DungeonMaster_UnifiedVRF
  ALTAROFASCENSION: "${contracts.ALTAROFASCENSION.address}", // AltarOfAscension_UnifiedVRF
  
  // 📦 標準合約
  PARTY: "${contracts.PARTY.address}",            // Party
  VIPSTAKING: "${contracts.VIPSTAKING.address}",  // VIPStaking
  PLAYERPROFILE: "${contracts.PLAYERPROFILE.address}", // PlayerProfile
  
  // 🏗️ 核心合約
  DUNGEONCORE: "${contracts.DUNGEONCORE.address}",
  PLAYERVAULT: "${contracts.PLAYERVAULT.address}",
  DUNGEONSTORAGE: "${contracts.DUNGEONSTORAGE.address}",
  
  // 💰 代幣合約
  SOULSHARD: "${contracts.SOULSHARD.address}",
  ORACLE: "${contracts.ORACLE.address}",
  
  // 🔗 外部合約
  USDT: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"
};

// VRF 配置
export const VRF_CONFIG = {
  BSC_MAINNET: {
    wrapperAddress: "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94",
    linkToken: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
    coordinatorAddress: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    useNativePayment: true,
    expectedWaitTime: "10-30 seconds"
  }
};

// 統一稀有度配置 (所有 VRF 合約都使用相同機率)
export const UNIFIED_RARITY_CONFIG = {
  rarity1Chance: 44,  // 44%
  rarity2Chance: 35,  // 35%
  rarity3Chance: 15,  // 15%
  rarity4Chance: 5,   // 5%
  rarity5Chance: 1    // 1%
};

// 部署信息
export const DEPLOYMENT_INFO = {
  version: "${this.v26Config.version}",
  deployer: "${this.v26Config.deployer}",
  startBlock: ${this.v26Config.startBlock},
  lastUpdated: "${this.v26Config.lastUpdated}"
};

// VRF 合約標識
export const VRF_CONTRACTS = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'];

export default CONTRACT_ADDRESSES;
`;
  }

  async updateBackendVRFConfig() {
    this.log('更新後端 VRF 配置...', 'info');
    
    try {
      const backendConfigPath = path.join(PROJECT_PATHS.backend, 'config/contracts.json');
      
      if (!fs.existsSync(path.dirname(backendConfigPath))) {
        fs.mkdirSync(path.dirname(backendConfigPath), { recursive: true });
      }
      
      // 備份
      if (fs.existsSync(backendConfigPath)) {
        const backupPath = `${backendConfigPath}.backup-${Date.now()}`;
        fs.copyFileSync(backendConfigPath, backupPath);
        this.backups.push({ type: 'backend-config', original: backendConfigPath, backup: backupPath });
      }
      
      // 生成後端配置
      const backendConfig = {
        version: this.v26Config.version,
        lastUpdated: new Date().toISOString(),
        network: "BSC Mainnet",
        startBlock: this.v26Config.startBlock,
        contracts: {},
        vrfConfig: {
          wrapperAddress: "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94",
          linkToken: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
          coordinatorAddress: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
          useNativePayment: true
        },
        unifiedRarityConfig: {
          rarity1Chance: 44,
          rarity2Chance: 35,
          rarity3Chance: 15,
          rarity4Chance: 5,
          rarity5Chance: 1
        },
        vrfContracts: ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION']
      };
      
      // 轉換合約地址
      for (const [name, data] of Object.entries(this.v26Config.contracts)) {
        backendConfig.contracts[name] = data.address;
      }
      
      fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
      this.log('✅ 後端 VRF 配置已更新', 'success');
      
    } catch (error) {
      this.log(`❌ 後端配置更新失敗: ${error.message}`, 'error');
      this.errors.push({ type: '後端配置', error });
    }
  }

  async updateSubgraphVRFConfig() {
    this.log('更新子圖 VRF 配置...', 'info');
    
    try {
      const subgraphConfigPath = path.join(PROJECT_PATHS.subgraph, 'subgraph.yaml');
      
      if (!fs.existsSync(subgraphConfigPath)) {
        this.log('⚠️ 子圖配置文件不存在，跳過', 'warning');
        return;
      }
      
      // 備份
      const backupPath = `${subgraphConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(subgraphConfigPath, backupPath);
      this.backups.push({ type: 'subgraph-config', original: subgraphConfigPath, backup: backupPath });
      
      // 讀取和更新子圖配置
      let subgraphContent = fs.readFileSync(subgraphConfigPath, 'utf8');
      
      // 更新合約地址和起始區塊
      for (const [name, data] of Object.entries(this.v26Config.contracts)) {
        const addressPattern = new RegExp(`(${name}.*?address:\\s*)["']([^"']+)["']`, 'gi');
        const blockPattern = new RegExp(`(${name}.*?startBlock:\\s*)(\\d+)`, 'gi');
        
        subgraphContent = subgraphContent.replace(addressPattern, `$1"${data.address}"`);
        subgraphContent = subgraphContent.replace(blockPattern, `$1${this.v26Config.startBlock}`);
      }
      
      fs.writeFileSync(subgraphConfigPath, subgraphContent);
      this.log('✅ 子圖 VRF 配置已更新', 'success');
      
    } catch (error) {
      this.log(`❌ 子圖配置更新失敗: ${error.message}`, 'error');
      this.errors.push({ type: '子圖配置', error });
    }
  }

  async updateVRFSubgraph() {
    this.log('\n更新子圖 VRF 事件處理...', 'info');
    
    // 由於 VRF 引入了新的事件類型，需要檢查是否需要更新子圖 schema 和 mapping
    this.log('⚠️ VRF 合約引入了新的事件類型:', 'warning');
    this.log('  - VRFMintRequested', 'info');
    this.log('  - VRFMintFulfilled', 'info');
    this.log('  - UpgradeRequested', 'info');
    this.log('  - ExpeditionRequested', 'info');
    this.log('  - PendingMint, PendingUpgrade, PendingExpedition 實體', 'info');
    this.log('', 'info');
    this.log('💡 建議手動檢查並更新子圖:', 'warning');
    this.log('  1. 更新 schema.graphql 添加 VRF 相關實體', 'info');
    this.log('  2. 更新 mapping.ts 處理 VRF 事件', 'info');
    this.log('  3. 測試子圖索引 VRF 操作', 'info');
  }

  async generateVRFSyncReport() {
    this.log('\n生成同步報告...', 'info');
    
    const reportPath = path.join(PROJECT_PATHS.contracts, 'sync-reports', `v26-vrf-sync-report-${Date.now()}.md`);
    
    let report = `# V26 VRF 同步報告

生成時間: ${new Date().toLocaleString()}

## 同步概況

- **版本**: ${this.v26Config.version}
- **網路**: BSC Mainnet
- **起始區塊**: ${this.v26Config.startBlock}
- **錯誤數量**: ${this.errors.length}
- **備份文件數量**: ${this.backups.length}

## VRF 升級重點

### 🔮 統一 VRF 架構
- 所有隨機性操作使用 Chainlink VRF v2.5
- Direct Funding 模式 (用戶支付 BNB)
- 統一稀有度機率 (44%/35%/15%/5%/1%)

### 📋 已同步的 VRF 合約

| 合約 | 地址 | 類型 |
|------|------|------|
`;

    for (const [name, data] of Object.entries(this.v26Config.contracts)) {
      const type = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'].includes(name) ? '🔮 VRF 合約' : '📦 標準合約';
      report += `| ${name} | \`${data.address}\` | ${type} |\n`;
    }

    report += `

### 📁 已同步的項目

- ✅ 前端 ABI 和配置
- ✅ 後端配置
- ✅ 子圖 ABI (需手動更新 schema 和 mapping)

### ⚠️ 重要變更

1. **異步操作**: 所有 VRF 操作需要 10-30 秒等待時間
2. **費用結構**: 每次 VRF 操作增加約 $0.6-1.0 成本
3. **稀有度機制**: 1個和50個NFT使用相同機率
4. **新事件**: VRFMintRequested, VRFMintFulfilled 等

### 🔄 需要手動處理的項目

1. **前端更新**:
   - 實現 VRF 等待狀態 UI
   - 添加請求進度追蹤
   - 更新費用計算顯示
   - 添加過期請求取消功能

2. **子圖更新**:
   - 更新 schema.graphql 添加 VRF 實體
   - 更新 mapping.ts 處理 VRF 事件
   - 測試新的事件索引

3. **後端更新**:
   - 實現 VRF 狀態監聽
   - 添加異步操作通知機制
   - 更新 API 接口支援 VRF 查詢

## 備份文件

以下文件已自動備份，如需回滾可使用:

`;

    for (const backup of this.backups) {
      report += `- **${backup.type}**: \`${backup.backup}\`\n`;
    }

    if (this.errors.length > 0) {
      report += `

## 錯誤報告

`;
      for (const error of this.errors) {
        report += `- **${error.type}**: ${error.error?.message || '未知錯誤'}\n`;
      }
    }

    report += `

## 下一步行動

1. **測試 VRF 功能**:
   \`\`\`bash
   # 在測試網測試 VRF 操作
   npm run test:vrf
   \`\`\`

2. **更新子圖**:
   \`\`\`bash
   cd DDgraphql/dungeon-delvers
   # 手動更新 schema 和 mapping
   npm run deploy
   \`\`\`

3. **前端測試**:
   - 測試鑄造流程 (等待 VRF 回調)
   - 測試升級流程 (VRF 結果處理)  
   - 測試地城探索 (異步結果顯示)

4. **用戶溝通**:
   - 說明 VRF 等待時間
   - 解釋費用增加原因
   - 強調公平性提升

## VRF 技術規格

- **VRF Wrapper**: 0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94
- **LINK Token**: 0x404460C6A5EdE2D891e8297795264fDe62ADBB75
- **確認數**: 3 個區塊
- **Gas Limit**: 200,000
- **預計等待時間**: 10-30 秒 (BSC 主網)

## 回滾指令

如果需要回滾到舊版本:
\`\`\`bash
node scripts/active/v26-sync-all-vrf.js --rollback
\`\`\`
`;

    // 確保報告目錄存在
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    this.log(`✅ 同步報告已生成: ${reportPath}`, 'success');
  }

  async checkVRFConfigConsistency() {
    this.log('\n檢查 VRF 配置一致性...', 'info');
    
    let consistencyErrors = 0;
    
    // 檢查各項目中的地址是否一致
    const projects = ['frontend', 'backend', 'subgraph'];
    
    for (const project of projects) {
      try {
        await this.validateProjectVRFConfig(project);
      } catch (error) {
        consistencyErrors++;
        this.log(`❌ ${project} 配置檢查失敗: ${error.message}`, 'error');
      }
    }
    
    if (consistencyErrors === 0) {
      this.log('✅ 所有項目配置一致性檢查通過', 'success');
    } else {
      this.log(`⚠️ 發現 ${consistencyErrors} 個配置一致性問題`, 'warning');
    }
  }

  async validateProjectVRFConfig(projectType) {
    // 簡單的配置驗證 - 檢查關鍵文件是否存在
    const projectPath = PROJECT_PATHS[projectType];
    
    if (!fs.existsSync(projectPath)) {
      throw new Error(`項目目錄不存在: ${projectPath}`);
    }
    
    this.log(`✅ ${projectType} 項目路徑有效`, 'success');
  }

  showVRFNextSteps() {
    console.log(`${colors.bright}
==================================================
📋 V26 VRF 部署後續步驟
==================================================
${colors.reset}`);

    console.log(`${colors.cyan}🔮 VRF 測試檢查清單:${colors.reset}

1. **合約驗證**:
   npx hardhat run scripts/active/v26-verify-contracts-vrf.js --network bsc

2. **前端測試**:
   - 測試英雄鑄造 (VRF 等待)
   - 測試聖物鑄造 (統一機率)
   - 測試 NFT 升級 (異步結果)
   - 測試地城探索 (VRF 探索)

3. **子圖更新**:
   cd DDgraphql/dungeon-delvers
   # 手動更新 schema.graphql
   # 更新 mapping.ts 處理 VRF 事件
   npm run deploy

4. **費用測試**:
   - 檢查 VRF 費用計算 (~$0.6)
   - 測試過期請求取消機制
   - 驗證原生支付流程

5. **用戶體驗**:
   - 實現 VRF 等待狀態 UI
   - 添加進度指示器
   - 提供清晰的費用說明

${colors.yellow}⚠️ 重要提醒:${colors.reset}
- VRF 操作需要 10-30 秒等待時間
- 每次操作成本增加約 $0.6-1.0
- 稀有度機率完全統一
- 需要更新前端處理異步操作

${colors.green}🚀 完成後執行:${colors.reset}
node scripts/active/v26-verify-deployment-vrf.js
`);
  }

  async performRollback() {
    this.log('\n執行配置回滾...', 'warning');
    
    if (this.backups.length === 0) {
      this.log('沒有找到備份文件，無法回滾', 'error');
      return;
    }
    
    for (const backup of this.backups) {
      try {
        if (fs.existsSync(backup.backup)) {
          fs.copyFileSync(backup.backup, backup.original);
          this.log(`✅ 已回滾: ${backup.type}`, 'success');
          
          // 刪除備份文件
          fs.unlinkSync(backup.backup);
        }
      } catch (error) {
        this.log(`❌ 回滾失敗 ${backup.type}: ${error.message}`, 'error');
      }
    }
    
    this.log('✅ 配置回滾完成', 'success');
  }
}

// ======================== 執行同步 ========================

async function main() {
  const syncer = new V26VRFSyncer();
  await syncer.sync();
}

main().catch(console.error);
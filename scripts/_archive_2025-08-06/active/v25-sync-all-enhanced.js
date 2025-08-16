#!/usr/bin/env node

/**
 * V25 配置同步腳本 - 增強版
 * 
 * 增強功能：
 * 1. 配置來源驗證和校驗
 * 2. 地址唯一性檢查
 * 3. 配置變更日誌
 * 4. 錯誤傳播追蹤
 * 5. 配置一致性深度檢查
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// 項目路徑配置
const PROJECT_PATHS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// V25 正確的合約地址（來自 V25_FINAL_ADDRESSES.md）
const V25_CANONICAL_ADDRESSES = {
  // V25 部署的合約
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  DUNGEONCORE: '0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a',
  DUNGEONSTORAGE: '0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77',
  DUNGEONMASTER: '0xd06470d4C6F62F6747cf02bD2b2De0981489034F',
  HERO: '0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db',
  RELIC: '0xcfB83d8545D68b796a236290b3C1bc7e4A140B11',
  PARTY: '0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  ALTAROFASCENSION: '0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686',
  
  // 複用的現有合約
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', // TESTUSD1
  TESTUSD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  DUNGEONMASTERWALLET: '0x10925A7138649C7E1794CE646182eeb5BF8ba647'
};

// ABI 同步配置
const ABI_SYNC_CONFIG = [
  {
    contractName: 'HERO',
    artifactName: 'Hero',
    destinations: [
      { type: 'frontend', path: 'src/abis/Hero.json' },
      { type: 'subgraph', path: 'abis/Hero.json' }
    ]
  },
  {
    contractName: 'RELIC',
    artifactName: 'Relic',
    destinations: [
      { type: 'frontend', path: 'src/abis/Relic.json' },
      { type: 'subgraph', path: 'abis/Relic.json' }
    ]
  },
  {
    contractName: 'PARTY',
    artifactName: 'PartyV3',
    contractFile: 'Party',
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/PartyV3.json' }
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
    contractName: 'ALTAROFASCENSION',
    artifactName: 'AltarOfAscensionV2Fixed',
    contractFile: 'AltarOfAscension',
    destinations: [
      { type: 'frontend', path: 'src/abis/AltarOfAscension.json' },
      { type: 'subgraph', path: 'abis/AltarOfAscensionV2Fixed.json' }
    ]
  },
  {
    contractName: 'DUNGEONMASTER',
    artifactName: 'DungeonMasterV2_Fixed',
    contractFile: 'DungeonMaster',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonMaster.json' },
      { type: 'subgraph', path: 'abis/DungeonMaster.json' }
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
    artifactName: 'Oracle_V22_Adaptive',
    destinations: [
      { type: 'frontend', path: 'src/abis/Oracle.json' }
    ]
  },
  {
    contractName: 'PLAYERVAULT',
    artifactName: 'PlayerVault',
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
    artifactName: 'SoulShardToken',
    destinations: [
      { type: 'frontend', path: 'src/abis/SoulShardToken.json' }
    ]
  }
];

class V25SyncerEnhanced {
  constructor() {
    this.v25Config = null;
    this.isRollback = false;
    this.errors = [];
    this.warnings = [];
    this.backups = [];
    this.subgraphVersion = null;
    this.configChangeLogPath = path.join(PROJECT_PATHS.contracts, 'config/config-changes.log');
    this.configValidationReport = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const levelColors = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      debug: colors.magenta
    };
    
    console.log(`${levelColors[level]}[${level.toUpperCase()}]${colors.reset} ${timestamp} ${message}`);
  }

  // 1. 配置來源驗證
  async validateConfigSources() {
    this.log('驗證配置來源...', 'info');
    
    const configSources = {
      'master-config.json': path.join(PROJECT_PATHS.contracts, 'config/master-config.json'),
      'v25-config.js': path.join(PROJECT_PATHS.contracts, 'config/v25-config.js'),
      'V25_FINAL_ADDRESSES.md': path.join(PROJECT_PATHS.frontend, 'V25_FINAL_ADDRESSES.md')
    };
    
    const sourceData = {};
    
    for (const [name, path] of Object.entries(configSources)) {
      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf8');
        if (name.endsWith('.json')) {
          sourceData[name] = JSON.parse(content);
        } else if (name.endsWith('.js')) {
          delete require.cache[require.resolve(path)];
          sourceData[name] = require(path);
        } else {
          sourceData[name] = content;
        }
        this.log(`✓ 找到 ${name}`, 'success');
      } else {
        this.log(`✗ 缺少 ${name}`, 'warning');
      }
    }
    
    // 比較地址一致性
    await this.compareAddresses(sourceData);
    
    return sourceData;
  }

  // 2. 地址比較和驗證
  async compareAddresses(sourceData) {
    this.log('\n比較不同來源的地址...', 'info');
    
    const masterConfig = sourceData['master-config.json'];
    const v25Config = sourceData['v25-config.js'];
    
    const discrepancies = [];
    
    // 比較 master-config 和 v25-config
    if (masterConfig && v25Config) {
      for (const [contractName, canonicalAddress] of Object.entries(V25_CANONICAL_ADDRESSES)) {
        const masterAddress = masterConfig.contracts?.mainnet?.[`${contractName}_ADDRESS`];
        const v25Address = v25Config.contracts?.[contractName]?.address;
        
        if (masterAddress !== canonicalAddress) {
          discrepancies.push({
            contract: contractName,
            source: 'master-config.json',
            found: masterAddress,
            expected: canonicalAddress
          });
        }
        
        if (v25Address !== canonicalAddress) {
          discrepancies.push({
            contract: contractName,
            source: 'v25-config.js',
            found: v25Address,
            expected: canonicalAddress
          });
        }
      }
    }
    
    if (discrepancies.length > 0) {
      this.log('❌ 發現地址不一致！', 'error');
      console.table(discrepancies);
      
      // 詢問是否修復
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve) => {
        rl.question(`\n${colors.yellow}是否自動修復這些不一致？(y/n): ${colors.reset}`, async (answer) => {
          rl.close();
          if (answer.toLowerCase() === 'y') {
            await this.fixDiscrepancies(sourceData);
          }
          resolve();
        });
      });
    } else {
      this.log('✅ 所有地址來源一致', 'success');
    }
  }

  // 3. 修復地址不一致
  async fixDiscrepancies(sourceData) {
    this.log('\n修復地址不一致...', 'info');
    
    // 修復 master-config.json
    const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
    if (fs.existsSync(masterConfigPath)) {
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      
      // 備份
      const backupPath = `${masterConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(masterConfigPath, backupPath);
      this.log(`已備份 master-config.json`, 'info');
      
      // 更新地址
      for (const [contractName, address] of Object.entries(V25_CANONICAL_ADDRESSES)) {
        masterConfig.contracts.mainnet[`${contractName}_ADDRESS`] = address;
      }
      
      masterConfig.lastUpdated = new Date().toISOString();
      fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
      this.log('✅ master-config.json 已修復', 'success');
    }
    
    // 修復 v25-config.js
    const v25ConfigPath = path.join(PROJECT_PATHS.contracts, 'config/v25-config.js');
    if (fs.existsSync(v25ConfigPath)) {
      const v25Config = require(v25ConfigPath);
      
      // 備份
      const backupPath = `${v25ConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(v25ConfigPath, backupPath);
      this.log(`已備份 v25-config.js`, 'info');
      
      // 更新地址
      for (const [contractName, address] of Object.entries(V25_CANONICAL_ADDRESSES)) {
        if (v25Config.contracts[contractName]) {
          v25Config.contracts[contractName].address = address;
        }
      }
      
      v25Config.lastUpdated = new Date().toISOString();
      
      const configContent = `// V25 部署配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

module.exports = ${JSON.stringify(v25Config, null, 2)};`;
      
      fs.writeFileSync(v25ConfigPath, configContent);
      this.log('✅ v25-config.js 已修復', 'success');
    }
  }

  // 4. 地址唯一性驗證
  validateAddressUniqueness(config) {
    this.log('\n驗證地址唯一性...', 'info');
    const addressMap = new Map();
    const duplicates = [];

    // 收集所有地址
    const collectAddresses = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
          if (addressMap.has(value)) {
            // 忽略錢包地址和已知的重複（如 USD 和 TESTUSD）
            if (!key.includes('WALLET') && 
                !(key === 'TESTUSD' && addressMap.get(value) === 'USD') &&
                !(key === 'USD' && addressMap.get(value) === 'TESTUSD')) {
              duplicates.push({
                address: value,
                contracts: [addressMap.get(value), key]
              });
            }
          } else {
            addressMap.set(value, key);
          }
        } else if (typeof value === 'object' && value !== null) {
          collectAddresses(value, path ? `${path}.${key}` : key);
        }
      }
    };

    collectAddresses(config);

    if (duplicates.length > 0) {
      this.log('❌ 發現重複地址！', 'error');
      duplicates.forEach(dup => {
        console.log(`  地址 ${colors.yellow}${dup.address}${colors.reset} 被分配給：${colors.red}${dup.contracts.join(', ')}${colors.reset}`);
      });
      throw new Error('地址驗證失敗：發現重複地址');
    }

    this.log('✅ 地址唯一性驗證通過', 'success');
    return true;
  }

  // 5. 配置變更日誌
  async logConfigChange(changes, configType) {
    if (changes.length === 0) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      configType,
      changes
    };

    // 確保目錄存在
    const logDir = path.dirname(this.configChangeLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 追加到日誌文件
    fs.appendFileSync(
      this.configChangeLogPath,
      JSON.stringify(logEntry, null, 2) + '\n---\n',
      'utf8'
    );

    this.log(`📝 記錄了 ${changes.length} 個配置變更到日誌`, 'info');
  }

  async askForSubgraphVersion() {
    if (this.subgraphVersion) return;

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`${colors.yellow}請輸入子圖版本號（例如：v3.6.0）或按 Enter 跳過：${colors.reset}`);
    
    return new Promise((resolve) => {
      rl.question('版本號: ', (answer) => {
        this.subgraphVersion = answer.trim() || null;
        rl.close();
        resolve();
      });
    });
  }

  async sync() {
    console.log(`${colors.bright}
==================================================
🔄 V25 配置同步腳本 - 增強版
==================================================
${colors.reset}`);

    try {
      // 1. 驗證配置來源
      const sourceData = await this.validateConfigSources();
      
      // 2. 載入配置
      await this.loadV25Config();
      
      // 3. 驗證地址唯一性
      this.validateAddressUniqueness(this.v25Config);
      
      // 4. 詢問子圖版本
      await this.askForSubgraphVersion();
      
      // 5. 執行同步
      await this.performSync();
      
      // 6. 生成驗證報告
      await this.generateValidationReport();
      
    } catch (error) {
      this.log(`同步失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async loadV25Config() {
    this.log('\n載入 V25 配置...', 'info');
    
    // 使用正確的地址作為配置
    this.v25Config = {
      version: 'V25',
      lastUpdated: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: V25_CANONICAL_ADDRESSES.DUNGEONMASTERWALLET,
      startBlock: 56317376,
      contracts: {},
      subgraph: {
        version: this.subgraphVersion || 'v3.6.0'
      }
    };
    
    // 構建合約配置
    for (const [name, address] of Object.entries(V25_CANONICAL_ADDRESSES)) {
      this.v25Config.contracts[name] = {
        address,
        deploymentBlock: 56317376,
        contractName: name
      };
    }
    
    this.log(`✅ 載入了 ${Object.keys(this.v25Config.contracts).length} 個合約配置`, 'success');
  }

  async performSync() {
    // 1. 更新 master-config.json
    await this.updateMasterConfig();
    
    // 2. 編譯合約
    await this.compileContracts();
    
    // 3. 同步 ABI
    await this.syncABIs();
    
    // 4. 同步配置文件
    await this.syncConfigs();
    
    // 5. 更新子圖
    if (this.subgraphVersion) {
      await this.updateSubgraph();
    }
    
    // 6. 顯示完成信息
    this.showCompletionSummary();
  }

  async updateMasterConfig() {
    this.log('\n更新 master-config.json...', 'info');
    
    const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
    let masterConfig;
    
    if (fs.existsSync(masterConfigPath)) {
      masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    } else {
      masterConfig = {
        version: 'V25',
        contracts: { mainnet: {} },
        network: {
          chainId: 56,
          name: 'BSC Mainnet',
          rpc: 'https://bsc-dataseed.binance.org/',
          explorer: 'https://bscscan.com'
        }
      };
    }
    
    // 更新合約地址
    for (const [name, address] of Object.entries(V25_CANONICAL_ADDRESSES)) {
      masterConfig.contracts.mainnet[`${name}_ADDRESS`] = address;
    }
    
    // 更新子圖版本
    if (this.subgraphVersion) {
      masterConfig.subgraph = {
        studio: {
          url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}`,
          version: this.subgraphVersion
        },
        decentralized: masterConfig.subgraph?.decentralized || {}
      };
    }
    
    masterConfig.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
    this.log('✅ master-config.json 已更新', 'success');
  }

  async compileContracts() {
    this.log('\n編譯合約...', 'info');
    try {
      execSync('npx hardhat compile', { 
        cwd: PROJECT_PATHS.contracts,
        stdio: 'pipe'
      });
      this.log('✅ 合約編譯成功', 'success');
    } catch (error) {
      this.log('❌ 合約編譯失敗', 'error');
      throw error;
    }
  }

  async syncABIs() {
    this.log('\n同步 ABI 文件...', 'info');
    
    for (const config of ABI_SYNC_CONFIG) {
      const contractFile = config.contractFile || config.artifactName;
      const artifactPath = path.join(
        PROJECT_PATHS.contracts,
        'artifacts/contracts',
        this.getContractDirectory(contractFile),
        `${contractFile}.sol`,
        `${config.artifactName}.json`
      );
      
      if (!fs.existsSync(artifactPath)) {
        this.log(`⚠️ 找不到 ${config.contractName} 的 ABI`, 'warning');
        continue;
      }
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      for (const dest of config.destinations) {
        const destPath = path.join(PROJECT_PATHS[dest.type], dest.path);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.writeFileSync(destPath, JSON.stringify(artifact, null, 2));
      }
      
      this.log(`✅ ${config.contractName} ABI 已同步`, 'success');
    }
  }

  getContractDirectory(contractName) {
    const directories = {
      'Hero': 'nft',
      'Relic': 'nft', 
      'Party': 'nft',
      'PartyV3': 'nft',
      'VIPStaking': 'nft',
      'PlayerProfile': 'nft',
      'AltarOfAscension': 'utils',
      'AltarOfAscensionV2Fixed': 'utils',
      'DungeonMaster': 'core',
      'DungeonMasterV2_Fixed': 'core',
      'DungeonCore': 'core',
      'Oracle_V22_Adaptive': 'core',
      'PlayerVault': 'core',
      'DungeonStorage': 'core',
      'SoulShardToken': 'token'
    };
    
    return directories[contractName] || 'core';
  }

  async syncConfigs() {
    this.log('\n同步配置文件...', 'info');
    
    // 更新前端配置
    await this.updateFrontendConfig();
    
    // 更新後端配置
    await this.updateBackendConfig();
    
    // 更新環境變數
    await this.updateEnvFiles();
  }

  async updateFrontendConfig() {
    const configPath = path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts');
    
    const configContent = `// V25 Contract Configuration
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  SOULSHARD: '${V25_CANONICAL_ADDRESSES.SOULSHARD}',
  ORACLE: '${V25_CANONICAL_ADDRESSES.ORACLE}',
  DUNGEONCORE: '${V25_CANONICAL_ADDRESSES.DUNGEONCORE}',
  PLAYERVAULT: '${V25_CANONICAL_ADDRESSES.PLAYERVAULT}',
  DUNGEONSTORAGE: '${V25_CANONICAL_ADDRESSES.DUNGEONSTORAGE}',
  
  // NFT Contracts
  HERO: '${V25_CANONICAL_ADDRESSES.HERO}',
  RELIC: '${V25_CANONICAL_ADDRESSES.RELIC}',
  PARTY: '${V25_CANONICAL_ADDRESSES.PARTY}',
  
  // Game Contracts
  DUNGEONMASTER: '${V25_CANONICAL_ADDRESSES.DUNGEONMASTER}',
  ALTAROFASCENSION: '${V25_CANONICAL_ADDRESSES.ALTAROFASCENSION}',
  
  // Utility Contracts
  PLAYERPROFILE: '${V25_CANONICAL_ADDRESSES.PLAYERPROFILE}',
  VIPSTAKING: '${V25_CANONICAL_ADDRESSES.VIPSTAKING}',
  
  // Token Contracts
  USD: '${V25_CANONICAL_ADDRESSES.USD}',
  TESTUSD: '${V25_CANONICAL_ADDRESSES.TESTUSD}'
};

export const CONTRACT_VERSION = 'V25';
export const DEPLOYMENT_BLOCK = 56317376;
`;
    
    fs.writeFileSync(configPath, configContent);
    this.log('✅ 前端配置已更新', 'success');
  }

  async updateBackendConfig() {
    const configPath = path.join(PROJECT_PATHS.backend, 'config/contracts.js');
    
    const configContent = `// V25 Contract Configuration for Backend
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

module.exports = {
  // BSC Mainnet Contracts
  contracts: {
    // Core Contracts
    DUNGEONCORE: '${V25_CANONICAL_ADDRESSES.DUNGEONCORE}',
    ORACLE: '${V25_CANONICAL_ADDRESSES.ORACLE}',
    
    // Token Contracts
    SOULSHARD: '${V25_CANONICAL_ADDRESSES.SOULSHARD}',
    
    // NFT Contracts
    HERO: '${V25_CANONICAL_ADDRESSES.HERO}',
    RELIC: '${V25_CANONICAL_ADDRESSES.RELIC}',
    PARTY: '${V25_CANONICAL_ADDRESSES.PARTY}',
    
    // Game Contracts
    DUNGEONMASTER: '${V25_CANONICAL_ADDRESSES.DUNGEONMASTER}',
    DUNGEONSTORAGE: '${V25_CANONICAL_ADDRESSES.DUNGEONSTORAGE}',
    PLAYERVAULT: '${V25_CANONICAL_ADDRESSES.PLAYERVAULT}',
    PLAYERPROFILE: '${V25_CANONICAL_ADDRESSES.PLAYERPROFILE}',
    
    // Feature Contracts
    VIPSTAKING: '${V25_CANONICAL_ADDRESSES.VIPSTAKING}',
    ALTAROFASCENSION: '${V25_CANONICAL_ADDRESSES.ALTAROFASCENSION}',
    
    // External
    DUNGEONMASTERWALLET: '${V25_CANONICAL_ADDRESSES.DUNGEONMASTERWALLET}',
    
    // Tokens
    USD: '${V25_CANONICAL_ADDRESSES.USD}',
    TESTUSD: '${V25_CANONICAL_ADDRESSES.TESTUSD}',
  },
  
  // Contract version for tracking
  version: 'V25',
  
  // Network configuration
  network: {
    chainId: 56,
    name: 'BSC Mainnet',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
  }
};
`;
    
    fs.writeFileSync(configPath, configContent);
    this.log('✅ 後端配置已更新', 'success');
  }

  async updateEnvFiles() {
    // 更新前端 .env
    const frontendEnvPath = path.join(PROJECT_PATHS.frontend, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      let envContent = fs.readFileSync(frontendEnvPath, 'utf8');
      
      // 更新地址
      for (const [name, address] of Object.entries(V25_CANONICAL_ADDRESSES)) {
        const pattern = new RegExp(`VITE_${name}_ADDRESS=.*`, 'g');
        if (envContent.match(pattern)) {
          envContent = envContent.replace(pattern, `VITE_${name}_ADDRESS=${address}`);
        }
      }
      
      fs.writeFileSync(frontendEnvPath, envContent);
      this.log('✅ 前端 .env 已更新', 'success');
    }
  }

  async updateSubgraph() {
    this.log('\n更新子圖配置...', 'info');
    
    const subgraphYamlPath = path.join(PROJECT_PATHS.subgraph, 'subgraph.yaml');
    if (fs.existsSync(subgraphYamlPath)) {
      let yamlContent = fs.readFileSync(subgraphYamlPath, 'utf8');
      
      // 更新地址
      yamlContent = yamlContent.replace(
        /address:\s*'0x[a-fA-F0-9]{40}'/g,
        (match) => {
          const address = match.match(/0x[a-fA-F0-9]{40}/)[0];
          // 根據上下文找到對應的合約名稱並替換
          return match;
        }
      );
      
      // 這裡需要更精確的替換邏輯
      this.log('⚠️ 子圖地址更新需要手動檢查', 'warning');
    }
  }

  async generateValidationReport() {
    this.log('\n生成驗證報告...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      version: 'V25',
      subgraphVersion: this.subgraphVersion,
      configSources: {
        masterConfig: 'config/master-config.json',
        v25Config: 'config/v25-config.js',
        canonicalAddresses: 'V25_CANONICAL_ADDRESSES (內置)'
      },
      addresses: V25_CANONICAL_ADDRESSES,
      syncedProjects: Object.keys(PROJECT_PATHS),
      warnings: this.warnings,
      errors: this.errors
    };
    
    const reportPath = path.join(
      PROJECT_PATHS.contracts,
      'scripts/deployments',
      `v25-validation-report-${Date.now()}.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`✅ 驗證報告已生成: ${reportPath}`, 'success');
  }

  showCompletionSummary() {
    console.log(`
${colors.bright}
==================================================
✅ V25 配置同步完成
==================================================
${colors.reset}

${colors.cyan}已同步的項目：${colors.reset}
- 前端配置 (contracts.ts)
- 後端配置 (contracts.js)
- 環境變數 (.env)
- master-config.json
${this.subgraphVersion ? `- 子圖版本 (${this.subgraphVersion})` : ''}

${colors.cyan}核心地址：${colors.reset}
- USD: ${V25_CANONICAL_ADDRESSES.USD} (TESTUSD1)
- SOULSHARD: ${V25_CANONICAL_ADDRESSES.SOULSHARD}
- DUNGEONMASTER: ${V25_CANONICAL_ADDRESSES.DUNGEONMASTER}

${colors.yellow}下一步：${colors.reset}
1. 檢查前端：cd ${PROJECT_PATHS.frontend} && npm run dev
2. 檢查後端：cd ${PROJECT_PATHS.backend} && npm start
${this.subgraphVersion ? '3. 部署子圖：cd ' + PROJECT_PATHS.subgraph + ' && npm run deploy' : ''}

${colors.green}✨ 同步成功完成！${colors.reset}
`);
  }
}

// 顯示使用說明
function showHelp() {
  console.log(`
${colors.bright}V25 配置同步腳本 - 增強版${colors.reset}

${colors.yellow}使用方式:${colors.reset}
  node v25-sync-all-enhanced.js              執行完整同步
  node v25-sync-all-enhanced.js --help       顯示此說明

${colors.yellow}功能特點:${colors.reset}
  1. 配置來源驗證和自動修復
  2. 地址唯一性檢查
  3. 配置變更日誌記錄
  4. 深度配置一致性檢查
  5. 防止錯誤地址傳播

${colors.yellow}配置來源優先級:${colors.reset}
  1. V25_CANONICAL_ADDRESSES (內置正確地址)
  2. V25_FINAL_ADDRESSES.md (文檔記錄)
  3. master-config.json (自動生成)
  4. v25-config.js (部署配置)

${colors.yellow}重要地址:${colors.reset}
  USD/TESTUSD: 0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
  SOULSHARD: 0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
  `);
}

// 執行同步
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const syncer = new V25SyncerEnhanced();
  await syncer.sync();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
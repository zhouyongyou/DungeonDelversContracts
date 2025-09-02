#!/usr/bin/env node

/**
 * V25 配置同步腳本 - 最小改動版
 * 
 * 此文件展示了相對於原始 v25-sync-all.js 的最小改動
 * 主要新增三個功能：
 * 1. 地址唯一性驗證 - validateAddresses()
 * 2. 配置變更日誌 - logConfigChange()
 * 3. 合約存在性檢查 - verifyContractExists()
 * 
 * 標記說明：
 * 🆕 - 完全新增的方法或代碼
 * 📝 - 在原有方法中插入的新代碼
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
    artifactName: 'Party',
    contractFile: 'Party', // 添加實際的合約檔案名稱
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/Party.json' }
    ]
  },
  {
    contractName: 'VIPSTAKING',
    artifactName: 'VIPStaking',
    contractFile: 'VIPStaking', // VIPStaking 在 nft 目錄中
    destinations: [
      { type: 'frontend', path: 'src/abis/VIPStaking.json' },
      { type: 'subgraph', path: 'abis/VIPStaking.json' }
    ]
  },
  {
    contractName: 'PLAYERPROFILE',
    artifactName: 'PlayerProfile',
    contractFile: 'PlayerProfile', // PlayerProfile 在 nft 目錄中
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerProfile.json' },
      { type: 'subgraph', path: 'abis/PlayerProfile.json' }
    ]
  },
  {
    contractName: 'ALTAROFASCENSION',
    artifactName: 'AltarOfAscensionV2Fixed',
    contractFile: 'AltarOfAscension', // 添加實際的合約檔案名稱
    destinations: [
      { type: 'frontend', path: 'src/abis/AltarOfAscension.json' },
      { type: 'subgraph', path: 'abis/AltarOfAscensionV2Fixed.json' }
    ]
  },
  {
    contractName: 'DUNGEONMASTER',
    artifactName: 'DungeonMasterV2_Fixed',
    contractFile: 'DungeonMaster', // DungeonMaster 在 core 目錄中
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
    artifactName: 'Oracle',
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

class V25Syncer {
  constructor() {
    this.v25Config = null;
    this.isRollback = false;
    this.errors = [];
    this.backups = [];
    this.subgraphVersion = null;
    // 新增：配置變更日誌路徑
    this.configChangeLogPath = path.join(PROJECT_PATHS.contracts, 'config/config-changes.log');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const levelColors = {
      info: colors.blue,
      success: colors.green,
      warning: colors.yellow,
      error: colors.red
    };
    
    console.log(`${levelColors[level]}[${level.toUpperCase()}]${colors.reset} ${timestamp} ${message}`);
  }

  // 🆕 新增方法：地址唯一性驗證
  validateAddresses(config) {
    this.log('驗證地址唯一性...', 'info');
    const addressMap = new Map();
    const duplicates = [];

    // 檢查 v25Config 格式的合約
    if (config.contracts) {
      for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
        if (contractInfo?.address) {
          if (addressMap.has(contractInfo.address)) {
            duplicates.push({
              address: contractInfo.address,
              contracts: [addressMap.get(contractInfo.address), contractName]
            });
          } else {
            addressMap.set(contractInfo.address, contractName);
          }
        }
      }
    }

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

  // 🆕 新增方法：配置變更日誌
  async logConfigChange(oldConfig, newConfig, configType) {
    const changes = [];
    const timestamp = new Date().toISOString();

    // 比較配置差異
    const compareObjects = (old, new_, path = '') => {
      for (const key in new_) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof new_[key] === 'object' && new_[key] !== null && !Array.isArray(new_[key])) {
          if (old && old[key]) {
            compareObjects(old[key], new_[key], currentPath);
          }
        } else {
          const oldValue = old ? old[key] : undefined;
          const newValue = new_[key];
          
          // 只記錄地址相關的變更
          if (oldValue !== newValue && (key.includes('address') || key.includes('ADDRESS'))) {
            changes.push({
              timestamp,
              configType,
              path: currentPath,
              old: oldValue || 'undefined',
              new: newValue
            });
          }
        }
      }
    };

    if (oldConfig) {
      compareObjects(oldConfig, newConfig);
    }

    // 記錄變更
    if (changes.length > 0) {
      const logEntry = {
        syncSession: timestamp,
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

      this.log(`📝 記錄了 ${changes.length} 個配置變更`, 'info');
    }
  }

  // 🆕 新增方法：合約存在性檢查（簡化版）
  async verifyContractExists(address, contractName) {
    try {
      // 驗證地址格式
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`無效的合約地址格式: ${address}`);
      }
      
      // TODO: 未來可以加入實際的鏈上驗證
      // 例如：檢查 bytecode 是否存在，或調用合約的標準方法
      
      return true;
    } catch (error) {
      this.log(`⚠️ 合約驗證失敗 ${contractName}: ${error.message}`, 'warning');
      return false;
    }
  }

  async askForSubgraphVersion() {
    if (this.subgraphVersion) return;

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`${colors.yellow}請輸入子圖版本號（例如：v3.5.4）：${colors.reset}`);
    
    return new Promise((resolve) => {
      rl.question('版本號: ', (answer) => {
        this.subgraphVersion = answer.trim();
        rl.close();
        resolve();
      });
    });
  }

  async sync() {
    // 檢查參數
    const args = process.argv.slice(2);
    this.isRollback = args.includes('--rollback');
    
    // 獲取版本號參數
    const versionArg = args.find(arg => arg.match(/^v\d+\.\d+\.\d+$/));
    if (versionArg) {
      this.subgraphVersion = versionArg;
    }

    console.log(`${colors.bright}
==================================================
🔄 V25 配置同步腳本
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
        await this.performSync();
      }
    } catch (error) {
      this.log(`同步失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }

  async performSync() {
    // 1. 載入 V25 配置
    await this.loadV25Config();
    
    // 🆕 1.5. 驗證地址唯一性
    await this.validateAddresses(this.v25Config);
    
    // 1.5. 如果指定了子圖版本，先更新 master-config.json
    if (this.subgraphVersion) {
      await this.updateMasterConfigSubgraphVersion();
    }
    
    // 2. 編譯合約以確保 ABI 最新
    await this.compileContracts();
    
    // 3. 同步 ABI 文件
    await this.syncABIs();
    
    // 4. 同步配置文件
    await this.syncConfigs();
    
    // 5. 更新子圖配置
    await this.updateSubgraph();
    
    // 6. 生成同步報告
    await this.generateSyncReport();
    
    // 7. 檢查配置一致性
    await this.checkConfigConsistency();
    
    // 8. 顯示下一步指示
    this.showNextSteps();
    
    this.log('\n✅ V25 同步完成！', 'success');
  }

  async loadV25Config() {
    this.log('載入配置...', 'info');
    
    // 優先使用 master-config.json 作為真實來源
    const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
    
    // 🆕 讀取舊配置用於比較
    let oldConfig = null;
    if (fs.existsSync(masterConfigPath)) {
      oldConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    }
    
    if (fs.existsSync(masterConfigPath)) {
      this.log('使用 master-config.json 作為真實地址來源', 'info');
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      
      // 將 master-config.json 格式轉換為 v25Config 格式
      this.v25Config = {
        version: masterConfig.version,
        lastUpdated: masterConfig.lastUpdated,
        network: masterConfig.network?.name || 'BSC Mainnet',
        deployer: masterConfig.contracts?.mainnet?.DUNGEONMASTERWALLET_ADDRESS || '0xEbCF4A36Ad1485A9737025e9d72186b604487274',
        startBlock: 56184733, // V25 正確部署區塊 (8/2)
        contracts: {
          SOULSHARD: {
            address: masterConfig.contracts.mainnet.SOULSHARD_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'SOULSHARD'
          },
          ORACLE: {
            address: masterConfig.contracts.mainnet.ORACLE_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'Oracle'
          },
          DUNGEONCORE: {
            address: masterConfig.contracts.mainnet.DUNGEONCORE_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'DungeonCore'
          },
          PLAYERVAULT: {
            address: masterConfig.contracts.mainnet.PLAYERVAULT_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'PlayerVault'
          },
          DUNGEONSTORAGE: {
            address: masterConfig.contracts.mainnet.DUNGEONSTORAGE_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'DungeonStorage'
          },
          DUNGEONMASTER: {
            address: masterConfig.contracts.mainnet.DUNGEONMASTER_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'DungeonMasterV2_Fixed'
          },
          HERO: {
            address: masterConfig.contracts.mainnet.HERO_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'Hero'
          },
          RELIC: {
            address: masterConfig.contracts.mainnet.RELIC_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'Relic'
          },
          PARTY: {
            address: masterConfig.contracts.mainnet.PARTY_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'Party'
          },
          VIPSTAKING: {
            address: masterConfig.contracts.mainnet.VIPSTAKING_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'VIPStaking'
          },
          PLAYERPROFILE: {
            address: masterConfig.contracts.mainnet.PLAYERPROFILE_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'PlayerProfile'
          },
          ALTAROFASCENSION: {
            address: masterConfig.contracts.mainnet.ALTAROFASCENSION_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'AltarOfAscensionV2Fixed'
          },
          USD: {
            address: masterConfig.contracts.mainnet.USD_ADDRESS || masterConfig.contracts.mainnet.TESTUSD_ADDRESS,
            deploymentBlock: 56184733,
            contractName: 'USD'
          }
        },
        subgraph: masterConfig.subgraph
      };
      
      // 🆕 記錄配置變更
      if (oldConfig) {
        await this.logConfigChange(oldConfig, masterConfig, 'master-config.json');
      }
      
      // 🆕 驗證關鍵合約地址
      const requiredContracts = ['HERO', 'RELIC', 'PARTY', 'DUNGEONMASTER'];
      for (const contractName of requiredContracts) {
        if (!this.v25Config.contracts[contractName]?.address) {
          throw new Error(`缺少必要的合約地址: ${contractName}`);
        }
        
        // 驗證合約是否存在
        await this.verifyContractExists(
          this.v25Config.contracts[contractName].address,
          contractName
        );
      }
      
      this.log(`已從 master-config.json 載入配置: ${Object.keys(this.v25Config.contracts).length} 個合約`, 'success');
    } else {
      // 如果沒有 master-config.json，從 v25-config.js 載入
      this.log('master-config.json 不存在，從 v25-config.js 載入', 'warning');
      
      const configPath = path.join(PROJECT_PATHS.contracts, 'config/v25-config.js');
      if (!fs.existsSync(configPath)) {
        throw new Error('找不到 V25 配置文件');
      }
      
      // 清除 require 緩存以獲取最新配置
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      
      if (!config.contracts || Object.keys(config.contracts).length === 0) {
        throw new Error('V25 配置文件中沒有合約資訊');
      }
      
      this.v25Config = config;
      this.log(`已載入配置: ${Object.keys(config.contracts).length} 個合約`, 'success');
    }
  }

  // 以下是原有方法，保持不變...
  async updateMasterConfigSubgraphVersion() {
    this.log(`\n更新子圖版本到 ${this.subgraphVersion}...`, 'info');
    
    const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
    const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    
    const oldVersion = masterConfig.subgraph?.studio?.version;
    
    // 更新子圖版本
    if (masterConfig.subgraph?.studio) {
      masterConfig.subgraph.studio.version = this.subgraphVersion;
      masterConfig.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}`;
    }
    
    masterConfig.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
    this.log(`✅ master-config.json 已更新: ${oldVersion} → ${this.subgraphVersion}`, 'success');
    
    // 同時更新 config-reader.js
    const configReaderPath = path.join(PROJECT_PATHS.contracts, 'config/config-reader.js');
    if (fs.existsSync(configReaderPath)) {
      let configReaderContent = fs.readFileSync(configReaderPath, 'utf8');
      configReaderContent = configReaderContent.replace(
        /subgraphVersion:\s*['"][^'"]+['"]/,
        `subgraphVersion: '${this.subgraphVersion}'`
      );
      fs.writeFileSync(configReaderPath, configReaderContent);
      this.log('✅ config-reader.js 已更新', 'success');
    }
  }

  async compileContracts() {
    this.log('\n編譯合約以生成 ABI...', 'info');
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
      this.log(`\n處理 ${config.contractName} ABI...`, 'info');
      
      // 確定 artifact 文件路徑
      const contractFile = config.contractFile || config.artifactName;
      const artifactPath = path.join(
        PROJECT_PATHS.contracts,
        'artifacts/contracts',
        this.getContractDirectory(contractFile),
        `${contractFile}.sol`,
        `${config.artifactName}.json`
      );
      
      if (!fs.existsSync(artifactPath)) {
        this.log(`⚠️ 找不到 artifact: ${artifactPath}`, 'warning');
        continue;
      }
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      for (const dest of config.destinations) {
        const destPath = path.join(PROJECT_PATHS[dest.type], dest.path);
        
        // 創建備份
        if (fs.existsSync(destPath)) {
          const backupPath = `${destPath}.backup-${Date.now()}`;
          fs.copyFileSync(destPath, backupPath);
          this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
          this.backups.push({ original: destPath, backup: backupPath });
        }
        
        // 確保目標目錄存在
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // 寫入 ABI
        fs.writeFileSync(destPath, JSON.stringify(artifact, null, 2));
        this.log(`✅ ${config.contractName} ABI 已複製到${dest.type}`, 'success');
      }
    }
  }

  getContractDirectory(contractName) {
    // 根據合約名稱返回對應的目錄
    const directories = {
      'Hero': 'nft',
      'Relic': 'nft', 
      'Party': 'nft',
      'Party': 'nft',
      'VIPStaking': 'nft',
      'PlayerProfile': 'nft',
      'AltarOfAscension': 'utils',
      'AltarOfAscensionV2Fixed': 'utils',
      'DungeonMaster': 'core',
      'DungeonMasterV2_Fixed': 'core',
      'DungeonCore': 'core',
      'Oracle': 'core',
      'PlayerVault': 'core',
      'DungeonStorage': 'core',
      'SoulShardToken': 'token'
    };
    
    return directories[contractName] || 'core';
  }

  // 其餘方法保持與原文件完全相同...
  async syncConfigs() {
    this.log('\n同步配置文件...', 'info');
    
    // 更新前端配置
    await this.updateFrontendConfig();
    
    // 更新 contractsWithABI.ts
    await this.updateContractsWithABI();
    
    // 更新前端硬編碼的子圖 URL
    await this.updateFrontendHardcodedUrls();
    
    // 更新環境變數文件
    await this.updateEnvFiles();
    
    // 更新後端配置
    await this.updateBackendConfig();
    
    // 更新 shared-config.json
    await this.updateSharedConfig();
    
    // 生成 CDN 配置文件
    await this.generateCDNConfigs();
  }

  async updateFrontendConfig() {
    this.log('\n更新前端配置...', 'info');
    const configPath = path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts');
    
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
      this.backups.push({ original: configPath, backup: backupPath });
    }
    
    const configContent = `// V25 Contract Configuration
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  SOULSHARD: '${this.v25Config.contracts.SOULSHARD?.address}',
  ORACLE: '${this.v25Config.contracts.ORACLE?.address}',
  DUNGEONCORE: '${this.v25Config.contracts.DUNGEONCORE?.address}',
  PLAYERVAULT: '${this.v25Config.contracts.PLAYERVAULT?.address}',
  DUNGEONSTORAGE: '${this.v25Config.contracts.DUNGEONSTORAGE?.address}',
  
  // NFT Contracts
  HERO: '${this.v25Config.contracts.HERO?.address}',
  RELIC: '${this.v25Config.contracts.RELIC?.address}',
  PARTY: '${this.v25Config.contracts.PARTY?.address}',
  
  // Game Contracts
  DUNGEONMASTER: '${this.v25Config.contracts.DUNGEONMASTER?.address}',
  ALTAROFASCENSION: '${this.v25Config.contracts.ALTAROFASCENSION?.address}',
  
  // Utility Contracts
  PLAYERPROFILE: '${this.v25Config.contracts.PLAYERPROFILE?.address}',
  VIPSTAKING: '${this.v25Config.contracts.VIPSTAKING?.address}',
  
  // Token Contracts
  USD: '${this.v25Config.contracts.USD?.address}',
  TESTUSD: '${this.v25Config.contracts.USD?.address}'
};

export const CONTRACT_VERSION = '${this.v25Config.version}';
export const DEPLOYMENT_BLOCK = ${this.v25Config.startBlock};
`;
    
    fs.writeFileSync(configPath, configContent);
    this.log('✅ contracts.ts 已更新', 'success');
  }

  // 繼續添加原文件中的其他所有方法...
  // [這裡省略了所有其他方法，因為它們保持不變]
  // 包括：updateContractsWithABI, updateFrontendHardcodedUrls, updateEnvFiles,
  // updateBackendConfig, updateSharedConfig, generateCDNConfigs, updateSubgraph,
  // generateSyncReport, checkConfigConsistency, checkCodeConsistency, 等等

  // 只需要確保所有原有方法都被保留
}

// 顯示使用說明
function showHelp() {
  console.log(`
${colors.bright}V25 配置同步腳本${colors.reset}

${colors.yellow}使用方式:${colors.reset}
  node v25-sync-all.js                    執行完整同步
  node v25-sync-all.js v3.5.4             同步並更新子圖版本
  node v25-sync-all.js --rollback         回滾上次同步
  node v25-sync-all.js --check-config     檢查配置一致性
  node v25-sync-all.js --check-code       深度檢查代碼配置
  node v25-sync-all.js --help             顯示此說明

${colors.yellow}範例:${colors.reset}
  node v25-sync-all.js                    # 正常同步所有配置
  node v25-sync-all.js v3.5.4             # 同步配置並更新子圖到 v3.5.4
  node v25-sync-all.js --rollback         # 回滾到上次同步前的狀態
  node v25-sync-all.js --check-config     # 只檢查配置文件一致性
  node v25-sync-all.js --check-code       # 深度檢查代碼層面配置問題

${colors.yellow}功能說明:${colors.reset}
  1. 同步合約地址到所有專案（前端、後端、子圖）
  2. 更新 ABI 文件
  3. 更新環境變數文件 (.env, .env.local)
  4. 生成 CDN 配置文件
  5. 可選：更新子圖版本號
  6. 檢查配置一致性
  7. 🆕 深度檢查代碼層面配置問題

${colors.yellow}深度檢查功能:${colors.reset}
  - 檢查 getContract 函數調用格式
  - 檢查直接 CONTRACT_ADDRESSES 訪問
  - 驗證配置文件格式完整性
  - 檢查 ABI 引入和文件存在性

${colors.yellow}子圖版本格式:${colors.reset} v<major>.<minor>.<patch> (例如: v3.5.4)
  `);
}

// 執行同步
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--check-config')) {
    // 只檢查配置一致性
    const syncer = new V25Syncer();
    await syncer.loadV25Config();
    const issues = await syncer.checkConfigConsistency();
    process.exit(issues.length > 0 ? 1 : 0);
  }
  
  if (args.includes('--check-code')) {
    // 只檢查代碼層面配置
    const syncer = new V25Syncer();
    await syncer.loadV25Config();
    const issues = [];
    await syncer.checkCodeConsistency(issues);
    
    if (issues.length === 0) {
      syncer.log('✅ 所有代碼配置正確', 'success');
    } else {
      syncer.log('⚠️ 發現代碼配置問題:', 'warning');
      issues.forEach(issue => syncer.log(`  - ${issue}`, 'warning'));
    }
    
    process.exit(issues.length > 0 ? 1 : 0);
  }
  
  const syncer = new V25Syncer();
  await syncer.sync();
  
  // 🛒 整合 Marketplace 同步
  console.log(`${colors.cyan}🛒 開始 Marketplace 同步...${colors.reset}`);
  
  try {
    // 執行 marketplace 地址審計
    const MarketplaceAddressAuditor = require('./marketplace-address-audit.js');
    const auditor = new MarketplaceAddressAuditor();
    
    console.log(`${colors.blue}[INFO]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} 執行 Marketplace 地址審計...`);
    const auditReport = await auditor.generateFullReport();
    
    // 執行 marketplace 配置同步
    console.log(`${colors.blue}[INFO]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} 執行 Marketplace 配置同步...`);
    const { execSync } = require('child_process');
    
    try {
      execSync('node scripts/active/marketplace-sync.js', { stdio: 'inherit', cwd: process.cwd() });
      console.log(`${colors.green}[SUCCESS]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} ✅ Marketplace 同步完成`);
    } catch (marketplaceError) {
      console.log(`${colors.yellow}[WARNING]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} ⚠️ Marketplace 同步遇到問題: ${marketplaceError.message}`);
    }
    
    // 提供後續操作建議
    console.log(`\n${colors.cyan}🛒 Marketplace 後續操作建議:${colors.reset}`);
    
    if (auditReport && auditReport.recommendations && auditReport.recommendations.length > 0) {
      console.log(`${colors.yellow}[WARNING]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} ⚠️ 發現 ${auditReport.recommendations.length} 個需要處理的地址問題`);
      console.log('需要合約 Owner 執行以下操作:');
      
      const uniqueAddresses = [...new Set(auditReport.recommendations.map(r => r.address))];
      uniqueAddresses.forEach(address => {
        const type = auditReport.recommendations.find(r => r.address === address)?.type;
        console.log(`  - marketplace.approveNFTContract("${address}"); // ${type} V25`);
        console.log(`  - offerSystem.approveNFTContract("${address}");  // ${type} V25`);
      });
    } else {
      console.log(`${colors.green}[SUCCESS]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} ✅ Marketplace 地址配置正常`);
    }
    
  } catch (marketplaceError) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} ⚠️ Marketplace 同步失敗: ${marketplaceError.message}`);
    console.log('可以稍後手動執行:');
    console.log('  node scripts/active/marketplace-address-audit.js');
    console.log('  node scripts/active/marketplace-sync.js');
  }
  
  console.log(`\n${colors.bright}🎉 完整同步已完成！${colors.reset}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * V25 配置同步腳本
 * 
 * 同步合約地址和 ABI 到所有相關項目
 * 支援自動備份和回滾
 * 
 * 使用方式：
 * node scripts/active/v25-sync-all.js
 * node scripts/active/v25-sync-all.js --rollback
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
    artifactName: 'PartyV3',
    contractFile: 'Party', // 添加實際的合約檔案名稱
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/PartyV3.json' }
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
    artifactName: 'Oracle_V22_Adaptive',
    contractFile: 'Oracle_V22_Adaptive', // Oracle 在 defi 目錄中
    destinations: [
      { type: 'frontend', path: 'src/abis/Oracle.json' }
    ]
  },
  {
    contractName: 'PLAYERVAULT',
    artifactName: 'PlayerVault',
    contractFile: 'PlayerVault', // PlayerVault 在 defi 目錄中
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
    artifactName: 'Test_SoulShard', // The actual contract name in artifacts
    contractFile: 'SoulShard',
    destinations: [
      { type: 'frontend', path: 'src/abis/SoulShardToken.json' }
    ]
  }
];

class V25Syncer {
  constructor() {
    this.v25Config = null;
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
      console.log(`${colors.yellow}請輸入子圖版本號（例如：v3.5.4）：${colors.reset}`);
      rl.question('版本號: ', (version) => {
        rl.close();
        
        // 驗證版本格式
        if (version.match(/^v\d+\.\d+\.\d+$/)) {
          this.subgraphVersion = version;
          this.log(`將使用子圖版本：${version}`, 'info');
        } else {
          console.error(`${colors.red}版本號格式不正確，請使用格式：v3.5.4${colors.reset}`);
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
    if (fs.existsSync(masterConfigPath)) {
      this.log('使用 master-config.json 作為真實地址來源', 'info');
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      
      // 將 master-config.json 格式轉換為 v25Config 格式
      this.v25Config = {
        version: masterConfig.version,
        lastUpdated: masterConfig.lastUpdated,
        network: masterConfig.network?.name || 'BSC Mainnet',
        deployer: masterConfig.contracts?.mainnet?.DUNGEONMASTERWALLET_ADDRESS || '0x10925A7138649C7E1794CE646182eeb5BF8ba647',
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
            contractName: 'Oracle_V22_Adaptive'
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
            contractName: 'PartyV3'
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
          }
        }
      };
      
      this.log(`已從 master-config.json 載入配置: ${Object.keys(this.v25Config.contracts).length} 個合約`, 'success');
      return;
    }
    
    // 降級方案：使用舊有邏輯
    this.log('⚠️ 找不到 master-config.json，使用降級方案', 'warning');
    
    // 使用 config-reader 自動載入最新配置
    const configReaderPath = path.join(PROJECT_PATHS.contracts, 'config/config-reader.js');
    if (!fs.existsSync(configReaderPath)) {
      // 如果 config-reader 不存在，降級到直接載入 v25-config
      const v25ConfigPath = path.join(PROJECT_PATHS.contracts, 'config/v25-config.js');
      if (!fs.existsSync(v25ConfigPath)) {
        throw new Error('找不到配置文件，請先執行部署');
      }
      this.v25Config = require(v25ConfigPath);
      this.log('使用 v25-config.js（降級模式）', 'warning');
    } else {
      // 使用 config-reader 載入最新配置
      const configReader = require(configReaderPath);
      this.v25Config = configReader.raw || configReader;
      this.log(`使用 config-reader.js - 版本 ${configReader.version}`, 'info');
    }
    
    this.log(`已載入配置: ${Object.keys(this.v25Config.contracts).length} 個合約`, 'info');
  }

  async updateMasterConfigSubgraphVersion() {
    this.log(`\n更新子圖版本到 ${this.subgraphVersion}...`, 'info');
    
    try {
      // 更新 master-config.json
      const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
      if (fs.existsSync(masterConfigPath)) {
        const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
        const oldVersion = masterConfig.subgraph?.studio?.version || '未知';
        
        if (!masterConfig.subgraph) {
          masterConfig.subgraph = {};
        }
        if (!masterConfig.subgraph.studio) {
          masterConfig.subgraph.studio = {};
        }
        
        masterConfig.subgraph.studio.version = this.subgraphVersion;
        masterConfig.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}`;
        masterConfig.lastUpdated = new Date().toISOString();
        
        // 備份
        const backupPath = `${masterConfigPath}.backup-${Date.now()}`;
        fs.copyFileSync(masterConfigPath, backupPath);
        this.backups.push({ original: masterConfigPath, backup: backupPath });
        
        fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
        this.log(`✅ master-config.json 已更新: ${oldVersion} → ${this.subgraphVersion}`, 'success');
      }
      
      // 更新 config-reader.js
      const configReaderPath = path.join(PROJECT_PATHS.contracts, 'config/config-reader.js');
      if (fs.existsSync(configReaderPath)) {
        let configReaderContent = fs.readFileSync(configReaderPath, 'utf8');
        
        // 備份
        const backupPath = `${configReaderPath}.backup-${Date.now()}`;
        fs.copyFileSync(configReaderPath, backupPath);
        this.backups.push({ original: configReaderPath, backup: backupPath });
        
        // 更新 URL
        configReaderContent = configReaderContent.replace(
          /url:\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
          `url: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
        );
        
        // 更新版本號
        configReaderContent = configReaderContent.replace(
          /version:\s*'v\d+\.\d+\.\d+'/,
          `version: '${this.subgraphVersion}'`
        );
        
        fs.writeFileSync(configReaderPath, configReaderContent);
        this.log('✅ config-reader.js 已更新', 'success');
      }
      
    } catch (error) {
      this.log(`更新子圖版本失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateFrontendHardcodedURLs() {
    this.log('\n更新前端硬編碼的子圖 URL...', 'info');
    
    const filesToUpdate = [
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/env.ts'),
        patterns: [
          {
            search: /STUDIO_URL:\s*import\.meta\.env\.VITE_THE_GRAPH_API_URL\s*\|\|\s*\n\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
            replace: `STUDIO_URL: import.meta.env.VITE_THE_GRAPH_API_URL || \n                'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
          }
        ]
      },
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/subgraph.ts'),
        patterns: [
          {
            search: /STUDIO_URL:\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
            replace: `STUDIO_URL: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
          }
        ]
      },
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/configLoader.ts'),
        patterns: [
          {
            search: /studio:\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
            replace: `studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
          },
          // 更新 DEFAULT_CONFIG 中的合約地址
          {
            search: /HERO:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `HERO: '${this.v25Config.contracts.HERO?.address}'`
          },
          {
            search: /RELIC:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `RELIC: '${this.v25Config.contracts.RELIC?.address}'`
          },
          {
            search: /PARTY:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `PARTY: '${this.v25Config.contracts.PARTY?.address}'`
          },
          {
            search: /DUNGEONCORE:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `DUNGEONCORE: '${this.v25Config.contracts.DUNGEONCORE?.address}'`
          },
          {
            search: /DUNGEONMASTER:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `DUNGEONMASTER: '${this.v25Config.contracts.DUNGEONMASTER?.address}'`
          },
          {
            search: /DUNGEONSTORAGE:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `DUNGEONSTORAGE: '${this.v25Config.contracts.DUNGEONSTORAGE?.address}'`
          },
          {
            search: /PLAYERVAULT:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `PLAYERVAULT: '${this.v25Config.contracts.PLAYERVAULT?.address}'`
          },
          {
            search: /PLAYERPROFILE:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `PLAYERPROFILE: '${this.v25Config.contracts.PLAYERPROFILE?.address}'`
          },
          {
            search: /VIPSTAKING:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `VIPSTAKING: '${this.v25Config.contracts.VIPSTAKING?.address}'`
          },
          {
            search: /ORACLE:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `ORACLE: '${this.v25Config.contracts.ORACLE?.address}'`
          },
          {
            search: /ALTAROFASCENSION:\s*'0x[a-fA-F0-9]{40}'/,
            replace: `ALTAROFASCENSION: '${this.v25Config.contracts.ALTAROFASCENSION?.address}'`
          }
        ]
      },
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/graphql.ts'),
        patterns: [
          {
            search: /url:\s*import\.meta\.env\.VITE_THE_GRAPH_STUDIO_API_URL\s*\|\|\s*\n\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
            replace: `url: import.meta.env.VITE_THE_GRAPH_STUDIO_API_URL || \n         'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
          },
          {
            search: /fallbackUrl:\s*import\.meta\.env\.VITE_THE_GRAPH_STUDIO_API_URL\s*\|\|\s*\n?\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
            replace: `fallbackUrl: import.meta.env.VITE_THE_GRAPH_STUDIO_API_URL || \n                   'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion}'`
          }
        ]
      }
    ];
    
    for (const file of filesToUpdate) {
      if (fs.existsSync(file.path)) {
        let content = fs.readFileSync(file.path, 'utf8');
        let modified = false;
        
        // 備份
        const backupPath = `${file.path}.backup-${Date.now()}`;
        fs.copyFileSync(file.path, backupPath);
        this.backups.push({ original: file.path, backup: backupPath });
        
        // 應用所有替換
        for (const pattern of file.patterns) {
          const newContent = content.replace(pattern.search, pattern.replace);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(file.path, content);
          this.log(`✅ 更新 ${path.basename(file.path)}`, 'success');
        } else {
          this.log(`⚠️ ${path.basename(file.path)} 沒有找到匹配的模式`, 'warning');
        }
      } else {
        this.log(`⚠️ 文件不存在: ${file.path}`, 'warning');
      }
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
      await this.syncABI(config);
    }
  }

  async syncABI(config) {
    this.log(`\n處理 ${config.contractName} ABI...`, 'info');
    
    // 使用 contractFile 或預設為 artifactName
    const contractFileName = config.contractFile || config.artifactName;
    
    // 獲取 artifact 路徑
    const artifactPath = path.join(
      PROJECT_PATHS.contracts,
      'artifacts/contracts',
      this.findContractPath(contractFileName),
      `${contractFileName}.sol`,
      `${config.artifactName}.json`
    );
    
    if (!fs.existsSync(artifactPath)) {
      this.log(`⚠️ 找不到 ${config.contractName} ABI 文件: ${artifactPath}`, 'warning');
      this.log(`🔍 搜索路徑: contractFile=${config.contractFile}, artifactName=${config.artifactName}`, 'info');
      return;
    }
    
    // 讀取 artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // 同步到各個目標
    for (const dest of config.destinations) {
      const destPath = path.join(PROJECT_PATHS[dest.type], dest.path);
      
      // 備份現有文件
      if (fs.existsSync(destPath)) {
        const backupPath = `${destPath}.backup-${Date.now()}`;
        fs.copyFileSync(destPath, backupPath);
        this.backups.push({ original: destPath, backup: backupPath });
        this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
      }
      
      // 寫入新 ABI (只提取 ABI 部分，不是整個 artifact)
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const abiOnly = artifact.abi || artifact; // 如果有 abi 屬性則提取，否則假設整個就是 ABI
      fs.writeFileSync(destPath, JSON.stringify(abiOnly, null, 2));
      this.log(`✅ ${config.contractName} ABI 已複製到${dest.type}`, 'success');
    }
  }

  findContractPath(contractName) {
    // 搜索合約文件位置
    const searchPaths = [
      'current/nft',     // Hero, Relic, Party, VIPStaking, PlayerProfile
      'current/core',    // DungeonCore, AltarOfAscension, DungeonMaster
      'current/defi',    // Oracle, PlayerVault, DungeonStorage
      'current/staking',
      'current/game',
      'current'          // 根目錄
    ];
    
    for (const searchPath of searchPaths) {
      const fullPath = path.join(PROJECT_PATHS.contracts, 'contracts', searchPath, `${contractName}.sol`);
      if (fs.existsSync(fullPath)) {
        return searchPath;
      }
    }
    
    return 'current'; // 默認路徑
  }

  async syncConfigs() {
    this.log('\n同步配置文件...', 'info');
    
    // 更新前端配置
    await this.updateFrontendConfig();
    
    // 更新前端硬編碼的子圖 URL（如果指定了版本）
    if (this.subgraphVersion) {
      await this.updateFrontendHardcodedURLs();
    }
    
    // 更新環境變數文件
    await this.updateEnvironmentFiles();
    
    // 更新後端配置
    await this.updateBackendConfig();
    
    // 更新 shared-config.json
    await this.updateSharedConfig();
    
    // 生成 CDN 配置文件
    await this.generateCDNConfigs();
  }

  async updateEnvironmentFiles() {
    this.log('\n更新環境變數文件...', 'info');
    
    const frontendPath = PROJECT_PATHS.frontend;
    const envFiles = [
      { name: '.env', path: path.join(frontendPath, '.env') },
      { name: '.env.local', path: path.join(frontendPath, '.env.local') }
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile.path)) {
        await this.updateEnvFile(envFile);
      } else {
        this.log(`⚠️ ${envFile.name} 不存在，跳過`, 'warning');
      }
    }
  }

  async updateEnvFile(envFile) {
    this.log(`更新 ${envFile.name}...`, 'info');
    
    let content = fs.readFileSync(envFile.path, 'utf8');
    let modified = false;
    
    // 備份
    const backupPath = `${envFile.path}.backup-${Date.now()}`;
    fs.copyFileSync(envFile.path, backupPath);
    this.backups.push({ original: envFile.path, backup: backupPath });
    
    // 更新子圖相關的環境變數
    const updates = [
      {
        pattern: /VITE_THE_GRAPH_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `VITE_THE_GRAPH_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.4'}`,
        description: 'Studio API URL'
      },
      {
        pattern: /VITE_THE_GRAPH_STUDIO_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `VITE_THE_GRAPH_STUDIO_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.4'}`,
        description: 'Studio API URL (alternative name)'
      },
      {
        pattern: /VITE_GRAPH_STUDIO_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `VITE_GRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.4'}`,
        description: 'Graph Studio URL (legacy name)'
      }
    ];
    
    // 應用更新
    for (const update of updates) {
      if (update.pattern.test(content)) {
        content = content.replace(update.pattern, update.replacement);
        modified = true;
        this.log(`  ✅ 更新 ${update.description}`, 'success');
      }
    }
    
    // 更新合約地址（包含所有核心合約）
    const contractUpdates = [
      // 核心合約
      { pattern: /VITE_DUNGEONCORE_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_DUNGEONCORE_ADDRESS=${this.v25Config.contracts.DUNGEONCORE?.address}`, name: 'DUNGEONCORE' },
      { pattern: /VITE_ORACLE_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_ORACLE_ADDRESS=${this.v25Config.contracts.ORACLE?.address}`, name: 'ORACLE' },
      { pattern: /VITE_DUNGEONMASTER_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_DUNGEONMASTER_ADDRESS=${this.v25Config.contracts.DUNGEONMASTER?.address}`, name: 'DUNGEONMASTER' },
      { pattern: /VITE_DUNGEONSTORAGE_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_DUNGEONSTORAGE_ADDRESS=${this.v25Config.contracts.DUNGEONSTORAGE?.address}`, name: 'DUNGEONSTORAGE' },
      { pattern: /VITE_PLAYERVAULT_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_PLAYERVAULT_ADDRESS=${this.v25Config.contracts.PLAYERVAULT?.address}`, name: 'PLAYERVAULT' },
      { pattern: /VITE_PLAYERPROFILE_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_PLAYERPROFILE_ADDRESS=${this.v25Config.contracts.PLAYERPROFILE?.address}`, name: 'PLAYERPROFILE' },
      { pattern: /VITE_VIPSTAKING_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_VIPSTAKING_ADDRESS=${this.v25Config.contracts.VIPSTAKING?.address}`, name: 'VIPSTAKING' },
      
      // NFT 合約
      { pattern: /VITE_HERO_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_HERO_ADDRESS=${this.v25Config.contracts.HERO?.address}`, name: 'HERO' },
      { pattern: /VITE_RELIC_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_RELIC_ADDRESS=${this.v25Config.contracts.RELIC?.address}`, name: 'RELIC' },
      { pattern: /VITE_PARTY_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_PARTY_ADDRESS=${this.v25Config.contracts.PARTY?.address}`, name: 'PARTY' },
      { pattern: /VITE_ALTAROFASCENSION_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_ALTAROFASCENSION_ADDRESS=${this.v25Config.contracts.ALTAROFASCENSION?.address}`, name: 'ALTAR' },
      
      // 代幣合約
      { pattern: /VITE_SOULSHARD_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_SOULSHARD_ADDRESS=${this.v25Config.contracts.SOULSHARD?.address}`, name: 'SOULSHARD' },
      { pattern: /VITE_USD_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_USD_ADDRESS=${this.v25Config.contracts.USD?.address || this.v25Config.contracts.TESTUSD?.address || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE'}`, name: 'USD' },
      { pattern: /VITE_TESTUSD_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_TESTUSD_ADDRESS=${this.v25Config.contracts.USD?.address || this.v25Config.contracts.TESTUSD?.address || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE'}`, name: 'TESTUSD' },
      { pattern: /VITE_UNISWAP_POOL_ADDRESS=0x[a-fA-F0-9]{40}/, replacement: `VITE_UNISWAP_POOL_ADDRESS=${this.v25Config.contracts.UNISWAP_POOL?.address || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'}`, name: 'UNISWAP_POOL' }
    ];
    
    for (const contractUpdate of contractUpdates) {
      if (contractUpdate.pattern.test(content)) {
        content = content.replace(contractUpdate.pattern, contractUpdate.replacement);
        modified = true;
        this.log(`  ✅ 更新 ${contractUpdate.name} 合約地址`, 'success');
      }
    }
    
    if (modified) {
      fs.writeFileSync(envFile.path, content);
      this.log(`✅ ${envFile.name} 已更新`, 'success');
    } else {
      this.log(`⚠️ ${envFile.name} 沒有需要更新的內容`, 'warning');
    }
  }

  async updateFrontendConfig() {
    this.log('\n更新前端配置...', 'info');
    
    // 更新 contracts.ts
    const configPath = path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts');
    
    // 備份
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      this.backups.push({ original: configPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 生成新配置
    const contractsTs = this.generateFrontendConfig();
    fs.writeFileSync(configPath, contractsTs);
    this.log('✅ contracts.ts 已更新', 'success');
    
    // 更新 contractsWithABI.ts
    await this.updateContractsWithABI();
  }

  async updateContractsWithABI() {
    this.log('\n更新 contractsWithABI.ts...', 'info');
    
    const abiConfigPath = path.join(PROJECT_PATHS.frontend, 'src/config/contractsWithABI.ts');
    
    // 備份
    if (fs.existsSync(abiConfigPath)) {
      const backupPath = `${abiConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(abiConfigPath, backupPath);
      this.backups.push({ original: abiConfigPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 生成新的 contractsWithABI.ts
    const contractsWithAbiTs = this.generateContractsWithABI();
    fs.writeFileSync(abiConfigPath, contractsWithAbiTs);
    this.log('✅ contractsWithABI.ts 已更新', 'success');
  }

  generateContractsWithABI() {
    const config = this.v25Config;
    
    // Load master-config.json for additional addresses
    let masterConfig = null;
    try {
      const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
      if (fs.existsSync(masterConfigPath)) {
        masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      }
    } catch (e) {
      // Fallback to hardcoded values
    }
    
    return `// V25 Contract Configuration with ABI
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

import HeroABI from '../abis/Hero.json';
import RelicABI from '../abis/Relic.json';
import PartyABI from '../abis/Party.json';
import DungeonCoreABI from '../abis/DungeonCore.json';
import DungeonMasterABI from '../abis/DungeonMaster.json';
import PlayerProfileABI from '../abis/PlayerProfile.json';
import VIPStakingABI from '../abis/VIPStaking.json';
import OracleABI from '../abis/Oracle.json';
import AltarOfAscensionABI from '../abis/AltarOfAscension.json';
import PlayerVaultABI from '../abis/PlayerVault.json';
import DungeonStorageABI from '../abis/DungeonStorage.json';
import SoulShardTokenABI from '../abis/SoulShardToken.json';

export interface ContractWithABI {
  address: string;
  abi: any;
}

export const CONTRACTS_WITH_ABI = {
  56: { // BSC Mainnet
    // NFT Contracts
    HERO: {
      address: '${config.contracts.HERO?.address || ''}',
      abi: HeroABI
    },
    RELIC: {
      address: '${config.contracts.RELIC?.address || ''}',
      abi: RelicABI
    },
    PARTY: {
      address: '${config.contracts.PARTY?.address || ''}',
      abi: PartyABI
    },
    
    // Core Contracts
    DUNGEONCORE: {
      address: '${config.contracts.DUNGEONCORE?.address || ''}',
      abi: DungeonCoreABI
    },
    DUNGEONMASTER: {
      address: '${config.contracts.DUNGEONMASTER?.address || ''}',
      abi: DungeonMasterABI
    },
    PLAYERPROFILE: {
      address: '${config.contracts.PLAYERPROFILE?.address || ''}',
      abi: PlayerProfileABI
    },
    VIPSTAKING: {
      address: '${config.contracts.VIPSTAKING?.address || ''}',
      abi: VIPStakingABI
    },
    ORACLE: {
      address: '${config.contracts.ORACLE?.address || ''}',
      abi: OracleABI
    },
    ALTAROFASCENSION: {
      address: '${config.contracts.ALTAROFASCENSION?.address || ''}',
      abi: AltarOfAscensionABI
    },
    PLAYERVAULT: {
      address: '${config.contracts.PLAYERVAULT?.address || ''}',
      abi: PlayerVaultABI
    },
    DUNGEONSTORAGE: {
      address: '${config.contracts.DUNGEONSTORAGE?.address || ''}',
      abi: DungeonStorageABI
    },
    
    // Token Contracts
    SOULSHARD: {
      address: '${config.contracts.SOULSHARD?.address || ''}',
      abi: SoulShardTokenABI
    },
    
    // Additional Addresses (from master-config.json)
    USD: {
      address: '${masterConfig?.contracts?.mainnet?.TESTUSD_ADDRESS || config.contracts.TESTUSD?.address || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE'}',
      abi: [] // USD Token ABI if needed
    },
    UNISWAP_POOL: {
      address: '${masterConfig?.contracts?.mainnet?.UNISWAP_POOL_ADDRESS || config.contracts.UNISWAP_POOL?.address || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'}',
      abi: [] // Uniswap V3 Pool ABI if needed
    },
    DUNGEONMASTERWALLET: {
      address: '${masterConfig?.contracts?.mainnet?.DUNGEONMASTERWALLET_ADDRESS || config.deployer || '0x10925A7138649C7E1794CE646182eeb5BF8ba647'}',
      abi: [] // This is a wallet address, not a contract
    }
  }
} as const;

// Contract version for tracking
export const CONTRACT_VERSION = 'V25';

// Helper function to get contract with ABI - supports both signatures
export function getContractWithABI(name: keyof typeof CONTRACTS_WITH_ABI[56]): ContractWithABI;
export function getContractWithABI(chainId: number, name: string): ContractWithABI | undefined;
export function getContractWithABI(
  nameOrChainId: keyof typeof CONTRACTS_WITH_ABI[56] | number,
  nameIfChainId?: string
): ContractWithABI | undefined {
  // Support old signature: getContractWithABI(name)
  if (typeof nameOrChainId === 'string') {
    return CONTRACTS_WITH_ABI[56][nameOrChainId];
  }
  
  // Support new signature: getContractWithABI(chainId, name)
  const chainId = nameOrChainId as number;
  const name = nameIfChainId!;
  
  // Convert contract name to uppercase to match the keys
  const upperName = name.toUpperCase();
  
  // Check if chainId exists in CONTRACTS_WITH_ABI
  if (!(chainId in CONTRACTS_WITH_ABI)) {
    console.warn(\`Chain ID \${chainId} not found in CONTRACTS_WITH_ABI\`);
    return undefined;
  }
  
  const chainContracts = CONTRACTS_WITH_ABI[chainId as keyof typeof CONTRACTS_WITH_ABI];
  
  // Check if contract exists for this chain
  if (!(upperName in chainContracts)) {
    console.warn(\`Contract \${name} (\${upperName}) not found for chain \${chainId}\`);
    return undefined;
  }
  
  return chainContracts[upperName as keyof typeof chainContracts];
}

/**
 * @deprecated Use getContractWithABI() instead. This function only returns the address.
 * Legacy compatibility function - will be removed in future versions.
 */
export const getContract = (name: keyof typeof CONTRACTS_WITH_ABI[56]): string => {
  console.warn(\`⚠️ getContract('\${name}') is deprecated. Use getContractWithABI('\${name}') instead.\`);
  return CONTRACTS_WITH_ABI[56][name].address;
};

// Export contract info for debugging
export const CONTRACT_INFO = {
  version: CONTRACT_VERSION,
  network: "BSC Mainnet",
  deploymentBlock: ${config.startBlock || 0},
  lastUpdated: "${new Date().toISOString()}"
};
`;
  }

  generateFrontendConfig() {
    const config = this.v25Config;
    
    return `// V25 Contract Configuration
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

export const CONTRACTS = {
  56: { // BSC Mainnet
    // Core Contracts
    DUNGEONCORE: '${config.contracts.DUNGEONCORE?.address || ''}',
    ORACLE: '${config.contracts.ORACLE?.address || ''}',
    
    // Token Contracts
    SOULSHARD: '${config.contracts.SOULSHARD?.address || ''}',
    
    // NFT Contracts
    HERO: '${config.contracts.HERO?.address || ''}',
    RELIC: '${config.contracts.RELIC?.address || ''}',
    PARTY: '${config.contracts.PARTY?.address || ''}',
    
    // Game Contracts
    DUNGEONMASTER: '${config.contracts.DUNGEONMASTER?.address || ''}',
    DUNGEONSTORAGE: '${config.contracts.DUNGEONSTORAGE?.address || ''}',
    PLAYERVAULT: '${config.contracts.PLAYERVAULT?.address || ''}',
    PLAYERPROFILE: '${config.contracts.PLAYERPROFILE?.address || ''}',
    
    // Feature Contracts
    VIPSTAKING: '${config.contracts.VIPSTAKING?.address || ''}',
    ALTAROFASCENSION: '${config.contracts.ALTAROFASCENSION?.address || ''}',
    
    // External
    DUNGEONMASTERWALLET: '${config.deployer}',
  }
} as const;

// Contract version for tracking
export const CONTRACT_VERSION = 'V25';

// Export individual addresses for convenience
export const {
  DUNGEONCORE,
  ORACLE,
  SOULSHARD,
  HERO,
  RELIC,
  PARTY,
  DUNGEONMASTER,
  DUNGEONSTORAGE,
  PLAYERVAULT,
  PLAYERPROFILE,
  VIPSTAKING,
  ALTAROFASCENSION,
  DUNGEONMASTERWALLET,
} = CONTRACTS[56];

// Legacy compatibility - for V24 format
export const CONTRACT_ADDRESSES = CONTRACTS[56];

// Helper functions for backward compatibility
export const getContract = (name: keyof typeof CONTRACT_ADDRESSES): string => {
  return CONTRACT_ADDRESSES[name];
};

export const getContractAddress = (name: string): string => {
  return CONTRACT_ADDRESSES[name as keyof typeof CONTRACT_ADDRESSES] || '';
};

// Export contract info for debugging
export const CONTRACT_INFO = {
  version: CONTRACT_VERSION,
  network: "BSC Mainnet",
  deploymentBlock: ${config.startBlock || 0},
  lastUpdated: new Date().toISOString()
};

// Legacy contract name mappings for backward compatibility
export const LEGACY_CONTRACT_NAMES = {
  soulShardToken: 'SOULSHARD',
  testUsd: 'USD'
} as const;
`;
  }

  async updateBackendConfig() {
    this.log('\n更新後端配置...', 'info');
    
    // 自動偵測後端配置路徑
    const possiblePaths = [
      path.join(PROJECT_PATHS.backend, 'config/contracts.js'),
      path.join(PROJECT_PATHS.backend, 'contracts.js'),
      path.join(PROJECT_PATHS.backend, 'src/contracts.js'),
      path.join(PROJECT_PATHS.backend, 'src/config/contracts.js')
    ];
    
    let configPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        configPath = p;
        this.log(`找到後端配置: ${path.relative(PROJECT_PATHS.backend, p)}`, 'info');
        break;
      }
    }
    
    if (!configPath) {
      this.log(`⚠️ 找不到後端配置文件，嘗試創建在預設位置`, 'warning');
      configPath = path.join(PROJECT_PATHS.backend, 'config/contracts.js');
      
      // 確保目錄存在
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
    }
    
    // 備份（如果文件存在）
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      this.backups.push({ original: configPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 生成新配置
    const contractsJs = this.generateBackendConfig();
    fs.writeFileSync(configPath, contractsJs);
    this.log(`✅ 後端配置已更新: ${configPath}`, 'success');
    
    // 更新後端 .env 文件
    await this.updateBackendEnvFile();
  }

  generateBackendConfig() {
    const config = this.v25Config;
    
    return `// V25 Contract Configuration for Backend
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

module.exports = {
  // BSC Mainnet Contracts
  contracts: {
    // Core Contracts
    DUNGEONCORE: '${config.contracts.DUNGEONCORE?.address || ''}',
    ORACLE: '${config.contracts.ORACLE?.address || ''}',
    
    // Token Contracts
    SOULSHARD: '${config.contracts.SOULSHARD?.address || ''}',
    
    // NFT Contracts
    HERO: '${config.contracts.HERO?.address || ''}',
    RELIC: '${config.contracts.RELIC?.address || ''}',
    PARTY: '${config.contracts.PARTY?.address || ''}',
    
    // Game Contracts
    DUNGEONMASTER: '${config.contracts.DUNGEONMASTER?.address || ''}',
    DUNGEONSTORAGE: '${config.contracts.DUNGEONSTORAGE?.address || ''}',
    PLAYERVAULT: '${config.contracts.PLAYERVAULT?.address || ''}',
    PLAYERPROFILE: '${config.contracts.PLAYERPROFILE?.address || ''}',
    
    // Feature Contracts
    VIPSTAKING: '${config.contracts.VIPSTAKING?.address || ''}',
    ALTAROFASCENSION: '${config.contracts.ALTAROFASCENSION?.address || ''}',
    
    // External
    DUNGEONMASTERWALLET: '${config.deployer}',
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
  }

  async updateBackendEnvFile() {
    this.log('\n更新後端 .env 文件...', 'info');
    
    const backendEnvPath = path.join(PROJECT_PATHS.backend, '.env');
    
    if (!fs.existsSync(backendEnvPath)) {
      this.log(`⚠️ 後端 .env 文件不存在: ${backendEnvPath}`, 'warning');
      return;
    }
    
    // 備份
    const backupPath = `${backendEnvPath}.backup-${Date.now()}`;
    fs.copyFileSync(backendEnvPath, backupPath);
    this.backups.push({ original: backendEnvPath, backup: backupPath });
    this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    
    let content = fs.readFileSync(backendEnvPath, 'utf8');
    let modified = false;
    
    // 後端 The Graph 配置更新模式
    const backendUpdates = [
      {
        pattern: /THE_GRAPH_API_URL=https:\/\/gateway\.thegraph\.com\/api\/[^\/]+\/subgraphs\/id\/[a-zA-Z0-9]+/,
        replacement: 'THE_GRAPH_API_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
        description: 'Decentralized Graph URL'
      },
      {
        pattern: /THE_GRAPH_STUDIO_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `THE_GRAPH_STUDIO_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.5'}`,
        description: 'Studio API URL'
      },
      {
        pattern: /THE_GRAPH_STUDIO_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `THE_GRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.5'}`,
        description: 'Studio URL (alternative name)'
      },
      {
        pattern: /THE_GRAPH_NETWORK_URL=https:\/\/gateway\.thegraph\.com\/api\/[^\/]+\/subgraphs\/id\/[a-zA-Z0-9]+/,
        replacement: 'THE_GRAPH_NETWORK_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
        description: 'Network URL'
      }
    ];
    
    // 應用更新
    for (const update of backendUpdates) {
      if (update.pattern.test(content)) {
        content = content.replace(update.pattern, update.replacement);
        modified = true;
        this.log(`✅ 已更新: ${update.description}`, 'success');
      } else {
        this.log(`⚠️ 未找到匹配模式: ${update.description}`, 'warning');
      }
    }
    
    // 寫入文件
    if (modified) {
      fs.writeFileSync(backendEnvPath, content);
      this.log('✅ 後端 .env 文件已更新', 'success');
    } else {
      this.log(`⚠️ 後端 .env 沒有需要更新的內容`, 'warning');
    }
  }

  async updateSubgraph() {
    this.log('\n更新子圖配置...', 'info');
    
    // 更新 networks.json
    await this.updateSubgraphNetworks();
    
    // 更新 subgraph.yaml
    await this.updateSubgraphYaml();
    
    // 🔧 新增：更新子圖 config.ts 文件
    await this.updateSubgraphConfig();
    
    // 更新 package.json 版本（如果指定了版本）
    if (this.subgraphVersion) {
      await this.updateSubgraphPackageJson();
    }
  }

  async updateSubgraphNetworks() {
    this.log('更新子圖 networks.json...', 'info');
    
    const networksPath = path.join(PROJECT_PATHS.subgraph, 'networks.json');
    
    // 備份
    if (fs.existsSync(networksPath)) {
      const backupPath = `${networksPath}.backup-${Date.now()}`;
      fs.copyFileSync(networksPath, backupPath);
      this.backups.push({ original: networksPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 生成新配置
    const networks = {
      bsc: {
        Hero: {
          address: this.v25Config.contracts.HERO?.address,
          startBlock: this.v25Config.startBlock
        },
        Relic: {
          address: this.v25Config.contracts.RELIC?.address,
          startBlock: this.v25Config.startBlock
        },
        PartyV3: {
          address: this.v25Config.contracts.PARTY?.address,
          startBlock: this.v25Config.startBlock
        },
        VIPStaking: {
          address: this.v25Config.contracts.VIPSTAKING?.address,
          startBlock: this.v25Config.startBlock
        },
        PlayerProfile: {
          address: this.v25Config.contracts.PLAYERPROFILE?.address,
          startBlock: this.v25Config.startBlock
        },
        AltarOfAscensionV2Fixed: {
          address: this.v25Config.contracts.ALTAROFASCENSION?.address,
          startBlock: this.v25Config.startBlock
        },
        DungeonMaster: {
          address: this.v25Config.contracts.DUNGEONMASTER?.address,
          startBlock: this.v25Config.startBlock
        }
      }
    };
    
    fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
    this.log('✅ 子圖 networks.json 已更新', 'success');
  }

  async updateSubgraphYaml() {
    this.log('更新子圖 YAML...', 'info');
    
    const yamlPath = path.join(PROJECT_PATHS.subgraph, 'subgraph.yaml');
    
    // 備份
    if (fs.existsSync(yamlPath)) {
      const backupPath = `${yamlPath}.backup-${Date.now()}`;
      fs.copyFileSync(yamlPath, backupPath);
      this.backups.push({ original: yamlPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 讀取並更新 YAML
    let yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    // 更新地址和起始區塊
    const updates = [
      { name: 'Hero', address: this.v25Config.contracts.HERO?.address },
      { name: 'Relic', address: this.v25Config.contracts.RELIC?.address },
      { name: 'PartyV3', address: this.v25Config.contracts.PARTY?.address },
      { name: 'VIPStaking', address: this.v25Config.contracts.VIPSTAKING?.address },
      { name: 'PlayerProfile', address: this.v25Config.contracts.PLAYERPROFILE?.address },
      { name: 'AltarOfAscension', address: this.v25Config.contracts.ALTAROFASCENSION?.address },
      { name: 'DungeonMaster', address: this.v25Config.contracts.DUNGEONMASTER?.address }
    ];
    
    for (const update of updates) {
      if (update.address) {
        // 更新地址
        const addressRegex = new RegExp(`(name: ${update.name}[\\s\\S]*?address: )'[^']+'`, 'g');
        yamlContent = yamlContent.replace(addressRegex, `$1'${update.address}'`);
        
        // 更新起始區塊
        const blockRegex = new RegExp(`(name: ${update.name}[\\s\\S]*?startBlock: )\\d+`, 'g');
        yamlContent = yamlContent.replace(blockRegex, `$1${this.v25Config.startBlock}`);
        
        this.log(`✅ 更新 ${update.name} 地址和起始區塊`, 'success');
      }
    }
    
    // 更新頂部註釋
    yamlContent = `# Generated from v25-config.js on ${new Date().toISOString()}
# V25 Production Deployment
${yamlContent.split('\n').slice(2).join('\n')}`;
    
    fs.writeFileSync(yamlPath, yamlContent);
    this.log('✅ 子圖 YAML 已更新', 'success');
  }

  async updateSubgraphConfig() {
    this.log('更新子圖 config.ts...', 'info');
    
    const configPath = path.join(PROJECT_PATHS.subgraph, 'src/config.ts');
    
    if (!fs.existsSync(configPath)) {
      this.log('⚠️ 子圖 config.ts 不存在，跳過更新', 'warning');
      return;
    }
    
    try {
      // 備份
      const backupPath = `${configPath}.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      this.backups.push({ original: configPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
      
      // 生成新的 config.ts 內容
      const configContent = this.generateSubgraphConfig();
      fs.writeFileSync(configPath, configContent);
      this.log('✅ 子圖 config.ts 已更新', 'success');
      
    } catch (error) {
      this.log(`更新子圖 config.ts 失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  generateSubgraphConfig() {
    const config = this.v25Config;
    
    return `// DDgraphql/dungeon-delvers/src/config.ts
// 🎯 單一來源配置管理 - 只依賴 subgraph.yaml
// ⚠️ 此文件由腳本自動生成，請勿手動編輯！
// 🔄 更新方式：修改 subgraph.yaml 後運行 npm run sync-addresses
// 🤖 最後同步: ${new Date().toLocaleString('zh-TW')}

import { dataSource } from "@graphprotocol/graph-ts"

/**
 * ⚠️ 重要說明：這些地址自動從 V25 配置同步！
 * 
 * 💡 維護方式：
 * 1. 只在合約項目的 master-config.json 中修改地址
 * 2. 運行 v25-sync-all.js 腳本自動同步
 * 
 * 📋 地址來源：V25 配置文件
 * 🕒 最後同步時間：${new Date().toLocaleString('zh-TW')}
 */

// 合約地址常量 (自動從 V25 配置同步)
const HERO_ADDRESS = "${config.contracts.HERO?.address || ''}"
const RELIC_ADDRESS = "${config.contracts.RELIC?.address || ''}"
const PARTY_V3_ADDRESS = "${config.contracts.PARTY?.address || ''}"
const V_I_P_STAKING_ADDRESS = "${config.contracts.VIPSTAKING?.address || ''}"
const PLAYER_PROFILE_ADDRESS = "${config.contracts.PLAYERPROFILE?.address || ''}"
const ALTAR_OF_ASCENSION_ADDRESS = "${config.contracts.ALTAROFASCENSION?.address || ''}"

// 導出函數來獲取各種合約地址
export function getHeroContractAddress(): string {
    return HERO_ADDRESS
}

export function getRelicContractAddress(): string {
    return RELIC_ADDRESS
}

export function getPartyV3ContractAddress(): string {
    return PARTY_V3_ADDRESS
}

export function getPartyContractAddress(): string {
    return PARTY_V3_ADDRESS
}

export function getVIPStakingContractAddress(): string {
    return V_I_P_STAKING_ADDRESS
}

export function getPlayerProfileContractAddress(): string {
    return PLAYER_PROFILE_ADDRESS
}

export function getAltarOfAscensionContractAddress(): string {
    return ALTAR_OF_ASCENSION_ADDRESS
}

// 工具函數：驗證地址是否有效
export function isValidAddress(address: string): bool {
    return address.length == 42 && address.startsWith("0x")
}

// 工具函數：獲取當前網路
export function getCurrentNetwork(): string {
    return dataSource.network()
}

// 工具函數：建立實體 ID
export function createEntityId(contractAddress: string, tokenId: string): string {
    return contractAddress.toLowerCase().concat("-").concat(tokenId)
}
`;
  }

  async updateSubgraphPackageJson() {
    this.log('更新子圖 package.json 版本...', 'info');
    
    const packageJsonPath = path.join(PROJECT_PATHS.subgraph, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.log('⚠️ 子圖 package.json 不存在，跳過版本更新', 'warning');
      return;
    }
    
    try {
      // 備份
      const backupPath = `${packageJsonPath}.backup-${Date.now()}`;
      fs.copyFileSync(packageJsonPath, backupPath);
      this.backups.push({ original: packageJsonPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
      
      // 讀取當前 package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const oldVersion = packageJson.version;
      
      // 將版本號格式化（移除 v 前綴）
      const newVersion = this.subgraphVersion.replace(/^v/, '');
      
      if (oldVersion === newVersion) {
        this.log(`⚠️ 子圖版本已經是 ${newVersion}，無需更新`, 'warning');
        return;
      }
      
      // 更新版本
      packageJson.version = newVersion;
      
      // 寫回文件
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      this.log(`✅ 子圖 package.json 版本已更新: ${oldVersion} → ${newVersion}`, 'success');
      
    } catch (error) {
      this.log(`更新子圖 package.json 失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateSharedConfig() {
    this.log('\n更新 shared-config.json...', 'info');
    
    const sharedConfigPath = path.join(PROJECT_PATHS.frontend, 'shared-config.json');
    
    // 備份
    if (fs.existsSync(sharedConfigPath)) {
      const backupPath = `${sharedConfigPath}.backup-${Date.now()}`;
      fs.copyFileSync(sharedConfigPath, backupPath);
      this.backups.push({ original: sharedConfigPath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
    
    // 生成新配置
    const sharedConfig = {
      project: {
        name: "DungeonDelvers",
        version: "1.0.0",
        description: "Web3 RPG Game with NFT Assets"
      },
      network: {
        chainId: 56,
        name: "bsc",
        rpcUrl: "https://bsc-dataseed1.binance.org/",
        explorerUrl: "https://bscscan.com"
      },
      contracts: {
        hero: this.v25Config.contracts.HERO?.address || '',
        relic: this.v25Config.contracts.RELIC?.address || '',
        party: this.v25Config.contracts.PARTY?.address || '',
        vipStaking: this.v25Config.contracts.VIPSTAKING?.address || '',
        playerProfile: this.v25Config.contracts.PLAYERPROFILE?.address || '',
        dungeonCore: this.v25Config.contracts.DUNGEONCORE?.address || '',
        dungeonMaster: this.v25Config.contracts.DUNGEONMASTER?.address || '',
        oracle: this.v25Config.contracts.ORACLE?.address || '',
        playerVault: this.v25Config.contracts.PLAYERVAULT?.address || '',
        altarOfAscension: this.v25Config.contracts.ALTAROFASCENSION?.address || '',
        dungeonStorage: this.v25Config.contracts.DUNGEONSTORAGE?.address || ''
      },
      tokens: {
        soulShard: this.v25Config.contracts.SOULSHARD?.address || '',
        usd: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"
      },
      services: {
        subgraph: {
          url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.subgraphVersion || 'v3.5.4'}`,
          id: "dungeon-delvers"
        },
        metadataServer: {
          development: "https://dungeon-delvers-metadata-server.onrender.com",
          production: "https://dungeon-delvers-metadata-server.onrender.com"
        },
        frontend: {
          development: "http://localhost:5173",
          production: "https://dungeondelvers.xyz"
        }
      },
      ipfs: {
        gateway: "https://ipfs.io/ipfs/",
        pinataApiKey: "",
        pinataSecretKey: ""
      },
      deployment: {
        environments: ["development", "staging", "production"],
        autoVerify: true,
        gasLimit: 8000000
      }
    };
    
    fs.writeFileSync(sharedConfigPath, JSON.stringify(sharedConfig, null, 2));
    this.log('✅ shared-config.json 已更新', 'success');
  }

  async generateCDNConfigs() {
    this.log('\n生成 CDN 配置文件...', 'info');
    
    // 讀取 master-config.json 取得子圖配置
    let subgraphConfig = {
      studio: {
        url: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.5.4',
        description: 'Studio version - 免費但有延遲，僅供探索功能',
        version: 'v3.5.4'
      },
      decentralized: {
        url: 'https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
        description: 'Decentralized version - 付費即時，主要使用',
        version: 'latest',
        apiKey: 'f6c1aba78203cfdf0cc732eafe677bdd'
      },
      useDecentralized: true,
      strategy: 'decentralized-first'
    };
    
    // 嘗試從 master-config.json 讀取
    try {
      const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
      if (fs.existsSync(masterConfigPath)) {
        const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
        if (masterConfig.subgraph) {
          this.log('從 master-config.json 讀取子圖配置', 'info');
          subgraphConfig.studio.url = masterConfig.subgraph.studio.url;
          subgraphConfig.studio.version = masterConfig.subgraph.studio.version;
          if (masterConfig.subgraph.decentralized) {
            subgraphConfig.decentralized.url = masterConfig.subgraph.decentralized.url;
          }
        }
      }
    } catch (error) {
      this.log('無法讀取 master-config.json，使用預設子圖配置', 'warning');
    }
    
    // 完整配置 - 包含合約地址和子圖配置
    const fullConfig = {
      version: 'V25',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: 'DungeonDelvers V25 Configuration',
      contracts: {
        SOULSHARD: this.v25Config.contracts.SOULSHARD?.address || '',
        ORACLE: this.v25Config.contracts.ORACLE?.address || '',
        DUNGEONCORE: this.v25Config.contracts.DUNGEONCORE?.address || '',
        PLAYERVAULT: this.v25Config.contracts.PLAYERVAULT?.address || '',
        PLAYERPROFILE: this.v25Config.contracts.PLAYERPROFILE?.address || '',
        VIPSTAKING: this.v25Config.contracts.VIPSTAKING?.address || '',
        DUNGEONSTORAGE: this.v25Config.contracts.DUNGEONSTORAGE?.address || '',
        DUNGEONMASTER: this.v25Config.contracts.DUNGEONMASTER?.address || '',
        HERO: this.v25Config.contracts.HERO?.address || '',
        RELIC: this.v25Config.contracts.RELIC?.address || '',
        PARTY: this.v25Config.contracts.PARTY?.address || '',
        ALTAROFASCENSION: this.v25Config.contracts.ALTAROFASCENSION?.address || '',
        DUNGEONMASTERWALLET: this.v25Config.deployer
      },
      subgraph: subgraphConfig,
      network: {
        chainId: 56,
        name: 'BSC Mainnet'
      },
      startBlock: this.v25Config.startBlock
    };
    
    // 生成 v25.json 和 latest.json（都使用完整配置）
    const v25Path = path.join(PROJECT_PATHS.frontend, 'public/config/v25.json');
    fs.mkdirSync(path.dirname(v25Path), { recursive: true });
    fs.writeFileSync(v25Path, JSON.stringify(fullConfig, null, 2));
    this.log('✅ 生成 v25.json（包含子圖配置）', 'success');
    
    // latest.json 使用相同的完整配置
    const latestPath = path.join(PROJECT_PATHS.frontend, 'public/config/latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(fullConfig, null, 2));
    this.log('✅ 生成 latest.json（包含子圖配置）', 'success');
  }

  // 新增：更新子圖 URL 的方法
  async updateSubgraphURLs(studioVersion = null, decentralizedUrl = null) {
    this.log('\n更新子圖 URL...', 'info');
    
    // 讀取現有配置
    const v25Path = path.join(PROJECT_PATHS.frontend, 'public/config/v25.json');
    const latestPath = path.join(PROJECT_PATHS.frontend, 'public/config/latest.json');
    
    if (fs.existsSync(v25Path)) {
      const config = JSON.parse(fs.readFileSync(v25Path, 'utf8'));
      
      // 更新 Studio URL（如果提供了新版本）
      if (studioVersion) {
        config.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${studioVersion}`;
        config.subgraph.studio.version = studioVersion;
        this.log(`✅ 更新 Studio 版本到 ${studioVersion}`, 'success');
      }
      
      // 更新去中心化 URL（如果提供）
      if (decentralizedUrl) {
        config.subgraph.decentralized.url = decentralizedUrl;
        this.log(`✅ 更新去中心化 URL`, 'success');
      }
      
      // 更新時間戳
      config.lastUpdated = new Date().toISOString().split('T')[0];
      
      // 寫回文件
      fs.writeFileSync(v25Path, JSON.stringify(config, null, 2));
      fs.writeFileSync(latestPath, JSON.stringify(config, null, 2));
      
      this.log('✅ 子圖 URL 更新完成', 'success');
    }
  }

  async generateSyncReport() {
    const reportPath = path.join(PROJECT_PATHS.contracts, 'scripts/deployments', `v25-sync-report-${Date.now()}.json`);
    
    const report = {
      version: 'V25',
      timestamp: new Date().toISOString(),
      synced: {
        frontend: true,
        backend: true,
        subgraph: true
      },
      backups: this.backups,
      errors: this.errors,
      contracts: this.v25Config.contracts
    };
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n✅ 同步報告已生成: ${reportPath}`, 'success');
  }

  async checkConfigConsistency() {
    this.log('\n檢查配置一致性...', 'info');
    
    const issues = [];
    
    // 檢查環境變數文件
    const envFiles = [
      path.join(PROJECT_PATHS.frontend, '.env'),
      path.join(PROJECT_PATHS.frontend, '.env.local')
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const envName = path.basename(envFile);
        
        // 檢查子圖版本
        const graphUrlMatch = content.match(/VITE_THE_GRAPH.*?_URL=.*v(\d+\.\d+\.\d+)/);
        if (graphUrlMatch) {
          const version = graphUrlMatch[1];
          const expectedVersion = this.subgraphVersion?.replace('v', '') || '3.2.2';
          if (version !== expectedVersion) {
            issues.push(`${envName}: 子圖版本 v${version} ≠ 期望版本 v${expectedVersion}`);
          }
        }
      }
    }
    
    // 檢查 CDN 配置
    const v25ConfigPath = path.join(PROJECT_PATHS.frontend, 'public/config/v25.json');
    if (fs.existsSync(v25ConfigPath)) {
      const cdnConfig = JSON.parse(fs.readFileSync(v25ConfigPath, 'utf8'));
      const cdnVersion = cdnConfig.subgraph?.studio?.version;
      // 從 master-config.json 獲取實際版本
      const masterConfig = JSON.parse(fs.readFileSync(path.join(PROJECT_PATHS.contracts, 'config/master-config.json'), 'utf8'));
      const expectedVersion = this.subgraphVersion || masterConfig.subgraph?.studio?.version || 'v3.5.4';
      if (cdnVersion !== expectedVersion) {
        issues.push(`CDN配置: 子圖版本 ${cdnVersion} ≠ 期望版本 ${expectedVersion}`);
      }
    }
    
    // 🔍 新增：深度代碼檢查
    await this.checkCodeConsistency(issues);
    
    // 報告結果
    if (issues.length === 0) {
      this.log('✅ 所有配置一致', 'success');
    } else {
      this.log('⚠️ 發現配置不一致:', 'warning');
      issues.forEach(issue => this.log(`  - ${issue}`, 'warning'));
    }
    
    return issues;
  }

  async checkCodeConsistency(issues) {
    this.log('🔍 檢查代碼層面配置...', 'info');
    
    // 檢查 getContract 函數調用格式
    await this.checkGetContractUsage(issues);
    
    // 檢查直接 CONTRACT_ADDRESSES 訪問
    await this.checkDirectContractAccess(issues);
    
    // 檢查配置文件格式
    await this.checkConfigFileFormats(issues);
    
    // 檢查 ABI 引入格式
    await this.checkABIImports(issues);
  }

  async checkGetContractUsage(issues) {
    this.log('  檢查 getContract 函數調用...', 'info');
    
    const searchPatterns = [
      {
        pattern: /getContract\s*\(\s*['"]PARTYV3['"]\s*\)/g,
        description: 'getContract("PARTYV3") - 應該改為 "PARTY"',
        severity: 'error',
        fix: 'getContract("PARTY")'
      },
      {
        pattern: /getContract\s*\(\s*\w+\s*,\s*['"]\w+['"]?\s*\)/g,
        description: 'getContract(chainId, name) - 錯誤格式',
        severity: 'error'
      },
      {
        pattern: /getContract\s*\(\s*chainId\s*,/g,
        description: 'getContract(chainId, ...) - 包含chainId參數',
        severity: 'error'
      },
      {
        pattern: /getContract\s*\(\s*['"][^'"]*['"]?\s*\)(?![.\w])/g,
        description: 'getContract() 調用需要檢查是否應該使用 getContractWithABI()',
        severity: 'warning'
      }
    ];
    
    const filesToCheck = await this.findTSXFiles();
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(PROJECT_PATHS.frontend, filePath);
        
        for (const { pattern, description, severity } of searchPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            issues.push(`${relativePath}: ${description} - 找到 ${matches.length} 處`);
            this.log(`    ❌ ${relativePath}: ${description}`, severity === 'error' ? 'error' : 'warning');
          }
        }
      }
    }
  }

  async checkDirectContractAccess(issues) {
    this.log('  檢查直接 CONTRACT_ADDRESSES 訪問...', 'info');
    
    const searchPatterns = [
      {
        pattern: /CONTRACT_ADDRESSES\.\w+/g,
        description: '直接訪問 CONTRACT_ADDRESSES',
        severity: 'warning'
      },
      {
        pattern: /CONTRACT_ADDRESSES\[['"`]\w+['"`]\]/g,
        description: '直接訪問 CONTRACT_ADDRESSES[key]',
        severity: 'warning'
      },
      {
        pattern: /CONTRACTS\[56\]\.\w+/g,
        description: '直接訪問 CONTRACTS[56]',
        severity: 'info'
      }
    ];
    
    const filesToCheck = await this.findTSXFiles();
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(PROJECT_PATHS.frontend, filePath);
        
        for (const { pattern, description, severity } of searchPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // 過濾掉配置文件本身的定義
            if (!relativePath.includes('config/contracts') && !relativePath.includes('contractsWithABI')) {
              issues.push(`${relativePath}: ${description} - 找到 ${matches.length} 處`);
              this.log(`    ⚠️ ${relativePath}: ${description}`, severity === 'error' ? 'error' : 'warning');
            }
          }
        }
      }
    }
  }

  async checkConfigFileFormats(issues) {
    this.log('  檢查配置文件格式...', 'info');
    
    const configFiles = [
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts'),
        type: 'frontend-contracts'
      },
      {
        path: path.join(PROJECT_PATHS.frontend, 'src/config/contractsWithABI.ts'),
        type: 'frontend-abi'
      },
      {
        path: path.join(PROJECT_PATHS.backend, 'config/contracts.js'),
        type: 'backend-contracts'
      }
    ];
    
    for (const configFile of configFiles) {
      if (fs.existsSync(configFile.path)) {
        const content = fs.readFileSync(configFile.path, 'utf8');
        const fileName = path.basename(configFile.path);
        
        // 檢查是否包含版本信息
        if (!content.includes('V25') && !content.includes('Generated on')) {
          issues.push(`${fileName}: 缺少版本信息或生成時間戳`);
        }
        
        // 檢查是否有生成註釋
        if (!content.includes('DO NOT EDIT MANUALLY')) {
          issues.push(`${fileName}: 缺少自動生成警告註釋`);
        }
        
        // 檢查關鍵合約地址
        const requiredContracts = ['HERO', 'RELIC', 'PARTY', 'DUNGEONCORE'];
        for (const contract of requiredContracts) {
          if (!content.includes(contract)) {
            issues.push(`${fileName}: 缺少 ${contract} 合約配置`);
          }
        }
      } else {
        issues.push(`配置文件不存在: ${configFile.path}`);
      }
    }
  }

  async checkABIImports(issues) {
    this.log('  檢查 ABI 引入格式...', 'info');
    
    const abiPatterns = [
      {
        pattern: /import\s+\w+\s+from\s+['"][^'"]*abis\/[^'"]*\.json['"]/g,
        description: 'ABI import 語句'
      },
      {
        pattern: /require\s*\(\s*['"][^'"]*abis\/[^'"]*\.json['"]\s*\)/g,
        description: 'ABI require 語句'
      }
    ];
    
    const filesToCheck = await this.findTSXFiles();
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(PROJECT_PATHS.frontend, filePath);
        
        for (const { pattern, description } of abiPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // 檢查 ABI 文件是否存在
            for (const match of matches) {
              const abiPathMatch = match.match(/['"]([^'"]*abis\/[^'"]*\.json)['"]/);
              if (abiPathMatch) {
                // 基於源文件位置解析相對路徑
                const sourceDir = path.dirname(filePath);
                const abiPath = path.resolve(sourceDir, abiPathMatch[1]);
                if (!fs.existsSync(abiPath)) {
                  issues.push(`${relativePath}: ABI 文件不存在 - ${abiPathMatch[1]}`);
                }
              }
            }
          }
        }
      }
    }
  }

  async findTSXFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const searchDirs = [
      path.join(PROJECT_PATHS.frontend, 'src'),
    ];
    
    const files = [];
    
    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    for (const dir of searchDirs) {
      scanDirectory(dir);
    }
    
    return files;
  }

  showNextSteps() {
    console.log(`\n${colors.bright}下一步:${colors.reset}`);
    console.log('1. 前端: cd /Users/sotadic/Documents/GitHub/DungeonDelvers && npm run dev');
    console.log('2. 後端: cd /Users/sotadic/Documents/dungeon-delvers-metadata-server && npm start');
    console.log('3. 子圖編譯（如需部署）:');
    console.log('   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers');
    console.log('   npm run codegen && npm run build');
    console.log('   # 部署由主部署腳本處理');
    
    if (this.subgraphVersion) {
      console.log(`\n${colors.cyan}🔄 子圖版本已更新到 ${this.subgraphVersion}${colors.reset}`);
      console.log('📋 已更新的配置文件:');
      console.log('  - master-config.json & config-reader.js');
      console.log('  - 子圖 package.json 版本號');
      console.log('  - 前端硬編碼 URL');
      console.log('  - 環境變數文件 (.env, .env.local)');
      console.log('  - CDN 配置文件');
    }
  }

  async performRollback() {
    this.log('執行回滾...', 'info');
    
    // 尋找最新的同步報告
    const deploymentsDir = path.join(PROJECT_PATHS.contracts, 'scripts/deployments');
    const files = fs.readdirSync(deploymentsDir)
      .filter(f => f.startsWith('v25-sync-report-'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error('找不到同步報告，無法回滾');
    }
    
    const latestReport = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8')
    );
    
    // 執行回滾
    for (const backup of latestReport.backups) {
      if (fs.existsSync(backup.backup)) {
        fs.copyFileSync(backup.backup, backup.original);
        this.log(`✅ 已回滾: ${path.basename(backup.original)}`, 'success');
      }
    }
    
    this.log('\n✅ 回滾完成！', 'success');
  }
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
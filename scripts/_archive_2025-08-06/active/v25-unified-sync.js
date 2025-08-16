#!/usr/bin/env node

/**
 * V25 統一同步腳本
 * 
 * 結合 v25-sync-all.js 和 sync-config-v2.js 的功能
 * 使用 config-reader.js 作為單一配置來源
 * 
 * 功能：
 * 1. 同步合約地址到前端/後端
 * 2. 同步 ABI 文件
 * 3. 更新子圖配置
 * 4. 生成 CDN 配置
 * 
 * 使用方式：
 * node scripts/active/v25-unified-sync.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 使用統一配置讀取器
const config = require('../../config/config-reader');

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

// ===== 路徑配置 =====
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
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/Party.json' }
    ]
  },
  {
    contractName: 'VIPSTAKING',
    artifactName: 'VIPStaking',
    destinations: [
      { type: 'frontend', path: 'src/abis/VIPStaking.json' },
      { type: 'subgraph', path: 'abis/VIPStaking.json' }
    ]
  },
  {
    contractName: 'PLAYERPROFILE',
    artifactName: 'PlayerProfile',
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerProfile.json' },
      { type: 'subgraph', path: 'abis/PlayerProfile.json' }
    ]
  },
  {
    contractName: 'ALTAROFASCENSION',
    artifactName: 'AltarOfAscensionV2Fixed',
    destinations: [
      { type: 'frontend', path: 'src/abis/AltarOfAscension.json' },
      { type: 'subgraph', path: 'abis/AltarOfAscensionV2Fixed.json' }
    ]
  },
  {
    contractName: 'DUNGEONMASTER',
    artifactName: 'DungeonMasterV2_Fixed',
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
      { type: 'frontend', path: 'src/abis/PlayerVault.json' }
    ]
  }
];

class V25UnifiedSync {
  constructor() {
    this.backups = [];
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
    console.log(`${prefix[type]} ${timestamp} ${message}`);
  }

  backup(filePath) {
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      this.backups.push({ original: filePath, backup: backupPath });
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
  }

  // 1. 編譯合約以生成最新 ABI
  async compileContracts() {
    this.log('\n編譯合約以生成 ABI...', 'info');
    try {
      execSync('npx hardhat compile', { 
        cwd: PROJECT_PATHS.contracts,
        stdio: 'inherit' 
      });
      this.log('✅ 合約編譯成功', 'success');
    } catch (error) {
      this.log(`❌ 合約編譯失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  // 2. 同步 ABI 文件
  async syncABIs() {
    this.log('\n同步 ABI 文件...', 'info');

    for (const abiConfig of ABI_SYNC_CONFIG) {
      this.log(`\n處理 ${abiConfig.contractName} ABI...`, 'info');
      
      // 根據不同合約確定路徑
      let contractPath;
      if (['Hero', 'Relic', 'Party'].includes(abiConfig.artifactName)) {
        contractPath = 'current/nft';
      } else if (['VIPStaking', 'PlayerProfile', 'PlayerVault'].includes(abiConfig.artifactName)) {
        contractPath = 'current/core';
      } else if (abiConfig.artifactName.includes('DungeonMaster')) {
        contractPath = 'current/core';
      } else if (abiConfig.artifactName.includes('AltarOfAscension')) {
        contractPath = 'current/core';
      } else if (abiConfig.artifactName.includes('DungeonCore')) {
        contractPath = 'current';
      } else if (abiConfig.artifactName.includes('Oracle')) {
        contractPath = 'current';
      } else {
        contractPath = 'current';
      }

      const sourcePath = path.join(
        PROJECT_PATHS.contracts,
        'artifacts/contracts',
        contractPath,
        `${abiConfig.artifactName}.sol`,
        `${abiConfig.artifactName}.json`
      );

      if (!fs.existsSync(sourcePath)) {
        this.log(`⚠️ 找不到 ABI 文件: ${sourcePath}`, 'warning');
        continue;
      }

      const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

      for (const dest of abiConfig.destinations) {
        const destPath = path.join(PROJECT_PATHS[dest.type], dest.path);
        
        try {
          // 確保目標目錄存在
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          // 備份現有文件
          this.backup(destPath);

          // 複製 ABI
          fs.writeFileSync(destPath, JSON.stringify(artifact, null, 2));
          this.log(`✅ ${abiConfig.contractName} ABI 已複製到${dest.type}`, 'success');
        } catch (error) {
          this.log(`❌ 複製 ABI 到 ${dest.type} 失敗: ${error.message}`, 'error');
          this.errors.push({ type: 'ABI同步', config: abiConfig, dest, error });
        }
      }
    }
  }

  // 3. 更新前端配置
  updateFrontendConfig() {
    this.log('\n更新前端配置...', 'info');
    
    const frontendConfigPath = path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts');
    
    if (!fs.existsSync(frontendConfigPath)) {
      this.log(`❌ 找不到前端配置文件: ${frontendConfigPath}`, 'error');
      return;
    }
    
    this.backup(frontendConfigPath);
    
    const addresses = config.getAllAddresses();
    const contractsContent = `// Auto-generated from config-reader.js
// Version: ${config.version}
// Updated: ${new Date().toISOString()}

export const contractAddresses = {
  // 核心合約
  DUNGEONCORE: '${addresses.DUNGEONCORE_ADDRESS}',
  DUNGEONMASTER: '${addresses.DUNGEONMASTER_ADDRESS}',
  DUNGEONSTORAGE: '${addresses.DUNGEONSTORAGE_ADDRESS}',
  DUNGEONMASTERWALLET: '${addresses.DUNGEONMASTERWALLET_ADDRESS}',
  
  // NFT 合約
  HERO: '${addresses.HERO_ADDRESS}',
  RELIC: '${addresses.RELIC_ADDRESS}',
  PARTY: '${addresses.PARTY_ADDRESS}',
  
  // 功能合約
  VIPSTAKING: '${addresses.VIPSTAKING_ADDRESS}',
  PLAYERPROFILE: '${addresses.PLAYERPROFILE_ADDRESS}',
  PLAYERVAULT: '${addresses.PLAYERVAULT_ADDRESS}',
  ALTAROFASCENSION: '${addresses.ALTAROFASCENSION_ADDRESS}',
  
  // 代幣合約
  SOULSHARD: '${addresses.SOULSHARD_ADDRESS}',
  
  // 系統合約
  ORACLE: '${addresses.ORACLE_ADDRESS}'
} as const;

// 網路配置
export const networkConfig = ${JSON.stringify(config.network, null, 2)};

// 服務端點
export const services = ${JSON.stringify(config.services, null, 2)};

// 版本資訊
export const configVersion = '${config.version}';
`;

    fs.writeFileSync(frontendConfigPath, contractsContent);
    this.log('✅ 前端配置已更新', 'success');
  }

  // 4. 更新後端配置
  updateBackendConfig() {
    this.log('\n更新後端配置...', 'info');
    
    // 檢查正確的後端配置路徑
    const possiblePaths = [
      path.join(PROJECT_PATHS.backend, 'contracts.js'),
      path.join(PROJECT_PATHS.backend, 'config/contracts.js'),
      path.join(PROJECT_PATHS.backend, 'src/contracts.js')
    ];
    
    let backendConfigPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        backendConfigPath = p;
        break;
      }
    }
    
    if (!backendConfigPath) {
      this.log(`⚠️ 找不到後端配置文件，嘗試創建在預設位置`, 'warning');
      backendConfigPath = path.join(PROJECT_PATHS.backend, 'contracts.js');
    }
    
    this.backup(backendConfigPath);
    
    const addresses = config.getAllAddresses();
    const contractsContent = `// Auto-generated from config-reader.js
// Version: ${config.version}
// Updated: ${new Date().toISOString()}

module.exports = {
  // NFT 合約地址
  HERO_ADDRESS: '${addresses.HERO_ADDRESS}',
  RELIC_ADDRESS: '${addresses.RELIC_ADDRESS}',
  PARTY_ADDRESS: '${addresses.PARTY_ADDRESS}',
  VIPSTAKING_ADDRESS: '${addresses.VIPSTAKING_ADDRESS}',
  PLAYERPROFILE_ADDRESS: '${addresses.PLAYERPROFILE_ADDRESS}',
  
  // 其他合約地址
  DUNGEONCORE_ADDRESS: '${addresses.DUNGEONCORE_ADDRESS}',
  DUNGEONMASTER_ADDRESS: '${addresses.DUNGEONMASTER_ADDRESS}',
  PLAYERVAULT_ADDRESS: '${addresses.PLAYERVAULT_ADDRESS}',
  ALTAROFASCENSION_ADDRESS: '${addresses.ALTAROFASCENSION_ADDRESS}',
  SOULSHARD_ADDRESS: '${addresses.SOULSHARD_ADDRESS}',
  ORACLE_ADDRESS: '${addresses.ORACLE_ADDRESS}',
  
  // 網路配置
  NETWORK: 'BSC Mainnet',
  CHAIN_ID: 56,
  
  // 版本資訊
  CONFIG_VERSION: '${config.version}'
};
`;

    fs.writeFileSync(backendConfigPath, contractsContent);
    this.log(`✅ 後端配置已更新: ${backendConfigPath}`, 'success');
  }

  // 5. 更新子圖配置
  updateSubgraphConfig() {
    this.log('\n更新子圖配置...', 'info');
    
    // 更新 networks.json
    const networksPath = path.join(PROJECT_PATHS.subgraph, 'networks.json');
    if (fs.existsSync(networksPath)) {
      this.backup(networksPath);
      
      const networks = {
        bsc: {
          Hero: { address: config.getAddress('HERO') },
          Relic: { address: config.getAddress('RELIC') },
          Party: { address: config.getAddress('PARTY') },
          VIPStaking: { address: config.getAddress('VIPSTAKING') },
          PlayerProfile: { address: config.getAddress('PLAYERPROFILE') },
          AltarOfAscension: { address: config.getAddress('ALTAROFASCENSION') },
          DungeonMaster: { address: config.getAddress('DUNGEONMASTER') }
        }
      };
      
      fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
      this.log('✅ 子圖 networks.json 已更新', 'success');
    }

    // 更新 subgraph.yaml
    const yamlPath = path.join(PROJECT_PATHS.subgraph, 'subgraph.yaml');
    if (fs.existsSync(yamlPath)) {
      this.backup(yamlPath);
      
      let yamlContent = fs.readFileSync(yamlPath, 'utf8');
      
      // 更新地址和起始區塊
      const updates = [
        { name: 'Hero', address: config.getAddress('HERO') },
        { name: 'Relic', address: config.getAddress('RELIC') },
        { name: 'Party', address: config.getAddress('PARTY') },
        { name: 'VIPStaking', address: config.getAddress('VIPSTAKING') },
        { name: 'PlayerProfile', address: config.getAddress('PLAYERPROFILE') },
        { name: 'AltarOfAscension', address: config.getAddress('ALTAROFASCENSION') },
        { name: 'DungeonMaster', address: config.getAddress('DUNGEONMASTER') }
      ];
      
      for (const update of updates) {
        const regex = new RegExp(`(- kind: ethereum\\/contract\\s+name: ${update.name}[\\s\\S]*?address:\\s*)"0x[a-fA-F0-9]{40}"`, 'g');
        yamlContent = yamlContent.replace(regex, `$1"${update.address}"`);
        
        const blockRegex = new RegExp(`(- kind: ethereum\\/contract\\s+name: ${update.name}[\\s\\S]*?startBlock:\\s*)\\d+`, 'g');
        yamlContent = yamlContent.replace(blockRegex, `$1${config.startBlock}`);
        
        this.log(`✅ 更新 ${update.name} 地址和起始區塊`, 'success');
      }
      
      fs.writeFileSync(yamlPath, yamlContent);
      this.log('✅ 子圖 YAML 已更新', 'success');
    }
  }

  // 6. 生成 CDN 配置
  generateCDNConfigs() {
    this.log('\n生成 CDN 配置文件...', 'info');
    
    const publicDir = path.join(PROJECT_PATHS.contracts, 'public/configs');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const cdnConfig = {
      version: config.version,
      lastUpdated: new Date().toISOString(),
      contracts: {},
      network: config.network,
      subgraph: config.subgraph
    };
    
    // 只包含地址
    for (const [key, value] of Object.entries(config.contracts)) {
      cdnConfig.contracts[key] = value.address;
    }
    
    // v25.json
    const versionFile = path.join(publicDir, `v${config.version.replace('V', '')}.json`);
    fs.writeFileSync(versionFile, JSON.stringify(cdnConfig, null, 2));
    this.log(`✅ 生成 ${path.basename(versionFile)}`, 'success');
    
    // latest.json
    const latestFile = path.join(publicDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(cdnConfig, null, 2));
    this.log('✅ 生成 latest.json', 'success');
  }

  // 7. 生成同步報告
  generateReport() {
    const reportPath = path.join(
      PROJECT_PATHS.contracts, 
      'scripts/deployments', 
      `v25-sync-report-${Date.now()}.json`
    );
    
    const report = {
      version: config.version,
      configFile: config.configFile,
      timestamp: new Date().toISOString(),
      projectPaths: PROJECT_PATHS,
      synced: {
        frontend: true,
        backend: true,
        subgraph: true,
        cdn: true,
        abis: ABI_SYNC_CONFIG.length
      },
      contracts: config.getAllAddresses(),
      backups: this.backups,
      errors: this.errors
    };
    
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n✅ 同步報告已生成: ${reportPath}`, 'success');
  }

  // 主執行函數
  async run() {
    console.log(`${colors.bright}
==================================================
🔄 V25 統一同步腳本
==================================================
${colors.reset}`);

    this.log(`配置版本: ${config.version}`, 'info');
    this.log(`配置來源: ${config.configFile}`, 'info');
    this.log(`起始區塊: ${config.startBlock}`, 'info');
    
    try {
      // 1. 編譯合約
      await this.compileContracts();
      
      // 2. 同步 ABI
      await this.syncABIs();
      
      // 3. 更新前端配置
      this.updateFrontendConfig();
      
      // 4. 更新後端配置
      this.updateBackendConfig();
      
      // 5. 更新子圖
      this.updateSubgraphConfig();
      
      // 6. 生成 CDN 配置
      this.generateCDNConfigs();
      
      // 7. 生成報告
      this.generateReport();
      
      console.log(`${colors.bright}
下一步:
1. 前端: cd ${PROJECT_PATHS.frontend} && npm run dev
2. 後端: cd ${PROJECT_PATHS.backend} && npm start
3. 子圖:
   cd ${PROJECT_PATHS.subgraph}
   npm run codegen
   npm run build
   npm run deploy
${colors.reset}`);
      
      this.log('\n✅ V25 同步完成！', 'success');
      
    } catch (error) {
      this.log(`同步失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 執行
if (require.main === module) {
  const sync = new V25UnifiedSync();
  sync.run();
}

module.exports = V25UnifiedSync;
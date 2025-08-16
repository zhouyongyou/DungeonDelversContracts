#!/usr/bin/env node

/**
 * 配置同步腳本 V2
 * 使用 config-reader.js 作為單一配置來源
 */

const fs = require('fs');
const path = require('path');

// 使用統一配置讀取器
const config = require('../../config/config-reader');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 專案路徑
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// 備份文件
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`📋 已備份: ${path.basename(backupPath)}`, 'cyan');
  }
}

// 更新前端配置
function updateFrontend() {
  log('\n📱 更新前端配置...', 'yellow');
  
  const frontendConfigPath = path.join(PROJECTS.frontend, 'src/config/contracts.ts');
  
  if (!fs.existsSync(frontendConfigPath)) {
    log(`❌ 找不到前端配置文件: ${frontendConfigPath}`, 'red');
    return;
  }
  
  backupFile(frontendConfigPath);
  
  // 使用 config-reader 的資料
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
export const networkConfig = ${JSON.stringify(config.masterConfig.network, null, 2)};

// 服務端點
export const services = ${JSON.stringify(config.masterConfig.services, null, 2)};

// 版本資訊
export const configVersion = '${config.version}';
`;

  fs.writeFileSync(frontendConfigPath, contractsContent);
  log('✅ 前端配置已更新', 'green');
}

// 更新後端配置
function updateBackend() {
  log('\n🖥️  更新後端配置...', 'yellow');
  
  const backendConfigPath = path.join(PROJECTS.backend, 'contracts.js');
  
  if (!fs.existsSync(backendConfigPath)) {
    log(`❌ 找不到後端配置文件: ${backendConfigPath}`, 'red');
    return;
  }
  
  backupFile(backendConfigPath);
  
  // 使用 config-reader 的資料
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
  log('✅ 後端配置已更新', 'green');
}

// 生成 CDN 配置
function generateCDNConfigs() {
  log('\n🌐 生成 CDN 配置...', 'yellow');
  
  const publicDir = path.join(PROJECTS.contracts, 'public/configs');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // 簡化的 CDN 配置
  const cdnConfig = {
    version: config.version,
    lastUpdated: new Date().toISOString(),
    contracts: {},
    network: config.masterConfig.network,
    subgraph: config.masterConfig.subgraph
  };
  
  // 只包含地址，不包含其他資訊
  for (const [key, value] of Object.entries(config.contracts)) {
    cdnConfig.contracts[key] = value.address;
  }
  
  // 寫入版本配置
  const versionFile = path.join(publicDir, `v${config.version.replace('V', '')}.json`);
  fs.writeFileSync(versionFile, JSON.stringify(cdnConfig, null, 2));
  log(`✅ 生成 ${path.basename(versionFile)}`, 'green');
  
  // 寫入 latest.json
  const latestFile = path.join(publicDir, 'latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(cdnConfig, null, 2));
  log('✅ 生成 latest.json', 'green');
}

// 更新 .env.example
function updateEnvExample() {
  log('\n📝 更新 .env.example...', 'yellow');
  
  const envExamplePath = path.join(PROJECTS.contracts, '.env.example');
  const envContent = `# DungeonDelvers 環境變數範例
# 配置版本: ${config.version}
# 更新時間: ${new Date().toISOString()}

# ========== 部署相關 ==========
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# ========== 網路設定 ==========
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# ========== 配置版本 ==========
CONFIG_VERSION=${config.version}

# 注意：合約地址現在從 config/${config.configFile} 自動載入
# 不需要在 .env 中設置合約地址
`;

  fs.writeFileSync(envExamplePath, envContent);
  log('✅ .env.example 已更新', 'green');
}

// 生成同步報告
function generateSyncReport() {
  const reportPath = path.join(PROJECTS.contracts, 'scripts/deployments', `sync-report-${Date.now()}.json`);
  
  const report = {
    version: config.version,
    configFile: config.configFile,
    timestamp: new Date().toISOString(),
    synced: {
      frontend: true,
      backend: true,
      cdn: true,
      env: true
    },
    contracts: config.getAllAddresses()
  };
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📊 同步報告已生成: ${reportPath}`, 'cyan');
}

// 主函數
async function main() {
  log('\n🔄 配置同步腳本 V2 (使用 config-reader.js)', 'magenta');
  log(`📋 配置版本: ${config.version}`, 'cyan');
  log(`📄 配置來源: ${config.configFile}`, 'cyan');
  log('='.repeat(70), 'magenta');

  try {
    // 1. 更新前端
    updateFrontend();
    
    // 2. 更新後端
    updateBackend();
    
    // 3. 生成 CDN 配置
    generateCDNConfigs();
    
    // 4. 更新 .env.example
    updateEnvExample();
    
    // 5. 生成同步報告
    generateSyncReport();

    log('\n✅ 所有配置同步完成！', 'green');
    log('\n📋 下一步：', 'cyan');
    log('1. 提交更改到 Git', 'yellow');
    log('2. 部署前端和後端', 'yellow');
    log('3. 執行功能測試', 'yellow');
    
  } catch (error) {
    log(`\n❌ 同步失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

module.exports = { main };
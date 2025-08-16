#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 載入主配置
const masterConfigPath = path.join(__dirname, '../config/master-config.json');
const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));

// 專案路徑
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

// 備份目錄
const BACKUP_DIR = path.join(__dirname, '../backups');

// 創建備份
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `config-backup-${timestamp}`);
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  fs.mkdirSync(backupPath);
  
  log(`\n📦 創建配置備份: ${backupPath}`, 'cyan');
  
  // 備份各專案的配置文件
  const filesToBackup = [
    { project: 'frontend', file: '.env' },
    { project: 'frontend', file: 'src/config/contracts.ts' },
    { project: 'subgraph', file: 'subgraph.yaml' },
    { project: 'subgraph', file: 'deploy-v15-auto.sh' },
    { project: 'frontend', file: 'src/config/env.ts' },
    { project: 'backend', file: '.env' },
    { project: 'contracts', file: '.env' },
    { project: 'contracts', file: 'config/contracts.json' },
  ];
  
  filesToBackup.forEach(({ project, file }) => {
    const sourcePath = path.join(PROJECTS[project], file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(backupPath, `${project}-${file.replace(/\//g, '-')}`);
      fs.copyFileSync(sourcePath, destPath);
    }
  });
  
  // 保存備份信息
  const backupInfo = {
    timestamp,
    version: masterConfig.version,
    files: filesToBackup.map(f => `${f.project}/${f.file}`)
  };
  
  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  return backupPath;
}

// 版本檢查
function checkVersions() {
  log('\n🔍 檢查當前版本...', 'yellow');
  
  const versions = {};
  
  // 檢查前端版本
  try {
    const frontendContracts = fs.readFileSync(
      path.join(PROJECTS.frontend, 'src/config/contracts.ts'),
      'utf8'
    );
    const versionMatch = frontendContracts.match(/DEPLOYMENT_VERSION = '([^']+)'/);
    versions.frontend = versionMatch ? versionMatch[1] : 'Unknown';
  } catch (e) {
    versions.frontend = 'Error';
  }
  
  // 檢查後端版本
  try {
    const backendEnv = fs.readFileSync(
      path.join(PROJECTS.backend, '.env'),
      'utf8'
    );
    const versionMatch = backendEnv.match(/VERSION=(.+)/);
    versions.backend = versionMatch ? versionMatch[1] : 'Unknown';
  } catch (e) {
    versions.backend = 'Error';
  }
  
  // 顯示版本信息
  log('\n📊 當前版本狀態:', 'cyan');
  log(`  主配置: ${masterConfig.version}`, 'green');
  log(`  前端: ${versions.frontend}`, versions.frontend === masterConfig.version ? 'green' : 'yellow');
  log(`  後端: ${versions.backend}`, versions.backend === masterConfig.version ? 'green' : 'yellow');
  
  return versions;
}

// 生成更新日誌
function generateChangelog(oldVersions) {
  const changelogPath = path.join(__dirname, '../CHANGELOG.md');
  const timestamp = new Date().toISOString();
  
  let changelog = '';
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, 'utf8');
  } else {
    changelog = '# 配置更新日誌\n\n';
  }
  
  const newEntry = `## ${masterConfig.version} - ${timestamp}

### 更新內容
- 前端: ${oldVersions.frontend} → ${masterConfig.version}
- 後端: ${oldVersions.backend} → ${masterConfig.version}
- 合約配置同步更新

### 更新的合約地址
\`\`\`json
${JSON.stringify(masterConfig.contracts.mainnet, null, 2)}
\`\`\`

---

`;
  
  changelog = newEntry + changelog;
  fs.writeFileSync(changelogPath, changelog);
  
  log('\n📝 更新日誌已生成', 'green');
}

// 同步配置（與原腳本相同的邏輯）
async function syncConfigs() {
  log('\n🔄 開始同步配置到所有專案...', 'magenta');
  log(`📋 主配置版本: ${masterConfig.version}`, 'cyan');
  log(`📅 最後更新: ${masterConfig.lastUpdated}`, 'cyan');
  log('='.repeat(70), 'magenta');
  
  // 檢查版本
  const oldVersions = checkVersions();
  
  // 詢問是否繼續
  if (oldVersions.frontend === masterConfig.version && oldVersions.backend === masterConfig.version) {
    log('\n✅ 所有專案已經是最新版本', 'green');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('是否仍要繼續同步？(y/N) ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      log('🚫 同步已取消', 'yellow');
      return;
    }
  }
  
  // 創建備份
  const backupPath = createBackup();
  
  try {
    // 執行原有的同步邏輯
    const syncScript = path.join(__dirname, 'sync-config.js');
    execSync(`node ${syncScript}`, { stdio: 'inherit' });
    
    // 同步子圖配置
    log('\n🔄 同步子圖配置...', 'yellow');
    const subgraphScript = path.join(__dirname, 'update-subgraph-deployment.js');
    if (fs.existsSync(subgraphScript)) {
      execSync(`node ${subgraphScript}`, { stdio: 'inherit' });
    }
    
    // 生成更新日誌
    generateChangelog(oldVersions);
    
    // 更新 CDN 配置
    updateCDNConfig();
    
    log('\n✅ 所有配置同步完成！', 'green');
    log(`📦 備份已保存到: ${backupPath}`, 'cyan');
    
  } catch (error) {
    log(`\n❌ 同步失敗: ${error.message}`, 'red');
    log('🔄 您可以使用以下命令回滾:', 'yellow');
    log(`   npm run rollback ${backupPath}`, 'cyan');
    process.exit(1);
  }
}

// 更新 CDN 配置
function updateCDNConfig() {
  const cdnConfigPath = path.join(PROJECTS.frontend, 'public/config/v15.json');
  
  // 轉換合約地址格式（移除 _ADDRESS 後綴）
  const contracts = {};
  Object.entries(masterConfig.contracts.mainnet).forEach(([key, value]) => {
    const newKey = key.replace('_ADDRESS', '');
    contracts[newKey] = value;
  });

  const cdnConfig = {
    version: masterConfig.version,
    lastUpdated: masterConfig.lastUpdated,
    description: `DungeonDelvers ${masterConfig.version} Configuration - Production`,
    contracts,
    subgraph: masterConfig.subgraph,
    network: masterConfig.network,
    tokens: masterConfig.tokens,
    features: masterConfig.features || {
      viaIR: true,
      unifiedDependencies: true,
      realTokenIntegration: true,
      oracleEnabled: true,
      decentralizedSubgraph: true
    }
  };
  
  fs.writeFileSync(cdnConfigPath, JSON.stringify(cdnConfig, null, 2));
  log('✅ CDN 配置文件更新完成', 'green');
}

// 主函數
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--check') {
    // 只檢查版本
    checkVersions();
  } else if (args[0] === '--rollback' && args[1]) {
    // 回滾功能
    rollback(args[1]);
  } else {
    // 執行同步
    await syncConfigs();
  }
}

// 回滾功能
function rollback(backupPath) {
  log(`\n🔄 開始回滾到: ${backupPath}`, 'yellow');
  
  if (!fs.existsSync(backupPath)) {
    log('❌ 備份路徑不存在', 'red');
    process.exit(1);
  }
  
  const backupInfo = JSON.parse(
    fs.readFileSync(path.join(backupPath, 'backup-info.json'), 'utf8')
  );
  
  log(`📋 回滾到版本: ${backupInfo.version}`, 'cyan');
  log(`📅 備份時間: ${backupInfo.timestamp}`, 'cyan');
  
  // 恢復文件
  const files = fs.readdirSync(backupPath);
  files.forEach(file => {
    if (file === 'backup-info.json') return;
    
    const [project, ...fileParts] = file.split('-');
    const targetFile = fileParts.join('/').replace(/-/g, '/');
    const sourcePath = path.join(backupPath, file);
    const destPath = path.join(PROJECTS[project], targetFile);
    
    fs.copyFileSync(sourcePath, destPath);
    log(`✅ 恢復: ${project}/${targetFile}`, 'green');
  });
  
  log('\n✅ 回滾完成', 'green');
}

// 執行
main().catch(error => {
  log(`\n❌ 執行失敗: ${error.message}`, 'red');
  process.exit(1);
});
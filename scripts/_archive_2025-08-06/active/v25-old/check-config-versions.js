#!/usr/bin/env node

/**
 * 配置版本檢查腳本
 * 
 * 檢查所有專案中的配置檔案版本是否一致
 * 
 * 使用方式：
 * node scripts/active/check-config-versions.js
 */

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

// 項目路徑配置
const PROJECT_PATHS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// 需要檢查的配置檔案
const CONFIG_FILES = [
  {
    name: 'Frontend contracts.ts',
    path: path.join(PROJECT_PATHS.frontend, 'src/config/contracts.ts'),
    type: 'typescript',
    versionPattern: /CONTRACT_VERSION = '(V\d+)'/,
    addressPattern: /HERO: '(0x[a-fA-F0-9]{40})'/
  },
  {
    name: 'Frontend shared-config.json',
    path: path.join(PROJECT_PATHS.frontend, 'shared-config.json'),
    type: 'json',
    jsonPath: 'contracts.hero'
  },
  {
    name: 'CDN v25.json',
    path: path.join(PROJECT_PATHS.frontend, 'public/config/v25.json'),
    type: 'json',
    jsonPath: 'contracts.HERO',
    versionPath: 'version'
  },
  {
    name: 'CDN latest.json',
    path: path.join(PROJECT_PATHS.frontend, 'public/config/latest.json'),
    type: 'json',
    jsonPath: 'contracts.HERO',
    versionPath: 'version'
  },
  {
    name: 'Subgraph networks.json',
    path: path.join(PROJECT_PATHS.subgraph, 'networks.json'),
    type: 'json',
    jsonPath: 'bsc.Hero.address'
  },
  {
    name: 'Backend contracts.js',
    path: path.join(PROJECT_PATHS.backend, 'config/contracts.js'),
    type: 'commonjs',
    versionPattern: /version:\s*'(V\d+)'/,
    addressPattern: /HERO:\s*'(0x[a-fA-F0-9]{40})'/
  },
  {
    name: 'Master config',
    path: path.join(PROJECT_PATHS.contracts, 'config/master-config.json'),
    type: 'json',
    jsonPath: 'contracts.HERO.address',
    versionPath: 'version'
  }
];

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`
  };
  console.log(`${prefix[type]} ${message}`);
}

function getJsonValue(obj, path) {
  return path.split('.').reduce((current, part) => current?.[part], obj);
}

function checkConfigVersions() {
  console.log(`${colors.bright}
==================================================
📋 配置版本檢查工具
==================================================
${colors.reset}`);

  const results = [];
  const versions = new Set();
  const heroAddresses = new Set();

  // 檢查每個配置檔案
  for (const config of CONFIG_FILES) {
    try {
      if (!fs.existsSync(config.path)) {
        results.push({
          name: config.name,
          status: 'missing',
          version: null,
          address: null
        });
        log(`${config.name} - 檔案不存在`, 'warning');
        continue;
      }

      let version = null;
      let address = null;

      if (config.type === 'json') {
        const content = JSON.parse(fs.readFileSync(config.path, 'utf8'));
        address = config.jsonPath ? getJsonValue(content, config.jsonPath) : null;
        version = config.versionPath ? getJsonValue(content, config.versionPath) : null;
      } else if (config.type === 'typescript' || config.type === 'commonjs') {
        const content = fs.readFileSync(config.path, 'utf8');
        if (config.versionPattern) {
          const versionMatch = content.match(config.versionPattern);
          version = versionMatch ? versionMatch[1] : null;
        }
        if (config.addressPattern) {
          const addressMatch = content.match(config.addressPattern);
          address = addressMatch ? addressMatch[1] : null;
        }
      }

      results.push({
        name: config.name,
        status: 'ok',
        version,
        address
      });

      if (version) versions.add(version);
      if (address) heroAddresses.add(address.toLowerCase());

      log(`${config.name} - ${version || 'N/A'} - ${address ? address.substring(0, 10) + '...' : 'N/A'}`, 'info');

    } catch (error) {
      results.push({
        name: config.name,
        status: 'error',
        error: error.message
      });
      log(`${config.name} - 錯誤: ${error.message}`, 'error');
    }
  }

  // 分析結果
  console.log(`\n${colors.bright}分析結果:${colors.reset}`);

  // 版本一致性
  if (versions.size === 0) {
    log('未找到版本信息', 'warning');
  } else if (versions.size === 1) {
    log(`所有配置使用相同版本: ${Array.from(versions)[0]}`, 'success');
  } else {
    log(`發現多個版本: ${Array.from(versions).join(', ')}`, 'error');
  }

  // 地址一致性
  if (heroAddresses.size === 0) {
    log('未找到 Hero 合約地址', 'warning');
  } else if (heroAddresses.size === 1) {
    log(`所有 Hero 地址一致: ${Array.from(heroAddresses)[0]}`, 'success');
  } else {
    log(`發現不同的 Hero 地址:`, 'error');
    heroAddresses.forEach(addr => console.log(`  - ${addr}`));
  }

  // 建議
  if (versions.size > 1 || heroAddresses.size > 1) {
    console.log(`\n${colors.yellow}建議:${colors.reset}`);
    console.log('執行同步腳本以確保所有配置一致:');
    console.log(`  cd ${PROJECT_PATHS.contracts}`);
    console.log('  node scripts/active/v25-sync-all.js');
  }

  // 生成報告
  const report = {
    timestamp: new Date().toISOString(),
    versions: Array.from(versions),
    heroAddresses: Array.from(heroAddresses),
    details: results,
    isConsistent: versions.size <= 1 && heroAddresses.size <= 1
  };

  const reportPath = path.join(PROJECT_PATHS.contracts, 'scripts/reports', `config-check-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n${colors.blue}檢查報告已保存:${colors.reset} ${reportPath}`);
  
  // 返回狀態碼
  return report.isConsistent ? 0 : 1;
}

// 執行檢查
const exitCode = checkConfigVersions();
process.exit(exitCode);
#!/usr/bin/env node

/**
 * 配置同步測試腳本
 * 驗證所有專案的配置是否正確同步
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 測試結果
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// 載入主配置
const masterConfigPath = path.join(__dirname, '../config/master-config.json');
const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));

// 專案路徑
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

async function runTest(testName, testFunction) {
  log(`\n🧪 測試: ${testName}`, 'cyan');
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED' });
    log(`  ✅ 通過`, 'green');
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    log(`  ❌ 失敗: ${error.message}`, 'red');
  }
}

async function runConfigSyncTests() {
  log('\n🔄 配置同步測試', 'magenta');
  log('=' .repeat(50), 'magenta');
  log(`\n📋 主配置版本: ${masterConfig.version}`, 'yellow');
  log(`📅 最後更新: ${masterConfig.lastUpdated}`, 'yellow');
  
  // 1. 測試前端配置
  await runTest('前端 contracts.ts 同步', () => {
    const contractsPath = path.join(PROJECTS.frontend, 'src/config/contracts.ts');
    const content = fs.readFileSync(contractsPath, 'utf8');
    
    // 檢查版本
    const versionMatch = content.match(/DEPLOYMENT_VERSION = '([^']+)'/);
    if (!versionMatch || versionMatch[1] !== masterConfig.version) {
      throw new Error(`版本不匹配: 期望 ${masterConfig.version}, 實際 ${versionMatch?.[1] || '未找到'}`);
    }
    
    // 檢查關鍵合約地址
    const contracts = masterConfig.contracts.mainnet;
    for (const [key, address] of Object.entries(contracts)) {
      if (!content.includes(address)) {
        throw new Error(`合約地址 ${key} (${address}) 未找到`);
      }
    }
  });
  
  await runTest('前端 CDN 配置文件', () => {
    const cdnPath = path.join(PROJECTS.frontend, 'public/config/v15.json');
    const cdnConfig = JSON.parse(fs.readFileSync(cdnPath, 'utf8'));
    
    if (cdnConfig.version !== masterConfig.version) {
      throw new Error(`版本不匹配: ${cdnConfig.version} !== ${masterConfig.version}`);
    }
    
    // 檢查合約地址是否一致
    const masterContracts = masterConfig.contracts.mainnet;
    for (const [key, address] of Object.entries(masterContracts)) {
      if (cdnConfig.contracts[key] !== address) {
        throw new Error(`合約地址不匹配: ${key}`);
      }
    }
  });
  
  // 2. 測試後端配置
  await runTest('後端環境變數檢查', () => {
    const envPath = path.join(PROJECTS.backend, '.env');
    if (!fs.existsSync(envPath)) {
      log('    ⚠️ .env 文件不存在，跳過測試', 'yellow');
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // 檢查是否有 CONFIG_URL
    if (!envContent.includes('CONFIG_URL')) {
      log('    ℹ️ 未設置 CONFIG_URL，將使用默認值', 'cyan');
    }
  });
  
  await runTest('後端動態配置載入', async () => {
    try {
      // 測試本地配置載入器
      const configLoader = require(path.join(PROJECTS.backend, 'src/configLoader.js'));
      const config = await configLoader.loadConfig();
      
      if (config.version !== masterConfig.version) {
        throw new Error(`版本不匹配: ${config.version} !== ${masterConfig.version}`);
      }
      
      log(`    ℹ️ 配置版本: ${config.version}`, 'cyan');
      log(`    ℹ️ 合約數量: ${Object.keys(config.contracts).length}`, 'cyan');
      
    } catch (error) {
      throw new Error(`配置載入失敗: ${error.message}`);
    }
  });
  
  // 3. 測試子圖配置
  await runTest('子圖 subgraph.yaml 配置', () => {
    const subgraphPath = path.join(PROJECTS.frontend, 'DDgraphql/dungeon-delvers/subgraph.yaml');
    if (!fs.existsSync(subgraphPath)) {
      log('    ⚠️ 子圖文件不存在，跳過測試', 'yellow');
      return;
    }
    
    const subgraphContent = fs.readFileSync(subgraphPath, 'utf8');
    
    // 檢查關鍵合約地址
    const contracts = masterConfig.contracts.mainnet;
    const missingContracts = [];
    
    for (const [key, address] of Object.entries(contracts)) {
      if (key !== 'DUNGEONMASTERWALLET' && key !== 'ALTAROFASCENSION') {
        if (!subgraphContent.includes(address)) {
          missingContracts.push(key);
        }
      }
    }
    
    if (missingContracts.length > 0) {
      throw new Error(`子圖中缺少合約: ${missingContracts.join(', ')}`);
    }
  });
  
  // 4. 測試合約部署記錄
  await runTest('合約部署記錄一致性', () => {
    const deploymentPath = path.join(PROJECTS.contracts, 'deployments/V15_DEPLOYMENT_2025-07-23.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // 檢查地址是否一致
    const contracts = masterConfig.contracts.mainnet;
    const mismatches = [];
    
    for (const [key, address] of Object.entries(contracts)) {
      const contractName = key.replace(/_ADDRESS$/, '');
      const deployedContract = deployment[contractName];
      
      if (deployedContract && deployedContract.address !== address) {
        mismatches.push(`${key}: ${deployedContract.address} !== ${address}`);
      }
    }
    
    if (mismatches.length > 0) {
      throw new Error(`地址不匹配:\n    ${mismatches.join('\n    ')}`);
    }
  });
  
  // 5. 測試網路訪問
  await runTest('CDN 配置文件可訪問性', async () => {
    const cdnUrl = 'https://dungeondelvers.xyz/config/v15.json';
    
    try {
      const response = await axios.get(cdnUrl, { timeout: 5000 });
      
      if (response.data.version !== masterConfig.version) {
        throw new Error(`CDN 版本不匹配: ${response.data.version} !== ${masterConfig.version}`);
      }
      
      log(`    ℹ️ CDN 配置版本: ${response.data.version}`, 'cyan');
      log(`    ℹ️ CDN 響應時間: ${response.headers['x-response-time'] || 'N/A'}`, 'cyan');
      
    } catch (error) {
      if (error.response?.status === 404) {
        log('    ⚠️ CDN 配置文件尚未部署', 'yellow');
      } else {
        throw new Error(`無法訪問 CDN: ${error.message}`);
      }
    }
  });
  
  // 6. 測試版本一致性
  await runTest('所有專案版本一致性', () => {
    const versions = {
      master: masterConfig.version,
      contracts: null,
      frontend: null,
      backend: null
    };
    
    // 檢查合約配置
    const contractsConfig = JSON.parse(
      fs.readFileSync(path.join(PROJECTS.contracts, 'config/contracts.json'), 'utf8')
    );
    versions.contracts = contractsConfig.version;
    
    // 檢查前端配置
    const frontendContracts = fs.readFileSync(
      path.join(PROJECTS.frontend, 'src/config/contracts.ts'),
      'utf8'
    );
    const frontendVersion = frontendContracts.match(/DEPLOYMENT_VERSION = '([^']+)'/)?.[1];
    versions.frontend = frontendVersion;
    
    // 檢查後端環境變數
    const backendEnvPath = path.join(PROJECTS.backend, '.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      const backendVersion = backendEnv.match(/VERSION=(.+)/)?.[1];
      versions.backend = backendVersion;
    }
    
    // 顯示版本信息
    log(`    主配置: ${versions.master}`, 'cyan');
    log(`    合約: ${versions.contracts || 'N/A'}`, versions.contracts === versions.master ? 'green' : 'yellow');
    log(`    前端: ${versions.frontend || 'N/A'}`, versions.frontend === versions.master ? 'green' : 'yellow');
    log(`    後端: ${versions.backend || 'N/A'}`, versions.backend === versions.master ? 'green' : 'yellow');
    
    const inconsistent = Object.entries(versions)
      .filter(([key, value]) => key !== 'master' && value && value !== versions.master)
      .map(([key]) => key);
    
    if (inconsistent.length > 0) {
      throw new Error(`版本不一致: ${inconsistent.join(', ')}`);
    }
  });
  
  // 顯示測試結果
  log('\n' + '=' .repeat(50), 'magenta');
  log('📊 測試結果總結', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const total = testResults.passed + testResults.failed;
  log(`\n總測試數: ${total}`, 'yellow');
  log(`✅ 通過: ${testResults.passed}`, 'green');
  log(`❌ 失敗: ${testResults.failed}`, 'red');
  log(`成功率: ${((testResults.passed / total) * 100).toFixed(2)}%`, 'cyan');
  
  if (testResults.failed > 0) {
    log('\n❌ 失敗的測試:', 'red');
    testResults.details
      .filter(t => t.status === 'FAILED')
      .forEach(t => {
        log(`  - ${t.name}: ${t.error}`, 'red');
      });
  }
  
  // 保存測試報告
  const reportPath = path.join(__dirname, '../test-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    version: masterConfig.version,
    results: testResults,
    masterConfig: {
      version: masterConfig.version,
      lastUpdated: masterConfig.lastUpdated,
      contractCount: Object.keys(masterConfig.contracts.mainnet).length
    }
  };
  
  fs.writeFileSync(
    path.join(reportPath, `config-sync-test-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );
  
  log('\n📄 測試報告已保存', 'green');
  
  return testResults.failed === 0;
}

// 執行測試
if (require.main === module) {
  runConfigSyncTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ 測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { runConfigSyncTests };
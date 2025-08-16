#!/usr/bin/env node

// V21 配置檢查工具
// 檢查配置是否同步一致

const fs = require('fs');
const path = require('path');
const config = require('../config/v21-config');

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 讀取前端配置
function readFrontendConfig() {
  const configPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
  
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  const addresses = {};
  
  // 解析 TypeScript 配置
  const addressRegex = /(\w+):\s*'(0x[a-fA-F0-9]{40})'/g;
  let match;
  
  while ((match = addressRegex.exec(content)) !== null) {
    addresses[match[1]] = match[2];
  }
  
  // 解析版本信息
  const versionMatch = content.match(/version:\s*'([^']+)'/);
  const version = versionMatch ? versionMatch[1] : null;
  
  return { addresses, version };
}

// 讀取合約文件中的地址
function readContractAddresses() {
  const contractAddresses = {};
  const contractsDir = path.join(__dirname, '..', 'contracts', 'current');
  
  // 定義要檢查的合約
  const contractsToCheck = [
    { file: 'core/DungeonCore.sol', patterns: ['oracleAddress = 0x', 'heroContractAddress = 0x'] },
    { file: 'core/DungeonMaster.sol', patterns: ['dungeonCore = IDungeonCore\\(0x'] },
    { file: 'nft/Hero.sol', patterns: ['dungeonCore = IDungeonCore\\(0x'] },
    { file: 'nft/Relic.sol', patterns: ['dungeonCore = IDungeonCore\\(0x'] }
  ];
  
  contractsToCheck.forEach(({ file, patterns }) => {
    const filePath = path.join(contractsDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern + '([a-fA-F0-9]{40})', 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const contractName = path.basename(file, '.sol');
          if (!contractAddresses[contractName]) {
            contractAddresses[contractName] = [];
          }
          contractAddresses[contractName].push('0x' + match[1]);
        }
      });
    }
  });
  
  return contractAddresses;
}

// 比較配置
function compareConfigs() {
  log('🔍 V21 配置一致性檢查\n', 'blue');
  log(`主配置版本: ${config.version}`, 'green');
  log(`更新時間: ${config.lastUpdated}\n`, 'green');
  
  const results = {
    matches: [],
    mismatches: [],
    missing: []
  };
  
  // 檢查前端配置
  log('📱 檢查前端配置...', 'yellow');
  const frontendConfig = readFrontendConfig();
  
  if (!frontendConfig) {
    log('   ❌ 前端配置文件不存在', 'red');
    results.missing.push('Frontend config');
  } else {
    log(`   ✅ 版本: ${frontendConfig.version}`, 'green');
    
    // 比較地址
    for (const [key, masterAddress] of Object.entries(config.contracts)) {
      if (masterAddress.address && frontendConfig.addresses[key]) {
        if (frontendConfig.addresses[key].toLowerCase() === masterAddress.address.toLowerCase()) {
          results.matches.push(`${key} (Frontend)`);
        } else {
          results.mismatches.push({
            location: 'Frontend',
            contract: key,
            expected: masterAddress.address,
            actual: frontendConfig.addresses[key]
          });
        }
      }
    }
  }
  
  // 檢查合約硬編碼地址
  log('\n📄 檢查合約硬編碼地址...', 'yellow');
  const contractAddresses = readContractAddresses();
  
  if (Object.keys(contractAddresses).length === 0) {
    log('   ⚠️ 未發現硬編碼地址', 'yellow');
  } else {
    for (const [contract, addresses] of Object.entries(contractAddresses)) {
      log(`   合約 ${contract}: 發現 ${addresses.length} 個地址`, 'blue');
      addresses.forEach(addr => {
        log(`     - ${addr}`, 'reset');
      });
    }
  }
  
  // 顯示結果
  log('\n📊 檢查結果:', 'blue');
  log(`   ✅ 匹配: ${results.matches.length}`, 'green');
  log(`   ❌ 不匹配: ${results.mismatches.length}`, 'red');
  log(`   ⚠️ 缺失: ${results.missing.length}`, 'yellow');
  
  if (results.mismatches.length > 0) {
    log('\n不匹配詳情:', 'red');
    results.mismatches.forEach(mismatch => {
      log(`   ${mismatch.location} - ${mismatch.contract}:`, 'red');
      log(`     預期: ${mismatch.expected}`, 'yellow');
      log(`     實際: ${mismatch.actual}`, 'yellow');
    });
  }
  
  // 生成報告
  const report = {
    timestamp: new Date().toISOString(),
    version: config.version,
    results
  };
  
  const reportPath = path.join(__dirname, '..', 'v21-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 檢查報告已保存: ${reportPath}`, 'green');
  
  // 建議
  if (results.mismatches.length > 0 || results.missing.length > 0) {
    log('\n💡 建議:', 'yellow');
    log('   執行 npm run sync:config 同步配置', 'yellow');
  } else {
    log('\n✨ 所有配置一致！', 'green');
  }
}

// 執行檢查
compareConfigs();
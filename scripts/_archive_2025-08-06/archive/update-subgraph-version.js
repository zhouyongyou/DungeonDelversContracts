#!/usr/bin/env node

/**
 * 快速更新子圖版本腳本
 * 使用方式: node update-subgraph-version.js v3.1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function updateSubgraphVersion(newVersion) {
  if (!newVersion) {
    log('❌ 請提供版本號', 'red');
    log('使用方式: node update-subgraph-version.js v3.1.0', 'yellow');
    process.exit(1);
  }

  log(`\n🔄 更新子圖版本到 ${newVersion}`, 'magenta');
  log('=' .repeat(50), 'magenta');

  try {
    // 1. 更新 master-config.json
    const masterConfigPath = path.join(__dirname, '../config/master-config.json');
    const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    
    const oldVersion = masterConfig.subgraph.studio.version;
    masterConfig.subgraph.studio.version = newVersion;
    masterConfig.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers/${newVersion}`;
    
    // 如果有新的 deployment ID，也可以更新
    const deploymentId = process.argv[3];
    if (deploymentId) {
      masterConfig.subgraph.decentralized.deploymentId = deploymentId;
      log(`📦 更新 Deployment ID: ${deploymentId}`, 'cyan');
    }
    
    fs.writeFileSync(masterConfigPath, JSON.stringify(masterConfig, null, 2));
    log(`✅ master-config.json 更新完成`, 'green');
    log(`   ${oldVersion} → ${newVersion}`, 'cyan');
    
    // 2. 執行同步
    log('\n🔄 執行配置同步...', 'yellow');
    execSync('npm run sync:config', { stdio: 'inherit' });
    
    // 3. 提示後續步驟
    log('\n✅ 子圖版本更新完成！', 'green');
    log('\n📋 後續步驟：', 'yellow');
    log('1. 更新 CDN 配置（前端）:', 'cyan');
    log('   cd /Users/sotadic/Documents/GitHub/DungeonDelvers', 'yellow');
    log('   npm run build', 'yellow');
    log('   部署到 Vercel', 'yellow');
    log('\n2. 刷新後端配置:', 'cyan');
    log('   curl -X POST https://dungeon-delvers-metadata-server.onrender.com/api/config/refresh', 'yellow');
    log('\n3. 驗證更新:', 'cyan');
    log('   curl https://dungeondelvers.xyz/config/v15.json | jq .subgraph.studio.version', 'yellow');
    
  } catch (error) {
    log(`\n❌ 更新失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行
const newVersion = process.argv[2];
updateSubgraphVersion(newVersion);
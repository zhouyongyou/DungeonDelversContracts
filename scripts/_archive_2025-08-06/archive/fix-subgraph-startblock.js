#!/usr/bin/env node

/**
 * 修復子圖 startBlock 的腳本
 * 將 startBlock 更新到 V15 合約部署的區塊
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// V15 部署區塊（估計值，實際可能略有差異）
const V15_START_BLOCK = 55018576;

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

function fixSubgraphStartBlock() {
  log('\n🔧 修復子圖 startBlock', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const subgraphPath = path.join(
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml'
  );
  
  if (!fs.existsSync(subgraphPath)) {
    log('❌ 找不到 subgraph.yaml 文件', 'red');
    return;
  }
  
  // 讀取並解析 YAML
  const content = fs.readFileSync(subgraphPath, 'utf8');
  const config = yaml.load(content);
  
  log('\n📋 當前 startBlock 設置：', 'cyan');
  
  let updated = false;
  
  // 更新每個數據源的 startBlock
  config.dataSources.forEach((dataSource, index) => {
    const currentBlock = dataSource.source.startBlock;
    log(`  ${dataSource.name}: ${currentBlock}`, 'yellow');
    
    if (currentBlock !== V15_START_BLOCK) {
      dataSource.source.startBlock = V15_START_BLOCK;
      updated = true;
    }
  });
  
  if (!updated) {
    log('\n✅ startBlock 已經是正確的值', 'green');
    return;
  }
  
  // 寫回文件
  const newContent = yaml.dump(config, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true
  });
  
  // 修復 YAML 格式（移除不必要的引號）
  const fixedContent = newContent
    .replace(/"(specVersion|schema|file|kind|name|network|address|abi|startBlock|mapping|apiVersion|language|entities|abis|eventHandlers|event|handler)"/g, '$1')
    .replace(/startBlock: "(\d+)"/g, 'startBlock: $1');
  
  fs.writeFileSync(subgraphPath, fixedContent);
  
  log('\n✅ 已更新所有 startBlock 到:', 'green');
  log(`  新區塊: ${V15_START_BLOCK}`, 'cyan');
  
  log('\n📝 下一步：', 'yellow');
  log('  1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers', 'cyan');
  log('  2. npm run codegen', 'cyan');
  log('  3. npm run build', 'cyan');
  log('  4. graph deploy --studio dungeon-delvers', 'cyan');
  
  log('\n⚠️ 注意事項：', 'yellow');
  log('  - 新部署的合約可能還沒有鏈上活動', 'yellow');
  log('  - 子圖同步需要時間', 'yellow');
  log('  - 可以等有實際交易後再部署', 'yellow');
}

// 如果需要 js-yaml，先安裝
try {
  require('js-yaml');
  fixSubgraphStartBlock();
} catch (error) {
  log('\n📦 需要安裝 js-yaml...', 'yellow');
  const { execSync } = require('child_process');
  execSync('npm install js-yaml', { stdio: 'inherit' });
  
  // 重新執行
  delete require.cache[require.resolve('js-yaml')];
  fixSubgraphStartBlock();
}
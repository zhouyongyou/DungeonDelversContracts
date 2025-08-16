#!/usr/bin/env node

/**
 * 自動修復同步後的常見問題
 * 根據 master-config.json 修正所有配置
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 配置文件路徑
const PATHS = {
  masterConfig: path.join(__dirname, '../../config/master-config.json'),
  subgraphYaml: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml',
  frontendEnv: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env',
  frontendEnvLocal: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local',
  backendEnv: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env'
};

// 修復記錄
const fixes = [];

// 讀取主配置
function loadMasterConfig() {
  try {
    return JSON.parse(fs.readFileSync(PATHS.masterConfig, 'utf8'));
  } catch (error) {
    console.error(chalk.red('❌ 無法讀取 master-config.json'));
    process.exit(1);
  }
}

// 備份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// 修復子圖配置
function fixSubgraph(config) {
  console.log(chalk.cyan('\n📊 修復子圖配置...'));
  
  const backupPath = backupFile(PATHS.subgraphYaml);
  console.log(chalk.gray(`   備份: ${backupPath}`));
  
  let content = fs.readFileSync(PATHS.subgraphYaml, 'utf8');
  const originalContent = content;
  
  // 1. 修復 specVersion
  const oldSpecVersion = content.match(/specVersion:\s*([\d.]+)/)?.[1];
  if (oldSpecVersion !== '0.0.4') {
    content = content.replace(/specVersion:\s*[\d.]+/, 'specVersion: 0.0.4');
    fixes.push(`修復 specVersion: ${oldSpecVersion} → 0.0.4`);
  }
  
  // 2. 修復所有起始區塊
  const expectedStartBlock = config.deployment.startBlock.toString();
  const startBlockPattern = /startBlock:\s*\d+/g;
  const wrongBlocks = new Set();
  
  content = content.replace(startBlockPattern, (match) => {
    const currentBlock = match.match(/\d+/)[0];
    if (currentBlock !== expectedStartBlock) {
      wrongBlocks.add(currentBlock);
      return `startBlock: ${expectedStartBlock}`;
    }
    return match;
  });
  
  if (wrongBlocks.size > 0) {
    fixes.push(`修復起始區塊: ${[...wrongBlocks].join(', ')} → ${expectedStartBlock}`);
  }
  
  // 3. 修復合約地址
  const addressFixes = [
    {
      name: 'AltarOfAscension',
      correct: config.contracts.mainnet.ALTAROFASCENSION_ADDRESS,
      wrong: ['0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787'] // PlayerVault 地址
    },
    {
      name: 'VRFManagerV2Plus',
      correct: config.contracts.mainnet.VRFMANAGER_ADDRESS,
      wrong: ['0x095559778C0BAA2d8FA040Ab0f8752cF07779D33'] // AltarOfAscension 地址
    }
  ];
  
  addressFixes.forEach(fix => {
    fix.wrong.forEach(wrongAddr => {
      const pattern = new RegExp(
        `(name: ${fix.name}[\\s\\S]*?address: )"${wrongAddr}"`,
        'g'
      );
      
      if (content.match(pattern)) {
        content = content.replace(pattern, `$1"${fix.correct}"`);
        fixes.push(`修復 ${fix.name} 地址: ${wrongAddr} → ${fix.correct}`);
      }
    });
  });
  
  // 4. 修復註釋中的區塊號
  const commentPattern = /# V25 VRF Version.*Block \d+/;
  if (content.match(commentPattern)) {
    content = content.replace(
      commentPattern,
      `# V25 VRF Version - 8/6 pm 5 Deployment - Block ${expectedStartBlock}`
    );
    fixes.push('更新註釋中的區塊號');
  }
  
  // 寫入修復後的內容
  if (content !== originalContent) {
    fs.writeFileSync(PATHS.subgraphYaml, content, 'utf8');
    console.log(chalk.green('   ✅ 子圖配置已修復'));
  } else {
    console.log(chalk.gray('   ℹ️ 子圖配置無需修復'));
  }
}

// 修復環境變數
function fixEnvFiles(config) {
  console.log(chalk.cyan('\n🔧 修復環境變數...'));
  
  const envFiles = [
    { path: PATHS.frontendEnv, name: '前端 .env' },
    { path: PATHS.frontendEnvLocal, name: '前端 .env.local' },
    { path: PATHS.backendEnv, name: '後端 .env' }
  ];
  
  const expectedUrl = config.subgraph.studio.url;
  
  envFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      console.log(chalk.yellow(`   ⚠️ ${file.name} 不存在，跳過`));
      return;
    }
    
    let content = fs.readFileSync(file.path, 'utf8');
    const originalContent = content;
    
    // 修復子圖 URL
    const patterns = [
      /VITE_THE_GRAPH_STUDIO_API_URL=.*/g,
      /VITE_GRAPH_STUDIO_URL=.*/g,
      /THE_GRAPH_STUDIO_API_URL=.*/g,
      /GRAPH_STUDIO_URL=.*/g
    ];
    
    patterns.forEach(pattern => {
      if (content.match(pattern)) {
        const key = pattern.source.split('=')[0].replace(/\\/g, '');
        content = content.replace(pattern, `${key}=${expectedUrl}`);
      }
    });
    
    if (content !== originalContent) {
      const backupPath = backupFile(file.path);
      fs.writeFileSync(file.path, content, 'utf8');
      fixes.push(`修復 ${file.name} 中的子圖 URL`);
      console.log(chalk.green(`   ✅ ${file.name} 已修復`));
    } else {
      console.log(chalk.gray(`   ℹ️ ${file.name} 無需修復`));
    }
  });
}

// 顯示修復摘要
function showSummary() {
  console.log(chalk.bold.cyan('\n\n📊 ========== 修復摘要 ==========\n'));
  
  if (fixes.length > 0) {
    console.log(chalk.green(`成功修復 ${fixes.length} 個問題:`));
    fixes.forEach((fix, index) => {
      console.log(chalk.green(`  ${index + 1}. ${fix}`));
    });
    
    console.log(chalk.yellow('\n💡 建議: 運行 npm run verify-sync 驗證修復結果'));
  } else {
    console.log(chalk.gray('沒有發現需要修復的問題'));
  }
}

// 主函數
async function main() {
  console.log(chalk.bold.cyan('\n🔧 ========== V25 同步修復工具 ==========\n'));
  
  const config = loadMasterConfig();
  
  console.log(chalk.yellow('📋 主配置資訊:'));
  console.log(`   版本: ${config.version}`);
  console.log(`   起始區塊: ${config.deployment.startBlock}`);
  console.log(`   子圖版本: ${config.subgraph.studio.version}`);
  
  // 執行修復
  fixSubgraph(config);
  fixEnvFiles(config);
  
  // 顯示摘要
  showSummary();
  
  console.log(chalk.bold.green('\n🎉 修復完成！\n'));
}

// 執行
main().catch(error => {
  console.error(chalk.red('修復過程發生錯誤:'), error);
  process.exit(1);
});
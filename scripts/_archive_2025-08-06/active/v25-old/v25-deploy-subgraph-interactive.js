#!/usr/bin/env node

/**
 * V25 子圖部署腳本（互動式版本）
 * 包含完整的認證和部署流程
 */

const { execSync } = require('child_process');
const readline = require('readline');
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

// 配置
const CONFIG = {
  deployKey: '1a4c2c9d0a6d88c5a67193a04eb93e14',
  subgraphName: 'dungeon-delvers---bsc',
  subgraphPath: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

// 創建讀取介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 執行命令
function executeCommand(command, description, cwd = null) {
  console.log(`${colors.yellow}${description}...${colors.reset}`);
  console.log(`${colors.cyan}執行: ${command}${colors.reset}`);
  
  try {
    const options = { stdio: 'inherit' };
    if (cwd) options.cwd = cwd;
    
    execSync(command, options);
    console.log(`${colors.green}✓ ${description} 成功${colors.reset}\n`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ ${description} 失敗${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

// 檢查 graph-cli
function checkGraphCli() {
  try {
    execSync('graph --version', { stdio: 'pipe' });
    console.log(`${colors.green}✓ graph-cli 已安裝${colors.reset}`);
    return true;
  } catch {
    console.log(`${colors.red}✗ graph-cli 未安裝${colors.reset}`);
    console.log('請執行: yarn global add @graphprotocol/graph-cli');
    return false;
  }
}

// 主流程
async function main() {
  console.log(`${colors.bright}================================${colors.reset}`);
  console.log(`${colors.bright}V25 子圖部署腳本（互動式）${colors.reset}`);
  console.log(`${colors.bright}================================${colors.reset}\n`);

  // 檢查 graph-cli
  if (!checkGraphCli()) {
    process.exit(1);
  }

  // 檢查子圖目錄
  if (!fs.existsSync(CONFIG.subgraphPath)) {
    console.log(`${colors.red}錯誤：子圖目錄不存在${colors.reset}`);
    console.log(`路徑：${CONFIG.subgraphPath}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}子圖路徑: ${CONFIG.subgraphPath}${colors.reset}`);
  console.log(`${colors.cyan}部署名稱: ${CONFIG.subgraphName}${colors.reset}`);
  console.log(`${colors.cyan}Deploy Key: ${CONFIG.deployKey.substring(0, 8)}...${colors.reset}\n`);

  // 確認部署
  const answer = await new Promise(resolve => {
    rl.question('確認開始部署? (y/n): ', resolve);
  });

  if (answer.toLowerCase() !== 'y') {
    console.log('取消部署');
    rl.close();
    return;
  }

  // 步驟 1: 認證（最重要！）
  console.log(`\n${colors.bright}步驟 1: 認證 The Graph Studio${colors.reset}`);
  if (!executeCommand(
    `graph auth --studio ${CONFIG.deployKey}`,
    '認證 Graph Studio'
  )) {
    console.log(`${colors.red}認證失敗，請檢查 Deploy Key${colors.reset}`);
    rl.close();
    return;
  }

  // 步驟 2: 代碼生成
  console.log(`\n${colors.bright}步驟 2: 生成 TypeScript 代碼${colors.reset}`);
  if (!executeCommand(
    'graph codegen',
    '生成代碼',
    CONFIG.subgraphPath
  )) {
    rl.close();
    return;
  }

  // 步驟 3: 構建
  console.log(`\n${colors.bright}步驟 3: 構建子圖${colors.reset}`);
  if (!executeCommand(
    'graph build',
    '構建子圖',
    CONFIG.subgraphPath
  )) {
    rl.close();
    return;
  }

  // 步驟 4: 部署
  console.log(`\n${colors.bright}步驟 4: 部署到 The Graph Studio${colors.reset}`);
  console.log(`${colors.yellow}注意：部署過程可能需要幾分鐘...${colors.reset}`);
  
  // 部署命令 - 使用 --studio 標誌
  const deploySuccess = executeCommand(
    `graph deploy --studio ${CONFIG.subgraphName}`,
    '部署子圖',
    CONFIG.subgraphPath
  );

  if (deploySuccess) {
    console.log(`\n${colors.green}${colors.bright}================================${colors.reset}`);
    console.log(`${colors.green}${colors.bright}子圖部署成功！${colors.reset}`);
    console.log(`${colors.green}${colors.bright}================================${colors.reset}\n`);
    
    console.log(`子圖名稱: ${colors.yellow}${CONFIG.subgraphName}${colors.reset}`);
    console.log(`查看子圖: ${colors.blue}https://thegraph.com/studio/subgraph/${CONFIG.subgraphName}${colors.reset}\n`);
    
    console.log(`${colors.bright}後續步驟：${colors.reset}`);
    console.log('1. 在 The Graph Studio 中發布子圖到去中心化網絡');
    console.log('2. 使用 GRT 代幣進行 Signal');
    console.log('3. 等待索引器開始索引你的子圖');
  }

  rl.close();
}

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}發生錯誤：${error.message}${colors.reset}`);
  process.exit(1);
});

// 執行
main().catch(console.error);
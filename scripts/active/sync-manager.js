#!/usr/bin/env node

/**
 * 🎯 DungeonDelvers 同步管理器
 * 統一的配置同步入口，自動處理所有同步流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 主配置路徑
const MASTER_CONFIG_PATH = path.join(__dirname, '../../config/master-config.json');

// 讀取主配置
function loadMasterConfig() {
  try {
    return JSON.parse(fs.readFileSync(MASTER_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error(chalk.red('❌ 無法讀取 master-config.json'));
    process.exit(1);
  }
}

// 顯示當前配置
function displayCurrentConfig() {
  const config = loadMasterConfig();
  
  console.log(chalk.cyan('\n📋 當前主配置：'));
  console.log(chalk.white('  版本: ') + chalk.yellow(config.version));
  console.log(chalk.white('  起始區塊: ') + chalk.yellow(config.deployment.startBlock));
  console.log(chalk.white('  子圖版本: ') + chalk.yellow(config.subgraph.studio.version));
  console.log(chalk.white('  更新時間: ') + chalk.gray(config.lastUpdated));
  
  // 顯示關鍵合約地址
  console.log(chalk.cyan('\n🏛️ 關鍵合約地址：'));
  const keyContracts = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION', 'VRFMANAGER'];
  keyContracts.forEach(contract => {
    const address = config.contracts.mainnet[`${contract}_ADDRESS`];
    if (address) {
      console.log(chalk.white(`  ${contract}: `) + chalk.gray(address));
    }
  });
}

// 執行命令
function runCommand(command, description) {
  console.log(chalk.cyan(`\n▶️ ${description}...`));
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../')
    });
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ ${description}失敗`));
    return false;
  }
}

// 詢問用戶
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow(question), (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

// 主流程
async function main() {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║           🎯 DungeonDelvers 同步管理器 v1.0                  ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝'));
  
  // 顯示當前配置
  displayCurrentConfig();
  
  // 詢問操作
  console.log(chalk.yellow('\n請選擇操作：'));
  console.log('  1. 🚀 快速同步（同步 + 驗證）');
  console.log('  2. 🛡️ 安全同步（同步 + 驗證 + 修復 + 再驗證）');
  console.log('  3. 🔍 僅驗證當前配置');
  console.log('  4. 🔧 僅修復問題');
  console.log('  5. 📝 編輯主配置文件');
  console.log('  6. 🔄 完整流程（編輯 + 同步 + 驗證 + 修復）');
  console.log('  0. 退出');
  
  const choice = await askQuestion('\n請輸入選項 (0-6): ');
  
  switch(choice) {
    case '1':
      await quickSync();
      break;
    case '2':
      await safeSync();
      break;
    case '3':
      await verifyOnly();
      break;
    case '4':
      await fixOnly();
      break;
    case '5':
      await editConfig();
      break;
    case '6':
      await fullProcess();
      break;
    case '0':
      console.log(chalk.gray('\n👋 再見！'));
      break;
    default:
      console.log(chalk.red('\n❌ 無效選項'));
  }
  
  rl.close();
}

// 快速同步
async function quickSync() {
  console.log(chalk.bold.green('\n🚀 開始快速同步...'));
  
  // 詢問子圖版本
  const version = await askQuestion('請輸入子圖版本 (如 v3.6.8，按 Enter 使用當前版本): ');
  
  // 執行同步
  if (version) {
    process.env.SUBGRAPH_VERSION = version;
  }
  
  runCommand('cd scripts/active/sync-system && node index.js', '執行配置同步');
  runCommand('npm run verify-sync', '驗證同步結果');
  
  // 檢查是否需要修復
  const needFix = await askQuestion('\n發現問題需要修復嗎？(y/n): ');
  if (needFix === 'y') {
    runCommand('npm run fix-sync', '自動修復問題');
    runCommand('npm run verify-sync', '再次驗證');
  }
  
  console.log(chalk.bold.green('\n✅ 快速同步完成！'));
}

// 安全同步
async function safeSync() {
  console.log(chalk.bold.green('\n🛡️ 開始安全同步...'));
  
  const version = await askQuestion('請輸入子圖版本 (如 v3.6.8，按 Enter 使用當前版本): ');
  
  if (version) {
    process.env.SUBGRAPH_VERSION = version;
  }
  
  // 執行完整流程
  const steps = [
    { cmd: 'cd scripts/active/sync-system && node index.js', desc: '執行配置同步' },
    { cmd: 'npm run verify-sync', desc: '第一次驗證' },
    { cmd: 'npm run fix-sync', desc: '自動修復問題' },
    { cmd: 'npm run verify-sync', desc: '最終驗證' }
  ];
  
  for (const step of steps) {
    if (!runCommand(step.cmd, step.desc)) {
      console.log(chalk.red('\n⚠️ 流程中斷，請檢查錯誤'));
      return;
    }
  }
  
  console.log(chalk.bold.green('\n✅ 安全同步完成！所有配置已驗證正確。'));
}

// 僅驗證
async function verifyOnly() {
  console.log(chalk.bold.cyan('\n🔍 驗證當前配置...'));
  runCommand('npm run verify-sync', '驗證配置');
}

// 僅修復
async function fixOnly() {
  console.log(chalk.bold.cyan('\n🔧 修復配置問題...'));
  runCommand('npm run fix-sync', '修復問題');
  runCommand('npm run verify-sync', '驗證修復結果');
}

// 編輯配置
async function editConfig() {
  console.log(chalk.bold.cyan('\n📝 編輯主配置文件...'));
  
  // 先備份
  const backupPath = `${MASTER_CONFIG_PATH}.backup-${Date.now()}`;
  fs.copyFileSync(MASTER_CONFIG_PATH, backupPath);
  console.log(chalk.gray(`已備份到: ${backupPath}`));
  
  // 使用默認編輯器打開
  const editor = process.env.EDITOR || 'vi';
  runCommand(`${editor} ${MASTER_CONFIG_PATH}`, '編輯配置文件');
  
  // 顯示更新後的配置
  displayCurrentConfig();
  
  // 詢問是否同步
  const doSync = await askQuestion('\n配置已更新，是否立即同步？(y/n): ');
  if (doSync === 'y') {
    await safeSync();
  }
}

// 完整流程
async function fullProcess() {
  console.log(chalk.bold.magenta('\n🔄 開始完整配置更新流程...'));
  
  // 1. 編輯配置
  await editConfig();
  
  // 2. 如果用戶沒有在編輯後選擇同步，這裡再執行
  const config = loadMasterConfig();
  console.log(chalk.cyan('\n確認要同步以下配置：'));
  console.log(`  版本: ${chalk.yellow(config.version)}`);
  console.log(`  起始區塊: ${chalk.yellow(config.deployment.startBlock)}`);
  console.log(`  子圖版本: ${chalk.yellow(config.subgraph.studio.version)}`);
  
  const confirm = await askQuestion('\n確認執行同步？(y/n): ');
  if (confirm === 'y') {
    await safeSync();
  }
  
  console.log(chalk.bold.magenta('\n✅ 完整流程執行完畢！'));
}

// 執行主程序
main().catch(error => {
  console.error(chalk.red('發生錯誤:'), error);
  process.exit(1);
});
#!/usr/bin/env node

/**
 * 驗證同步結果的正確性
 * 在執行 sync-system 後運行此腳本以確保配置正確
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 配置文件路徑
const PATHS = {
  masterConfig: path.join(__dirname, '../../config/master-config.json'),
  subgraphYaml: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml',
  frontendEnv: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env',
  frontendContracts: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
  backendContracts: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js'
};

// 讀取主配置
function loadMasterConfig() {
  try {
    return JSON.parse(fs.readFileSync(PATHS.masterConfig, 'utf8'));
  } catch (error) {
    console.error(chalk.red('❌ 無法讀取 master-config.json'));
    process.exit(1);
  }
}

// 驗證結果收集
const issues = [];
const successes = [];

// 驗證函數
function verify(description, actual, expected) {
  if (actual === expected) {
    successes.push(`✅ ${description}: ${chalk.green(actual)}`);
    return true;
  } else {
    issues.push(`❌ ${description}:\n   期望: ${chalk.green(expected)}\n   實際: ${chalk.red(actual)}`);
    return false;
  }
}

// 驗證子圖配置
function verifySubgraph(config) {
  console.log(chalk.cyan('\n📊 驗證子圖配置...'));
  
  const subgraphContent = fs.readFileSync(PATHS.subgraphYaml, 'utf8');
  const lines = subgraphContent.split('\n');
  
  // 檢查起始區塊
  const startBlockPattern = /startBlock:\s*(\d+)/g;
  const startBlocks = [...subgraphContent.matchAll(startBlockPattern)];
  const expectedStartBlock = config.deployment.startBlock.toString();
  
  let allBlocksCorrect = true;
  startBlocks.forEach((match, index) => {
    if (match[1] !== expectedStartBlock) {
      allBlocksCorrect = false;
    }
  });
  
  verify(
    '子圖起始區塊一致性',
    allBlocksCorrect ? expectedStartBlock : '不一致',
    expectedStartBlock
  );
  
  // 檢查關鍵合約地址
  const contracts = [
    { name: 'Hero', key: 'HERO_ADDRESS' },
    { name: 'Relic', key: 'RELIC_ADDRESS' },
    { name: 'DungeonMaster', key: 'DUNGEONMASTER_ADDRESS' },
    { name: 'AltarOfAscension', key: 'ALTAROFASCENSION_ADDRESS' },
    { name: 'VRFManagerV2Plus', key: 'VRFMANAGER_ADDRESS' }
  ];
  
  contracts.forEach(contract => {
    const expectedAddress = config.contracts.mainnet[contract.key];
    const pattern = new RegExp(`name: ${contract.name}[\\s\\S]*?address: "(0x[a-fA-F0-9]{40})"`);
    const match = subgraphContent.match(pattern);
    
    if (match) {
      verify(
        `子圖 ${contract.name} 地址`,
        match[1],
        expectedAddress
      );
    } else {
      issues.push(`❌ 子圖中找不到 ${contract.name} 配置`);
    }
  });
  
  // 檢查版本
  const specVersionMatch = subgraphContent.match(/specVersion:\s*([\d.]+)/);
  verify('子圖 specVersion', specVersionMatch?.[1] || '未找到', '0.0.4');
}

// 驗證前端配置
function verifyFrontend(config) {
  console.log(chalk.cyan('\n🎯 驗證前端配置...'));
  
  // 檢查環境變數
  const envContent = fs.readFileSync(PATHS.frontendEnv, 'utf8');
  const expectedUrl = config.subgraph.studio.url;
  const urlPattern = /VITE_THE_GRAPH_STUDIO_API_URL=(.*)/;
  const urlMatch = envContent.match(urlPattern);
  
  verify(
    '前端子圖 URL',
    urlMatch?.[1] || '未找到',
    expectedUrl
  );
  
  // 檢查 contracts.ts
  const contractsContent = fs.readFileSync(PATHS.frontendContracts, 'utf8');
  
  // 檢查幾個關鍵地址
  const keyContracts = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION'];
  keyContracts.forEach(contract => {
    const address = config.contracts.mainnet[`${contract}_ADDRESS`];
    if (contractsContent.includes(address)) {
      successes.push(`✅ 前端 ${contract} 地址: ${chalk.green(address)}`);
    } else {
      issues.push(`❌ 前端 contracts.ts 中找不到 ${contract} 地址 ${address}`);
    }
  });
}

// 驗證後端配置
function verifyBackend(config) {
  console.log(chalk.cyan('\n🎯 驗證後端配置...'));
  
  const contractsContent = fs.readFileSync(PATHS.backendContracts, 'utf8');
  
  // 檢查關鍵地址
  const keyContracts = ['HERO', 'RELIC', 'DUNGEONMASTER'];
  keyContracts.forEach(contract => {
    const address = config.contracts.mainnet[`${contract}_ADDRESS`];
    if (contractsContent.includes(address)) {
      successes.push(`✅ 後端 ${contract} 地址: ${chalk.green(address)}`);
    } else {
      issues.push(`❌ 後端 contracts.js 中找不到 ${contract} 地址 ${address}`);
    }
  });
}

// 主函數
async function main() {
  console.log(chalk.bold.cyan('\n🔍 ========== V25 同步驗證工具 ==========\n'));
  
  const config = loadMasterConfig();
  
  console.log(chalk.yellow('📋 主配置資訊:'));
  console.log(`   版本: ${config.version}`);
  console.log(`   起始區塊: ${config.deployment.startBlock}`);
  console.log(`   子圖版本: ${config.subgraph.studio.version}`);
  console.log(`   VRF Manager: ${config.contracts.mainnet.VRFMANAGER_ADDRESS}`);
  
  // 執行驗證
  verifySubgraph(config);
  verifyFrontend(config);
  verifyBackend(config);
  
  // 輸出結果
  console.log(chalk.bold.cyan('\n\n📊 ========== 驗證結果 ==========\n'));
  
  if (successes.length > 0) {
    console.log(chalk.green('成功項目:'));
    successes.forEach(s => console.log('  ' + s));
  }
  
  if (issues.length > 0) {
    console.log(chalk.red('\n發現問題:'));
    issues.forEach(issue => console.log('  ' + issue));
    
    console.log(chalk.yellow('\n💡 建議: 運行 npm run fix-sync 自動修復這些問題'));
    process.exit(1);
  } else {
    console.log(chalk.bold.green('\n🎉 所有配置驗證通過！'));
  }
}

// 執行
main().catch(error => {
  console.error(chalk.red('驗證過程發生錯誤:'), error);
  process.exit(1);
});
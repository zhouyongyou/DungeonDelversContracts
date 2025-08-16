#!/usr/bin/env node

/**
 * V25 部署腳本 - 增強版（含重試機制）
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// 重試配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5秒
  rpcEndpoints: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://bsc-dataseed.binance.org'
  ]
};

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

async function retryWithFallback(fn, fnName = 'operation') {
  let lastError;
  
  for (let i = 0; i < RETRY_CONFIG.maxRetries; i++) {
    try {
      console.log(`${colors.blue}[INFO]${colors.reset} 嘗試 ${fnName} (第 ${i + 1} 次)...`);
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`${colors.red}[ERROR]${colors.reset} ${fnName} 失敗: ${error.message}`);
      
      if (i < RETRY_CONFIG.maxRetries - 1) {
        console.log(`${colors.yellow}[INFO]${colors.reset} ${RETRY_CONFIG.retryDelay/1000} 秒後重試...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay));
      }
    }
  }
  
  throw lastError;
}

async function testConnection() {
  console.log(`${colors.cyan}測試 RPC 連接...${colors.reset}`);
  
  try {
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`${colors.green}✅ RPC 連接成功${colors.reset}`);
    console.log(`  - 網路: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`  - 當前區塊: ${blockNumber}`);
    
    // 測試錢包連接
    const [deployer] = await hre.ethers.getSigners();
    const balance = await provider.getBalance(deployer.address);
    
    console.log(`  - 部署錢包: ${deployer.address}`);
    console.log(`  - 餘額: ${ethers.formatEther(balance)} BNB`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ RPC 連接失敗: ${error.message}${colors.reset}`);
    return false;
  }
}

async function deployWithRetry() {
  // 首先測試連接
  const connectionOk = await retryWithFallback(testConnection, '連接測試');
  
  if (!connectionOk) {
    throw new Error('無法建立穩定的 RPC 連接');
  }
  
  console.log(`\n${colors.bright}開始執行原部署腳本...${colors.reset}\n`);
  
  // 執行原部署腳本
  await retryWithFallback(async () => {
    // 動態導入原部署腳本
    delete require.cache[require.resolve('./v25-deploy-complete-sequential.js')];
    await require('./v25-deploy-complete-sequential.js');
  }, '合約部署');
}

// 主函數
async function main() {
  console.log(`${colors.bright}
==================================================
🚀 V25 部署腳本 - 增強版（含重試機制）
==================================================
${colors.reset}`);

  try {
    await deployWithRetry();
    console.log(`\n${colors.green}✅ 部署成功完成！${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}❌ 部署失敗: ${error.message}${colors.reset}`);
    
    // 提供診斷建議
    console.log(`\n${colors.yellow}診斷建議：${colors.reset}`);
    console.log('1. 檢查網路連接是否穩定');
    console.log('2. 確認 .env 文件中的 PRIVATE_KEY 是否正確');
    console.log('3. 嘗試使用 VPN 或更換網路環境');
    console.log('4. 檢查 BSC 網路狀態: https://bscscan.com/gastracker');
    console.log(`5. 使用備用 RPC: ${RETRY_CONFIG.rpcEndpoints.join(', ')}`);
    
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { retryWithFallback, testConnection };
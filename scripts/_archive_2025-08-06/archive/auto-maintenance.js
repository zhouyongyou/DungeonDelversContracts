#!/usr/bin/env node

// 自動維護腳本 - 定期執行交易保持池子活躍

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// ===== 配置 =====
const CONFIG = {
  INTERVAL_MINUTES: 20,        // 每 20 分鐘執行一次
  TRADE_AMOUNT_USD: '0.5',     // 每次交易 0.5 USD
  AUTO_MODE: true,             // 自動模式
  MAX_FAILURES: 3              // 最大失敗次數
};

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  PANCAKE_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'
};

// ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const POOL_ABI = [
  "function fee() view returns (uint24)",
  "function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)"
];

// 狀態追踪
let tradeCount = 0;
let failureCount = 0;
let lastTradeTime = 0;
let isTrading = false;

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleString('zh-TW');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

async function checkPoolHealth(provider) {
  const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  
  try {
    // 測試 30 分鐘 TWAP
    await pool.observe([1800, 0]);
    return { healthy: true, twap30: true };
  } catch (error) {
    if (error.reason === 'OLD') {
      try {
        // 測試 1 分鐘 TWAP
        await pool.observe([60, 0]);
        return { healthy: true, twap30: false };
      } catch {
        return { healthy: false, twap30: false };
      }
    }
    return { healthy: false, twap30: false };
  }
}

async function performTrade(signer, direction = 'BUY') {
  if (isTrading) {
    log('已有交易正在執行，跳過', 'yellow');
    return false;
  }
  
  isTrading = true;
  
  try {
    const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
    const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
    const router = new ethers.Contract(ADDRESSES.PANCAKE_V3_ROUTER, ROUTER_ABI, signer);
    const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, signer.provider);
    
    // 獲取池子費率
    const fee = await pool.fee();
    
    if (direction === 'BUY') {
      // USD -> SOUL
      const amount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_USD, 18);
      
      // 檢查餘額
      const balance = await usdToken.balanceOf(signer.address);
      if (balance < amount) {
        log(`USD 餘額不足 (${ethers.formatUnits(balance, 18)} USD)`, 'red');
        return false;
      }
      
      // 檢查授權
      const allowance = await usdToken.allowance(signer.address, ADDRESSES.PANCAKE_V3_ROUTER);
      if (allowance < amount) {
        log('設置授權...', 'cyan');
        const approveTx = await usdToken.approve(ADDRESSES.PANCAKE_V3_ROUTER, ethers.parseUnits('10000', 18));
        await approveTx.wait();
      }
      
      // 執行交易
      log(`執行買入: ${CONFIG.TRADE_AMOUNT_USD} USD → SOUL`, 'green');
      
      const params = {
        tokenIn: ADDRESSES.USD,
        tokenOut: ADDRESSES.SOUL,
        fee: fee,
        recipient: signer.address,
        amountIn: amount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      
      const tx = await router.exactInputSingle(params, {
        gasLimit: 300000
      });
      
      log(`交易哈希: ${tx.hash}`, 'cyan');
      const receipt = await tx.wait();
      log(`✅ 交易成功！區塊: ${receipt.blockNumber}`, 'green');
      
      return true;
      
    } else {
      // SOUL -> USD
      // 估算需要多少 SOUL（簡化版本，使用固定比例）
      const soulAmount = ethers.parseUnits('8000', 18); // 約 0.5 USD 的 SOUL
      
      // 檢查餘額
      const balance = await soulToken.balanceOf(signer.address);
      if (balance < soulAmount) {
        log(`SOUL 餘額不足 (${ethers.formatUnits(balance, 18)} SOUL)`, 'red');
        return false;
      }
      
      // 檢查授權
      const allowance = await soulToken.allowance(signer.address, ADDRESSES.PANCAKE_V3_ROUTER);
      if (allowance < soulAmount) {
        log('設置授權...', 'cyan');
        const approveTx = await soulToken.approve(ADDRESSES.PANCAKE_V3_ROUTER, ethers.parseUnits('10000000', 18));
        await approveTx.wait();
      }
      
      // 執行交易
      log(`執行賣出: SOUL → USD`, 'red');
      
      const params = {
        tokenIn: ADDRESSES.SOUL,
        tokenOut: ADDRESSES.USD,
        fee: fee,
        recipient: signer.address,
        amountIn: soulAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      
      const tx = await router.exactInputSingle(params, {
        gasLimit: 300000
      });
      
      log(`交易哈希: ${tx.hash}`, 'cyan');
      const receipt = await tx.wait();
      log(`✅ 交易成功！區塊: ${receipt.blockNumber}`, 'green');
      
      return true;
    }
    
  } catch (error) {
    log(`❌ 交易失敗: ${error.message}`, 'red');
    failureCount++;
    return false;
  } finally {
    isTrading = false;
  }
}

async function showStatus(signer) {
  const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  
  const usdBalance = await usdToken.balanceOf(signer.address);
  const soulBalance = await soulToken.balanceOf(signer.address);
  const bnbBalance = await signer.provider.getBalance(signer.address);
  
  console.log('\n========== 狀態報告 ==========');
  console.log(`📊 交易統計:`);
  console.log(`   成功交易: ${tradeCount} 次`);
  console.log(`   失敗次數: ${failureCount} 次`);
  console.log(`   運行時間: ${Math.floor((Date.now() - startTime) / 60000)} 分鐘`);
  console.log(`\n💰 當前餘額:`);
  console.log(`   USD:  ${Number(ethers.formatUnits(usdBalance, 18)).toFixed(2)}`);
  console.log(`   SOUL: ${Number(ethers.formatUnits(soulBalance, 18)).toFixed(2)}`);
  console.log(`   BNB:  ${Number(ethers.formatEther(bnbBalance)).toFixed(4)}`);
  console.log('==============================\n');
}

let startTime = Date.now();

async function mainLoop() {
  log('🤖 池子自動維護機器人啟動', 'green');
  log(`⏰ 維護間隔: ${CONFIG.INTERVAL_MINUTES} 分鐘`);
  log(`💰 交易金額: ${CONFIG.TRADE_AMOUNT_USD} USD\n`);
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  log(`🔑 維護地址: ${signer.address}`);
  
  // 顯示初始狀態
  await showStatus(signer);
  
  // 主循環
  while (CONFIG.AUTO_MODE && failureCount < CONFIG.MAX_FAILURES) {
    try {
      // 檢查池子健康度
      log('檢查池子狀態...', 'cyan');
      const health = await checkPoolHealth(provider);
      
      if (health.twap30) {
        log('✅ 池子健康，30分鐘 TWAP 正常', 'green');
      } else if (health.healthy) {
        log('⚠️  池子需要維護，30分鐘 TWAP 不可用', 'yellow');
      } else {
        log('❌ 池子異常', 'red');
      }
      
      // 決定是否交易
      const timeSinceLastTrade = Date.now() - lastTradeTime;
      const shouldTrade = !health.twap30 || timeSinceLastTrade > (CONFIG.INTERVAL_MINUTES * 60 * 1000);
      
      if (shouldTrade) {
        // 交替買賣方向
        const direction = tradeCount % 2 === 0 ? 'BUY' : 'SELL';
        
        log(`\n🔄 執行第 ${tradeCount + 1} 筆維護交易...`);
        const success = await performTrade(signer, direction);
        
        if (success) {
          tradeCount++;
          lastTradeTime = Date.now();
          failureCount = 0; // 重置失敗計數
          
          // 顯示狀態
          await showStatus(signer);
        }
      } else {
        const minutesRemaining = Math.ceil((CONFIG.INTERVAL_MINUTES * 60 * 1000 - timeSinceLastTrade) / 60000);
        log(`⏳ 下次維護: ${minutesRemaining} 分鐘後`, 'yellow');
      }
      
    } catch (error) {
      log(`系統錯誤: ${error.message}`, 'red');
      failureCount++;
    }
    
    // 等待 1 分鐘後再次檢查
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
  
  if (failureCount >= CONFIG.MAX_FAILURES) {
    log(`\n❌ 連續失敗 ${CONFIG.MAX_FAILURES} 次，停止維護`, 'red');
  }
}

// 測試模式：執行單筆交易
async function testSingleTrade() {
  log('🧪 測試模式：執行單筆交易\n', 'cyan');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  await showStatus(signer);
  
  // 執行買入測試
  const success = await performTrade(signer, 'BUY');
  
  if (success) {
    log('\n✅ 測試交易成功！', 'green');
    await showStatus(signer);
  } else {
    log('\n❌ 測試交易失敗', 'red');
  }
}

// 優雅關閉
process.on('SIGINT', () => {
  log('\n\n👋 停止維護機器人...', 'yellow');
  showStatus().then(() => {
    process.exit(0);
  });
});

// 主程式入口
if (process.argv[2] === 'test') {
  // 測試模式
  testSingleTrade().catch(error => {
    log(`致命錯誤: ${error.message}`, 'red');
    process.exit(1);
  });
} else {
  // 自動模式
  mainLoop().catch(error => {
    log(`致命錯誤: ${error.message}`, 'red');
    process.exit(1);
  });
}
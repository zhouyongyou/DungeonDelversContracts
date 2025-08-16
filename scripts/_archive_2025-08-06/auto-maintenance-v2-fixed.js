require('dotenv').config();
const { ethers } = require('ethers');

// ========== 配置 ==========
const CONFIG = {
  // 交易參數
  TRADE_AMOUNT_USD: '0.5',           // 每次交易金額 (USD)
  TRADE_AMOUNT_SOUL: '8000',         // 每次交易金額 (SOUL)
  SLIPPAGE_PERCENT: 1.5,             // 滑點保護 (%)
  
  // 時間參數
  MAINTENANCE_INTERVAL: 20 * 60 * 1000,  // 20 分鐘
  CHECK_INTERVAL: 60 * 1000,             // 1 分鐘檢查一次
  
  // Gas 設置
  GAS_PRICE: '100000000',  // 0.1 Gwei
};

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  PANCAKE_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  ORACLE: '0xb9317179466fd7fb253669538dE1c4635E81eAc4' // V22 Adaptive
};

// ABIs
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
];

const POOL_ABI = [
  'function fee() view returns (uint24)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)'
];

const ORACLE_ABI = [
  'function isHealthy() view returns (bool)',
  'function currentTWAP() view returns (uint256)',
  'function thirtyMinuteTWAP() view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)'
];

// ========== 工具函數 ==========
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  console.log(`[${timestamp}] ${colors[color]}${message}${colors.reset}`);
}

function formatNumber(value, decimals = 2) {
  return parseFloat(value).toFixed(decimals);
}

// ========== 主要變數 ==========
let provider, signer;
let usdToken, soulToken, router, pool, oracle;
let transactionCount = 0;
let successCount = 0;
let failureCount = 0;
let lastMaintenanceTime = 0;
let startTime = Date.now();
let isTrading = false;

async function initialize() {
  log('🤖 池子自動維護機器人 V2 啟動', 'cyan');
  log(`⏰ 維護間隔: ${CONFIG.MAINTENANCE_INTERVAL / 60000} 分鐘`, 'yellow');
  log(`💰 交易金額: ${CONFIG.TRADE_AMOUNT_USD} USD / ${CONFIG.TRADE_AMOUNT_SOUL} SOUL`, 'yellow');
  log(`📊 滑點保護: ${CONFIG.SLIPPAGE_PERCENT}%`, 'yellow');
  
  // 連接到 BSC
  provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  log(`\n🔑 維護地址: ${signer.address}`, 'cyan');
  
  // 初始化合約
  usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  router = new ethers.Contract(ADDRESSES.PANCAKE_V3_ROUTER, ROUTER_ABI, signer);
  pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  oracle = new ethers.Contract(ADDRESSES.ORACLE, ORACLE_ABI, provider);
}

async function checkPoolHealth(provider) {
  const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  
  try {
    await pool.observe([1800, 0]);
    return { healthy: true, twap30: true };
  } catch (error) {
    if (error.reason === 'OLD') {
      try {
        await pool.observe([60, 0]);
        return { healthy: true, twap30: false };
      } catch {
        return { healthy: false, twap30: false };
      }
    }
    return { healthy: false, twap30: false };
  }
}

async function calculateMinOutput(amountIn, tokenIn, tokenOut) {
  try {
    if (tokenIn === ADDRESSES.USD) {
      // USD -> SOUL
      try {
        const expectedAmount = await oracle.getRequiredSoulShardAmount(amountIn);
        const slippageFactor = BigInt(Math.floor((100 - CONFIG.SLIPPAGE_PERCENT) * 100));
        const minAmount = expectedAmount * slippageFactor / 10000n;
        
        log(`預期獲得: ${ethers.formatUnits(expectedAmount, 18)} SOUL`, 'cyan');
        log(`最小接受: ${ethers.formatUnits(minAmount, 18)} SOUL (${CONFIG.SLIPPAGE_PERCENT}% 滑點)`, 'cyan');
        
        return minAmount;
      } catch (e) {
        // Oracle 失敗時的備用計算
        const expectedSOUL = amountIn * 16000n;
        const minSOUL = expectedSOUL * BigInt(Math.floor((100 - CONFIG.SLIPPAGE_PERCENT) * 100)) / 10000n;
        return minSOUL;
      }
    } else {
      // SOUL -> USD - 修復精度問題
      // 使用更保守的方式：設置極小的最小值
      const minUSD = ethers.parseUnits('0.01', 18);  // 最小接受 0.01 USD
      
      log(`賣出 ${ethers.formatUnits(amountIn, 18)} SOUL`, 'cyan');
      log(`最小接受: ${ethers.formatUnits(minUSD, 18)} USD (保守設置)`, 'cyan');
      
      return minUSD;
    }
  } catch (error) {
    log(`無法計算預期輸出: ${error.message}`, 'yellow');
    return 0n;
  }
}

async function executeTrade(isBuy) {
  if (isTrading) {
    log('⚠️  交易進行中，跳過...', 'yellow');
    return false;
  }
  
  isTrading = true;
  
  try {
    const fee = await pool.fee();
    
    if (isBuy) {
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
      
      // 計算最小輸出（滑點保護）
      const minOutput = await calculateMinOutput(amount, ADDRESSES.USD, ADDRESSES.SOUL);
      
      // 執行交易
      log(`執行買入: ${CONFIG.TRADE_AMOUNT_USD} USD → SOUL`, 'green');
      
      const params = {
        tokenIn: ADDRESSES.USD,
        tokenOut: ADDRESSES.SOUL,
        fee: fee,
        recipient: signer.address,
        amountIn: amount,
        amountOutMinimum: minOutput,
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
      const soulAmount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_SOUL, 18);
      
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
      
      // 計算最小輸出
      const minOutput = await calculateMinOutput(soulAmount, ADDRESSES.SOUL, ADDRESSES.USD);
      
      // 執行交易
      log(`執行賣出: SOUL → USD`, 'red');
      log(`預期最小獲得: ${ethers.formatUnits(minOutput, 18)} USD`, 'cyan');
      
      const params = {
        tokenIn: ADDRESSES.SOUL,
        tokenOut: ADDRESSES.USD,
        fee: fee,
        recipient: signer.address,
        amountIn: soulAmount,
        amountOutMinimum: minOutput,
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
    if (error.reason && error.reason.includes('Too little received')) {
      log(`💡 提示：滑點超過 ${CONFIG.SLIPPAGE_PERCENT}%，考慮增加滑點容忍度`, 'yellow');
    }
    failureCount++;
    return false;
  } finally {
    isTrading = false;
  }
}

async function performMaintenance() {
  transactionCount++;
  log(`\n🔄 執行第 ${transactionCount} 筆維護交易...`, 'magenta');
  
  // 決定交易方向：奇數買入，偶數賣出
  const isBuy = transactionCount % 2 === 1;
  
  const success = await executeTrade(isBuy);
  
  if (success) {
    successCount++;
    lastMaintenanceTime = Date.now();
  } else {
    failureCount++;
  }
  
  // 顯示狀態
  await showStatus();
}

async function showStatus() {
  const usdBalance = await usdToken.balanceOf(signer.address);
  const soulBalance = await soulToken.balanceOf(signer.address);
  const bnbBalance = await provider.getBalance(signer.address);
  
  const runningTime = Math.floor((Date.now() - startTime) / 60000);
  
  log('\n========== 狀態報告 ==========', 'blue');
  log(`📊 交易統計:`, 'white');
  log(`   成功交易: ${successCount} 次`, 'green');
  log(`   失敗次數: ${failureCount} 次`, 'red');
  log(`   運行時間: ${runningTime} 分鐘`, 'white');
  log(`   滑點設置: ${CONFIG.SLIPPAGE_PERCENT}%`, 'white');
  log(`\n💰 當前餘額:`, 'white');
  log(`   USD:  ${formatNumber(ethers.formatUnits(usdBalance, 18))}`, 'yellow');
  log(`   SOUL: ${formatNumber(ethers.formatUnits(soulBalance, 18))}`, 'magenta');
  log(`   BNB:  ${formatNumber(ethers.formatUnits(bnbBalance, 18), 4)}`, 'cyan');
  log('==============================\n', 'blue');
}

async function mainLoop() {
  while (true) {
    try {
      log('檢查池子狀態...', 'white');
      
      const poolHealth = await checkPoolHealth(provider);
      
      if (!poolHealth.healthy) {
        log('⚠️  池子不健康，等待恢復...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
        continue;
      }
      
      if (poolHealth.twap30) {
        log('✅ 池子健康，30分鐘 TWAP 正常', 'green');
      } else {
        log('✅ 池子健康，但 30分鐘 TWAP 不可用', 'yellow');
      }
      
      const timeSinceLastMaintenance = Date.now() - lastMaintenanceTime;
      
      if (timeSinceLastMaintenance >= CONFIG.MAINTENANCE_INTERVAL || transactionCount === 0) {
        await performMaintenance();
      } else {
        const minutesUntilNext = Math.ceil((CONFIG.MAINTENANCE_INTERVAL - timeSinceLastMaintenance) / 60000);
        log(`⏳ 下次維護: ${minutesUntilNext} 分鐘後`, 'white');
      }
      
      await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
      
    } catch (error) {
      log(`❌ 主循環錯誤: ${error.message}`, 'red');
      await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
    }
  }
}

// 優雅退出處理
process.on('SIGINT', async () => {
  log('\n🛑 收到退出信號，正在關閉...', 'yellow');
  await showStatus();
  process.exit(0);
});

// 啟動
async function start() {
  try {
    await initialize();
    await showStatus();
    await mainLoop();
  } catch (error) {
    log(`❌ 啟動失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

start();
require('dotenv').config();
const { ethers } = require('ethers');

// ========== 配置 ==========
const CONFIG = {
  // 交易參數
  TRADE_AMOUNT_USD: '0.5',           // 每次交易金額 (USD)
  TRADE_AMOUNT_SOUL: '8449',         // 每次交易金額 (SOUL) - 根據當前價格調整
  SLIPPAGE_PERCENT: 1.5,             // 滑點保護 (%)
  
  // 時間參數
  MAINTENANCE_INTERVAL: 20 * 60 * 1000,  // 20 分鐘
  CHECK_INTERVAL: 60 * 1000,             // 1 分鐘檢查一次
  
  // Gas 設置
  GAS_PRICE: '100000000',  // 0.1 Gwei
  GAS_LIMIT: '300000',
};

// 合約地址
const ADDRESSES = {
  USD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',    // BUSD
  SOUL: '0xc88dAD283Ac209D77Bfe452807d378615AB8B94a',   // SoulShard
  PANCAKE_PAIR: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',  // V2 Pair
  ORACLE: '0xD7e41690270Cc4f06F13eF47764F030CC4411904'
};

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

// ========== 合約 ABI ==========
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function swap(uint amount0Out, uint amount1Out, address to, bytes data)',
  'function sync()'
];

const ORACLE_ABI = [
  'function isHealthy() view returns (bool)',
  'function currentTWAP() view returns (uint256)',
  'function thirtyMinuteTWAP() view returns (uint256)'
];

// ========== 主要函數 ==========
let provider, signer;
let usdToken, soulToken, pairContract, oracleContract;
let transactionCount = 0;
let successCount = 0;
let failCount = 0;
let lastMaintenanceTime = 0;
let startTime = Date.now();

async function initialize() {
  log('🤖 池子自動維護機器人 V2 啟動', 'cyan');
  log(`⏰ 維護間隔: ${CONFIG.MAINTENANCE_INTERVAL / 60000} 分鐘`, 'yellow');
  log(`💰 交易金額: ${CONFIG.TRADE_AMOUNT_USD} USD`, 'yellow');
  log(`📊 滑點保護: ${CONFIG.SLIPPAGE_PERCENT}%`, 'yellow');
  
  // 連接到 BSC
  provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  log(`\n🔑 維護地址: ${signer.address}`, 'cyan');
  
  // 初始化合約
  usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  pairContract = new ethers.Contract(ADDRESSES.PANCAKE_PAIR, PAIR_ABI, signer);
  oracleContract = new ethers.Contract(ADDRESSES.ORACLE, ORACLE_ABI, provider);
  
  // 檢查代幣順序
  const token0 = await pairContract.token0();
  const token1 = await pairContract.token1();
  
  if (token0.toLowerCase() !== ADDRESSES.USD.toLowerCase()) {
    throw new Error('代幣順序錯誤：USD 應該是 token0');
  }
}

async function checkOracleHealth() {
  try {
    const isHealthy = await oracleContract.isHealthy();
    if (!isHealthy) {
      log('⚠️  警告：Oracle 報告池子不健康', 'red');
      return false;
    }
    
    const currentTWAP = await oracleContract.currentTWAP();
    const thirtyMinTWAP = await oracleContract.thirtyMinuteTWAP();
    
    const priceDiff = Math.abs(Number(currentTWAP) - Number(thirtyMinTWAP)) / Number(thirtyMinTWAP) * 100;
    
    if (priceDiff > 5) {
      log(`⚠️  價格波動過大: ${formatNumber(priceDiff)}%`, 'yellow');
      return false;
    }
    
    log('✅ 池子健康，30分鐘 TWAP 正常', 'green');
    return true;
  } catch (error) {
    log(`❌ 檢查 Oracle 失敗: ${error.message}`, 'red');
    return false;
  }
}

async function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 9975n / 10000n;  // 0.25% fee
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  return numerator / denominator;
}

async function getAmountIn(amountOut, reserveIn, reserveOut) {
  const numerator = reserveIn * amountOut * 10000n;
  const denominator = (reserveOut - amountOut) * 9975n;
  return numerator / denominator + 1n;
}

async function executeBuyTrade() {
  try {
    const amount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_USD, 18);
    
    // 檢查餘額
    const balance = await usdToken.balanceOf(signer.address);
    if (balance < amount) {
      log(`USD 餘額不足`, 'red');
      return false;
    }
    
    // 檢查授權
    const allowance = await usdToken.allowance(signer.address, ADDRESSES.PANCAKE_PAIR);
    if (allowance < amount) {
      log('設置 USD 授權...', 'cyan');
      const approveTx = await usdToken.approve(ADDRESSES.PANCAKE_PAIR, ethers.MaxUint256);
      await approveTx.wait();
    }
    
    // 獲取儲備量
    const reserves = await pairContract.getReserves();
    const reserveUSD = reserves[0];
    const reserveSOUL = reserves[1];
    
    // 計算預期輸出
    const amountOut = await getAmountOut(amount, reserveUSD, reserveSOUL);
    const minAmountOut = amountOut * (10000n - BigInt(CONFIG.SLIPPAGE_PERCENT * 100)) / 10000n;
    
    log(`預期獲得: ${ethers.formatUnits(amountOut, 18)} SOUL`, 'cyan');
    log(`最小接受: ${ethers.formatUnits(minAmountOut, 18)} SOUL (${CONFIG.SLIPPAGE_PERCENT}% 滑點)`, 'cyan');
    
    // 先轉入 USD
    log(`執行買入: ${CONFIG.TRADE_AMOUNT_USD} USD → SOUL`, 'green');
    const transferTx = await usdToken.transfer(ADDRESSES.PANCAKE_PAIR, amount);
    await transferTx.wait();
    
    // 執行 swap
    const swapTx = await pairContract.swap(
      0n,  // amount0Out (USD out)
      minAmountOut,  // amount1Out (SOUL out)
      signer.address,
      '0x',
      { gasLimit: CONFIG.GAS_LIMIT, gasPrice: CONFIG.GAS_PRICE }
    );
    
    log(`交易哈希: ${swapTx.hash}`, 'cyan');
    const receipt = await swapTx.wait();
    log(`✅ 交易成功！區塊: ${receipt.blockNumber}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ 買入交易失敗: ${error.message}`, 'red');
    return false;
  }
}

async function executeSellTrade() {
  try {
    const amount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_SOUL, 18);
    
    // 檢查餘額
    const balance = await soulToken.balanceOf(signer.address);
    if (balance < amount) {
      log(`SOUL 餘額不足`, 'red');
      return false;
    }
    
    // 檢查授權
    const allowance = await soulToken.allowance(signer.address, ADDRESSES.PANCAKE_PAIR);
    if (allowance < amount) {
      log('設置 SOUL 授權...', 'cyan');
      const approveTx = await soulToken.approve(ADDRESSES.PANCAKE_PAIR, ethers.MaxUint256);
      await approveTx.wait();
    }
    
    // 獲取儲備量
    const reserves = await pairContract.getReserves();
    const reserveUSD = reserves[0];
    const reserveSOUL = reserves[1];
    
    // 計算預期輸出
    const amountOut = await getAmountOut(amount, reserveSOUL, reserveUSD);
    const minAmountOut = amountOut * (10000n - BigInt(CONFIG.SLIPPAGE_PERCENT * 100)) / 10000n;
    
    log(`執行賣出: SOUL → USD`, 'red');
    log(`預期最小獲得: ${ethers.formatUnits(minAmountOut, 18)} USD`, 'cyan');
    
    // 先轉入 SOUL
    const transferTx = await soulToken.transfer(ADDRESSES.PANCAKE_PAIR, amount);
    await transferTx.wait();
    
    // 執行 swap
    const swapTx = await pairContract.swap(
      minAmountOut,  // amount0Out (USD out)
      0n,  // amount1Out (SOUL out)
      signer.address,
      '0x',
      { gasLimit: CONFIG.GAS_LIMIT, gasPrice: CONFIG.GAS_PRICE }
    );
    
    log(`交易哈希: ${swapTx.hash}`, 'cyan');
    const receipt = await swapTx.wait();
    log(`✅ 交易成功！區塊: ${receipt.blockNumber}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ 賣出交易失敗: ${error.message}`, 'red');
    return false;
  }
}

async function performMaintenance() {
  transactionCount++;
  log(`\n🔄 執行第 ${transactionCount} 筆維護交易...`, 'magenta');
  
  // 決定交易方向：奇數買入，偶數賣出
  const isBuy = transactionCount % 2 === 1;
  
  const success = isBuy ? 
    await executeBuyTrade() : 
    await executeSellTrade();
  
  if (success) {
    successCount++;
    lastMaintenanceTime = Date.now();
  } else {
    failCount++;
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
  log(`   失敗次數: ${failCount} 次`, 'red');
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
      
      const isHealthy = await checkOracleHealth();
      if (!isHealthy) {
        log('⏳ 等待池子恢復健康...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
        continue;
      }
      
      const timeSinceLastMaintenance = Date.now() - lastMaintenanceTime;
      
      if (timeSinceLastMaintenance >= CONFIG.MAINTENANCE_INTERVAL) {
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
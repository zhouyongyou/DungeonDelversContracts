require('dotenv').config();
const { ethers } = require('ethers');

// 配置 - 改為 20 分鐘
const CONFIG = {
  TRADE_AMOUNT_USD: '0.5',
  TRADE_AMOUNT_SOUL: '8000',
  SLIPPAGE_PERCENT: 1.5,
  DELAY_BETWEEN_TRADES: 20 * 60 * 1000  // 20 分鐘
};

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  PANCAKE_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  ORACLE: '0xb9317179466fd7fb253669538dE1c4635E81eAc4'
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
  'function thirtyMinuteTWAP() view returns (uint256)'
];

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

async function checkPoolState(pool, oracle) {
  try {
    log('\n📊 檢查池子狀態...', 'cyan');
    
    // 檢查 slot0
    const slot0 = await pool.slot0();
    log(`   Tick: ${slot0.tick}`, 'white');
    log(`   Unlocked: ${slot0.unlocked}`, 'white');
    
    // 檢查 Oracle
    try {
      const isHealthy = await oracle.isHealthy();
      const currentTWAP = await oracle.currentTWAP();
      const thirtyMinTWAP = await oracle.thirtyMinuteTWAP();
      
      log(`   Oracle 健康: ${isHealthy ? '✅' : '❌'}`, isHealthy ? 'green' : 'red');
      log(`   當前 TWAP: ${ethers.formatUnits(currentTWAP, 18)}`, 'white');
      log(`   30分鐘 TWAP: ${ethers.formatUnits(thirtyMinTWAP, 18)}`, 'white');
    } catch (e) {
      log(`   Oracle 錯誤: ${e.message}`, 'yellow');
    }
    
    // 檢查 observe
    try {
      await pool.observe([60, 0]);
      log(`   Pool observe(60s): ✅`, 'green');
    } catch (e) {
      log(`   Pool observe(60s): ❌ ${e.reason || e.message}`, 'red');
    }
    
  } catch (error) {
    log(`❌ 檢查失敗: ${error.message}`, 'red');
  }
}

async function executeBuy(signer, router, pool, usdToken) {
  log('\n🔄 執行第 1 筆交易：買入 USD → SOUL', 'green');
  
  const amount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_USD, 18);
  const fee = await pool.fee();
  
  // 檢查並設置授權
  const allowance = await usdToken.allowance(signer.address, ADDRESSES.PANCAKE_V3_ROUTER);
  if (allowance < amount) {
    log('設置 USD 授權...', 'cyan');
    const approveTx = await usdToken.approve(ADDRESSES.PANCAKE_V3_ROUTER, ethers.MaxUint256);
    await approveTx.wait();
  }
  
  // 使用較寬鬆的 minAmountOutMinimum
  const minOutput = ethers.parseUnits('100', 18);  // 至少要 100 SOUL
  log(`最小接受: ${ethers.formatUnits(minOutput, 18)} SOUL`, 'cyan');
  
  const params = {
    tokenIn: ADDRESSES.USD,
    tokenOut: ADDRESSES.SOUL,
    fee: fee,
    recipient: signer.address,
    amountIn: amount,
    amountOutMinimum: minOutput,
    sqrtPriceLimitX96: 0
  };
  
  try {
    const tx = await router.exactInputSingle(params, { gasLimit: 500000 });
    log(`交易哈希: ${tx.hash}`, 'cyan');
    const receipt = await tx.wait();
    log(`✅ 買入成功！區塊: ${receipt.blockNumber}`, 'green');
    return true;
  } catch (error) {
    log(`❌ 買入失敗: ${error.message}`, 'red');
    if (error.reason) log(`原因: ${error.reason}`, 'red');
    return false;
  }
}

async function executeSell(signer, router, pool, soulToken) {
  log('\n🔄 執行第 2 筆交易：賣出 SOUL → USD', 'red');
  
  const amount = ethers.parseUnits(CONFIG.TRADE_AMOUNT_SOUL, 18);
  const fee = await pool.fee();
  
  // 檢查餘額
  const balance = await soulToken.balanceOf(signer.address);
  log(`SOUL 餘額: ${ethers.formatUnits(balance, 18)}`, 'cyan');
  
  if (balance < amount) {
    log('SOUL 餘額不足', 'red');
    return false;
  }
  
  // 檢查並設置授權
  const allowance = await soulToken.allowance(signer.address, ADDRESSES.PANCAKE_V3_ROUTER);
  if (allowance < amount) {
    log('設置 SOUL 授權...', 'cyan');
    const approveTx = await soulToken.approve(ADDRESSES.PANCAKE_V3_ROUTER, ethers.MaxUint256);
    await approveTx.wait();
  }
  
  // 使用極小的 minAmountOutMinimum
  const minOutput = ethers.parseUnits('0.01', 18);  // 至少要 0.01 USD
  log(`最小接受: ${ethers.formatUnits(minOutput, 18)} USD`, 'cyan');
  
  const params = {
    tokenIn: ADDRESSES.SOUL,
    tokenOut: ADDRESSES.USD,
    fee: fee,
    recipient: signer.address,
    amountIn: amount,
    amountOutMinimum: minOutput,
    sqrtPriceLimitX96: 0
  };
  
  try {
    const tx = await router.exactInputSingle(params, { gasLimit: 500000 });
    log(`交易哈希: ${tx.hash}`, 'cyan');
    const receipt = await tx.wait();
    log(`✅ 賣出成功！區塊: ${receipt.blockNumber}`, 'green');
    return true;
  } catch (error) {
    log(`❌ 賣出失敗: ${error.message}`, 'red');
    if (error.reason) log(`原因: ${error.reason}`, 'red');
    if (error.data) log(`錯誤數據: ${error.data}`, 'red');
    return false;
  }
}

async function showBalances(signer, usdToken, soulToken, provider) {
  const usdBalance = await usdToken.balanceOf(signer.address);
  const soulBalance = await soulToken.balanceOf(signer.address);
  const bnbBalance = await provider.getBalance(signer.address);
  
  log('\n💰 當前餘額:', 'cyan');
  log(`   USD:  ${ethers.formatUnits(usdBalance, 18)}`, 'yellow');
  log(`   SOUL: ${ethers.formatUnits(soulBalance, 18)}`, 'magenta');
  log(`   BNB:  ${ethers.formatUnits(bnbBalance, 18)}`, 'cyan');
}

async function main() {
  log('🧪 開始 20 分鐘循環測試', 'cyan');
  log(`⏱️  交易間隔: ${CONFIG.DELAY_BETWEEN_TRADES / 60000} 分鐘`, 'yellow');
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  log(`\n🔑 測試地址: ${signer.address}`, 'cyan');
  
  // 初始化合約
  const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  const router = new ethers.Contract(ADDRESSES.PANCAKE_V3_ROUTER, ROUTER_ABI, signer);
  const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  const oracle = new ethers.Contract(ADDRESSES.ORACLE, ORACLE_ABI, provider);
  
  // 顯示初始餘額
  await showBalances(signer, usdToken, soulToken, provider);
  
  // 檢查初始狀態
  await checkPoolState(pool, oracle);
  
  // 執行第一筆交易（買入）
  const buySuccess = await executeBuy(signer, router, pool, usdToken);
  
  if (buySuccess) {
    log(`\n⏳ 等待 ${CONFIG.DELAY_BETWEEN_TRADES / 60000} 分鐘後執行第二筆交易...`, 'yellow');
    
    // 顯示買入後餘額
    await showBalances(signer, usdToken, soulToken, provider);
    
    // 等待期間每分鐘報告一次
    const totalMinutes = CONFIG.DELAY_BETWEEN_TRADES / 60000;
    for (let i = 0; i < totalMinutes; i++) {
      await new Promise(resolve => setTimeout(resolve, 60000));
      log(`⏳ 已等待 ${i + 1} 分鐘，剩餘 ${totalMinutes - i - 1} 分鐘...`, 'white');
      
      // 每 5 分鐘檢查一次池子狀態
      if ((i + 1) % 5 === 0) {
        await checkPoolState(pool, oracle);
      }
    }
    
    // 再次檢查池子狀態
    await checkPoolState(pool, oracle);
    
    // 執行第二筆交易（賣出）
    const sellSuccess = await executeSell(signer, router, pool, soulToken);
    
    // 顯示最終餘額
    await showBalances(signer, usdToken, soulToken, provider);
    
    log(`\n📊 測試結果:`, 'cyan');
    log(`   買入: ${buySuccess ? '✅ 成功' : '❌ 失敗'}`, buySuccess ? 'green' : 'red');
    log(`   賣出: ${sellSuccess ? '✅ 成功' : '❌ 失敗'}`, sellSuccess ? 'green' : 'red');
  }
  
  log('\n✅ 測試完成', 'green');
}

// 優雅退出處理
process.on('SIGINT', () => {
  log('\n🛑 收到退出信號，正在關閉...', 'yellow');
  process.exit(0);
});

main().catch(error => {
  log(`\n❌ 測試失敗: ${error.message}`, 'red');
  process.exit(1);
});
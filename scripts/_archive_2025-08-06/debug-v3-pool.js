require('dotenv').config();
const { ethers } = require('ethers');

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  PANCAKE_V3_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'
};

// ABIs
const POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() view returns (uint128)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function tickSpacing() view returns (int24)'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

async function checkPool() {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  
  console.log('檢查 V3 Pool 狀態...\n');
  
  // 檢查合約是否存在
  const poolCode = await provider.getCode(ADDRESSES.POOL);
  console.log(`Pool 合約存在: ${poolCode.length > 2 ? '✅' : '❌'}`);
  
  const routerCode = await provider.getCode(ADDRESSES.PANCAKE_V3_ROUTER);
  console.log(`Router 合約存在: ${routerCode.length > 2 ? '✅' : '❌'}`);
  
  if (poolCode.length <= 2) {
    console.log('\n❌ Pool 地址無效！');
    return;
  }
  
  const pool = new ethers.Contract(ADDRESSES.POOL, POOL_ABI, provider);
  const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, provider);
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, provider);
  
  try {
    // 獲取池子基本信息
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    const tickSpacing = await pool.tickSpacing();
    
    console.log('\n📊 池子配置:');
    console.log(`Token0: ${token0} (${token0.toLowerCase() === ADDRESSES.USD.toLowerCase() ? 'USD' : 'SOUL'})`);
    console.log(`Token1: ${token1} (${token1.toLowerCase() === ADDRESSES.SOUL.toLowerCase() ? 'SOUL' : 'USD'})`);
    console.log(`Fee: ${fee / 10000}%`);
    console.log(`Tick Spacing: ${tickSpacing}`);
    
    // 獲取當前狀態
    const slot0 = await pool.slot0();
    const liquidity = await pool.liquidity();
    
    console.log('\n📈 池子狀態:');
    console.log(`SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);
    console.log(`Current Tick: ${slot0.tick}`);
    console.log(`Total Liquidity: ${liquidity.toString()}`);
    console.log(`Pool Unlocked: ${slot0.unlocked ? '✅' : '❌'}`);
    
    // 計算當前價格
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    const price = (Number(sqrtPriceX96) / (2 ** 96)) ** 2;
    
    if (token0.toLowerCase() === ADDRESSES.USD.toLowerCase()) {
      console.log(`\n💱 當前價格: 1 USD = ${(1/price).toFixed(2)} SOUL`);
      console.log(`💱 當前價格: 1 SOUL = ${price.toFixed(6)} USD`);
    } else {
      console.log(`\n💱 當前價格: 1 USD = ${price.toFixed(2)} SOUL`);
      console.log(`💱 當前價格: 1 SOUL = ${(1/price).toFixed(6)} USD`);
    }
    
    // 測試 Router 合約
    console.log('\n🔍 檢查 Router 合約...');
    console.log(`Router 地址: ${ADDRESSES.PANCAKE_V3_ROUTER}`);
    
    // 嘗試獲取 Router 的函數選擇器
    const routerInterface = new ethers.Interface([
      'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)'
    ]);
    
    const exactInputSingleSelector = routerInterface.getFunction('exactInputSingle').selector;
    console.log(`exactInputSingle 函數選擇器: ${exactInputSingleSelector}`);
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.data) {
      console.log('錯誤數據:', error.data);
    }
  }
}

checkPool();
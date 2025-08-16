#!/usr/bin/env node

// Keeper Bot - 維持 Uniswap V3 池子價格歷史
// 每 25 分鐘執行最小交易，確保 TWAP 30 分鐘可用

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 配置
const CONFIG = {
  INTERVAL_MINUTES: 25,  // 執行間隔
  MIN_SWAP_USD: '0.01',  // 最小交易金額 USD
  POOL_ADDRESS: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  USD_ADDRESS: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL_ADDRESS: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  SWAP_ROUTER: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
  POOL_FEE: 2500
};

// ABIs
const POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"
];

// 狀態追踪
let lastSwapTime = 0;
let swapCount = 0;

async function checkPoolHealth(provider) {
  const pool = new ethers.Contract(CONFIG.POOL_ADDRESS, POOL_ABI, provider);
  
  try {
    // 測試 30 分鐘 TWAP
    await pool.observe([1800, 0]);
    return { healthy: true, reason: 'TWAP 30min available' };
  } catch (error) {
    if (error.reason === 'OLD') {
      return { healthy: false, reason: 'TWAP 30min failed - OLD error' };
    }
    return { healthy: false, reason: error.message };
  }
}

async function executeMinimalSwap(signer) {
  console.log('🔄 執行維護交易...');
  
  const usdToken = new ethers.Contract(CONFIG.USD_ADDRESS, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(CONFIG.SOUL_ADDRESS, ERC20_ABI, signer);
  const swapRouter = new ethers.Contract(CONFIG.SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
  
  // 檢查餘額
  const usdBalance = await usdToken.balanceOf(signer.address);
  const soulBalance = await soulToken.balanceOf(signer.address);
  
  const swapAmount = ethers.parseUnits(CONFIG.MIN_SWAP_USD, 18);
  
  // 決定交易方向（交替方向以維持平衡）
  const swapDirection = swapCount % 2 === 0 ? 'USD_TO_SOUL' : 'SOUL_TO_USD';
  
  if (swapDirection === 'USD_TO_SOUL' && usdBalance >= swapAmount) {
    // USD -> SOUL
    console.log(`方向: USD → SOUL (${CONFIG.MIN_SWAP_USD} USD)`);
    
    const approveTx = await usdToken.approve(CONFIG.SWAP_ROUTER, swapAmount);
    await approveTx.wait();
    
    const params = {
      tokenIn: CONFIG.USD_ADDRESS,
      tokenOut: CONFIG.SOUL_ADDRESS,
      fee: CONFIG.POOL_FEE,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: swapAmount,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    
    const swapTx = await swapRouter.exactInputSingle(params);
    const receipt = await swapTx.wait();
    
    console.log(`✅ 交易成功: ${swapTx.hash}`);
    return receipt;
    
  } else if (swapDirection === 'SOUL_TO_USD' && soulBalance > 0) {
    // SOUL -> USD (使用等值的 SOUL)
    // 這裡需要先計算等值的 SOUL 數量
    console.log('方向: SOUL → USD');
    console.log('⚠️  需要實現 SOUL to USD 交換邏輯');
    
  } else {
    console.log('❌ 餘額不足，無法執行交易');
    console.log(`   USD: ${ethers.formatUnits(usdBalance, 18)}`);
    console.log(`   SOUL: ${ethers.formatUnits(soulBalance, 18)}`);
    return null;
  }
}

async function runKeeper() {
  console.log('🤖 DungeonDelvers Keeper Bot 啟動');
  console.log(`⏰ 執行間隔: ${CONFIG.INTERVAL_MINUTES} 分鐘`);
  console.log(`💰 最小交易額: ${CONFIG.MIN_SWAP_USD} USD\n`);
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`🔑 Keeper 地址: ${signer.address}`);
  
  // 初始檢查
  const balance = await provider.getBalance(signer.address);
  console.log(`💰 BNB 餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  // 主循環
  while (true) {
    try {
      const now = Date.now();
      const timeSinceLastSwap = now - lastSwapTime;
      
      console.log(`\n📊 [${new Date().toISOString()}] 檢查池子狀態...`);
      
      // 檢查池子健康度
      const health = await checkPoolHealth(provider);
      console.log(`池子狀態: ${health.healthy ? '✅ 健康' : '⚠️  需要維護'}`);
      console.log(`原因: ${health.reason}`);
      
      // 決定是否需要交易
      const shouldSwap = !health.healthy || timeSinceLastSwap > CONFIG.INTERVAL_MINUTES * 60 * 1000;
      
      if (shouldSwap) {
        console.log('\n🔧 觸發維護交易...');
        const result = await executeMinimalSwap(signer);
        
        if (result) {
          lastSwapTime = now;
          swapCount++;
          console.log(`✅ 維護完成 (總計: ${swapCount} 次)`);
        }
      } else {
        const minutesRemaining = Math.floor((CONFIG.INTERVAL_MINUTES * 60 * 1000 - timeSinceLastSwap) / 60000);
        console.log(`⏳ 下次維護: ${minutesRemaining} 分鐘後`);
      }
      
    } catch (error) {
      console.error('\n❌ 錯誤:', error.message);
    }
    
    // 等待 1 分鐘後再次檢查
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  }
}

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n\n👋 Keeper Bot 關閉中...');
  console.log(`📊 總執行交易: ${swapCount} 次`);
  process.exit(0);
});

// 啟動
runKeeper().catch(console.error);
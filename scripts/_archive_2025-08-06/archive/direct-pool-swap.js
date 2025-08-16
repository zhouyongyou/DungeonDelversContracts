#!/usr/bin/env node

// 直接通過池子進行交易（不使用 Router）

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const USD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
const SOUL_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
const POOL_ADDRESS = '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82';

// 使用正確的 PancakeSwap V3 Router
const PANCAKE_V3_ROUTER = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'; // BSC 主網

// ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

const POOL_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function fee() view returns (uint24)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

async function performSwap() {
  console.log('🔄 執行交易測試\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`🔑 地址: ${signer.address}`);
  
  // 初始化合約
  const usdToken = new ethers.Contract(USD_ADDRESS, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(SOUL_ADDRESS, ERC20_ABI, signer);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);
  const router = new ethers.Contract(PANCAKE_V3_ROUTER, ROUTER_ABI, signer);
  
  try {
    // 檢查池子信息
    console.log('\n📊 池子信息:');
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    console.log(`Fee: ${fee} (${fee/10000}%)`);
    
    // 確認代幣順序
    const isToken0USD = token0.toLowerCase() === USD_ADDRESS.toLowerCase();
    console.log(`\n代幣順序: ${isToken0USD ? 'USD-SOUL' : 'SOUL-USD'}`);
    
    // 檢查餘額
    const usdBalance = await usdToken.balanceOf(signer.address);
    const soulBalance = await soulToken.balanceOf(signer.address);
    console.log(`\n💰 餘額:`);
    console.log(`USD: ${ethers.formatUnits(usdBalance, 18)}`);
    console.log(`SOUL: ${ethers.formatUnits(soulBalance, 18)}`);
    
    // 小額交易
    const swapAmount = ethers.parseUnits('0.01', 18); // 0.01 USD
    
    // Approve Router
    console.log('\n📝 設置授權...');
    const approveTx = await usdToken.approve(PANCAKE_V3_ROUTER, swapAmount);
    await approveTx.wait();
    console.log('✅ 授權成功');
    
    // 準備交易參數
    const params = {
      tokenIn: USD_ADDRESS,
      tokenOut: SOUL_ADDRESS,
      fee: fee, // 使用池子的實際費率
      recipient: signer.address,
      amountIn: swapAmount,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    
    console.log('\n🔄 執行交易: 0.01 USD -> SOUL');
    
    // 發送交易
    const swapTx = await router.exactInputSingle(params);
    console.log(`📤 交易哈希: ${swapTx.hash}`);
    console.log('⏳ 等待確認...');
    
    const receipt = await swapTx.wait();
    console.log(`✅ 交易成功！區塊: ${receipt.blockNumber}`);
    
    // 檢查新餘額
    const newUsdBalance = await usdToken.balanceOf(signer.address);
    const newSoulBalance = await soulToken.balanceOf(signer.address);
    
    console.log('\n💰 新餘額:');
    console.log(`USD: ${ethers.formatUnits(newUsdBalance, 18)} (使用: ${ethers.formatUnits(usdBalance - newUsdBalance, 18)})`);
    console.log(`SOUL: ${ethers.formatUnits(newSoulBalance, 18)} (獲得: ${ethers.formatUnits(newSoulBalance - soulBalance, 18)})`);
    
    // 計算價格
    const soulReceived = newSoulBalance - soulBalance;
    const pricePerUSD = Number(ethers.formatUnits(soulReceived, 18)) / 0.01;
    console.log(`\n💹 價格: 1 USD = ${pricePerUSD.toFixed(2)} SOUL`);
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.reason) {
      console.log('原因:', error.reason);
    }
    
    console.log('\n💡 建議:');
    console.log('1. 確認 Router 地址正確');
    console.log('2. 檢查池子是否有足夠流動性');
    console.log('3. 嘗試在 BSCScan 上查看池子狀態');
  }
}

performSwap().catch(console.error);
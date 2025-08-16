#!/usr/bin/env node

// 簡化版 Keeper Bot - 定期維護池子價格歷史

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 配置
const INTERVAL_MINUTES = 25;  // 每 25 分鐘執行
const MIN_SWAP_USD = '0.01';  // 最小交易金額

// 合約地址
const USD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
const SOUL_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
const SWAP_ROUTER = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';

// ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"
];

async function executeSwap() {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`\n[${new Date().toLocaleString()}] 執行維護交易`);
  
  const usdToken = new ethers.Contract(USD_ADDRESS, ERC20_ABI, signer);
  const swapRouter = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
  
  try {
    // 檢查餘額
    const balance = await usdToken.balanceOf(signer.address);
    if (balance < ethers.parseUnits(MIN_SWAP_USD, 18)) {
      console.log('❌ USD 餘額不足');
      return;
    }
    
    // Approve
    const swapAmount = ethers.parseUnits(MIN_SWAP_USD, 18);
    const approveTx = await usdToken.approve(SWAP_ROUTER, swapAmount);
    await approveTx.wait();
    
    // Swap USD -> SOUL
    const params = {
      tokenIn: USD_ADDRESS,
      tokenOut: SOUL_ADDRESS,
      fee: 2500,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: swapAmount,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    
    const swapTx = await swapRouter.exactInputSingle(params);
    console.log(`交易: ${swapTx.hash}`);
    await swapTx.wait();
    
    console.log('✅ 維護交易完成');
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

// 主程式
async function main() {
  console.log('🤖 Keeper Bot 啟動');
  console.log(`⏰ 每 ${INTERVAL_MINUTES} 分鐘執行一次`);
  
  // 立即執行一次
  await executeSwap();
  
  // 定期執行
  setInterval(executeSwap, INTERVAL_MINUTES * 60 * 1000);
}

main().catch(console.error);
#!/usr/bin/env node

// 觸發池子交易以建立價格觀察歷史

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

// Uniswap V3 SwapRouter ABI
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"
];

async function triggerPoolObservation() {
  console.log('🔄 觸發池子交易以建立價格歷史\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  // 合約地址
  const SWAP_ROUTER = '0x1b81D678ffb9C0263b24A97847620C99d213eB14'; // PancakeSwap V3 Router
  const USD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
  const SOUL_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
  const POOL_FEE = 2500; // 0.25%
  
  const usdToken = new ethers.Contract(USD_ADDRESS, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(SOUL_ADDRESS, ERC20_ABI, signer);
  const swapRouter = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
  
  try {
    // 檢查餘額
    const usdBalance = await usdToken.balanceOf(signer.address);
    const soulBalance = await soulToken.balanceOf(signer.address);
    
    console.log(`💰 USD 餘額: ${ethers.formatUnits(usdBalance, 18)}`);
    console.log(`💰 SOUL 餘額: ${ethers.formatUnits(soulBalance, 18)}\n`);
    
    if (usdBalance == 0n && soulBalance == 0n) {
      console.log('❌ 沒有足夠的代幣進行交易');
      return;
    }
    
    // 執行小額交易（使用 USD 買 SOUL）
    if (usdBalance > ethers.parseUnits('0.1', 18)) {
      const swapAmount = ethers.parseUnits('0.1', 18); // 0.1 USD
      
      console.log('🔄 執行交易: 0.1 USD -> SOUL');
      
      // Approve
      console.log('📝 Approve USD...');
      const approveTx = await usdToken.approve(SWAP_ROUTER, swapAmount);
      await approveTx.wait();
      console.log('✅ Approve 成功');
      
      // Swap
      console.log('📝 執行 Swap...');
      const params = {
        tokenIn: USD_ADDRESS,
        tokenOut: SOUL_ADDRESS,
        fee: POOL_FEE,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 分鐘
        amountIn: swapAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      
      const swapTx = await swapRouter.exactInputSingle(params);
      console.log(`交易哈希: ${swapTx.hash}`);
      console.log('⏳ 等待確認...');
      
      const receipt = await swapTx.wait();
      console.log(`✅ 交易確認！區塊: ${receipt.blockNumber}`);
      
      console.log('\n✅ 成功觸發池子交易！');
      console.log('ℹ️  池子現在應該開始記錄價格歷史了');
      console.log('ℹ️  建議等待幾分鐘後再測試 Oracle');
      
    } else if (soulBalance > ethers.parseUnits('1000', 18)) {
      console.log('ℹ️  您有 SOUL 但沒有 USD，需要 USD 來執行交易');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

triggerPoolObservation().catch(console.error);
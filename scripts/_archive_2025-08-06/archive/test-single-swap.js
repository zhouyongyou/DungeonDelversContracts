#!/usr/bin/env node

// 測試單筆交易

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const USD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
const SOUL_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
const SWAP_ROUTER = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';

// ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"
];

async function testSingleSwap() {
  console.log('🧪 測試單筆交易\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`🔑 地址: ${signer.address}`);
  
  const usdToken = new ethers.Contract(USD_ADDRESS, ERC20_ABI, signer);
  const router = new ethers.Contract(SWAP_ROUTER, ROUTER_ABI, signer);
  
  try {
    // 檢查餘額
    const balance = await usdToken.balanceOf(signer.address);
    console.log(`💰 USD 餘額: ${ethers.formatUnits(balance, 18)}`);
    
    // 使用更小的金額
    const swapAmount = ethers.parseUnits('0.1', 18); // 0.1 USD
    console.log(`\n📊 交易金額: 0.1 USD`);
    
    // 檢查並設置 Approve
    const currentAllowance = await usdToken.allowance(signer.address, SWAP_ROUTER);
    console.log(`📝 當前授權: ${ethers.formatUnits(currentAllowance, 18)} USD`);
    
    if (currentAllowance < swapAmount) {
      console.log('📝 設置授權...');
      const maxApproval = ethers.parseUnits('1000000', 18); // 大額授權
      const approveTx = await usdToken.approve(SWAP_ROUTER, maxApproval);
      console.log(`授權交易: ${approveTx.hash}`);
      await approveTx.wait();
      console.log('✅ 授權成功');
    }
    
    // 準備 Swap 參數
    const params = {
      tokenIn: USD_ADDRESS,
      tokenOut: SOUL_ADDRESS,
      fee: 2500, // 0.25%
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 300, // 5分鐘
      amountIn: swapAmount,
      amountOutMinimum: 0, // 接受任何數量
      sqrtPriceLimitX96: 0 // 無價格限制
    };
    
    console.log('\n📤 執行交易...');
    console.log('參數:', {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: params.fee,
      amountIn: ethers.formatUnits(params.amountIn, 18) + ' USD'
    });
    
    // 先估算 Gas
    try {
      const estimatedGas = await router.exactInputSingle.estimateGas(params);
      console.log(`⛽ 預估 Gas: ${estimatedGas.toString()}`);
    } catch (estimateError) {
      console.error('❌ Gas 估算失敗:', estimateError.message);
      console.log('\n可能的原因:');
      console.log('1. 池子流動性不足');
      console.log('2. Router 地址錯誤');
      console.log('3. 參數設置有誤');
      return;
    }
    
    // 執行交易
    const swapTx = await router.exactInputSingle(params, {
      gasLimit: 300000 // 手動設置 Gas
    });
    
    console.log(`\n🔗 交易哈希: ${swapTx.hash}`);
    console.log('⏳ 等待確認...');
    
    const receipt = await swapTx.wait();
    console.log(`✅ 交易成功！區塊: ${receipt.blockNumber}`);
    
    // 檢查新餘額
    const newBalance = await usdToken.balanceOf(signer.address);
    console.log(`\n💰 新 USD 餘額: ${ethers.formatUnits(newBalance, 18)}`);
    console.log(`📉 使用了: ${ethers.formatUnits(balance - newBalance, 18)} USD`);
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.data) {
      console.log('錯誤數據:', error.data);
    }
    
    if (error.reason) {
      console.log('錯誤原因:', error.reason);
    }
  }
}

testSingleSwap().catch(console.error);
#!/usr/bin/env node

// 自動交易機器人 - 定期執行買賣交易

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// ===== 配置參數 =====
const TRADE_INTERVAL_SECONDS = 300;  // 交易間隔（秒）- 預設 5 分鐘
const TRADE_AMOUNT_USD = '1';        // 每次交易金額（USD）
const MAX_TRADES = 100;              // 最大交易次數（0 = 無限）

// 合約地址
const ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOUL: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  ROUTER: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
  POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
};

// ABIs
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
];

const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"
];

// 交易統計
let tradeCount = 0;
let totalUsdTraded = 0n;
let totalSoulTraded = 0n;

async function executeTrade(signer, direction) {
  const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  const router = new ethers.Contract(ADDRESSES.ROUTER, ROUTER_ABI, signer);
  
  const tradeAmount = ethers.parseUnits(TRADE_AMOUNT_USD, 18);
  
  try {
    if (direction === 'BUY') {
      // 買入 SOUL (USD -> SOUL)
      console.log(`\n🟢 買入 SOUL - ${TRADE_AMOUNT_USD} USD`);
      
      // 檢查 USD 餘額
      const usdBalance = await usdToken.balanceOf(signer.address);
      if (usdBalance < tradeAmount) {
        console.log('❌ USD 餘額不足');
        return false;
      }
      
      // Approve
      const approveTx = await usdToken.approve(ADDRESSES.ROUTER, tradeAmount);
      await approveTx.wait();
      
      // Swap
      const params = {
        tokenIn: ADDRESSES.USD,
        tokenOut: ADDRESSES.SOUL,
        fee: 2500,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 300,
        amountIn: tradeAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      
      console.log('📤 發送交易...');
      const swapTx = await router.exactInputSingle(params);
      console.log(`🔗 交易哈希: ${swapTx.hash}`);
      
      const receipt = await swapTx.wait();
      console.log('✅ 買入成功！');
      
      totalUsdTraded += tradeAmount;
      
    } else {
      // 賣出 SOUL (SOUL -> USD)
      console.log(`\n🔴 賣出 SOUL`);
      
      // 先估算需要多少 SOUL 來換取目標 USD
      const soulBalance = await soulToken.balanceOf(signer.address);
      
      // 使用一個合理的估算（這裡簡化處理，實際應該用報價）
      const estimatedSoulAmount = ethers.parseUnits('10000', 18); // 根據當前價格調整
      
      if (soulBalance < estimatedSoulAmount) {
        console.log('❌ SOUL 餘額不足');
        return false;
      }
      
      // Approve
      const approveTx = await soulToken.approve(ADDRESSES.ROUTER, estimatedSoulAmount);
      await approveTx.wait();
      
      // Swap
      const params = {
        tokenIn: ADDRESSES.SOUL,
        tokenOut: ADDRESSES.USD,
        fee: 2500,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 300,
        amountIn: estimatedSoulAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };
      
      console.log('📤 發送交易...');
      const swapTx = await router.exactInputSingle(params);
      console.log(`🔗 交易哈希: ${swapTx.hash}`);
      
      const receipt = await swapTx.wait();
      console.log('✅ 賣出成功！');
      
      totalSoulTraded += estimatedSoulAmount;
    }
    
    tradeCount++;
    return true;
    
  } catch (error) {
    console.error('❌ 交易失敗:', error.message);
    return false;
  }
}

async function showBalances(signer) {
  const usdToken = new ethers.Contract(ADDRESSES.USD, ERC20_ABI, signer);
  const soulToken = new ethers.Contract(ADDRESSES.SOUL, ERC20_ABI, signer);
  
  const usdBalance = await usdToken.balanceOf(signer.address);
  const soulBalance = await soulToken.balanceOf(signer.address);
  const bnbBalance = await signer.provider.getBalance(signer.address);
  
  console.log('\n💰 當前餘額:');
  console.log(`   USD:  ${ethers.formatUnits(usdBalance, 18)}`);
  console.log(`   SOUL: ${ethers.formatUnits(soulBalance, 18)}`);
  console.log(`   BNB:  ${ethers.formatEther(bnbBalance)}`);
}

async function main() {
  console.log('🤖 自動交易機器人啟動');
  console.log('================================');
  console.log(`⏰ 交易間隔: ${TRADE_INTERVAL_SECONDS} 秒`);
  console.log(`💵 每次金額: ${TRADE_AMOUNT_USD} USD`);
  console.log(`🔄 最大次數: ${MAX_TRADES || '無限'}`);
  console.log('================================\n');
  
  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 請設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`🔑 交易地址: ${signer.address}`);
  
  // 顯示初始餘額
  await showBalances(signer);
  
  // 交易循環
  let running = true;
  while (running && (MAX_TRADES === 0 || tradeCount < MAX_TRADES)) {
    // 交替買賣
    const direction = tradeCount % 2 === 0 ? 'BUY' : 'SELL';
    
    console.log(`\n📊 執行第 ${tradeCount + 1} 筆交易`);
    const success = await executeTrade(signer, direction);
    
    if (success) {
      console.log(`\n📈 交易統計:`);
      console.log(`   總交易次數: ${tradeCount}`);
      console.log(`   USD 交易量: ${ethers.formatUnits(totalUsdTraded, 18)}`);
      console.log(`   SOUL 交易量: ${ethers.formatUnits(totalSoulTraded, 18)}`);
    }
    
    // 顯示餘額
    await showBalances(signer);
    
    // 等待下次交易
    if (MAX_TRADES === 0 || tradeCount < MAX_TRADES) {
      console.log(`\n⏳ 等待 ${TRADE_INTERVAL_SECONDS} 秒後執行下一筆交易...`);
      console.log('   (按 Ctrl+C 停止)\n');
      await new Promise(resolve => setTimeout(resolve, TRADE_INTERVAL_SECONDS * 1000));
    }
  }
  
  console.log('\n✅ 交易完成！');
}

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n\n👋 停止交易機器人...');
  console.log(`📊 總計執行 ${tradeCount} 筆交易`);
  process.exit(0);
});

// 啟動
main().catch(console.error);
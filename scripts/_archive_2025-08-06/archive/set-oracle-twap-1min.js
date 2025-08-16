#!/usr/bin/env node

// 設置 Oracle TWAP 為 1 分鐘（臨時修復）

const { ethers } = require('ethers');
require('dotenv').config();

const config = require('../config/v21-config');
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// Oracle ABI
const ORACLE_ABI = [
  "function twapPeriod() view returns (uint32)",
  "function setTwapPeriod(uint32 _newTwapPeriod) external",
  "function owner() view returns (address)",
  "function getSoulShardPriceInUSD() view returns (uint256)",
  "function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)"
];

async function setOracleTwap1Min() {
  console.log('🔧 設置 Oracle TWAP 為 1 分鐘（臨時修復）\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  const oracle = new ethers.Contract(
    config.contracts.ORACLE.address,
    ORACLE_ABI,
    signer
  );
  
  try {
    // 檢查當前 TWAP 週期
    const currentTwap = await oracle.twapPeriod();
    console.log(`\n📊 當前 TWAP 週期: ${currentTwap} 秒`);
    
    // 設置為 1 分鐘
    const newTwap = 60; // 1 分鐘
    console.log(`📊 新的 TWAP 週期: ${newTwap} 秒 (1 分鐘)`);
    console.log('\n⚠️  注意：這是臨時解決方案');
    console.log('   較短的 TWAP 週期可能容易受到價格操縱');
    console.log('   建議之後恢復到 30 分鐘\n');
    
    // 發送交易
    console.log('📝 發送交易...');
    const tx = await oracle.setTwapPeriod(newTwap);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    
    await tx.wait();
    console.log('✅ TWAP 已更新為 1 分鐘\n');
    
    // 測試價格查詢
    console.log('🧪 測試價格查詢...');
    try {
      const price = await oracle.getSoulShardPriceInUSD();
      console.log(`✅ getSoulShardPriceInUSD: ${ethers.formatUnits(price, 18)} USD`);
      
      const amount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
      console.log(`✅ 2 USD = ${ethers.formatUnits(amount, 18)} SOUL`);
      
      const pricePerUSD = Number(ethers.formatUnits(amount, 18)) / 2;
      console.log(`💰 1 USD = ${pricePerUSD.toFixed(2)} SOUL`);
      
      console.log('\n🎉 成功！Oracle 現在應該可以正常工作了');
      console.log('📌 前端價格顯示應該恢復正常');
      
    } catch (error) {
      console.log(`❌ 價格查詢失敗: ${error.reason || error.message}`);
      console.log('可能需要等待幾秒鐘讓池子更新');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

setOracleTwap1Min().catch(console.error);
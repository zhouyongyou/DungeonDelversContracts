#!/usr/bin/env node

// 修復 Oracle TWAP 週期問題

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
  "function getSoulShardPriceInUSD() view returns (uint256)"
];

async function fixOracleTwap() {
  console.log('🔧 修復 Oracle TWAP 週期\n');

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
    console.log(`\n📊 當前 TWAP 週期: ${currentTwap} 秒 (${Math.floor(currentTwap / 60)} 分鐘)`);
    
    // 檢查 owner
    const owner = await oracle.owner();
    console.log(`📊 合約 Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error('❌ 錯誤: 您不是合約的 owner');
      return;
    }
    
    // 嘗試當前價格查詢
    console.log('\n🧪 測試當前價格查詢...');
    try {
      const price = await oracle.getSoulShardPriceInUSD();
      console.log(`✅ 價格查詢成功: ${ethers.formatUnits(price, 18)} USD`);
      console.log('ℹ️  TWAP 可能不需要調整');
      return;
    } catch (error) {
      console.log(`❌ 價格查詢失敗: ${error.reason || error.message}`);
      
      if (error.reason === 'OLD') {
        console.log('⚠️  確認是 TWAP 週期問題');
      }
    }
    
    // 建議的新 TWAP 週期
    const newTwapOptions = [
      { period: 300, name: '5 分鐘' },
      { period: 600, name: '10 分鐘' },
      { period: 900, name: '15 分鐘' }
    ];
    
    console.log('\n🔧 嘗試不同的 TWAP 週期...');
    
    for (const option of newTwapOptions) {
      console.log(`\n📊 設置 TWAP 為 ${option.name} (${option.period} 秒)...`);
      
      const tx = await oracle.setTwapPeriod(option.period);
      console.log(`📝 交易哈希: ${tx.hash}`);
      console.log('⏳ 等待交易確認...');
      
      await tx.wait();
      console.log('✅ TWAP 已更新');
      
      // 測試新設置
      console.log('🧪 測試價格查詢...');
      try {
        const price = await oracle.getSoulShardPriceInUSD();
        console.log(`✅ 價格查詢成功: ${ethers.formatUnits(price, 18)} USD`);
        console.log(`\n🎉 成功！TWAP 週期已設置為 ${option.name}`);
        
        // 計算價格
        const pricePerUSD = 1e18 / Number(price);
        console.log(`💰 1 USD = ${pricePerUSD.toFixed(2)} SOUL`);
        
        return;
      } catch (error) {
        console.log(`❌ 價格查詢仍然失敗: ${error.reason || error.message}`);
      }
    }
    
    console.log('\n❌ 所有 TWAP 設置都失敗了');
    console.log('可能的原因：');
    console.log('1. Uniswap 池子太新，沒有足夠的歷史數據');
    console.log('2. 池子流動性不足');
    console.log('3. 其他技術問題');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

fixOracleTwap().catch(console.error);
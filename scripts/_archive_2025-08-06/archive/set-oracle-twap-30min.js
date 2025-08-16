#!/usr/bin/env node

// 設置 Oracle TWAP 為 30 分鐘

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

// Pool ABI
const POOL_ABI = [
  "function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)"
];

async function setOracleTwap30Min() {
  console.log('🔧 設置 Oracle TWAP 為 30 分鐘\n');

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
  
  const pool = new ethers.Contract(
    config.contracts.UNISWAP_POOL.address,
    POOL_ABI,
    provider
  );
  
  try {
    // 先測試池子是否支持 30 分鐘 TWAP
    console.log('🧪 測試池子 30 分鐘 TWAP...');
    try {
      await pool.observe([1800, 0]); // 30 分鐘
      console.log('✅ 池子支持 30 分鐘 TWAP\n');
    } catch (error) {
      if (error.reason === 'OLD') {
        console.log('❌ 池子尚不支持 30 分鐘 TWAP');
        console.log('💡 建議：繼續使用較短的 TWAP 週期，或等待更多交易歷史\n');
        
        // 測試其他週期
        console.log('測試其他可用週期：');
        const periods = [
          { time: 60, name: '1 分鐘' },
          { time: 300, name: '5 分鐘' },
          { time: 600, name: '10 分鐘' },
          { time: 900, name: '15 分鐘' },
          { time: 1800, name: '30 分鐘' }
        ];
        
        for (const period of periods) {
          try {
            await pool.observe([period.time, 0]);
            console.log(`✅ ${period.name} - 可用`);
          } catch {
            console.log(`❌ ${period.name} - 不可用`);
          }
        }
        
        return;
      }
      throw error;
    }
    
    // 檢查當前 TWAP 週期
    const currentTwap = await oracle.twapPeriod();
    console.log(`📊 當前 TWAP 週期: ${currentTwap} 秒 (${Number(currentTwap) / 60} 分鐘)`);
    
    // 設置為 30 分鐘
    const newTwap = 1800; // 30 分鐘
    console.log(`📊 新的 TWAP 週期: ${newTwap} 秒 (30 分鐘)`);
    console.log('\n✅ 優點：更高的安全性，抵抗價格操縱');
    console.log('⚠️  注意：需要持續的交易活動來維持\n');
    
    // 發送交易
    console.log('📝 發送交易...');
    const tx = await oracle.setTwapPeriod(newTwap);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    
    await tx.wait();
    console.log('✅ TWAP 已更新為 30 分鐘\n');
    
    // 測試價格查詢
    console.log('🧪 測試價格查詢...');
    try {
      const price = await oracle.getSoulShardPriceInUSD();
      console.log(`✅ getSoulShardPriceInUSD: ${ethers.formatUnits(price, 18)} USD`);
      
      const amount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
      console.log(`✅ 2 USD = ${ethers.formatUnits(amount, 18)} SOUL`);
      
      console.log('\n🎉 成功！Oracle 使用 30 分鐘 TWAP 正常工作');
      console.log('📌 請確保維護腳本持續運行以保持價格歷史');
      
    } catch (error) {
      console.log(`❌ 價格查詢失敗: ${error.reason || error.message}`);
      console.log('💡 可能需要等待更多交易來建立 30 分鐘歷史');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

setOracleTwap30Min().catch(console.error);
#!/usr/bin/env node

// 測試舊的 Oracle 是否還能工作

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// Oracle ABI
const ORACLE_ABI = [
  "function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)",
  "function getSoulShardPriceInUSD() view returns (uint256)",
  "function getLatestPrice() view returns (uint256)",
  "function twapPeriod() view returns (uint32)"
];

async function testOldOracle() {
  console.log('🧪 測試各版本 Oracle\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const oracles = [
    { 
      version: 'V21 (新部署)', 
      address: '0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B',
      deployTime: '2025-01-25 14:09'
    },
    { 
      version: 'V20 (之前可用)', 
      address: '0x570ab1b068FB8ca51c995e78d2D62189B6201284',
      deployTime: '2025-01-25 早期'
    },
    { 
      version: 'V19 (原始)', 
      address: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9',
      deployTime: '2025-01-20'
    }
  ];
  
  for (const oracleInfo of oracles) {
    console.log(`📊 測試 ${oracleInfo.version}`);
    console.log(`   地址: ${oracleInfo.address}`);
    console.log(`   部署時間: ${oracleInfo.deployTime}`);
    
    const oracle = new ethers.Contract(oracleInfo.address, ORACLE_ABI, provider);
    
    try {
      // 檢查 TWAP 週期
      try {
        const twap = await oracle.twapPeriod();
        console.log(`   TWAP 週期: ${twap} 秒`);
      } catch (e) {
        console.log(`   TWAP 週期: 無法讀取`);
      }
      
      // 測試 getSoulShardPriceInUSD
      try {
        const price = await oracle.getSoulShardPriceInUSD();
        console.log(`   ✅ getSoulShardPriceInUSD: ${ethers.formatUnits(price, 18)} USD`);
      } catch (error) {
        console.log(`   ❌ getSoulShardPriceInUSD 失敗: ${error.reason || error.message}`);
      }
      
      // 測試 getRequiredSoulShardAmount
      try {
        const amount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
        console.log(`   ✅ 2 USD = ${ethers.formatUnits(amount, 18)} SOUL`);
      } catch (error) {
        console.log(`   ❌ getRequiredSoulShardAmount 失敗: ${error.reason || error.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ 整體失敗: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('💡 分析：');
  console.log('如果 V20 可以工作但 V21 不行，可能是：');
  console.log('1. 部署時使用了錯誤的代碼');
  console.log('2. 部署時的構造參數有問題');
  console.log('3. 合約初始化後的狀態不同');
}

testOldOracle().catch(console.error);
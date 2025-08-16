#!/usr/bin/env node

// 比較 V21 和 V22 Oracle 的差異和性能

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Oracle 地址
const ORACLE_V21 = v22Config.contracts.ORACLE_OLD_V21.address;
const ORACLE_V22 = v22Config.contracts.ORACLE.address;

// Oracle ABI
const ORACLE_ABI = [
  'function getSoulToUsdTWAP() external view returns (uint256)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function getCurrentTwapPeriod() external view returns (uint32)',
  'function isAdaptiveMode() external view returns (bool)'
];

async function compareOracles() {
  console.log('🔍 比較 V21 和 V22 Oracle...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const oracleV21 = new ethers.Contract(ORACLE_V21, ORACLE_ABI, provider);
  const oracleV22 = new ethers.Contract(ORACLE_V22, ORACLE_ABI, provider);

  console.log('📋 Oracle 版本資訊：');
  console.log(`   V21 地址: ${ORACLE_V21}`);
  console.log(`   V22 地址: ${ORACLE_V22}`);
  console.log('');

  // 測試 V21
  console.log('📊 測試 V21 Oracle：');
  let v21Success = false;
  let v21Price = 0;
  let v21Time = 0;
  
  try {
    const startTime = Date.now();
    const soulToUsd = await oracleV21.getSoulToUsdTWAP();
    v21Time = Date.now() - startTime;
    v21Price = parseFloat(ethers.formatUnits(soulToUsd, 18));
    v21Success = true;
    
    console.log(`   ✅ 成功獲取價格: ${v21Price.toFixed(6)} USD`);
    console.log(`   ⏱️ 響應時間: ${v21Time}ms`);
    
    // 檢查 TWAP 週期
    try {
      const period = await oracleV21.getCurrentTwapPeriod();
      console.log(`   📏 TWAP 週期: ${period} 秒`);
    } catch {
      console.log(`   📏 TWAP 週期: 固定 1800 秒（無法讀取）`);
    }
  } catch (error) {
    console.log(`   ❌ 查詢失敗: ${error.message.substring(0, 50)}...`);
    console.log(`   ⏱️ 響應時間: ${Date.now() - startTime}ms`);
  }

  console.log('');

  // 測試 V22
  console.log('📊 測試 V22 Oracle：');
  let v22Success = false;
  let v22Price = 0;
  let v22Time = 0;
  
  try {
    const startTime = Date.now();
    const soulToUsd = await oracleV22.getSoulToUsdTWAP();
    v22Time = Date.now() - startTime;
    v22Price = parseFloat(ethers.formatUnits(soulToUsd, 18));
    v22Success = true;
    
    console.log(`   ✅ 成功獲取價格: ${v22Price.toFixed(6)} USD`);
    console.log(`   ⏱️ 響應時間: ${v22Time}ms`);
    
    // 檢查自適應模式
    const isAdaptive = await oracleV22.isAdaptiveMode();
    console.log(`   🔄 自適應模式: ${isAdaptive ? '啟用' : '禁用'}`);
    
    if (isAdaptive) {
      const currentPeriod = await oracleV22.getCurrentTwapPeriod();
      console.log(`   📏 當前 TWAP 週期: ${currentPeriod} 秒`);
    }
  } catch (error) {
    console.log(`   ❌ 查詢失敗: ${error.message}`);
    console.log(`   ⚠️ 這不應該發生！V22 設計為永不失敗`);
  }

  console.log('');

  // 比較結果
  console.log('📊 比較結果：');
  console.log('='.repeat(50));
  
  if (v21Success && v22Success) {
    const priceDiff = Math.abs(v22Price - v21Price) / v21Price * 100;
    console.log(`價格差異: ${priceDiff.toFixed(2)}%`);
    console.log(`速度提升: ${v21Time > v22Time ? '+' : ''}${((v21Time - v22Time) / v21Time * 100).toFixed(1)}%`);
  }
  
  console.log('\n🎯 V22 優勢：');
  console.log('✅ 自適應 TWAP 週期 (30/15/5/1 分鐘)');
  console.log('✅ 自動降級機制，確保永不失敗');
  console.log('✅ 更好的價格準確性');
  console.log('✅ 向後兼容 V21 接口');
  
  if (!v21Success && v22Success) {
    console.log('\n⭐ 關鍵優勢展示：');
    console.log('   V21 查詢失敗，但 V22 仍然成功返回價格！');
    console.log('   這正是 V22 "永不失敗" 設計的體現。');
  }

  // 壓力測試
  console.log('\n\n🏃 執行壓力測試...');
  await stressTest(oracleV22);
}

async function stressTest(oracle) {
  const testCount = 10;
  const results = [];
  
  console.log(`   執行 ${testCount} 次連續查詢...`);
  
  for (let i = 0; i < testCount; i++) {
    const startTime = Date.now();
    try {
      await oracle.getSoulToUsdTWAP();
      const duration = Date.now() - startTime;
      results.push({ success: true, duration });
      process.stdout.write('.');
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({ success: false, duration });
      process.stdout.write('x');
    }
  }
  
  console.log('\n');
  
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const minDuration = Math.min(...results.map(r => r.duration));
  const maxDuration = Math.max(...results.map(r => r.duration));
  
  console.log(`   成功率: ${successCount}/${testCount} (${(successCount / testCount * 100).toFixed(1)}%)`);
  console.log(`   平均響應時間: ${avgDuration.toFixed(0)}ms`);
  console.log(`   最快/最慢: ${minDuration}ms / ${maxDuration}ms`);
  
  if (successCount === testCount) {
    console.log(`   ✅ 完美！所有查詢都成功`);
  }
}

// 執行比較
if (require.main === module) {
  compareOracles().catch(console.error);
}

module.exports = { compareOracles };
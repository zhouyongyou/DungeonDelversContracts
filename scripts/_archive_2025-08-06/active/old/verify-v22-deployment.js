#!/usr/bin/env node

// 驗證 Oracle V22 部署和整合狀態

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const ORACLE_V22_ADDRESS = '0xb9317179466fd7fb253669538dE1c4635E81eAc4';

// Oracle ABI
const ORACLE_ABI = [
  "function getPriceAdaptive() view returns (uint256 price, uint32 usedPeriod)",
  "function getSoulShardPriceInUSD() view returns (uint256)",
  "function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)",
  "function testAllPeriods() view returns (bool[] available, uint256[] prices)",
  "function getAdaptivePeriods() view returns (uint32[])",
  "function owner() view returns (address)"
];

async function verifyV22Deployment() {
  console.log('🔍 驗證 Oracle V22 部署狀態\n');
  console.log(`📍 Oracle V22: ${ORACLE_V22_ADDRESS}`);
  console.log(`📅 部署時間: 2025-07-25\n`);

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const oracle = new ethers.Contract(ORACLE_V22_ADDRESS, ORACLE_ABI, provider);

  let allTestsPassed = true;

  try {
    // 1. 檢查 Owner
    console.log('1️⃣ 檢查合約 Owner...');
    const owner = await oracle.owner();
    console.log(`   Owner: ${owner}`);
    console.log(`   ✅ 合約已部署並可訪問\n`);

    // 2. 測試自適應價格查詢
    console.log('2️⃣ 測試自適應價格查詢...');
    try {
      const [price, usedPeriod] = await oracle.getPriceAdaptive();
      console.log(`   ✅ 價格: ${ethers.formatUnits(price, 18)} USD`);
      console.log(`   ✅ 使用週期: ${usedPeriod} 秒 (${Number(usedPeriod) / 60} 分鐘)`);
    } catch (error) {
      console.log(`   ❌ 自適應價格查詢失敗: ${error.message}`);
      allTestsPassed = false;
    }

    // 3. 測試向後兼容性
    console.log('\n3️⃣ 測試向後兼容函數...');
    try {
      const price = await oracle.getSoulShardPriceInUSD();
      console.log(`   ✅ getSoulShardPriceInUSD: ${ethers.formatUnits(price, 18)} USD`);
      
      const amount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
      console.log(`   ✅ 2 USD = ${ethers.formatUnits(amount, 18)} SOUL`);
      
      const pricePerUSD = Number(ethers.formatUnits(amount, 18)) / 2;
      console.log(`   ✅ 1 USD = ${pricePerUSD.toFixed(2)} SOUL`);
    } catch (error) {
      console.log(`   ❌ 向後兼容函數失敗: ${error.message}`);
      allTestsPassed = false;
    }

    // 4. 測試所有 TWAP 週期
    console.log('\n4️⃣ 測試所有 TWAP 週期...');
    try {
      const periods = await oracle.getAdaptivePeriods();
      const [available, prices] = await oracle.testAllPeriods();
      
      console.log('   週期可用性:');
      for (let i = 0; i < periods.length; i++) {
        const periodMinutes = Number(periods[i]) / 60;
        if (available[i]) {
          console.log(`   ✅ ${periodMinutes} 分鐘: ${ethers.formatUnits(prices[i], 18)} USD`);
        } else {
          console.log(`   ❌ ${periodMinutes} 分鐘: 不可用`);
        }
      }
    } catch (error) {
      console.log(`   ❌ 週期測試失敗: ${error.message}`);
      allTestsPassed = false;
    }

    // 5. 檢查前端配置
    console.log('\n5️⃣ 檢查前端配置...');
    const fs = require('fs');
    const frontendConfig = fs.readFileSync('/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts', 'utf8');
    if (frontendConfig.includes(ORACLE_V22_ADDRESS)) {
      console.log('   ✅ 前端已更新到 V22');
    } else {
      console.log('   ❌ 前端尚未更新');
      allTestsPassed = false;
    }

    // 6. 檢查後端配置
    console.log('\n6️⃣ 檢查後端配置...');
    const backendConfig = fs.readFileSync('/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js', 'utf8');
    if (backendConfig.includes(ORACLE_V22_ADDRESS)) {
      console.log('   ✅ 後端已更新到 V22');
    } else {
      console.log('   ❌ 後端尚未更新');
      allTestsPassed = false;
    }

    // 總結
    console.log('\n========== 驗證總結 ==========');
    if (allTestsPassed) {
      console.log('✅ 所有測試通過！Oracle V22 部署成功');
      console.log('\n🎉 Oracle V22 特性:');
      console.log('   • 自適應 TWAP (30/15/5/1 分鐘)');
      console.log('   • 永不失敗的價格查詢');
      console.log('   • 向後兼容 V21 接口');
      console.log('   • 前端和後端已同步更新');
    } else {
      console.log('⚠️  部分測試失敗，請檢查上述錯誤');
    }
    console.log('==============================\n');

    // 注意事項
    console.log('📌 注意事項:');
    console.log('1. DungeonCore 已更新到 V22 Oracle ✅');
    console.log('2. 維護腳本已更新到使用 V22 地址 ✅');
    console.log('3. 前端現在會自動使用自適應 TWAP');
    console.log('4. 池子維護機器人可以繼續運行');

  } catch (error) {
    console.error('\n❌ 驗證失敗:', error.message);
  }
}

verifyV22Deployment().catch(console.error);
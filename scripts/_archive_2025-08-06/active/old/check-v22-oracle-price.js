#!/usr/bin/env node

// V22 Oracle 價格檢查腳本 - 快速查看當前價格和狀態

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Oracle ABI
const ORACLE_ABI = [
  'function getSoulToUsdTWAP() external view returns (uint256)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function getCurrentTwapPeriod() external view returns (uint32)',
  'function getAdaptivePeriods() external view returns (uint32[4])',
  'function getLastSuccessfulPeriod() external view returns (uint32)',
  'function isAdaptiveMode() external view returns (bool)'
];

async function checkOraclePrice() {
  console.log('🔍 檢查 V22 Oracle 價格...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, ORACLE_ABI, provider);

  try {
    console.log('📋 Oracle 資訊：');
    console.log(`   地址: ${v22Config.contracts.ORACLE.address}`);
    console.log(`   版本: ${v22Config.version}`);
    console.log(`   部署日期: ${v22Config.deployments.V22.date}\n`);

    // 檢查自適應模式
    const isAdaptive = await oracle.isAdaptiveMode();
    console.log(`📊 自適應模式: ${isAdaptive ? '✅ 啟用' : '❌ 禁用'}`);

    if (isAdaptive) {
      const adaptivePeriods = await oracle.getAdaptivePeriods();
      console.log(`   可用週期: ${adaptivePeriods.map(p => `${p}秒`).join(', ')}`);
      
      const currentPeriod = await oracle.getCurrentTwapPeriod();
      const lastSuccessfulPeriod = await oracle.getLastSuccessfulPeriod();
      console.log(`   當前使用: ${currentPeriod} 秒`);
      console.log(`   上次成功: ${lastSuccessfulPeriod} 秒`);
    }

    // 獲取價格
    console.log('\n💰 當前價格：');
    
    const soulToUsd = await oracle.getSoulToUsdTWAP();
    const usdToSoul = await oracle.getUsdToSoulTWAP();
    
    const soulPrice = parseFloat(ethers.formatUnits(soulToUsd, 18));
    const usdPrice = parseFloat(ethers.formatUnits(usdToSoul, 18));
    
    console.log(`   1 SOUL = ${soulPrice.toFixed(6)} USD`);
    console.log(`   1 USD = ${usdPrice.toFixed(6)} SOUL`);
    
    // 驗證價格互換
    const priceCheck = soulPrice * usdPrice;
    console.log(`\n✅ 價格驗證: ${priceCheck.toFixed(6)} (應該接近 1.0)`);
    
    if (Math.abs(priceCheck - 1.0) > 0.01) {
      console.log('   ⚠️ 警告：價格可能有問題！');
    }

    // 計算一些常用數值
    console.log('\n📈 參考數值：');
    console.log(`   100 SOUL = ${(100 * soulPrice).toFixed(2)} USD`);
    console.log(`   1000 SOUL = ${(1000 * soulPrice).toFixed(2)} USD`);
    console.log(`   10000 SOUL = ${(10000 * soulPrice).toFixed(2)} USD`);
    
    console.log('\n✅ Oracle 運作正常！');

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n可能的原因：');
      console.log('1. Oracle 合約地址錯誤');
      console.log('2. 網路連接問題');
      console.log('3. Oracle 合約未正確部署');
    }
  }
}

// 執行檢查
if (require.main === module) {
  checkOraclePrice().catch(console.error);
}

module.exports = { checkOraclePrice };
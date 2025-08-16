#!/usr/bin/env node

// 檢查 Hero 和 Relic 的鑄造價格

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約 ABI
const NFT_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function platformFee() public view returns (uint256)'
];

const ORACLE_ABI = [
  'function getUsdToSoulTWAP() external view returns (uint256)'
];

async function checkMintPrices() {
  console.log('🔍 檢查 NFT 鑄造價格...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 合約實例
  const hero = new ethers.Contract(v22Config.contracts.HERO.address, NFT_ABI, provider);
  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, NFT_ABI, provider);
  const oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, ORACLE_ABI, provider);

  try {
    // 檢查 Oracle 價格
    console.log('📊 Oracle 價格：');
    const usdToSoul = await oracle.getUsdToSoulTWAP();
    const usdToSoulPrice = parseFloat(ethers.formatUnits(usdToSoul, 18));
    console.log(`   1 USD = ${usdToSoulPrice.toFixed(6)} SOUL\n`);

    // 檢查 Hero
    console.log('⚔️ Hero 英雄：');
    const heroMintPriceUSD = await hero.mintPriceUSD();
    console.log(`   USD 價格: ${ethers.formatUnits(heroMintPriceUSD, 18)} USD`);
    
    const heroPlatformFee = await hero.platformFee();
    console.log(`   平台費: ${ethers.formatEther(heroPlatformFee)} BNB`);
    
    // 測試不同數量的價格
    for (const quantity of [1, 5, 10, 50]) {
      const requiredSoul = await hero.getRequiredSoulShardAmount(quantity);
      const soulAmount = parseFloat(ethers.formatUnits(requiredSoul, 18));
      const perUnit = soulAmount / quantity;
      console.log(`   ${quantity} 個英雄需要: ${soulAmount.toFixed(4)} SOUL (單價: ${perUnit.toFixed(4)} SOUL)`);
    }

    console.log('\n💎 Relic 聖物：');
    const relicMintPriceUSD = await relic.mintPriceUSD();
    console.log(`   USD 價格: ${ethers.formatUnits(relicMintPriceUSD, 18)} USD`);
    
    const relicPlatformFee = await relic.platformFee();
    console.log(`   平台費: ${ethers.formatEther(relicPlatformFee)} BNB`);
    
    // 測試不同數量的價格
    for (const quantity of [1, 5, 10, 50]) {
      try {
        const requiredSoul = await relic.getRequiredSoulShardAmount(quantity);
        const soulAmount = parseFloat(ethers.formatUnits(requiredSoul, 18));
        const perUnit = soulAmount / quantity;
        console.log(`   ${quantity} 個聖物需要: ${soulAmount.toFixed(4)} SOUL (單價: ${perUnit.toFixed(4)} SOUL)`);
        
        // 檢查是否異常
        if (perUnit > 1000000) {
          console.log(`   ⚠️ 警告：價格異常高！可能是合約問題`);
        }
      } catch (error) {
        console.log(`   ❌ 查詢 ${quantity} 個聖物價格失敗: ${error.message}`);
      }
    }

    // 診斷分析
    console.log('\n🔍 診斷分析：');
    console.log('1. 預期價格範圍：');
    console.log('   - Hero: 約 33,000 SOUL/個');
    console.log('   - Relic: 約 13,000 SOUL/個');
    console.log('\n2. 如果價格異常高，可能原因：');
    console.log('   - Oracle 返回錯誤的價格');
    console.log('   - 合約的 mintPriceUSD 設置錯誤');
    console.log('   - getRequiredSoulShardAmount 計算邏輯有誤');

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.message.includes('CALL_EXCEPTION')) {
      console.log('\n可能的原因：');
      console.log('1. 合約地址錯誤');
      console.log('2. 合約未正確部署');
      console.log('3. 函數名稱錯誤');
    }
  }
}

// 執行檢查
if (require.main === module) {
  checkMintPrices().catch(console.error);
}

module.exports = { checkMintPrices };
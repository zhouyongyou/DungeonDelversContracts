#!/usr/bin/env node

// 簡單測試聖物價格計算

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function testRelicPrice() {
  console.log('💎 測試聖物價格計算...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 使用簡單的 ABI，只測試我們需要的函數
  const relicABI = [
    'function mintPriceUSD() public view returns (uint256)',
    'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)'
  ];
  
  const heroABI = [
    'function mintPriceUSD() public view returns (uint256)',
    'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)'
  ];

  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, relicABI, provider);
  const hero = new ethers.Contract(v22Config.contracts.HERO.address, heroABI, provider);

  try {
    // 測試英雄價格 (之前是正常的)
    console.log('⚔️ 英雄價格測試：');
    
    const heroMintPrice = await hero.mintPriceUSD();
    console.log(`   mintPriceUSD: ${ethers.formatUnits(heroMintPrice, 18)} USD`);
    
    const heroRequired1 = await hero.getRequiredSoulShardAmount(1);
    const heroPrice1 = Number(ethers.formatUnits(heroRequired1, 18));
    console.log(`   1 個英雄需要: ${heroPrice1.toFixed(4)} SOUL`);
    
    if (heroPrice1 > 1000000) {
      console.log(`   ⚠️ 英雄價格異常高！`);
    } else {
      console.log(`   ✅ 英雄價格正常`);
    }

    // 測試聖物價格
    console.log('\n💎 聖物價格測試：');
    
    const relicMintPrice = await relic.mintPriceUSD();
    console.log(`   mintPriceUSD: ${ethers.formatUnits(relicMintPrice, 18)} USD`);
    
    const relicRequired1 = await relic.getRequiredSoulShardAmount(1);
    const relicPrice1 = Number(ethers.formatUnits(relicRequired1, 18));
    console.log(`   1 個聖物需要: ${relicPrice1.toFixed(4)} SOUL`);
    
    if (relicPrice1 > 1000000) {
      console.log(`   ❌ 聖物價格異常高！`);
      console.log(`   這就是前端顯示 13,652,380,979,954,044,000,000 的原因`);
    } else if (relicPrice1 < 100) {
      console.log(`   ❌ 聖物價格異常低！`);
    } else {
      console.log(`   ✅ 聖物價格正常`);
    }

    // 比較兩者的價格設置
    console.log('\n📊 價格比較：');
    console.log(`   英雄 USD 價格: ${ethers.formatUnits(heroMintPrice, 18)}`);
    console.log(`   聖物 USD 價格: ${ethers.formatUnits(relicMintPrice, 18)}`);
    console.log(`   英雄 SOUL 價格: ${heroPrice1.toFixed(4)}`);
    console.log(`   聖物 SOUL 價格: ${relicPrice1.toFixed(4)}`);
    
    const ratio = relicPrice1 / heroPrice1;
    console.log(`   價格比例 (聖物/英雄): ${ratio.toFixed(2)}`);
    
    if (ratio > 100 || ratio < 0.01) {
      console.log(`   ⚠️ 價格比例異常！`);
    }

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    
    if (error.message.includes('execution reverted')) {
      console.log('\n💡 可能的原因：');
      console.log('1. Oracle 連接有問題');
      console.log('2. 聖物合約的 Oracle 地址設置錯誤');
      console.log('3. Oracle 初始化不完整');
    }
  }
}

// 執行測試
if (require.main === module) {
  testRelicPrice().catch(console.error);
}

module.exports = { testRelicPrice };
#!/usr/bin/env node

// 正確修復 Relic 合約的 USD 價格

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// Relic 合約 ABI
const RELIC_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function setMintPriceUSD(uint256 _newPrice) external',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function owner() external view returns (address)'
];

async function fixRelicPriceCorrectly() {
  console.log('💎 正確修復 Relic 價格...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`💎 Relic 地址: ${v22Config.contracts.RELIC.address}\n`);

  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, RELIC_ABI, deployer);

  try {
    // 1. 檢查當前狀態
    console.log('📊 當前狀態：');
    
    const currentPrice = await relic.mintPriceUSD();
    console.log(`   當前 mintPriceUSD: ${ethers.formatUnits(currentPrice, 18)} USD`);
    console.log(`   當前 mintPriceUSD (raw): ${currentPrice.toString()}`);
    
    const currentRequired = await relic.getRequiredSoulShardAmount(1);
    const currentSoul = parseFloat(ethers.formatUnits(currentRequired, 18));
    console.log(`   當前 1個聖物需要: ${currentSoul.toFixed(4)} SOUL`);
    console.log(`   價格是否異常: ${currentSoul > 1000000 ? '❌ 是' : '✅ 否'}`);

    // 2. 設置正確價格
    console.log('\n🔧 設置正確價格：');
    
    // 重要：setMintPriceUSD 函數會自動乘以 1e18，所以我們只需傳入原始數字
    const correctPrice = 0.8; // 不需要乘以 1e18
    console.log(`   目標價格: ${correctPrice} USD`);
    console.log(`   傳入參數: ${correctPrice} (函數內部會自動乘以 1e18)`);
    
    const updateTx = await relic.setMintPriceUSD(correctPrice);
    console.log(`   交易哈希: ${updateTx.hash}`);
    console.log('   等待確認...');
    
    const receipt = await updateTx.wait();
    console.log(`   ✅ 價格更新成功！區塊: ${receipt.blockNumber}`);

    // 3. 驗證修復結果
    console.log('\n✅ 驗證修復結果：');
    
    const newPrice = await relic.mintPriceUSD();
    console.log(`   新 mintPriceUSD: ${ethers.formatUnits(newPrice, 18)} USD`);
    console.log(`   新 mintPriceUSD (raw): ${newPrice.toString()}`);
    
    const newRequired = await relic.getRequiredSoulShardAmount(1);
    const newSoul = parseFloat(ethers.formatUnits(newRequired, 18));
    console.log(`   新 1個聖物需要: ${newSoul.toFixed(4)} SOUL`);
    
    // 檢查價格是否合理
    const isReasonable = newSoul > 1000 && newSoul < 100000;
    console.log(`   價格是否合理: ${isReasonable ? '✅ 是' : '❌ 否'}`);
    
    if (isReasonable) {
      console.log(`   預期前端顯示: ${newSoul.toFixed(4)} $SoulShard`);
    } else {
      console.log(`   前端仍會顯示異常: ${newSoul.toExponential(4)}`);
    }

    // 4. 與 Hero 價格比較
    console.log('\n📊 與 Hero 價格比較：');
    
    const heroABI = ['function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)'];
    const hero = new ethers.Contract(v22Config.contracts.HERO.address, heroABI, provider);
    
    const heroRequired = await hero.getRequiredSoulShardAmount(1);
    const heroSoul = parseFloat(ethers.formatUnits(heroRequired, 18));
    
    console.log(`   Hero 1個需要: ${heroSoul.toFixed(4)} SOUL`);
    console.log(`   Relic 1個需要: ${newSoul.toFixed(4)} SOUL`);
    
    const ratio = newSoul / heroSoul;
    const expectedRatio = 0.8 / 2.0; // 0.4
    
    console.log(`   實際比例: ${ratio.toFixed(2)}`);
    console.log(`   預期比例: ${expectedRatio.toFixed(2)}`);
    console.log(`   比例正確: ${Math.abs(ratio - expectedRatio) < 0.1 ? '✅ 是' : '❌ 否'}`);

    // 5. 最終總結
    console.log('\n🎯 最終總結：');
    
    if (isReasonable && Math.abs(ratio - expectedRatio) < 0.1) {
      console.log('🎉 Relic 價格修復成功！');
      console.log('✅ 前端聖物價格顯示問題已完全解決');
      console.log('✅ 價格比例符合預期');
      console.log('💡 用戶現在可以正常進行聖物鑄造');
    } else {
      console.log('❌ 修復未完全成功');
      if (!isReasonable) {
        console.log('   - 價格仍然不在合理範圍');
      }
      if (Math.abs(ratio - expectedRatio) >= 0.1) {
        console.log('   - 與 Hero 的價格比例不正確');
      }
    }

  } catch (error) {
    console.error('\n❌ 修復失敗:', error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('💡 解決方案：確認你是 Relic 合約的擁有者');
    }
  }
}

// 執行修復
if (require.main === module) {
  fixRelicPriceCorrectly().catch(console.error);
}

module.exports = { fixRelicPriceCorrectly };
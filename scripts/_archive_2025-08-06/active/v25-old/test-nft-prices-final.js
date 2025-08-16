#!/usr/bin/env node

// 最終測試 Hero 和 Relic 價格，使用正確的 Oracle 地址和函數

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// 使用正確的 Oracle 地址
const ORACLE_ADDRESS = "0xb9317179466fd7fb253669538dE1c4635E81eAc4";

// NFT 合約 ABI
const NFT_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function oracle() external view returns (address)',
  'function setOracle(address _oracle) external',
  'function owner() external view returns (address)'
];

// Oracle ABI（正確版本）
const ORACLE_ABI = [
  'function getSoulShardPriceInUSD() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 usdAmount) public view returns (uint256)',
  'function owner() external view returns (address)'
];

async function testNftPricesFinal() {
  console.log('🎯 最終測試 NFT 價格計算...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🔮 Oracle 地址: ${ORACLE_ADDRESS}`);
  console.log(`⚔️ Hero 地址: ${v22Config.contracts.HERO.address}`);
  console.log(`💎 Relic 地址: ${v22Config.contracts.RELIC.address}\n`);

  // 合約實例
  const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
  const hero = new ethers.Contract(v22Config.contracts.HERO.address, NFT_ABI, provider);
  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, NFT_ABI, provider);

  try {
    // 1. 驗證 Oracle 價格
    console.log('🔮 Oracle 價格驗證：');
    
    const soulShardPriceUSD = await oracle.getSoulShardPriceInUSD();
    const priceValue = parseFloat(ethers.formatUnits(soulShardPriceUSD, 18));
    const soulPerUsd = 1 / priceValue;
    
    console.log(`   SoulShard 價格: ${priceValue.toFixed(8)} USD per SOUL`);
    console.log(`   轉換價格: 1 USD = ${soulPerUsd.toFixed(2)} SOUL`);
    console.log(`   價格狀態: ${soulPerUsd > 1000 && soulPerUsd < 100000 ? '✅ 正常' : '⚠️ 異常'}`);

    // 2. 檢查 Hero 合約
    console.log('\n⚔️ Hero 合約檢查：');
    
    const heroMintPrice = await hero.mintPriceUSD();
    console.log(`   USD 鑄造價格: ${ethers.formatUnits(heroMintPrice, 18)} USD`);
    
    const heroOracle = await hero.oracle();
    console.log(`   Hero Oracle: ${heroOracle}`);
    console.log(`   正確 Oracle: ${ORACLE_ADDRESS}`);
    console.log(`   Oracle 匹配: ${heroOracle.toLowerCase() === ORACLE_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    
    // 如果 Oracle 不匹配，更新它
    if (heroOracle.toLowerCase() !== ORACLE_ADDRESS.toLowerCase()) {
      console.log(`   🔧 更新 Hero Oracle...`);
      try {
        const heroWithSigner = hero.connect(deployer);
        const updateTx = await heroWithSigner.setOracle(ORACLE_ADDRESS);
        console.log(`   交易: ${updateTx.hash}`);
        await updateTx.wait();
        console.log(`   ✅ Hero Oracle 更新成功`);
      } catch (error) {
        console.log(`   ❌ Hero Oracle 更新失敗: ${error.message}`);
      }
    }

    // 測試 Hero 價格計算
    const heroRequired1 = await hero.getRequiredSoulShardAmount(1);
    const heroPrice1 = Number(ethers.formatUnits(heroRequired1, 18));
    console.log(`   1 個英雄需要: ${heroPrice1.toFixed(4)} SOUL`);
    console.log(`   英雄價格狀態: ${heroPrice1 > 1000 && heroPrice1 < 100000 ? '✅ 正常' : '❌ 異常'}`);

    // 3. 檢查 Relic 合約
    console.log('\n💎 Relic 合約檢查：');
    
    const relicMintPrice = await relic.mintPriceUSD();
    console.log(`   USD 鑄造價格: ${ethers.formatUnits(relicMintPrice, 18)} USD`);
    
    const relicOracle = await relic.oracle();
    console.log(`   Relic Oracle: ${relicOracle}`);
    console.log(`   正確 Oracle: ${ORACLE_ADDRESS}`);
    console.log(`   Oracle 匹配: ${relicOracle.toLowerCase() === ORACLE_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    
    // 如果 Oracle 不匹配，更新它
    if (relicOracle.toLowerCase() !== ORACLE_ADDRESS.toLowerCase()) {
      console.log(`   🔧 更新 Relic Oracle...`);
      try {
        const relicWithSigner = relic.connect(deployer);
        const updateTx = await relicWithSigner.setOracle(ORACLE_ADDRESS);
        console.log(`   交易: ${updateTx.hash}`);
        await updateTx.wait();
        console.log(`   ✅ Relic Oracle 更新成功`);
      } catch (error) {
        console.log(`   ❌ Relic Oracle 更新失敗: ${error.message}`);
      }
    }

    // 測試 Relic 價格計算
    const relicRequired1 = await relic.getRequiredSoulShardAmount(1);
    const relicPrice1 = Number(ethers.formatUnits(relicRequired1, 18));
    console.log(`   1 個聖物需要: ${relicPrice1.toFixed(4)} SOUL`);
    console.log(`   聖物價格狀態: ${relicPrice1 > 1000 && relicPrice1 < 100000 ? '✅ 正常' : '❌ 異常'}`);

    // 4. 價格比較分析
    console.log('\n📊 價格比較分析：');
    
    const expectedHeroPrice = 2.0; // USD
    const expectedRelicPrice = 0.8; // USD
    
    const calculatedHeroSoul = expectedHeroPrice * soulPerUsd;
    const calculatedRelicSoul = expectedRelicPrice * soulPerUsd;
    
    console.log(`   預期 Hero 價格: ${expectedHeroPrice} USD = ${calculatedHeroSoul.toFixed(2)} SOUL`);
    console.log(`   實際 Hero 價格: ${heroPrice1.toFixed(2)} SOUL`);
    console.log(`   Hero 價格差異: ${Math.abs(heroPrice1 - calculatedHeroSoul).toFixed(2)} SOUL`);
    
    console.log(`   預期 Relic 價格: ${expectedRelicPrice} USD = ${calculatedRelicSoul.toFixed(2)} SOUL`);
    console.log(`   實際 Relic 價格: ${relicPrice1.toFixed(2)} SOUL`);
    console.log(`   Relic 價格差異: ${Math.abs(relicPrice1 - calculatedRelicSoul).toFixed(2)} SOUL`);

    // 5. 檢查是否修復了前端顯示的問題
    console.log('\n🔧 前端顯示問題檢查：');
    
    if (relicPrice1 > 1000000) {
      console.log(`   ❌ 聖物價格仍然異常高: ${relicPrice1.toFixed(0)} SOUL`);
      console.log(`   這會導致前端顯示: ${(relicPrice1 / 1e18 * 1e22).toFixed(0)}`);
    } else {
      console.log(`   ✅ 聖物價格正常: ${relicPrice1.toFixed(4)} SOUL`);
      console.log(`   前端應該顯示: ${relicPrice1.toFixed(4)} $SoulShard`);
    }

    // 6. 總結
    console.log('\n🎯 總結：');
    
    const heroOk = heroPrice1 > 1000 && heroPrice1 < 100000;
    const relicOk = relicPrice1 > 1000 && relicPrice1 < 100000;
    
    if (heroOk && relicOk) {
      console.log('✅ 所有 NFT 價格都已修復！');
      console.log('✅ 前端聖物價格顯示問題已解決');
      console.log('💡 現在可以測試前端鑄造功能');
    } else {
      console.log('❌ 仍有價格問題需要解決');
      if (!heroOk) console.log(`   - Hero 價格異常: ${heroPrice1.toFixed(2)} SOUL`);
      if (!relicOk) console.log(`   - Relic 價格異常: ${relicPrice1.toFixed(2)} SOUL`);
    }

  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message);
  }
}

// 執行測試
if (require.main === module) {
  testNftPricesFinal().catch(console.error);
}

module.exports = { testNftPricesFinal };
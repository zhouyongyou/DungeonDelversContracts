#!/usr/bin/env node

// 檢查 Relic 合約的 USD 價格設置

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// NFT 合約 ABI
const NFT_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function setMintPriceUSD(uint256 _newPrice) external',
  'function owner() external view returns (address)'
];

async function checkRelicUsdPrice() {
  console.log('💎 檢查 Relic 合約的 USD 價格設置...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`⚔️ Hero 地址: ${v22Config.contracts.HERO.address}`);
  console.log(`💎 Relic 地址: ${v22Config.contracts.RELIC.address}\n`);

  const hero = new ethers.Contract(v22Config.contracts.HERO.address, NFT_ABI, provider);
  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, NFT_ABI, provider);

  try {
    // 1. 檢查兩個合約的 USD 價格
    console.log('💰 USD 價格對比：');
    
    const heroMintPrice = await hero.mintPriceUSD();
    const relicMintPrice = await relic.mintPriceUSD();
    
    const heroUsdPrice = parseFloat(ethers.formatUnits(heroMintPrice, 18));
    const relicUsdPrice = parseFloat(ethers.formatUnits(relicMintPrice, 18));
    
    console.log(`   Hero USD 價格: ${heroUsdPrice} USD`);
    console.log(`   Relic USD 價格: ${relicUsdPrice} USD`);
    
    // 從配置文件檢查預期價格
    const expectedHeroPrice = parseFloat(v22Config.parameters.hero.mintPriceUSD);
    const expectedRelicPrice = parseFloat(v22Config.parameters.relic.mintPriceUSD);
    
    console.log(`   預期 Hero 價格: ${expectedHeroPrice} USD`);
    console.log(`   預期 Relic 價格: ${expectedRelicPrice} USD`);
    
    console.log(`   Hero 價格正確: ${Math.abs(heroUsdPrice - expectedHeroPrice) < 0.01 ? '✅' : '❌'}`);
    console.log(`   Relic 價格正確: ${Math.abs(relicUsdPrice - expectedRelicPrice) < 0.01 ? '✅' : '❌'}`);

    // 2. 如果 Relic 價格錯誤，修復它
    if (Math.abs(relicUsdPrice - expectedRelicPrice) >= 0.01) {
      console.log('\n🔧 修復 Relic USD 價格...');
      
      const relicOwner = await relic.owner();
      console.log(`   Relic 擁有者: ${relicOwner}`);
      console.log(`   你是擁有者: ${relicOwner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
      
      if (relicOwner.toLowerCase() === deployer.address.toLowerCase()) {
        try {
          const relicWithSigner = relic.connect(deployer);
          
          // 注意：setMintPriceUSD 函數可能會自動乘以 1e18，所以我們傳入原始值
          const newPriceWei = ethers.parseUnits(expectedRelicPrice.toString(), 18);
          console.log(`   設置新價格: ${expectedRelicPrice} USD (${newPriceWei.toString()} wei)`);
          
          const updateTx = await relicWithSigner.setMintPriceUSD(expectedRelicPrice);
          console.log(`   交易哈希: ${updateTx.hash}`);
          console.log('   等待確認...');
          
          const receipt = await updateTx.wait();
          console.log(`   ✅ Relic 價格更新成功！區塊: ${receipt.blockNumber}`);
          
          // 驗證更新
          const newMintPrice = await relic.mintPriceUSD();
          const newUsdPrice = parseFloat(ethers.formatUnits(newMintPrice, 18));
          console.log(`   新 USD 價格: ${newUsdPrice} USD`);
          
        } catch (error) {
          console.log(`   ❌ 價格更新失敗: ${error.message}`);
          
          // 嘗試另一種方式（直接傳入 wei 值）
          console.log('   嘗試直接設置 wei 值...');
          try {
            const relicWithSigner = relic.connect(deployer);
            const correctPriceWei = ethers.parseUnits(expectedRelicPrice.toString(), 18);
            
            // 有些合約需要傳入已經乘以 1e18 的值
            const updateTx2 = await relicWithSigner.setMintPriceUSD(correctPriceWei);
            console.log(`   交易哈希: ${updateTx2.hash}`);
            
            const receipt2 = await updateTx2.wait();
            console.log(`   ✅ Relic 價格更新成功！區塊: ${receipt2.blockNumber}`);
            
          } catch (error2) {
            console.log(`   ❌ 第二次嘗試也失敗: ${error2.message}`);
          }
        }
      } else {
        console.log(`   ❌ 沒有權限更新 Relic 價格`);
      }
    }

    // 3. 重新測試價格計算
    console.log('\n🔄 重新測試價格計算：');
    
    const heroPrice1 = await hero.getRequiredSoulShardAmount(1);
    const relicPrice1 = await relic.getRequiredSoulShardAmount(1);
    
    const heroPriceValue = parseFloat(ethers.formatUnits(heroPrice1, 18));
    const relicPriceValue = parseFloat(ethers.formatUnits(relicPrice1, 18));
    
    console.log(`   Hero 1個需要: ${heroPriceValue.toFixed(4)} SOUL`);
    console.log(`   Relic 1個需要: ${relicPriceValue.toFixed(4)} SOUL`);
    
    console.log(`   Hero 價格狀態: ${heroPriceValue > 1000 && heroPriceValue < 100000 ? '✅ 正常' : '❌ 異常'}`);
    console.log(`   Relic 價格狀態: ${relicPriceValue > 1000 && relicPriceValue < 100000 ? '✅ 正常' : '❌ 異常'}`);

    // 4. 檢查比例是否合理
    const priceRatio = relicPriceValue / heroPriceValue;
    const expectedRatio = expectedRelicPrice / expectedHeroPrice; // 0.8 / 2.0 = 0.4
    
    console.log('\n📊 價格比例分析：');
    console.log(`   實際價格比例 (Relic/Hero): ${priceRatio.toFixed(2)}`);
    console.log(`   預期價格比例: ${expectedRatio.toFixed(2)}`);
    console.log(`   比例正確: ${Math.abs(priceRatio - expectedRatio) < 0.1 ? '✅' : '❌'}`);

    // 5. 總結
    console.log('\n🎯 總結：');
    if (relicPriceValue > 1000 && relicPriceValue < 100000) {
      console.log('✅ Relic 價格已修復！');
      console.log('✅ 前端聖物價格顯示問題已解決');
      console.log(`💡 預期前端顯示: ${relicPriceValue.toFixed(4)} $SoulShard`);
    } else {
      console.log('❌ Relic 價格仍然異常');
      console.log(`❌ 前端會顯示: ${(relicPriceValue / 1e18 * 1e22).toFixed(0)}`);
    }

  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkRelicUsdPrice().catch(console.error);
}

module.exports = { checkRelicUsdPrice };
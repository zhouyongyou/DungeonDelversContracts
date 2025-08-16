const hre = require("hardhat");

async function main() {
  console.log('🔧 設定鑄造價格為 0 USD（移除 SoulShard 需求）');
  console.log('==========================================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const relicAddress = '0x50C37A1d8d8A5b7A59b2bdBfC3d5C91A6e07D7B3';
  
  console.log('Hero 合約:', heroAddress);
  console.log('Relic 合約:', relicAddress);
  console.log('');
  
  try {
    // 設定 Hero 合約
    console.log('1️⃣ 設定 Hero 鑄造價格:');
    const hero = await hre.ethers.getContractAt('Hero', heroAddress);
    
    const currentPriceHero = await hero.mintPriceUSD();
    console.log('   當前價格:', hre.ethers.formatEther(currentPriceHero), 'USD');
    
    if (currentPriceHero > 0n) {
      console.log('   設定價格為 0 USD...');
      const tx1 = await hero.setMintPriceUSD(0);
      console.log('   交易哈希:', tx1.hash);
      await tx1.wait();
      
      const newPriceHero = await hero.mintPriceUSD();
      console.log('   ✅ 新價格:', hre.ethers.formatEther(newPriceHero), 'USD');
    } else {
      console.log('   ✅ 價格已經是 0 USD');
    }
    
    console.log('');
    
    // 設定 Relic 合約
    console.log('2️⃣ 設定 Relic 鑄造價格:');
    const relic = await hre.ethers.getContractAt('Relic', relicAddress);
    
    const currentPriceRelic = await relic.mintPriceUSD();
    console.log('   當前價格:', hre.ethers.formatEther(currentPriceRelic), 'USD');
    
    if (currentPriceRelic > 0n) {
      console.log('   設定價格為 0 USD...');
      const tx2 = await relic.setMintPriceUSD(0);
      console.log('   交易哈希:', tx2.hash);
      await tx2.wait();
      
      const newPriceRelic = await relic.mintPriceUSD();
      console.log('   ✅ 新價格:', hre.ethers.formatEther(newPriceRelic), 'USD');
    } else {
      console.log('   ✅ 價格已經是 0 USD');
    }
    
    console.log('');
    
    // 驗證結果
    console.log('📋 最終驗證:');
    console.log('============');
    
    const finalHeroPrice = await hero.mintPriceUSD();
    const finalRelicPrice = await relic.mintPriceUSD();
    
    console.log('Hero mintPriceUSD:', hre.ethers.formatEther(finalHeroPrice), 'USD');
    console.log('Relic mintPriceUSD:', hre.ethers.formatEther(finalRelicPrice), 'USD');
    
    // 測試 SoulShard 需求
    const requiredSoulShard = await hero.getRequiredSoulShardAmount(1);
    console.log('Required SoulShard for 1 hero:', hre.ethers.formatEther(requiredSoulShard));
    
    if (requiredSoulShard === 0n) {
      console.log('');
      console.log('🎉 完成！現在鑄造不需要 SoulShard，只需要 BNB 付 VRF 費用');
      console.log('💡 可以開始測試鑄造功能了！');
    }
    
  } catch (error) {
    console.error('❌ 設定失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log('🔧 将 Hero 铸造价格设为 0（完全移除 SoulShard 需求）');
  console.log('===============================================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('执行账户:', signer.address);
  console.log('');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const relicAddress = '0x50C37A1d8d8A5b7A59b2bdBfC3d5C91A6e07D7B3';
  
  try {
    // 设置 Hero 合约
    console.log('1️⃣ 设置 Hero 铸造价格为 0:');
    const hero = await hre.ethers.getContractAt('Hero', heroAddress);
    
    const currentPriceHero = await hero.mintPriceUSD();
    console.log('   当前价格:', hre.ethers.formatEther(currentPriceHero), 'USD');
    
    if (currentPriceHero > 0n) {
      const tx1 = await hero.setMintPriceUSD(0);
      console.log('   交易哈希:', tx1.hash);
      await tx1.wait();
      
      const newPriceHero = await hero.mintPriceUSD();
      console.log('   ✅ 新价格:', hre.ethers.formatEther(newPriceHero), 'USD');
    } else {
      console.log('   ✅ 价格已经是 0 USD');
    }
    
    // 测试 Hero 计算结果
    console.log('\n🧪 测试 Hero 价格计算:');
    for (let qty of [1, 10, 50]) {
      const testAmount = await hero.getRequiredSoulShardAmount(qty);
      console.log(`   ${qty} 个 Hero: ${hre.ethers.formatEther(testAmount)} SOUL`);
    }
    
    console.log('');
    
    // 设置 Relic 合约（如果存在且需要）
    console.log('2️⃣ 设置 Relic 铸造价格为 0:');
    try {
      const relic = await hre.ethers.getContractAt('Relic', relicAddress);
      
      const currentPriceRelic = await relic.mintPriceUSD();
      console.log('   当前价格:', hre.ethers.formatEther(currentPriceRelic), 'USD');
      
      if (currentPriceRelic > 0n) {
        const tx2 = await relic.setMintPriceUSD(0);
        console.log('   交易哈希:', tx2.hash);
        await tx2.wait();
        
        const newPriceRelic = await relic.mintPriceUSD();
        console.log('   ✅ 新价格:', hre.ethers.formatEther(newPriceRelic), 'USD');
      } else {
        console.log('   ✅ 价格已经是 0 USD');
      }
      
      // 测试 Relic 计算结果
      console.log('\n🧪 测试 Relic 价格计算:');
      for (let qty of [1, 10, 50]) {
        const testAmount = await relic.getRequiredSoulShardAmount(qty);
        console.log(`   ${qty} 个 Relic: ${hre.ethers.formatEther(testAmount)} SOUL`);
      }
      
    } catch (error) {
      console.log('   ⚠️ Relic 合约设置失败 (可能地址不正确):', error.message);
    }
    
    console.log('\n📋 最终状态:');
    console.log('=============');
    
    const finalHeroPrice = await hero.mintPriceUSD();
    console.log('Hero mintPriceUSD:', hre.ethers.formatEther(finalHeroPrice), 'USD');
    
    const heroSoulNeed50 = await hero.getRequiredSoulShardAmount(50);
    console.log('50 个 Hero 需要 SoulShard:', hre.ethers.formatEther(heroSoulNeed50), 'SOUL');
    
    console.log('\n🎉 设置完成！');
    console.log('💡 现在铸造只需要 BNB 支付 VRF 费用 (0.005 BNB)');
    console.log('💡 不再需要 SoulShard 代币授权或余额');
    console.log('💡 可以立即在前端测试铸造功能');
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log('🔍 調試 Oracle 和 SoulShard 計算');
  console.log('==============================\n');
  
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  const dungeonCore = await hre.ethers.getContractAt('DungeonCore', '0x8a2D2b1961135127228EdD71Ff98d6B097915a13');
  
  try {
    // 1. 檢查 Hero 合約狀態
    const mintPriceUSD = await hero.mintPriceUSD();
    console.log('1️⃣ Hero 合約狀態:');
    console.log('   mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD');
    
    // 2. 檢查 Oracle 計算
    console.log('\n2️⃣ Oracle 計算測試:');
    
    // 測試 0 USD
    const soulShardFor0USD = await dungeonCore.getSoulShardAmountForUSD(0);
    console.log('   0 USD =', hre.ethers.formatEther(soulShardFor0USD), 'SoulShard');
    
    // 測試當前設定
    const soulShardForCurrent = await dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
    console.log('   當前 mintPriceUSD =', hre.ethers.formatEther(soulShardForCurrent), 'SoulShard');
    
    // 3. 檢查 Hero 的計算
    console.log('\n3️⃣ Hero getRequiredSoulShardAmount 測試:');
    for (let qty of [1, 5, 10, 50]) {
      const required = await hero.getRequiredSoulShardAmount(qty);
      console.log(`   ${qty} heroes:`, hre.ethers.formatEther(required), 'SoulShard');
    }
    
    console.log('\n4️⃣ 問題分析:');
    if (soulShardFor0USD > 0n) {
      console.log('🚨 Oracle 問題：即使 0 USD 也返回非零 SoulShard');
      console.log('   可能的原因：Oracle 內部有最小值或計算錯誤');
    } else {
      console.log('✅ Oracle 計算正確：0 USD = 0 SoulShard');
    }
    
  } catch (error) {
    console.error('❌ 調試失敗:', error.message);
    console.error('Stack:', error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
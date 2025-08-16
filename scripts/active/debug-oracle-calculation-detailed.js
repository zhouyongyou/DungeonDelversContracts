const hre = require("hardhat");

async function main() {
  console.log('🔍 詳細調試 Oracle 計算問題');
  console.log('============================\n');
  
  const dungeonCoreAddress = '0x8a2D2b1961135127228EdD71Ff98d6B097915a13';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  
  const dungeonCore = await hre.ethers.getContractAt('DungeonCore', dungeonCoreAddress);
  const hero = await hre.ethers.getContractAt('Hero', heroAddress);
  
  console.log('🔍 1. 檢查基礎設定:');
  const mintPriceUSD = await hero.mintPriceUSD();
  console.log('Hero mintPriceUSD:', mintPriceUSD.toString(), 'wei');
  console.log('Hero mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD (格式化)');
  
  console.log('\n🔍 2. 測試不同數量的 USD 轉換:');
  const testAmounts = [
    hre.ethers.parseEther('1'),      // 1 USD
    hre.ethers.parseEther('2'),      // 2 USD  
    hre.ethers.parseEther('100'),    // 100 USD
    mintPriceUSD                     // Hero 設定的價格
  ];
  
  for (let i = 0; i < testAmounts.length; i++) {
    const usdAmount = testAmounts[i];
    try {
      console.log(`\n測試 ${hre.ethers.formatEther(usdAmount)} USD:`);
      
      const soulAmount = await dungeonCore.getSoulShardAmountForUSD(usdAmount);
      console.log('  結果:', soulAmount.toString(), 'wei');
      console.log('  結果:', hre.ethers.formatEther(soulAmount), 'SOUL');
      
      // 計算每 USD 需要多少 SOUL
      const usdInEther = Number(hre.ethers.formatEther(usdAmount));
      const soulInEther = Number(hre.ethers.formatEther(soulAmount));
      const soulPerUSD = soulInEther / usdInEther;
      
      console.log('  每 USD 需要:', soulPerUSD.toFixed(2), 'SOUL');
      
      // 檢查是否有異常大的數字
      if (soulInEther > 1e20) {
        console.log('  🚨 異常！數值過大，可能有精度問題');
      }
      
    } catch (error) {
      console.log('  ❌ 錯誤:', error.message);
    }
  }
  
  console.log('\n🔍 3. 直接測試 Hero 合約的計算:');
  for (let qty of [1, 10, 50]) {
    try {
      const result = await hero.getRequiredSoulShardAmount(qty);
      console.log(`${qty} 個 Hero:`, hre.ethers.formatEther(result), 'SOUL');
      
      const perUnit = Number(hre.ethers.formatEther(result)) / qty;
      console.log(`  每個:`, perUnit.toFixed(2), 'SOUL');
      
      if (perUnit > 1e15) {
        console.log('  🚨 單價異常高！');
      }
      
    } catch (error) {
      console.log(`${qty} 個 Hero: ❌`, error.message);
    }
  }
  
  console.log('\n🔍 4. 檢查 Oracle 內部狀態:');
  try {
    // 假設 Oracle 有 getSoulShardPriceUSD 函數
    const oracleAddress = await dungeonCore.oracleContract();
    console.log('Oracle 地址:', oracleAddress);
    
    if (oracleAddress !== '0x0000000000000000000000000000000000000000') {
      const oracle = await hre.ethers.getContractAt('Oracle', oracleAddress);
      
      try {
        const soulPriceUSD = await oracle.getSoulShardPriceUSD();
        console.log('SOUL 價格 (USD):', hre.ethers.formatEther(soulPriceUSD));
        
        // 手動計算預期結果
        const expectedSoulFor2USD = (2 * 1e18) / Number(soulPriceUSD);
        console.log('預期 2 USD 需要 SOUL:', expectedSoulFor2USD);
        
      } catch (err) {
        console.log('無法獲取 SOUL 價格:', err.message);
      }
    }
    
  } catch (error) {
    console.log('Oracle 檢查失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// 診斷鑄造價格問題
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 鑄造價格診斷腳本 ===\n");
  
  // 合約地址（V18）
  const addresses = {
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    oracle: "0x1Cd2FBa6f4614383C32f4807f67f059eF4Dbfd0c",
    usdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
  
  // 連接合約
  const hero = await ethers.getContractAt("Hero", addresses.hero);
  const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", addresses.dungeonCore);
  const oracle = await ethers.getContractAt("contracts/defi/Oracle_VerificationFix.sol:Oracle", addresses.oracle);
  
  console.log("=== 1. Hero mintPriceUSD 檢查 ===");
  const mintPriceUSD = await hero.mintPriceUSD();
  console.log(`mintPriceUSD: ${mintPriceUSD.toString()}`);
  console.log(`格式化: ${ethers.formatEther(mintPriceUSD)} USD`);
  console.log(`預期: 2e18 (2 USD)`);
  
  console.log("\n=== 2. DungeonCore 設置檢查 ===");
  const oracleAddress = await dungeonCore.oracleAddress();
  const usdTokenAddress = await dungeonCore.usdTokenAddress();
  const usdDecimals = await dungeonCore.usdDecimals();
  console.log(`Oracle 地址: ${oracleAddress}`);
  console.log(`USD Token 地址: ${usdTokenAddress}`);
  console.log(`USD Decimals: ${usdDecimals}`);
  
  console.log("\n=== 3. 測試價格計算鏈 ===");
  
  // 測試 DungeonCore.getSoulShardAmountForUSD
  console.log("\n3.1 DungeonCore.getSoulShardAmountForUSD 測試:");
  const testAmounts = [
    ethers.parseEther("1"),   // 1 USD
    ethers.parseEther("2"),   // 2 USD
    ethers.parseEther("10")   // 10 USD
  ];
  
  for (const amount of testAmounts) {
    try {
      const soulAmount = await dungeonCore.getSoulShardAmountForUSD(amount);
      console.log(`${ethers.formatEther(amount)} USD = ${ethers.formatEther(soulAmount)} SOUL`);
    } catch (error) {
      console.error(`錯誤: ${error.message}`);
    }
  }
  
  // 測試 Hero.getRequiredSoulShardAmount
  console.log("\n3.2 Hero.getRequiredSoulShardAmount 測試:");
  const quantities = [1, 5, 10];
  
  for (const qty of quantities) {
    try {
      const requiredAmount = await hero.getRequiredSoulShardAmount(qty);
      const perUnit = Number(ethers.formatEther(requiredAmount)) / qty;
      console.log(`數量 ${qty}: ${ethers.formatEther(requiredAmount)} SOUL (單價: ${perUnit.toFixed(2)} SOUL)`);
      
      if (perUnit > 100000) {
        console.log(`⚠️  價格異常！預期約 33000 SOUL，實際: ${perUnit.toFixed(2)} SOUL`);
      }
    } catch (error) {
      console.error(`錯誤: ${error.message}`);
    }
  }
  
  // 直接測試 Oracle
  console.log("\n3.3 Oracle.getAmountOut 直接測試:");
  const directAmounts = [
    ethers.parseEther("2"),    // 2 USD (mintPriceUSD)
    ethers.parseEther("1"),    // 1 USD
    ethers.parseEther("10")    // 10 USD
  ];
  
  for (const amount of directAmounts) {
    try {
      const soulAmount = await oracle.getAmountOut(addresses.usdToken, amount);
      console.log(`Oracle: ${ethers.formatEther(amount)} USD = ${ethers.formatEther(soulAmount)} SOUL`);
    } catch (error) {
      console.error(`錯誤: ${error.message}`);
    }
  }
  
  // 分析計算步驟
  console.log("\n=== 4. 計算步驟分析 ===");
  console.log("Hero.getRequiredSoulShardAmount(1) 執行流程:");
  console.log("1. 獲取 mintPriceUSD = 2e18");
  console.log("2. 調用 dungeonCore.getSoulShardAmountForUSD(2e18)");
  console.log("3. DungeonCore 內部:");
  console.log(`   - scaledAmount = (2e18 * 10^${usdDecimals}) / 10^18`);
  console.log(`   - 如果 usdDecimals = 18: scaledAmount = 2e18`);
  console.log("4. 調用 oracle.getAmountOut(usdToken, scaledAmount)");
  console.log("5. Oracle 返回 SOUL 數量");
  
  // 診斷結論
  console.log("\n=== 5. 診斷結論 ===");
  const testHeroPrice = await hero.getRequiredSoulShardAmount(1);
  const testCorePrice = await dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
  
  console.log(`Hero 返回: ${ethers.formatEther(testHeroPrice)} SOUL`);
  console.log(`Core 返回: ${ethers.formatEther(testCorePrice)} SOUL`);
  
  if (testHeroPrice.toString() === testCorePrice.toString()) {
    console.log("✅ Hero 和 DungeonCore 計算一致");
  } else {
    console.log("❌ Hero 和 DungeonCore 計算不一致！");
  }
  
  const adminTestPrice = await dungeonCore.getSoulShardAmountForUSD(ethers.parseEther("10"));
  console.log(`\nAdmin 頁面測試 (10 USD): ${ethers.formatEther(adminTestPrice)} SOUL`);
  console.log("如果 Admin 顯示正常但 Hero 異常，問題可能在 mintPriceUSD 設置");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
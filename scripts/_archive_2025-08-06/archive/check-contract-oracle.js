// 檢查 Hero/Relic 合約的 Oracle 配置
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 檢查合約 Oracle 配置 ===\n");
  
  const contracts = {
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C",
    newOracle: "0xfaA414B9C38419D3cc31E0173697E9f43de40d1C",
    oldOracle: "0x1Cd2FBa6f4614383C32f4807f67f059eF4Dbfd0c"
  };
  
  // 檢查 DungeonCore 的 Oracle
  const dungeonCore = await ethers.getContractAt([
    "function oracle() view returns (address)",
    "function getSoulShardAmountForUSD(uint256) view returns (uint256)"
  ], contracts.dungeonCore);
  
  const currentOracle = await dungeonCore.oracle();
  console.log("DungeonCore 當前 Oracle:", currentOracle);
  console.log("是否使用新 Oracle:", currentOracle === contracts.newOracle ? "✅ 是" : "❌ 否");
  
  // 測試 DungeonCore 的價格計算
  try {
    const usdAmount = ethers.parseEther("2");
    const soulAmount = await dungeonCore.getSoulShardAmountForUSD(usdAmount);
    console.log("\nDungeonCore 價格測試:");
    console.log("2 USD =", ethers.formatEther(soulAmount), "SOUL");
  } catch (error) {
    console.error("DungeonCore 價格測試失敗:", error.message);
  }
  
  // 檢查 Hero 合約
  console.log("\n=== 檢查 Hero 合約 ===");
  const hero = await ethers.getContractAt([
    "function dungeonCore() view returns (address)",
    "function mintPriceUSD() view returns (uint256)",
    "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
  ], contracts.hero);
  
  const heroDungeonCore = await hero.dungeonCore();
  const heroMintPrice = await hero.mintPriceUSD();
  console.log("Hero DungeonCore:", heroDungeonCore);
  console.log("Hero mintPriceUSD:", ethers.formatEther(heroMintPrice), "USD");
  
  try {
    const heroRequiredSoul = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格: ✅", ethers.formatEther(heroRequiredSoul), "SOUL");
  } catch (error) {
    console.error("Hero 價格查詢失敗: ❌", error.message);
    
    // 如果是 Unsupported token 錯誤，說明 Oracle 中的 USD 地址不匹配
    if (error.message.includes("Unsupported token")) {
      console.log("\n問題診斷：");
      console.log("Hero 通過 DungeonCore 調用 Oracle，但 Oracle 不認識傳入的 USD token 地址");
      console.log("這表示 Hero/Relic 合約內部可能有硬編碼的 USD 地址");
    }
  }
  
  // 檢查 Relic 合約
  console.log("\n=== 檢查 Relic 合約 ===");
  const relic = await ethers.getContractAt([
    "function dungeonCore() view returns (address)",
    "function mintPriceUSD() view returns (uint256)",
    "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
  ], contracts.relic);
  
  const relicDungeonCore = await relic.dungeonCore();
  const relicMintPrice = await relic.mintPriceUSD();
  console.log("Relic DungeonCore:", relicDungeonCore);
  console.log("Relic mintPriceUSD:", ethers.formatEther(relicMintPrice), "USD");
  
  try {
    const relicRequiredSoul = await relic.getRequiredSoulShardAmount(1);
    console.log("Relic 鑄造價格: ✅", ethers.formatEther(relicRequiredSoul), "SOUL");
  } catch (error) {
    console.error("Relic 價格查詢失敗: ❌", error.message);
  }
  
  // 檢查新舊 Oracle 的配置
  console.log("\n=== Oracle 配置對比 ===");
  
  // 新 Oracle
  const newOracle = await ethers.getContractAt([
    "function usdToken() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function poolAddress() view returns (address)"
  ], contracts.newOracle);
  
  console.log("\n新 Oracle 配置:");
  console.log("- USD Token:", await newOracle.usdToken());
  console.log("- SoulShard:", await newOracle.soulShardToken());
  console.log("- Pool:", await newOracle.poolAddress());
  
  // 舊 Oracle
  const oldOracle = await ethers.getContractAt([
    "function usdToken() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function poolAddress() view returns (address)"
  ], contracts.oldOracle);
  
  console.log("\n舊 Oracle 配置:");
  console.log("- USD Token:", await oldOracle.usdToken());
  console.log("- SoulShard:", await oldOracle.soulShardToken());
  console.log("- Pool:", await oldOracle.poolAddress());
  
  console.log("\n=== 建議解決方案 ===");
  console.log("1. 問題原因：Hero/Relic 合約可能硬編碼了舊的 USD 地址");
  console.log("2. 臨時方案：切換回 MockOracle (0x5e03a0770DA629bD328A9663a79D084E43D448d4)");
  console.log("3. 永久方案：重新部署 Hero/Relic 合約使用正確的 USD 地址");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
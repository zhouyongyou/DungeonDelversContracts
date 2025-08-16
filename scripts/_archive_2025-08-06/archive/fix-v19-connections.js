// 修復 V19 部署的連接問題
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復 V19 連接 ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("操作者:", deployer.address);
  
  const addresses = {
    oracle: "0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9",
    dungeonCore: "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9",
    hero: "0x141F081922D4015b3157cdA6eE970dff34bb8AAb",
    relic: "0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
  
  // 獲取 DungeonCore 合約
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  console.log("設置 Oracle...");
  try {
    const tx1 = await dungeonCore.setOracle(addresses.oracle);
    await tx1.wait();
    console.log("✅ Oracle 設置成功");
  } catch (error) {
    console.log("Oracle 設置失敗:", error.message);
  }
  
  console.log("\n設置 Hero 合約...");
  try {
    const tx2 = await dungeonCore.setHeroContract(addresses.hero);
    await tx2.wait();
    console.log("✅ Hero 設置成功");
  } catch (error) {
    console.log("Hero 設置失敗:", error.message);
  }
  
  console.log("\n設置 Relic 合約...");
  try {
    const tx3 = await dungeonCore.setRelicContract(addresses.relic);
    await tx3.wait();
    console.log("✅ Relic 設置成功");
  } catch (error) {
    console.log("Relic 設置失敗:", error.message);
  }
  
  // 設置 Hero 和 Relic 的 DungeonCore
  console.log("\n設置 Hero 的 DungeonCore...");
  const hero = await ethers.getContractAt("contracts/nft/Hero.sol:Hero", addresses.hero);
  try {
    const tx4 = await hero.setDungeonCore(addresses.dungeonCore);
    await tx4.wait();
    console.log("✅ Hero DungeonCore 設置成功");
  } catch (error) {
    console.log("Hero DungeonCore 設置失敗:", error.message);
  }
  
  console.log("\n設置 Relic 的 DungeonCore...");
  const relic = await ethers.getContractAt("contracts/nft/Relic.sol:Relic", addresses.relic);
  try {
    const tx5 = await relic.setDungeonCore(addresses.dungeonCore);
    await tx5.wait();
    console.log("✅ Relic DungeonCore 設置成功");
  } catch (error) {
    console.log("Relic DungeonCore 設置失敗:", error.message);
  }
  
  // 設置 Hero 和 Relic 的 SoulShard Token
  console.log("\n設置 Hero 的 SoulShard Token...");
  try {
    const tx6 = await hero.setSoulShardToken(addresses.soulShard);
    await tx6.wait();
    console.log("✅ Hero SoulShard 設置成功");
  } catch (error) {
    console.log("Hero SoulShard 設置失敗:", error.message);
  }
  
  console.log("\n設置 Relic 的 SoulShard Token...");
  try {
    const tx7 = await relic.setSoulShardToken(addresses.soulShard);
    await tx7.wait();
    console.log("✅ Relic SoulShard 設置成功");
  } catch (error) {
    console.log("Relic SoulShard 設置失敗:", error.message);
  }
  
  // 測試價格
  console.log("\n=== 測試價格 ===");
  
  try {
    const heroPrice = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格:", ethers.formatEther(heroPrice), "SOUL");
  } catch (error) {
    console.error("Hero 價格測試失敗:", error.message);
  }
  
  try {
    const relicPrice = await relic.getRequiredSoulShardAmount(1);
    console.log("Relic 鑄造價格:", ethers.formatEther(relicPrice), "SOUL");
  } catch (error) {
    console.error("Relic 價格測試失敗:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
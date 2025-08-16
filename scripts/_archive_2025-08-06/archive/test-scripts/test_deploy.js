// 簡單的測試部署腳本
const hre = require("hardhat");

async function main() {
  console.log("🚀 Testing deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  
  // 測試部署 SoulShard
  console.log("\n📦 Deploying SoulShard...");
  const SoulShard = await ethers.getContractFactory("Test_SoulShard");
  const soulShard = await SoulShard.deploy(deployer.address);
  await soulShard.waitForDeployment();
  console.log("✅ SoulShard deployed at:", await soulShard.getAddress());
  
  // 測試部署 Oracle
  console.log("\n📦 Deploying Oracle...");
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(
    "0x737c5b0430d5aeb104680460179aaa38608b6169", // POOL_ADDRESS
    await soulShard.getAddress(), // SoulShard token
    "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"  // USD_TOKEN_ADDRESS
  );
  await oracle.waitForDeployment();
  console.log("✅ Oracle deployed at:", await oracle.getAddress());
  
  // 測試部署 DungeonMasterV7
  console.log("\n📦 Deploying DungeonMasterV7...");
  const DungeonMasterV7 = await ethers.getContractFactory("DungeonMasterV7");
  const dungeonMasterV7 = await DungeonMasterV7.deploy(deployer.address);
  await dungeonMasterV7.waitForDeployment();
  console.log("✅ DungeonMasterV7 deployed at:", await dungeonMasterV7.getAddress());
  
  // 測試部署 PartyV3
  console.log("\n📦 Deploying PartyV3...");
  const PartyV3 = await ethers.getContractFactory("PartyV3");
  const partyV3 = await PartyV3.deploy(deployer.address);
  await partyV3.waitForDeployment();
  console.log("✅ PartyV3 deployed at:", await partyV3.getAddress());
  
  console.log("\n🎉 Test deployment successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
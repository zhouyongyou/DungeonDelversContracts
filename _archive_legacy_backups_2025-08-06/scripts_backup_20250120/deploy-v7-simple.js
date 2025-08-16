const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 部署 DungeonMasterV7 和 PartyV3...");

  // 獲取部署者
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);

  // 獲取當前區塊號
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log("📊 當前區塊號:", currentBlock);

  // 部署 PartyV3
  console.log("\n📦 部署 PartyV3...");
  const PartyV3 = await hre.ethers.getContractFactory("PartyV3");
  const partyV3 = await PartyV3.deploy(deployer.address);
  await partyV3.waitForDeployment();

  const partyV3Address = await partyV3.getAddress();
  console.log("✅ PartyV3 已部署至:", partyV3Address);

  // 部署 DungeonMasterV7
  console.log("\n📦 部署 DungeonMasterV7...");
  const DungeonMasterV7 = await hre.ethers.getContractFactory("DungeonMasterV7");
  const dungeonMasterV7 = await DungeonMasterV7.deploy(deployer.address);
  await dungeonMasterV7.waitForDeployment();

  const dungeonMasterV7Address = await dungeonMasterV7.getAddress();
  console.log("✅ DungeonMasterV7 已部署至:", dungeonMasterV7Address);

  // 從 .env 讀取現有合約地址
  const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
  const dungeonStorageAddress = process.env.DUNGEONSTORAGE_ADDRESS;
  const soulShardAddress = process.env.SOUL_SHARD_TOKEN_ADDRESS;
  const heroAddress = process.env.HERO_ADDRESS;
  const relicAddress = process.env.RELIC_ADDRESS;

  console.log("\n🔧 設定 PartyV3 參數...");
  
  // 設定 PartyV3 的合約連接
  if (dungeonCoreAddress) {
    await partyV3.setDungeonCore(dungeonCoreAddress);
    console.log("✅ PartyV3 已設定 DungeonCore:", dungeonCoreAddress);
  }

  if (heroAddress) {
    await partyV3.setHeroContract(heroAddress);
    console.log("✅ PartyV3 已設定 Hero Contract:", heroAddress);
  }

  if (relicAddress) {
    await partyV3.setRelicContract(relicAddress);
    console.log("✅ PartyV3 已設定 Relic Contract:", relicAddress);
  }

  console.log("\n🔧 設定 DungeonMasterV7 參數...");
  
  // 設定 DungeonMasterV7 的合約連接
  if (dungeonCoreAddress) {
    await dungeonMasterV7.setDungeonCore(dungeonCoreAddress);
    console.log("✅ DungeonMasterV7 已設定 DungeonCore:", dungeonCoreAddress);
  }

  if (dungeonStorageAddress) {
    await dungeonMasterV7.setDungeonStorage(dungeonStorageAddress);
    console.log("✅ DungeonMasterV7 已設定 DungeonStorage:", dungeonStorageAddress);
  }

  if (soulShardAddress) {
    await dungeonMasterV7.setSoulShardToken(soulShardAddress);
    console.log("✅ DungeonMasterV7 已設定 SoulShard Token:", soulShardAddress);
  }

  // 更新 DungeonCore 中的 Party 合約地址
  if (dungeonCoreAddress) {
    console.log("\n🔧 更新 DungeonCore 中的 Party 合約地址...");
    const DungeonCore = await hre.ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    await DungeonCore.setPartyContract(partyV3Address);
    console.log("✅ DungeonCore 已更新 Party 合約地址:", partyV3Address);
  }

  // 創建部署記錄
  const deploymentRecord = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    blockNumber: currentBlock,
    contracts: {
      PartyV3: partyV3Address,
      DungeonMasterV7: dungeonMasterV7Address
    },
    gasUsed: {
      PartyV3: (await partyV3.deploymentTransaction()).gasLimit?.toString(),
      DungeonMasterV7: (await dungeonMasterV7.deploymentTransaction()).gasLimit?.toString()
    }
  };

  // 保存部署記錄
  const recordPath = path.join(__dirname, "..", "DEPLOYMENT_RECORDS", `v7-deployment-${Date.now()}.json`);
  const recordDir = path.dirname(recordPath);
  
  if (!fs.existsSync(recordDir)) {
    fs.mkdirSync(recordDir, { recursive: true });
  }
  
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
  
  console.log("\n📝 部署記錄已保存至:", recordPath);
  
  console.log("\n🎉 部署完成！");
  console.log("=".repeat(60));
  console.log("📋 新合約地址:");
  console.log(`PartyV3: ${partyV3Address}`);
  console.log(`DungeonMasterV7: ${dungeonMasterV7Address}`);
  console.log("=".repeat(60));
  
  console.log("\n⚡ 下一步:");
  console.log("1. 更新 .env 文件中的合約地址");
  console.log("2. 驗證合約");
  console.log("3. 更新前端、後端、子圖配置");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失敗:", error);
    process.exit(1);
  });
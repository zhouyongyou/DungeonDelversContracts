const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 部署 DungeonMasterV5...");

  // 獲取部署者
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);

  // 獲取當前區塊號
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  console.log("📊 當前區塊號:", currentBlock);

  // 部署 DungeonMasterV5
  const DungeonMasterV5 = await hre.ethers.getContractFactory("DungeonMasterV5");
  const dungeonMasterV5 = await DungeonMasterV5.deploy(deployer.address);
  await dungeonMasterV5.waitForDeployment();

  const dungeonMasterAddress = await dungeonMasterV5.getAddress();
  console.log("✅ DungeonMasterV5 已部署至:", dungeonMasterAddress);

  // 從 .env 讀取現有合約地址
  const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
  const dungeonStorageAddress = process.env.DUNGEONSTORAGE_ADDRESS;
  const soulShardAddress = process.env.SOUL_SHARD_TOKEN_ADDRESS;

  console.log("\n🔧 設定 DungeonMasterV5 參數...");
  
  // 設定 DungeonCore
  if (dungeonCoreAddress) {
    await dungeonMasterV5.setDungeonCore(dungeonCoreAddress);
    console.log("✅ 已設定 DungeonCore:", dungeonCoreAddress);
  }

  // 設定 DungeonStorage
  if (dungeonStorageAddress) {
    await dungeonMasterV5.setDungeonStorage(dungeonStorageAddress);
    console.log("✅ 已設定 DungeonStorage:", dungeonStorageAddress);
  }

  // 設定 SoulShard Token
  if (soulShardAddress) {
    await dungeonMasterV5.setSoulShardToken(soulShardAddress);
    console.log("✅ 已設定 SoulShard Token:", soulShardAddress);
  }

  // 創建部署記錄
  const deploymentRecord = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployedBy: deployer.address,
    startBlock: currentBlock,
    contracts: {
      DungeonMasterV5: dungeonMasterAddress
    },
    configuration: {
      dungeonCore: dungeonCoreAddress || "未設定",
      dungeonStorage: dungeonStorageAddress || "未設定",
      soulShardToken: soulShardAddress || "未設定"
    }
  };

  // 保存部署記錄
  const recordPath = path.join(__dirname, `../DEPLOYMENT_RECORD_DungeonMasterV5_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
  console.log("\n📄 部署記錄已保存至:", recordPath);

  // 顯示下一步指示
  console.log("\n⚡ 下一步行動:");
  console.log("1. 更新 .env 文件:");
  console.log(`   DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`);
  console.log("\n2. 在 DungeonCore 更新 DungeonMaster 地址:");
  console.log(`   npx hardhat run scripts/update-dungeoncore.js --network ${hre.network.name}`);
  console.log("\n3. 更新前端配置 (contracts.ts)");
  console.log("\n4. 更新子圖配置 (subgraph.yaml) - 使用區塊號:", currentBlock);
  console.log("\n5. 更新後端環境變數");
  console.log("\n6. 驗證合約:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${dungeonMasterAddress} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
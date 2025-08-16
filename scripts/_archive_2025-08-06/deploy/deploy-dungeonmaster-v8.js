const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 部署 DungeonMaster V8...\n");

  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 重要地址
  const addresses = {
    dungeonCore: "0xd03d3D7456ba3B52E6E0112eBc2494dB1cB34524",
    dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
    soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    dungeonMasterWallet: "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
  };

  // 部署 DungeonMasterV8
  console.log("📦 部署 DungeonMaster V8...");
  const DungeonMasterV8 = await ethers.getContractFactory("DungeonMasterV8");
  const dungeonMasterV8 = await DungeonMasterV8.deploy(addresses.dungeonMasterWallet);
  await dungeonMasterV8.waitForDeployment();
  const dungeonMasterV8Address = await dungeonMasterV8.getAddress();
  console.log("✅ DungeonMasterV8 部署於:", dungeonMasterV8Address);

  // 等待區塊確認
  console.log("\n⏳ 等待區塊確認...");
  await dungeonMasterV8.deploymentTransaction().wait(5);

  // 設定合約連接
  console.log("\n🔧 設定合約連接...");
  
  // 1. 設定 DungeonCore
  console.log("- 設定 DungeonCore...");
  let tx = await dungeonMasterV8.setDungeonCore(addresses.dungeonCore);
  await tx.wait();
  console.log("✅ DungeonCore 已設定");

  // 2. 設定 DungeonStorage
  console.log("- 設定 DungeonStorage...");
  tx = await dungeonMasterV8.setDungeonStorage(addresses.dungeonStorage);
  await tx.wait();
  console.log("✅ DungeonStorage 已設定");

  // 3. 設定 SoulShard Token
  console.log("- 設定 SoulShard Token...");
  tx = await dungeonMasterV8.setSoulShardToken(addresses.soulShard);
  await tx.wait();
  console.log("✅ SoulShard Token 已設定");

  // 更新 DungeonStorage 的授權
  console.log("\n🔐 更新 DungeonStorage 授權...");
  const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.dungeonStorage);
  tx = await dungeonStorage.setLogicContract(dungeonMasterV8Address);
  await tx.wait();
  console.log("✅ DungeonStorage 已授權給 DungeonMasterV8");

  // 保存部署記錄
  const deploymentRecord = {
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    contracts: {
      DungeonMasterV8: dungeonMasterV8Address
    },
    configuration: {
      dungeonCore: addresses.dungeonCore,
      dungeonStorage: addresses.dungeonStorage,
      soulShard: addresses.soulShard,
      owner: addresses.dungeonMasterWallet
    }
  };

  const recordPath = path.join(__dirname, `../../DEPLOYMENT_RECORD_V8_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
  console.log(`\n📄 部署記錄已保存至: ${recordPath}`);

  // 顯示下一步操作
  console.log("\n📋 下一步操作：");
  console.log("1. 運行診斷腳本檢查問題:");
  console.log("   npx hardhat run scripts/diagnose-experience-issue.js --network bsc");
  console.log("\n2. 更新 DungeonCore 中的 DungeonMaster 地址:");
  console.log("   npx hardhat run scripts/fix-dungeonmaster-registration.js --network bsc");
  console.log("\n3. 驗證合約:");
  console.log(`   npx hardhat verify --network bsc ${dungeonMasterV8Address} "${addresses.dungeonMasterWallet}"`);
  console.log("\n4. 更新前端配置:");
  console.log("   - src/config/contracts.ts");
  console.log("   - Vercel 環境變數");
  console.log("\n5. 更新後端配置:");
  console.log("   - Render 環境變數");
  console.log("\n6. 更新子圖:");
  console.log("   - subgraph.yaml");
  console.log("   - 重新部署子圖");

  console.log("\n✅ DungeonMasterV8 部署完成！");
  console.log("合約地址:", dungeonMasterV8Address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
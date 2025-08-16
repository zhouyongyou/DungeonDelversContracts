const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 部署 DungeonDelvers V6 系統...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 帳戶餘額:", hre.ethers.formatEther(balance), "BNB\n");

  // 記錄部署資訊
  const deployment = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    contracts: {}
  };

  try {
    // 1. 部署 Party
    console.log("📦 部署 Party...");
    const Party = await hre.ethers.getContractFactory("Party");
    const baseURI = process.env.VITE_METADATA_SERVER_URL || "https://dungeon-delvers-metadata-server.onrender.com";
    const partyV3 = await Party.deploy(
      deployer.address,
      `${baseURI}/api/party/`
    );
    await partyV3.waitForDeployment();
    const partyV3Address = await partyV3.getAddress();
    console.log("✅ Party 部署至:", partyV3Address);
    deployment.contracts.Party = partyV3Address;

    // 2. 部署 DungeonMasterV6
    console.log("\n📦 部署 DungeonMasterV6...");
    const DungeonMasterV6 = await hre.ethers.getContractFactory("DungeonMasterV6");
    const dungeonMasterV6 = await DungeonMasterV6.deploy(deployer.address);
    await dungeonMasterV6.waitForDeployment();
    const dungeonMasterV6Address = await dungeonMasterV6.getAddress();
    console.log("✅ DungeonMasterV6 部署至:", dungeonMasterV6Address);
    deployment.contracts.DungeonMasterV6 = dungeonMasterV6Address;

    // 3. 設定 DungeonCore（如果地址已知）
    const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
    if (dungeonCoreAddress) {
      console.log("\n🔧 設定 DungeonCore 連接...");
      
      // Party 設定
      await partyV3.setDungeonCore(dungeonCoreAddress);
      console.log("✅ Party 已連接 DungeonCore");
      
      // DungeonMasterV6 設定
      await dungeonMasterV6.setDungeonCore(dungeonCoreAddress);
      console.log("✅ DungeonMasterV6 已連接 DungeonCore");
      
      // 設定其他必要合約
      const dungeonStorageAddress = process.env.DUNGEONSTORAGE_ADDRESS;
      const soulShardAddress = process.env.SOUL_SHARD_TOKEN_ADDRESS;
      
      if (dungeonStorageAddress) {
        await dungeonMasterV6.setDungeonStorage(dungeonStorageAddress);
        console.log("✅ DungeonStorage 已設定");
      }
      
      if (soulShardAddress) {
        await dungeonMasterV6.setSoulShardToken(soulShardAddress);
        console.log("✅ SoulShard Token 已設定");
      }
    }

    // 4. 儲存部署記錄
    const deploymentPath = path.join(
      __dirname,
      `../deployments/V6_deployment_${hre.network.name}_${Date.now()}.json`
    );
    
    // 確保目錄存在
    const dir = path.dirname(deploymentPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("\n📄 部署記錄已保存:", deploymentPath);

    // 5. 顯示下一步指示
    console.log("\n" + "=".repeat(60));
    console.log("🎉 V6 系統部署完成！");
    console.log("=".repeat(60));
    
    console.log("\n📋 下一步行動：\n");
    
    console.log("1. 更新環境變數:");
    console.log(`   PARTY_ADDRESS=${partyV3Address}`);
    console.log(`   DUNGEONMASTER_ADDRESS=${dungeonMasterV6Address}`);
    
    console.log("\n2. 在 DungeonCore 更新合約地址:");
    console.log("   ```");
    console.log("   await dungeonCore.setModule('Party', '" + partyV3Address + "');");
    console.log("   await dungeonCore.setModule('DungeonMaster', '" + dungeonMasterV6Address + "');");
    console.log("   ```");
    
    console.log("\n3. 驗證合約:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${partyV3Address} ${deployer.address} "${baseURI}/api/party/"`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${dungeonMasterV6Address} ${deployer.address}`);
    
    console.log("\n4. 更新前端配置 (contracts.ts)");
    console.log("\n5. 更新子圖配置 (subgraph.yaml)");
    console.log("\n6. 測試核心功能:");
    console.log("   - 創建隊伍");
    console.log("   - 查詢戰力 (getPower)");
    console.log("   - 開始探險");
    console.log("   - 完成探險");
    
    // 6. 生成 ABI 文件
    console.log("\n📁 生成 ABI 文件...");
    const contractsDir = path.join(__dirname, "../artifacts/contracts");
    
    // Party ABI
    const partyV3Artifact = JSON.parse(
      fs.readFileSync(
        path.join(contractsDir, "Party.sol/Party.json"),
        "utf8"
      )
    );
    fs.writeFileSync(
      path.join(__dirname, "../abis/Party.json"),
      JSON.stringify(partyV3Artifact.abi, null, 2)
    );
    
    // DungeonMasterV6 ABI
    const dmV6Artifact = JSON.parse(
      fs.readFileSync(
        path.join(contractsDir, "DungeonMasterV6.sol/DungeonMasterV6.json"),
        "utf8"
      )
    );
    fs.writeFileSync(
      path.join(__dirname, "../abis/DungeonMasterV6.json"),
      JSON.stringify(dmV6Artifact.abi, null, 2)
    );
    
    console.log("✅ ABI 文件已生成到 abis/ 目錄");
    
  } catch (error) {
    console.error("\n❌ 部署失敗:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
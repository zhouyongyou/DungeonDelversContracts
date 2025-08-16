// deployEventStore.js - Deploy EventStore contract

const hre = require("hardhat");

async function main() {
  console.log("🚀 開始部署 EventStore 合約...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 部署者地址: ${deployer.address}`);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 賬戶餘額: ${hre.ethers.formatEther(balance)} BNB`);
  
  // Deploy EventStore
  console.log("\n📦 部署 EventStore...");
  const EventStore = await hre.ethers.getContractFactory("EventStore");
  const eventStore = await EventStore.deploy();
  await eventStore.waitForDeployment();
  
  const eventStoreAddress = await eventStore.getAddress();
  const deployTx = eventStore.deploymentTransaction();
  
  console.log(`✅ EventStore 部署成功！`);
  console.log(`📍 合約地址: ${eventStoreAddress}`);
  console.log(`🔗 交易哈希: ${deployTx.hash}`);
  
  // Wait for confirmations
  console.log("\n⏳ 等待區塊確認...");
  await deployTx.wait(5);
  console.log("✅ 已確認 5 個區塊");
  
  // Grant roles to existing contracts (if needed)
  console.log("\n🔐 設定權限...");
  const EMITTER_ROLE = await eventStore.EMITTER_ROLE();
  
  // 這些地址來自最新的 V2 部署
  const contracts = {
    DungeonMaster: "0xd13250E0F0766006816d7AfE95EaEEc5e215d082",
    Hero: "0xB882915F4fD4C3773e0E8eeBB65088CB584A0Bdf",
    Relic: "0x41cb97b903547C4190D66E818A64b7b37DE005c0",
    Party: "0x075F68Ab40A55CB4341A7dF5CFdB873696502dd0",
    PlayerProfile: "0x7f5D359bC65F0aB07f7A874C2efF72752Fb294e5",
    VIPStaking: "0x8D7Eb405247C9AD0373D398C5F63E88421ba7b49"
  };
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`授予 ${name} (${address}) EMITTER_ROLE...`);
      const tx = await eventStore.grantRole(EMITTER_ROLE, address);
      await tx.wait();
      console.log(`✅ 成功授予 ${name} 權限`);
    } catch (error) {
      console.log(`⚠️  授予 ${name} 權限失敗: ${error.message}`);
    }
  }
  
  // Register additional event types
  console.log("\n📝 註冊額外事件類型...");
  const additionalEventTypes = [
    { name: "ExpeditionRequested", version: 1 },
    { name: "ExpeditionStarted", version: 1 },
    { name: "ExpeditionCompleted", version: 1 },
    { name: "RewardsClaimed", version: 1 },
    { name: "PartyCreated", version: 1 },
    { name: "HeroMinted", version: 1 },
    { name: "RelicMinted", version: 1 },
    { name: "VIPStaked", version: 1 },
    { name: "VIPUnstaked", version: 1 }
  ];
  
  for (const eventType of additionalEventTypes) {
    try {
      console.log(`註冊事件類型: ${eventType.name} (v${eventType.version})`);
      const tx = await eventStore.registerEventType(eventType.name, eventType.version);
      await tx.wait();
      console.log(`✅ 成功註冊 ${eventType.name}`);
    } catch (error) {
      console.log(`⚠️  註冊 ${eventType.name} 失敗: ${error.message}`);
    }
  }
  
  // Verify contract
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 驗證合約...");
    try {
      await hre.run("verify:verify", {
        address: eventStoreAddress,
        constructorArguments: []
      });
      console.log("✅ 合約驗證成功！");
    } catch (error) {
      console.log(`⚠️  合約驗證失敗: ${error.message}`);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    EventStore: eventStoreAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: deployTx.blockNumber,
    transactionHash: deployTx.hash
  };
  
  console.log("\n📊 部署總結:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n✅ EventStore 部署完成！");
  console.log("\n⚠️  請記得：");
  console.log("1. 保存合約地址到環境變數");
  console.log("2. 更新前端配置");
  console.log("3. 更新子圖配置（如果需要監聽 EventStore 事件）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失敗:", error);
    process.exit(1);
  });
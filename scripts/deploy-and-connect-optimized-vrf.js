// 部署並互連優化版 VRF Manager
// Usage: PRIVATE_KEY=0x... npx hardhat run scripts/deploy-and-connect-optimized-vrf.js --network bsc

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 部署並互連優化版 VRF Manager");
  console.log("============================================");
  
  // 網路配置
  const CONFIG = {
    // 現有合約地址
    HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da", 
    ALTAR: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    
    // VRF V2.5 正確配置
    VRF_SUBSCRIPTION_ID: "114131353280130458891383141995968474440293173552039681622016393393251650814328",
    VRF_COORDINATOR: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    VRF_KEY_HASH: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
    
    // Gas 配置
    CALLBACK_GAS_LIMIT: 250000,
    REQUEST_CONFIRMATIONS: 3,
  };
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📊 部署信息：");
  console.log("- Deployer:", deployer.address);
  console.log("- Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  
  // 1. 部署優化版 VRF Manager
  console.log("\n📦 部署 VRFConsumerV2Plus (優化版)...");
  const VRFManager = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
  const vrfManager = await VRFManager.deploy(
    CONFIG.VRF_SUBSCRIPTION_ID,
    CONFIG.VRF_COORDINATOR
  );
  
  await vrfManager.waitForDeployment();
  const vrfManagerAddress = await vrfManager.getAddress();
  console.log("✅ 部署完成，地址:", vrfManagerAddress);
  
  // 2. 配置 VRF Manager 參數
  console.log("\n⚙️ 配置 VRF Manager...");
  
  // 設置 Key Hash
  let tx = await vrfManager.setKeyHash(CONFIG.VRF_KEY_HASH);
  await tx.wait();
  console.log("- Key Hash 已設置");
  
  // 設置回調 Gas 限制
  tx = await vrfManager.setCallbackGasLimit(CONFIG.CALLBACK_GAS_LIMIT);
  await tx.wait();
  console.log("- Callback Gas Limit:", CONFIG.CALLBACK_GAS_LIMIT);
  
  // 設置確認數
  tx = await vrfManager.setRequestConfirmations(CONFIG.REQUEST_CONFIRMATIONS);
  await tx.wait();
  console.log("- Request Confirmations:", CONFIG.REQUEST_CONFIRMATIONS);
  
  // 授權合約
  console.log("\n🔐 授權合約...");
  const contractsToAuthorize = [
    { name: "Hero", address: CONFIG.HERO },
    { name: "Relic", address: CONFIG.RELIC },
    { name: "Altar", address: CONFIG.ALTAR },
    { name: "DungeonMaster", address: CONFIG.DUNGEONMASTER }
  ];
  
  for (const contract of contractsToAuthorize) {
    tx = await vrfManager.authorizeContract(contract.address);
    await tx.wait();
    console.log(`- ${contract.name} 已授權:`, contract.address);
  }
  
  // 3. 更新各合約的 VRF Manager 地址
  console.log("\n🔄 更新合約連接...");
  
  // Hero 合約
  try {
    const heroContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONFIG.HERO
    );
    tx = await heroContract.setVRFManager(vrfManagerAddress);
    await tx.wait();
    console.log("✅ Hero VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Hero 更新失敗:", error.message);
  }
  
  // Relic 合約
  try {
    const relicContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONFIG.RELIC
    );
    tx = await relicContract.setVRFManager(vrfManagerAddress);
    await tx.wait();
    console.log("✅ Relic VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Relic 更新失敗:", error.message);
  }
  
  // Altar 合約
  try {
    const altarContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONFIG.ALTAR
    );
    tx = await altarContract.setVRFManager(vrfManagerAddress);
    await tx.wait();
    console.log("✅ Altar VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Altar 更新失敗:", error.message);
  }
  
  // 4. 更新環境配置
  console.log("\n📝 更新環境配置...");
  const envPath = path.join(__dirname, '../.env.v25');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新 VRF Manager 地址
  envContent = envContent.replace(
    /VITE_VRFMANAGER_ADDRESS=.*/,
    `VITE_VRFMANAGER_ADDRESS=${vrfManagerAddress}`
  );
  
  // 添加更新時間註釋
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  envContent = envContent.replace(
    /# 更新時間:.*/,
    `# 更新時間: ${timestamp} (部署優化版 VRF Manager)`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env.v25 已更新");
  
  // 5. 保存部署記錄
  const deploymentRecord = {
    timestamp: new Date().toISOString(),
    network: "bsc",
    optimization: "VRF隨機數請求優化",
    contracts: {
      VRFManagerOptimized: vrfManagerAddress
    },
    changes: {
      description: "修正 numWords 從 quantity 改為 1",
      costSaving: "90%+ LINK 成本節省",
      impact: "無論鑄造多少 NFT，都只消耗 ~0.0017 LINK"
    },
    connections: {
      hero: CONFIG.HERO,
      relic: CONFIG.RELIC, 
      altar: CONFIG.ALTAR,
      dungeonmaster: CONFIG.DUNGEONMASTER
    },
    config: CONFIG
  };
  
  const recordPath = path.join(__dirname, '../deployments', `vrf-optimized-deployment-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
  console.log("📄 部署記錄已保存:", recordPath);
  
  // 6. 成本分析
  console.log("\n💰 成本優化分析：");
  console.log("================");
  console.log("鑄造數量    | 原始成本     | 優化成本     | 節省");
  console.log("----------- | ------------ | ------------ | --------");
  console.log("1 個 NFT    | 0.0017 LINK  | 0.0017 LINK  | 0%");
  console.log("10 個 NFT   | 0.017 LINK   | 0.0017 LINK  | 90%");
  console.log("50 個 NFT   | 0.085 LINK   | 0.0017 LINK  | 98%");
  
  console.log("\n✨ 部署和互連完成！");
  console.log("\n📋 後續步驟：");
  console.log("1. 同步配置到其他項目:");
  console.log("   node scripts/ultimate-config-system.js sync");
  console.log("");
  console.log("2. 驗證合約 (可選):");
  console.log(`   npx hardhat verify --network bsc ${vrfManagerAddress} ${CONFIG.VRF_SUBSCRIPTION_ID} ${CONFIG.VRF_COORDINATOR}`);
  console.log("");
  console.log("3. 測試鑄造功能確認成本優化");
  console.log("4. 監控 VRF 回調是否正常工作");
  
  console.log("\n🎉 新的 VRF Manager 地址:", vrfManagerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
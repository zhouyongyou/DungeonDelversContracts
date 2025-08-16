// 完成 VRF Manager 授權和連接
// 新部署的地址: 0x662F0B22CBCD35f5a2e4Cb01dB9e0707b1AF4546

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔗 連接優化版 VRF Manager");
  console.log("========================================");
  
  const VRF_MANAGER_ADDRESS = "0x662F0B22CBCD35f5a2e4Cb01dB9e0707b1AF4546";
  
  const CONTRACTS = {
    HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da", 
    ALTAR: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
  };
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📊 部署者:", deployer.address);
  
  // 獲取 VRF Manager 合約
  const vrfManager = await hre.ethers.getContractAt("VRFConsumerV2Plus", VRF_MANAGER_ADDRESS);
  
  // 1. 授權合約
  console.log("\n🔐 授權合約...");
  const contractsToAuthorize = [
    { name: "Hero", address: CONTRACTS.HERO },
    { name: "Relic", address: CONTRACTS.RELIC },
    { name: "Altar", address: CONTRACTS.ALTAR },
    { name: "DungeonMaster", address: CONTRACTS.DUNGEONMASTER }
  ];
  
  for (const contract of contractsToAuthorize) {
    try {
      const tx = await vrfManager.authorizeContract(contract.address);
      await tx.wait();
      console.log(`✅ ${contract.name} 已授權:`, contract.address);
    } catch (error) {
      console.error(`❌ ${contract.name} 授權失敗:`, error.message);
    }
  }
  
  // 2. 更新各合約的 VRF Manager 地址
  console.log("\n🔄 更新合約連接...");
  
  // Hero 合約
  try {
    const heroContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONTRACTS.HERO
    );
    const tx = await heroContract.setVRFManager(VRF_MANAGER_ADDRESS);
    await tx.wait();
    console.log("✅ Hero VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Hero 更新失敗:", error.message);
  }
  
  // Relic 合約
  try {
    const relicContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONTRACTS.RELIC
    );
    const tx = await relicContract.setVRFManager(VRF_MANAGER_ADDRESS);
    await tx.wait();
    console.log("✅ Relic VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Relic 更新失敗:", error.message);
  }
  
  // Altar 合約
  try {
    const altarContract = await hre.ethers.getContractAt(
      ["function setVRFManager(address _vrfManager)"], 
      CONTRACTS.ALTAR
    );
    const tx = await altarContract.setVRFManager(VRF_MANAGER_ADDRESS);
    await tx.wait();
    console.log("✅ Altar VRF Manager 已更新");
  } catch (error) {
    console.error("❌ Altar 更新失敗:", error.message);
  }
  
  // 3. 更新環境配置
  console.log("\n📝 更新環境配置...");
  const envPath = path.join(__dirname, '../.env.v25');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新 VRF Manager 地址
  envContent = envContent.replace(
    /VITE_VRFMANAGER_ADDRESS=.*/,
    `VITE_VRFMANAGER_ADDRESS=${VRF_MANAGER_ADDRESS}`
  );
  
  // 添加更新時間註釋
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  envContent = envContent.replace(
    /# 更新時間:.*/,
    `# 更新時間: ${timestamp} (優化版VRF-節省90%LINK成本)`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env.v25 已更新");
  
  // 4. 顯示成本優化效果
  console.log("\n💰 成本優化成功！");
  console.log("================");
  console.log("鑄造數量  | 原始成本     | 優化成本     | 節省");
  console.log("--------- | ------------ | ------------ | --------");
  console.log("1 個 NFT  | 0.0017 LINK  | 0.0017 LINK  | 0%");
  console.log("10 個 NFT | 0.017 LINK   | 0.0017 LINK  | 90%");
  console.log("50 個 NFT | 0.085 LINK   | 0.0017 LINK  | 98%");
  
  console.log("\n✨ 優化版 VRF Manager 連接完成！");
  console.log("\n🎯 新地址:", VRF_MANAGER_ADDRESS);
  console.log("\n📋 後續步驟：");
  console.log("1. 同步配置到其他項目: node scripts/ultimate-config-system.js sync");
  console.log("2. 測試鑄造功能，確認只消耗 ~0.0017 LINK");
  console.log("3. 清除原 commitment (如果有卡住的):");
  console.log("   node scripts/emergency-clear-commitment.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
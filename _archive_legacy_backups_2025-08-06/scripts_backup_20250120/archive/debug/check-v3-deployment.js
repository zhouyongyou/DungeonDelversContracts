// 檢查 DungeonMaster V3 部署狀態

const hre = require("hardhat");
const { ethers } = require("hardhat");
const { formatEther } = require("ethers");

async function main() {
  console.log("🔍 檢查 DungeonMaster V3 部署狀態...\n");

  // V3 合約地址
  const dungeonMasterAddress = "0x5D4ae4275A5173A52EF32F42F21F13794dcFD95d";
  const dungeonStorageAddress = "0x7890463c87b982C9d8cf6d318C5767901e0Fb55D";
  const dungeonCoreAddress = "0xEB6a88a17bf3Bb4959e90c1e21b2fd2f8Fb2B60C";
  
  // 連接合約
  const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
  const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
  
  console.log("1️⃣ 檢查合約基本狀態:");
  console.log("================================");
  
  // 檢查是否暫停
  try {
    const isPaused = await dungeonMaster.paused();
    console.log(`合約暫停狀態: ${isPaused ? '⏸️ 已暫停' : '✅ 運行中'}`);
  } catch (e) {
    console.log("❌ 無法檢查暫停狀態:", e.message);
  }
  
  // 檢查探索費用
  try {
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`探索費用: ${formatEther(explorationFee)} BNB`);
  } catch (e) {
    console.log("❌ 無法讀取探索費用:", e.message);
  }
  
  // 檢查 DungeonStorage 地址
  try {
    const storageAddress = await dungeonMaster.dungeonStorage();
    console.log(`DungeonStorage 地址: ${storageAddress}`);
    console.log(`配置是否正確: ${storageAddress.toLowerCase() === dungeonStorageAddress.toLowerCase() ? '✅' : '❌'}`);
  } catch (e) {
    console.log("❌ 無法讀取 DungeonStorage 地址:", e.message);
  }
  
  console.log("\n2️⃣ 檢查合約連接狀態:");
  console.log("================================");
  
  // 檢查 DungeonCore 連接
  try {
    const coreAddress = await dungeonMaster.dungeonCore();
    console.log(`DungeonCore 地址: ${coreAddress}`);
    console.log(`配置是否正確: ${coreAddress.toLowerCase() === dungeonCoreAddress.toLowerCase() ? '✅' : '❌'}`);
  } catch (e) {
    console.log("❌ 無法讀取 DungeonCore 地址:", e.message);
  }
  
  // 檢查錢包地址
  try {
    const walletAddress = await dungeonMaster.walletAddress();
    console.log(`錢包地址: ${walletAddress}`);
  } catch (e) {
    console.log("❌ 無法讀取錢包地址:", e.message);
  }
  
  console.log("\n3️⃣ 檢查地城數據:");
  console.log("================================");
  
  // 檢查地城數量
  try {
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
    const dungeonCount = await dungeonStorage.getDungeonCount();
    console.log(`地城總數: ${dungeonCount}`);
    
    if (dungeonCount > 0) {
      const dungeon = await dungeonStorage.getDungeon(1);
      console.log(`\n地城 #1:`, {
        name: dungeon.name,
        baseSuccessRate: dungeon.baseSuccessRate.toString(),
        soulRewardMin: formatEther(dungeon.soulRewardMin),
        soulRewardMax: formatEther(dungeon.soulRewardMax),
        requiredPower: dungeon.requiredPower.toString()
      });
    }
  } catch (e) {
    console.log("❌ 無法讀取地城數據:", e.message);
  }
  
  console.log("\n4️⃣ 模擬遠征交易:");
  console.log("================================");
  
  // 獲取 signer
  const [signer] = await ethers.getSigners();
  console.log(`使用地址: ${signer.address}`);
  
  try {
    // 測試 staticCall
    const fee = await dungeonMaster.explorationFee();
    console.log(`嘗試以 ${formatEther(fee)} BNB 模擬遠征...`);
    
    // 這裡只是檢查函數是否存在，不實際執行
    const tx = await dungeonMaster.populateTransaction.requestExpedition(1, 1, { value: fee });
    console.log("✅ 函數調用格式正確");
    console.log("交易數據:", tx.data.slice(0, 10) + "...");
  } catch (e) {
    console.log("❌ 模擬失敗:", e.message);
    if (e.reason) console.log("原因:", e.reason);
    if (e.method) console.log("方法:", e.method);
  }
  
  console.log("\n📋 診斷完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  });
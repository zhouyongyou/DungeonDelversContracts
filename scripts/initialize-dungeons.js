// initialize-dungeons.js - 初始化所有地城數據
const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.v25" });

// 地城配置（使用用戶建議的數值）
const DUNGEONS = [
  { id: 1, power: 300, rewardUSD: 6, rate: 89, name: "新手礦洞" },
  { id: 2, power: 600, rewardUSD: 12, rate: 84, name: "哥布林洞穴" },
  { id: 3, power: 900, rewardUSD: 20, rate: 79, name: "食人魔山谷" },
  { id: 4, power: 1200, rewardUSD: 33, rate: 74, name: "蜘蛛巢穴" },
  { id: 5, power: 1500, rewardUSD: 52, rate: 69, name: "石化蜥蜴沼澤" },
  { id: 6, power: 1800, rewardUSD: 78, rate: 64, name: "巫妖墓穴" },
  { id: 7, power: 2100, rewardUSD: 113, rate: 59, name: "奇美拉之巢" },
  { id: 8, power: 2400, rewardUSD: 156, rate: 54, name: "惡魔前哨站" },
  { id: 9, power: 2700, rewardUSD: 209, rate: 49, name: "巨龍之巔" },
  { id: 10, power: 3000, rewardUSD: 225, rate: 44, name: "混沌深淵" },
  { id: 11, power: 3300, rewardUSD: 320, rate: 39, name: "冥界之門" },
  { id: 12, power: 3600, rewardUSD: 450, rate: 34, name: "虛空裂隙" }
];

async function main() {
  console.log("🎮 初始化地城數據...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("📝 使用錢包:", signer.address);
  
  // 獲取 DungeonMaster 合約
  const dungeonMasterAddress = process.env.VITE_DUNGEONMASTER_ADDRESS;
  if (!dungeonMasterAddress) {
    throw new Error("❌ 找不到 DungeonMaster 地址");
  }
  
  console.log("📍 DungeonMaster 地址:", dungeonMasterAddress);
  
  // 載入 DungeonMaster ABI
  const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
  const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);
  
  // 檢查當前地城狀態
  console.log("\n📊 檢查當前地城狀態...");
  for (const dungeon of DUNGEONS) {
    try {
      const dungeonData = await dungeonMaster.getDungeon(dungeon.id);
      if (dungeonData.isInitialized) {
        console.log(`✅ 地城 #${dungeon.id} ${dungeon.name} - 已初始化`);
        console.log(`   戰力: ${dungeonData.requiredPower}, 獎勵: ${ethers.formatEther(dungeonData.rewardAmountUSD)} USD, 成功率: ${dungeonData.baseSuccessRate}%`);
      } else {
        console.log(`❌ 地城 #${dungeon.id} ${dungeon.name} - 未初始化`);
      }
    } catch (error) {
      console.log(`⚠️ 地城 #${dungeon.id} 讀取失敗:`, error.message);
    }
  }
  
  // 詢問是否繼續
  console.log("\n⚠️ 即將初始化所有未設置的地城");
  console.log("按 Ctrl+C 取消，或等待 5 秒繼續...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 初始化地城
  console.log("\n🔧 開始初始化地城...");
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  for (const dungeon of DUNGEONS) {
    try {
      // 先檢查是否已初始化
      const dungeonData = await dungeonMaster.getDungeon(dungeon.id);
      if (dungeonData.isInitialized) {
        console.log(`⏭️ 地城 #${dungeon.id} ${dungeon.name} - 已存在，跳過`);
        skipCount++;
        continue;
      }
      
      // 設置地城
      console.log(`🔄 設置地城 #${dungeon.id} ${dungeon.name}...`);
      const tx = await dungeonMaster.setDungeon(
        dungeon.id,
        dungeon.power,
        ethers.parseEther(dungeon.rewardUSD.toString()),
        dungeon.rate,
        { gasLimit: 300000 }
      );
      
      console.log(`   交易哈希: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ 地城 #${dungeon.id} ${dungeon.name} 設置成功！`);
      successCount++;
      
      // 稍微延遲避免 RPC 限制
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ 地城 #${dungeon.id} ${dungeon.name} 設置失敗:`, error.message);
      failCount++;
    }
  }
  
  // 總結
  console.log("\n📊 初始化完成統計:");
  console.log(`✅ 成功: ${successCount}`);
  console.log(`⏭️ 跳過: ${skipCount}`);
  console.log(`❌ 失敗: ${failCount}`);
  
  // 驗證最終狀態
  console.log("\n🔍 驗證最終狀態...");
  let allInitialized = true;
  for (const dungeon of DUNGEONS) {
    try {
      const dungeonData = await dungeonMaster.getDungeon(dungeon.id);
      if (!dungeonData.isInitialized) {
        console.log(`❌ 地城 #${dungeon.id} ${dungeon.name} - 仍未初始化`);
        allInitialized = false;
      }
    } catch (error) {
      console.log(`⚠️ 地城 #${dungeon.id} 驗證失敗:`, error.message);
      allInitialized = false;
    }
  }
  
  if (allInitialized) {
    console.log("\n🎉 所有地城都已成功初始化！");
  } else {
    console.log("\n⚠️ 部分地城未能初始化，請檢查錯誤並重試");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });
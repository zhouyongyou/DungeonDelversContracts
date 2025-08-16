#!/usr/bin/env node

/**
 * V25 快速檢查腳本
 * 檢查 DungeonMaster 的 dungeonCore 設置狀態
 */

const hre = require("hardhat");

async function main() {
  console.log("\n🔍 檢查 DungeonMaster 狀態...\n");
  
  try {
    // 使用 hardhat 的 ethers
    const dungeonMaster = await hre.ethers.getContractAt(
      "DungeonMasterV2_Fixed",
      "0xd06470d4C6F62F6747cf02bD2b2De0981489034F"
    );
    
    console.log("📍 DungeonMaster 地址: 0xd06470d4C6F62F6747cf02bD2b2De0981489034F");
    
    // 檢查 dungeonCore
    const dungeonCore = await dungeonMaster.dungeonCore();
    console.log("📍 當前 DungeonCore 地址:", dungeonCore);
    
    const expectedDungeonCore = "0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a";
    
    if (dungeonCore.toLowerCase() === expectedDungeonCore.toLowerCase()) {
      console.log("\n✅ DungeonMaster.dungeonCore 已正確設置！");
      console.log("🎉 無需執行修復");
    } else if (dungeonCore === "0x0000000000000000000000000000000000000000") {
      console.log("\n❌ DungeonMaster.dungeonCore 為零地址");
      console.log("📌 需要執行修復腳本");
    } else {
      console.log("\n⚠️  DungeonMaster.dungeonCore 地址不正確");
      console.log("📌 預期地址:", expectedDungeonCore);
      console.log("📌 需要執行修復腳本");
    }
    
    // 檢查其他相關設置
    console.log("\n📊 其他設置檢查:");
    
    try {
      const soulShardToken = await dungeonMaster.soulShardToken();
      console.log("- SoulShard Token:", soulShardToken);
    } catch (e) {
      console.log("- SoulShard Token: 無法讀取");
    }
    
    try {
      const dungeonStorage = await dungeonMaster.dungeonStorage();
      console.log("- DungeonStorage:", dungeonStorage);
    } catch (e) {
      console.log("- DungeonStorage: 無法讀取");
    }
    
  } catch (error) {
    console.error("\n❌ 檢查失敗:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
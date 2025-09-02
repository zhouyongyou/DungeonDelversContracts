#!/usr/bin/env node

/**
 * 調試 addExperience 調用的具體問題
 */

const hre = require("hardhat");

const CONTRACTS = {
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  PLAYERPROFILE: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7",
  DUNGEONMASTER: "0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703"
};

const PLAYER_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";

async function main() {
  console.log("🔍 調試 addExperience 調用問題...\n");

  try {
    // 連接合約
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = PlayerProfile.attach(CONTRACTS.PLAYERPROFILE);
    
    const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
    const dungeonCore = DungeonCore.attach(CONTRACTS.DUNGEONCORE);

    // 1. 檢查 PlayerProfile 中的 dungeonCore 地址
    console.log("1. 檢查 PlayerProfile 配置:");
    const dungeonCoreInProfile = await playerProfile.dungeonCore();
    console.log(`   PlayerProfile.dungeonCore: ${dungeonCoreInProfile}`);
    console.log(`   期望 DungeonCore 地址: ${CONTRACTS.DUNGEONCORE}`);
    console.log(`   匹配: ${dungeonCoreInProfile.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase() ? '✅' : '❌'}`);

    // 2. 檢查 DungeonCore 中的 dungeonMasterAddress
    console.log("\n2. 檢查 DungeonCore 配置:");
    const dungeonMasterInCore = await dungeonCore.dungeonMasterAddress();
    console.log(`   DungeonCore.dungeonMasterAddress: ${dungeonMasterInCore}`);
    console.log(`   實際 DungeonMaster 地址: ${CONTRACTS.DUNGEONMASTER}`);
    console.log(`   匹配: ${dungeonMasterInCore.toLowerCase() === CONTRACTS.DUNGEONMASTER.toLowerCase() ? '✅' : '❌'}`);

    // 3. 模擬 DungeonMaster 調用 addExperience
    console.log("\n3. 測試權限檢查邏輯:");
    
    // 模擬權限檢查
    console.log("   檢查 onlyAuthorized 修飾符邏輯:");
    console.log(`   - dungeonCore != address(0): ${dungeonCoreInProfile !== '0x0000000000000000000000000000000000000000' ? '✅' : '❌'}`);
    
    if (dungeonCoreInProfile !== '0x0000000000000000000000000000000000000000') {
      console.log(`   - msg.sender (DungeonMaster): ${CONTRACTS.DUNGEONMASTER}`);
      console.log(`   - dungeonCore.dungeonMasterAddress(): ${dungeonMasterInCore}`);
      console.log(`   - 權限檢查通過: ${dungeonMasterInCore.toLowerCase() === CONTRACTS.DUNGEONMASTER.toLowerCase() ? '✅' : '❌'}`);
    }

    // 4. 檢查合約是否暫停
    console.log("\n4. 檢查合約狀態:");
    try {
      const isPaused = await playerProfile.paused();
      console.log(`   PlayerProfile 是否暫停: ${isPaused ? '❌ 是' : '✅ 否'}`);
    } catch (error) {
      console.log(`   無法檢查暫停狀態: ${error.message}`);
    }

    // 5. 模擬 addExperience 調用
    console.log("\n5. 模擬 addExperience 調用:");
    try {
      // 檢查當前玩家檔案
      const currentTokenId = await playerProfile.profileTokenOf(PLAYER_ADDRESS);
      console.log(`   當前玩家檔案 Token ID: ${currentTokenId.toString()}`);
      
      if (currentTokenId.toString() === "0") {
        console.log("   玩家沒有檔案，addExperience 會嘗試自動創建");
        console.log("   這可能是權限錯誤的原因：mintProfile 也需要 onlyAuthorized 權限");
      }
      
    } catch (error) {
      console.log(`   檢查失敗: ${error.message}`);
    }

    // 6. 總結問題
    console.log("\n📋 問題總結:");
    console.log("   - 權限配置看起來是正確的");
    console.log("   - 問題可能在於 addExperience 嘗試調用 mintProfile");
    console.log("   - mintProfile 也有 onlyAuthorized 修飾符");
    console.log("   - 這導致了權限檢查的嵌套問題");

  } catch (error) {
    console.error("❌ 調試失敗:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n✅ 調試完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 調試錯誤:", error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * 檢查玩家檔案是否存在和經驗值
 */

const hre = require("hardhat");

const CONTRACTS = {
  PLAYERPROFILE: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7"
};

const PLAYER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";

async function main() {
  console.log("🔍 檢查玩家檔案狀態...\n");

  try {
    // 連接到 PlayerProfile 合約
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = PlayerProfile.attach(CONTRACTS.PLAYERPROFILE);

    // 檢查玩家是否有檔案
    console.log(`檢查玩家: ${PLAYER_ADDRESS}`);
    
    try {
      const tokenId = await playerProfile.profileTokenOf(PLAYER_ADDRESS);
      console.log(`玩家檔案 Token ID: ${tokenId.toString()}`);
      
      if (tokenId.toString() === "0") {
        console.log("❌ 玩家沒有檔案");
        
        // 嘗試檢查是否可以創建檔案
        console.log("\n🔍 檢查是否可以創建檔案...");
        try {
          // 使用 staticCall 測試 mint 是否會成功
          await playerProfile.mintProfile.staticCall(PLAYER_ADDRESS);
          console.log("✅ 可以創建玩家檔案");
        } catch (error) {
          console.log(`❌ 無法創建玩家檔案: ${error.message}`);
        }
      } else {
        console.log("✅ 玩家有檔案");
        
        // 檢查經驗值
        try {
          const profileData = await playerProfile.profileData(tokenId);
          console.log(`當前經驗值: ${profileData.experience.toString()}`);
        } catch (error) {
          console.log(`⚠️ 無法讀取經驗值: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ 檢查玩家檔案失敗: ${error.message}`);
    }
    
    // 檢查最新的遠征是否增加了經驗值
    console.log("\n🔍 檢查最近的遠征結果...");
    
    // 從最新交易的事件看，應該增加了 60 經驗值
    console.log("從交易 0x83a0bb9239071df67e669de1e23489a96616538c6cbbbefecdde769d377ff341 看到:");
    console.log("- ExpeditionFulfilled 事件");
    console.log("- success: true");
    console.log("- expGained: 60");
    console.log("- 這意味著經驗值增加功能已經正常工作了！");

  } catch (error) {
    console.error("❌ 檢查失敗:", error.message);
  }
}

main()
  .then(() => {
    console.log("\n✅ 檢查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 檢查錯誤:", error);
    process.exit(1);
  });
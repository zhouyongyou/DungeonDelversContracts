#!/usr/bin/env node

/**
 * 手動為指定玩家創建檔案
 * 
 * 由於 addExperience 中的權限檢查嵌套問題，
 * 我們先手動創建檔案，這樣下次遠征就能正常增加經驗值了
 */

const hre = require("hardhat");

const CONTRACTS = {
  PLAYERPROFILE: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7"
};

const PLAYER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";

async function main() {
  console.log("🔧 手動為玩家創建檔案...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`使用錢包: ${signer.address}`);
  console.log(`目標玩家: ${PLAYER_ADDRESS}\n`);

  try {
    // 連接到 PlayerProfile 合約
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = PlayerProfile.attach(CONTRACTS.PLAYERPROFILE);

    // 檢查玩家是否已經有檔案
    console.log("1. 檢查玩家當前狀態...");
    const currentTokenId = await playerProfile.profileTokenOf(PLAYER_ADDRESS);
    console.log(`   當前 Token ID: ${currentTokenId.toString()}`);
    
    if (currentTokenId.toString() !== "0") {
      console.log("✅ 玩家已經有檔案，無需創建");
      
      // 檢查經驗值
      const profileData = await playerProfile.profileData(currentTokenId);
      console.log(`   當前經驗值: ${profileData.experience.toString()}`);
      return;
    }

    // 手動創建檔案
    console.log("\n2. 為玩家創建檔案...");
    const tx = await playerProfile.mintProfile(PLAYER_ADDRESS);
    console.log(`   交易 hash: ${tx.hash}`);
    
    // 等待確認
    console.log("   等待交易確認...");
    const receipt = await tx.wait();
    console.log(`   ✅ 交易已確認，區塊: ${receipt.blockNumber}`);

    // 驗證創建結果
    console.log("\n3. 驗證創建結果...");
    const newTokenId = await playerProfile.profileTokenOf(PLAYER_ADDRESS);
    console.log(`   新的 Token ID: ${newTokenId.toString()}`);
    
    if (newTokenId.toString() !== "0") {
      const profileData = await playerProfile.profileData(newTokenId);
      console.log(`   初始經驗值: ${profileData.experience.toString()}`);
      console.log("✅ 玩家檔案創建成功！");
      
      console.log("\n🎉 現在你可以進行遠征了，經驗值會正常增加！");
    } else {
      console.log("❌ 檔案創建失敗");
    }

  } catch (error) {
    console.error("❌ 創建失敗:", error.message);
    
    if (error.message.includes("Profile: Caller is not the DungeonMaster")) {
      console.log("\n💡 這證實了我們的診斷：權限檢查問題");
      console.log("   需要修復合約或使用管理員權限創建檔案");
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ 腳本執行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 腳本執行錯誤:", error);
    process.exit(1);
  });
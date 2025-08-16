#!/usr/bin/env node

/**
 * 修復 PlayerProfile 合約的 DungeonCore 地址設置
 * 
 * 問題：PlayerProfile 合約中的 dungeonCore 地址不正確，導致 addExperience 權限檢查失敗
 * 解決：調用 PlayerProfile.setDungeonCore() 設置正確的 DungeonCore 地址
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

// 合約地址（V25 最新部署）
const CONTRACTS = {
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  PLAYERPROFILE: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7",
  DUNGEONMASTER: "0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703"
};

async function main() {
  console.log("🔧 修復 PlayerProfile 的 DungeonCore 地址設置...\n");

  // 創建 signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`使用錢包: ${signer.address}\n`);

  try {
    // 1. 連接到 PlayerProfile 合約
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = PlayerProfile.attach(CONTRACTS.PLAYERPROFILE);

    // 2. 檢查當前的 dungeonCore 地址
    console.log("📊 當前狀態檢查:");
    try {
      const currentDungeonCore = await playerProfile.dungeonCore();
      console.log(`   當前 PlayerProfile.dungeonCore: ${currentDungeonCore}`);
      console.log(`   期望 DungeonCore 地址: ${CONTRACTS.DUNGEONCORE}`);
      console.log(`   地址匹配: ${currentDungeonCore.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase() ? '✅' : '❌'}\n`);
    } catch (error) {
      console.log(`   ⚠️ 無法讀取當前 dungeonCore: ${error.message}\n`);
    }

    // 3. 設置正確的 DungeonCore 地址
    console.log("🔧 執行修復...");
    const tx = await playerProfile.setDungeonCore(CONTRACTS.DUNGEONCORE);
    console.log(`   交易 hash: ${tx.hash}`);
    
    // 等待交易確認
    console.log("   等待交易確認...");
    const receipt = await tx.wait();
    console.log(`   ✅ 交易已確認，區塊: ${receipt.blockNumber}\n`);

    // 4. 驗證修復結果
    console.log("🔍 驗證修復結果:");
    const newDungeonCore = await playerProfile.dungeonCore();
    console.log(`   更新後 PlayerProfile.dungeonCore: ${newDungeonCore}`);
    
    const isFixed = newDungeonCore.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase();
    console.log(`   修復狀態: ${isFixed ? '✅ 成功' : '❌ 失敗'}\n`);

    // 5. 測試權限檢查
    console.log("🧪 測試權限檢查:");
    try {
      // 連接到 DungeonCore 檢查 dungeonMasterAddress
      const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
      const dungeonCore = DungeonCore.attach(CONTRACTS.DUNGEONCORE);
      
      const dungeonMasterFromCore = await dungeonCore.dungeonMasterAddress();
      console.log(`   DungeonCore.dungeonMasterAddress(): ${dungeonMasterFromCore}`);
      console.log(`   實際 DungeonMaster 地址: ${CONTRACTS.DUNGEONMASTER}`);
      
      const masterAddressMatch = dungeonMasterFromCore.toLowerCase() === CONTRACTS.DUNGEONMASTER.toLowerCase();
      console.log(`   DungeonMaster 地址匹配: ${masterAddressMatch ? '✅' : '❌'}`);
      
      if (isFixed && masterAddressMatch) {
        console.log("\n🎉 修復完成！現在 PlayerProfile.addExperience() 應該可以正常工作了。");
      } else {
        console.log("\n⚠️ 還有問題需要解決:");
        if (!isFixed) console.log("   - PlayerProfile.dungeonCore 地址仍然不正確");
        if (!masterAddressMatch) console.log("   - DungeonCore.dungeonMasterAddress 與實際不匹配");
      }
      
    } catch (error) {
      console.log(`   ⚠️ 權限檢查測試失敗: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ 修復失敗:", error.message);
    
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n💡 解決方案:");
      console.log(`   請使用合約所有者錢包執行此腳本`);
      console.log(`   或者聯繫所有者執行以下操作:`);
      console.log(`   PlayerProfile(${CONTRACTS.PLAYERPROFILE}).setDungeonCore("${CONTRACTS.DUNGEONCORE}")`);
    }
    
    process.exit(1);
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
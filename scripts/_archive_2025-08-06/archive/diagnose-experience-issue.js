const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 診斷 PlayerProfile 經驗值記錄問題...\n");

  const addresses = {
    dungeonCore: "0xd03d3D7456ba3B52E6E0112eBc2494dB1cB34524",
    dungeonMasterV7: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe",
    playerProfile: "0x7f5D359bC65F0aB07f7A874C2efF72752Fb294e5",
    testUser: "0xEbCF4A36Ad1485A9737025e9d72186b604487274"
  };

  // 獲取合約實例
  const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
  const playerProfile = await ethers.getContractAt("PlayerProfile", addresses.playerProfile);
  
  console.log("📋 檢查合約配置：");
  console.log("================");
  
  // 1. 檢查 DungeonCore 中註冊的 dungeonMaster
  const registeredDM = await dungeonCore.dungeonMasterAddress();
  console.log("DungeonCore 註冊的 DungeonMaster:", registeredDM);
  console.log("我們部署的 DungeonMasterV7:", addresses.dungeonMasterV7);
  console.log("地址是否匹配:", registeredDM.toLowerCase() === addresses.dungeonMasterV7.toLowerCase() ? "✅ 是" : "❌ 否");
  
  // 2. 檢查 PlayerProfile 中的 dungeonCore
  const profileDungeonCore = await playerProfile.dungeonCore();
  console.log("\nPlayerProfile 的 DungeonCore:", profileDungeonCore);
  console.log("是否正確:", profileDungeonCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? "✅ 是" : "❌ 否");
  
  // 3. 檢查用戶的經驗值
  try {
    const userProfile = await playerProfile.playerProfiles(addresses.testUser);
    console.log("\n📊 用戶檔案資訊：");
    console.log("經驗值:", userProfile.experience.toString());
    console.log("等級:", userProfile.level.toString());
    console.log("是否有檔案:", userProfile.experience > 0n || userProfile.level > 0n ? "✅ 是" : "❌ 否");
  } catch (error) {
    console.log("\n❌ 無法讀取用戶檔案:", error.message);
  }
  
  // 4. 診斷結果
  console.log("\n🔎 診斷結果：");
  console.log("============");
  
  if (registeredDM.toLowerCase() !== addresses.dungeonMasterV7.toLowerCase()) {
    console.log("❌ 問題找到了！DungeonCore 中的 dungeonMaster 地址不正確。");
    console.log("   PlayerProfile 只接受來自註冊的 dungeonMaster 的調用。");
    console.log("\n🔧 解決方案：");
    console.log("   請執行：dungeonCore.setDungeonMaster('" + addresses.dungeonMasterV7 + "')");
  } else {
    console.log("✅ DungeonCore 配置正確");
    console.log("   可能是其他問題，需要進一步調查。");
  }
  
  // 5. 測試直接調用 (會失敗，用於驗證權限)
  console.log("\n🧪 測試權限：");
  try {
    const [signer] = await ethers.getSigners();
    await playerProfile.connect(signer).addExperience(addresses.testUser, 100);
    console.log("✅ 可以直接調用 addExperience（不應該發生）");
  } catch (error) {
    console.log("❌ 無法直接調用 addExperience（正常，說明權限檢查正常運作）");
    console.log("   錯誤:", error.message.substring(0, 100) + "...");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 檢查 DungeonStorage 授權問題...\n");

  const addresses = {
    dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
    dungeonMasterV7: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe",
    oldDungeonMaster: "0x0048396d13C8A505a09f4F839ae66Ef72007C512" // 管理後台顯示的舊地址
  };

  // 獲取 DungeonStorage 合約
  const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.dungeonStorage);

  console.log("📋 DungeonStorage 合約地址:", addresses.dungeonStorage);
  
  try {
    // 檢查當前的 logicContract
    const currentLogic = await dungeonStorage.logicContract();
    console.log("\n當前授權的 Logic 合約:", currentLogic);
    console.log("新的 DungeonMasterV7:", addresses.dungeonMasterV7);
    console.log("舊的 DungeonMaster:", addresses.oldDungeonMaster);
    
    if (currentLogic.toLowerCase() === addresses.oldDungeonMaster.toLowerCase()) {
      console.log("\n❌ 問題找到了！DungeonStorage 仍然指向舊的 DungeonMaster！");
      console.log("需要更新 logicContract 到新的 DungeonMasterV7");
      
      // 嘗試更新
      console.log("\n🔄 嘗試更新 logicContract...");
      const tx = await dungeonStorage.setLogicContract(addresses.dungeonMasterV7);
      await tx.wait();
      console.log("✅ 已更新 logicContract！");
      
    } else if (currentLogic.toLowerCase() === addresses.dungeonMasterV7.toLowerCase()) {
      console.log("\n✅ DungeonStorage 已經指向正確的 DungeonMasterV7");
    } else {
      console.log("\n⚠️ DungeonStorage 指向未知的合約:", currentLogic);
      console.log("🔄 更新到新的 DungeonMasterV7...");
      const tx = await dungeonStorage.setLogicContract(addresses.dungeonMasterV7);
      await tx.wait();
      console.log("✅ 已更新 logicContract 到 DungeonMasterV7！");
    }
    
  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 修復 DungeonMaster 註冊問題...\n");

  const addresses = {
    dungeonCore: "0xd03d3D7456ba3B52E6E0112eBc2494dB1cB34524",
    dungeonMasterV7: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe",
  };

  // 獲取 DungeonCore 合約
  const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
  
  // 檢查當前設定
  const currentDM = await dungeonCore.dungeonMasterAddress();
  console.log("當前的 DungeonMaster:", currentDM);
  console.log("目標 DungeonMasterV7:", addresses.dungeonMasterV7);
  
  if (currentDM.toLowerCase() === addresses.dungeonMasterV7.toLowerCase()) {
    console.log("\n✅ DungeonMaster 已經設定正確，無需修改。");
    return;
  }
  
  // 執行更新
  console.log("\n🚀 更新 DungeonMaster 地址...");
  try {
    const tx = await dungeonCore.setDungeonMaster(addresses.dungeonMasterV7);
    console.log("交易已發送:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ 交易已確認！");
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 驗證更新
    const newDM = await dungeonCore.dungeonMasterAddress();
    console.log("\n驗證更新:");
    console.log("新的 DungeonMaster:", newDM);
    console.log("更新成功:", newDM.toLowerCase() === addresses.dungeonMasterV7.toLowerCase() ? "✅ 是" : "❌ 否");
    
  } catch (error) {
    console.error("\n❌ 更新失敗:", error.message);
    console.log("\n可能的原因:");
    console.log("1. 您不是 DungeonCore 的 owner");
    console.log("2. 網路問題");
    console.log("3. Gas 不足");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
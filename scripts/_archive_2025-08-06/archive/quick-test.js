
const { ethers } = require("hardhat");

async function quickTest() {
  console.log("🧪 快速測試新部署的合約...\n");
  
  // 測試 DungeonCore
  const dungeonCore = await ethers.getContractAt("DungeonCore", "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  const dungeonMaster = await dungeonCore.dungeonMasterAddress();
  console.log("✅ DungeonCore 正確指向 DungeonMaster:", dungeonMaster === "0xb71f6ED7B13452a99d740024aC17470c1b4F0021");
  
  // 測試 PlayerProfile
  const playerProfile = await ethers.getContractAt("PlayerProfile", "0x39b09c3c64D5ada443d2965cb31C7bad7AC66F2f");
  const profileCore = await playerProfile.dungeonCore();
  console.log("✅ PlayerProfile 正確連接到 DungeonCore:", profileCore === "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  
  console.log("\n測試完成！");
}

quickTest().catch(console.error);

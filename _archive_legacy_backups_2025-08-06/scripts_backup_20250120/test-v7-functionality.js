const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 測試 V7 功能...\n");

  const [tester] = await ethers.getSigners();
  console.log("測試帳戶:", tester.address);
  
  // 合約地址
  const addresses = {
    partyV3: "0xe4A55375f7Aba70785f958E2661E08F9FD5f7ab1",
    dungeonMasterV7: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe"
  };

  // 獲取合約實例
  const partyV3 = await ethers.getContractAt("Party", addresses.partyV3);
  const dungeonMasterV7 = await ethers.getContractAt("DungeonMasterV7", addresses.dungeonMasterV7);

  console.log("=== 測試 1: Party 戰力查詢 ===");
  
  // 測試幾個已知的 Party ID
  const testPartyIds = [1, 2, 3, 4, 5]; // 根據實際情況調整
  
  for (const partyId of testPartyIds) {
    try {
      console.log(`\n測試 Party #${partyId}:`);
      
      // 使用新的快速查詢函數
      const power = await partyV3.getPartyPowerQuick(partyId);
      const capacity = await partyV3.getPartyCapacityQuick(partyId);
      
      console.log(`  - 戰力 (Quick): ${power.toString()}`);
      console.log(`  - 容量 (Quick): ${capacity.toString()}`);
      
      // 使用 DungeonMaster 的查詢
      const [dmPower, dmCapacity] = await dungeonMasterV7.getPartyPower(partyId);
      console.log(`  - 戰力 (DM): ${dmPower.toString()}`);
      console.log(`  - 容量 (DM): ${dmCapacity.toString()}`);
      
      // 檢查是否一致
      if (power.toString() === dmPower.toString()) {
        console.log("  ✅ 戰力讀取一致");
      } else {
        console.log("  ❌ 戰力讀取不一致!");
      }
      
    } catch (error) {
      console.log(`  ⚠️ Party #${partyId} 可能不存在或出錯:`, error.message);
    }
  }

  console.log("\n=== 測試 2: 地城進入檢查 ===");
  
  const testDungeonId = 7; // 奇美拉之巢 (需要 2100 戰力)
  
  for (const partyId of testPartyIds) {
    try {
      const [canEnter, reason] = await dungeonMasterV7.canEnterDungeon(partyId, testDungeonId);
      console.log(`\nParty #${partyId} 進入地城 #${testDungeonId}:`);
      console.log(`  - 可以進入: ${canEnter}`);
      console.log(`  - 原因: ${reason}`);
    } catch (error) {
      console.log(`  ⚠️ 檢查失敗:`, error.message);
    }
  }

  console.log("\n=== 測試 3: 合約連接狀態 ===");
  
  try {
    // 檢查 Party 的設定
    console.log("\nParty 設定:");
    console.log("  - Hero 合約:", await partyV3.heroContract());
    console.log("  - Relic 合約:", await partyV3.relicContract());
    console.log("  - DungeonCore:", await partyV3.dungeonCoreContract());
    
    // 檢查 DungeonMasterV7 的設定
    console.log("\nDungeonMasterV7 設定:");
    console.log("  - DungeonCore:", await dungeonMasterV7.dungeonCore());
    console.log("  - DungeonStorage:", await dungeonMasterV7.dungeonStorage());
    console.log("  - SoulShardToken:", await dungeonMasterV7.soulShardToken());
  } catch (error) {
    console.log("⚠️ 無法讀取合約設定:", error.message);
  }

  console.log("\n✅ 測試完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
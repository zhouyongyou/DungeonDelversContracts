const hre = require("hardhat");

async function main() {
  console.log("🔍 診斷隊伍戰力問題...\n");

  const [signer] = await hre.ethers.getSigners();
  
  // 合約地址
  const partyAddress = "0xE0272e1D76de1F789ce0996F3226bCf54a8c7735";
  const dungeonMasterAddress = "0x0048396d13C8A505a09f4F839ae66Ef72007C512";
  const heroAddress = "0x929a4187a462314fCC480ff547019fA122A283f0";
  
  // 獲取合約實例
  const party = await hre.ethers.getContractAt("Party", partyAddress);
  const dungeonMaster = await hre.ethers.getContractAt("DungeonMasterV5", dungeonMasterAddress);
  const hero = await hre.ethers.getContractAt("Hero", heroAddress);
  
  // 測試隊伍 ID（請根據實際情況修改）
  const partyId = 1; // 或其他你要測試的隊伍 ID
  
  try {
    console.log(`📊 檢查隊伍 #${partyId}:`);
    
    // 1. 從 Party 合約直接讀取
    const composition = await party.getFullPartyComposition(partyId);
    console.log("\n從 Party 合約讀取:");
    console.log(`- 總戰力: ${composition.totalPower}`);
    console.log(`- 總容量: ${composition.totalCapacity}`);
    console.log(`- 隊伍稀有度: ${composition.partyRarity}`);
    console.log(`- 英雄 IDs: ${composition.heroIds}`);
    console.log(`- 聖物 IDs: ${composition.relicIds}`);
    
    // 2. 透過 getPartyComposition 讀取
    const [power, capacity] = await party.getPartyComposition(partyId);
    console.log("\n透過 getPartyComposition:");
    console.log(`- 戰力: ${power}`);
    console.log(`- 容量: ${capacity}`);
    
    // 3. 從 DungeonMasterV5 讀取
    const [dmPower, dmCapacity] = await dungeonMaster.getPartyPower(partyId);
    console.log("\n從 DungeonMasterV5 讀取:");
    console.log(`- 戰力: ${dmPower}`);
    console.log(`- 容量: ${dmCapacity}`);
    
    // 4. 檢查每個英雄的實際戰力
    console.log("\n檢查英雄實際戰力:");
    let actualTotalPower = 0;
    for (const heroId of composition.heroIds) {
      if (heroId > 0) {
        const heroStats = await hero.getHeroStats(heroId);
        console.log(`- 英雄 #${heroId}: 戰力 ${heroStats.power}`);
        actualTotalPower += Number(heroStats.power);
      }
    }
    console.log(`實際總戰力: ${actualTotalPower}`);
    
    // 5. 比較差異
    console.log("\n📊 診斷結果:");
    if (Number(power) !== actualTotalPower) {
      console.log("❌ 儲存的戰力與實際戰力不符!");
      console.log(`   儲存: ${power}, 實際: ${actualTotalPower}`);
    } else {
      console.log("✅ 儲存的戰力與實際戰力相符");
    }
    
    if (Number(power) !== Number(dmPower)) {
      console.log("❌ Party 合約與 DungeonMaster 讀取的戰力不同!");
      console.log(`   Party: ${power}, DungeonMaster: ${dmPower}`);
    } else {
      console.log("✅ Party 合約與 DungeonMaster 讀取的戰力相同");
    }
    
    // 6. 測試能否進入地城
    const dungeonId = 7; // 奇美拉之巢，需要 2100 戰力
    const [canEnter, reason] = await dungeonMaster.canEnterDungeon(partyId, dungeonId);
    console.log(`\n測試進入地城 #${dungeonId}:`);
    console.log(`- 可以進入: ${canEnter}`);
    console.log(`- 原因: ${reason}`);
    
  } catch (error) {
    console.error("錯誤:", error.message);
    if (error.data) {
      console.error("錯誤數據:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
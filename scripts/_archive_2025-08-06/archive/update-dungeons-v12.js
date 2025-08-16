const { ethers } = require("hardhat");

async function main() {
  console.log("🏰 更新地城數據到 V12 配置...\n");

  // 使用已部署的 DungeonMasterV8 地址
  const DUNGEONMASTER_ADDRESS = "0xD6B3Fb31C3B96570471ff5a9bbd1502334862697";
  
  const dungeonMaster = await ethers.getContractAt("DungeonMasterV8", DUNGEONMASTER_ADDRESS);
  
  console.log("📋 連接到 DungeonMaster V8:", DUNGEONMASTER_ADDRESS);
  console.log("🔄 開始更新地城數據...\n");

  // V12 更新的地城數據
  const dungeons = [
    { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: ethers.parseEther("29.3"), baseSuccessRate: 89 },
    { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: ethers.parseEther("62"), baseSuccessRate: 83 },
    { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: ethers.parseEther("97.5"), baseSuccessRate: 78 },
    { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: ethers.parseEther("135"), baseSuccessRate: 74 },
    { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: ethers.parseEther("175.6"), baseSuccessRate: 70 },
    { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: ethers.parseEther("300"), baseSuccessRate: 66 },
    { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: ethers.parseEther("410"), baseSuccessRate: 62 },
    { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: ethers.parseEther("515"), baseSuccessRate: 58 },
    { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: ethers.parseEther("680"), baseSuccessRate: 54 },
    { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: ethers.parseEther("850"), baseSuccessRate: 50 }
  ];

  // 批量更新地城
  for (const dungeon of dungeons) {
    try {
      console.log(`⏳ 更新地城 ${dungeon.id}: ${dungeon.name}...`);
      
      const tx = await dungeonMaster.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardAmountUSD,
        dungeon.baseSuccessRate
      );
      
      await tx.wait();
      
      console.log(`✅ 地城 ${dungeon.id} "${dungeon.name}" 更新成功`);
      console.log(`   - 需求戰力: ${dungeon.requiredPower}`);
      console.log(`   - 獎勵: $${ethers.formatEther(dungeon.rewardAmountUSD)}`);
      console.log(`   - 成功率: ${dungeon.baseSuccessRate}%\n`);
      
    } catch (error) {
      console.error(`❌ 更新地城 ${dungeon.id} 失敗:`, error.message);
    }
  }

  console.log("\n🎉 地城數據更新完成！");
  console.log("\n📊 更新摘要：");
  console.log("================");
  dungeons.forEach(d => {
    console.log(`${d.id}. ${d.name.padEnd(12, ' ')} | 戰力: ${d.requiredPower.toString().padEnd(4, ' ')} | 獎勵: $${ethers.formatEther(d.rewardAmountUSD).padEnd(6, ' ')} | 成功率: ${d.baseSuccessRate}%`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
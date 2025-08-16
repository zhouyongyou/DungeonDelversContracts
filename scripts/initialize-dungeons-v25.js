// scripts/initialize-dungeons-v25.js
// 初始化 V25 地城數據
// 可在部署時執行，也可單獨執行

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 地城配置
const DUNGEONS = [
  { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
  { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
  { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
  { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
  { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
  { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
  { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
  { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
  { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
  { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 },
  { id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 320, successRate: 39 },
  { id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 450, successRate: 34 }
];

async function main() {
  log('\n🏰 開始初始化 V25 地城數據...', 'magenta');
  log('='.repeat(70), 'magenta');
  
  const [deployer] = await ethers.getSigners();
  log(`👤 使用帳號: ${deployer.address}`, 'cyan');
  
  // V25 合約地址
  const DUNGEON_STORAGE_ADDRESS = process.env.DUNGEON_STORAGE_ADDRESS || "0x5D5D75a0bEF0Ce708d59749c0D9ba1a59fC24Cbb";
  const DUNGEON_MASTER_ADDRESS = process.env.DUNGEON_MASTER_ADDRESS || "0x395358733F69572C5744b561Ba61F0e16F32A571";
  
  log(`\n📍 合約地址:`, 'cyan');
  log(`   DungeonStorage: ${DUNGEON_STORAGE_ADDRESS}`, 'cyan');
  log(`   DungeonMaster: ${DUNGEON_MASTER_ADDRESS}`, 'cyan');
  
  // 獲取合約實例
  const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
  const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
  
  const dungeonStorage = DungeonStorage.attach(DUNGEON_STORAGE_ADDRESS);
  const dungeonMaster = DungeonMaster.attach(DUNGEON_MASTER_ADDRESS);
  
  // 檢查 DungeonMaster 是否已設置為 LogicContract
  log('\n🔍 檢查權限設置...', 'yellow');
  const logicContract = await dungeonStorage.logicContract();
  
  if (logicContract.toLowerCase() !== DUNGEON_MASTER_ADDRESS.toLowerCase()) {
    log(`⚠️  需要設置 DungeonMaster 為 LogicContract`, 'yellow');
    log(`   當前 LogicContract: ${logicContract}`, 'yellow');
    
    try {
      const tx = await dungeonStorage.setLogicContract(DUNGEON_MASTER_ADDRESS);
      await tx.wait();
      log(`✅ 已設置 DungeonMaster 為 LogicContract`, 'green');
    } catch (error) {
      log(`❌ 設置 LogicContract 失敗: ${error.message}`, 'red');
      log(`   請確保您是 DungeonStorage 的 owner`, 'red');
      return;
    }
  } else {
    log(`✅ DungeonMaster 已經是 LogicContract`, 'green');
  }
  
  // 檢查並初始化地城
  log('\n📊 檢查地城狀態...', 'yellow');
  
  let initialized = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const dungeon of DUNGEONS) {
    try {
      // 檢查地城是否已初始化
      const dungeonData = await dungeonStorage.getDungeon(dungeon.id);
      
      if (dungeonData.isInitialized) {
        // 檢查數據是否需要更新
        const currentPower = dungeonData.requiredPower.toString();
        const currentReward = ethers.formatEther(dungeonData.rewardAmountUSD);
        const currentRate = dungeonData.baseSuccessRate.toString();
        
        const targetPower = dungeon.requiredPower.toString();
        const targetReward = dungeon.rewardUSD.toString();
        const targetRate = dungeon.successRate.toString();
        
        if (currentPower === targetPower && 
            parseFloat(currentReward) === parseFloat(targetReward) && 
            currentRate === targetRate) {
          log(`⏭️  地城 #${dungeon.id} (${dungeon.name}) 已正確初始化，跳過`, 'cyan');
          skipped++;
          continue;
        } else {
          log(`🔄 地城 #${dungeon.id} (${dungeon.name}) 需要更新:`, 'yellow');
          log(`   戰力: ${currentPower} → ${targetPower}`, 'yellow');
          log(`   獎勵: ${currentReward} → ${targetReward} USD`, 'yellow');
          log(`   成功率: ${currentRate}% → ${targetRate}%`, 'yellow');
        }
      } else {
        log(`🆕 地城 #${dungeon.id} (${dungeon.name}) 未初始化`, 'yellow');
      }
      
      // 初始化或更新地城
      log(`⚙️  設置地城 #${dungeon.id}: ${dungeon.name}`, 'cyan');
      
      // 通過 DungeonMaster 調用 setDungeon
      // 注意：DungeonMaster 會調用 DungeonStorage 的 setDungeon
      const tx = await dungeonMaster.setDungeon(
        dungeon.id,
        dungeon.requiredPower,
        ethers.parseEther(dungeon.rewardUSD.toString()),
        dungeon.successRate
      );
      
      await tx.wait();
      log(`✅ 地城 #${dungeon.id} 設置成功`, 'green');
      initialized++;
      
    } catch (error) {
      log(`❌ 地城 #${dungeon.id} 設置失敗: ${error.message}`, 'red');
      failed++;
    }
  }
  
  // 顯示總結
  log('\n' + '='.repeat(70), 'magenta');
  log('📈 初始化總結:', 'magenta');
  log(`   ✅ 成功初始化: ${initialized} 個地城`, 'green');
  log(`   ⏭️  已經初始化: ${skipped} 個地城`, 'cyan');
  if (failed > 0) {
    log(`   ❌ 初始化失敗: ${failed} 個地城`, 'red');
  }
  log('='.repeat(70), 'magenta');
  
  // 驗證所有地城狀態
  log('\n🔍 驗證最終狀態...', 'yellow');
  let allInitialized = true;
  
  for (const dungeon of DUNGEONS) {
    try {
      const data = await dungeonStorage.getDungeon(dungeon.id);
      if (!data.isInitialized) {
        log(`❌ 地城 #${dungeon.id} 仍未初始化`, 'red');
        allInitialized = false;
      }
    } catch (error) {
      log(`❌ 無法驗證地城 #${dungeon.id}: ${error.message}`, 'red');
      allInitialized = false;
    }
  }
  
  if (allInitialized) {
    log('\n🎉 所有地城已成功初始化！', 'green');
  } else {
    log('\n⚠️  部分地城初始化失敗，請檢查並重試', 'yellow');
  }
}

// 執行腳本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

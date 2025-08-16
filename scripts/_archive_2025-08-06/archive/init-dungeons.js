#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// DungeonMaster 地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  "function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate)",
  "function getDungeon(uint256 _dungeonId) view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)"
];

// 地城參數（從用戶提供的參考值）
const DUNGEONS = [
  { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
  { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 83 },
  { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 78 },
  { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 27, successRate: 74 },
  { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 35, successRate: 70 },
  { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 60, successRate: 66 },
  { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 82, successRate: 62 },
  { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 103, successRate: 58 },
  { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 136, successRate: 54 },
  { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 50 }
];

async function initDungeons() {
  console.log('🏰 初始化地城參數...\n');
  
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);

  try {
    const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, deployer);
    
    // 檢查每個地城並初始化
    for (const dungeon of DUNGEONS) {
      console.log(`📍 地城 ${dungeon.id}: ${dungeon.name}`);
      
      try {
        // 檢查地城是否已初始化
        const dungeonData = await dungeonMaster.getDungeon(dungeon.id);
        
        if (dungeonData.isInitialized) {
          console.log(`   ℹ️  已初始化`);
          console.log(`   戰力需求: ${dungeonData.requiredPower}`);
          console.log(`   獎勵 USD: ${dungeonData.rewardAmountUSD}`);
          console.log(`   成功率: ${dungeonData.baseSuccessRate}%\n`);
          continue;
        }
      } catch (e) {
        // 如果讀取失敗，可能是還沒初始化
      }
      
      // 初始化地城
      console.log(`   ⚙️  正在初始化...`);
      console.log(`   戰力需求: ${dungeon.requiredPower}`);
      console.log(`   獎勵 USD: ${dungeon.rewardUSD}`);
      console.log(`   成功率: ${dungeon.successRate}%`);
      
      const tx = await dungeonMaster.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardUSD,
        dungeon.successRate
      );
      
      console.log(`   交易哈希: ${tx.hash}`);
      console.log('   ⏳ 等待確認...');
      await tx.wait();
      console.log('   ✅ 初始化成功\n');
    }
    
    // 驗證所有地城
    console.log('🔍 驗證所有地城設置...\n');
    for (const dungeon of DUNGEONS) {
      const dungeonData = await dungeonMaster.getDungeon(dungeon.id);
      console.log(`地城 ${dungeon.id}: ${dungeon.name}`);
      console.log(`  戰力需求: ${dungeonData.requiredPower} (預期: ${dungeon.requiredPower})`);
      console.log(`  獎勵 USD: ${dungeonData.rewardAmountUSD} (預期: ${dungeon.rewardUSD})`);
      console.log(`  成功率: ${dungeonData.baseSuccessRate}% (預期: ${dungeon.successRate}%)`);
      console.log(`  已初始化: ${dungeonData.isInitialized}\n`);
    }
    
    console.log('✅ 地城參數初始化完成！');
    
  } catch (error) {
    console.error('\n❌ 初始化失敗:', error);
    process.exit(1);
  }
}

// 執行初始化
initDungeons().catch(console.error);
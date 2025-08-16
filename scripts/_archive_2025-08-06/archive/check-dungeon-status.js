// 檢查地城狀態
const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// DungeonMaster 地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  "function getDungeon(uint256 _dungeonId) view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))"
];

async function checkDungeonStatus() {
  console.log('🔍 檢查地城狀態\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const dungeonMaster = new ethers.Contract(
    DUNGEONMASTER_ADDRESS,
    DUNGEONMASTER_ABI,
    signer
  );
  
  const dungeonNames = [
    "新手礦洞", "哥布林洞穴", "食人魔山谷", "蜘蛛巢穴", "石化蜥蜴沼澤",
    "巫妖墓穴", "奇美拉之巢", "惡魔前哨站", "巨龍之巔", "混沌深淵"
  ];
  
  console.log('📊 地城狀態：\n');
  
  for (let i = 1; i <= 10; i++) {
    try {
      const dungeon = await dungeonMaster.getDungeon(i);
      
      console.log(`地城 #${i} - ${dungeonNames[i-1]}:`);
      console.log(`  初始化: ${dungeon.isInitialized ? '✅ 是' : '❌ 否'}`);
      
      if (dungeon.isInitialized) {
        console.log(`  戰力要求: ${dungeon.requiredPower}`);
        console.log(`  獎勵: $${ethers.formatEther(dungeon.rewardAmountUSD)}`);
        console.log(`  成功率: ${dungeon.baseSuccessRate}%`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`地城 #${i}: ❌ 讀取失敗 - ${error.message}\n`);
    }
  }
}

checkDungeonStatus().catch(console.error);
// 直接初始化地城 - 簡化版本
const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// DungeonMaster 地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonMaster ABI (只包含需要的函數)
const DUNGEONMASTER_ABI = [
  "function initializeDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external",
  "function getDungeon(uint256 _dungeonId) view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))",
  "function owner() view returns (address)",
  "function paused() view returns (bool)"
];

async function initializeDungeons() {
  console.log('🏰 直接初始化地城參數\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  console.log(`🎯 DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
  
  const dungeonMaster = new ethers.Contract(
    DUNGEONMASTER_ADDRESS,
    DUNGEONMASTER_ABI,
    signer
  );
  
  // 地城配置
  const dungeons = [
    { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: "6", baseSuccessRate: 89 },
    { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: "12", baseSuccessRate: 83 },
    { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: "20", baseSuccessRate: 78 },
    { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: "27", baseSuccessRate: 74 },
    { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: "35", baseSuccessRate: 70 },
    { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: "60", baseSuccessRate: 66 },
    { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: "82", baseSuccessRate: 62 },
    { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: "103", baseSuccessRate: 58 },
    { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: "136", baseSuccessRate: 54 },
    { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: "225", baseSuccessRate: 50 }
  ];
  
  try {
    // 檢查 owner
    const owner = await dungeonMaster.owner();
    console.log(`\n📋 DungeonMaster Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ 錯誤: 您不是 DungeonMaster 的 owner');
      return;
    }
    
    // 檢查是否暫停
    const isPaused = await dungeonMaster.paused();
    if (isPaused) {
      console.log('⚠️  警告: DungeonMaster 合約已暫停');
    }
    
    console.log('\n📊 開始初始化地城...\n');
    
    for (const dungeon of dungeons) {
      console.log(`⚙️  初始化地城 #${dungeon.id}: ${dungeon.name}`);
      console.log(`   戰力要求: ${dungeon.requiredPower}`);
      console.log(`   獎勵: $${dungeon.rewardUSD}`);
      console.log(`   成功率: ${dungeon.baseSuccessRate}%`);
      
      try {
        // 檢查是否已初始化
        const data = await dungeonMaster.getDungeon(dungeon.id);
        if (data.isInitialized) {
          console.log(`   ✅ 已初始化，跳過\n`);
          continue;
        }
      } catch (e) {
        // 如果讀取失敗，繼續初始化
      }
      
      try {
        const tx = await dungeonMaster.initializeDungeon(
          dungeon.id,
          dungeon.requiredPower,
          ethers.parseEther(dungeon.rewardUSD),
          dungeon.baseSuccessRate
        );
        console.log(`   📤 交易哈希: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ 初始化成功\n`);
      } catch (error) {
        console.log(`   ❌ 初始化失敗: ${error.message}\n`);
      }
    }
    
    console.log('🎉 地城初始化流程完成！');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

initializeDungeons().catch(console.error);
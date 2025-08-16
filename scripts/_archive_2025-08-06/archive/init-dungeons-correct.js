// 使用正確的函數名稱初始化地城
const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  "function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external",
  "function dungeonStorage() view returns (address)",
  "function owner() view returns (address)"
];

// DungeonStorage ABI
const DUNGEONSTORAGE_ABI = [
  "function getDungeon(uint256 _dungeonId) view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))"
];

async function initializeDungeons() {
  console.log('🏰 使用 adminSetDungeon 初始化地城\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
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
    // 獲取 DungeonStorage 地址
    const dungeonStorageAddress = await dungeonMaster.dungeonStorage();
    console.log(`📦 DungeonStorage: ${dungeonStorageAddress}`);
    
    const dungeonStorage = new ethers.Contract(
      dungeonStorageAddress,
      DUNGEONSTORAGE_ABI,
      provider
    );
    
    console.log('\n📊 檢查地城狀態...\n');
    
    // 先檢查哪些需要初始化
    for (const dungeon of dungeons) {
      try {
        const data = await dungeonStorage.getDungeon(dungeon.id);
        
        if (data.isInitialized) {
          console.log(`地城 #${dungeon.id} ${dungeon.name}: ✅ 已初始化`);
          console.log(`  當前設置 - 戰力: ${data.requiredPower}, 獎勵: $${ethers.formatEther(data.rewardAmountUSD)}, 成功率: ${data.baseSuccessRate}%`);
        } else {
          console.log(`地城 #${dungeon.id} ${dungeon.name}: ❌ 未初始化`);
        }
      } catch (e) {
        console.log(`地城 #${dungeon.id} ${dungeon.name}: ❌ 讀取失敗`);
      }
    }
    
    console.log('\n📤 開始設置地城...\n');
    
    for (const dungeon of dungeons) {
      console.log(`⚙️  設置地城 #${dungeon.id}: ${dungeon.name}`);
      
      try {
        const tx = await dungeonMaster.adminSetDungeon(
          dungeon.id,
          dungeon.requiredPower,
          ethers.parseEther(dungeon.rewardUSD),
          dungeon.baseSuccessRate
        );
        console.log(`   📤 交易哈希: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ 設置成功\n`);
      } catch (error) {
        console.log(`   ❌ 設置失敗: ${error.message}\n`);
      }
    }
    
    console.log('🎉 地城設置流程完成！');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

initializeDungeons().catch(console.error);
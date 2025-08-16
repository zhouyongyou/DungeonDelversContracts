const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// DungeonMaster 地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  "function dungeonStorage() view returns (address)",
  "function dungeonCore() view returns (address)",
  "function soulShardToken() view returns (address)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)"
];

async function checkDungeonMasterConfig() {
  console.log('🔍 檢查 DungeonMaster 配置\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dungeonMaster = new ethers.Contract(
    DUNGEONMASTER_ADDRESS,
    DUNGEONMASTER_ABI,
    provider
  );
  
  try {
    console.log(`📋 DungeonMaster 地址: ${DUNGEONMASTER_ADDRESS}`);
    
    const owner = await dungeonMaster.owner();
    console.log(`👤 Owner: ${owner}`);
    
    const isPaused = await dungeonMaster.paused();
    console.log(`⏸️  Paused: ${isPaused}`);
    
    const dungeonStorage = await dungeonMaster.dungeonStorage();
    console.log(`\n📦 DungeonStorage: ${dungeonStorage}`);
    
    const dungeonCore = await dungeonMaster.dungeonCore();
    console.log(`🏰 DungeonCore: ${dungeonCore}`);
    
    const soulShardToken = await dungeonMaster.soulShardToken();
    console.log(`💎 SoulShardToken: ${soulShardToken}`);
    
    if (dungeonStorage === ethers.ZeroAddress) {
      console.log('\n❌ DungeonStorage 未設置！這就是為什麼地城初始化失敗。');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

checkDungeonMasterConfig().catch(console.error);
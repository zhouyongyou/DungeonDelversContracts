#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';
const DUNGEONSTORAGE_ADDRESS = '0x17Bd4d145D7dA47833D797297548039D4E666a8f';

// 正確的 ABIs
const DUNGEONMASTER_ABI = [
  "function COOLDOWN_PERIOD() view returns (uint256)",
  "function dungeonStorage() view returns (address)",
  "function explorationFee() view returns (uint256)",
  "function provisionPriceUSD() view returns (uint256)",
  "function globalRewardMultiplier() view returns (uint256)"
];

const DUNGEONSTORAGE_ABI = [
  "function dungeons(uint256) view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)",
  "function NUM_DUNGEONS() view returns (uint256)"
];

async function readParamsCorrectly() {
  console.log('📊 正確讀取所有參數...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, provider);
  const dungeonStorage = new ethers.Contract(DUNGEONSTORAGE_ADDRESS, DUNGEONSTORAGE_ABI, provider);

  // 1. 讀取 DungeonMaster 參數
  console.log('⚔️ DungeonMaster 參數:');
  
  try {
    const cooldown = await dungeonMaster.COOLDOWN_PERIOD();
    console.log(`  冷卻時間: ${cooldown} 秒 (${cooldown / 3600} 小時)`);
  } catch (e) {
    console.log(`  冷卻時間: ❌ 讀取失敗`);
  }
  
  try {
    const fee = await dungeonMaster.explorationFee();
    console.log(`  探索費用: ${ethers.formatEther(fee)} BNB`);
  } catch (e) {
    console.log(`  探索費用: ❌ 讀取失敗`);
  }
  
  try {
    const provisionPrice = await dungeonMaster.provisionPriceUSD();
    console.log(`  補給價格: ${ethers.formatEther(provisionPrice)} USD`);
  } catch (e) {
    console.log(`  補給價格: ❌ 讀取失敗`);
  }
  
  try {
    const multiplier = await dungeonMaster.globalRewardMultiplier();
    console.log(`  全局獎勵倍率: ${multiplier / 10}%`);
  } catch (e) {
    console.log(`  全局獎勵倍率: ❌ 讀取失敗`);
  }

  // 2. 讀取地城數據
  console.log('\n🏰 地城數據 (從 DungeonStorage):');
  
  try {
    const numDungeons = await dungeonStorage.NUM_DUNGEONS();
    console.log(`  總地城數: ${numDungeons}\n`);
    
    // 顯示前 5 個地城
    for (let i = 1; i <= Math.min(5, Number(numDungeons)); i++) {
      const dungeon = await dungeonStorage.dungeons(i);
      console.log(`  地城 #${i}:`);
      console.log(`    戰力需求: ${dungeon.requiredPower}`);
      console.log(`    獎勵: ${dungeon.rewardAmountUSD} USD`);
      console.log(`    成功率: ${dungeon.baseSuccessRate}%`);
      console.log(`    已初始化: ${dungeon.isInitialized ? '✅' : '❌'}\n`);
    }
  } catch (e) {
    console.log(`  ❌ 讀取失敗: ${e.message}`);
  }

  // 3. 前端應該如何讀取
  console.log('💡 前端正確的讀取方式:');
  console.log('1. 冷卻時間: 讀取 DungeonMaster.COOLDOWN_PERIOD() - 這是常量');
  console.log('2. 地城數據: ');
  console.log('   - 先從 DungeonMaster.dungeonStorage() 獲取 DungeonStorage 地址');
  console.log('   - 再從 DungeonStorage.dungeons(id) 讀取每個地城的數據');
  console.log('3. 探索費用: 讀取 DungeonMaster.explorationFee()');
}

// 執行讀取
readParamsCorrectly().catch(console.error);
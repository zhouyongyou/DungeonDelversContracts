#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';
const DUNGEONSTORAGE_ADDRESS = '0x17Bd4d145D7dA47833D797297548039D4E666a8f';

// ABIs
const DUNGEONMASTER_ABI = [
  "function getDungeon(uint256 _dungeonId) view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)",
  "function challengeCooldown() view returns (uint256)",
  "function COOLDOWN_PERIOD() view returns (uint256)",
  "function dungeonStorage() view returns (address)"
];

const DUNGEONSTORAGE_ABI = [
  "function getDungeon(uint256 _dungeonId) view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))",
  "function dungeons(uint256) view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)"
];

async function checkDungeonAndCooldown() {
  console.log('🔍 檢查地城初始化和冷卻時間...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);

  // 1. 檢查 DungeonMaster
  console.log('⚔️ DungeonMaster 檢查:');
  const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, provider);
  
  // 檢查 DungeonStorage 連接
  try {
    const storageAddress = await dungeonMaster.dungeonStorage();
    console.log(`  DungeonStorage: ${storageAddress}`);
    console.log(`  預期: ${DUNGEONSTORAGE_ADDRESS}`);
    console.log(`  匹配: ${storageAddress.toLowerCase() === DUNGEONSTORAGE_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
  } catch (e) {
    console.log(`  DungeonStorage: ❌ 讀取失敗`);
  }
  
  // 檢查冷卻時間
  console.log('\n  冷卻時間檢查:');
  try {
    const cooldown = await dungeonMaster.challengeCooldown();
    console.log(`    challengeCooldown(): ${cooldown} 秒`);
  } catch (e) {
    console.log(`    challengeCooldown(): ❌ 函數不存在`);
  }
  
  try {
    const cooldownPeriod = await dungeonMaster.COOLDOWN_PERIOD();
    console.log(`    COOLDOWN_PERIOD(): ${cooldownPeriod} 秒 (${cooldownPeriod / 3600} 小時)`);
  } catch (e) {
    console.log(`    COOLDOWN_PERIOD(): ❌ 函數不存在`);
  }

  // 2. 檢查地城數據（從 DungeonMaster）
  console.log('\n🏰 地城數據（通過 DungeonMaster）:');
  for (let i = 1; i <= 3; i++) {
    try {
      const dungeon = await dungeonMaster.getDungeon(i);
      console.log(`  地城 ${i}:`);
      console.log(`    戰力需求: ${dungeon.requiredPower}`);
      console.log(`    獎勵: ${dungeon.rewardAmountUSD} USD`);
      console.log(`    成功率: ${dungeon.baseSuccessRate}%`);
      console.log(`    已初始化: ${dungeon.isInitialized}`);
    } catch (e) {
      console.log(`  地城 ${i}: ❌ 讀取失敗`);
    }
  }

  // 3. 直接檢查 DungeonStorage
  console.log('\n💾 地城數據（直接從 DungeonStorage）:');
  const dungeonStorage = new ethers.Contract(DUNGEONSTORAGE_ADDRESS, DUNGEONSTORAGE_ABI, provider);
  
  for (let i = 1; i <= 3; i++) {
    try {
      const dungeon = await dungeonStorage.dungeons(i);
      console.log(`  地城 ${i}:`);
      console.log(`    戰力需求: ${dungeon.requiredPower}`);
      console.log(`    獎勵: ${dungeon.rewardAmountUSD} USD`);
      console.log(`    成功率: ${dungeon.baseSuccessRate}%`);
      console.log(`    已初始化: ${dungeon.isInitialized}`);
    } catch (e) {
      console.log(`  地城 ${i}: ❌ 讀取失敗 - ${e.message}`);
    }
  }
}

// 執行檢查
checkDungeonAndCooldown().catch(console.error);
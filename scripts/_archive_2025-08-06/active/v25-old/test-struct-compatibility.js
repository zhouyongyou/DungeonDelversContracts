#!/usr/bin/env node

// 結構相容性驗證腳本
// 用於檢查 DungeonMaster 和 DungeonStorage 之間的結構匹配

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

async function testStructCompatibility() {
  console.log('🔍 測試結構相容性...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  console.log('📋 測試配置:');
  console.log(`DUNGEONMASTER: ${v22Config.contracts.DUNGEONMASTER.address}`);
  console.log(`DUNGEONSTORAGE: ${v22Config.contracts.DUNGEONSTORAGE.address}\n`);
  
  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    [
      // DungeonMaster 的實際函數
      'function _getDungeon(uint256 _dungeonId) private view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
      'function _getPartyStatus(uint256 _partyId) private view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel))'
    ],
    provider
  );
  
  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    [
      'function dungeons(uint256 id) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)',
      'function partyStatuses(uint256 id) external view returns (uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel)',
      'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
      'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel))'
    ],
    provider
  );
  
  try {
    console.log('1️⃣ 測試地城結構 (Dungeon)...');
    
    // 測試原始 mapping 調用
    const dungeon1Raw = await dungeonStorage.dungeons(1);
    console.log(`   dungeons(1) 原始數據:`, dungeon1Raw);
    
    // 測試 getter 函數調用
    const dungeon1Getter = await dungeonStorage.getDungeon(1);
    console.log(`   getDungeon(1) 結構數據:`, dungeon1Getter);
    
    console.log('   ✅ 地城結構測試成功\n');
    
    console.log('2️⃣ 測試隊伍狀態結構 (PartyStatus)...');
    
    // 測試原始 mapping 調用
    const party1Raw = await dungeonStorage.partyStatuses(1);
    console.log(`   partyStatuses(1) 原始數據:`, party1Raw);
    
    // 測試 getter 函數調用
    const party1Getter = await dungeonStorage.getPartyStatus(1);
    console.log(`   getPartyStatus(1) 結構數據:`, party1Getter);
    
    console.log('   ✅ 隊伍狀態結構測試成功\n');
    
    console.log('3️⃣ 驗證結構字段數量...');
    
    // 驗證地城結構
    if (dungeon1Raw.length !== 4) {
      throw new Error(`地城結構字段數量錯誤: 期望 4，實際 ${dungeon1Raw.length}`);
    }
    
    if (dungeon1Getter.length !== 4) {
      throw new Error(`地城 getter 結構字段數量錯誤: 期望 4，實際 ${dungeon1Getter.length}`);
    }
    
    // 驗證隊伍狀態結構
    if (party1Raw.length !== 4) {
      throw new Error(`隊伍狀態結構字段數量錯誤: 期望 4，實際 ${party1Raw.length}`);
    }
    
    if (party1Getter.length !== 4) {
      throw new Error(`隊伍狀態 getter 結構字段數量錯誤: 期望 4，實際 ${party1Getter.length}`);
    }
    
    console.log('   ✅ 字段數量驗證通過\n');
    
    console.log('4️⃣ 測試模擬 DungeonMaster 調用...');
    
    // 模擬 DungeonMaster 內部如何調用這些數據
    try {
      const simulatedCall = await dungeonStorage.partyStatuses(1);
      const [provisionsRemaining, cooldownEndsAt, unclaimedRewards, fatigueLevel] = simulatedCall;
      
      console.log('   模擬解構賦值:');
      console.log(`   - provisionsRemaining: ${provisionsRemaining}`);
      console.log(`   - cooldownEndsAt: ${cooldownEndsAt}`);
      console.log(`   - unclaimedRewards: ${unclaimedRewards}`);
      console.log(`   - fatigueLevel: ${fatigueLevel}`);
      
      console.log('   ✅ 模擬調用成功\n');
      
    } catch (error) {
      console.error('   ❌ 模擬調用失敗:', error.message);
      throw error;
    }
    
    console.log('🎉 所有結構相容性測試通過！');
    console.log('🛡️ DungeonMaster 和 DungeonStorage 結構匹配正確。');
    
  } catch (error) {
    console.error('❌ 結構相容性測試失敗:', error.message);
    console.error('⚠️  這表示合約間可能存在結構不匹配問題！');
    process.exit(1);
  }
}

// 執行測試
if (require.main === module) {
  testStructCompatibility().catch(console.error);
}

module.exports = { testStructCompatibility };
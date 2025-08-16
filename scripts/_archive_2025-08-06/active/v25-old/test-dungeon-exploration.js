#!/usr/bin/env node

// 測試地城探索功能

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  'function exploreDungeon(uint256 partyId, uint256 dungeonId) external',
  'function requestExpedition(uint256 partyId, uint256 dungeonId) external payable'
];

// Party ABI
const PARTY_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function getPartyPowerQuick(uint256 _partyId) public view returns (uint256)'
];

// DungeonStorage ABI  
const DUNGEONSTORAGE_ABI = [
  'function getDungeon(uint256 dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 successRate) dungeon)',
  'function getPartyStatus(uint256 partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel) status)'
];

async function testDungeonExploration() {
  console.log('🎮 測試地城探索功能...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const player = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 玩家地址: ${player.address}\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEONMASTER_ABI,
    player
  );
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );
  
  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    DUNGEONSTORAGE_ABI,
    provider
  );

  try {
    // 1. 先檢查隊伍
    const partyId = 1; // 使用隊伍 ID 1

    console.log(`\n📋 檢查隊伍 ${partyId}...`);
    
    try {
      const owner = await party.ownerOf(partyId);
      console.log(`隊伍擁有者: ${owner}`);
      
      const power = await party.getPartyPowerQuick(partyId);
      console.log(`隊伍戰力: ${power}`);
      
      if (owner.toLowerCase() !== player.address.toLowerCase()) {
        console.log('❌ 你不是這個隊伍的擁有者');
        return;
      }
    } catch (error) {
      console.log(`❌ 無法獲取隊伍信息: ${error.message}`);
      return;
    }
    
    // 2. 檢查隊伍冷卻狀態
    console.log('\n📋 檢查隊伍冷卻狀態...');
    try {
      const partyStatus = await dungeonStorage.getPartyStatus(partyId);
      const cooldownEndsAt = BigInt(partyStatus.cooldownEndsAt);
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const isOnCooldown = currentTime < cooldownEndsAt;
      
      console.log(`冷卻結束時間: ${new Date(Number(cooldownEndsAt) * 1000).toLocaleString()}`);
      console.log(`可以遊玩: ${!isOnCooldown ? '✅' : '❌'}`);
      
      if (isOnCooldown) {
        const timeRemaining = Number(cooldownEndsAt - currentTime);
        console.log(`冷卻時間剩餘: ${timeRemaining} 秒`);
        return;
      }
    } catch (error) {
      console.log(`⚠️ 無法獲取隊伍狀態: ${error.message}`);
      console.log('假設隊伍沒有冷卻限制，繼續執行...');
    }

    // 3. 選擇地城
    const dungeonId = 1; // 新手礦洞
    console.log(`\n📋 檢查地城 ${dungeonId}...`);
    
    try {
      const dungeon = await dungeonStorage.getDungeon(dungeonId);
      console.log(`需求戰力: ${dungeon.requiredPower}`);
      console.log(`獎勵 USD: ${ethers.formatUnits(dungeon.rewardAmountUSD, 18)}`);
      console.log(`成功率: ${dungeon.successRate}%`);
    } catch (error) {
      console.log(`❌ 無法獲取地城信息: ${error.message}`);
    }

    // 4. 執行探索
    console.log('\n🚀 執行地城探索...');
    console.log(`隊伍 ID: ${partyId}, 地城 ID: ${dungeonId}`);
    
    try {
      const tx = await dungeonMaster.exploreDungeon(partyId, dungeonId);
      console.log(`交易哈希: ${tx.hash}`);
      console.log('等待確認...');
      
      const receipt = await tx.wait();
      console.log(`✅ 探索成功！區塊: ${receipt.blockNumber}`);
      
      // 解析事件
      console.log('\n📋 探索結果：');
      const events = receipt.logs;
      console.log(`事件數量: ${events.length}`);
      
    } catch (error) {
      console.log(`❌ 探索失敗: ${error.message}`);
      
      // 詳細錯誤分析
      if (error.message.includes('execution reverted')) {
        console.log('\n🔍 錯誤分析：');
        if (error.message.includes('Party is on cooldown')) {
          console.log('原因: 隊伍在冷卻中');
        } else if (error.message.includes('Party power too low')) {
          console.log('原因: 隊伍戰力不足');
        } else if (error.message.includes('Dungeon does not exist')) {
          console.log('原因: 地城不存在');
        } else if (error.message.includes('Party not owned by player')) {
          console.log('原因: 隊伍不屬於玩家');
        } else {
          console.log('原因: 未知錯誤');
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message);
  }
}

// 執行測試
if (require.main === module) {
  testDungeonExploration().catch(console.error);
}

module.exports = { testDungeonExploration };
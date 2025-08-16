#!/usr/bin/env node

// 測試地城探索功能 - 適配 DungeonMasterV2

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// DungeonMaster V2 ABI
const DUNGEONMASTER_ABI = [
  'function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable',
  'function buyProvisions(uint256 _partyId, uint256 _amount) external',
  'function explorationFee() public view returns (uint256)',
  'function COOLDOWN_PERIOD() public view returns (uint256)'
];

// DungeonStorage ABI
const DUNGEONSTORAGE_ABI = [
  'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 bankedRewards) status)',
  'function getDungeon(uint256 dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 successRate, bool isInitialized) dungeon)'
];

// Party ABI
const PARTY_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function getPartyPowerQuick(uint256 _partyId) public view returns (uint256)'
];

async function testDungeonExplorationV2() {
  console.log('🎮 測試地城探索功能 (V2)...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const player = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 玩家地址: ${player.address}\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEONMASTER_ABI,
    player
  );
  
  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    DUNGEONSTORAGE_ABI,
    provider
  );
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );

  try {
    // 1. 獲取探索費用
    console.log('📋 獲取遊戲參數...');
    const explorationFee = await dungeonMaster.explorationFee();
    const cooldownPeriod = await dungeonMaster.COOLDOWN_PERIOD();
    console.log(`探索費用: ${ethers.formatEther(explorationFee)} BNB`);
    console.log(`冷卻時間: ${cooldownPeriod} 秒 (${Number(cooldownPeriod) / 3600} 小時)`);

    // 2. 檢查隊伍
    const partyId = 1;
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

    // 3. 檢查隊伍狀態
    console.log(`\n📋 檢查隊伍狀態...`);
    try {
      const status = await dungeonStorage.getPartyStatus(partyId);
      console.log(`儲備數量: ${status.provisionsRemaining}`);
      console.log(`冷卻結束時間: ${new Date(Number(status.cooldownEndsAt) * 1000).toLocaleString()}`);
      console.log(`銀行獎勵: ${ethers.formatUnits(status.bankedRewards, 18)} SOUL`);
      
      const now = Math.floor(Date.now() / 1000);
      const cooldownEndsAt = Number(status.cooldownEndsAt);
      
      if (now < cooldownEndsAt) {
        console.log(`❌ 隊伍在冷卻中，還需等待 ${cooldownEndsAt - now} 秒`);
        return;
      } else {
        console.log('✅ 隊伍可以探索');
      }
    } catch (error) {
      console.log(`⚠️ 無法獲取隊伍狀態（可能是新隊伍）: ${error.message}`);
    }

    // 4. 選擇地城
    const dungeonId = 1;
    console.log(`\n📋 檢查地城 ${dungeonId}...`);
    
    try {
      const dungeon = await dungeonStorage.getDungeon(dungeonId);
      console.log(`需求戰力: ${dungeon.requiredPower}`);
      console.log(`獎勵 USD: ${ethers.formatUnits(dungeon.rewardAmountUSD, 18)}`);
      console.log(`成功率: ${dungeon.successRate}%`);
      console.log(`已初始化: ${dungeon.isInitialized ? '✅' : '❌'}`);
      
      if (!dungeon.isInitialized) {
        console.log('❌ 地城未初始化');
        return;
      }
    } catch (error) {
      console.log(`❌ 無法獲取地城信息: ${error.message}`);
    }

    // 5. 執行探索
    console.log('\n🚀 執行地城探索...');
    console.log(`隊伍 ID: ${partyId}, 地城 ID: ${dungeonId}`);
    console.log(`需要支付: ${ethers.formatEther(explorationFee)} BNB`);
    
    try {
      // 增加一些額外的 gas，以防費用不足
      const tx = await dungeonMaster.requestExpedition(partyId, dungeonId, {
        value: ethers.parseEther("0.002") // 使用 0.002 BNB 以確保足夠
      });
      console.log(`交易哈希: ${tx.hash}`);
      console.log('等待確認...');
      
      const receipt = await tx.wait();
      console.log(`✅ 探索成功！區塊: ${receipt.blockNumber}`);
      
      // 解析事件
      console.log('\n📋 探索結果：');
      console.log(`Gas 使用: ${receipt.gasUsed}`);
      console.log(`事件數量: ${receipt.logs.length}`);
      
    } catch (error) {
      console.log(`❌ 探索失敗: ${error.message}`);
      
      // 詳細錯誤分析
      if (error.message.includes('execution reverted')) {
        console.log('\n🔍 錯誤分析：');
        if (error.message.includes('Not party owner')) {
          console.log('原因: 不是隊伍擁有者');
        } else if (error.message.includes('BNB fee not met')) {
          console.log('原因: BNB 費用不足');
        } else if (error.message.includes('Party on cooldown')) {
          console.log('原因: 隊伍在冷卻中');
        } else if (error.message.includes('Dungeon DNE')) {
          console.log('原因: 地城不存在');
        } else if (error.message.includes('Party power too low')) {
          console.log('原因: 隊伍戰力不足');
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
  testDungeonExplorationV2().catch(console.error);
}

module.exports = { testDungeonExplorationV2 };
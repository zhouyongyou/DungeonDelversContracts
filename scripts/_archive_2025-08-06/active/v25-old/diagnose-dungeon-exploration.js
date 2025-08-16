#!/usr/bin/env node

// 深入診斷地城探索問題

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// 診斷腳本 - 不需要私鑰
async function diagnoseDungeonExploration() {
  console.log('🔍 深入診斷地城探索問題...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 1. 檢查 DungeonCore 的 Party 地址
  console.log('📋 Step 1: 檢查 DungeonCore 的 Party 地址');
  const dungeonCoreAbi = ['function partyContractAddress() public view returns (address)'];
  const dungeonCore = new ethers.Contract(v22Config.contracts.DUNGEONCORE.address, dungeonCoreAbi, provider);
  
  try {
    const partyAddress = await dungeonCore.partyContractAddress();
    console.log(`DungeonCore.partyContractAddress: ${partyAddress}`);
    console.log(`預期地址: ${v22Config.contracts.PARTY.address}`);
    console.log(`匹配: ${partyAddress.toLowerCase() === v22Config.contracts.PARTY.address.toLowerCase() ? '✅' : '❌'}\n`);
  } catch (error) {
    console.log(`❌ 錯誤: ${error.message}\n`);
  }
  
  // 2. 模擬 requestExpedition 的第一步
  console.log('📋 Step 2: 模擬 requestExpedition 調用鏈');
  
  // 2a. 獲取 Party 合約實例
  const partyAbi = [
    'function ownerOf(uint256 tokenId) public view returns (address)',
    'function getPartyComposition(uint256 _partyId) external view returns (uint256 totalPower, uint256 totalCapacity)'
  ];
  const party = new ethers.Contract(v22Config.contracts.PARTY.address, partyAbi, provider);
  
  const partyId = 1;
  const dungeonId = 1;
  const testAddress = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
  
  try {
    console.log(`檢查隊伍 ${partyId} 擁有者...`);
    const owner = await party.ownerOf(partyId);
    console.log(`隊伍擁有者: ${owner}`);
    console.log(`測試地址: ${testAddress}`);
    console.log(`是擁有者: ${owner.toLowerCase() === testAddress.toLowerCase() ? '✅' : '❌'}\n`);
  } catch (error) {
    console.log(`❌ 無法獲取隊伍擁有者: ${error.message}\n`);
  }
  
  // 2b. 檢查 DungeonStorage
  console.log('📋 Step 3: 檢查 DungeonStorage');
  const storageAbi = [
    'function getDungeon(uint256 dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) dungeon)',
    'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards) status)'
  ];
  const storage = new ethers.Contract(v22Config.contracts.DUNGEONSTORAGE.address, storageAbi, provider);
  
  try {
    const dungeon = await storage.getDungeon(dungeonId);
    console.log(`地城 ${dungeonId} 信息:`);
    console.log(`  需求戰力: ${dungeon.requiredPower}`);
    console.log(`  獎勵 USD: ${ethers.formatUnits(dungeon.rewardAmountUSD, 18)}`);
    console.log(`  成功率: ${dungeon.baseSuccessRate}%`);
    console.log(`  已初始化: ${dungeon.isInitialized ? '✅' : '❌'}\n`);
  } catch (error) {
    console.log(`❌ 無法獲取地城信息: ${error.message}\n`);
  }
  
  try {
    const status = await storage.getPartyStatus(partyId);
    console.log(`隊伍 ${partyId} 狀態:`);
    console.log(`  儲備: ${status.provisionsRemaining}`);
    console.log(`  冷卻結束: ${new Date(Number(status.cooldownEndsAt) * 1000).toLocaleString()}`);
    console.log(`  未領取獎勵: ${ethers.formatUnits(status.unclaimedRewards || '0', 18)} SOUL\n`);
  } catch (error) {
    console.log(`❌ 無法獲取隊伍狀態: ${error.message}\n`);
  }
  
  // 2c. 檢查隊伍戰力
  console.log('📋 Step 4: 檢查隊伍戰力');
  try {
    const [totalPower, totalCapacity] = await party.getPartyComposition(partyId);
    console.log(`隊伍總戰力: ${totalPower}`);
    console.log(`隊伍總容量: ${totalCapacity}\n`);
  } catch (error) {
    console.log(`❌ 無法獲取隊伍組成: ${error.message}\n`);
  }
  
  // 3. 檢查其他可能的問題
  console.log('📋 Step 5: 檢查 DungeonMaster 合約狀態');
  const dmAbi = [
    'function paused() public view returns (bool)',
    'function owner() public view returns (address)',
    'function explorationFee() public view returns (uint256)'
  ];
  const dm = new ethers.Contract(v22Config.contracts.DUNGEONMASTER.address, dmAbi, provider);
  
  try {
    const isPaused = await dm.paused();
    console.log(`合約暫停: ${isPaused ? '❌ 是' : '✅ 否'}`);
  } catch (error) {
    console.log(`無法檢查暫停狀態: ${error.message}`);
  }
  
  try {
    const owner = await dm.owner();
    console.log(`合約擁有者: ${owner}`);
  } catch (error) {
    console.log(`無法獲取擁有者: ${error.message}`);
  }
  
  // 4. 總結
  console.log('\n📊 診斷總結：');
  console.log('基於以上檢查，可能的問題：');
  console.log('1. DungeonMaster 合約可能處於暫停狀態');
  console.log('2. 合約內部邏輯可能有其他檢查失敗');
  console.log('3. 可能需要檢查 DungeonMaster 的字節碼是否正確部署');
  console.log('\n建議：');
  console.log('1. 檢查 DungeonMaster 是否被暫停');
  console.log('2. 嘗試使用 exploreDungeon 函數（如果存在）');
  console.log('3. 考慮重新部署 DungeonMaster 合約');
}

// 執行診斷
if (require.main === module) {
  diagnoseDungeonExploration().catch(console.error);
}

module.exports = { diagnoseDungeonExploration };
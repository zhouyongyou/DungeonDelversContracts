#!/usr/bin/env node

// 診斷地下城出征錯誤 #1002

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約 ABI
const DUNGEONMASTER_ABI = [
  'function explorationFee() public view returns (uint256)',
  'function commissionRate() public view returns (uint256)',
  'function dungeonCore() public view returns (address)',
  'function dungeonStorage() public view returns (address)',
  'function soulShardToken() public view returns (address)',
  'function dungeonMasterWallet() public view returns (address)'
];

const DUNGEONSTORAGE_ABI = [
  'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
  'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint32 cooldownEndsAt, uint32 fatigueLevel, uint32 provisions, uint256 unclaimedRewards))',
  'function NUM_DUNGEONS() external view returns (uint256)'
];

const PARTY_ABI = [
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function getPartyComposition(uint256 _partyId) external view returns (uint256 totalPower, uint256 totalCapacity)'
];

const DUNGEONCORE_ABI = [
  'function partyContractAddress() external view returns (address)',
  'function getSoulShardAmountForUSD(uint256 _usdAmount) external view returns (uint256)'
];

async function checkDungeonError() {
  console.log('🔍 診斷地下城錯誤 #1002...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 合約實例
  const dungeonMaster = new ethers.Contract(v22Config.contracts.DUNGEONMASTER.address, DUNGEONMASTER_ABI, provider);
  const dungeonStorage = new ethers.Contract(v22Config.contracts.DUNGEONSTORAGE.address, DUNGEONSTORAGE_ABI, provider);

  try {
    console.log('📋 DungeonMaster 配置：');
    console.log(`   地址: ${v22Config.contracts.DUNGEONMASTER.address}`);
    
    // 檢查基本配置
    const explorationFee = await dungeonMaster.explorationFee();
    const commissionRate = await dungeonMaster.commissionRate();
    const dungeonCoreAddr = await dungeonMaster.dungeonCore();
    const dungeonStorageAddr = await dungeonMaster.dungeonStorage();
    const soulShardAddr = await dungeonMaster.soulShardToken();
    const walletAddr = await dungeonMaster.dungeonMasterWallet();
    
    console.log(`   探索費用: ${ethers.formatEther(explorationFee)} BNB`);
    console.log(`   手續費率: ${commissionRate / 100}%`);
    console.log(`   DungeonCore: ${dungeonCoreAddr}`);
    console.log(`   DungeonStorage: ${dungeonStorageAddr}`);
    console.log(`   SoulShard: ${soulShardAddr}`);
    console.log(`   費用錢包: ${walletAddr}`);
    
    // 檢查連接狀態
    console.log('\n🔗 連接檢查：');
    if (dungeonCoreAddr === ethers.ZeroAddress) {
      console.log('   ❌ DungeonCore 未設置！');
    } else {
      console.log('   ✅ DungeonCore 已設置');
    }
    
    if (dungeonStorageAddr === ethers.ZeroAddress) {
      console.log('   ❌ DungeonStorage 未設置！');
    } else {
      console.log('   ✅ DungeonStorage 已設置');
    }
    
    if (soulShardAddr === ethers.ZeroAddress) {
      console.log('   ❌ SoulShardToken 未設置！');
    } else {
      console.log('   ✅ SoulShardToken 已設置');
    }
    
    // 檢查地城初始化狀態
    console.log('\n🏰 地城狀態：');
    const numDungeons = await dungeonStorage.NUM_DUNGEONS();
    console.log(`   地城總數: ${numDungeons}`);
    
    let initializedCount = 0;
    for (let i = 1; i <= Number(numDungeons); i++) {
      const dungeon = await dungeonStorage.getDungeon(i);
      if (dungeon.isInitialized) {
        initializedCount++;
        console.log(`   地城 #${i}: ✅ 已初始化 (戰力需求: ${dungeon.requiredPower})`);
      } else {
        console.log(`   地城 #${i}: ❌ 未初始化`);
      }
    }
    
    console.log(`   已初始化: ${initializedCount}/${numDungeons}`);
    
    // 測試特定隊伍（例如隊伍 #1）
    console.log('\n🎮 測試隊伍 #1：');
    const partyContract = new ethers.Contract(v22Config.contracts.PARTY.address, PARTY_ABI, provider);
    
    try {
      const owner = await partyContract.ownerOf(1);
      console.log(`   擁有者: ${owner}`);
      
      const [totalPower, totalCapacity] = await partyContract.getPartyComposition(1);
      console.log(`   總戰力: ${totalPower}`);
      console.log(`   總容量: ${totalCapacity}`);
      
      const partyStatus = await dungeonStorage.getPartyStatus(1);
      console.log(`   冷卻結束時間: ${new Date(Number(partyStatus.cooldownEndsAt) * 1000).toLocaleString()}`);
      console.log(`   未領取獎勵: ${ethers.formatUnits(partyStatus.unclaimedRewards, 18)} USD`);
    } catch (error) {
      console.log(`   ❌ 無法讀取隊伍 #1: ${error.message}`);
    }
    
    // 分析可能的錯誤原因
    console.log('\n💡 可能的錯誤原因：');
    console.log('1. 合約連接未正確設置（DungeonCore、DungeonStorage、SoulShardToken）');
    console.log('2. 地城未初始化');
    console.log('3. 隊伍戰力不足');
    console.log('4. 隊伍在冷卻中');
    console.log('5. BNB 費用不足（需要 ' + ethers.formatEther(explorationFee) + ' BNB）');
    console.log('6. SoulShard 授權不足');
    
    // 檢查 DungeonCore 連接
    if (dungeonCoreAddr !== ethers.ZeroAddress) {
      const dungeonCore = new ethers.Contract(dungeonCoreAddr, DUNGEONCORE_ABI, provider);
      const partyAddr = await dungeonCore.partyContractAddress();
      console.log(`\n📍 DungeonCore 中的 Party 地址: ${partyAddr}`);
      console.log(`   配置中的 Party 地址: ${v22Config.contracts.PARTY.address}`);
      
      if (partyAddr.toLowerCase() !== v22Config.contracts.PARTY.address.toLowerCase()) {
        console.log('   ⚠️ Party 地址不匹配！');
      }
    }

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkDungeonError().catch(console.error);
}

module.exports = { checkDungeonError };
#!/usr/bin/env node

// 檢查 DungeonMaster 合約可用的函數

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// 嘗試各種可能的 ABI
const DUNGEONMASTER_ABI = [
  // V2 版本的函數
  'function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable',
  'function buyProvisions(uint256 _partyId, uint256 _amount) external',
  'function getPartyStatus(uint256 _partyId) external view returns (tuple(uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 bankedRewards) status)',
  'function exploreDungeon(uint256 partyId, uint256 dungeonId) external',
  
  // 可能的冷卻相關函數
  'function getCooldownStatus(address player) external view returns (bool canPlay, uint256 timeUntilCanPlay)',
  'function getPlayerCooldown(address player) external view returns (uint256)',
  'function isOnCooldown(address player) external view returns (bool)',
  'function cooldownEndsAt(address player) external view returns (uint256)',
  
  // 管理函數
  'function setDungeonCore(address _newAddress) external',
  'function setDungeonStorage(address _newAddress) external',
  'function setSoulShardToken(address _newAddress) external',
  'function setDungeonMasterWallet(address _newAddress) external',
  
  // 公共變量
  'function dungeonCore() public view returns (address)',
  'function dungeonStorage() public view returns (address)',
  'function soulShardToken() public view returns (address)',
  'function COOLDOWN_PERIOD() public view returns (uint256)',
  'function explorationFee() public view returns (uint256)'
];

async function checkDungeonMasterFunctions() {
  console.log('🔍 檢查 DungeonMaster 合約函數...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEONMASTER_ABI,
    provider
  );
  
  console.log(`DungeonMaster 地址: ${v22Config.contracts.DUNGEONMASTER.address}\n`);
  
  // 測試每個函數
  console.log('📋 測試函數可用性：\n');
  
  // 1. 測試公共變量
  console.log('【公共變量】');
  const publicVars = ['dungeonCore', 'dungeonStorage', 'soulShardToken', 'COOLDOWN_PERIOD', 'explorationFee'];
  
  for (const varName of publicVars) {
    try {
      const value = await dungeonMaster[varName]();
      console.log(`✅ ${varName}: ${value}`);
    } catch (error) {
      console.log(`❌ ${varName}: 不存在或錯誤`);
    }
  }
  
  // 2. 測試冷卻相關函數（已廢棄）
  console.log('\n【冷卻相關函數】');
  console.log('❌ getCooldownStatus: 已廢棄 - 請使用 DungeonStorage.getPartyStatus 檢查隊伍冷卻');
  
  try {
    const cooldown = await dungeonMaster.getPlayerCooldown(testAddress);
    console.log(`✅ getPlayerCooldown: ${cooldown}`);
  } catch (error) {
    console.log(`❌ getPlayerCooldown: 不存在`);
  }
  
  try {
    const isOnCooldown = await dungeonMaster.isOnCooldown(testAddress);
    console.log(`✅ isOnCooldown: ${isOnCooldown}`);
  } catch (error) {
    console.log(`❌ isOnCooldown: 不存在`);
  }
  
  try {
    const endsAt = await dungeonMaster.cooldownEndsAt(testAddress);
    console.log(`✅ cooldownEndsAt: ${endsAt}`);
  } catch (error) {
    console.log(`❌ cooldownEndsAt: 不存在`);
  }
  
  // 3. 測試隊伍狀態函數
  console.log('\n【隊伍狀態函數】');
  const partyId = 1;
  
  try {
    const status = await dungeonMaster.getPartyStatus(partyId);
    console.log(`✅ getPartyStatus(${partyId}):`, {
      provisionsRemaining: status.provisionsRemaining?.toString() || '0',
      cooldownEndsAt: status.cooldownEndsAt?.toString() || '0',
      bankedRewards: status.bankedRewards?.toString() || '0'
    });
  } catch (error) {
    console.log(`❌ getPartyStatus: 不存在或錯誤 - ${error.message}`);
  }
  
  // 4. 建議
  console.log('\n📊 分析結果：');
  console.log('✅ DungeonMasterV2 使用基於隊伍的冷卻系統');
  console.log('✅ 冷卻狀態存儲在 DungeonStorage.partyStatuses[partyId].cooldownEndsAt');
  console.log('✅ 使用 DungeonStorage.getPartyStatus(partyId) 獲取隊伍狀態');
  console.log('✅ 比較 cooldownEndsAt 與當前時間戳來判斷是否在冷卻中');
}

// 執行檢查
if (require.main === module) {
  checkDungeonMasterFunctions().catch(console.error);
}

module.exports = { checkDungeonMasterFunctions };
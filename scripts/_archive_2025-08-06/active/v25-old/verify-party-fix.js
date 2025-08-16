#!/usr/bin/env node

// 驗證 Party 合約修復狀態

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// Party ABI - 注意變量名是 dungeonCoreContract
const PARTY_ABI = [
  'function dungeonCoreContract() public view returns (address)',
  'function heroContract() public view returns (address)',
  'function relicContract() public view returns (address)',
  'function getPartyPowerQuick(uint256 _partyId) public view returns (uint256)',
  'function getPartyComposition(uint256 _partyId) external view returns (uint256 totalPower, uint256 totalCapacity)',
  'function ownerOf(uint256 tokenId) public view returns (address)'
];

async function verifyPartyFix() {
  console.log('🔍 驗證 Party 合約修復狀態...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );
  
  try {
    console.log('📋 Party 合約狀態：');
    console.log(`Party 地址: ${v22Config.contracts.PARTY.address}`);
    
    // 1. 檢查 DungeonCore 連接
    try {
      const dungeonCore = await party.dungeonCoreContract();
      console.log(`\nDungeonCore 合約: ${dungeonCore}`);
      console.log(`預期地址: ${v22Config.contracts.DUNGEONCORE.address}`);
      console.log(`設置正確: ${dungeonCore.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法讀取 DungeonCore: ${error.message}`);
    }
    
    // 2. 檢查 Hero 和 Relic 連接
    try {
      const hero = await party.heroContract();
      console.log(`\nHero 合約: ${hero}`);
      console.log(`預期地址: ${v22Config.contracts.HERO.address}`);
      console.log(`設置正確: ${hero.toLowerCase() === v22Config.contracts.HERO.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法讀取 Hero: ${error.message}`);
    }
    
    try {
      const relic = await party.relicContract();
      console.log(`\nRelic 合約: ${relic}`);
      console.log(`預期地址: ${v22Config.contracts.RELIC.address}`);
      console.log(`設置正確: ${relic.toLowerCase() === v22Config.contracts.RELIC.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法讀取 Relic: ${error.message}`);
    }
    
    // 3. 測試功能
    console.log('\n📋 測試隊伍功能：');
    const testPartyId = 1;
    
    try {
      const owner = await party.ownerOf(testPartyId);
      console.log(`隊伍 ${testPartyId} 擁有者: ${owner}`);
      
      // 嘗試獲取戰力（快速版本）
      try {
        const power = await party.getPartyPowerQuick(testPartyId);
        console.log(`隊伍戰力 (快速): ${power}`);
      } catch (error) {
        console.log(`❌ 無法獲取戰力 (快速): ${error.message}`);
      }
      
      // 嘗試獲取完整組成
      try {
        const [totalPower, totalCapacity] = await party.getPartyComposition(testPartyId);
        console.log(`隊伍組成: 戰力 ${totalPower}, 容量 ${totalCapacity}`);
      } catch (error) {
        console.log(`❌ 無法獲取組成: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`隊伍 ${testPartyId} 不存在或無法讀取`);
    }
    
    // 4. 診斷總結
    console.log('\n📊 診斷總結：');
    console.log('如果 Party 合約的連接都正確，但地城探索仍然失敗，可能是：');
    console.log('1. 隊伍組成有問題（英雄或聖物不足）');
    console.log('2. DungeonMaster 合約有其他問題');
    console.log('3. 需要重新創建隊伍');
    
  } catch (error) {
    console.error('\n❌ 驗證失敗:', error.message);
  }
}

// 執行驗證
if (require.main === module) {
  verifyPartyFix().catch(console.error);
}

module.exports = { verifyPartyFix };
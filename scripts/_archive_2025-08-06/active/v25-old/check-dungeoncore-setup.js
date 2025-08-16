#!/usr/bin/env node

// 檢查 DungeonCore 設置

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// DungeonCore ABI - 注意變數名稱包含 "Address" 後綴
const DUNGEON_CORE_ABI = [
  'function heroContractAddress() public view returns (address)',
  'function relicContractAddress() public view returns (address)',
  'function partyContractAddress() public view returns (address)',
  'function dungeonMasterAddress() public view returns (address)',
  'function playerVaultAddress() public view returns (address)',
  'function playerProfileAddress() public view returns (address)',
  'function vipStakingAddress() public view returns (address)',
  'function oracleAddress() public view returns (address)',
  'function altarOfAscensionAddress() public view returns (address)',
  'function soulShardTokenAddress() public view returns (address)',
  'function usdTokenAddress() public view returns (address)'
];

// Party ABI
const PARTY_ABI = [
  'function dungeonCoreAddress() public view returns (address)',
  'function heroContract() public view returns (address)',
  'function relicContract() public view returns (address)'
];

async function checkDungeonCoreSetup() {
  console.log('🔍 檢查 DungeonCore 設置...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dungeonCore = new ethers.Contract(
    v22Config.contracts.DUNGEONCORE.address,
    DUNGEON_CORE_ABI,
    provider
  );
  
  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    provider
  );
  
  try {
    console.log('📋 DungeonCore 地址映射：');
    console.log(`DungeonCore 地址: ${v22Config.contracts.DUNGEONCORE.address}\n`);
    
    // 檢查所有地址設置 - 注意函數名稱都包含 "Address" 後綴
    const checks = [
      { name: 'Hero 合約', getter: 'heroContractAddress', expected: v22Config.contracts.HERO.address },
      { name: 'Relic 合約', getter: 'relicContractAddress', expected: v22Config.contracts.RELIC.address },
      { name: 'Party 合約', getter: 'partyContractAddress', expected: v22Config.contracts.PARTY.address },
      { name: 'DungeonMaster', getter: 'dungeonMasterAddress', expected: v22Config.contracts.DUNGEONMASTER.address },
      { name: 'PlayerVault', getter: 'playerVaultAddress', expected: v22Config.contracts.PLAYERVAULT.address },
      { name: 'PlayerProfile', getter: 'playerProfileAddress', expected: v22Config.contracts.PLAYERPROFILE.address },
      { name: 'VIPStaking', getter: 'vipStakingAddress', expected: v22Config.contracts.VIPSTAKING.address },
      { name: 'Oracle', getter: 'oracleAddress', expected: v22Config.contracts.ORACLE.address },
      { name: 'AltarOfAscension', getter: 'altarOfAscensionAddress', expected: v22Config.contracts.ALTAROFASCENSION.address },
      { name: 'SoulShard Token', getter: 'soulShardTokenAddress', expected: v22Config.contracts.SOULSHARD.address },
      { name: 'USD Token', getter: 'usdTokenAddress', expected: v22Config.contracts.USD.address }
      // 注意：DungeonCore 合約沒有 dungeonMasterWallet 變數
    ];
    
    let hasError = false;
    
    for (const check of checks) {
      try {
        const actualAddress = await dungeonCore[check.getter]();
        const isCorrect = actualAddress.toLowerCase() === check.expected.toLowerCase();
        const isZero = actualAddress === ethers.ZeroAddress;
        
        if (isZero) {
          console.log(`❌ ${check.name}: 未設置 (0x0000...0000)`);
          hasError = true;
        } else if (!isCorrect) {
          console.log(`⚠️ ${check.name}: 地址不匹配`);
          console.log(`   實際: ${actualAddress}`);
          console.log(`   預期: ${check.expected}`);
          hasError = true;
        } else {
          console.log(`✅ ${check.name}: ${actualAddress}`);
        }
      } catch (error) {
        console.log(`❌ ${check.name}: 無法讀取 - ${error.message}`);
        hasError = true;
      }
    }
    
    // 檢查 Party 合約的反向連接
    console.log('\n📋 Party 合約反向連接：');
    
    try {
      const partyCoreAddress = await party.dungeonCoreAddress();
      const partyHeroAddress = await party.heroContract();
      const partyRelicAddress = await party.relicContract();
      
      console.log(`Party -> DungeonCore: ${partyCoreAddress}`);
      console.log(`   正確: ${partyCoreAddress.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase() ? '✅' : '❌'}`);
      
      console.log(`Party -> Hero: ${partyHeroAddress}`);
      console.log(`   正確: ${partyHeroAddress.toLowerCase() === v22Config.contracts.HERO.address.toLowerCase() ? '✅' : '❌'}`);
      
      console.log(`Party -> Relic: ${partyRelicAddress}`);
      console.log(`   正確: ${partyRelicAddress.toLowerCase() === v22Config.contracts.RELIC.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ 無法讀取 Party 合約設置: ${error.message}`);
      hasError = true;
    }
    
    // 診斷總結
    console.log('\n📊 診斷結果：');
    if (hasError) {
      console.log('❌ 發現配置問題！');
      console.log('\n可能的解決方案：');
      console.log('1. 執行合約設置腳本來修復連接');
      console.log('2. 檢查合約部署順序是否正確');
      console.log('3. 確認所有合約都已正確初始化');
      
      console.log('\n建議執行：');
      console.log('node scripts/active/setup-v22-connections.js');
    } else {
      console.log('✅ 所有配置正確！');
      console.log('\n如果仍有問題，可能是：');
      console.log('- 合約內部邏輯錯誤');
      console.log('- 權限設置問題');
      console.log('- 其他狀態異常');
    }
    
  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkDungeonCoreSetup().catch(console.error);
}

module.exports = { checkDungeonCoreSetup };
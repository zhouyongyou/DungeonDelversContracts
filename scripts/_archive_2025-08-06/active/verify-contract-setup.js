#!/usr/bin/env node

/**
 * 驗證合約配置是否正確
 * 檢查 DungeonCore 和 PlayerProfile 的相互配置
 */

require('dotenv').config();
const hre = require('hardhat');
const { ethers } = hre;

// 從主配置載入地址
const masterConfig = require('../../config/master-config.json');

async function main() {
  console.log('🔍 驗證合約配置...\n');

  const contracts = masterConfig.contracts.mainnet;
  
  const DUNGEONCORE_ADDRESS = contracts.DUNGEONCORE_ADDRESS;
  const DUNGEONMASTER_ADDRESS = contracts.DUNGEONMASTER_ADDRESS;
  const PLAYERPROFILE_ADDRESS = contracts.PLAYERPROFILE_ADDRESS;

  console.log(`🏛️ DungeonCore: ${DUNGEONCORE_ADDRESS}`);
  console.log(`🎯 DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
  console.log(`👤 PlayerProfile: ${PLAYERPROFILE_ADDRESS}\n`);

  // 連接到合約
  const DungeonCore = await ethers.getContractFactory('DungeonCore');
  const dungeonCore = DungeonCore.attach(DUNGEONCORE_ADDRESS);
  
  const PlayerProfile = await ethers.getContractFactory('PlayerProfile');
  const playerProfile = PlayerProfile.attach(PLAYERPROFILE_ADDRESS);

  console.log('📊 Configuration Analysis:\n');
  
  // 檢查 PlayerProfile 配置
  console.log('🏛️ PlayerProfile Contract:');
  try {
    const playerProfileCore = await playerProfile.dungeonCore();
    console.log(`   DungeonCore set to: ${playerProfileCore}`);
    
    // 從 DungeonCore 獲取 DungeonMaster 地址
    const dungeonMasterFromCore = await dungeonCore.dungeonMasterAddress();
    console.log(`   DungeonMaster from Core: ${dungeonMasterFromCore}`);
    console.log(`   Actual DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
    
    const isPlayerProfileCorrect = 
      playerProfileCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase() &&
      dungeonMasterFromCore.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase();
    
    console.log(`   Status: ${isPlayerProfileCorrect ? '✅ Configured' : '❌ Misconfigured'}\n`);
    
  } catch (error) {
    console.log(`   Error reading PlayerProfile config: ${error.message}\n`);
  }
  
  // 檢查 DungeonCore 配置
  console.log('🏛️ DungeonCore Contract:');
  try {
    const coreDungeonMaster = await dungeonCore.dungeonMasterAddress();
    const corePlayerProfile = await dungeonCore.playerProfileAddress();
    
    console.log(`   DungeonMaster address: ${coreDungeonMaster}`);
    console.log(`   PlayerProfile address: ${corePlayerProfile}`);
    
    const isDungeonCoreCorrect = 
      coreDungeonMaster.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase() &&
      corePlayerProfile.toLowerCase() === PLAYERPROFILE_ADDRESS.toLowerCase();
    
    console.log(`   Status: ${isDungeonCoreCorrect ? '✅ Configured' : '❌ Misconfigured'}\n`);
    
    // 詳細問題分析
    if (!isDungeonCoreCorrect) {
      console.log('🚨 DungeonCore Configuration Issues:');
      if (coreDungeonMaster.toLowerCase() !== DUNGEONMASTER_ADDRESS.toLowerCase()) {
        console.log('   • DungeonMaster address not set correctly in DungeonCore');
      }
      if (corePlayerProfile.toLowerCase() !== PLAYERPROFILE_ADDRESS.toLowerCase()) {
        console.log('   • PlayerProfile address not set correctly in DungeonCore');
      }
      console.log('');
    }
    
  } catch (error) {
    console.log(`   Error reading DungeonCore config: ${error.message}\n`);
  }

  // 總結
  console.log('📋 Summary:');
  try {
    const playerProfileCore = await playerProfile.dungeonCore();
    const coreDungeonMaster = await dungeonCore.dungeonMasterAddress();
    const corePlayerProfile = await dungeonCore.playerProfileAddress();
    
    const allCorrect = 
      playerProfileCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase() &&
      coreDungeonMaster.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase() &&
      corePlayerProfile.toLowerCase() === PLAYERPROFILE_ADDRESS.toLowerCase();
    
    if (allCorrect) {
      console.log('✅ All contracts are properly configured!');
      console.log('✅ PlayerProfile → DungeonCore: Connected');
      console.log('✅ DungeonCore → DungeonMaster: Connected'); 
      console.log('✅ DungeonCore → PlayerProfile: Connected');
    } else {
      console.log('❌ Some configurations need fixing');
      
      if (playerProfileCore.toLowerCase() !== DUNGEONCORE_ADDRESS.toLowerCase()) {
        console.log('❌ PlayerProfile → DungeonCore: Needs fixing');
      }
      if (coreDungeonMaster.toLowerCase() !== DUNGEONMASTER_ADDRESS.toLowerCase()) {
        console.log('❌ DungeonCore → DungeonMaster: Needs fixing');
      }
      if (corePlayerProfile.toLowerCase() !== PLAYERPROFILE_ADDRESS.toLowerCase()) {
        console.log('❌ DungeonCore → PlayerProfile: Needs fixing');
      }
    }
    
  } catch (error) {
    console.log(`❌ Error during summary: ${error.message}`);
  }

  console.log('\n🎉 Verification complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
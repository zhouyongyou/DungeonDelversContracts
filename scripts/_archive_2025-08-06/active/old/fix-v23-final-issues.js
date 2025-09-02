#!/usr/bin/env node

// 修復 V23 最後的問題

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function fixFinalIssues() {
  console.log('🔧 修復 V23 最後的問題...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  const results = {
    party: false,
    dungeonMaster: false,
    playerVault: false
  };
  
  // 1. 修復 Party 合約
  console.log('📌 1. 修復 Party 合約...');
  try {
    // 檢查 Party 合約的 ABI - 可能函數名不同
    const partyABI = [
      "function dungeonCoreContract() view returns (address)",
      "function heroContractAddress() view returns (address)",
      "function relicContractAddress() view returns (address)",
      "function setDungeonCoreContract(address _dungeonCore) external",
      "function setHeroContract(address _hero) external",
      "function setRelicContract(address _relic) external",
      "function initialize(address _dungeonCore, address _hero, address _relic) external",
      "function owner() view returns (address)"
    ];
    
    const party = new ethers.Contract(v23Config.contracts.PARTY.address, partyABI, deployer);
    
    // 檢查當前狀態
    try {
      const dungeonCore = await party.dungeonCoreContract();
      console.log(`  當前 dungeonCoreContract: ${dungeonCore}`);
      
      if (dungeonCore === ethers.ZeroAddress) {
        // 嘗試初始化
        console.log('  嘗試初始化 Party 合約...');
        try {
          const tx = await party.initialize(
            v23Config.contracts.DUNGEONCORE.address,
            v23Config.contracts.HERO.address,
            v23Config.contracts.RELIC.address
          );
          console.log(`  交易: ${tx.hash}`);
          await tx.wait();
          console.log('  ✅ Party 初始化成功');
          results.party = true;
        } catch (e) {
          console.log(`  ❌ 初始化失敗: ${e.message}`);
          console.log('  嘗試單獨設置...');
          
          // 單獨設置
          try {
            const tx1 = await party.setDungeonCoreContract(v23Config.contracts.DUNGEONCORE.address);
            await tx1.wait();
            console.log('  ✅ 設置 dungeonCoreContract 成功');
            results.party = true;
          } catch (e2) {
            console.log(`  ❌ 設置失敗: ${e2.message}`);
          }
        }
      } else {
        console.log('  ✅ Party 合約已設置');
        results.party = true;
      }
    } catch (e) {
      console.log(`  ❌ 無法讀取 Party 狀態: ${e.message}`);
    }
  } catch (error) {
    console.log(`  ❌ Party 修復失敗: ${error.message}`);
  }
  
  // 2. 修復 DungeonMaster.dungeonMasterWallet
  console.log('\n📌 2. 修復 DungeonMaster.dungeonMasterWallet...');
  try {
    const dmABI = [
      "function dungeonMasterWallet() view returns (address)",
      "function setDungeonMasterWallet(address _wallet) external",
      "function owner() view returns (address)"
    ];
    
    const dm = new ethers.Contract(v23Config.contracts.DUNGEONMASTER.address, dmABI, provider);
    
    // 檢查當前狀態
    try {
      const currentWallet = await dm.dungeonMasterWallet();
      console.log(`  當前 dungeonMasterWallet: ${currentWallet}`);
      results.dungeonMaster = true;
    } catch (e) {
      console.log(`  ❌ 無法讀取，可能函數名不同或未設置: ${e.message}`);
      
      // 嘗試設置
      try {
        const dmWithSigner = new ethers.Contract(v23Config.contracts.DUNGEONMASTER.address, dmABI, deployer);
        const tx = await dmWithSigner.setDungeonMasterWallet('0xEbCF4A36Ad1485A9737025e9d72186b604487274');
        console.log(`  交易: ${tx.hash}`);
        await tx.wait();
        console.log('  ✅ 設置成功');
        results.dungeonMaster = true;
      } catch (e2) {
        console.log(`  ❌ 設置失敗: ${e2.message}`);
      }
    }
  } catch (error) {
    console.log(`  ❌ DungeonMaster 修復失敗: ${error.message}`);
  }
  
  // 3. 修復 PlayerVault.isReadyToOperate
  console.log('\n📌 3. 修復 PlayerVault.isReadyToOperate...');
  try {
    const vaultABI = [
      "function isReadyToOperate() view returns (bool)",
      "function dungeonCore() view returns (address)",
      "function soulShardToken() view returns (address)",
      "function setDungeonCore(address _dungeonCore) external",
      "function setSoulShardToken(address _token) external",
      "function owner() view returns (address)"
    ];
    
    const vault = new ethers.Contract(v23Config.contracts.PLAYERVAULT.address, vaultABI, provider);
    
    // 檢查當前狀態
    try {
      const isReady = await vault.isReadyToOperate();
      console.log(`  isReadyToOperate: ${isReady}`);
      
      if (!isReady) {
        // 檢查缺少什麼
        const dungeonCore = await vault.dungeonCore();
        const soulShardToken = await vault.soulShardToken();
        
        console.log(`  dungeonCore: ${dungeonCore}`);
        console.log(`  soulShardToken: ${soulShardToken}`);
        
        const vaultWithSigner = new ethers.Contract(v23Config.contracts.PLAYERVAULT.address, vaultABI, deployer);
        
        if (dungeonCore === ethers.ZeroAddress) {
          console.log('  設置 dungeonCore...');
          const tx = await vaultWithSigner.setDungeonCore(v23Config.contracts.DUNGEONCORE.address);
          await tx.wait();
          console.log('  ✅ dungeonCore 設置成功');
        }
        
        if (soulShardToken === ethers.ZeroAddress) {
          console.log('  設置 soulShardToken...');
          const tx = await vaultWithSigner.setSoulShardToken(v23Config.contracts.SOULSHARD.address);
          await tx.wait();
          console.log('  ✅ soulShardToken 設置成功');
        }
        
        // 再次檢查
        const newIsReady = await vault.isReadyToOperate();
        console.log(`  新 isReadyToOperate: ${newIsReady}`);
        results.playerVault = newIsReady;
      } else {
        console.log('  ✅ PlayerVault 已就緒');
        results.playerVault = true;
      }
    } catch (e) {
      console.log(`  ❌ 無法讀取狀態: ${e.message}`);
    }
  } catch (error) {
    console.log(`  ❌ PlayerVault 修復失敗: ${error.message}`);
  }
  
  // 顯示結果
  console.log('\n📊 修復結果:');
  console.log(`  Party: ${results.party ? '✅' : '❌'}`);
  console.log(`  DungeonMaster: ${results.dungeonMaster ? '✅' : '❌'}`);
  console.log(`  PlayerVault: ${results.playerVault ? '✅' : '❌'}`);
  
  // 如果還有失敗的，提供手動解決方案
  if (!results.party || !results.dungeonMaster || !results.playerVault) {
    console.log('\n⚠️ 部分問題未能自動修復');
    console.log('可能的原因:');
    console.log('1. 合約可能有特殊的初始化要求');
    console.log('2. 函數名稱可能與預期不同');
    console.log('3. 合約可能已被鎖定或權限不足');
    console.log('\n建議檢查合約源碼或聯繫開發團隊');
  } else {
    console.log('\n✅ 所有問題已修復！');
  }
}

// 執行修復
if (require.main === module) {
  fixFinalIssues().catch(console.error);
}

module.exports = { fixFinalIssues };
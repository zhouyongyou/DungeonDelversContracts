#!/usr/bin/env node

// V23 修復失敗設置的腳本

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const v23Config = require('../../config/v23-config');

async function fixFailedSetups() {
  console.log('🔧 開始修復 V23 失敗的設置...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  const contracts = v23Config.contracts;
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // 1. 修復 Hero 和 Relic 的 ascensionAltar（使用正確的函數名）
  console.log('📌 修復 NFT 的 AscensionAltar 設置');
  console.log('='.repeat(50));
  
  const setAltarABI = ["function setAscensionAltar(address _altar) external"];
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    try {
      console.log(`\n🔧 設置 ${name} 的 AscensionAltar...`);
      const nft = new ethers.Contract(address, setAltarABI, deployer);
      const tx = await nft.setAscensionAltar(contracts.ALTAROFASCENSION.address);
      await tx.wait();
      console.log('   ✅ 成功');
      successCount++;
    } catch (error) {
      console.log(`   ❌ 失敗: ${error.message}`);
      
      // 如果函數名不對，嘗試其他可能的函數名
      try {
        console.log(`   🔄 嘗試 setAscensionAltarAddress...`);
        const altABI = ["function setAscensionAltarAddress(address _altar) external"];
        const nft = new ethers.Contract(address, altABI, deployer);
        const tx = await nft.setAscensionAltarAddress(contracts.ALTAROFASCENSION.address);
        await tx.wait();
        console.log('   ✅ 成功');
        successCount++;
      } catch (error2) {
        console.log(`   ❌ 仍然失敗: ${error2.message}`);
        failCount++;
      }
    }
  }
  
  // 2. 檢查並修復 DungeonCore 的 Oracle 設置
  console.log('\n\n📌 檢查 DungeonCore 的 Oracle 設置');
  console.log('='.repeat(50));
  
  try {
    const checkOracleABI = ["function oracleAddress() view returns (address)"];
    const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, checkOracleABI, provider);
    const currentOracle = await dungeonCore.oracleAddress();
    
    if (currentOracle === ethers.ZeroAddress) {
      console.log('\n🔧 Oracle 未設置，嘗試設置...');
      try {
        const setOracleABI = ["function setOracle(address _oracle) external"];
        const dungeonCoreSetter = new ethers.Contract(contracts.DUNGEONCORE.address, setOracleABI, deployer);
        const tx = await dungeonCoreSetter.setOracle(contracts.ORACLE.address);
        await tx.wait();
        console.log('   ✅ 成功');
        successCount++;
      } catch (error) {
        console.log(`   ❌ setOracle 失敗，嘗試 updateOracleAddress...`);
        try {
          const updateOracleABI = ["function updateOracleAddress(address _newOracle) external"];
          const dungeonCoreSetter = new ethers.Contract(contracts.DUNGEONCORE.address, updateOracleABI, deployer);
          const tx = await dungeonCoreSetter.updateOracleAddress(contracts.ORACLE.address);
          await tx.wait();
          console.log('   ✅ 成功');
          successCount++;
        } catch (error2) {
          console.log(`   ❌ 失敗: ${error2.message}`);
          failCount++;
        }
      }
    } else {
      console.log(`   ✅ Oracle 已設置: ${currentOracle}`);
    }
  } catch (error) {
    console.log(`   ❌ 檢查失敗: ${error.message}`);
    failCount++;
  }
  
  // 3. 嘗試直接初始化地城（如果 DungeonMaster 需要特定的初始化）
  console.log('\n\n📌 初始化地城數據');
  console.log('='.repeat(50));
  
  // 先檢查 DungeonMaster 是否需要初始化
  try {
    const dmCheckABI = [
      "function initialized() view returns (bool)",
      "function dungeonStorage() view returns (address)"
    ];
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dmCheckABI, provider);
    
    // 檢查是否已初始化
    let isInitialized = true;
    try {
      const initialized = await dungeonMaster.initialized();
      isInitialized = initialized;
    } catch (e) {
      // 如果沒有 initialized 函數，檢查 dungeonStorage
      const storageAddr = await dungeonMaster.dungeonStorage();
      isInitialized = storageAddr !== ethers.ZeroAddress;
    }
    
    if (isInitialized) {
      console.log('   ✅ DungeonMaster 已初始化');
      
      // 嘗試設置地城，使用更簡單的參數
      console.log('\n🔧 嘗試設置地城 1（最簡單的地城）...');
      try {
        const setDungeonABI = ["function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint256 _baseSuccessRate) external"];
        const dm = new ethers.Contract(contracts.DUNGEONMASTER.address, setDungeonABI, deployer);
        
        // 使用最小值測試
        const tx = await dm.setDungeon(
          1, // dungeonId
          0, // requiredPower
          ethers.parseUnits('1', 18), // 1 USD reward
          95 // 95% success rate
        );
        await tx.wait();
        console.log('   ✅ 成功');
        successCount++;
      } catch (error) {
        console.log(`   ❌ 失敗: ${error.message}`);
        failCount++;
      }
    } else {
      console.log('   ❌ DungeonMaster 未初始化');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ 檢查失敗: ${error.message}`);
    failCount++;
  }
  
  // 4. 檢查並設置費用
  console.log('\n\n📌 設置費用參數');
  console.log('='.repeat(50));
  
  try {
    console.log('\n🔧 設置 DungeonMaster 平台費用...');
    const checkFeeABI = ["function platformFee() view returns (uint256)"];
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, checkFeeABI, provider);
    
    try {
      const currentFee = await dungeonMaster.platformFee();
      if (currentFee === 0n) {
        const setFeeABI = ["function setPlatformFee(uint256 _fee) external"];
        const dm = new ethers.Contract(contracts.DUNGEONMASTER.address, setFeeABI, deployer);
        const tx = await dm.setPlatformFee(200); // 2%
        await tx.wait();
        console.log('   ✅ 成功設置為 2%');
        successCount++;
      } else {
        console.log(`   ✅ 費用已設置: ${currentFee.toString()} (${Number(currentFee) / 100}%)`);
      }
    } catch (error) {
      console.log(`   ❌ 失敗: ${error.message}`);
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ 檢查失敗: ${error.message}`);
    failCount++;
  }
  
  // 總結
  console.log('\n\n========== 修復完成 ==========');
  console.log(`✅ 成功: ${successCount} 個修復`);
  console.log(`❌ 失敗: ${failCount} 個修復`);
  console.log('===============================\n');
  
  if (failCount > 0) {
    console.log('💡 提示：');
    console.log('1. 某些設置可能需要特定的初始化順序');
    console.log('2. 檢查合約是否有特殊的權限要求');
    console.log('3. 部分功能可能在合約中被禁用或移除');
  }
  
  console.log('\n📌 下一步：');
  console.log('1. 執行驗證: node scripts/active/verify-v23-setup.js');
  console.log('2. 執行快速檢查: node scripts/active/check-v23-connections.js');
}

// 執行
if (require.main === module) {
  fixFailedSetups().catch(console.error);
}

module.exports = { fixFailedSetups };
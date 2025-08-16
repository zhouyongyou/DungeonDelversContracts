#!/usr/bin/env node

// V23 手動設置合約連接腳本

const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// 載入 V23 配置
const v23Config = require('../../config/v23-config');

async function setupConnections() {
  console.log('🔗 開始設置 V23 合約連接...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  console.log(`📋 版本: ${v23Config.version}\n`);
  
  const contracts = v23Config.contracts;
  let successCount = 0;
  let failCount = 0;
  
  try {
    // 1. 設置 DungeonCore 連接
    console.log('📌 設置 DungeonCore 連接');
    console.log('='.repeat(50));
    
    const dungeonCoreABI = [
      "function setHeroContract(address _hero) external",
      "function setRelicContract(address _relic) external",
      "function setPartyContract(address _party) external",
      "function setDungeonMaster(address _dungeonMaster) external",
      "function setPlayerVault(address _playerVault) external",
      "function setPlayerProfile(address _playerProfile) external",
      "function updateOracleAddress(address _newOracle) external",
      "function setVIPStaking(address _vipStaking) external",
      "function setAltarOfAscension(address _altar) external"
    ];
    
    const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, dungeonCoreABI, deployer);
    
    const dungeonCoreSetups = [
      { method: 'setHeroContract', param: contracts.HERO.address, name: 'Hero' },
      { method: 'setRelicContract', param: contracts.RELIC.address, name: 'Relic' },
      { method: 'setPartyContract', param: contracts.PARTY.address, name: 'Party' },
      { method: 'setDungeonMaster', param: contracts.DUNGEONMASTER.address, name: 'DungeonMaster' },
      { method: 'setPlayerVault', param: contracts.PLAYERVAULT.address, name: 'PlayerVault' },
      { method: 'setPlayerProfile', param: contracts.PLAYERPROFILE.address, name: 'PlayerProfile' },
      { method: 'updateOracleAddress', param: contracts.ORACLE.address, name: 'Oracle' },
      { method: 'setVIPStaking', param: contracts.VIPSTAKING.address, name: 'VIPStaking' },
      { method: 'setAltarOfAscension', param: contracts.ALTAROFASCENSION.address, name: 'AltarOfAscension' }
    ];
    
    for (const setup of dungeonCoreSetups) {
      try {
        console.log(`\n   🔗 設置 ${setup.name}...`);
        const tx = await dungeonCore[setup.method](setup.param);
        await tx.wait();
        console.log(`      ✅ 成功`);
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 2. 設置各模組的 DungeonCore 地址
    console.log('\n\n📌 設置模組的 DungeonCore 地址');
    console.log('='.repeat(50));
    
    const setDungeonCoreABI = ["function setDungeonCore(address _dungeonCore) external"];
    
    const modules = [
      { name: 'Hero', address: contracts.HERO.address },
      { name: 'Relic', address: contracts.RELIC.address },
      { name: 'PlayerVault', address: contracts.PLAYERVAULT.address },
      { name: 'PlayerProfile', address: contracts.PLAYERPROFILE.address },
      { name: 'VIPStaking', address: contracts.VIPSTAKING.address },
      { name: 'DungeonMaster', address: contracts.DUNGEONMASTER.address }
    ];
    
    for (const module of modules) {
      try {
        console.log(`\n   🔗 設置 ${module.name} 的 DungeonCore...`);
        const contract = new ethers.Contract(module.address, setDungeonCoreABI, deployer);
        const tx = await contract.setDungeonCore(contracts.DUNGEONCORE.address);
        await tx.wait();
        console.log(`      ✅ 成功`);
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 3. 設置 Party 特殊連接
    console.log('\n\n📌 設置 Party 合約連接');
    console.log('='.repeat(50));
    
    const partyABI = [
      "function setHeroContract(address _hero) external",
      "function setRelicContract(address _relic) external",
      "function setDungeonCoreContract(address _dungeonCore) external"
    ];
    
    const party = new ethers.Contract(contracts.PARTY.address, partyABI, deployer);
    
    const partySetups = [
      { method: 'setHeroContract', param: contracts.HERO.address, name: 'Hero Contract' },
      { method: 'setRelicContract', param: contracts.RELIC.address, name: 'Relic Contract' },
      { method: 'setDungeonCoreContract', param: contracts.DUNGEONCORE.address, name: 'DungeonCore Contract' }
    ];
    
    for (const setup of partySetups) {
      try {
        console.log(`\n   🔗 設置 Party 的 ${setup.name}...`);
        const tx = await party[setup.method](setup.param);
        await tx.wait();
        console.log(`      ✅ 成功`);
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 4. 設置 DungeonMaster 特殊連接
    console.log('\n\n📌 設置 DungeonMaster 合約連接');
    console.log('='.repeat(50));
    
    const dungeonMasterABI = [
      "function setDungeonStorage(address _storage) external",
      "function setSoulShardToken(address _token) external",
      "function setDungeonMasterWallet(address _wallet) external"
    ];
    
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dungeonMasterABI, deployer);
    
    try {
      console.log('\n   🔗 設置 DungeonStorage...');
      const tx1 = await dungeonMaster.setDungeonStorage(contracts.DUNGEONSTORAGE.address);
      await tx1.wait();
      console.log('      ✅ 成功');
      successCount++;
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message}`);
      failCount++;
    }
    
    try {
      console.log('\n   🔗 設置 SoulShardToken...');
      const tx2 = await dungeonMaster.setSoulShardToken(contracts.SOULSHARD.address);
      await tx2.wait();
      console.log('      ✅ 成功');
      successCount++;
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message}`);
      failCount++;
    }
    
    try {
      console.log('\n   🔗 設置 DungeonMasterWallet...');
      const tx3 = await dungeonMaster.setDungeonMasterWallet(contracts.DUNGEONMASTERWALLET.address);
      await tx3.wait();
      console.log('      ✅ 成功');
      successCount++;
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message}`);
      failCount++;
    }
    
    // 5. 設置 DungeonStorage 的邏輯合約
    console.log('\n\n📌 設置 DungeonStorage 邏輯合約');
    console.log('='.repeat(50));
    
    const storageABI = ["function setLogicContract(address _logic) external"];
    const storage = new ethers.Contract(contracts.DUNGEONSTORAGE.address, storageABI, deployer);
    
    try {
      console.log('\n   🔗 設置 DungeonStorage 的邏輯合約...');
      const tx = await storage.setLogicContract(contracts.DUNGEONMASTER.address);
      await tx.wait();
      console.log('      ✅ 成功');
      successCount++;
    } catch (error) {
      console.log(`      ❌ 失敗: ${error.message}`);
      failCount++;
    }
    
    // 6. 設置 Hero/Relic 的 SoulShard 和 Altar
    console.log('\n\n📌 設置 NFT 合約的 Token 和 Altar 地址');
    console.log('='.repeat(50));
    
    const nftABI = [
      "function setSoulShardToken(address _token) external",
      "function setAscensionAltar(address _altar) external"
    ];
    
    const nfts = [
      { name: 'Hero', contract: new ethers.Contract(contracts.HERO.address, nftABI, deployer) },
      { name: 'Relic', contract: new ethers.Contract(contracts.RELIC.address, nftABI, deployer) }
    ];
    
    for (const nft of nfts) {
      try {
        console.log(`\n   🔗 設置 ${nft.name} 的 SoulShardToken...`);
        const tx1 = await nft.contract.setSoulShardToken(contracts.SOULSHARD.address);
        await tx1.wait();
        console.log('      ✅ 成功');
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
      
      try {
        console.log(`\n   🔗 設置 ${nft.name} 的 AscensionAltar...`);
        const tx2 = await nft.contract.setAscensionAltar(contracts.ALTAROFASCENSION.address);
        await tx2.wait();
        console.log('      ✅ 成功');
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 7. 設置 PlayerVault 和 VIPStaking 的 SoulShard
    console.log('\n\n📌 設置其他模組的 SoulShard Token');
    console.log('='.repeat(50));
    
    const setSoulShardABI = ["function setSoulShardToken(address _token) external"];
    
    const soulShardModules = [
      { name: 'PlayerVault', address: contracts.PLAYERVAULT.address },
      { name: 'VIPStaking', address: contracts.VIPSTAKING.address }
    ];
    
    for (const module of soulShardModules) {
      try {
        console.log(`\n   🔗 設置 ${module.name} 的 SoulShardToken...`);
        const contract = new ethers.Contract(module.address, setSoulShardABI, deployer);
        const tx = await contract.setSoulShardToken(contracts.SOULSHARD.address);
        await tx.wait();
        console.log('      ✅ 成功');
        successCount++;
      } catch (error) {
        console.log(`      ❌ 失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 總結
    console.log('\n\n========== 設置完成 ==========');
    console.log(`✅ 成功: ${successCount} 個設置`);
    console.log(`❌ 失敗: ${failCount} 個設置`);
    console.log('===============================\n');
    
    if (failCount === 0) {
      console.log('🎉 所有合約連接設置成功！');
      console.log('\n📌 下一步：');
      console.log('1. 執行驗證腳本: node scripts/active/verify-v23-setup.js');
      console.log('2. 設置 BaseURI: node scripts/active/setup-v23-baseuris.js');
      console.log('3. 設置費用參數: node scripts/active/setup-v23-fees.js');
    } else {
      console.log('⚠️ 有部分設置失敗，請檢查錯誤信息並手動修復');
    }
    
  } catch (error) {
    console.error('\n❌ 設置過程出現錯誤:', error);
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  setupConnections().catch(console.error);
}

module.exports = { setupConnections };
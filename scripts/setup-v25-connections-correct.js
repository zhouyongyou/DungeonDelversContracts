#!/usr/bin/env node

/**
 * V25 合約連接設置腳本 - 正確版本
 * 根據實際合約代碼設置連接
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('🔗 V25 合約連接設置 - 正確版本');
  console.log('=====================================\n');

  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`📋 執行者地址: ${signer.address}\n`);

  // V25 合約地址
  const contracts = {
    // 新部署的合約
    HERO: process.env.VITE_HERO_ADDRESS,
    RELIC: process.env.VITE_RELIC_ADDRESS,
    PARTY: process.env.VITE_PARTY_ADDRESS,
    DUNGEONMASTER: process.env.VITE_DUNGEONMASTER_ADDRESS,
    DUNGEONSTORAGE: process.env.VITE_DUNGEONSTORAGE_ADDRESS,
    ALTAROFASCENSION: process.env.VITE_ALTAROFASCENSION_ADDRESS,
    
    // 復用的合約
    DUNGEONCORE: process.env.VITE_DUNGEONCORE_ADDRESS,
    PLAYERVAULT: process.env.VITE_PLAYERVAULT_ADDRESS,
    PLAYERPROFILE: process.env.VITE_PLAYERPROFILE_ADDRESS,
    VIPSTAKING: process.env.VITE_VIPSTAKING_ADDRESS,
    ORACLE: process.env.VITE_ORACLE_ADDRESS,
    VRFMANAGER: process.env.VITE_VRFMANAGER_ADDRESS,
    SOULSHARD: process.env.VITE_SOULSHARD_ADDRESS
  };

  console.log('📍 合約地址配置:');
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  console.log();

  try {
    // ========== 1. DungeonCore 中央配置 ==========
    console.log('1️⃣ 配置 DungeonCore 中央樞紐...\n');
    
    const dungeonCoreABI = [
      'function owner() view returns (address)',
      'function setHeroContract(address _newAddress) external',
      'function setRelicContract(address _newAddress) external',
      'function setPartyContract(address _newAddress) external',
      'function setDungeonMaster(address _newAddress) external',
      'function setAltarOfAscension(address _newAddress) external',
      'function setDungeonStorage(address _newAddress) external',
      'function setPlayerVault(address _newAddress) external',
      'function setPlayerProfile(address _newAddress) external',
      'function setVipStaking(address _newAddress) external',
      'function setOracle(address _newAddress) external',
      'function setVRFManager(address _vrfManager) external',
      'function setSoulShardToken(address _token) external',
      'function getHeroContract() view returns (address)',
      'function getRelicContract() view returns (address)',
      'function getPartyContract() view returns (address)',
      'function getDungeonMaster() view returns (address)',
      'function getAltarOfAscension() view returns (address)',
      'function getDungeonStorage() view returns (address)',
      'function getVRFManager() view returns (address)',
      'function getSoulShardToken() view returns (address)'
    ];

    const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE, dungeonCoreABI, signer);
    
    // 檢查 owner
    const owner = await dungeonCore.owner();
    console.log(`   DungeonCore Owner: ${owner}`);
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error('   ❌ 你不是 DungeonCore 的 owner');
      return;
    }

    // 設置新合約地址到 DungeonCore
    const coreSettings = [
      { name: 'Hero', func: 'setHeroContract', address: contracts.HERO },
      { name: 'Relic', func: 'setRelicContract', address: contracts.RELIC },
      { name: 'Party', func: 'setPartyContract', address: contracts.PARTY },
      { name: 'DungeonMaster', func: 'setDungeonMaster', address: contracts.DUNGEONMASTER },
      { name: 'AltarOfAscension', func: 'setAltarOfAscension', address: contracts.ALTAROFASCENSION },
      { name: 'DungeonStorage', func: 'setDungeonStorage', address: contracts.DUNGEONSTORAGE },
      { name: 'VRFManager', func: 'setVRFManager', address: contracts.VRFMANAGER },
      { name: 'SoulShard', func: 'setSoulShardToken', address: contracts.SOULSHARD },
      { name: 'Oracle', func: 'setOracle', address: contracts.ORACLE },
      { name: 'PlayerVault', func: 'setPlayerVault', address: contracts.PLAYERVAULT },
      { name: 'PlayerProfile', func: 'setPlayerProfile', address: contracts.PLAYERPROFILE },
      { name: 'VipStaking', func: 'setVipStaking', address: contracts.VIPSTAKING }
    ];

    for (const setting of coreSettings) {
      try {
        console.log(`   設置 ${setting.name}: ${setting.address}`);
        const tx = await dungeonCore[setting.func](setting.address);
        await tx.wait();
        console.log(`   ✅ ${setting.name} 設置成功`);
      } catch (error) {
        console.log(`   ⚠️ ${setting.name} 設置失敗: ${error.message}`);
      }
    }

    // ========== 2. 各合約設置 DungeonCore ==========
    console.log('\n2️⃣ 各合約設置 DungeonCore 連接...\n');
    
    const setDungeonCoreABI = [
      'function setDungeonCore(address _address) external',
      'function dungeonCore() view returns (address)',
      'function owner() view returns (address)'
    ];

    const contractsToSetCore = [
      { name: 'Hero', address: contracts.HERO },
      { name: 'Relic', address: contracts.RELIC },
      { name: 'Party', address: contracts.PARTY },
      { name: 'DungeonMaster', address: contracts.DUNGEONMASTER },
      { name: 'DungeonStorage', address: contracts.DUNGEONSTORAGE },
      { name: 'AltarOfAscension', address: contracts.ALTAROFASCENSION },
      { name: 'PlayerVault', address: contracts.PLAYERVAULT },
      { name: 'PlayerProfile', address: contracts.PLAYERPROFILE },
      { name: 'VipStaking', address: contracts.VIPSTAKING }
    ];

    for (const contract of contractsToSetCore) {
      try {
        const instance = new ethers.Contract(contract.address, setDungeonCoreABI, signer);
        
        // 檢查當前設置
        const currentCore = await instance.dungeonCore();
        if (currentCore.toLowerCase() === contracts.DUNGEONCORE.toLowerCase()) {
          console.log(`   ✅ ${contract.name} 已設置正確的 DungeonCore`);
          continue;
        }
        
        console.log(`   設置 ${contract.name} 的 DungeonCore...`);
        const tx = await instance.setDungeonCore(contracts.DUNGEONCORE);
        await tx.wait();
        console.log(`   ✅ ${contract.name} DungeonCore 設置成功`);
      } catch (error) {
        console.log(`   ⚠️ ${contract.name} DungeonCore 設置失敗: ${error.message}`);
      }
    }

    // ========== 3. DungeonMaster 特殊設置 ==========
    console.log('\n3️⃣ DungeonMaster 特殊設置...\n');
    
    const dungeonMasterABI = [
      'function setDungeonStorage(address _newAddress) external',
      'function dungeonStorage() view returns (address)'
    ];

    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER, dungeonMasterABI, signer);
    
    try {
      const currentStorage = await dungeonMaster.dungeonStorage();
      if (currentStorage.toLowerCase() === contracts.DUNGEONSTORAGE.toLowerCase()) {
        console.log(`   ✅ DungeonStorage 已設置正確`);
      } else {
        console.log(`   設置 DungeonStorage: ${contracts.DUNGEONSTORAGE}`);
        const tx = await dungeonMaster.setDungeonStorage(contracts.DUNGEONSTORAGE);
        await tx.wait();
        console.log(`   ✅ DungeonStorage 設置成功`);
      }
    } catch (error) {
      console.log(`   ⚠️ DungeonStorage 設置失敗: ${error.message}`);
    }

    // ========== 4. DungeonStorage 設置邏輯合約 ==========
    console.log('\n4️⃣ DungeonStorage 設置邏輯合約...\n');
    
    const storageABI = [
      'function setLogicContract(address _logicContract) external',
      'function logicContract() view returns (address)'
    ];

    const dungeonStorage = new ethers.Contract(contracts.DUNGEONSTORAGE, storageABI, signer);
    
    try {
      const currentLogic = await dungeonStorage.logicContract();
      if (currentLogic.toLowerCase() === contracts.DUNGEONMASTER.toLowerCase()) {
        console.log(`   ✅ 邏輯合約已設置正確`);
      } else {
        console.log(`   設置邏輯合約: ${contracts.DUNGEONMASTER}`);
        const tx = await dungeonStorage.setLogicContract(contracts.DUNGEONMASTER);
        await tx.wait();
        console.log(`   ✅ 邏輯合約設置成功`);
      }
    } catch (error) {
      console.log(`   ⚠️ 邏輯合約設置失敗: ${error.message}`);
    }

    // ========== 5. VRF Manager 授權檢查 ==========
    console.log('\n5️⃣ 檢查 VRF Manager 授權...\n');
    
    const vrfManagerABI = [
      'function authorizedContracts(address) view returns (bool)',
      'function setAuthorizedContract(address addr, bool auth) external',
      'function owner() view returns (address)'
    ];

    const vrfManager = new ethers.Contract(contracts.VRFMANAGER, vrfManagerABI, signer);
    
    // 檢查 VRF Manager owner
    const vrfOwner = await vrfManager.owner();
    console.log(`   VRF Manager Owner: ${vrfOwner}`);
    
    if (vrfOwner.toLowerCase() === signer.address.toLowerCase()) {
      const contractsToAuthorize = [
        { name: 'Hero', address: contracts.HERO },
        { name: 'Relic', address: contracts.RELIC },
        { name: 'DungeonMaster', address: contracts.DUNGEONMASTER },
        { name: 'AltarOfAscension', address: contracts.ALTAROFASCENSION }
      ];

      for (const contract of contractsToAuthorize) {
        try {
          const isAuthorized = await vrfManager.authorizedContracts(contract.address);
          if (isAuthorized) {
            console.log(`   ✅ ${contract.name} 已授權`);
          } else {
            console.log(`   授權 ${contract.name}...`);
            const tx = await vrfManager.setAuthorizedContract(contract.address, true);
            await tx.wait();
            console.log(`   ✅ ${contract.name} 授權成功`);
          }
        } catch (error) {
          console.log(`   ⚠️ ${contract.name} 授權失敗: ${error.message}`);
        }
      }
    } else {
      console.log(`   ⚠️ 你不是 VRF Manager 的 owner，無法設置授權`);
    }

    // ========== 6. 驗證關鍵連接 ==========
    console.log('\n6️⃣ 驗證關鍵連接...\n');
    
    // 驗證 DungeonCore 的設置
    console.log('   DungeonCore 連接驗證:');
    const verifications = [
      { name: 'Hero', func: 'getHeroContract' },
      { name: 'Relic', func: 'getRelicContract' },
      { name: 'Party', func: 'getPartyContract' },
      { name: 'DungeonMaster', func: 'getDungeonMaster' },
      { name: 'AltarOfAscension', func: 'getAltarOfAscension' },
      { name: 'DungeonStorage', func: 'getDungeonStorage' },
      { name: 'VRFManager', func: 'getVRFManager' },
      { name: 'SoulShard', func: 'getSoulShardToken' }
    ];

    for (const verify of verifications) {
      try {
        const address = await dungeonCore[verify.func]();
        console.log(`     ${verify.name}: ${address}`);
      } catch (error) {
        console.log(`     ${verify.name}: ❌ 無法讀取`);
      }
    }

    console.log('\n✅ V25 合約連接設置完成！');
    console.log('📝 請手動驗證所有連接是否正確。');

  } catch (error) {
    console.error('❌ 設置過程發生錯誤:', error);
    process.exit(1);
  }
}

main().catch(console.error);
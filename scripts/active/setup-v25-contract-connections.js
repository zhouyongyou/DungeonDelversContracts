#!/usr/bin/env node

/**
 * V25 合約連接設置腳本
 * 設置新合約之間的連接關係
 */

require('dotenv').config();
const { ethers } = require('ethers');
const masterConfig = require('../../config/master-config.json');

async function main() {
  console.log('🔗 V25 合約連接設置');
  console.log('====================\n');

  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  const contracts = masterConfig.contracts.mainnet;
  
  console.log(`📋 執行者地址: ${signer.address}`);
  console.log(`🏛️ 使用配置版本: ${masterConfig.version}`);
  console.log(`📅 配置更新時間: ${masterConfig.lastUpdated}\n`);
  
  // 新部署的合約地址
  const newContracts = {
    HERO: contracts.HERO_ADDRESS,
    RELIC: contracts.RELIC_ADDRESS,
    DUNGEONMASTER: contracts.DUNGEONMASTER_ADDRESS,
    ALTAROFASCENSION: contracts.ALTAROFASCENSION_ADDRESS,
    DUNGEONSTORAGE: contracts.DUNGEONSTORAGE_ADDRESS,
    PARTY: contracts.PARTY_ADDRESS
  };
  
  // 重複使用的合約地址
  const existingContracts = {
    DUNGEONCORE: contracts.DUNGEONCORE_ADDRESS,
    PLAYERVAULT: contracts.PLAYERVAULT_ADDRESS,
    PLAYERPROFILE: contracts.PLAYERPROFILE_ADDRESS,
    VIPSTAKING: contracts.VIPSTAKING_ADDRESS,
    ORACLE: contracts.ORACLE_ADDRESS,
    VRFMANAGER: contracts.VRFMANAGER_ADDRESS
  };
  
  console.log('🆕 新部署的合約:');
  Object.entries(newContracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  console.log('\n🔄 重複使用的合約:');
  Object.entries(existingContracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  try {
    console.log('\n🔧 開始設置合約連接...\n');
    
    // 1. 設置 DungeonCore 的新合約地址
    console.log('1️⃣ 設置 DungeonCore 連接...');
    await setupDungeonCore(signer, contracts);
    
    // 2. 設置新合約的 DungeonCore 連接
    console.log('\n2️⃣ 設置新合約的 DungeonCore 連接...');
    await setupNewContractsCore(signer, newContracts, contracts.DUNGEONCORE_ADDRESS);
    
    // 3. 設置 DungeonMaster 的 DungeonStorage 連接
    console.log('\n3️⃣ 設置 DungeonMaster 連接...');
    await setupDungeonMaster(signer, contracts);
    
    // 4. 設置祭壇連接
    console.log('\n4️⃣ 設置祭壇連接...');
    await setupAltarConnections(signer, contracts);
    
    // 5. 設置 VRF 連接
    console.log('\n5️⃣ 設置 VRF 連接...');
    await setupVRFConnections(signer, contracts);
    
    console.log('\n✅ 所有合約連接設置完成！');
    
  } catch (error) {
    console.error('❌ 設置過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 設置 DungeonCore 的新合約地址
async function setupDungeonCore(signer, contracts) {
  const dungeonCoreABI = [
    'function setHeroContract(address _address) external',
    'function setRelicContract(address _address) external', 
    'function setPartyContract(address _address) external',
    'function setDungeonMaster(address _address) external',
    'function setAltarOfAscension(address _address) external',
    'function owner() view returns (address)'
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE_ADDRESS, dungeonCoreABI, signer);
  
  // 檢查權限
  const owner = await dungeonCore.owner();
  console.log(`   DungeonCore Owner: ${owner}`);
  console.log(`   Current Signer: ${signer.address}`);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log('   ⚠️ 當前執行者不是 DungeonCore 的 owner，跳過設置');
    return;
  }
  
  const connections = [
    ['Hero', 'setHeroContract', contracts.HERO_ADDRESS],
    ['Relic', 'setRelicContract', contracts.RELIC_ADDRESS],
    ['Party', 'setPartyContract', contracts.PARTY_ADDRESS],
    ['DungeonMaster', 'setDungeonMaster', contracts.DUNGEONMASTER_ADDRESS],
    ['AltarOfAscension', 'setAltarOfAscension', contracts.ALTAROFASCENSION_ADDRESS]
  ];
  
  for (const [name, method, address] of connections) {
    try {
      const tx = await dungeonCore[method](address);
      await tx.wait();
      console.log(`   ✅ ${name} 連接設置成功: ${address}`);
    } catch (error) {
      console.log(`   ❌ ${name} 設置失敗: ${error.message}`);
    }
  }
}

// 設置新合約的 DungeonCore 連接
async function setupNewContractsCore(signer, newContracts, dungeonCoreAddress) {
  for (const [name, address] of Object.entries(newContracts)) {
    try {
      let contractABI, functionName;
      
      // DungeonStorage 使用不同的函數名
      if (name === 'DUNGEONSTORAGE') {
        contractABI = [
          'function setLogicContract(address _address) external',
          'function owner() view returns (address)'
        ];
        functionName = 'setLogicContract';
      } else {
        contractABI = [
          'function setDungeonCore(address _address) external',
          'function owner() view returns (address)'
        ];
        functionName = 'setDungeonCore';
      }
      
      const contract = new ethers.Contract(address, contractABI, signer);
      
      // 檢查權限
      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`   ⚠️ 不是 ${name} 的 owner，跳過設置`);
        continue;
      }
      
      const tx = await contract[functionName](dungeonCoreAddress);
      await tx.wait();
      console.log(`   ✅ ${name} 連接設置成功`);
    } catch (error) {
      console.log(`   ❌ ${name} 設置失敗: ${error.message}`);
    }
  }
}

// 設置 DungeonMaster 特殊連接
async function setupDungeonMaster(signer, contracts) {
  const dungeonMasterABI = [
    'function setDungeonStorage(address _address) external',
    'function setSoulShardToken(address _address) external',
    'function owner() view returns (address)'
  ];
  
  try {
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER_ADDRESS, dungeonMasterABI, signer);
    
    // 檢查權限
    const owner = await dungeonMaster.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('   ⚠️ 不是 DungeonMaster 的 owner，跳過設置');
      return;
    }
    
    // 設置 DungeonStorage
    const tx1 = await dungeonMaster.setDungeonStorage(contracts.DUNGEONSTORAGE_ADDRESS);
    await tx1.wait();
    console.log(`   ✅ DungeonStorage 連接設置成功`);
    
    // 設置 SoulShard Token
    const tx2 = await dungeonMaster.setSoulShardToken(contracts.SOULSHARD_ADDRESS);
    await tx2.wait();
    console.log(`   ✅ SoulShard Token 連接設置成功`);
    
  } catch (error) {
    console.log(`   ❌ DungeonMaster 設置失敗: ${error.message}`);
  }
}

// 設置祭壇連接
async function setupAltarConnections(signer, contracts) {
  const altarABI = [
    'function setDungeonCore(address _address) external',
    'function setVRFManager(address _address) external',
    'function owner() view returns (address)'
  ];
  
  try {
    const altar = new ethers.Contract(contracts.ALTAROFASCENSION_ADDRESS, altarABI, signer);
    
    // 檢查權限
    const owner = await altar.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('   ⚠️ 不是 Altar 的 owner，跳過設置');
      return;
    }
    
    // 設置 DungeonCore（祭壇通過它自動獲取 Hero/Relic 地址）
    const tx1 = await altar.setDungeonCore(contracts.DUNGEONCORE_ADDRESS);
    await tx1.wait();
    console.log(`   ✅ DungeonCore 連接設置成功（自動獲取 Hero/Relic）`);
    
    // 設置 VRF Manager
    const tx2 = await altar.setVRFManager(contracts.VRFMANAGER_ADDRESS);
    await tx2.wait();
    console.log(`   ✅ VRF Manager 連接設置成功`);
    
  } catch (error) {
    console.log(`   ❌ 祭壇連接設置失敗: ${error.message}`);
  }
}

// 設置 VRF 連接
async function setupVRFConnections(signer, contracts) {
  const contractABI = [
    'function setVRFManager(address _address) external',
    'function owner() view returns (address)'
  ];
  
  const vrfContracts = [
    ['Hero', contracts.HERO_ADDRESS],
    ['Relic', contracts.RELIC_ADDRESS],
    ['DungeonMaster', contracts.DUNGEONMASTER_ADDRESS]
  ];
  
  for (const [name, address] of vrfContracts) {
    try {
      const contract = new ethers.Contract(address, contractABI, signer);
      
      // 檢查權限
      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`   ⚠️ 不是 ${name} 的 owner，跳過 VRF 設置`);
        continue;
      }
      
      const tx = await contract.setVRFManager(contracts.VRFMANAGER_ADDRESS);
      await tx.wait();
      console.log(`   ✅ ${name} VRF Manager 連接設置成功`);
    } catch (error) {
      console.log(`   ❌ ${name} VRF 設置失敗: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
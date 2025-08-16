#!/usr/bin/env node

/**
 * V25 新合約連接設置腳本 (8/7 am 7部署版本)
 * 設置新部署的合約之間的連接關係
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('🔗 V25 新合約連接設置 (8/7 am 7)');
  console.log('===================================\n');

  // 設置 provider 和 signer
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  
  console.log(`📋 執行者地址: ${signer.address}`);
  console.log(`💰 餘額: ${ethers.formatEther(await provider.getBalance(signer.address))} BNB\n`);
  
  // V25 最新合約地址 (8/7 am 7部署)
  const contracts = {
    // 新部署的合約
    HERO: '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
    RELIC: '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
    DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    ALTAROFASCENSION: '0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1',
    DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
    PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
    
    // 重複使用的合約
    DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
    PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
    PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
    VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
    ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
    VRFMANAGER: '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1',
    SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
  };
  
  console.log('🆕 新部署的合約:');
  ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION', 'DUNGEONSTORAGE', 'PARTY'].forEach(name => {
    console.log(`   ${name}: ${contracts[name]}`);
  });
  
  console.log('\n🔄 重複使用的合約:');
  ['DUNGEONCORE', 'PLAYERVAULT', 'PLAYERPROFILE', 'VIPSTAKING', 'ORACLE', 'VRFMANAGER'].forEach(name => {
    console.log(`   ${name}: ${contracts[name]}`);
  });
  
  try {
    console.log('\n🔧 開始設置合約連接...\n');
    
    // 1. 設置 DungeonCore 的新合約地址
    console.log('1️⃣ 設置 DungeonCore 連接...');
    await setupDungeonCore(signer, contracts);
    
    // 2. 設置新合約的 DungeonCore 連接
    console.log('\n2️⃣ 設置新合約的 DungeonCore 連接...');
    await setupNewContractsCore(signer, contracts);
    
    // 3. 設置 DungeonMaster 的特殊連接
    console.log('\n3️⃣ 設置 DungeonMaster 連接...');
    await setupDungeonMaster(signer, contracts);
    
    // 4. 設置祭壇連接
    console.log('\n4️⃣ 設置祭壇連接...');
    await setupAltarConnections(signer, contracts);
    
    // 5. 設置 VRF 連接
    console.log('\n5️⃣ 設置 VRF 連接...');
    await setupVRFConnections(signer, contracts);
    
    // 6. 設置 NFT 合約特殊配置
    console.log('\n6️⃣ 設置 NFT 合約配置...');
    await setupNFTConfigs(signer, contracts);
    
    console.log('\n✅ 所有合約連接設置完成！');
    
  } catch (error) {
    console.error('❌ 設置過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 設置 DungeonCore 的新合約地址
async function setupDungeonCore(signer, contracts) {
  const dungeonCoreABI = [
    'function setHeroAddress(address _address) external',
    'function setRelicAddress(address _address) external', 
    'function setPartyAddress(address _address) external',
    'function setDungeonMasterAddress(address _address) external',
    'function setAltarOfAscensionAddress(address _address) external',
    'function owner() view returns (address)'
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE, dungeonCoreABI, signer);
  
  // 檢查權限
  const owner = await dungeonCore.owner();
  console.log(`   DungeonCore Owner: ${owner}`);
  console.log(`   Current Signer: ${signer.address}`);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log('   ⚠️ 當前執行者不是 DungeonCore 的 owner，跳過設置');
    return;
  }
  
  const connections = [
    ['Hero', 'setHeroAddress', contracts.HERO],
    ['Relic', 'setRelicAddress', contracts.RELIC],
    ['Party', 'setPartyAddress', contracts.PARTY],
    ['DungeonMaster', 'setDungeonMasterAddress', contracts.DUNGEONMASTER],
    ['AltarOfAscension', 'setAltarOfAscensionAddress', contracts.ALTAROFASCENSION]
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
async function setupNewContractsCore(signer, contracts) {
  const contractABI = [
    'function setDungeonCore(address _address) external',
    'function owner() view returns (address)'
  ];
  
  const newContracts = ['HERO', 'RELIC', 'DUNGEONMASTER', 'ALTAROFASCENSION', 'PARTY'];
  
  for (const name of newContracts) {
    try {
      const contract = new ethers.Contract(contracts[name], contractABI, signer);
      
      // 檢查權限
      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`   ⚠️ 不是 ${name} 的 owner，跳過設置`);
        continue;
      }
      
      const tx = await contract.setDungeonCore(contracts.DUNGEONCORE);
      await tx.wait();
      console.log(`   ✅ ${name} DungeonCore 連接設置成功`);
    } catch (error) {
      console.log(`   ❌ ${name} DungeonCore 設置失敗: ${error.message}`);
    }
  }
}

// 設置 DungeonMaster 特殊連接
async function setupDungeonMaster(signer, contracts) {
  const dungeonMasterABI = [
    'function setDungeonStorage(address _address) external',
    'function setSoulShardToken(address _address) external',
    'function setVRFManager(address _address) external',
    'function owner() view returns (address)'
  ];
  
  try {
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER, dungeonMasterABI, signer);
    
    // 檢查權限
    const owner = await dungeonMaster.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('   ⚠️ 不是 DungeonMaster 的 owner，跳過設置');
      return;
    }
    
    // 設置 DungeonStorage
    const tx1 = await dungeonMaster.setDungeonStorage(contracts.DUNGEONSTORAGE);
    await tx1.wait();
    console.log(`   ✅ DungeonStorage 連接設置成功`);
    
    // 設置 SoulShard Token
    const tx2 = await dungeonMaster.setSoulShardToken(contracts.SOULSHARD);
    await tx2.wait();
    console.log(`   ✅ SoulShard Token 連接設置成功`);
    
    // 設置 VRF Manager
    const tx3 = await dungeonMaster.setVRFManager(contracts.VRFMANAGER);
    await tx3.wait();
    console.log(`   ✅ VRF Manager 連接設置成功`);
    
  } catch (error) {
    console.log(`   ❌ DungeonMaster 設置失敗: ${error.message}`);
  }
}

// 設置祭壇連接
async function setupAltarConnections(signer, contracts) {
  const altarABI = [
    'function setHeroContract(address _address) external',
    'function setRelicContract(address _address) external',
    'function setVRFManager(address _address) external',
    'function owner() view returns (address)'
  ];
  
  try {
    const altar = new ethers.Contract(contracts.ALTAROFASCENSION, altarABI, signer);
    
    // 檢查權限
    const owner = await altar.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('   ⚠️ 不是 Altar 的 owner，跳過設置');
      return;
    }
    
    // 設置 Hero 合約
    const tx1 = await altar.setHeroContract(contracts.HERO);
    await tx1.wait();
    console.log(`   ✅ Hero 合約連接設置成功`);
    
    // 設置 Relic 合約
    const tx2 = await altar.setRelicContract(contracts.RELIC);
    await tx2.wait();
    console.log(`   ✅ Relic 合約連接設置成功`);
    
    // 設置 VRF Manager
    const tx3 = await altar.setVRFManager(contracts.VRFMANAGER);
    await tx3.wait();
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
    ['Hero', contracts.HERO],
    ['Relic', contracts.RELIC]
    // DungeonMaster 已在上面設置
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
      
      const tx = await contract.setVRFManager(contracts.VRFMANAGER);
      await tx.wait();
      console.log(`   ✅ ${name} VRF Manager 連接設置成功`);
    } catch (error) {
      console.log(`   ❌ ${name} VRF 設置失敗: ${error.message}`);
    }
  }
}

// 設置 NFT 合約配置
async function setupNFTConfigs(signer, contracts) {
  const nftABI = [
    'function setSoulShardToken(address _address) external',
    'function setAscensionAltarAddress(address _address) external',
    'function owner() view returns (address)'
  ];
  
  const nftContracts = [
    ['Hero', contracts.HERO],
    ['Relic', contracts.RELIC]
  ];
  
  for (const [name, address] of nftContracts) {
    try {
      const contract = new ethers.Contract(address, nftABI, signer);
      
      // 檢查權限
      const owner = await contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`   ⚠️ 不是 ${name} 的 owner，跳過配置設置`);
        continue;
      }
      
      // 設置 SoulShard Token
      const tx1 = await contract.setSoulShardToken(contracts.SOULSHARD);
      await tx1.wait();
      console.log(`   ✅ ${name} SoulShard Token 設置成功`);
      
      // 設置祭壇地址
      const tx2 = await contract.setAscensionAltarAddress(contracts.ALTAROFASCENSION);
      await tx2.wait();
      console.log(`   ✅ ${name} 祭壇地址設置成功`);
      
    } catch (error) {
      console.log(`   ❌ ${name} 配置設置失敗: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
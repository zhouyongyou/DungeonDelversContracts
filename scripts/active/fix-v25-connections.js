#!/usr/bin/env node

/**
 * 修復 V25 合約連接問題腳本
 * 使用正確的函數名稱和邏輯
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('🔧 修復 V25 合約連接問題');
  console.log('==========================\n');

  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  
  console.log(`📋 執行者地址: ${signer.address}`);
  console.log(`💰 餘額: ${ethers.formatEther(await provider.getBalance(signer.address))} BNB\n`);
  
  // V25 合約地址
  const contracts = {
    HERO: '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
    RELIC: '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
    DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    ALTAROFASCENSION: '0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1',
    DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
    PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
    DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
    VRFMANAGER: '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1',
  };

  try {
    // 1. 修復 DungeonCore 連接（使用正確函數名）
    console.log('1️⃣ 修復 DungeonCore 連接...');
    await fixDungeonCoreConnections(signer, contracts);
    
    // 2. 修復祭壇連接（直接設置 DungeonCore）
    console.log('\n2️⃣ 修復祭壇連接...');
    await fixAltarConnections(signer, contracts);

    console.log('\n✅ 所有連接修復完成！');
    
  } catch (error) {
    console.error('❌ 修復過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 修復 DungeonCore 連接（使用正確函數名）
async function fixDungeonCoreConnections(signer, contracts) {
  const dungeonCoreABI = [
    'function setHeroContract(address _newAddress) external',
    'function setRelicContract(address _newAddress) external',
    'function setPartyContract(address _newAddress) external',
    'function setDungeonMaster(address _newAddress) external',
    'function setAltarOfAscension(address _newAddress) external',
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
    ['Hero', 'setHeroContract', contracts.HERO],
    ['Relic', 'setRelicContract', contracts.RELIC],
    ['Party', 'setPartyContract', contracts.PARTY],
    ['DungeonMaster', 'setDungeonMaster', contracts.DUNGEONMASTER],
    ['AltarOfAscension', 'setAltarOfAscension', contracts.ALTAROFASCENSION]
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

// 修復祭壇連接
async function fixAltarConnections(signer, contracts) {
  const altarABI = [
    'function setDungeonCore(address _address) external',
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
    
    // 設置 DungeonCore（這會自動設置 Hero 和 Relic）
    const tx1 = await altar.setDungeonCore(contracts.DUNGEONCORE);
    await tx1.wait();
    console.log(`   ✅ DungeonCore 連接設置成功（自動設置 Hero/Relic）`);
    
    // 設置 VRF Manager
    const tx2 = await altar.setVRFManager(contracts.VRFMANAGER);
    await tx2.wait();
    console.log(`   ✅ VRF Manager 連接設置成功`);
    
  } catch (error) {
    console.log(`   ❌ 祭壇連接設置失敗: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
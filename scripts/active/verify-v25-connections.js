#!/usr/bin/env node

/**
 * 驗證 V25 合約連接狀態
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('✅ 驗證 V25 合約連接狀態');
  console.log('==========================\n');

  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  
  // V25 合約地址
  const contracts = {
    HERO: '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
    RELIC: '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
    DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    ALTAROFASCENSION: '0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1',
    PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
    DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
    VRFMANAGER: '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1',
  };

  try {
    console.log('📊 驗證 DungeonCore 連接...');
    await verifyDungeonCoreConnections(signer, contracts);
    
    console.log('\n📊 驗證 NFT 合約連接...');
    await verifyNFTConnections(signer, contracts);
    
    console.log('\n📊 驗證祭壇連接...');
    await verifyAltarConnections(signer, contracts);
    
    console.log('\n📊 驗證 VRF 功能...');
    await verifyVRFSetup(signer, contracts);

    console.log('\n🎉 V25 合約連接驗證完成！');
    
  } catch (error) {
    console.error('❌ 驗證過程發生錯誤:', error.message);
  }
}

async function verifyDungeonCoreConnections(signer, contracts) {
  const dungeonCoreABI = [
    'function heroContractAddress() view returns (address)',
    'function relicContractAddress() view returns (address)',
    'function partyContractAddress() view returns (address)',
    'function dungeonMasterAddress() view returns (address)',
    'function altarOfAscensionAddress() view returns (address)'
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE, dungeonCoreABI, signer);
  
  const checks = [
    ['Hero', 'heroContractAddress', contracts.HERO],
    ['Relic', 'relicContractAddress', contracts.RELIC],
    ['Party', 'partyContractAddress', contracts.PARTY],
    ['DungeonMaster', 'dungeonMasterAddress', contracts.DUNGEONMASTER],
    ['AltarOfAscension', 'altarOfAscensionAddress', contracts.ALTAROFASCENSION]
  ];
  
  for (const [name, method, expectedAddress] of checks) {
    try {
      const actualAddress = await dungeonCore[method]();
      const isCorrect = actualAddress.toLowerCase() === expectedAddress.toLowerCase();
      console.log(`   ${name}: ${isCorrect ? '✅' : '❌'} ${actualAddress} ${isCorrect ? '' : `(期望: ${expectedAddress})`}`);
    } catch (error) {
      console.log(`   ${name}: ❌ 檢查失敗: ${error.message}`);
    }
  }
}

async function verifyNFTConnections(signer, contracts) {
  const nftABI = [
    'function dungeonCore() view returns (address)',
    'function vrfManager() view returns (address)'
  ];
  
  const nftContracts = [
    ['Hero', contracts.HERO],
    ['Relic', contracts.RELIC]
  ];
  
  for (const [name, address] of nftContracts) {
    try {
      const contract = new ethers.Contract(address, nftABI, signer);
      
      // 檢查 DungeonCore 連接
      const coreAddress = await contract.dungeonCore();
      const coreCorrect = coreAddress.toLowerCase() === contracts.DUNGEONCORE.toLowerCase();
      console.log(`   ${name} -> DungeonCore: ${coreCorrect ? '✅' : '❌'} ${coreAddress}`);
      
      // 檢查 VRF 連接
      const vrfAddress = await contract.vrfManager();
      const vrfCorrect = vrfAddress.toLowerCase() === contracts.VRFMANAGER.toLowerCase();
      console.log(`   ${name} -> VRFManager: ${vrfCorrect ? '✅' : '❌'} ${vrfAddress}`);
      
    } catch (error) {
      console.log(`   ${name}: ❌ 檢查失敗: ${error.message}`);
    }
  }
}

async function verifyAltarConnections(signer, contracts) {
  const altarABI = [
    'function dungeonCore() view returns (address)',
    'function vrfManager() view returns (address)',
    'function heroContract() view returns (address)',
    'function relicContract() view returns (address)'
  ];
  
  try {
    const altar = new ethers.Contract(contracts.ALTAROFASCENSION, altarABI, signer);
    
    // 檢查 DungeonCore 連接
    const coreAddress = await altar.dungeonCore();
    const coreCorrect = coreAddress.toLowerCase() === contracts.DUNGEONCORE.toLowerCase();
    console.log(`   DungeonCore: ${coreCorrect ? '✅' : '❌'} ${coreAddress}`);
    
    // 檢查 VRF 連接
    const vrfAddress = await altar.vrfManager();
    const vrfCorrect = vrfAddress.toLowerCase() === contracts.VRFMANAGER.toLowerCase();
    console.log(`   VRFManager: ${vrfCorrect ? '✅' : '❌'} ${vrfAddress}`);
    
    // 檢查自動獲取的 Hero/Relic 地址
    const heroAddress = await altar.heroContract();
    const heroCorrect = heroAddress.toLowerCase() === contracts.HERO.toLowerCase();
    console.log(`   Hero (auto): ${heroCorrect ? '✅' : '❌'} ${heroAddress}`);
    
    const relicAddress = await altar.relicContract();
    const relicCorrect = relicAddress.toLowerCase() === contracts.RELIC.toLowerCase();
    console.log(`   Relic (auto): ${relicCorrect ? '✅' : '❌'} ${relicAddress}`);
    
  } catch (error) {
    console.log(`   ❌ 祭壇檢查失敗: ${error.message}`);
  }
}

async function verifyVRFSetup(signer, contracts) {
  const vrfABI = [
    'function owner() view returns (address)'
  ];
  
  try {
    const vrfManager = new ethers.Contract(contracts.VRFMANAGER, vrfABI, signer);
    const owner = await vrfManager.owner();
    console.log(`   VRF Manager Owner: ${owner}`);
    console.log(`   執行者是 Owner: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`   ❌ VRF 檢查失敗: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
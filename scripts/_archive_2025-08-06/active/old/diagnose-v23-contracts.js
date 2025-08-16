#!/usr/bin/env node

// V23 合約診斷腳本 - 檢查合約實際接口和狀態

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const v23Config = require('../../config/v23-config');

async function diagnoseContracts() {
  console.log('🔍 開始診斷 V23 合約...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const contracts = v23Config.contracts;
  
  // 1. 檢查 DungeonCore 的 owner 和初始化狀態
  console.log('📌 DungeonCore 診斷:');
  console.log('='.repeat(50));
  
  try {
    const ownerABI = ["function owner() view returns (address)"];
    const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, ownerABI, provider);
    const owner = await dungeonCore.owner();
    console.log(`Owner: ${owner}`);
    console.log(`Expected: 0x10925A7138649C7E1794CE646182eeb5BF8ba647`);
    console.log(`Match: ${owner.toLowerCase() === '0x10925A7138649C7E1794CE646182eeb5BF8ba647'.toLowerCase() ? '✅' : '❌'}`);
  } catch (error) {
    console.log('❌ 無法獲取 owner，可能需要初始化');
  }
  
  // 2. 檢查 DungeonMaster 的函數和狀態
  console.log('\n📌 DungeonMaster 診斷:');
  console.log('='.repeat(50));
  
  try {
    // 檢查是否已經設置了 dungeonCore
    const dmCheckABI = [
      "function dungeonCore() view returns (address)",
      "function owner() view returns (address)",
      "function paused() view returns (bool)"
    ];
    const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dmCheckABI, provider);
    
    try {
      const dungeonCoreAddr = await dungeonMaster.dungeonCore();
      console.log(`DungeonCore: ${dungeonCoreAddr}`);
    } catch (e) {
      console.log('DungeonCore: ❌ 未設置或函數不存在');
    }
    
    try {
      const owner = await dungeonMaster.owner();
      console.log(`Owner: ${owner}`);
    } catch (e) {
      console.log('Owner: ❌ 無法獲取');
    }
    
    try {
      const isPaused = await dungeonMaster.paused();
      console.log(`Paused: ${isPaused ? '⏸️ 已暫停' : '▶️ 運行中'}`);
    } catch (e) {
      console.log('Paused: ❌ 無法獲取');
    }
  } catch (error) {
    console.log('❌ DungeonMaster 診斷失敗:', error.message);
  }
  
  // 3. 檢查 Hero 和 Relic 的接口
  console.log('\n📌 NFT 合約診斷:');
  console.log('='.repeat(50));
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    console.log(`\n${name}:`);
    try {
      const nftABI = [
        "function dungeonCore() view returns (address)",
        "function owner() view returns (address)",
        "function paused() view returns (bool)",
        "function ascensionAltarAddress() view returns (address)"
      ];
      const nft = new ethers.Contract(address, nftABI, provider);
      
      try {
        const dungeonCoreAddr = await nft.dungeonCore();
        console.log(`  DungeonCore: ${dungeonCoreAddr}`);
      } catch (e) {
        console.log('  DungeonCore: ❌ 未設置');
      }
      
      try {
        const owner = await nft.owner();
        console.log(`  Owner: ${owner}`);
      } catch (e) {
        console.log('  Owner: ❌ 無法獲取');
      }
      
      try {
        const altarAddr = await nft.ascensionAltarAddress();
        console.log(`  AscensionAltar: ${altarAddr}`);
      } catch (e) {
        console.log('  AscensionAltar: ❌ 可能使用不同的函數名');
      }
    } catch (error) {
      console.log(`  ❌ 診斷失敗: ${error.message}`);
    }
  }
  
  // 4. 檢查合約是否被暫停
  console.log('\n📌 合約暫停狀態:');
  console.log('='.repeat(50));
  
  const pausableContracts = [
    { name: 'DungeonCore', address: contracts.DUNGEONCORE.address },
    { name: 'Hero', address: contracts.HERO.address },
    { name: 'Relic', address: contracts.RELIC.address },
    { name: 'DungeonMaster', address: contracts.DUNGEONMASTER.address },
    { name: 'VIPStaking', address: contracts.VIPSTAKING.address }
  ];
  
  const pausedABI = ["function paused() view returns (bool)"];
  
  for (const contract of pausableContracts) {
    try {
      const instance = new ethers.Contract(contract.address, pausedABI, provider);
      const isPaused = await instance.paused();
      console.log(`${contract.name}: ${isPaused ? '⏸️ 已暫停' : '▶️ 運行中'}`);
    } catch (error) {
      console.log(`${contract.name}: ❌ 無法檢查`);
    }
  }
  
  // 5. 檢查合約字節碼是否存在
  console.log('\n📌 合約部署狀態:');
  console.log('='.repeat(50));
  
  for (const [name, info] of Object.entries(contracts)) {
    try {
      const code = await provider.getCode(info.address);
      const isDeployed = code !== '0x';
      console.log(`${name}: ${isDeployed ? '✅ 已部署' : '❌ 未部署'}`);
    } catch (error) {
      console.log(`${name}: ❌ 檢查失敗`);
    }
  }
  
  console.log('\n✅ 診斷完成');
  console.log('\n建議：');
  console.log('1. 如果合約被暫停，需要先解除暫停');
  console.log('2. 檢查 owner 是否正確');
  console.log('3. 某些函數可能需要先初始化合約');
}

// 執行
if (require.main === module) {
  diagnoseContracts().catch(console.error);
}

module.exports = { diagnoseContracts };
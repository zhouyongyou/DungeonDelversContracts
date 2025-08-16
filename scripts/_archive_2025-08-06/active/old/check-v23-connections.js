#!/usr/bin/env node

// V23 快速檢查合約連接狀態

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const v23Config = require('../../config/v23-config');

async function checkConnections() {
  console.log('🔍 檢查 V23 合約連接狀態...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const contracts = v23Config.contracts;
  
  // 檢查 DungeonCore 設置
  console.log('📌 DungeonCore 設置狀態:');
  console.log('='.repeat(50));
  
  const dungeonCoreABI = [
    "function heroContract() view returns (address)",
    "function relicContract() view returns (address)",
    "function partyContract() view returns (address)",
    "function dungeonMaster() view returns (address)",
    "function playerVault() view returns (address)",
    "function playerProfile() view returns (address)",
    "function oracleAddress() view returns (address)",
    "function vipStaking() view returns (address)",
    "function altarOfAscension() view returns (address)"
  ];
  
  const dungeonCore = new ethers.Contract(contracts.DUNGEONCORE.address, dungeonCoreABI, provider);
  
  const coreChecks = [
    { name: 'Hero', getter: 'heroContract', expected: contracts.HERO.address },
    { name: 'Relic', getter: 'relicContract', expected: contracts.RELIC.address },
    { name: 'Party', getter: 'partyContract', expected: contracts.PARTY.address },
    { name: 'DungeonMaster', getter: 'dungeonMaster', expected: contracts.DUNGEONMASTER.address },
    { name: 'PlayerVault', getter: 'playerVault', expected: contracts.PLAYERVAULT.address },
    { name: 'PlayerProfile', getter: 'playerProfile', expected: contracts.PLAYERPROFILE.address },
    { name: 'Oracle', getter: 'oracleAddress', expected: contracts.ORACLE.address },
    { name: 'VIPStaking', getter: 'vipStaking', expected: contracts.VIPSTAKING.address },
    { name: 'AltarOfAscension', getter: 'altarOfAscension', expected: contracts.ALTAROFASCENSION.address }
  ];
  
  for (const check of coreChecks) {
    try {
      const actual = await dungeonCore[check.getter]();
      const isCorrect = actual.toLowerCase() === check.expected.toLowerCase();
      console.log(`${check.name}: ${isCorrect ? '✅' : '❌'} ${actual}`);
    } catch (error) {
      console.log(`${check.name}: ❌ Error - ${error.message}`);
    }
  }
  
  // 檢查 Hero 和 Relic 的 DungeonCore
  console.log('\n📌 NFT 合約的 DungeonCore 設置:');
  console.log('='.repeat(50));
  
  const nftABI = ["function dungeonCore() view returns (address)"];
  
  for (const [name, address] of [['Hero', contracts.HERO.address], ['Relic', contracts.RELIC.address]]) {
    try {
      const contract = new ethers.Contract(address, nftABI, provider);
      const dungeonCoreAddr = await contract.dungeonCore();
      const isCorrect = dungeonCoreAddr.toLowerCase() === contracts.DUNGEONCORE.address.toLowerCase();
      console.log(`${name}: ${isCorrect ? '✅' : '❌'} ${dungeonCoreAddr}`);
    } catch (error) {
      console.log(`${name}: ❌ Error - ${error.message}`);
    }
  }
  
  // 檢查 DungeonMaster 設置
  console.log('\n📌 DungeonMaster 設置狀態:');
  console.log('='.repeat(50));
  
  const dmABI = [
    "function dungeonCore() view returns (address)",
    "function dungeonStorage() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function dungeonMasterWallet() view returns (address)"
  ];
  
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER.address, dmABI, provider);
  
  const dmChecks = [
    { name: 'DungeonCore', getter: 'dungeonCore', expected: contracts.DUNGEONCORE.address },
    { name: 'DungeonStorage', getter: 'dungeonStorage', expected: contracts.DUNGEONSTORAGE.address },
    { name: 'SoulShardToken', getter: 'soulShardToken', expected: contracts.SOULSHARD.address },
    { name: 'DungeonMasterWallet', getter: 'dungeonMasterWallet', expected: contracts.DUNGEONMASTERWALLET.address }
  ];
  
  for (const check of dmChecks) {
    try {
      const actual = await dungeonMaster[check.getter]();
      const isCorrect = actual.toLowerCase() === check.expected.toLowerCase();
      console.log(`${check.name}: ${isCorrect ? '✅' : '❌'} ${actual}`);
    } catch (error) {
      console.log(`${check.name}: ❌ Error - ${error.message}`);
    }
  }
  
  console.log('\n✅ 檢查完成');
}

// 執行
if (require.main === module) {
  checkConnections().catch(console.error);
}

module.exports = { checkConnections };
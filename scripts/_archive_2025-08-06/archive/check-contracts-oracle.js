#!/usr/bin/env node

// 檢查 Hero 和 Relic 合約的 Oracle 設定

const { ethers } = require('ethers');
require('dotenv').config();

const config = require('../config/v21-config');
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約 ABI（只需要檢查函數）
const CONTRACT_ABI = [
  "function dungeonCore() external view returns (address)",
  "function getMintPriceInSoulShard(uint256 quantity) external view returns (uint256)",
  "function getRequiredSoulShardAmount(uint256 quantity) external view returns (uint256)"
];

async function checkContractsOracle() {
  console.log('🔍 檢查合約的 Oracle 設定\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 檢查的合約
  const contracts = [
    { name: 'Hero', address: config.contracts.HERO.address },
    { name: 'Relic', address: config.contracts.RELIC.address }
  ];
  
  console.log('📊 當前 Oracle 地址 (V21): ' + config.contracts.ORACLE.address);
  console.log('📊 DungeonCore 地址: ' + config.contracts.DUNGEONCORE.address);
  console.log('');
  
  for (const contractInfo of contracts) {
    console.log(`📝 檢查 ${contractInfo.name} 合約...`);
    console.log(`   地址: ${contractInfo.address}`);
    
    const contract = new ethers.Contract(contractInfo.address, CONTRACT_ABI, provider);
    
    try {
      // 檢查 DungeonCore 地址
      const dungeonCoreAddress = await contract.dungeonCore();
      console.log(`   DungeonCore: ${dungeonCoreAddress}`);
      
      if (dungeonCoreAddress.toLowerCase() !== config.contracts.DUNGEONCORE.address.toLowerCase()) {
        console.log(`   ❌ DungeonCore 地址不匹配！`);
      } else {
        console.log(`   ✅ DungeonCore 地址正確`);
      }
      
      // 嘗試調用價格函數
      try {
        const price = await contract.getRequiredSoulShardAmount(1);
        console.log(`   ✅ 價格查詢成功: ${ethers.formatUnits(price, 18)} SOUL`);
      } catch (error) {
        console.log(`   ❌ 價格查詢失敗: ${error.reason || error.message}`);
        
        if (error.reason === 'OLD') {
          console.log(`   ⚠️  合約可能使用舊的 Oracle 地址`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ 檢查失敗: ${error.message}`);
    }
    
    console.log('');
  }
  
  // 檢查 DungeonCore 的 Oracle
  console.log('📝 檢查 DungeonCore 的 Oracle 設定...');
  const dungeonCoreABI = ["function oracleAddress() external view returns (address)"];
  const dungeonCore = new ethers.Contract(config.contracts.DUNGEONCORE.address, dungeonCoreABI, provider);
  
  try {
    const oracleAddress = await dungeonCore.oracleAddress();
    console.log(`   Oracle 地址: ${oracleAddress}`);
    
    if (oracleAddress.toLowerCase() === config.contracts.ORACLE.address.toLowerCase()) {
      console.log(`   ✅ Oracle 地址已更新到 V21`);
    } else {
      console.log(`   ❌ Oracle 地址仍是舊版本`);
    }
  } catch (error) {
    console.log(`   ❌ 檢查失敗: ${error.message}`);
  }
}

checkContractsOracle().catch(console.error);
#!/usr/bin/env node

// 檢查 DungeonCore 當前的 Oracle 地址

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function oracleAddress() view returns (address)",
  "function owner() view returns (address)"
];

async function checkDungeonCoreOracle() {
  console.log('🔍 檢查 DungeonCore Oracle 地址\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const dungeonCore = new ethers.Contract(
    DUNGEONCORE_ADDRESS,
    DUNGEONCORE_ABI,
    provider
  );
  
  try {
    const owner = await dungeonCore.owner();
    console.log(`📋 DungeonCore Owner: ${owner}`);
    
    const currentOracle = await dungeonCore.oracleAddress();
    console.log(`\n📊 當前 Oracle: ${currentOracle}`);
    
    const expectedOracle = '0xb9317179466fd7fb253669538dE1c4635E81eAc4';
    console.log(`📊 預期 Oracle (V22): ${expectedOracle}`);
    
    if (currentOracle.toLowerCase() === expectedOracle.toLowerCase()) {
      console.log('\n✅ DungeonCore 已經使用最新的 Oracle V22！');
    } else {
      console.log('\n⚠️  DungeonCore 需要更新 Oracle 地址到 V22');
      console.log('\n執行以下命令更新:');
      console.log('node scripts/update-dungeoncore-oracle.js');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

checkDungeonCoreOracle().catch(console.error);
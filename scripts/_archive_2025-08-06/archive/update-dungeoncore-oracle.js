#!/usr/bin/env node

// 手動更新 DungeonCore 的 Oracle 地址到 V22

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const NEW_ORACLE_ADDRESS = '0xb9317179466fd7fb253669538dE1c4635E81eAc4'; // V22

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function setOracle(address _newAddress) external",
  "function oracleAddress() view returns (address)",
  "function owner() view returns (address)"
];

async function updateDungeonCoreOracle() {
  console.log('🔧 更新 DungeonCore 的 Oracle 地址到 V22\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  const dungeonCore = new ethers.Contract(
    DUNGEONCORE_ADDRESS,
    DUNGEONCORE_ABI,
    signer
  );
  
  try {
    // 檢查 owner
    const owner = await dungeonCore.owner();
    console.log(`📋 DungeonCore Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ 錯誤: 您不是 DungeonCore 的 owner');
      console.log(`   您的地址: ${signer.address}`);
      console.log(`   Owner 地址: ${owner}`);
      return;
    }
    
    // 檢查當前 Oracle
    const currentOracle = await dungeonCore.oracleAddress();
    console.log(`\n📊 當前 Oracle: ${currentOracle}`);
    console.log(`📊 新的 Oracle: ${NEW_ORACLE_ADDRESS}`);
    
    if (currentOracle.toLowerCase() === NEW_ORACLE_ADDRESS.toLowerCase()) {
      console.log('\n✅ Oracle 地址已經是最新的 V22！');
      return;
    }
    
    // 更新 Oracle
    console.log('\n📝 發送更新交易...');
    const tx = await dungeonCore.setOracle(NEW_ORACLE_ADDRESS);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    
    await tx.wait();
    console.log('✅ 交易確認');
    
    // 驗證更新
    const newOracle = await dungeonCore.oracleAddress();
    if (newOracle.toLowerCase() === NEW_ORACLE_ADDRESS.toLowerCase()) {
      console.log('\n🎉 成功！DungeonCore 現在使用 Oracle V22');
      console.log(`📋 Oracle V22: ${NEW_ORACLE_ADDRESS}`);
      console.log('🔧 特性: 自適應 TWAP (30/15/5/1 分鐘)');
    } else {
      console.log('\n❌ 更新失敗，Oracle 地址未改變');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.message.includes('execution reverted')) {
      console.log('\n可能的原因:');
      console.log('1. 您不是合約的 owner');
      console.log('2. 合約被暫停（paused）');
      console.log('3. 新的 Oracle 地址無效');
    }
  }
}

updateDungeonCoreOracle().catch(console.error);
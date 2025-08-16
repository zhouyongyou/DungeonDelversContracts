#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONSTORAGE_ADDRESS = '0x17Bd4d145D7dA47833D797297548039D4E666a8f';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// ABI
const DUNGEONSTORAGE_ABI = [
  "function setLogicContract(address _logicContract)",
  "function logicContract() view returns (address)"
];

const DUNGEONMASTER_ABI = [
  "function setDungeonStorage(address _dungeonStorage)",
  "function dungeonStorage() view returns (address)"
];

async function setupConnections() {
  console.log('🔗 設置 DungeonStorage 和 DungeonMaster 連接...\n');
  
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);

  try {
    // 1. 設置 DungeonStorage 的 LogicContract
    console.log('1️⃣ 設置 DungeonStorage 的 LogicContract...');
    console.log(`   DungeonStorage: ${DUNGEONSTORAGE_ADDRESS}`);
    console.log(`   LogicContract: ${DUNGEONMASTER_ADDRESS}`);
    
    const dungeonStorage = new ethers.Contract(DUNGEONSTORAGE_ADDRESS, DUNGEONSTORAGE_ABI, deployer);
    
    // 檢查當前設置
    const currentLogic = await dungeonStorage.logicContract();
    console.log(`   當前 LogicContract: ${currentLogic}`);
    
    if (currentLogic.toLowerCase() !== DUNGEONMASTER_ADDRESS.toLowerCase()) {
      const tx1 = await dungeonStorage.setLogicContract(DUNGEONMASTER_ADDRESS);
      console.log(`   交易哈希: ${tx1.hash}`);
      console.log('   ⏳ 等待確認...');
      await tx1.wait();
      console.log('   ✅ 成功設置 LogicContract\n');
    } else {
      console.log('   ℹ️  LogicContract 已經正確設置\n');
    }
    
    // 2. 設置 DungeonMaster 的 DungeonStorage
    console.log('2️⃣ 設置 DungeonMaster 的 DungeonStorage...');
    console.log(`   DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
    console.log(`   DungeonStorage: ${DUNGEONSTORAGE_ADDRESS}`);
    
    const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, deployer);
    
    // 檢查當前設置
    const currentStorage = await dungeonMaster.dungeonStorage();
    console.log(`   當前 DungeonStorage: ${currentStorage}`);
    
    if (currentStorage.toLowerCase() !== DUNGEONSTORAGE_ADDRESS.toLowerCase()) {
      const tx2 = await dungeonMaster.setDungeonStorage(DUNGEONSTORAGE_ADDRESS);
      console.log(`   交易哈希: ${tx2.hash}`);
      console.log('   ⏳ 等待確認...');
      await tx2.wait();
      console.log('   ✅ 成功設置 DungeonStorage\n');
    } else {
      console.log('   ℹ️  DungeonStorage 已經正確設置\n');
    }
    
    // 驗證設置
    console.log('3️⃣ 驗證設置...');
    const finalLogic = await dungeonStorage.logicContract();
    const finalStorage = await dungeonMaster.dungeonStorage();
    
    console.log(`   DungeonStorage.logicContract: ${finalLogic}`);
    console.log(`   DungeonMaster.dungeonStorage: ${finalStorage}`);
    
    if (finalLogic.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase() &&
        finalStorage.toLowerCase() === DUNGEONSTORAGE_ADDRESS.toLowerCase()) {
      console.log('\n✅ 所有連接已成功設置！');
    } else {
      console.log('\n❌ 設置驗證失敗，請檢查交易狀態');
    }
    
  } catch (error) {
    console.error('\n❌ 設置失敗:', error);
    process.exit(1);
  }
}

// 執行設置
setupConnections().catch(console.error);
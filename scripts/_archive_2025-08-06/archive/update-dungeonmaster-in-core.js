#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const CORRECT_DUNGEONMASTER = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function setDungeonMaster(address _dungeonMaster)",
  "function dungeonMasterAddress() view returns (address)"
];

async function updateDungeonMaster() {
  console.log('🔧 更新 DungeonCore 中的 DungeonMaster 地址...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);

  try {
    const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, deployer);
    
    // 檢查當前地址
    const currentAddress = await dungeonCore.dungeonMasterAddress();
    console.log(`當前 DungeonMaster: ${currentAddress}`);
    console.log(`正確 DungeonMaster: ${CORRECT_DUNGEONMASTER}`);
    
    if (currentAddress.toLowerCase() === CORRECT_DUNGEONMASTER.toLowerCase()) {
      console.log('\n✅ DungeonMaster 地址已經正確');
      return;
    }
    
    // 更新地址
    console.log('\n正在更新...');
    const tx = await dungeonCore.setDungeonMaster(CORRECT_DUNGEONMASTER);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    await tx.wait();
    
    // 驗證更新
    const newAddress = await dungeonCore.dungeonMasterAddress();
    console.log(`\n新的 DungeonMaster: ${newAddress}`);
    
    if (newAddress.toLowerCase() === CORRECT_DUNGEONMASTER.toLowerCase()) {
      console.log('✅ 更新成功！');
    } else {
      console.log('❌ 更新失敗');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  }
}

// 執行更新
updateDungeonMaster().catch(console.error);
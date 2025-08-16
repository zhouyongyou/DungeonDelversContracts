#!/usr/bin/env node

// 修復 VIPStaking 在 DungeonCore 的設置

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function fixVIPStaking() {
  console.log('🔧 修復 VIPStaking 設置...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  const dungeonCoreABI = [
    "function vipStakingAddress() view returns (address)",
    "function setVipStaking(address _vipStaking) external",
    "function owner() view returns (address)"
  ];
  
  const dungeonCore = new ethers.Contract(v23Config.contracts.DUNGEONCORE.address, dungeonCoreABI, deployer);
  
  try {
    // 檢查當前狀態
    const currentVIP = await dungeonCore.vipStakingAddress();
    console.log(`當前 VIPStaking: ${currentVIP}`);
    
    if (currentVIP === ethers.ZeroAddress) {
      console.log('設置 VIPStaking...');
      const tx = await dungeonCore.setVipStaking(v23Config.contracts.VIPSTAKING.address);
      console.log(`交易: ${tx.hash}`);
      await tx.wait();
      
      // 驗證
      const newVIP = await dungeonCore.vipStakingAddress();
      console.log(`新 VIPStaking: ${newVIP}`);
      console.log(`✅ 成功`);
    } else {
      console.log('✅ VIPStaking 已設置');
    }
  } catch (error) {
    console.log(`❌ 錯誤: ${error.message}`);
  }
}

fixVIPStaking().catch(console.error);
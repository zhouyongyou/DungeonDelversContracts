#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const PARTY_ADDRESS = '0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee';
const PLAYERPROFILE_ADDRESS = '0x4998FADF96Be619d54f6E9bcc654F89937201FBe';
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// ABIs
const PARTY_ABI = [
  "function platformFee() view returns (uint256)",
  "function dungeonCoreContract() view returns (address)"
];

const PLAYERPROFILE_ABI = [
  "function referralCommissionPercentage() view returns (uint256)",
  "function dungeonCore() view returns (address)"
];

const DUNGEONCORE_ABI = [
  "function taxPercentage() view returns (uint256)",
  "function maxTaxPercentage() view returns (uint256)",
  "function minTaxPercentage() view returns (uint256)",
  "function partyContractAddress() view returns (address)",
  "function playerProfileAddress() view returns (address)"
];

const DUNGEONMASTER_ABI = [
  "function challengeCooldown() view returns (uint256)",
  "function dungeonCore() view returns (address)"
];

async function checkAllParams() {
  console.log('🔍 檢查所有參數讀取問題...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);

  // 1. 檢查 Party 平台費
  console.log('📦 Party 合約:');
  try {
    const party = new ethers.Contract(PARTY_ADDRESS, PARTY_ABI, provider);
    
    // 檢查 DungeonCore 連接
    const dungeonCore = await party.dungeonCoreContract();
    console.log(`  DungeonCore: ${dungeonCore}`);
    
    // 讀取平台費
    const platformFee = await party.platformFee();
    console.log(`  平台費: ${ethers.formatEther(platformFee)} BNB`);
  } catch (e) {
    console.log(`  ❌ 錯誤: ${e.message}`);
  }
  console.log('');

  // 2. 檢查 PlayerProfile 邀請佣金率
  console.log('👤 PlayerProfile 合約:');
  try {
    const playerProfile = new ethers.Contract(PLAYERPROFILE_ADDRESS, PLAYERPROFILE_ABI, provider);
    
    // 檢查 DungeonCore 連接
    const dungeonCore = await playerProfile.dungeonCore();
    console.log(`  DungeonCore: ${dungeonCore}`);
    
    // 讀取邀請佣金率
    const commission = await playerProfile.referralCommissionPercentage();
    console.log(`  邀請佣金率: ${commission}%`);
  } catch (e) {
    console.log(`  ❌ 錯誤: ${e.message}`);
  }
  console.log('');

  // 3. 檢查 DungeonCore 稅務參數
  console.log('🏛️  DungeonCore 合約:');
  try {
    const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, provider);
    
    // 讀取稅務參數
    const taxPercentage = await dungeonCore.taxPercentage();
    const minTax = await dungeonCore.minTaxPercentage();
    const maxTax = await dungeonCore.maxTaxPercentage();
    
    console.log(`  當前稅率: ${taxPercentage}%`);
    console.log(`  最小稅率: ${minTax}%`);
    console.log(`  最大稅率: ${maxTax}%`);
    
    // 檢查註冊的合約地址
    const partyAddress = await dungeonCore.partyContractAddress();
    const profileAddress = await dungeonCore.playerProfileAddress();
    
    console.log(`  Party 地址: ${partyAddress}`);
    console.log(`  Profile 地址: ${profileAddress}`);
  } catch (e) {
    console.log(`  ❌ 錯誤: ${e.message}`);
  }
  console.log('');

  // 4. 檢查 DungeonMaster 冷卻時間
  console.log('⚔️  DungeonMaster 合約:');
  try {
    const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, provider);
    
    // 檢查 DungeonCore 連接
    const dungeonCore = await dungeonMaster.dungeonCore();
    console.log(`  DungeonCore: ${dungeonCore}`);
    
    // 讀取冷卻時間
    const cooldown = await dungeonMaster.challengeCooldown();
    console.log(`  挑戰冷卻時間: ${cooldown} 秒`);
  } catch (e) {
    console.log(`  ❌ 錯誤: ${e.message}`);
  }
}

// 執行檢查
checkAllParams().catch(console.error);
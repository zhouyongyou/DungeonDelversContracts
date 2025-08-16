#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function dungeonMasterAddress() view returns (address)",
  "function dungeonMaster() view returns (address)",
  "function altarOfAscensionAddress() view returns (address)",
  "function oracleAddress() view returns (address)",
  "function playerVaultAddress() view returns (address)",
  "function playerProfileAddress() view returns (address)",
  "function vipStakingAddress() view returns (address)",
  "function heroContractAddress() view returns (address)",
  "function relicContractAddress() view returns (address)",
  "function partyContractAddress() view returns (address)"
];

async function checkDungeonCoreState() {
  console.log('🔍 檢查 DungeonCore 狀態...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, provider);

  console.log('📋 DungeonCore 註冊的合約地址：\n');

  // 嘗試兩種可能的函數名稱
  console.log('1️⃣ DungeonMaster:');
  try {
    const dm1 = await dungeonCore.dungeonMasterAddress();
    console.log(`   dungeonMasterAddress(): ${dm1}`);
  } catch (e) {
    console.log(`   dungeonMasterAddress(): ❌ 函數不存在`);
  }
  
  try {
    const dm2 = await dungeonCore.dungeonMaster();
    console.log(`   dungeonMaster(): ${dm2}`);
  } catch (e) {
    console.log(`   dungeonMaster(): ❌ 函數不存在`);
  }
  
  console.log(`   預期地址: ${DUNGEONMASTER_ADDRESS}`);
  console.log('');

  // 檢查其他地址
  const checks = [
    { name: 'Oracle', func: 'oracleAddress' },
    { name: 'PlayerVault', func: 'playerVaultAddress' },
    { name: 'AltarOfAscension', func: 'altarOfAscensionAddress' },
    { name: 'PlayerProfile', func: 'playerProfileAddress' },
    { name: 'VIPStaking', func: 'vipStakingAddress' },
    { name: 'Hero', func: 'heroContractAddress' },
    { name: 'Relic', func: 'relicContractAddress' },
    { name: 'Party', func: 'partyContractAddress' }
  ];

  for (const check of checks) {
    try {
      const address = await dungeonCore[check.func]();
      console.log(`${check.name}: ${address}`);
    } catch (e) {
      console.log(`${check.name}: ❌ 讀取失敗`);
    }
  }
}

// 執行檢查
checkDungeonCoreState().catch(console.error);
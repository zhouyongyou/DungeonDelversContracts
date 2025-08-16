#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 檢查的地址
const addresses = {
  'AltarOfAscension (config)': '0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f',
  'DungeonCore': '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9'
};

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function altarOfAscensionAddress() view returns (address)"
];

async function checkAltar() {
  console.log('🔍 檢查 AltarOfAscension 合約...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 1. 檢查配置中的地址
  for (const [name, address] of Object.entries(addresses)) {
    const code = await provider.getCode(address);
    const hasContract = code !== '0x';
    
    console.log(`${name}:`);
    console.log(`  地址: ${address}`);
    console.log(`  狀態: ${hasContract ? '✅ 有合約' : '❌ 無合約'}`);
    
    if (hasContract) {
      console.log(`  代碼長度: ${code.length} bytes`);
    }
    console.log('');
  }
  
  // 2. 從 DungeonCore 獲取註冊的地址
  console.log('📋 從 DungeonCore 獲取 AltarOfAscension 地址...');
  try {
    const dungeonCore = new ethers.Contract(addresses.DungeonCore, DUNGEONCORE_ABI, provider);
    const altarAddress = await dungeonCore.altarOfAscensionAddress();
    
    console.log(`  DungeonCore 中的地址: ${altarAddress}`);
    
    // 檢查這個地址是否有合約
    const altarCode = await provider.getCode(altarAddress);
    const hasAltarContract = altarCode !== '0x';
    console.log(`  狀態: ${hasAltarContract ? '✅ 有合約' : '❌ 無合約'}`);
    
    if (hasAltarContract && altarCode.length > 2) {
      console.log(`  代碼長度: ${altarCode.length} bytes`);
    }
    
  } catch (e) {
    console.log(`  ❌ 讀取失敗: ${e.message}`);
  }
}

// 執行檢查
checkAltar().catch(console.error);
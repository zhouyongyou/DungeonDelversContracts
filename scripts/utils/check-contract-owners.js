#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const contracts = {
  'Party': '0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee',
  'PlayerProfile': '0x4998FADF96Be619d54f6E9bcc654F89937201FBe',
  'DungeonCore': '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  'DungeonMaster': '0xd13250E0F0766006816d7AfE95EaEEc5e215d082',
  'AltarOfAscension': '0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f',
  'VIPStaking': '0xc59B9944a9CbB947F4067F941EbFB0a5A2564eb9',
  'Hero': '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  'Relic': '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3',
  'PlayerVault': '0x76d4f6f7270eE61743487c43Cf5E7281238d77F9'
};

// Owner function ABIs
const OWNER_ABI = [
  "function owner() view returns (address)",
  "function admin() view returns (address)"
];

async function checkOwners() {
  console.log('🔍 檢查所有合約的 Owner/Admin...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployerAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  
  console.log(`📝 Deployer 地址: ${deployerAddress}\n`);

  for (const [name, address] of Object.entries(contracts)) {
    console.log(`📦 ${name}:`);
    console.log(`   地址: ${address}`);
    
    const contract = new ethers.Contract(address, OWNER_ABI, provider);
    
    // 嘗試讀取 owner
    try {
      const owner = await contract.owner();
      console.log(`   Owner: ${owner}`);
      console.log(`   匹配: ${owner.toLowerCase() === deployerAddress.toLowerCase() ? '✅' : '❌'}`);
    } catch (e) {
      // 如果沒有 owner，嘗試 admin
      try {
        const admin = await contract.admin();
        console.log(`   Admin: ${admin}`);
        console.log(`   匹配: ${admin.toLowerCase() === deployerAddress.toLowerCase() ? '✅' : '❌'}`);
      } catch (e2) {
        console.log(`   ❌ 無法讀取 owner/admin`);
      }
    }
    console.log('');
  }
}

// 執行檢查
checkOwners().catch(console.error);
#!/usr/bin/env node

// 驗證所有項目配置的一致性

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

// 主配置文件
const V22_CONFIG = require('../config/v22-config.js');

// 需要檢查的文件
const FILES_TO_CHECK = [
  {
    name: '前端 contracts.ts',
    path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
    type: 'typescript'
  },
  {
    name: '後端 contracts.js',
    path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js',
    type: 'javascript'
  },
  {
    name: '子圖 subgraph.yaml',
    path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml',
    type: 'yaml'
  },
  {
    name: '維護腳本 auto-maintenance-v2.js',
    path: '/Users/sotadic/Documents/DungeonDelversContracts/scripts/auto-maintenance-v2.js',
    type: 'javascript'
  }
];

// 主要合約名稱對照
const CONTRACT_MAPPING = {
  'ORACLE': ['oracle', 'oracleAddress', 'ORACLE_ADDRESS'],
  'HERO': ['hero', 'heroAddress', 'HERO_ADDRESS'],
  'RELIC': ['relic', 'relicAddress', 'RELIC_ADDRESS'],
  'PARTY': ['party', 'partyAddress', 'PARTY_ADDRESS'],
  'DUNGEONCORE': ['dungeonCore', 'DUNGEONCORE_ADDRESS'],
  'PLAYERVAULT': ['playerVault', 'PLAYERVAULT_ADDRESS'],
  'DUNGEONMASTER': ['dungeonMaster', 'DUNGEONMASTER_ADDRESS'],
  'VIPSTAKING': ['vipStaking', 'VIPSTAKING_ADDRESS'],
  'PLAYERPROFILE': ['playerProfile', 'PLAYERPROFILE_ADDRESS'],
  'ALTAROFASCENSION': ['altarOfAscension', 'ALTAROFASCENSION_ADDRESS'],
  'DUNGEONSTORAGE': ['dungeonStorage', 'DUNGEONSTORAGE_ADDRESS']
};

function extractAddresses(content, fileName) {
  const addresses = {};
  
  // 針對不同文件類型使用不同的提取邏輯
  if (fileName.includes('contracts.ts')) {
    // TypeScript 格式：尋找 KEY: 'address' 模式
    const tsRegex = /(\w+):\s*['"]0x[a-fA-F0-9]{40}['"]/g;
    let match;
    while ((match = tsRegex.exec(content)) !== null) {
      const key = match[1];
      const addressMatch = match[0].match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        addresses[key] = addressMatch[0];
      }
    }
  } else if (fileName.includes('contracts.js')) {
    // JavaScript 格式：尋找 key: "address" 模式
    const jsRegex = /(\w+):\s*["']0x[a-fA-F0-9]{40}["']/g;
    let match;
    while ((match = jsRegex.exec(content)) !== null) {
      const key = match[1].toUpperCase();
      const addressMatch = match[0].match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        // 特殊處理後端的命名約定
        if (key === 'DUNGEONCORE') addresses['DUNGEONCORE'] = addressMatch[0];
        else if (key === 'ORACLE') addresses['ORACLE'] = addressMatch[0];
        else if (key === 'SOULSHARD') addresses['SOULSHARD'] = addressMatch[0];
        else if (key === 'HERO') addresses['HERO'] = addressMatch[0];
        else if (key === 'RELIC') addresses['RELIC'] = addressMatch[0];
        else if (key === 'PARTY') addresses['PARTY'] = addressMatch[0];
        else if (key === 'DUNGEONMASTER') addresses['DUNGEONMASTER'] = addressMatch[0];
        else if (key === 'PLAYERVAULT') addresses['PLAYERVAULT'] = addressMatch[0];
        else if (key === 'PLAYERPROFILE') addresses['PLAYERPROFILE'] = addressMatch[0];
        else if (key === 'ALTAROFASCENSION') addresses['ALTAROFASCENSION'] = addressMatch[0];
        else if (key === 'VIPSTAKING') addresses['VIPSTAKING'] = addressMatch[0];
        else if (key === 'DUNGEONSTORAGE') addresses['DUNGEONSTORAGE'] = addressMatch[0];
        else if (key === 'USD') addresses['USD'] = addressMatch[0];
        else if (key === 'UNISWAPPOOL') addresses['UNISWAP_POOL'] = addressMatch[0];
      }
    }
  } else if (fileName.includes('subgraph.yaml')) {
    // YAML 格式：尋找 address: 'address' 模式
    const yamlRegex = /address:\s*['"]0x[a-fA-F0-9]{40}['"]/g;
    const nameRegex = /name:\s*(\w+)/g;
    
    // 先提取所有名稱
    const names = [];
    let nameMatch;
    while ((nameMatch = nameRegex.exec(content)) !== null) {
      names.push(nameMatch[1]);
    }
    
    // 然後提取地址
    let addressIndex = 0;
    let addressMatch;
    while ((addressMatch = yamlRegex.exec(content)) !== null) {
      const address = addressMatch[0].match(/0x[a-fA-F0-9]{40}/)[0];
      if (names[addressIndex]) {
        addresses[names[addressIndex].toUpperCase()] = address;
      }
      addressIndex++;
    }
  } else {
    // 通用提取邏輯
    const genericRegex = /(\w+).*?0x[a-fA-F0-9]{40}/g;
    let match;
    while ((match = genericRegex.exec(content)) !== null) {
      const key = match[1].toUpperCase();
      const addressMatch = match[0].match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch && CONTRACT_MAPPING[key]) {
        addresses[key] = addressMatch[0];
      }
    }
  }
  
  return addresses;
}

function compareAddresses(v22Addresses, fileAddresses, fileName) {
  const issues = [];
  
  for (const [contractName, v22Address] of Object.entries(v22Addresses)) {
    const fileAddress = fileAddresses[contractName];
    
    if (!fileAddress) {
      issues.push(`⚠️  ${contractName}: 未找到地址`);
    } else if (fileAddress.toLowerCase() !== v22Address.toLowerCase()) {
      issues.push(`❌ ${contractName}: ${fileAddress} (應為 ${v22Address})`);
    }
  }
  
  return issues;
}

async function validateConfigs() {
  console.log('🔍 驗證所有項目配置的一致性\n');
  console.log('📄 主配置: V22 (2025-07-25)\n');
  
  // 從 V22 配置提取地址
  const v22Addresses = {};
  for (const [key, value] of Object.entries(V22_CONFIG.contracts)) {
    if (value.address) {
      v22Addresses[key] = value.address;
    }
  }
  
  console.log('主要合約地址:');
  console.log(`  Oracle V22: ${v22Addresses.ORACLE}`);
  console.log(`  DungeonCore: ${v22Addresses.DUNGEONCORE}`);
  console.log(`  Hero: ${v22Addresses.HERO}`);
  console.log(`  Relic: ${v22Addresses.RELIC}`);
  console.log('\n========================================\n');
  
  let allPassed = true;
  
  // 檢查每個文件
  for (const file of FILES_TO_CHECK) {
    console.log(`📁 檢查: ${file.name}`);
    
    try {
      if (!fs.existsSync(file.path)) {
        console.log(`  ⚠️  文件不存在`);
        allPassed = false;
        continue;
      }
      
      const content = fs.readFileSync(file.path, 'utf8');
      const fileAddresses = extractAddresses(content, file.name);
      
      // 特殊處理: 檢查 Oracle V22 地址
      if (content.includes(v22Addresses.ORACLE)) {
        console.log(`  ✅ 使用 Oracle V22`);
      } else if (content.includes('0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B')) {
        console.log(`  ❌ 仍在使用舊版 Oracle V21`);
        allPassed = false;
      }
      
      // 比較其他地址
      const issues = compareAddresses(v22Addresses, fileAddresses, file.name);
      
      if (issues.length === 0) {
        console.log(`  ✅ 所有地址正確`);
      } else {
        allPassed = false;
        issues.forEach(issue => console.log(`  ${issue}`));
      }
      
    } catch (error) {
      console.log(`  ❌ 讀取錯誤: ${error.message}`);
      allPassed = false;
    }
    
    console.log('');
  }
  
  // 總結
  console.log('========================================');
  if (allPassed) {
    console.log('✅ 所有配置一致！');
  } else {
    console.log('⚠️  發現配置不一致，請執行同步更新');
    console.log('\n建議執行:');
    console.log('1. cd /Users/sotadic/Documents/DungeonDelversContracts');
    console.log('2. npm run sync:config');
  }
  
  // 額外檢查: DungeonCore 的 Oracle 地址
  console.log('\n========================================');
  console.log('🔗 檢查鏈上狀態...');
  
  const BSC_RPC = 'https://bsc-dataseed.binance.org/';
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dungeonCoreABI = [
    "function oracleAddress() view returns (address)"
  ];
  
  const dungeonCore = new ethers.Contract(
    v22Addresses.DUNGEONCORE,
    dungeonCoreABI,
    provider
  );
  
  try {
    const onchainOracle = await dungeonCore.oracleAddress();
    console.log(`\nDungeonCore 鏈上 Oracle: ${onchainOracle}`);
    
    if (onchainOracle.toLowerCase() === v22Addresses.ORACLE.toLowerCase()) {
      console.log('✅ DungeonCore 已使用 Oracle V22');
    } else {
      console.log('❌ DungeonCore 需要更新 Oracle 地址');
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ 無法查詢鏈上狀態: ${error.message}`);
  }
  
  console.log('\n========================================\n');
  
  return allPassed;
}

validateConfigs().catch(console.error);
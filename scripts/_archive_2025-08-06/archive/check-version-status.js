#!/usr/bin/env node

// 檢查當前版本狀態和問題

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const provider = new ethers.JsonRpcProvider(BSC_RPC);

// 當前部署的地址
const CURRENT_CONTRACTS = {
  ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9',
  DUNGEON_CORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  HERO: '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  RELIC: '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3'
};

async function checkVersionStatus() {
  console.log('🔍 檢查當前版本狀態...\n');
  
  console.log('📋 版本追踪:');
  console.log('   當前部署: V19');
  console.log('   計劃升級: V20');
  console.log('   主要問題: Oracle 缺少 public 函數\n');
  
  // 檢查 Oracle 問題
  console.log('🔍 Oracle 合約檢查:');
  
  const oracleChecks = [
    { name: 'getSoulShardPriceInUSD', sig: 'function getSoulShardPriceInUSD() view returns (uint256)' },
    { name: 'getAmountOut', sig: 'function getAmountOut(address,uint256) view returns (uint256)' },
    { name: 'getLatestPrice', sig: 'function getLatestPrice() view returns (uint256)' },
    { name: 'poolAddress', sig: 'function poolAddress() view returns (address)' },
    { name: 'token0', sig: 'function token0() view returns (address)' },
    { name: 'token1', sig: 'function token1() view returns (address)' },
    { name: 'soulToken', sig: 'function soulToken() view returns (address)' }
  ];
  
  for (const check of oracleChecks) {
    try {
      const contract = new ethers.Contract(CURRENT_CONTRACTS.ORACLE, [check.sig], provider);
      const result = await contract[check.name](...(check.name === 'getAmountOut' ? ['0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', ethers.parseUnits('1', 18)] : []));
      console.log(`   ✅ ${check.name}: 存在且可調用`);
    } catch (e) {
      console.log(`   ❌ ${check.name}: 不存在或無法調用`);
    }
  }
  
  // 檢查版本混亂的文件
  console.log('\n📁 Oracle 文件版本分析:');
  
  const oracleFiles = [
    '/contracts/defi/Oracle.sol',
    '/contracts/defi/Oracle_Final.sol',
    '/contracts/defi/Oracle_QuickFix.sol',
    '/contracts/defi/OracleV20.sol'
  ];
  
  const baseDir = path.join(__dirname, '..');
  
  for (const file of oracleFiles) {
    const fullPath = path.join(baseDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasPublicGetPrice = content.includes('function getSoulShardPriceInUSD() public');
      const hasGetLatestPrice = content.includes('function getLatestPrice()');
      console.log(`   ${file}:`);
      console.log(`     - getSoulShardPriceInUSD public: ${hasPublicGetPrice ? '✅' : '❌'}`);
      console.log(`     - getLatestPrice: ${hasGetLatestPrice ? '✅' : '❌'}`);
    }
  }
  
  // 建議
  console.log('\n💡 版本管理建議:');
  console.log('   1. 部署 Oracle_Final.sol 作為 V20');
  console.log('   2. 清理多餘的 Oracle 版本文件');
  console.log('   3. 建立明確的版本命名規範');
  console.log('   4. 使用 Git tags 標記每個部署版本');
  
  // 檢查配置一致性
  console.log('\n🔍 配置一致性檢查:');
  
  const configFiles = [
    {
      name: '前端 contracts.ts',
      path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
      pattern: 'ORACLE:'
    },
    {
      name: '後端 .env',
      path: '/Users/sotadic/Documents/GitHub/backend-nft-marketplace-master/.env',
      pattern: 'ORACLE_ADDRESS='
    },
    {
      name: '子圖 networks.json',
      path: '/Users/sotadic/Documents/DungeonDelvers-Subgraph/networks.json',
      pattern: 'oracle'
    }
  ];
  
  for (const config of configFiles) {
    if (fs.existsSync(config.path)) {
      const content = fs.readFileSync(config.path, 'utf8');
      const hasOldOracle = content.includes(CURRENT_CONTRACTS.ORACLE);
      console.log(`   ${config.name}: ${hasOldOracle ? '✅ 包含當前 Oracle' : '❌ 地址不同'}`);
    } else {
      console.log(`   ${config.name}: ⚠️ 文件不存在`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 總結:');
  console.log('   - Oracle 部署了錯誤版本（缺少 public 函數）');
  console.log('   - 需要部署 Oracle_Final 並更新為 V20');
  console.log('   - 所有配置需要同步更新');
  console.log('   - 建議實施版本管理最佳實踐');
  console.log('='.repeat(60));
}

checkVersionStatus().catch(console.error);
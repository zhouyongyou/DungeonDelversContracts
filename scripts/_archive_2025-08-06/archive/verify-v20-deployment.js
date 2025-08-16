#!/usr/bin/env node

// V20 部署前驗證腳本
// 確保所有準備工作已完成

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入環境變數
dotenv.config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const provider = new ethers.JsonRpcProvider(BSC_RPC);

// 合約地址
const CONTRACTS = {
  ORACLE_OLD: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9',
  DUNGEON_CORE: '0x3c97732E72Db4Bc9B3033cAAc08C4Be24C3fB84c',
  HERO: '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  RELIC: '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOULSHARD: '0x4e02B4d0A6b6a90fDDFF058B8a6148BA3F909915'
};

// 驗證步驟
async function verifyDeploymentReadiness() {
  console.log('🔍 V20 部署前驗證\n');
  console.log('=' + '='.repeat(59));
  
  let allChecksPass = true;
  
  try {
    // 1. 檢查部署者配置
    console.log('\n📋 1. 檢查部署者配置');
    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerKey) {
      console.log('   ❌ DEPLOYER_PRIVATE_KEY 未設置');
      allChecksPass = false;
    } else {
      const deployer = new ethers.Wallet(deployerKey, provider);
      const balance = await provider.getBalance(deployer.address);
      console.log(`   ✅ 部署者地址: ${deployer.address}`);
      console.log(`   ✅ BNB 餘額: ${ethers.formatEther(balance)} BNB`);
      
      if (balance < ethers.parseEther('0.05')) {
        console.log('   ⚠️ BNB 餘額可能不足 (建議至少 0.05 BNB)');
        allChecksPass = false;
      }
    }
    
    // 2. 檢查合約文件
    console.log('\n📋 2. 檢查合約文件');
    const oracleV20Path = path.join(__dirname, '..', 'contracts', 'defi', 'OracleV20.sol');
    if (fs.existsSync(oracleV20Path)) {
      console.log('   ✅ OracleV20.sol 存在');
      
      // 檢查是否包含必要的函數
      const content = fs.readFileSync(oracleV20Path, 'utf8');
      const requiredFunctions = [
        'getLatestPrice',
        'getAmountOut',
        'token0',
        'token1',
        'soulToken',
        'poolAddress'
      ];
      
      let missingFunctions = [];
      for (const func of requiredFunctions) {
        if (!content.includes(`function ${func}`)) {
          missingFunctions.push(func);
        }
      }
      
      if (missingFunctions.length > 0) {
        console.log(`   ❌ 缺少函數: ${missingFunctions.join(', ')}`);
        allChecksPass = false;
      } else {
        console.log('   ✅ 所有必要函數都存在');
      }
    } else {
      console.log('   ❌ OracleV20.sol 文件不存在');
      allChecksPass = false;
    }
    
    // 3. 檢查當前 Oracle 狀態
    console.log('\n📋 3. 檢查當前 Oracle 狀態');
    const oracleCode = await provider.getCode(CONTRACTS.ORACLE_OLD);
    if (oracleCode === '0x') {
      console.log('   ❌ 舊 Oracle 合約不存在');
    } else {
      console.log('   ✅ 舊 Oracle 合約已部署');
      
      // 測試基本調用
      const oracleABI = ['function owner() view returns (address)'];
      const oracle = new ethers.Contract(CONTRACTS.ORACLE_OLD, oracleABI, provider);
      
      try {
        const owner = await oracle.owner();
        console.log(`   ✅ Oracle owner: ${owner}`);
      } catch (e) {
        console.log('   ⚠️ 無法讀取 Oracle owner');
      }
    }
    
    // 4. 檢查 DungeonCore 連接
    console.log('\n📋 4. 檢查 DungeonCore 連接');
    const dungeonCoreABI = [
      'function oracle() view returns (address)',
      'function owner() view returns (address)'
    ];
    const dungeonCore = new ethers.Contract(CONTRACTS.DUNGEON_CORE, dungeonCoreABI, provider);
    
    try {
      const currentOracle = await dungeonCore.oracle();
      console.log(`   ✅ DungeonCore 當前 Oracle: ${currentOracle}`);
      
      if (currentOracle.toLowerCase() !== CONTRACTS.ORACLE_OLD.toLowerCase()) {
        console.log('   ⚠️ DungeonCore 的 Oracle 地址不匹配');
      }
      
      const owner = await dungeonCore.owner();
      console.log(`   ✅ DungeonCore owner: ${owner}`);
      
      // 檢查部署者是否是 owner
      if (deployerKey) {
        const deployer = new ethers.Wallet(deployerKey, provider);
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.log('   ⚠️ 部署者不是 DungeonCore 的 owner');
          allChecksPass = false;
        }
      }
    } catch (e) {
      console.log('   ❌ 無法讀取 DungeonCore 數據:', e.message);
      allChecksPass = false;
    }
    
    // 5. 檢查 Uniswap Pool
    console.log('\n📋 5. 檢查 Uniswap Pool');
    const poolABI = [
      'function token0() view returns (address)',
      'function token1() view returns (address)',
      'function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)'
    ];
    const pool = new ethers.Contract(CONTRACTS.UNISWAP_POOL, poolABI, provider);
    
    try {
      const token0 = await pool.token0();
      const token1 = await pool.token1();
      console.log(`   ✅ Pool token0: ${token0}`);
      console.log(`   ✅ Pool token1: ${token1}`);
      
      // 檢查 token 地址是否正確
      const tokens = [token0.toLowerCase(), token1.toLowerCase()];
      const expectedTokens = [CONTRACTS.USD.toLowerCase(), CONTRACTS.SOULSHARD.toLowerCase()];
      
      if (!tokens.includes(expectedTokens[0]) || !tokens.includes(expectedTokens[1])) {
        console.log('   ❌ Pool tokens 不匹配預期的 USD/SOUL');
        allChecksPass = false;
      }
      
      const slot0 = await pool.slot0();
      console.log(`   ✅ Pool unlocked: ${slot0[6]}`);
      
      if (!slot0[6]) {
        console.log('   ⚠️ Pool 可能被鎖定');
      }
    } catch (e) {
      console.log('   ❌ 無法讀取 Pool 數據:', e.message);
      allChecksPass = false;
    }
    
    // 6. 檢查編譯狀態
    console.log('\n📋 6. 檢查編譯狀態');
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    if (fs.existsSync(artifactsPath)) {
      const oracleArtifact = path.join(artifactsPath, 'contracts', 'defi', 'OracleV20.sol', 'OracleV20.json');
      if (fs.existsSync(oracleArtifact)) {
        console.log('   ✅ OracleV20 已編譯');
      } else {
        console.log('   ❌ OracleV20 未編譯，請執行: npx hardhat compile');
        allChecksPass = false;
      }
    } else {
      console.log('   ❌ artifacts 目錄不存在，請執行: npx hardhat compile');
      allChecksPass = false;
    }
    
    // 7. 檢查部署腳本
    console.log('\n📋 7. 檢查部署腳本');
    const deployScript = path.join(__dirname, 'deploy-v20-complete.js');
    if (fs.existsSync(deployScript)) {
      console.log('   ✅ deploy-v20-complete.js 存在');
      
      // 檢查腳本權限
      try {
        fs.accessSync(deployScript, fs.constants.X_OK);
        console.log('   ✅ 腳本有執行權限');
      } catch {
        console.log('   ⚠️ 腳本沒有執行權限，請執行: chmod +x ' + deployScript);
      }
    } else {
      console.log('   ❌ deploy-v20-complete.js 不存在');
      allChecksPass = false;
    }
    
    // 總結
    console.log('\n' + '='.repeat(60));
    if (allChecksPass) {
      console.log('✅ 所有檢查通過！可以執行 V20 部署');
      console.log('\n執行部署：');
      console.log('  node scripts/deploy-v20-complete.js');
    } else {
      console.log('❌ 部分檢查未通過，請修復後再部署');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 驗證過程出錯:', error);
    process.exit(1);
  }
}

// 執行驗證
verifyDeploymentReadiness().catch(console.error);
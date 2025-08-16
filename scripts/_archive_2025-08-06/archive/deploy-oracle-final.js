#!/usr/bin/env node

// Oracle Final 部署腳本

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const ADDRESSES = {
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  SOULSHARD: '0x4e02B4d0A6b6a90fDDFF058B8a6148BA3F909915',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  DUNGEON_CORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  OLD_ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9'
};

async function deployOracleFinal() {
  console.log('🚀 部署 Oracle Final...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`📝 部署者: ${deployer.address}`);
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB\n`);

  try {
    // 1. 部署 Oracle_Final
    console.log('📊 部署 Oracle_Final...');
    
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'defi', 'Oracle_Final.sol', 'Oracle_Final.json');
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const OracleFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    
    const oracle = await OracleFactory.deploy(
      ADDRESSES.UNISWAP_POOL,
      ADDRESSES.SOULSHARD,
      ADDRESSES.USD
    );
    
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log(`✅ Oracle_Final: ${oracleAddress}`);
    
    // 2. 驗證功能
    console.log('\n📊 驗證功能...');
    
    const latestPrice = await oracle.getLatestPrice();
    console.log(`✅ 價格: ${ethers.formatUnits(latestPrice, 18)} USD/SOUL`);
    
    const requiredAmount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
    console.log(`✅ 2 USD = ${ethers.formatUnits(requiredAmount, 18)} SOUL`);
    
    // 3. 更新 DungeonCore
    console.log('\n📊 更新 DungeonCore...');
    
    const dungeonCoreABI = ['function setOracle(address) returns (bool)', 'function oracle() view returns (address)'];
    const dungeonCore = new ethers.Contract(ADDRESSES.DUNGEON_CORE, dungeonCoreABI, deployer);
    
    const tx = await dungeonCore.setOracle(oracleAddress);
    await tx.wait();
    console.log('✅ DungeonCore 已更新');
    
    // 4. 生成配置更新
    console.log('\n📝 配置更新：');
    console.log(`舊 Oracle: ${ADDRESSES.OLD_ORACLE}`);
    console.log(`新 Oracle: ${oracleAddress}`);
    console.log('\n請更新：');
    console.log('- 前端 src/config/contracts.ts');
    console.log('- 後端 .env');
    console.log('- 子圖 networks.json');
    
  } catch (error) {
    console.error('❌ 部署失敗:', error);
    process.exit(1);
  }
}

deployOracleFinal().catch(console.error);
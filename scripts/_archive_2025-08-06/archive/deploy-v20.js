#!/usr/bin/env node

// V20 部署腳本 - 使用 CommonJS 格式

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// V19 合約地址
const V19_ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF', // 正確的 SoulShard 地址
  HERO: '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  RELIC: '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3',
  DUNGEON_CORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  OLD_ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9'
};

async function deployV20() {
  console.log('🚀 開始 V20 部署 (僅修復 Oracle)...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY 或 PRIVATE_KEY');
    process.exit(1);
  }

  // 移除 0x 前綴
  const privateKey = DEPLOYER_PRIVATE_KEY.replace('0x', '');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(privateKey, provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ 錯誤: BNB 餘額不足');
    process.exit(1);
  }

  try {
    // 部署 Oracle_Final
    console.log('📊 部署 Oracle_Final...');
    
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'defi', 'Oracle_Final.sol', 'Oracle_Final.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 找不到編譯文件，請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const OracleFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    
    console.log('   部署參數:');
    console.log(`   - Pool: ${V19_ADDRESSES.UNISWAP_POOL}`);
    console.log(`   - SoulShard: ${V19_ADDRESSES.SOULSHARD}`);
    console.log(`   - USD: ${V19_ADDRESSES.USD}`);
    
    const oracle = await OracleFactory.deploy(
      V19_ADDRESSES.UNISWAP_POOL,
      V19_ADDRESSES.SOULSHARD,
      V19_ADDRESSES.USD
    );
    
    console.log(`   ⏳ 等待交易確認...`);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    
    console.log(`   ✅ Oracle_Final 部署成功: ${oracleAddress}`);
    
    // 驗證功能
    console.log('\n   驗證 Oracle 功能...');
    
    const latestPrice = await oracle.getLatestPrice();
    console.log(`   ✅ getLatestPrice: ${ethers.formatUnits(latestPrice, 18)} USD per SOUL`);
    
    const requiredAmount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
    console.log(`   ✅ 2 USD = ${ethers.formatUnits(requiredAmount, 18)} SOUL`);

    // 更新 DungeonCore
    console.log('\n📝 更新 DungeonCore...');
    
    const dungeonCoreABI = [
      'function oracle() view returns (address)',
      'function setOracle(address) returns (bool)',
      'function owner() view returns (address)'
    ];
    
    const dungeonCore = new ethers.Contract(V19_ADDRESSES.DUNGEON_CORE, dungeonCoreABI, deployer);
    
    const dungeonCoreOwner = await dungeonCore.owner();
    if (dungeonCoreOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error(`   ❌ 部署者不是 DungeonCore 的 owner`);
      console.log(`   DungeonCore owner: ${dungeonCoreOwner}`);
      console.log(`   部署者: ${deployer.address}`);
      console.log('\n   ⚠️ 需要 DungeonCore owner 手動更新 Oracle');
    } else {
      console.log('   ⏳ 更新 Oracle...');
      const tx = await dungeonCore.setOracle(oracleAddress);
      await tx.wait();
      console.log('   ✅ DungeonCore Oracle 更新成功');
    }

    // 生成更新指南
    console.log('\n' + '='.repeat(60));
    console.log('✅ V20 部署完成！\n');
    console.log('📋 新 Oracle 地址:', oracleAddress);
    console.log('\n📌 請更新以下配置:');
    console.log('1. 前端 src/config/contracts.ts - ORACLE 地址');
    console.log('2. 後端 .env - ORACLE_ADDRESS');
    console.log('3. 子圖 networks.json - oracle 地址');
    console.log('4. 關閉前端價格覆蓋 (priceOverride.ts)');
    console.log('='.repeat(60));
    
    // 保存部署記錄
    const deploymentRecord = {
      version: 'V20',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        Oracle_Final: oracleAddress
      },
      oldOracle: V19_ADDRESSES.OLD_ORACLE
    };
    
    const recordPath = path.join(__dirname, '..', 'deployments', `v20-deployment-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

deployV20().catch(console.error);
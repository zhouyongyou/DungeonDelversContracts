#!/usr/bin/env node

// V20 完整部署腳本 - 修復 Oracle 問題
// 此腳本將部署新的 OracleV20 並更新所有相關合約

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 載入環境變數
dotenv.config();

// 部署配置
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// V19 合約地址
const V19_ADDRESSES = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOULSHARD: '0x4e02B4d0A6b6a90fDDFF058B8a6148BA3F909915',
  HERO: '0x141F081922D4015b3157cdA6eE970dff34bb8AAb',
  RELIC: '0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3',
  PARTY: '0x096aA1e0f9c87e57e8B69a7DD35D893d13Bba8f5',
  PLAYERVAULT: '0xE4654796e4c03f88776a666f3A47E16F5d6BE4FA',
  DUNGEON_MASTER: '0xbC7eCa65F0D0BA6f7aDDC5C6C956FE926d3344CE',
  DUNGEON_CORE: '0x3c97732E72Db4Bc9B3033cAAc08C4Be24C3fB84c',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  OLD_ORACLE: '0x54Ff2524C996d7608CaE9F3D9dd2075A023472E9' // 需要替換的 Oracle
};

// 合約 ABI 載入函數
function loadABI(contractName) {
  const abiPath = path.join(__dirname, '..', 'artifacts', 'contracts', contractName);
  const files = fs.readdirSync(abiPath);
  const jsonFile = files.find(f => f.endsWith('.json') && !f.includes('.dbg.'));
  if (!jsonFile) {
    throw new Error(`Cannot find ABI for ${contractName}`);
  }
  const artifact = JSON.parse(fs.readFileSync(path.join(abiPath, jsonFile), 'utf8'));
  return artifact.abi;
}

// 載入 Bytecode
function loadBytecode(contractPath) {
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', contractPath);
  const files = fs.readdirSync(artifactPath);
  const jsonFile = files.find(f => f.endsWith('.json') && !f.includes('.dbg.'));
  if (!jsonFile) {
    throw new Error(`Cannot find artifact for ${contractPath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(path.join(artifactPath, jsonFile), 'utf8'));
  return artifact.bytecode;
}

// 等待函數
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主部署函數
async function deployV20() {
  console.log('🚀 開始 V20 部署流程...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  // 檢查餘額
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.05')) {
    console.error('❌ 錯誤: BNB 餘額不足 (需要至少 0.05 BNB)');
    process.exit(1);
  }

  try {
    // ========================================
    // 步驟 1: 部署新的 OracleV20
    // ========================================
    console.log('📊 步驟 1: 部署 OracleV20...');
    
    const oracleBytecode = loadBytecode('defi/OracleV20.sol/OracleV20.json');
    const oracleABI = loadABI('defi/OracleV20.sol/OracleV20.json');
    
    const OracleFactory = new ethers.ContractFactory(oracleABI, oracleBytecode, deployer);
    
    console.log('   部署參數:');
    console.log(`   - Pool 地址: ${V19_ADDRESSES.UNISWAP_POOL}`);
    console.log(`   - SoulShard: ${V19_ADDRESSES.SOULSHARD}`);
    console.log(`   - USD: ${V19_ADDRESSES.USD}`);
    
    const oracleV20 = await OracleFactory.deploy(
      V19_ADDRESSES.UNISWAP_POOL,
      V19_ADDRESSES.SOULSHARD,
      V19_ADDRESSES.USD
    );
    
    console.log(`   ⏳ 等待交易確認...`);
    await oracleV20.waitForDeployment();
    const oracleAddress = await oracleV20.getAddress();
    
    console.log(`   ✅ OracleV20 部署成功: ${oracleAddress}`);
    
    // 驗證部署
    await delay(5000);
    console.log('\n   驗證 Oracle 功能...');
    
    try {
      const latestPrice = await oracleV20.getLatestPrice();
      console.log(`   ✅ getLatestPrice: ${ethers.formatUnits(latestPrice, 18)} USD per SOUL`);
      
      const requiredAmount = await oracleV20.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
      console.log(`   ✅ 2 USD = ${ethers.formatUnits(requiredAmount, 18)} SOUL`);
      
      const amountOut = await oracleV20.getAmountOut(V19_ADDRESSES.USD, ethers.parseUnits('2', 18));
      console.log(`   ✅ getAmountOut(USD, 2) = ${ethers.formatUnits(amountOut, 18)} SOUL`);
    } catch (error) {
      console.error('   ❌ Oracle 功能驗證失敗:', error.message);
      process.exit(1);
    }

    // ========================================
    // 步驟 2: 更新 DungeonCore 的 Oracle 地址
    // ========================================
    console.log('\n📝 步驟 2: 更新 DungeonCore 的 Oracle...');
    
    const dungeonCoreABI = loadABI('core/DungeonCore.sol/DungeonCore.json');
    const dungeonCore = new ethers.Contract(V19_ADDRESSES.DUNGEON_CORE, dungeonCoreABI, deployer);
    
    // 檢查當前 Oracle
    const currentOracle = await dungeonCore.oracle();
    console.log(`   當前 Oracle: ${currentOracle}`);
    console.log(`   新 Oracle: ${oracleAddress}`);
    
    if (currentOracle.toLowerCase() === oracleAddress.toLowerCase()) {
      console.log('   ℹ️ Oracle 已經是最新的');
    } else {
      console.log('   ⏳ 更新 Oracle...');
      const updateTx = await dungeonCore.setOracle(oracleAddress);
      await updateTx.wait();
      console.log('   ✅ DungeonCore Oracle 更新成功');
    }

    // ========================================
    // 步驟 3: 準備 V20 部署配置
    // ========================================
    console.log('\n📋 步驟 3: 生成 V20 配置文件...');
    
    const v20Config = {
      version: 'V20',
      deploymentDate: new Date().toISOString(),
      network: 'BSC Mainnet',
      contracts: {
        // 核心代幣（不變）
        USD: V19_ADDRESSES.USD,
        SOULSHARD: V19_ADDRESSES.SOULSHARD,
        
        // NFT 合約（不變）
        HERO: V19_ADDRESSES.HERO,
        RELIC: V19_ADDRESSES.RELIC,
        PARTY: V19_ADDRESSES.PARTY,
        
        // 核心系統（不變）
        PLAYERVAULT: V19_ADDRESSES.PLAYERVAULT,
        DUNGEON_MASTER: V19_ADDRESSES.DUNGEON_MASTER,
        DUNGEON_CORE: V19_ADDRESSES.DUNGEON_CORE,
        
        // DeFi（更新 Oracle）
        ORACLE: oracleAddress,
        UNISWAP_POOL: V19_ADDRESSES.UNISWAP_POOL
      },
      changes: {
        oracle: {
          old: V19_ADDRESSES.OLD_ORACLE,
          new: oracleAddress,
          reason: 'Fixed missing public getter functions'
        }
      }
    };
    
    // 保存配置
    const configPath = path.join(__dirname, '..', 'deployments', 'v20-config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(v20Config, null, 2));
    console.log(`   ✅ 配置已保存到: ${configPath}`);

    // ========================================
    // 步驟 4: 驗證所有合約連接
    // ========================================
    console.log('\n🔍 步驟 4: 驗證合約連接...');
    
    // 驗證 Hero 合約
    console.log('\n   檢查 Hero 合約...');
    const heroABI = loadABI('nft/Hero.sol/Hero.json');
    const hero = new ethers.Contract(V19_ADDRESSES.HERO, heroABI, deployer);
    
    try {
      const heroCore = await hero.dungeonCore();
      console.log(`   ✅ Hero -> DungeonCore: ${heroCore}`);
      
      // 測試價格查詢
      const heroPrice = await hero.getRequiredSoulShardAmount(1);
      console.log(`   ✅ Hero 價格 (1個): ${ethers.formatUnits(heroPrice, 18)} SOUL`);
    } catch (error) {
      console.error(`   ❌ Hero 合約錯誤: ${error.message}`);
    }
    
    // 驗證 Relic 合約
    console.log('\n   檢查 Relic 合約...');
    const relicABI = loadABI('nft/Relic.sol/Relic.json');
    const relic = new ethers.Contract(V19_ADDRESSES.RELIC, relicABI, deployer);
    
    try {
      const relicCore = await relic.dungeonCore();
      console.log(`   ✅ Relic -> DungeonCore: ${relicCore}`);
      
      // 測試價格查詢
      const relicPrice = await relic.getRequiredSoulShardAmount(1);
      console.log(`   ✅ Relic 價格 (1個): ${ethers.formatUnits(relicPrice, 18)} SOUL`);
    } catch (error) {
      console.error(`   ❌ Relic 合約錯誤: ${error.message}`);
    }

    // ========================================
    // 步驟 5: 創建更新腳本
    // ========================================
    console.log('\n📝 步驟 5: 生成配置更新腳本...');
    
    const updateScript = `#!/bin/bash
# V20 配置更新腳本
# 生成時間: ${new Date().toISOString()}

echo "🔄 更新到 V20 配置..."

# 更新前端配置
echo "📱 更新前端..."
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
sed -i '' "s/ORACLE: '${V19_ADDRESSES.OLD_ORACLE}'/ORACLE: '${oracleAddress}'/g" src/config/contracts.ts

# 更新後端配置
echo "🖥️ 更新後端..."
cd /Users/sotadic/Documents/GitHub/backend-nft-marketplace-master
sed -i '' "s/ORACLE_ADDRESS=${V19_ADDRESSES.OLD_ORACLE}/ORACLE_ADDRESS=${oracleAddress}/g" .env

# 更新子圖配置
echo "📊 更新子圖..."
cd /Users/sotadic/Documents/DungeonDelvers-Subgraph
sed -i '' "s/oracle: '${V19_ADDRESSES.OLD_ORACLE}'/oracle: '${oracleAddress}'/g" networks.json

echo "✅ 所有配置已更新到 V20!"
echo ""
echo "📋 V20 變更摘要:"
echo "   - Oracle: ${V19_ADDRESSES.OLD_ORACLE} → ${oracleAddress}"
echo ""
echo "⚠️ 請記得:"
echo "   1. 重啟前端開發服務器"
echo "   2. 重啟後端服務"
echo "   3. 重新部署子圖（如需要）"
`;
    
    const scriptPath = path.join(__dirname, 'update-to-v20.sh');
    fs.writeFileSync(scriptPath, updateScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`   ✅ 更新腳本已保存到: ${scriptPath}`);

    // ========================================
    // 部署總結
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ V20 部署完成！\n');
    console.log('📋 部署摘要:');
    console.log(`   - 新 Oracle 地址: ${oracleAddress}`);
    console.log(`   - DungeonCore 已更新: ✅`);
    console.log(`   - 價格查詢功能正常: ✅`);
    console.log('\n📌 下一步:');
    console.log('   1. 運行 ./update-to-v20.sh 更新所有配置');
    console.log('   2. 在 BSCScan 驗證 Oracle 合約');
    console.log('   3. 測試前端鑄造功能');
    console.log('   4. 監控系統運行狀態');
    console.log('='.repeat(60));
    
    // 保存部署記錄
    const deploymentRecord = {
      version: 'V20',
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        OracleV20: oracleAddress
      },
      gasUsed: 'TBD',
      status: 'SUCCESS'
    };
    
    const recordPath = path.join(__dirname, '..', 'deployments', `v20-deployment-${Date.now()}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

// 執行部署
deployV20().catch(console.error);
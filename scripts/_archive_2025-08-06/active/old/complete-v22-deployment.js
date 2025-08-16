#!/usr/bin/env node

// 完成 V22 部署的後續步驟

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// V21 配置
const v21Config = require('../config/v21-config');

// V22 Oracle 地址
const ORACLE_V22_ADDRESS = '0xb9317179466fd7fb253669538dE1c4635E81eAc4';

async function completeV22Deployment() {
  console.log('🚀 完成 Oracle V22 部署\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${deployer.address}`);

  try {
    // 測試 V22 Oracle
    console.log('\n🧪 測試 Oracle V22 功能...');
    const oracleABI = [
      "function getPriceAdaptive() view returns (uint256 price, uint32 usedPeriod)",
      "function getSoulShardPriceInUSD() view returns (uint256)",
      "function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)",
      "function testAllPeriods() view returns (bool[] available, uint256[] prices)",
      "function getAdaptivePeriods() view returns (uint32[])"
    ];
    
    const oracle = new ethers.Contract(ORACLE_V22_ADDRESS, oracleABI, provider);
    
    // 測試自適應價格
    try {
      const [price, usedPeriod] = await oracle.getPriceAdaptive();
      console.log(`✅ 自適應價格: ${ethers.formatUnits(price, 18)} USD`);
      console.log(`   使用週期: ${usedPeriod} 秒 (${Number(usedPeriod) / 60} 分鐘)`);
    } catch (error) {
      console.log(`❌ 自適應價格失敗: ${error.message}`);
    }
    
    // 測試所有週期
    try {
      const [available, prices] = await oracle.testAllPeriods();
      const periods = await oracle.getAdaptivePeriods();
      console.log('\n📊 週期可用性測試:');
      for (let i = 0; i < periods.length; i++) {
        const periodMinutes = Number(periods[i]) / 60;
        if (available[i]) {
          console.log(`   ✅ ${periodMinutes} 分鐘: ${ethers.formatUnits(prices[i], 18)} USD`);
        } else {
          console.log(`   ❌ ${periodMinutes} 分鐘: 不可用`);
        }
      }
    } catch (error) {
      console.log(`測試週期失敗: ${error.message}`);
    }
    
    // 更新 DungeonCore
    console.log('\n📝 更新 DungeonCore 的 Oracle 地址...');
    const dungeonCoreABI = [
      "function updateOracleAddress(address _newOracle) external",
      "function oracleAddress() view returns (address)"
    ];
    
    const dungeonCore = new ethers.Contract(
      v21Config.contracts.DUNGEONCORE.address,
      dungeonCoreABI,
      deployer
    );
    
    try {
      const currentOracle = await dungeonCore.oracleAddress();
      console.log(`當前 Oracle: ${currentOracle}`);
      
      const updateTx = await dungeonCore.updateOracleAddress(ORACLE_V22_ADDRESS);
      console.log(`交易哈希: ${updateTx.hash}`);
      await updateTx.wait();
      console.log('✅ DungeonCore 已更新');
      
      // 驗證
      const newOracle = await dungeonCore.oracleAddress();
      console.log(`新的 Oracle: ${newOracle}`);
    } catch (error) {
      console.log(`❌ 更新 DungeonCore 失敗: ${error.message}`);
    }
    
    // 創建 V22 配置
    console.log('\n📝 創建 V22 配置文件...');
    const v22Config = {
      version: "V22",
      lastUpdated: new Date().toISOString(),
      network: "BSC Mainnet",
      description: "Oracle V22 with Adaptive TWAP - Production",
      contracts: {
        ...v21Config.contracts,
        ORACLE: {
          address: ORACLE_V22_ADDRESS,
          deployedAt: "V22",
          deployTime: new Date().toISOString(),
          type: "PriceOracle",
          description: "Adaptive TWAP Oracle (30/15/5/1 min)",
          features: [
            "自適應 TWAP 週期",
            "自動降級機制",
            "永不失敗查詢",
            "向後兼容 V21"
          ],
          verified: false
        },
        ORACLE_OLD_V21: {
          address: v21Config.contracts.ORACLE.address,
          deployedAt: "V21",
          type: "PriceOracle (Deprecated)",
          description: "舊版 Oracle，已被 V22 取代"
        }
      }
    };
    
    // 保存配置
    const configPath = path.join(__dirname, '../config/v22-config.js');
    const configContent = `// V22 Configuration - ${new Date().toLocaleString()}
// Oracle V22 with Adaptive TWAP - Production Deployment

module.exports = ${JSON.stringify(v22Config, null, 2)};
`;
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ V22 配置已保存: config/v22-config.js');
    
    // 創建部署記錄
    const deployRecord = {
      version: "V22",
      oracle: ORACLE_V22_ADDRESS,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      features: "Adaptive TWAP (30/15/5/1 min)",
      network: "BSC Mainnet",
      previousOracle: v21Config.contracts.ORACLE.address
    };
    
    const recordPath = path.join(__dirname, `../deployments/ORACLE_V22_${new Date().toISOString().split('T')[0]}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deployRecord, null, 2));
    
    console.log('\n========== V22 部署完成 ==========');
    console.log(`✅ Oracle V22 Adaptive: ${ORACLE_V22_ADDRESS}`);
    console.log(`📋 版本: V22`);
    console.log(`🔧 特性: 自適應 TWAP (永不失敗)`);
    console.log(`📝 配置: config/v22-config.js`);
    console.log('==================================\n');
    
    console.log('📌 下一步:');
    console.log('1. 驗證合約: npx hardhat verify --network bsc ' + ORACLE_V22_ADDRESS);
    console.log('2. 同步配置: node scripts/v22-sync-config.js');
    console.log('3. 更新 .env 文件，添加註釋: # Oracle V22 Deployed');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

completeV22Deployment().catch(console.error);
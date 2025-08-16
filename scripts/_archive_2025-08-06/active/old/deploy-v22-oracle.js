#!/usr/bin/env node

// 部署 Oracle V22 Adaptive - 自適應 TWAP 版本

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 從 V21 配置讀取地址
const v21Config = require('../config/v21-config');

async function deployOracleV22() {
  console.log('🚀 部署 Oracle V22 Adaptive\n');
  console.log('📋 版本特性:');
  console.log('   - 自適應 TWAP (30/15/5/1 分鐘)');
  console.log('   - 自動降級機制');
  console.log('   - 永不失敗的價格查詢\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 BNB 餘額: ${ethers.formatEther(balance)} BNB\n`);

  try {
    // 讀取合約 bytecode
    const contractPath = path.join(__dirname, '../artifacts/contracts/current/defi/Oracle_V22_Adaptive.sol/Oracle_V22_Adaptive.json');
    
    if (!fs.existsSync(contractPath)) {
      console.log('❌ 找不到編譯後的合約');
      console.log('💡 請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // 準備部署參數
    const poolAddress = v21Config.contracts.UNISWAP_POOL.address;
    const soulShardAddress = v21Config.contracts.SOULSHARD.address;
    const usdAddress = v21Config.contracts.USD.address;
    
    console.log('📋 部署參數:');
    console.log(`   Pool: ${poolAddress}`);
    console.log(`   SoulShard: ${soulShardAddress}`);
    console.log(`   USD: ${usdAddress}\n`);
    
    // 部署合約
    console.log('📤 發送部署交易...');
    const OracleFactory = new ethers.ContractFactory(
      contractJson.abi,
      contractJson.bytecode,
      deployer
    );
    
    const oracle = await OracleFactory.deploy(
      poolAddress,
      soulShardAddress,
      usdAddress
    );
    
    console.log(`交易哈希: ${oracle.deploymentTransaction().hash}`);
    console.log('⏳ 等待確認...');
    
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    
    console.log(`\n✅ Oracle V22 部署成功！`);
    console.log(`📍 合約地址: ${oracleAddress}`);
    
    // V22 不需要初始化（構造函數已處理）
    console.log('\n✅ 合約已自動初始化（構造函數）');
    
    // 測試合約功能
    console.log('\n🧪 測試合約功能...');
    
    // 測試自適應價格查詢
    try {
      const result = await oracle.getLatestPriceAdaptive();
      const price = result[0];
      const usedPeriod = result[1];
      console.log(`✅ 自適應價格: ${ethers.formatUnits(price, 18)} USD`);
      console.log(`   使用週期: ${usedPeriod} 秒 (${Number(usedPeriod) / 60} 分鐘)`);
    } catch (error) {
      console.log(`❌ 價格查詢失敗: ${error.message}`);
    }
    
    // 測試向後兼容
    try {
      const price = await oracle.getSoulShardPriceInUSD();
      console.log(`✅ 向後兼容測試: ${ethers.formatUnits(price, 18)} USD`);
    } catch (error) {
      console.log(`❌ 向後兼容失敗: ${error.message}`);
    }
    
    // 更新 DungeonCore
    console.log('\n📝 更新 DungeonCore 的 Oracle 地址...');
    const dungeonCoreAddress = v21Config.contracts.DUNGEONCORE.address;
    const dungeonCoreABI = [
      "function updateOracleAddress(address _newOracle) external",
      "function oracleAddress() view returns (address)"
    ];
    
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, deployer);
    
    try {
      const updateTx = await dungeonCore.updateOracleAddress(oracleAddress);
      console.log(`交易哈希: ${updateTx.hash}`);
      await updateTx.wait();
      console.log('✅ DungeonCore 已更新');
      
      // 驗證更新
      const newOracleAddress = await dungeonCore.oracleAddress();
      if (newOracleAddress.toLowerCase() === oracleAddress.toLowerCase()) {
        console.log('✅ 驗證成功：Oracle 地址已正確更新');
      }
    } catch (error) {
      console.log('❌ 更新 DungeonCore 失敗:', error.message);
    }
    
    // 創建 V22 配置文件
    console.log('\n📝 創建 V22 配置...');
    const v22Config = {
      version: "V22",
      lastUpdated: new Date().toISOString(),
      network: "BSC Mainnet",
      description: "Oracle V22 with Adaptive TWAP",
      contracts: {
        ...v21Config.contracts,
        ORACLE: {
          address: oracleAddress,
          deployedAt: "V22",
          type: "PriceOracle",
          description: "Adaptive TWAP Oracle (30/15/5/1 min)",
          features: [
            "自適應 TWAP 週期",
            "自動降級機制", 
            "永不失敗查詢",
            "向後兼容 V21"
          ],
          verified: false
        }
      }
    };
    
    // 保存 V22 配置
    const configPath = path.join(__dirname, '../config/v22-config.js');
    const configContent = `// V22 Configuration - ${new Date().toLocaleString()}
// Oracle V22 with Adaptive TWAP

module.exports = ${JSON.stringify(v22Config, null, 2)};
`;
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ V22 配置已保存');
    
    // 部署記錄
    const deployRecord = {
      version: "V22",
      oracle: oracleAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      features: "Adaptive TWAP (30/15/5/1 min)",
      txHash: oracle.deploymentTransaction().hash
    };
    
    const recordPath = path.join(__dirname, `../deployments/ORACLE_V22_${new Date().toISOString().split('T')[0]}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deployRecord, null, 2));
    
    console.log('\n========== 部署總結 ==========');
    console.log(`✅ Oracle V22 Adaptive 部署成功`);
    console.log(`📍 地址: ${oracleAddress}`);
    console.log(`📋 版本: V22`);
    console.log(`🔧 特性: 自適應 TWAP`);
    console.log(`📝 配置: config/v22-config.js`);
    console.log('===============================\n');
    
    console.log('📌 下一步:');
    console.log('1. 執行: npm run verify:v22');
    console.log('2. 執行: node scripts/v22-sync-config.js');
    console.log('3. 更新 .env 文件標註 V22');
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error.message);
    process.exit(1);
  }
}

deployOracleV22().catch(console.error);
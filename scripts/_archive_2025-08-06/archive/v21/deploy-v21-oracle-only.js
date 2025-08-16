#!/usr/bin/env node

// V21 Oracle 專用部署腳本
// 只部署 Oracle，使用 V21 配置系統

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 載入 V21 配置
const config = require('../config/v21-config');

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function deployOracleOnly() {
  console.log('🚀 V21 Oracle 部署腳本\n');
  
  console.log('📋 使用 V21 配置：');
  console.log(`   版本: ${config.version}`);
  console.log(`   網路: ${config.network}`);
  console.log('');
  
  console.log('📌 固定地址（從 V21 配置讀取）：');
  console.log(`   UNISWAP_POOL: ${config.contracts.UNISWAP_POOL.address}`);
  console.log(`   SOULSHARD: ${config.contracts.SOULSHARD.address}`);
  console.log(`   USD: ${config.contracts.USD.address}`);
  console.log('');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY 或 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 部署者地址: ${deployer.address}`);
  
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 部署者餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ 錯誤: BNB 餘額不足 (需要至少 0.01 BNB)');
    process.exit(1);
  }

  try {
    // ========================================
    // 部署 Oracle
    // ========================================
    console.log('📊 部署 Oracle_Final...');
    
    const artifactPath = path.join(
      __dirname, 
      '..', 
      'artifacts', 
      'contracts', 
      'current', 
      'defi', 
      'Oracle.sol', 
      'Oracle_Final.json'
    );
    
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 找不到 Oracle_Final 編譯文件');
      console.log('   請先執行: npx hardhat compile');
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const OracleFactory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    
    console.log('   構造參數:');
    console.log(`   - Pool: ${config.contracts.UNISWAP_POOL.address}`);
    console.log(`   - SoulShard: ${config.contracts.SOULSHARD.address}`);
    console.log(`   - USD: ${config.contracts.USD.address}`);
    
    const oracle = await OracleFactory.deploy(
      config.contracts.UNISWAP_POOL.address,
      config.contracts.SOULSHARD.address,
      config.contracts.USD.address
    );
    
    console.log(`   ⏳ 等待交易確認...`);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    
    console.log(`   ✅ Oracle_Final 部署成功: ${oracleAddress}`);
    
    // ========================================
    // 驗證 Oracle 功能
    // ========================================
    console.log('\n📊 驗證 Oracle 功能...');
    
    try {
      // 測試 getSoulShardPriceInUSD
      const soulPriceInUSD = await oracle.getSoulShardPriceInUSD();
      console.log(`   ✅ getSoulShardPriceInUSD: ${ethers.formatUnits(soulPriceInUSD, 18)} USD per SOUL`);
      
      // 測試 getLatestPrice (應該返回相同值)
      const latestPrice = await oracle.getLatestPrice();
      console.log(`   ✅ getLatestPrice: ${ethers.formatUnits(latestPrice, 18)} USD per SOUL`);
      
      // 測試 getRequiredSoulShardAmount
      const requiredAmount = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
      console.log(`   ✅ 2 USD = ${ethers.formatUnits(requiredAmount, 18)} SOUL`);
      
      // 測試 getAmountOut
      const amountOut = await oracle.getAmountOut(config.contracts.USD.address, ethers.parseUnits('2', 18));
      console.log(`   ✅ getAmountOut(USD, 2) = ${ethers.formatUnits(amountOut, 18)} SOUL`);
      
      // 計算並驗證價格
      const pricePerUSD = Number(ethers.formatUnits(requiredAmount, 18)) / 2;
      console.log(`   💰 計算結果: 1 USD = ${pricePerUSD.toFixed(2)} SOUL`);
      
      if (pricePerUSD > 10000 && pricePerUSD < 100000) {
        console.log(`   ✅ 價格在合理範圍內`);
      } else {
        console.log(`   ⚠️ 價格可能異常，請檢查`);
      }
      
    } catch (error) {
      console.error('   ❌ Oracle 功能驗證失敗:', error.message);
    }
    
    // ========================================
    // 保存部署結果
    // ========================================
    const deploymentResult = {
      version: config.version,
      timestamp: new Date().toISOString(),
      network: config.network,
      deployer: deployer.address,
      oracle: {
        address: oracleAddress,
        constructor: {
          pool: config.contracts.UNISWAP_POOL.address,
          soulShard: config.contracts.SOULSHARD.address,
          usd: config.contracts.USD.address
        }
      }
    };
    
    const outputPath = path.join(__dirname, '..', `oracle-deployment-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResult, null, 2));
    
    console.log(`\n✅ Oracle 部署完成！`);
    console.log(`📄 部署結果已保存到: ${outputPath}`);
    console.log(`🔗 Oracle 地址: ${oracleAddress}`);
    console.log('\n📌 下一步：');
    console.log(`1. 更新 config/v21-config.js 中的 Oracle 地址為: ${oracleAddress}`);
    console.log('2. 執行 npm run v21:sync 同步到所有項目');
    console.log('3. 在 BSCScan 驗證合約');
    console.log('4. 更新 DungeonCore 的 Oracle 地址（如果需要）');
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error);
    process.exit(1);
  }
}

// 執行部署
deployOracleOnly().catch(console.error);
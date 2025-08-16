#!/usr/bin/env node

// 直接測試價格查詢

const { ethers } = require('ethers');
require('dotenv').config();

const config = require('../config/v21-config');
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// Oracle ABI
const ORACLE_ABI = [
  "function getRequiredSoulShardAmount(uint256 usdAmount) view returns (uint256)",
  "function getSoulShardPriceInUSD() view returns (uint256)",
  "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)"
];

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function getSoulShardAmountForUSD(uint256 _amountUSD) view returns (uint256)",
  "function oracleAddress() view returns (address)"
];

async function testPriceDirect() {
  console.log('🧪 測試價格查詢功能\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 測試 Oracle 直接查詢
  console.log('📊 測試 Oracle 直接查詢...');
  const oracle = new ethers.Contract(config.contracts.ORACLE.address, ORACLE_ABI, provider);
  
  try {
    // 測試 getSoulShardPriceInUSD
    const price = await oracle.getSoulShardPriceInUSD();
    console.log(`   SoulShard 價格: ${ethers.formatUnits(price, 18)} USD`);
    
    // 測試 getRequiredSoulShardAmount (2 USD)
    const amount2USD = await oracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
    console.log(`   2 USD = ${ethers.formatUnits(amount2USD, 18)} SOUL`);
    
    // 測試 getAmountOut
    const amountOut = await oracle.getAmountOut(config.contracts.USD.address, ethers.parseUnits('2', 18));
    console.log(`   getAmountOut(USD, 2) = ${ethers.formatUnits(amountOut, 18)} SOUL`);
    
    console.log('   ✅ Oracle 直接查詢成功\n');
  } catch (error) {
    console.log(`   ❌ Oracle 查詢失敗: ${error.reason || error.message}\n`);
  }
  
  // 測試 DungeonCore 查詢
  console.log('📊 測試 DungeonCore 查詢...');
  const dungeonCore = new ethers.Contract(config.contracts.DUNGEONCORE.address, DUNGEONCORE_ABI, provider);
  
  try {
    // 檢查 Oracle 地址
    const oracleAddress = await dungeonCore.oracleAddress();
    console.log(`   Oracle 地址: ${oracleAddress}`);
    
    // 測試 getSoulShardAmountForUSD
    const amount = await dungeonCore.getSoulShardAmountForUSD(ethers.parseUnits('2', 18));
    console.log(`   2 USD = ${ethers.formatUnits(amount, 18)} SOUL`);
    
    console.log('   ✅ DungeonCore 查詢成功\n');
  } catch (error) {
    console.log(`   ❌ DungeonCore 查詢失敗: ${error.reason || error.message}\n`);
  }
  
  // 測試舊 Oracle 地址
  console.log('📊 測試舊 Oracle 地址...');
  const oldOracleAddress = '0x570ab1b068FB8ca51c995e78d2D62189B6201284';
  const oldOracle = new ethers.Contract(oldOracleAddress, ORACLE_ABI, provider);
  
  try {
    const oldAmount = await oldOracle.getRequiredSoulShardAmount(ethers.parseUnits('2', 18));
    console.log(`   舊 Oracle: 2 USD = ${ethers.formatUnits(oldAmount, 18)} SOUL`);
    console.log('   ⚠️  舊 Oracle 仍然可用');
  } catch (error) {
    console.log(`   ❌ 舊 Oracle 查詢失敗: ${error.reason || error.message}`);
  }
}

testPriceDirect().catch(console.error);
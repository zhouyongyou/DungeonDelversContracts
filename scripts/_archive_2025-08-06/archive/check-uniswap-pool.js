#!/usr/bin/env node

// 檢查 Uniswap V3 池子狀態

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// Uniswap V3 Pool ABI
const POOL_ABI = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() view returns (uint128)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)"
];

async function checkUniswapPool() {
  console.log('🏊 檢查 Uniswap V3 池子狀態\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const poolAddress = '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82';
  
  console.log(`池子地址: ${poolAddress}\n`);
  
  const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
  
  try {
    // 檢查基本信息
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    
    // 檢查流動性
    const liquidity = await pool.liquidity();
    console.log(`\n流動性: ${liquidity}`);
    
    // 檢查 slot0
    const slot0 = await pool.slot0();
    console.log(`\nSlot0 數據:`);
    console.log(`  觀察指數: ${slot0.observationIndex}`);
    console.log(`  觀察基數: ${slot0.observationCardinality}`);
    console.log(`  下一個觀察基數: ${slot0.observationCardinalityNext}`);
    console.log(`  池子已解鎖: ${slot0.unlocked}`);
    
    // 測試不同的觀察時間
    console.log('\n測試觀察功能 (observe)：');
    const testPeriods = [
      { seconds: 60, name: '1 分鐘' },
      { seconds: 300, name: '5 分鐘' },
      { seconds: 600, name: '10 分鐘' },
      { seconds: 900, name: '15 分鐘' },
      { seconds: 1800, name: '30 分鐘' }
    ];
    
    for (const period of testPeriods) {
      try {
        await pool.observe([period.seconds, 0]);
        console.log(`  ✅ ${period.name} 觀察成功`);
      } catch (error) {
        console.log(`  ❌ ${period.name} 觀察失敗: ${error.reason || error.message}`);
      }
    }
    
    console.log('\n📊 診斷：');
    if (slot0.observationCardinality < 100) {
      console.log('⚠️  觀察基數較低，可能導致歷史數據不足');
    }
    if (!slot0.unlocked) {
      console.log('⚠️  池子被鎖定');
    }
    if (liquidity.toString() === '0') {
      console.log('⚠️  池子沒有流動性');
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

checkUniswapPool().catch(console.error);
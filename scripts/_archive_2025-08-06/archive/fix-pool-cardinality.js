#!/usr/bin/env node

// 修復 Uniswap V3 池子的觀察基數

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// Uniswap V3 Pool ABI
const POOL_ABI = [
  "function increaseObservationCardinalityNext(uint16 observationCardinalityNext) external",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

async function fixPoolCardinality() {
  console.log('🔧 修復 Uniswap V3 池子觀察基數\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  const balance = await provider.getBalance(signer.address);
  console.log(`💰 BNB 餘額: ${ethers.formatEther(balance)} BNB\n`);
  
  const poolAddress = '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82';
  const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
  
  try {
    // 檢查當前狀態
    const slot0 = await pool.slot0();
    console.log('📊 當前池子狀態:');
    console.log(`   觀察基數: ${slot0.observationCardinality}`);
    console.log(`   下一個觀察基數: ${slot0.observationCardinalityNext}`);
    
    if (slot0.observationCardinality >= 100) {
      console.log('\n✅ 觀察基數已經足夠高，無需修復');
      return;
    }
    
    // 設置新的觀察基數（建議至少 100，最多 65535）
    const newCardinality = 100;
    console.log(`\n🔧 將觀察基數增加到: ${newCardinality}`);
    console.log('這將允許存儲更多歷史價格數據，支援 TWAP 計算\n');
    
    // 發送交易
    console.log('📝 發送交易...');
    const tx = await pool.increaseObservationCardinalityNext(newCardinality);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    
    const receipt = await tx.wait();
    console.log(`✅ 交易確認！區塊: ${receipt.blockNumber}`);
    
    // 檢查更新後的狀態
    const newSlot0 = await pool.slot0();
    console.log('\n📊 更新後的池子狀態:');
    console.log(`   觀察基數: ${newSlot0.observationCardinality}`);
    console.log(`   下一個觀察基數: ${newSlot0.observationCardinalityNext}`);
    
    if (newSlot0.observationCardinalityNext >= newCardinality) {
      console.log('\n✅ 成功！觀察基數已更新');
      console.log('ℹ️  注意：需要等待一些交易發生後，觀察基數才會真正增加');
      console.log('ℹ️  之後 Oracle 的 TWAP 查詢應該就能正常工作了');
    } else {
      console.log('\n⚠️  觀察基數更新可能需要時間生效');
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    if (error.message.includes('revert')) {
      console.log('可能的原因：');
      console.log('1. 您沒有權限執行此操作');
      console.log('2. 提供的觀察基數無效');
    }
  }
}

fixPoolCardinality().catch(console.error);
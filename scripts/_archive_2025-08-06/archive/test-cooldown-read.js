#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// 測試各種可能的函數名稱
const TEST_ABI = [
  "function COOLDOWN_PERIOD() view returns (uint256)",
  "function cooldownPeriod() view returns (uint256)",
  "function challengeCooldown() view returns (uint256)",
  "function getCooldownPeriod() view returns (uint256)"
];

async function testCooldownRead() {
  console.log('🔍 測試冷卻時間讀取...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  for (const funcDef of TEST_ABI) {
    const funcName = funcDef.match(/function (\w+)/)[1];
    console.log(`測試 ${funcName}():`);
    
    try {
      const contract = new ethers.Contract(DUNGEONMASTER_ADDRESS, [funcDef], provider);
      const result = await contract[funcName]();
      console.log(`  ✅ 成功: ${result} 秒 (${result / 3600} 小時)`);
    } catch (e) {
      console.log(`  ❌ 失敗: ${e.reason || '函數不存在'}`);
    }
  }

  // 直接讀取 storage slot (常量可能編譯到 bytecode 中)
  console.log('\n📦 嘗試直接讀取合約 bytecode 中的常量...');
  try {
    const code = await provider.getCode(DUNGEONMASTER_ADDRESS);
    // 24 hours = 86400 秒 = 0x15180 (hex)
    const pattern = '0000000000000000000000000000000000000000000000000000000000015180';
    if (code.includes(pattern)) {
      console.log('  ✅ 在 bytecode 中找到 24 小時 (86400 秒) 的值');
    } else {
      console.log('  ❌ 在 bytecode 中沒有找到預期的值');
    }
  } catch (e) {
    console.log(`  ❌ 錯誤: ${e.message}`);
  }

  console.log('\n💡 建議：');
  console.log('1. 如果前端讀取失敗，可以直接硬編碼顯示 "24 小時"');
  console.log('2. 或者在前端 ABI 中添加正確的函數定義');
}

// 執行測試
testCooldownRead().catch(console.error);
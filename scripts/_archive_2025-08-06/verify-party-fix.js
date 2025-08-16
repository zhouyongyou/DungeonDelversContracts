#!/usr/bin/env node

const { ethers } = require("ethers");

async function verifyPartyFix() {
  console.log("🔍 驗證 Party 合約修復結果...\n");
  
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/"
  );

  // 檢查交易
  const txHash = "0x22cb1f409628f958c0684ae2144f095db8e09186f648bdf3fc1b9cf4d05ef76e";
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (receipt) {
    console.log("✅ 交易已確認");
    console.log(`   狀態: ${receipt.status === 1 ? "成功" : "失敗"}`);
    console.log(`   區塊: ${receipt.blockNumber}`);
    console.log(`   Gas: ${receipt.gasUsed.toString()}`);
  }

  // 檢查合約狀態（使用不同的方法）
  const PARTY_ADDRESS = "0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69";
  const DUNGEONCORE_ADDRESS = "0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a";
  
  // 讀取合約 storage slot
  console.log("\n📊 檢查合約 storage...");
  
  // dungeonCoreContract 通常在前幾個 storage slot
  for (let slot = 0; slot < 10; slot++) {
    const value = await provider.getStorage(PARTY_ADDRESS, slot);
    if (value.toLowerCase().includes(DUNGEONCORE_ADDRESS.toLowerCase().slice(2))) {
      console.log(`✅ 找到 DungeonCore 地址在 slot ${slot}: ${value}`);
      return true;
    }
  }
  
  console.log("⚠️ 未在前 10 個 storage slot 找到 DungeonCore 地址");
  console.log("\n建議：");
  console.log("1. Party 合約可能使用了不同的 storage 佈局");
  console.log("2. getter 函數的 revert 可能是設計問題");
  console.log("3. 建議在前端直接使用已知的 DungeonCore 地址");
}

verifyPartyFix().catch(console.error);
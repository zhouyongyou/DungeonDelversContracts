// Test script to verify withdraw functions work when contract is paused
const { ethers } = require("hardhat");

async function testWithdrawWhenPaused() {
  console.log("🔍 測試合約暫停時的提取功能");
  console.log("="*60);
  
  const [signer] = await ethers.getSigners();
  console.log("測試賬戶:", signer.address);
  
  // 測試合約列表
  const contracts = [
    { name: "Hero", hasWithdrawSoulShard: true, hasWithdrawNative: true },
    { name: "Relic", hasWithdrawSoulShard: true, hasWithdrawNative: true },
    { name: "DungeonMaster", hasWithdrawSoulShard: true, hasWithdrawNative: true },
    { name: "Party", hasWithdrawSoulShard: false, hasWithdrawNative: true },
    { name: "AltarOfAscension", hasWithdrawSoulShard: false, hasWithdrawNative: true },
  ];
  
  for (const contractInfo of contracts) {
    console.log(`\n📋 測試 ${contractInfo.name} 合約`);
    
    try {
      // 獲取合約地址（從環境變量或配置文件）
      const contractAddress = process.env[`VITE_${contractInfo.name.toUpperCase()}_ADDRESS`];
      if (!contractAddress) {
        console.log(`  ⚠️ 找不到 ${contractInfo.name} 地址，跳過`);
        continue;
      }
      
      // 連接到合約
      const Contract = await ethers.getContractAt(contractInfo.name, contractAddress);
      
      // 檢查是否為 owner
      const owner = await Contract.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`  ❌ 不是 owner (owner: ${owner})，跳過測試`);
        continue;
      }
      
      // 檢查暫停狀態
      const isPaused = await Contract.paused();
      console.log(`  暫停狀態: ${isPaused ? "⏸️ 已暫停" : "▶️ 運行中"}`);
      
      // 如果未暫停，先暫停合約
      if (!isPaused) {
        console.log("  暫停合約...");
        const pauseTx = await Contract.pause();
        await pauseTx.wait();
        console.log("  ✅ 合約已暫停");
      }
      
      // 測試提取功能
      console.log("  測試提取功能:");
      
      // 測試 withdrawSoulShard
      if (contractInfo.hasWithdrawSoulShard) {
        try {
          // 使用 callStatic 模擬調用，不實際執行
          await Contract.callStatic.withdrawSoulShard();
          console.log("    ✅ withdrawSoulShard 可在暫停時執行");
        } catch (error) {
          if (error.message.includes("Pausable: paused")) {
            console.log("    ❌ withdrawSoulShard 被暫停阻止");
          } else {
            console.log("    ✅ withdrawSoulShard 可執行（其他原因失敗）");
          }
        }
      }
      
      // 測試 withdrawNative
      if (contractInfo.hasWithdrawNative) {
        try {
          // 使用 callStatic 模擬調用，不實際執行
          await Contract.callStatic.withdrawNative();
          console.log("    ✅ withdrawNative 可在暫停時執行");
        } catch (error) {
          if (error.message.includes("Pausable: paused")) {
            console.log("    ❌ withdrawNative 被暫停阻止");
          } else {
            console.log("    ✅ withdrawNative 可執行（其他原因失敗）");
          }
        }
      }
      
      // 恢復合約（如果原本是運行中的）
      if (!isPaused) {
        console.log("  恢復合約...");
        const unpauseTx = await Contract.unpause();
        await unpauseTx.wait();
        console.log("  ✅ 合約已恢復");
      }
      
    } catch (error) {
      console.log(`  ⚠️ 測試失敗: ${error.message}`);
    }
  }
  
  console.log("\n" + "="*60);
  console.log("✅ 測試完成");
  console.log("\n📊 總結:");
  console.log("所有提取函數都應該在合約暫停時仍可執行（只有 onlyOwner 限制）");
}

// 執行測試
testWithdrawWhenPaused()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
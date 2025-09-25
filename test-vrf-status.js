const { ethers } = require("ethers");

async function testVRFStatus() {
  console.log("🔍 檢查 VRF Manager 狀態");
  
  // Setup provider
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  
  // Contract addresses - 硬編碼最新的 v1.4.0.3 地址
  const VRF_MANAGER = "0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c";
  const DUNGEON_CORE = "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b";
  
  console.log("📍 VRF Manager:", VRF_MANAGER);
  console.log("📍 預期 DungeonCore:", DUNGEON_CORE);
  
  try {
    // Direct call to check if setting worked
    // Try dungeonCore() function selector: 0x71c4efed
    const selector = "0x71c4efed"; // keccak256("dungeonCore()").substring(0, 10)
    
    console.log("\n🔧 直接調用 dungeonCore() 函數:");
    const result = await provider.call({
      to: VRF_MANAGER,
      data: selector
    });
    
    console.log("📥 原始結果:", result);
    
    if (result !== "0x" && result.length >= 42) {
      // Extract address from result (32 bytes, but address is last 20 bytes)
      const addressHex = "0x" + result.slice(-40);
      console.log("🎯 解析出的地址:", addressHex);
      
      if (addressHex.toLowerCase() === DUNGEON_CORE.toLowerCase()) {
        console.log("🎉 成功！VRF Manager 中的 DungeonCore 已正確設定");
      } else if (addressHex === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ DungeonCore 仍然是零地址，設定可能失敗");
      } else {
        console.log("❓ DungeonCore 設定為其他地址:", addressHex);
      }
    } else {
      console.log("❌ 無法讀取 DungeonCore 地址");
    }
    
    // Also check recent transactions to see if our setting worked
    console.log("\n📜 檢查最近交易:");
    console.log("設定交易: 0x503ea00243ed042d96c6accf5dc5f8d69e6ed6097b0df610e56d25f28e247999");
    
    const txReceipt = await provider.getTransactionReceipt("0x503ea00243ed042d96c6accf5dc5f8d69e6ed6097b0df610e56d25f28e247999");
    if (txReceipt) {
      console.log("✅ 交易已確認 - Status:", txReceipt.status === 1 ? "成功" : "失敗");
      console.log("⛽ Gas 使用:", txReceipt.gasUsed.toString());
      
      if (txReceipt.status === 1) {
        console.log("🎯 交易成功，DungeonCore 應該已設定");
      } else {
        console.log("❌ 交易失敗，設定沒有生效");
      }
    }
    
    // Test if frontend admin page should show correct value now
    console.log("\n💡 前端 Admin 頁面測試建議:");
    console.log("1. 刷新頁面: http://localhost:5173/#/admin");
    console.log("2. 查看 VRF → DungeonCore 部分");
    console.log("3. 如果還是顯示 0x000...，可能需要清除緩存");
    
  } catch (error) {
    console.error("❌ 檢查失敗:", error.message);
  }
}

// Run the test
testVRFStatus()
  .then(() => {
    console.log("\n🏁 VRF 狀態檢查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 檢查錯誤:", error);
    process.exit(1);
  });
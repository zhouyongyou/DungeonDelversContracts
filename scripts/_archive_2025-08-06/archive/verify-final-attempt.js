// 最終嘗試 - 使用不同的編碼方式驗證
const { ethers, run } = require("hardhat");

async function main() {
  console.log("🚀 最終驗證嘗試...\n");
  
  // DungeonCore 參數
  const dungeonCoreArgs = [
    "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
    "0x55d398326f99059fF775485246999027B3197955",
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
  ];
  
  // Oracle 參數  
  const oracleArgs = [
    "0x737c5b0430d5aeb104680460179aaa38608b6169",
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", 
    "0x55d398326f99059fF775485246999027B3197955"
  ];
  
  console.log("📋 驗證參數:");
  console.log("DungeonCore:", dungeonCoreArgs);
  console.log("Oracle:", oracleArgs);
  console.log("");
  
  // 嘗試驗證 DungeonCore
  try {
    console.log("⏳ 驗證 DungeonCore...");
    await run("verify:verify", {
      address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
      constructorArguments: dungeonCoreArgs,
      contract: "contracts/core/DungeonCore.sol:DungeonCore"
    });
    console.log("✅ DungeonCore 驗證成功！");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ DungeonCore 已經驗證過了");
    } else {
      console.log("❌ DungeonCore 驗證失敗:", error.message);
      
      // 檢查驗證狀態
      console.log("🔍 檢查 BSCScan 驗證狀態...");
      console.log("請訪問: https://bscscan.com/address/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5#code");
    }
  }
  
  console.log("");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 嘗試驗證 Oracle
  try {
    console.log("⏳ 驗證 Oracle...");
    await run("verify:verify", {
      address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
      constructorArguments: oracleArgs,
      contract: "contracts/defi/Oracle.sol:Oracle"
    });
    console.log("✅ Oracle 驗證成功！");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Oracle 已經驗證過了");
    } else {
      console.log("❌ Oracle 驗證失敗:", error.message);
      
      // 檢查驗證狀態
      console.log("🔍 檢查 BSCScan 驗證狀態...");
      console.log("請訪問: https://bscscan.com/address/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806#code");
    }
  }
  
  console.log("\n📝 總結:");
  console.log("如果自動驗證失敗，但已生成了 flatten 檔案:");
  console.log("- DungeonCore_flat.sol");
  console.log("- Oracle_flat.sol");
  console.log("\n手動驗證設置:");
  console.log("- 編譯器: v0.8.20");
  console.log("- 優化: Enabled, 200 runs");
  console.log("- viaIR: Yes");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
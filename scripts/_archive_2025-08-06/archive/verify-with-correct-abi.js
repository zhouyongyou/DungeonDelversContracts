// 使用正確 ABI 編碼的驗證腳本
const { ethers, run } = require("hardhat");

async function main() {
  console.log("🚀 使用正確 ABI 編碼進行驗證...\n");
  
  // 正確的構造函數參數（原始格式）
  const dungeonCoreArgs = [
    "0x10925A7138649C7E1794CE646182eeb5BF8ba647",
    "0x55d398326f99059fF775485246999027B3197955", 
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
  ];
  
  const oracleArgs = [
    "0x737c5b0430d5aeb104680460179aaa38608b6169",
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    "0x55d398326f99059fF775485246999027B3197955"
  ];
  
  // 驗證 DungeonCore
  try {
    console.log("⏳ 驗證 DungeonCore...");
    console.log("地址:", "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
    console.log("參數:", dungeonCoreArgs);
    
    await run("verify:verify", {
      address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
      constructorArguments: dungeonCoreArgs
    });
    
    console.log("✅ DungeonCore 驗證成功！");
    console.log("查看: https://bscscan.com/address/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5#code");
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ DungeonCore 已經驗證過了");
    } else {
      console.log("❌ DungeonCore 自動驗證失敗:", error.message);
      console.log("💡 手動驗證 ABI 編碼參數:");
      
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address"],
        dungeonCoreArgs
      );
      console.log("   ", encoded);
    }
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // 等待 5 秒
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 驗證 Oracle
  try {
    console.log("⏳ 驗證 Oracle...");
    console.log("地址:", "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
    console.log("參數:", oracleArgs);
    
    await run("verify:verify", {
      address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
      constructorArguments: oracleArgs
    });
    
    console.log("✅ Oracle 驗證成功！");
    console.log("查看: https://bscscan.com/address/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806#code");
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Oracle 已經驗證過了");
    } else {
      console.log("❌ Oracle 自動驗證失敗:", error.message);
      console.log("💡 手動驗證 ABI 編碼參數:");
      
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address"],
        oracleArgs
      );
      console.log("   ", encoded);
    }
  }
  
  console.log("\n📝 總結:");
  console.log("如果自動驗證仍然失敗，請使用上面顯示的正確 ABI 編碼參數手動驗證");
  console.log("BSCScan 手動驗證設置:");
  console.log("- Compiler: v0.8.20+commit.a1b79de6");
  console.log("- Optimization: Yes, 200 runs"); 
  console.log("- Via IR: Yes");
  console.log("- License: MIT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
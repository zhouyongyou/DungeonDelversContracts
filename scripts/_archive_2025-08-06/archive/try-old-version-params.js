// 嘗試使用舊版本的參數驗證
const { ethers, run } = require("hardhat");

async function tryOldVersionVerification() {
  console.log("🔍 嘗試使用舊版本的參數進行驗證...\n");
  
  console.log("💡 發現：以前版本的驗證腳本顯示：");
  console.log("- DungeonCore: 只有 1 個參數 (initialOwner)");  
  console.log("- Oracle: 0 個參數 ([])");
  console.log("");
  
  // 嘗試舊版本參數 - DungeonCore 只有 1 個參數
  console.log("🧪 測試 1: DungeonCore 使用 1 個參數...");
  try {
    await run("verify:verify", {
      address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
      constructorArguments: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"] // 只有 initialOwner
    });
    console.log("✅ DungeonCore (1個參數) 驗證成功！");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ DungeonCore 已經驗證過了");
    } else {
      console.log("❌ DungeonCore (1個參數) 驗證失敗:", error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // 等待 5 秒
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 嘗試舊版本參數 - Oracle 0 個參數
  console.log("🧪 測試 2: Oracle 使用 0 個參數...");
  try {
    await run("verify:verify", {
      address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
      constructorArguments: [] // 空參數
    });
    console.log("✅ Oracle (0個參數) 驗證成功！");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Oracle 已經驗證過了");
    } else {
      console.log("❌ Oracle (0個參數) 驗證失敗:", error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // 等待 5 秒
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 如果上面都失敗，嘗試檢查合約是否真的需要這些參數
  console.log("🔍 測試 3: 檢查實際部署的字節碼...");
  
  // 檢查實際合約的 constructor 事件
  try {
    const provider = ethers.provider;
    
    // 獲取 DungeonCore 的部署交易
    console.log("📋 檢查 DungeonCore 部署交易...");
    // 這需要知道部署交易的 hash
    
    console.log("💡 建議：檢查實際部署交易以確認使用的參數");
    console.log("- DungeonCore: https://bscscan.com/address/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
    console.log("- Oracle: https://bscscan.com/address/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
    
  } catch (error) {
    console.log("❌ 檢查部署交易失敗:", error.message);
  }
  
  console.log("\n📝 下一步建議:");
  console.log("1. 如果舊參數成功，說明 V12 合約結構沒有改變");
  console.log("2. 如果舊參數失敗，說明 V12 確實升級了構造函數");
  console.log("3. 需要查看實際的部署交易來確認真正使用的參數");
}

async function main() {
  await tryOldVersionVerification();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
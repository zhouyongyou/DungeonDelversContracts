// 生成正確的 ABI 編碼參數
const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 生成正確的 ABI 編碼參數...\n");
  
  // DungeonCore 構造函數參數
  const dungeonCoreParams = [
    "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
    "0x55d398326f99059fF775485246999027B3197955", // usdToken (USDT)
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
  ];
  
  console.log("📋 DungeonCore 參數:");
  console.log("原始參數:", dungeonCoreParams);
  
  // 使用 ethers.js 編碼
  const dungeonCoreEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    dungeonCoreParams
  );
  
  console.log("ABI 編碼結果:", dungeonCoreEncoded);
  console.log("去除 0x 前綴:", dungeonCoreEncoded.slice(2));
  console.log("");
  
  // Oracle 構造函數參數
  const oracleParams = [
    "0x737c5b0430d5aeb104680460179aaa38608b6169", // poolAddress
    "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", // soulShardToken
    "0x55d398326f99059fF775485246999027B3197955"  // usdToken
  ];
  
  console.log("📋 Oracle 參數:");
  console.log("原始參數:", oracleParams);
  
  const oracleEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    oracleParams
  );
  
  console.log("ABI 編碼結果:", oracleEncoded);
  console.log("去除 0x 前綴:", oracleEncoded.slice(2));
  console.log("");
  
  // 驗證編碼是否正確
  console.log("🔍 驗證編碼正確性:");
  
  try {
    const decodedDungeonCore = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address", "address", "address"],
      dungeonCoreEncoded
    );
    console.log("✅ DungeonCore 解碼成功:", decodedDungeonCore.map(addr => addr.toLowerCase()));
    
    const decodedOracle = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address", "address", "address"],
      oracleEncoded
    );
    console.log("✅ Oracle 解碼成功:", decodedOracle.map(addr => addr.toLowerCase()));
    
  } catch (error) {
    console.log("❌ 解碼失敗:", error.message);
  }
  
  console.log("\n📝 BSCScan 驗證步驟:");
  console.log("====================");
  
  console.log("\n🏰 DungeonCore:");
  console.log("地址: 0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  console.log("構造函數參數 (含 0x):", dungeonCoreEncoded);
  console.log("構造函數參數 (不含 0x):", dungeonCoreEncoded.slice(2));
  
  console.log("\n🔮 Oracle:");
  console.log("地址: 0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
  console.log("構造函數參數 (含 0x):", oracleEncoded);
  console.log("構造函數參數 (不含 0x):", oracleEncoded.slice(2));
  
  console.log("\n💡 BSCScan 設置:");
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
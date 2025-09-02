// 手動驗證 DungeonCore 和 Oracle
const { ethers } = require("hardhat");

async function main() {
  console.log("\n📝 手動驗證參數準備...\n");
  
  // DungeonCore
  console.log("1. DungeonCore:");
  console.log("   地址: 0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  console.log("   構造函數參數:");
  console.log("   - initialOwner: 0xEbCF4A36Ad1485A9737025e9d72186b604487274");
  console.log("   - usdToken: 0x55d398326f99059fF775485246999027B3197955");
  console.log("   - soulShardToken: 0xc88dAD283Ac209D77Bfe452807d378615AB8B94a");
  
  // 編碼構造函數參數
  const dungeonCoreArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    [
      "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
      "0x55d398326f99059fF775485246999027B3197955",
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
    ]
  );
  console.log("   編碼後的參數:", dungeonCoreArgs);
  console.log("   驗證鏈接: https://bscscan.com/verifyContract?a=0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5");
  
  console.log("\n2. Oracle:");
  console.log("   地址: 0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
  console.log("   構造函數參數:");
  console.log("   - poolAddress: 0x737c5b0430d5aeb104680460179aaa38608b6169");
  console.log("   - soulShardToken: 0xc88dAD283Ac209D77Bfe452807d378615AB8B94a");
  console.log("   - usdToken: 0x55d398326f99059fF775485246999027B3197955");
  
  // 編碼構造函數參數
  const oracleArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    [
      "0x737c5b0430d5aeb104680460179aaa38608b6169",
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
      "0x55d398326f99059fF775485246999027B3197955"
    ]
  );
  console.log("   編碼後的參數:", oracleArgs);
  console.log("   驗證鏈接: https://bscscan.com/verifyContract?a=0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806");
  
  console.log("\n📋 手動驗證步驟:");
  console.log("1. 訪問上述驗證鏈接");
  console.log("2. 選擇 Compiler Type: Solidity (Single file)");
  console.log("3. 選擇 Compiler Version: v0.8.25+commit.b61c2a91");
  console.log("4. 選擇 License Type: MIT");
  console.log("5. 填入對應的構造函數參數（已編碼）");
  console.log("6. 粘貼合約源碼");
  console.log("7. 點擊驗證");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log("🔍 開始驗證 Oracle V20 合約...\n");

  const ORACLE_ADDRESS = "0x570ab1b068FB8ca51c995e78d2D62189B6201284";
  const POOL_ADDRESS = "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const USD_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
  const DUNGEON_CORE_ADDRESS = "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9";
  const DEPLOYER = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";

  try {
    console.log("合約地址:", ORACLE_ADDRESS);
    console.log("部署者地址:", DEPLOYER);
    console.log("\n構造函數參數:");
    console.log("- Uniswap Pool:", POOL_ADDRESS);
    console.log("- SoulShard Token:", SOULSHARD_ADDRESS);
    console.log("- USD Token:", USD_ADDRESS);
    console.log("- DungeonCore:", DUNGEON_CORE_ADDRESS);
    console.log("- Initial Owner:", DEPLOYER);

    // 驗證合約
    await hre.run("verify:verify", {
      address: ORACLE_ADDRESS,
      constructorArguments: [
        POOL_ADDRESS,
        SOULSHARD_ADDRESS,
        USD_ADDRESS
      ],
      contract: "contracts/current/defi/Oracle.sol:Oracle_Final"
    });

    console.log("\n✅ Oracle 合約驗證成功！");
    console.log(`查看合約: https://bscscan.com/address/${ORACLE_ADDRESS}#code`);

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n⚠️ 合約已經驗證過了！");
      console.log(`查看合約: https://bscscan.com/address/${ORACLE_ADDRESS}#code`);
    } else {
      console.error("\n❌ 驗證失敗:", error);
      console.log("\n可能的原因:");
      console.log("1. 確認 .env 中的 BSCSCAN_API_KEY 設置正確");
      console.log("2. 確認合約地址和構造函數參數正確");
      console.log("3. 確認合約源碼與部署時一致");
      console.log("4. 等待幾分鐘後再試（BSCScan 可能需要時間索引）");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
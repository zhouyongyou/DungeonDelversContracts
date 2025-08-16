const hre = require("hardhat");

async function main() {
  console.log("🔍 開始驗證 Oracle V21 合約...\n");

  const ORACLE_ADDRESS = "0xcE3c98891B90c6c1cb2b121dFf5c44Db6183317B";
  const POOL_ADDRESS = "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const USD_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";

  try {
    console.log("合約地址:", ORACLE_ADDRESS);
    console.log("\n構造函數參數:");
    console.log("- Uniswap Pool:", POOL_ADDRESS);
    console.log("- SoulShard Token:", SOULSHARD_ADDRESS);
    console.log("- USD Token:", USD_ADDRESS);

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
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
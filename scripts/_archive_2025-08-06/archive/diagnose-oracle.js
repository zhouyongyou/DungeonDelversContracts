// 診斷 Oracle 問題
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== Oracle 診斷腳本 ===\n");
  
  // 合約地址
  const addresses = {
    oracle: "0x1Cd2FBa6f4614383C32f4807f67f059eF4Dbfd0c",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    usdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",  // TestUSD
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    // 真實的 BUSD 和 SOUL 地址（如果需要）
    realBUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    realSOUL: "0x298Eff8af1ecEbbB2c034eaA3b9a5d0Cc56c59CD"  // 如果有真實 SOUL token
  };
  
  // 連接 Oracle 合約
  const oracle = await ethers.getContractAt("contracts/defi/Oracle_VerificationFix.sol:Oracle", addresses.oracle);
  
  console.log("=== 1. Oracle 基本信息 ===");
  
  // 獲取 Pool 地址
  try {
    const poolAddress = await oracle.pool();
    console.log(`Pool 地址: ${poolAddress}`);
    
    if (poolAddress === ethers.ZeroAddress) {
      console.log("❌ Pool 地址為零地址！Oracle 未正確初始化");
    }
  } catch (error) {
    console.log("❌ 無法獲取 Pool 地址:", error.message);
  }
  
  // 獲取 token0 和 token1
  try {
    const token0 = await oracle.token0();
    const token1 = await oracle.token1();
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    
    // 確認哪個是 USD，哪個是 SOUL
    if (token0.toLowerCase() === addresses.usdToken.toLowerCase()) {
      console.log("Token0 是 USD token");
      console.log("Token1 是 SoulShard token");
    } else if (token1.toLowerCase() === addresses.usdToken.toLowerCase()) {
      console.log("Token0 是 SoulShard token");
      console.log("Token1 是 USD token");
    } else {
      console.log("⚠️  USD token 不在交易對中！");
    }
  } catch (error) {
    console.log("❌ 無法獲取 token 信息:", error.message);
  }
  
  // 獲取 TWAP 期間
  try {
    const twapDuration = await oracle.TWAP_DURATION();
    console.log(`TWAP 期間: ${twapDuration} 秒`);
  } catch (error) {
    console.log("無法獲取 TWAP_DURATION");
  }
  
  console.log("\n=== 2. 測試價格查詢 ===");
  
  // 測試不同金額的 USD 到 SOUL 轉換
  const testAmounts = [
    ethers.parseEther("1"),    // 1 USD
    ethers.parseEther("10"),   // 10 USD
    ethers.parseEther("100"),  // 100 USD
    ethers.parseEther("1000")  // 1000 USD
  ];
  
  for (const amount of testAmounts) {
    try {
      const soulAmount = await oracle.getAmountOut(addresses.usdToken, amount);
      const ratio = Number(soulAmount) / Number(amount);
      console.log(`${ethers.formatEther(amount)} USD = ${ethers.formatEther(soulAmount)} SOUL (比例: ${ratio.toFixed(4)})`);
    } catch (error) {
      console.error(`查詢 ${ethers.formatEther(amount)} USD 失敗:`, error.message);
    }
  }
  
  // 測試反向查詢（SOUL 到 USD）
  console.log("\n=== 3. 反向測試 (SOUL → USD) ===");
  const soulAmounts = [
    ethers.parseEther("10000"),   // 10k SOUL
    ethers.parseEther("33000"),   // 33k SOUL
    ethers.parseEther("100000")   // 100k SOUL
  ];
  
  for (const amount of soulAmounts) {
    try {
      const usdAmount = await oracle.getAmountOut(addresses.soulShard, amount);
      const ratio = Number(amount) / Number(usdAmount);
      console.log(`${ethers.formatEther(amount)} SOUL = ${ethers.formatEther(usdAmount)} USD (比例: ${ratio.toFixed(4)})`);
    } catch (error) {
      console.error(`查詢 ${ethers.formatEther(amount)} SOUL 失敗:`, error.message);
    }
  }
  
  console.log("\n=== 4. DungeonCore 測試 ===");
  const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", addresses.dungeonCore);
  
  // 測試 DungeonCore 的 getSoulShardAmountForUSD
  for (const amount of [ethers.parseEther("1"), ethers.parseEther("2"), ethers.parseEther("10")]) {
    try {
      const result = await dungeonCore.getSoulShardAmountForUSD(amount);
      console.log(`DungeonCore: ${ethers.formatEther(amount)} USD = ${ethers.formatEther(result)} SOUL`);
    } catch (error) {
      console.error(`DungeonCore 查詢失敗:`, error.message);
    }
  }
  
  console.log("\n=== 5. 可能的問題診斷 ===");
  
  // 檢查是否使用了測試 Oracle
  const poolAddress = await oracle.pool();
  if (poolAddress === ethers.ZeroAddress) {
    console.log("❌ Oracle 使用零地址作為 Pool，這表示：");
    console.log("   - Oracle 可能是測試版本，返回固定的 1:1 比例");
    console.log("   - 需要設置真實的 Uniswap V3 Pool 地址");
  }
  
  // 檢查 token 地址
  console.log("\n檢查 Token 配置:");
  console.log(`TestUSD 地址: ${addresses.usdToken}`);
  console.log(`SoulShard 地址: ${addresses.soulShard}`);
  console.log(`真實 BUSD: ${addresses.realBUSD}`);
  
  // 建議
  console.log("\n=== 建議解決方案 ===");
  console.log("1. 如果需要真實價格，需要：");
  console.log("   - 創建 TestUSD/SoulShard 的 Uniswap V3 Pool");
  console.log("   - 在 Oracle 中設置正確的 Pool 地址");
  console.log("   - 確保 Pool 有足夠的流動性和交易歷史");
  console.log("\n2. 如果是測試環境，可以：");
  console.log("   - 部署一個 MockOracle，返回固定的價格比例");
  console.log("   - 例如：1 USD = 16500 SOUL");
  console.log("\n3. 當前狀態：");
  console.log("   - Oracle 返回 1:1 比例");
  console.log("   - 這導致 2 USD 的鑄造費只需要 2 SOUL");
  console.log("   - 預期應該是約 33000 SOUL（真實環境）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
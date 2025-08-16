// 測試新部署的 Oracle 合約
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 測試新 Oracle 合約 ===\n");
  
  const addresses = {
    newOracle: "0xfaA414B9C38419D3cc31E0173697E9f43de40d1C",
    usdToken: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C"
  };
  
  // 獲取 Oracle 合約
  const oracle = await ethers.getContractAt([
    "function poolAddress() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function usdToken() view returns (address)",
    "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)",
    "function getSoulShardPriceInUSD() view returns (uint256)"
  ], addresses.newOracle);
  
  // 檢查配置
  console.log("Oracle 配置:");
  const poolAddress = await oracle.poolAddress();
  const soulShardToken = await oracle.soulShardToken();
  const usdToken = await oracle.usdToken();
  
  console.log("- Pool 地址:", poolAddress);
  console.log("- SoulShard 地址:", soulShardToken);
  console.log("- USD 地址:", usdToken);
  
  // 等待 10 秒讓 TWAP 累積數據
  console.log("\n等待 10 秒讓 TWAP 累積數據...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 測試價格
  console.log("\n=== 測試價格計算 ===");
  
  try {
    // 獲取 1 SOUL 的 USD 價格
    const soulPriceInUSD = await oracle.getSoulShardPriceInUSD();
    console.log("1 SOUL 價格:", ethers.formatEther(soulPriceInUSD), "USD");
    console.log("隱含比例: 1 USD =", (1 / Number(ethers.formatEther(soulPriceInUSD))).toFixed(2), "SOUL");
  } catch (error) {
    console.error("getSoulShardPriceInUSD 失敗:", error.message);
  }
  
  try {
    // 測試 USD → SOUL
    const usdAmount = ethers.parseEther("2");
    const soulAmount = await oracle.getAmountOut(addresses.usdToken, usdAmount);
    console.log("\n2 USD =", ethers.formatEther(soulAmount), "SOUL");
    
    // 測試 SOUL → USD
    const testSoulAmount = ethers.parseEther("33000");
    const usdOut = await oracle.getAmountOut(addresses.soulShard, testSoulAmount);
    console.log("33,000 SOUL =", ethers.formatEther(usdOut), "USD");
    
  } catch (error) {
    console.error("\ngetAmountOut 測試失敗:", error.message);
    
    // 如果是 OLD 錯誤，提供更多信息
    if (error.message.includes("OLD")) {
      console.log("\n⚠️ TWAP 數據不足");
      console.log("Uniswap V3 TWAP 需要至少 30 分鐘的觀察數據");
      console.log("請等待更多區塊產生後再試");
      
      // 檢查 Pool 的觀察數據
      const pool = await ethers.getContractAt([
        "function observe(uint32[] calldata secondsAgos) view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)"
      ], poolAddress);
      
      try {
        const result = await pool.observe([0]);
        console.log("\nPool 當前有觀察數據，但可能需要更多時間");
      } catch (e) {
        console.log("\nPool 觀察數據尚未初始化");
      }
    }
  }
  
  // 測試英雄和聖物價格
  console.log("\n=== 測試 NFT 鑄造價格 ===");
  
  try {
    const hero = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256 quantity) view returns (uint256)"
    ], addresses.hero);
    
    const relic = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256 quantity) view returns (uint256)"
    ], addresses.relic);
    
    const heroPrice = await hero.getRequiredSoulShardAmount(1);
    const relicPrice = await relic.getRequiredSoulShardAmount(1);
    
    console.log("Hero 鑄造價格:", ethers.formatEther(heroPrice), "SOUL");
    console.log("Relic 鑄造價格:", ethers.formatEther(relicPrice), "SOUL");
    console.log("\n預期價格 (基於 1 USD = 16,500 SOUL):");
    console.log("- Hero: ~33,000 SOUL (2 USD)");
    console.log("- Relic: ~33,000 SOUL (2 USD)");
    
  } catch (error) {
    console.error("NFT 價格測試失敗:", error.message);
  }
  
  console.log("\n=== 建議 ===");
  console.log("1. 如果出現 OLD 錯誤，請等待 30-60 分鐘讓 TWAP 累積數據");
  console.log("2. 確保 Pool 有足夠的流動性和交易活動");
  console.log("3. 可以考慮在 Pool 中進行一些小額交易來激活 TWAP");
  console.log("4. 前端應該會自動顯示新的價格");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
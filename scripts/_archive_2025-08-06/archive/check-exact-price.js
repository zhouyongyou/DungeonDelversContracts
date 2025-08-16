// 檢查精確的價格數值
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 檢查精確價格 ===\n");
  
  const contracts = {
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    mockOracle: "0x5e03a0770DA629bD328A9663a79D084E43D448d4"
  };
  
  // 檢查 Hero 價格
  const hero = await ethers.getContractAt([
    "function getRequiredSoulShardAmount(uint256) view returns (uint256)",
    "function mintPriceUSD() view returns (uint256)"
  ], contracts.hero);
  
  const heroPrice1 = await hero.getRequiredSoulShardAmount(1);
  const heroPrice5 = await hero.getRequiredSoulShardAmount(5);
  const heroMintPrice = await hero.mintPriceUSD();
  
  console.log("Hero 合約:");
  console.log("- mintPriceUSD:", heroMintPrice.toString(), "wei");
  console.log("- mintPriceUSD (ether):", ethers.formatEther(heroMintPrice), "USD");
  console.log("\n價格計算:");
  console.log("- 1 個 Hero:", heroPrice1.toString(), "wei");
  console.log("- 1 個 Hero (ether):", ethers.formatEther(heroPrice1), "SOUL");
  console.log("- 5 個 Hero:", heroPrice5.toString(), "wei");
  console.log("- 5 個 Hero (ether):", ethers.formatEther(heroPrice5), "SOUL");
  
  // 檢查 MockOracle
  console.log("\n=== MockOracle 測試 ===");
  const mockOracle = await ethers.getContractAt([
    "function getAmountOut(address, uint256) view returns (uint256)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function PRICE_RATIO() view returns (uint256)"
  ], contracts.mockOracle);
  
  try {
    const token0 = await mockOracle.token0();
    const token1 = await mockOracle.token1();
    console.log("Token0 (USD):", token0);
    console.log("Token1 (SOUL):", token1);
    
    // 嘗試獲取價格比例
    try {
      const ratio = await mockOracle.PRICE_RATIO();
      console.log("價格比例 PRICE_RATIO:", ratio.toString());
    } catch (e) {
      console.log("無法獲取 PRICE_RATIO");
    }
    
    // 測試 2 USD
    const testAmount = ethers.parseEther("2");
    const result = await mockOracle.getAmountOut(token0, testAmount);
    console.log("\nOracle 計算:");
    console.log("2 USD =", result.toString(), "wei");
    console.log("2 USD =", ethers.formatEther(result), "SOUL");
    
    // 測試小數 USD
    const testAmount2 = ethers.parseEther("2.123456");
    const result2 = await mockOracle.getAmountOut(token0, testAmount2);
    console.log("\n2.123456 USD =", ethers.formatEther(result2), "SOUL");
    
  } catch (error) {
    console.error("MockOracle 測試失敗:", error.message);
  }
  
  // 檢查 DungeonCore
  console.log("\n=== DungeonCore 測試 ===");
  const dungeonCore = await ethers.getContractAt([
    "function getSoulShardAmountForUSD(uint256) view returns (uint256)"
  ], contracts.dungeonCore);
  
  const coreResult = await dungeonCore.getSoulShardAmountForUSD(ethers.parseEther("2"));
  console.log("DungeonCore: 2 USD =", ethers.formatEther(coreResult), "SOUL");
  
  console.log("\n=== 分析 ===");
  console.log("如果顯示整數 33,000，可能的原因：");
  console.log("1. MockOracle 使用固定比例 16,500");
  console.log("2. 計算公式：2 USD * 16,500 = 33,000 SOUL（整數）");
  console.log("3. 真實的 Uniswap V3 Pool 會有更精確的價格");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
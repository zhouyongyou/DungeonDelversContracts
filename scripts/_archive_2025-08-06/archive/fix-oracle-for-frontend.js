// 修復前端價格讀取問題 - 切換回 MockOracle
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 修復前端價格讀取問題 ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("操作者:", deployer.address);
  
  const addresses = {
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    mockOracle: "0x5e03a0770DA629bD328A9663a79D084E43D448d4",
    hero: "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374",
    relic: "0x40e001D24aD6a28FC40870901DbF843D921fe56C"
  };
  
  // 獲取 DungeonCore 合約
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  console.log("當前 Oracle 地址:");
  try {
    // 嘗試不同的方式獲取 oracle 地址
    const DungeonCoreABI = [
      "function oracle() view returns (address)",
      "function setOracle(address) external",
      "function getSoulShardAmountForUSD(uint256) view returns (uint256)"
    ];
    
    const dungeonCoreWithABI = await ethers.getContractAt(
      DungeonCoreABI,
      addresses.dungeonCore
    );
    
    const currentOracle = await dungeonCoreWithABI.oracle();
    console.log("- 當前:", currentOracle);
    console.log("- MockOracle:", addresses.mockOracle);
    
    if (currentOracle !== addresses.mockOracle) {
      console.log("\n切換到 MockOracle...");
      const tx = await dungeonCore.setOracle(addresses.mockOracle);
      await tx.wait();
      console.log("✅ 已切換到 MockOracle");
    } else {
      console.log("✅ 已經在使用 MockOracle");
    }
    
  } catch (error) {
    console.log("獲取 oracle 地址失敗，嘗試直接設置...");
    try {
      const tx = await dungeonCore.setOracle(addresses.mockOracle);
      await tx.wait();
      console.log("✅ 已設置 MockOracle");
    } catch (setError) {
      console.error("設置失敗:", setError.message);
    }
  }
  
  // 測試價格計算
  console.log("\n=== 測試價格計算 ===");
  
  try {
    // 測試 Hero
    const hero = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
    ], addresses.hero);
    
    const heroPrice = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格:", ethers.formatEther(heroPrice), "SOUL");
    
    // 測試 Relic
    const relic = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
    ], addresses.relic);
    
    const relicPrice = await relic.getRequiredSoulShardAmount(1);
    console.log("Relic 鑄造價格:", ethers.formatEther(relicPrice), "SOUL");
    
    console.log("\n✅ 價格計算正常！");
    console.log("預期價格: ~33,000 SOUL (2 USD × 16,500)");
    
  } catch (error) {
    console.error("\n❌ 價格計算仍然失敗:", error.message);
    
    if (error.message.includes("Unsupported token")) {
      console.log("\n問題分析：");
      console.log("Hero/Relic 合約使用的 USD 地址與 Oracle 不匹配");
      console.log("這可能需要重新部署 Hero/Relic 合約");
      
      // 檢查 MockOracle 配置
      console.log("\n檢查 MockOracle 配置...");
      const mockOracle = await ethers.getContractAt([
        "function token0() view returns (address)",
        "function token1() view returns (address)",
        "function getAmountOut(address, uint256) view returns (uint256)"
      ], addresses.mockOracle);
      
      try {
        const token0 = await mockOracle.token0();
        const token1 = await mockOracle.token1();
        console.log("MockOracle token0 (USD):", token0);
        console.log("MockOracle token1 (SOUL):", token1);
        
        // 測試 MockOracle
        const testAmount = ethers.parseEther("2");
        const result = await mockOracle.getAmountOut(token0, testAmount);
        console.log("\nMockOracle 測試: 2 USD =", ethers.formatEther(result), "SOUL");
        
      } catch (oracleError) {
        console.error("MockOracle 檢查失敗:", oracleError.message);
      }
    }
  }
  
  console.log("\n=== 建議 ===");
  console.log("如果問題持續，可能需要：");
  console.log("1. 部署新的 MockOracle 使用正確的 USD 地址");
  console.log("2. 或重新部署 Hero/Relic 合約");
  console.log("3. 檢查前端是否有快取需要清理");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
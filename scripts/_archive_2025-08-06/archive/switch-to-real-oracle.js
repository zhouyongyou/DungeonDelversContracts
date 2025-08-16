// 切換到真實的 Uniswap V3 Oracle
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 切換到真實 Uniswap V3 Oracle ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("操作者:", deployer.address);
  
  const addresses = {
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    realOracle: "0xfaA414B9C38419D3cc31E0173697E9f43de40d1C", // 之前部署的真實 Oracle
    pool: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
    usdToken: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
  
  // 測試真實 Oracle
  console.log("測試真實 Oracle...");
  const oracle = await ethers.getContractAt([
    "function poolAddress() view returns (address)",
    "function usdToken() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function getAmountOut(address, uint256) view returns (uint256)"
  ], addresses.realOracle);
  
  const poolAddress = await oracle.poolAddress();
  const usdToken = await oracle.usdToken();
  const soulToken = await oracle.soulShardToken();
  
  console.log("Oracle 配置:");
  console.log("- Pool:", poolAddress);
  console.log("- USD:", usdToken);
  console.log("- SOUL:", soulToken);
  
  // 測試價格計算
  try {
    console.log("\n測試價格計算...");
    
    // 測試 1 USD
    const oneUsd = ethers.parseEther("1");
    const oneUsdResult = await oracle.getAmountOut(addresses.usdToken, oneUsd);
    console.log("1 USD =", ethers.formatEther(oneUsdResult), "SOUL");
    
    // 測試 2 USD
    const twoUsd = ethers.parseEther("2");
    const twoUsdResult = await oracle.getAmountOut(addresses.usdToken, twoUsd);
    console.log("2 USD =", ethers.formatEther(twoUsdResult), "SOUL");
    
    console.log("\n✅ Oracle 工作正常！");
    
    // 更新 DungeonCore
    console.log("\n更新 DungeonCore...");
    const dungeonCore = await ethers.getContractAt(
      "contracts/core/DungeonCore.sol:DungeonCore",
      addresses.dungeonCore
    );
    
    const tx = await dungeonCore.setOracle(addresses.realOracle);
    await tx.wait();
    console.log("✅ 已切換到真實 Oracle");
    
    // 測試英雄價格
    console.log("\n測試英雄鑄造價格...");
    const hero = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
    ], "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
    
    const heroPrice = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格:", ethers.formatEther(heroPrice), "SOUL");
    console.log("（預期約 33,946 SOUL）");
    
  } catch (error) {
    console.error("\n❌ Oracle 測試失敗:", error.message);
    
    if (error.message.includes("OLD")) {
      console.log("\n⚠️ TWAP 數據可能需要更多時間累積");
      console.log("建議等待 30-60 分鐘後再試");
    } else if (error.message.includes("Unsupported token")) {
      console.log("\n⚠️ USD Token 地址不匹配");
      console.log("Hero/Relic 合約使用: 0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074");
      console.log("Oracle 配置使用:", usdToken);
      console.log("\n需要重新部署 Hero/Relic 合約或使用匹配的 Oracle");
    }
  }
  
  console.log("\n=== 總結 ===");
  console.log("真實 Oracle 地址:", addresses.realOracle);
  console.log("Uniswap V3 Pool:", addresses.pool);
  console.log("預期價格: 1 USD ≈ 16,973 SOUL");
  console.log("英雄價格: 2 USD ≈ 33,946 SOUL");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
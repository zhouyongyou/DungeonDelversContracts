// 使用已存在的 Uniswap V3 Pool 設置 Oracle
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("\n=== 設置 Oracle 使用真實 Uniswap V3 Pool ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("操作者:", deployer.address);
  
  // 從環境變數讀取地址
  const addresses = {
    usdToken: process.env.MAINNET_USD_ADDRESS || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    soulShard: process.env.MAINNET_SOULSHARD_ADDRESS || "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    poolAddress: process.env.POOL_ADDRESS || "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
    oracle: "0x1Cd2FBa6f4614383C32f4807f67f059eF4Dbfd0c",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0"
  };
  
  console.log("配置地址:");
  console.log("- USD Token:", addresses.usdToken);
  console.log("- SoulShard:", addresses.soulShard);
  console.log("- Uniswap V3 Pool:", addresses.poolAddress);
  console.log("- Oracle:", addresses.oracle);
  console.log("- DungeonCore:", addresses.dungeonCore);
  
  // 檢查 Pool 合約
  console.log("\n=== 驗證 Uniswap V3 Pool ===");
  
  const pool = await ethers.getContractAt([
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ], addresses.poolAddress);
  
  try {
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    const slot0 = await pool.slot0();
    
    console.log("Pool 資訊:");
    console.log("- Token0:", token0);
    console.log("- Token1:", token1);
    console.log("- 費率:", Number(fee) / 10000, "%");
    console.log("- 當前 tick:", slot0.tick.toString());
    console.log("- sqrtPriceX96:", slot0.sqrtPriceX96.toString());
    
    // 驗證代幣順序
    const expectedTokens = [addresses.usdToken.toLowerCase(), addresses.soulShard.toLowerCase()].sort();
    const actualTokens = [token0.toLowerCase(), token1.toLowerCase()].sort();
    
    if (expectedTokens[0] !== actualTokens[0] || expectedTokens[1] !== actualTokens[1]) {
      throw new Error("Pool 代幣不匹配預期的 USD/SOUL 配對");
    }
    
    console.log("✅ Pool 代幣驗證通過");
  } catch (error) {
    console.error("❌ Pool 驗證失敗:", error.message);
    return;
  }
  
  // 測試 Oracle 合約
  console.log("\n=== 測試 Oracle 合約 ===");
  
  const oracle = await ethers.getContractAt([
    "function poolAddress() view returns (address)",
    "function soulShardToken() view returns (address)",
    "function usdToken() view returns (address)",
    "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)"
  ], addresses.oracle);
  
  // 檢查 Oracle 配置
  try {
    const oraclePool = await oracle.poolAddress();
    const oracleSoul = await oracle.soulShardToken();
    const oracleUsd = await oracle.usdToken();
    
    console.log("Oracle 當前配置:");
    console.log("- Pool 地址:", oraclePool);
    console.log("- SoulShard 地址:", oracleSoul);
    console.log("- USD 地址:", oracleUsd);
    
    if (oraclePool === ethers.ZeroAddress) {
      console.log("❌ Oracle 使用零地址作為 Pool！");
      console.log("需要部署新的 Oracle 合約並設置正確的 Pool 地址。");
      
      // 部署新 Oracle
      console.log("\n=== 部署新 Oracle ===");
      
      const Oracle = await ethers.getContractFactory("contracts/defi/Oracle_VerificationFix.sol:Oracle");
      const newOracle = await Oracle.deploy(
        addresses.poolAddress,
        addresses.soulShard,
        addresses.usdToken
      );
      await newOracle.waitForDeployment();
      
      const newOracleAddress = await newOracle.getAddress();
      console.log("✅ 新 Oracle 部署至:", newOracleAddress);
      
      // 更新 DungeonCore
      console.log("\n更新 DungeonCore 的 Oracle 地址...");
      const dungeonCore = await ethers.getContractAt(
        "contracts/core/DungeonCore.sol:DungeonCore",
        addresses.dungeonCore
      );
      
      const tx = await dungeonCore.setOracle(newOracleAddress);
      await tx.wait();
      console.log("✅ DungeonCore Oracle 已更新");
      
      // 測試新 Oracle
      await testOracle(newOracle, addresses);
      
      // 保存部署信息
      const fs = require('fs');
      const deploymentInfo = {
        oldOracle: addresses.oracle,
        newOracle: newOracleAddress,
        poolAddress: addresses.poolAddress,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        './ORACLE_DEPLOYMENT_POOL_FIX.json',
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log("\n部署信息已保存至 ORACLE_DEPLOYMENT_POOL_FIX.json");
      
    } else if (oraclePool.toLowerCase() === addresses.poolAddress.toLowerCase()) {
      console.log("✅ Oracle 已正確配置 Pool 地址");
      
      // 測試價格
      await testOracle(oracle, addresses);
      
    } else {
      console.log("⚠️ Oracle 使用不同的 Pool 地址:", oraclePool);
      console.log("預期 Pool 地址:", addresses.poolAddress);
    }
    
  } catch (error) {
    console.error("Oracle 測試失敗:", error.message);
  }
  
  // 更新 DungeonCore 確保使用正確的 Oracle
  console.log("\n=== 檢查 DungeonCore 配置 ===");
  
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  // 修正：oracle 是屬性不是函數
  const currentOracleAddress = await dungeonCore.oracle;
  console.log("DungeonCore 當前 Oracle:", currentOracleAddress);
  
  // 如果使用 MockOracle，提示更新
  if (currentOracleAddress === "0x5e03a0770DA629bD328A9663a79D084E43D448d4") {
    console.log("⚠️ DungeonCore 正在使用 MockOracle");
    console.log("建議更新為使用真實 Oracle 合約");
  }
}

async function testOracle(oracle, addresses) {
  console.log("\n測試價格計算...");
  
  try {
    // 測試 USD → SOUL
    const usdAmount = ethers.parseEther("2");
    const soulAmount = await oracle.getAmountOut(addresses.usdToken, usdAmount);
    console.log("2 USD =", ethers.formatEther(soulAmount), "SOUL");
    
    // 測試 SOUL → USD
    const testSoulAmount = ethers.parseEther("33000");
    const usdOut = await oracle.getAmountOut(addresses.soulShard, testSoulAmount);
    console.log("33,000 SOUL =", ethers.formatEther(usdOut), "USD");
    
    // 計算隱含價格
    const impliedPrice = Number(ethers.formatEther(soulAmount)) / 2;
    console.log("隱含價格: 1 USD =", impliedPrice.toFixed(2), "SOUL");
    
    // 測試英雄鑄造價格
    const hero = await ethers.getContractAt("Hero", "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
    const requiredSoul = await hero.getRequiredSoulShardAmount(1);
    console.log("\nHero 鑄造價格:", ethers.formatEther(requiredSoul), "SOUL");
    console.log("預期: ~33,000 SOUL (2 USD)");
    
  } catch (error) {
    console.error("價格測試失敗:", error.message);
    console.log("\n可能的原因:");
    console.log("1. Pool 缺少流動性");
    console.log("2. TWAP 需要時間累積數據");
    console.log("3. Oracle 合約配置錯誤");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
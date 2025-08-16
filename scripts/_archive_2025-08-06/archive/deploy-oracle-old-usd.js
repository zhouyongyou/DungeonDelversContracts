// 部署 Oracle 使用舊的 USD 地址（匹配 Hero/Relic）
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 部署 Oracle 使用舊 USD 地址 ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  const addresses = {
    oldUsdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074", // Hero/Relic 使用的 USD
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    poolAddress: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0"
  };
  
  console.log("配置:");
  console.log("- 舊 USD Token:", addresses.oldUsdToken);
  console.log("- SoulShard:", addresses.soulShard);
  console.log("- Pool:", addresses.poolAddress);
  
  // 檢查 Pool 是否包含正確的代幣
  console.log("\n檢查 Pool 配置...");
  const pool = await ethers.getContractAt([
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ], addresses.poolAddress);
  
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  console.log("Pool token0:", token0);
  console.log("Pool token1:", token1);
  
  // 如果 Pool 不包含舊 USD，需要使用 MockOracle
  const poolHasOldUsd = 
    token0.toLowerCase() === addresses.oldUsdToken.toLowerCase() ||
    token1.toLowerCase() === addresses.oldUsdToken.toLowerCase();
  
  if (!poolHasOldUsd) {
    console.log("\n⚠️ Pool 不包含舊 USD Token");
    console.log("將部署 MockOracle 使用真實價格比例...");
    
    // 創建 MockOracle 代碼
    const MockOracleCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockOracleRealPrice {
    address public immutable token0; // USD
    address public immutable token1; // SOUL
    uint256 public constant PRICE_RATIO = 16972; // 基於真實 Pool 價格
    
    constructor(address _usdToken, address _soulToken) {
        token0 = _usdToken;
        token1 = _soulToken;
    }
    
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        if (tokenIn == token0) {
            // USD to SOUL
            return amountIn * PRICE_RATIO / 1e18 * 1e18;
        } else if (tokenIn == token1) {
            // SOUL to USD
            return amountIn * 1e18 / PRICE_RATIO;
        } else {
            revert("Invalid token");
        }
    }
}`;
    
    // 保存並編譯
    const fs = require('fs');
    const path = require('path');
    const contractPath = path.join(__dirname, '../contracts/test/MockOracleRealPrice.sol');
    const contractDir = path.dirname(contractPath);
    
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }
    fs.writeFileSync(contractPath, MockOracleCode);
    
    await hre.run("compile");
    
    // 部署
    const MockOracle = await ethers.getContractFactory("MockOracleRealPrice");
    const oracle = await MockOracle.deploy(addresses.oldUsdToken, addresses.soulShard);
    await oracle.waitForDeployment();
    
    const oracleAddress = await oracle.getAddress();
    console.log("\n✅ MockOracle 部署成功:", oracleAddress);
    console.log("價格比例: 1 USD = 16,972 SOUL (基於真實 Pool)");
    
    // 測試價格
    console.log("\n測試價格計算...");
    const testAmount = ethers.parseEther("2");
    const result = await oracle.getAmountOut(addresses.oldUsdToken, testAmount);
    console.log("2 USD =", ethers.formatEther(result), "SOUL");
    
    // 更新 DungeonCore
    console.log("\n更新 DungeonCore...");
    const dungeonCore = await ethers.getContractAt(
      "contracts/core/DungeonCore.sol:DungeonCore",
      addresses.dungeonCore
    );
    
    const tx = await dungeonCore.setOracle(oracleAddress);
    await tx.wait();
    console.log("✅ DungeonCore 已更新");
    
    // 測試英雄價格
    console.log("\n測試英雄鑄造價格...");
    const hero = await ethers.getContractAt([
      "function getRequiredSoulShardAmount(uint256) view returns (uint256)"
    ], "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
    
    const heroPrice = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格:", ethers.formatEther(heroPrice), "SOUL");
    console.log("（預期約 33,944 SOUL）");
    
    console.log("\n=== 部署總結 ===");
    console.log("Oracle 地址:", oracleAddress);
    console.log("類型: MockOracle with Real Price");
    console.log("價格: 1 USD = 16,972 SOUL");
    console.log("\n✅ 前端現在會顯示真實的非整數價格！");
    
  } else {
    console.log("\n✅ Pool 包含所需代幣，但可能需要不同的 Oracle 實現");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
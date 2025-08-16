// 部署 Mock Oracle 以提供合理的測試價格
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 部署 Mock Oracle ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  // 現有地址
  const addresses = {
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    usdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
  
  // 創建 MockOracle 合約代碼
  const MockOracleCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockOracle {
    address public immutable token0; // USD
    address public immutable token1; // SOUL
    uint256 public constant PRICE_RATIO = 16500; // 1 USD = 16500 SOUL
    
    constructor(address _usdToken, address _soulToken) {
        token0 = _usdToken;
        token1 = _soulToken;
    }
    
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        if (tokenIn == token0) {
            // USD to SOUL: multiply by PRICE_RATIO
            return amountIn * PRICE_RATIO / 1e18 * 1e18;
        } else if (tokenIn == token1) {
            // SOUL to USD: divide by PRICE_RATIO
            return amountIn * 1e18 / PRICE_RATIO;
        } else {
            revert("Invalid token");
        }
    }
    
    // 兼容舊版本的函數
    function getSoulShardPriceInUSD() external pure returns (uint256) {
        // 返回 1 SOUL 的 USD 價格 (18 decimals)
        // 1 SOUL = 1/16500 USD ≈ 0.0000606 USD
        return 1e18 / PRICE_RATIO;
    }
}
`;

  // 保存合約代碼
  const fs = require('fs');
  const path = require('path');
  const contractPath = path.join(__dirname, '..', 'contracts', 'test', 'MockOracle.sol');
  
  // 確保目錄存在
  const contractDir = path.dirname(contractPath);
  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir, { recursive: true });
  }
  
  fs.writeFileSync(contractPath, MockOracleCode);
  console.log("✅ MockOracle.sol 已創建");
  
  // 編譯合約
  console.log("\n編譯合約...");
  await hre.run("compile");
  
  // 部署 MockOracle
  console.log("\n部署 MockOracle...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy(
    addresses.usdToken,
    addresses.soulShard
  );
  await mockOracle.waitForDeployment();
  
  const mockOracleAddress = await mockOracle.getAddress();
  console.log("✅ MockOracle 部署至:", mockOracleAddress);
  
  // 測試 MockOracle
  console.log("\n=== 測試 MockOracle ===");
  
  // 測試 USD 到 SOUL
  const testUsdAmount = ethers.parseEther("2"); // 2 USD
  const soulAmount = await mockOracle.getAmountOut(addresses.usdToken, testUsdAmount);
  console.log(`2 USD = ${ethers.formatEther(soulAmount)} SOUL`);
  console.log(`預期: 33000 SOUL`);
  
  // 測試 SOUL 到 USD
  const testSoulAmount = ethers.parseEther("33000"); // 33000 SOUL
  const usdAmount = await mockOracle.getAmountOut(addresses.soulShard, testSoulAmount);
  console.log(`33000 SOUL = ${ethers.formatEther(usdAmount)} USD`);
  console.log(`預期: 2 USD`);
  
  // 更新 DungeonCore 的 Oracle
  console.log("\n=== 更新 DungeonCore ===");
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  console.log("設置新的 Oracle 地址...");
  const tx = await dungeonCore.setOracle(mockOracleAddress);
  await tx.wait();
  console.log("✅ DungeonCore Oracle 已更新");
  
  // 驗證更新
  console.log("\n=== 驗證價格計算 ===");
  const hero = await ethers.getContractAt("Hero", "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
  const requiredSoul = await hero.getRequiredSoulShardAmount(1);
  console.log(`Hero 鑄造價格: ${ethers.formatEther(requiredSoul)} SOUL`);
  console.log(`預期: 約 33000 SOUL (2 USD * 16500)`);
  
  console.log("\n=== 部署總結 ===");
  console.log("MockOracle 地址:", mockOracleAddress);
  console.log("價格比例: 1 USD = 16500 SOUL");
  console.log("英雄鑄造: 2 USD ≈ 33000 SOUL");
  console.log("聖物鑄造: 2 USD ≈ 33000 SOUL");
  
  console.log("\n⚠️  注意事項:");
  console.log("1. 這是測試用的 MockOracle，使用固定價格");
  console.log("2. 真實環境應該使用 Uniswap V3 TWAP Oracle");
  console.log("3. 前端會自動顯示新的價格");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
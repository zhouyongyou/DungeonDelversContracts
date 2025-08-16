// 部署新的 Oracle 合約以使用正確的 USD 地址和 Uniswap V3 Pool
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("\n=== 部署新 Oracle 使用真實 Uniswap V3 Pool ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  // 從環境變數讀取地址
  const addresses = {
    usdToken: process.env.MAINNET_USD_ADDRESS || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    soulShard: process.env.MAINNET_SOULSHARD_ADDRESS || "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    poolAddress: process.env.POOL_ADDRESS || "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0"
  };
  
  console.log("配置地址:");
  console.log("- USD Token:", addresses.usdToken);
  console.log("- SoulShard:", addresses.soulShard);
  console.log("- Uniswap V3 Pool:", addresses.poolAddress);
  console.log("- DungeonCore:", addresses.dungeonCore);
  
  // 驗證 Pool
  console.log("\n=== 驗證 Uniswap V3 Pool ===");
  const pool = await ethers.getContractAt([
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ], addresses.poolAddress);
  
  const token0 = await pool.token0();
  const token1 = await pool.token1();
  const fee = await pool.fee();
  const slot0 = await pool.slot0();
  
  console.log("Pool 資訊:");
  console.log("- Token0:", token0);
  console.log("- Token1:", token1);
  console.log("- 費率:", Number(fee) / 10000, "%");
  console.log("- 當前 tick:", slot0.tick.toString());
  
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
  console.log("\n=== 更新 DungeonCore ===");
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  console.log("設置新的 Oracle 地址...");
  const tx = await dungeonCore.setOracle(newOracleAddress);
  await tx.wait();
  console.log("✅ DungeonCore Oracle 已更新");
  
  // 測試新 Oracle
  console.log("\n=== 測試價格計算 ===");
  
  try {
    // 測試 USD → SOUL
    const usdAmount = ethers.parseEther("2");
    const soulAmount = await newOracle.getAmountOut(addresses.usdToken, usdAmount);
    console.log("2 USD =", ethers.formatEther(soulAmount), "SOUL");
    
    // 測試 SOUL → USD  
    const testSoulAmount = ethers.parseEther("33000");
    const usdOut = await newOracle.getAmountOut(addresses.soulShard, testSoulAmount);
    console.log("33,000 SOUL =", ethers.formatEther(usdOut), "USD");
    
    // 計算隱含價格
    const impliedPrice = Number(ethers.formatEther(soulAmount)) / 2;
    console.log("隱含價格: 1 USD =", impliedPrice.toFixed(2), "SOUL");
    
  } catch (error) {
    console.error("價格測試失敗:", error.message);
    console.log("\n注意：Uniswap V3 TWAP 需要時間累積數據");
    console.log("如果出現 'OLD' 錯誤，請等待幾個區塊後再試");
  }
  
  // 測試英雄鑄造價格
  console.log("\n=== 測試英雄鑄造價格 ===");
  try {
    const hero = await ethers.getContractAt("Hero", "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
    const requiredSoul = await hero.getRequiredSoulShardAmount(1);
    console.log("Hero 鑄造價格:", ethers.formatEther(requiredSoul), "SOUL");
    console.log("預期: ~33,000 SOUL (基於 1 USD = 16,500 SOUL)");
  } catch (error) {
    console.error("英雄價格測試失敗:", error.message);
  }
  
  // 保存部署信息
  const fs = require('fs');
  const deploymentInfo = {
    newOracle: newOracleAddress,
    poolAddress: addresses.poolAddress,
    usdToken: addresses.usdToken,
    soulShard: addresses.soulShard,
    timestamp: new Date().toISOString(),
    note: "使用真實 Uniswap V3 Pool 替代 MockOracle"
  };
  
  fs.writeFileSync(
    './ORACLE_UNISWAP_V3_DEPLOYMENT.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n=== 部署總結 ===");
  console.log("新 Oracle 地址:", newOracleAddress);
  console.log("Uniswap V3 Pool:", addresses.poolAddress);
  console.log("費率:", Number(fee) / 10000, "%");
  console.log("\n✅ 新 Oracle 已部署並連接到真實 Uniswap V3 Pool");
  console.log("部署信息已保存至 ORACLE_UNISWAP_V3_DEPLOYMENT.json");
  
  // 更新部署記錄
  console.log("\n更新部署記錄...");
  const updateContent = `
# V18 Oracle 更新記錄 - 使用真實 Uniswap V3 Pool

## 更新日期
${new Date().toISOString()}

## 更新內容
- 從 MockOracle 切換到真實 Oracle
- 使用真實 Uniswap V3 Pool 進行價格查詢

## 新 Oracle 詳情
- **地址**: \`${newOracleAddress}\`
- **Pool 地址**: \`${addresses.poolAddress}\`
- **USD Token**: \`${addresses.usdToken}\`
- **SoulShard**: \`${addresses.soulShard}\`
- **費率**: ${Number(fee) / 10000}%

## 相關合約地址
- **DungeonCore**: \`${addresses.dungeonCore}\`
- **Hero**: \`0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374\`
- **Relic**: \`0x40e001D24aD6a28FC40870901DbF843D921fe56C\`
- **舊 MockOracle**: \`0x5e03a0770DA629bD328A9663a79D084E43D448d4\` (已棄用)

## 注意事項
1. 使用真實 Uniswap V3 TWAP 價格
2. 需要等待幾個區塊讓 TWAP 累積足夠數據
3. 前端會自動從合約讀取新的價格
`;
  
  fs.writeFileSync('./DEPLOYMENT_V18_ORACLE_UNISWAP_UPDATE.md', updateContent);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
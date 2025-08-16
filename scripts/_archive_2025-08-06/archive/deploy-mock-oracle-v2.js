// 部署改進版 MockOracle，提供更真實的價格波動
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 部署 MockOracle V2 ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者:", deployer.address);
  
  const addresses = {
    dungeonCore: "0xDD970622bE2ac33163B1DCfB4b2045CeeD9Ab1a0",
    usdToken: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
  };
  
  // 編譯合約
  console.log("編譯合約...");
  await hre.run("compile");
  
  // 部署 MockOracleV2
  console.log("\n部署 MockOracleV2...");
  const MockOracleV2 = await ethers.getContractFactory("MockOracleV2");
  const mockOracleV2 = await MockOracleV2.deploy(
    addresses.usdToken,
    addresses.soulShard
  );
  await mockOracleV2.waitForDeployment();
  
  const mockOracleV2Address = await mockOracleV2.getAddress();
  console.log("✅ MockOracleV2 部署至:", mockOracleV2Address);
  
  // 測試新 Oracle
  console.log("\n=== 測試 MockOracleV2 ===");
  console.log("執行多次測試以顯示價格波動...\n");
  
  for (let i = 0; i < 5; i++) {
    const testAmount = ethers.parseEther("2");
    const result = await mockOracleV2.getAmountOut(addresses.usdToken, testAmount);
    console.log(`測試 ${i+1}: 2 USD = ${ethers.formatEther(result)} SOUL`);
    
    // 等待一點時間讓時間戳變化
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 更新 DungeonCore
  console.log("\n=== 更新 DungeonCore ===");
  const dungeonCore = await ethers.getContractAt(
    "contracts/core/DungeonCore.sol:DungeonCore",
    addresses.dungeonCore
  );
  
  console.log("設置新的 Oracle 地址...");
  const tx = await dungeonCore.setOracle(mockOracleV2Address);
  await tx.wait();
  console.log("✅ DungeonCore Oracle 已更新");
  
  // 測試英雄價格
  console.log("\n=== 測試英雄鑄造價格 ===");
  const hero = await ethers.getContractAt("Hero", "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
  
  for (let i = 0; i < 3; i++) {
    const price = await hero.getRequiredSoulShardAmount(1);
    console.log(`Hero 價格 ${i+1}: ${ethers.formatEther(price)} SOUL`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n=== 部署總結 ===");
  console.log("MockOracleV2 地址:", mockOracleV2Address);
  console.log("基礎價格比例: 1 USD ≈ 16,971 SOUL");
  console.log("價格波動範圍: ±0.6% (約 ±100 SOUL)");
  console.log("\n✅ 現在前端會顯示更真實的非整數價格！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
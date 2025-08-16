// 診斷並修復 NFT 鑄造問題
const { ethers } = require("hardhat");

async function diagnoseAndFix() {
  console.log('\n🔍 完整診斷 NFT 鑄造流程...\n');

  // V12 合約地址
  const addresses = {
    DUNGEONCORE: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    ORACLE: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    HERO: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
    SOULSHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    USDT: "0x55d398326f99059fF775485246999027B3197955"
  };

  const [signer] = await ethers.getSigners();

  // 1. 檢查 DungeonCore
  console.log('1️⃣ 檢查 DungeonCore:');
  const dungeonCore = await ethers.getContractAt([
    "function usdTokenAddress() external view returns (address)",
    "function soulShardTokenAddress() external view returns (address)",
    "function oracleAddress() external view returns (address)",
    "function getSoulShardAmountForUSD(uint256) external view returns (uint256)"
  ], addresses.DUNGEONCORE);

  const usdToken = await dungeonCore.usdTokenAddress();
  const soulShardToken = await dungeonCore.soulShardTokenAddress();
  const oracleAddress = await dungeonCore.oracleAddress();
  
  console.log(`  USD 代幣: ${usdToken}`);
  console.log(`  SoulShard: ${soulShardToken}`);
  console.log(`  Oracle: ${oracleAddress}`);

  // 2. 檢查 Oracle 配置
  console.log('\n2️⃣ 檢查 Oracle:');
  const oracle = await ethers.getContractAt([
    "function usdToken() external view returns (address)",
    "function soulShardToken() external view returns (address)",
    "function getSoulShardPriceInUSD() external view returns (uint256)"
  ], addresses.ORACLE);

  const oracleUsdToken = await oracle.usdToken();
  const oracleSoulToken = await oracle.soulShardToken();
  
  console.log(`  Oracle USD 代幣: ${oracleUsdToken}`);
  console.log(`  Oracle SoulShard: ${oracleSoulToken}`);
  
  // 檢查價格
  try {
    const price = await oracle.getSoulShardPriceInUSD();
    console.log(`  SoulShard 價格: ${ethers.formatEther(price)} USD`);
  } catch (e) {
    console.log(`  ❌ 無法獲取價格: ${e.message}`);
  }

  // 3. 問題診斷
  console.log('\n❌ 發現的問題:');
  
  if (usdToken !== oracleUsdToken) {
    console.log(`  1. DungeonCore USD 代幣 (${usdToken}) 與 Oracle USD 代幣 (${oracleUsdToken}) 不匹配！`);
  }
  
  if (usdToken === addresses.USDT) {
    console.log(`  2. DungeonCore 使用 USDT，但 Oracle 使用其他 USD 代幣`);
  }

  // 4. 測試轉換
  console.log('\n3️⃣ 測試價格轉換:');
  try {
    // 10 USD 能買多少 SOUL
    const testAmount = ethers.parseEther("10"); // 10 USD (18 decimals)
    const soulAmount = await dungeonCore.getSoulShardAmountForUSD(testAmount);
    console.log(`  10 USD = ${ethers.formatEther(soulAmount)} SOUL`);
  } catch (e) {
    console.log(`  ❌ 轉換失敗: ${e.message}`);
  }

  // 5. 測試 Hero 鑄造
  console.log('\n4️⃣ 測試 Hero 鑄造需求:');
  const hero = await ethers.getContractAt([
    "function mintPriceUSD() external view returns (uint256)",
    "function getRequiredSoulShardAmount(uint256) external view returns (uint256)"
  ], addresses.HERO);

  try {
    const mintPrice = await hero.mintPriceUSD();
    console.log(`  Hero 鑄造價格: ${ethers.formatEther(mintPrice)} USD`);
    
    const requiredSoul = await hero.getRequiredSoulShardAmount(1);
    console.log(`  需要 SoulShard: ${ethers.formatEther(requiredSoul)} SOUL`);
  } catch (e) {
    console.log(`  ❌ 查詢失敗: ${e.message}`);
  }

  // 6. 解決方案
  console.log('\n💡 問題總結:');
  console.log('  Oracle 使用的 USD 代幣與 DungeonCore 配置的不一致');
  console.log('  導致 getAmountOut 函數拒絕不認識的代幣地址');
  console.log('\n  解決方案：');
  console.log('  1. 部署新的 Oracle，使用正確的 USDT/SOUL 池子');
  console.log('  2. 或者修改 DungeonCore 的 usdTokenAddress 來匹配 Oracle');
  console.log('  3. 或者創建一個固定價格的簡化 Oracle');
}

diagnoseAndFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// 診斷價格顯示問題
const { ethers } = require("hardhat");

async function diagnosePriceIssue() {
  console.log('\n🔍 診斷 DungeonDelvers 價格顯示問題...\n');

  // 合約地址（請根據實際部署地址更新）
  const HERO_ADDRESS = "0xYourHeroContractAddress";
  const RELIC_ADDRESS = "0xYourRelicContractAddress";
  const DUNGEONCORE_ADDRESS = "0xYourDungeonCoreAddress";
  const ORACLE_ADDRESS = "0xYourOracleAddress";
  const SOULSHARD_ADDRESS = "0xYourSoulShardAddress";
  const USD_ADDRESS = "0xYourUSDAddress";

  try {
    // 獲取合約實例
    const hero = await ethers.getContractAt([
      "function mintPriceUSD() external view returns (uint256)",
      "function getRequiredSoulShardAmount(uint256 quantity) external view returns (uint256)",
      "function dungeonCore() external view returns (address)",
      "function soulShardToken() external view returns (address)"
    ], HERO_ADDRESS);

    const dungeonCore = await ethers.getContractAt([
      "function getSoulShardAmountForUSD(uint256 amountUSD) external view returns (uint256)",
      "function usdTokenAddress() external view returns (address)",
      "function soulShardTokenAddress() external view returns (address)",
      "function oracleAddress() external view returns (address)",
      "function usdDecimals() external view returns (uint8)"
    ], DUNGEONCORE_ADDRESS);

    const oracle = await ethers.getContractAt([
      "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256)",
      "function getSoulShardPriceInUSD() external view returns (uint256)",
      "function pool() external view returns (address)",
      "function soulShardToken() external view returns (address)",
      "function usdToken() external view returns (address)"
    ], ORACLE_ADDRESS);

    // 獲取 USD token 實例
    const usdToken = await ethers.getContractAt([
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)"
    ], USD_ADDRESS);

    const soulShardToken = await ethers.getContractAt([
      "function decimals() external view returns (uint8)",
      "function symbol() external view returns (string)"
    ], SOULSHARD_ADDRESS);

    console.log('=== 1. 基礎配置檢查 ===');
    console.log(`Hero Contract: ${HERO_ADDRESS}`);
    console.log(`DungeonCore: ${await hero.dungeonCore()}`);
    console.log(`Oracle (from DungeonCore): ${await dungeonCore.oracleAddress()}`);
    
    const mintPriceUSD = await hero.mintPriceUSD();
    console.log(`\nHero mintPriceUSD: ${ethers.formatEther(mintPriceUSD)} (raw: ${mintPriceUSD})`);
    console.log(`Expected: 2e18 (2 USD with 18 decimals)`);

    console.log('\n=== 2. Token Decimals 檢查 ===');
    const usdDecimals = await usdToken.decimals();
    const soulDecimals = await soulShardToken.decimals();
    const usdSymbol = await usdToken.symbol();
    const soulSymbol = await soulShardToken.symbol();
    
    console.log(`USD Token (${usdSymbol}): ${usdDecimals} decimals`);
    console.log(`SoulShard Token (${soulSymbol}): ${soulDecimals} decimals`);
    console.log(`DungeonCore stored USD decimals: ${await dungeonCore.usdDecimals()}`);

    console.log('\n=== 3. Oracle 價格檢查 ===');
    try {
      // 如果是舊版 Oracle（沒有 getSoulShardPriceInUSD）
      console.log('測試 Oracle getAmountOut 功能...');
      
      // 測試 1 USD 能換多少 SOUL
      const oneUSD = ethers.parseUnits("1", usdDecimals);
      const soulForOneUSD = await oracle.getAmountOut(USD_ADDRESS, oneUSD);
      console.log(`1 ${usdSymbol} = ${ethers.formatEther(soulForOneUSD)} SOUL`);
      
      // 測試 1 SOUL 能換多少 USD
      const oneSoul = ethers.parseEther("1");
      const usdForOneSoul = await oracle.getAmountOut(SOULSHARD_ADDRESS, oneSoul);
      console.log(`1 SOUL = ${ethers.formatUnits(usdForOneSoul, usdDecimals)} ${usdSymbol}`);
      
    } catch (error) {
      console.log('Oracle 價格查詢失敗:', error.message);
    }

    console.log('\n=== 4. DungeonCore getSoulShardAmountForUSD 測試 ===');
    const testUSDAmount = ethers.parseEther("2"); // 2 USD with 18 decimals
    console.log(`測試輸入: ${ethers.formatEther(testUSDAmount)} USD (18 decimals)`);
    
    try {
      const soulAmount = await dungeonCore.getSoulShardAmountForUSD(testUSDAmount);
      console.log(`DungeonCore 返回: ${ethers.formatEther(soulAmount)} SOUL`);
      console.log(`Raw value: ${soulAmount}`);
      
      // 檢查縮放邏輯
      const scaledAmount = (testUSDAmount * BigInt(10 ** usdDecimals)) / ethers.parseEther("1");
      console.log(`\n縮放計算檢查:`);
      console.log(`Input: ${testUSDAmount} (2e18)`);
      console.log(`USD decimals: ${usdDecimals}`);
      console.log(`Scaled amount: ${scaledAmount}`);
      console.log(`Expected scaled: ${ethers.parseUnits("2", usdDecimals)}`);
      
    } catch (error) {
      console.log('DungeonCore 計算失敗:', error.message);
    }

    console.log('\n=== 5. Hero getRequiredSoulShardAmount 測試 ===');
    try {
      const requiredForOne = await hero.getRequiredSoulShardAmount(1);
      console.log(`鑄造 1 個 Hero 需要: ${ethers.formatEther(requiredForOne)} SOUL`);
      console.log(`Raw value: ${requiredForOne}`);
      
      const requiredForTen = await hero.getRequiredSoulShardAmount(10);
      console.log(`鑄造 10 個 Hero 需要: ${ethers.formatEther(requiredForTen)} SOUL`);
      
    } catch (error) {
      console.log('Hero 計算失敗:', error.message);
    }

    console.log('\n=== 6. 直接測試價格計算流程 ===');
    // 模擬完整計算流程
    console.log('\n步驟分解:');
    console.log('1. mintPriceUSD = 2e18');
    console.log('2. DungeonCore 縮放計算:');
    const scaledTest = (BigInt(2) * BigInt(10 ** 18) * BigInt(10 ** usdDecimals)) / BigInt(10 ** 18);
    console.log(`   scaledAmount = (2e18 * 10^${usdDecimals}) / 10^18 = ${scaledTest}`);
    console.log('3. Oracle 計算 SOUL 數量...');

  } catch (error) {
    console.error('\n❌ 診斷過程出錯:', error);
  }
}

// 執行診斷
diagnosePriceIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
// 測試 Oracle 價格功能
const { ethers } = require("hardhat");

async function testOraclePrice() {
  console.log('\n🔮 測試 Oracle 價格功能...\n');

  const ORACLE_ADDRESS = "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806";
  const SOULSHARD_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

  try {
    const oracle = await ethers.getContractAt([
      "function pool() external view returns (address)",
      "function soulShardToken() external view returns (address)",
      "function usdToken() external view returns (address)",
      "function twapPeriod() external view returns (uint32)",
      "function getSoulShardPriceInUSD() external view returns (uint256)",
      "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256)"
    ], ORACLE_ADDRESS);

    console.log('📍 Oracle 配置:');
    const pool = await oracle.pool();
    const soulShard = await oracle.soulShardToken();
    const usdToken = await oracle.usdToken();
    const twapPeriod = await oracle.twapPeriod();
    
    console.log(`  Uniswap V3 池: ${pool}`);
    console.log(`  SoulShard 代幣: ${soulShard}`);
    console.log(`  USD 代幣: ${usdToken}`);
    console.log(`  TWAP 週期: ${twapPeriod} 秒`);

    console.log('\n📊 測試價格查詢:');
    try {
      const soulPrice = await oracle.getSoulShardPriceInUSD();
      console.log(`  SoulShard 價格: ${ethers.formatEther(soulPrice)} USD`);
      
      // 測試轉換功能
      const testAmountUSD = ethers.parseEther("10"); // 10 USD
      const soulAmount = await oracle.getAmountOut(USDT_ADDRESS, testAmountUSD);
      console.log(`  10 USD = ${ethers.formatEther(soulAmount)} SOUL`);
      
      const testAmountSOUL = ethers.parseEther("100"); // 100 SOUL
      const usdAmount = await oracle.getAmountOut(SOULSHARD_ADDRESS, testAmountSOUL);
      console.log(`  100 SOUL = ${ethers.formatEther(usdAmount)} USD`);
      
    } catch (error) {
      console.log('  ❌ 價格查詢失敗:', error.message);
      
      // 檢查 Uniswap V3 池
      console.log('\n🏊 檢查 Uniswap V3 池:');
      try {
        const poolContract = await ethers.getContractAt([
          "function token0() external view returns (address)",
          "function token1() external view returns (address)",
          "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
        ], pool);
        
        const token0 = await poolContract.token0();
        const token1 = await poolContract.token1();
        console.log(`  Token0: ${token0}`);
        console.log(`  Token1: ${token1}`);
        
        const slot0 = await poolContract.slot0();
        console.log(`  當前 Tick: ${slot0.tick}`);
        console.log(`  觀察基數: ${slot0.observationCardinality}`);
        
      } catch (poolError) {
        console.log('  ❌ 池子查詢失敗:', poolError.message);
      }
    }

  } catch (error) {
    console.error('❌ 主要錯誤:', error.message);
  }
}

testOraclePrice()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
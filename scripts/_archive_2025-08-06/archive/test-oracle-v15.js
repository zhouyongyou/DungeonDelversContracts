// 測試 V15 Oracle 價格功能
const { ethers } = require("hardhat");

async function testOracleV15() {
  console.log('\n🔮 測試 V15 Oracle 價格功能...\n');

  // 從 V15 部署配置中獲取地址
  const ORACLE_ADDRESS = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"; // 真實 SOUL 代幣
  const TESTUSD_ADDRESS = "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074"; // TestUSD
  const REAL_USD_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"; // 真實 USD
  const POOL_ADDRESS = "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"; // Uniswap V3 池

  try {
    // 獲取 Oracle 合約實例
    const oracle = await ethers.getContractAt("Oracle", ORACLE_ADDRESS);

    console.log('📍 Oracle 基本資訊:');
    console.log(`  Oracle 地址: ${ORACLE_ADDRESS}`);
    
    // 檢查 Oracle 配置
    console.log('\n📋 Oracle 配置:');
    const poolAddress = await oracle.poolAddress();
    const soulShardToken = await oracle.soulShardToken();
    const usdToken = await oracle.usdToken();
    const twapDuration = await oracle.TWAP_DURATION();
    
    console.log(`  池地址: ${poolAddress}`);
    console.log(`  SoulShard 代幣: ${soulShardToken}`);
    console.log(`  USD 代幣: ${usdToken}`);
    console.log(`  TWAP 持續時間: ${twapDuration} 秒`);
    
    // 驗證配置是否正確
    console.log('\n✅ 驗證配置:');
    console.log(`  池地址匹配: ${poolAddress === POOL_ADDRESS ? '✓' : '✗'}`);
    console.log(`  SoulShard 匹配: ${soulShardToken === SOULSHARD_ADDRESS ? '✓' : '✗'}`);
    console.log(`  USD 代幣是真實 USD: ${usdToken === REAL_USD_ADDRESS ? '✓' : '✗'}`);

    // 測試價格查詢
    console.log('\n📊 測試價格查詢:');
    
    try {
      // 測試 1: 100 USD 轉換為 SOUL
      const usdAmount = ethers.parseEther("100");
      console.log(`\n  測試 1: ${ethers.formatEther(usdAmount)} USD → SOUL`);
      
      const soulAmount = await oracle.getAmountOut(REAL_USD_ADDRESS, usdAmount);
      console.log(`  結果: ${ethers.formatEther(soulAmount)} SOUL`);
      
      // 測試 2: 1000 SOUL 轉換為 USD
      const soulTestAmount = ethers.parseEther("1000");
      console.log(`\n  測試 2: ${ethers.formatEther(soulTestAmount)} SOUL → USD`);
      
      const usdResult = await oracle.getAmountOut(SOULSHARD_ADDRESS, soulTestAmount);
      console.log(`  結果: ${ethers.formatEther(usdResult)} USD`);
      
      // 計算隱含價格
      const impliedPrice = (Number(ethers.formatEther(usdResult)) / 1000).toFixed(6);
      console.log(`\n  隱含價格: 1 SOUL = ${impliedPrice} USD`);
      
    } catch (priceError) {
      console.log('\n  ❌ 價格查詢失敗:', priceError.message);
      
      // 檢查 Uniswap V3 池狀態
      console.log('\n🏊 檢查 Uniswap V3 池狀態:');
      try {
        const poolContract = await ethers.getContractAt([
          "function token0() external view returns (address)",
          "function token1() external view returns (address)",
          "function liquidity() external view returns (uint128)",
          "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
          "function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)"
        ], poolAddress);
        
        const token0 = await poolContract.token0();
        const token1 = await poolContract.token1();
        const liquidity = await poolContract.liquidity();
        const slot0 = await poolContract.slot0();
        
        console.log(`  Token0: ${token0}`);
        console.log(`  Token1: ${token1}`);
        console.log(`  流動性: ${liquidity}`);
        console.log(`  當前 Tick: ${slot0.tick}`);
        console.log(`  觀察基數: ${slot0.observationCardinality}`);
        console.log(`  池子解鎖: ${slot0.unlocked}`);
        
        // 測試觀察功能
        console.log('\n  測試觀察功能:');
        try {
          const secondsAgos = [3600, 0]; // 1小時前和現在
          const observations = await poolContract.observe(secondsAgos);
          console.log(`  觀察成功: tickCumulatives 長度 = ${observations[0].length}`);
        } catch (observeError) {
          console.log(`  觀察失敗: ${observeError.message}`);
        }
        
      } catch (poolError) {
        console.log('  ❌ 池子查詢失敗:', poolError.message);
      }
      
      // 測試內部函數
      console.log('\n🔧 測試內部價格計算:');
      try {
        const testAmount = ethers.parseEther("1");
        const internalResult = await oracle._getAmountOutInternal(SOULSHARD_ADDRESS, testAmount);
        console.log(`  內部計算成功: 1 SOUL = ${ethers.formatEther(internalResult)} USD`);
      } catch (internalError) {
        console.log(`  內部計算失敗: ${internalError.message}`);
      }
    }

    // 測試與 TestUSD 的兼容性
    console.log('\n🧪 測試 TestUSD 查詢:');
    try {
      const testUsdAmount = ethers.parseEther("10");
      const result = await oracle.getAmountOut(TESTUSD_ADDRESS, testUsdAmount);
      console.log(`  10 TestUSD → ${ethers.formatEther(result)} SOUL`);
    } catch (testError) {
      console.log(`  ❌ TestUSD 不支援: ${testError.message}`);
    }

  } catch (error) {
    console.error('\n❌ 主要錯誤:', error);
  }
}

testOracleV15()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
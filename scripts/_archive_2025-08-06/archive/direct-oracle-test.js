// 直接測試 Oracle (不使用 Hardhat)
const { ethers } = require("ethers");
require("dotenv").config();

async function directOracleTest() {
  console.log('\n🔮 直接測試 Oracle 功能...\n');

  const ORACLE_ADDRESS = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const USD_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";

  try {
    // 連接到 BSC
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    
    // Oracle ABI
    const oracleABI = [
      "function poolAddress() view returns (address)",
      "function soulShardToken() view returns (address)", 
      "function usdToken() view returns (address)",
      "function TWAP_DURATION() view returns (uint32)",
      "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256)",
      "function _getAmountOutInternal(address tokenIn, uint256 amountIn) view returns (uint256)"
    ];

    const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleABI, provider);

    console.log('📋 Oracle 配置:');
    const poolAddress = await oracle.poolAddress();
    const soulShardToken = await oracle.soulShardToken();
    const usdToken = await oracle.usdToken();
    const twapDuration = await oracle.TWAP_DURATION();
    
    console.log(`  Oracle 地址: ${ORACLE_ADDRESS}`);
    console.log(`  池地址: ${poolAddress}`);
    console.log(`  SoulShard: ${soulShardToken}`);
    console.log(`  USD: ${usdToken}`);
    console.log(`  TWAP 持續時間: ${twapDuration} 秒`);

    console.log('\n📊 測試價格查詢:');
    
    // 測試 1: 100 USD → SOUL
    try {
      const usdAmount = ethers.parseEther("100");
      console.log(`\n測試 1: 100 USD → SOUL`);
      const soulAmount = await oracle.getAmountOut(USD_ADDRESS, usdAmount);
      console.log(`  結果: ${ethers.formatEther(soulAmount)} SOUL`);
      
      const pricePerSoul = 100 / Number(ethers.formatEther(soulAmount));
      console.log(`  隱含價格: 1 SOUL = ${pricePerSoul.toFixed(6)} USD`);
    } catch (error) {
      console.log(`  ❌ USD → SOUL 失敗: ${error.message}`);
    }

    // 測試 2: 1000 SOUL → USD
    try {
      const soulAmount = ethers.parseEther("1000");
      console.log(`\n測試 2: 1000 SOUL → USD`);
      const usdAmount = await oracle.getAmountOut(SOULSHARD_ADDRESS, soulAmount);
      console.log(`  結果: ${ethers.formatEther(usdAmount)} USD`);
      
      const pricePerSoul = Number(ethers.formatEther(usdAmount)) / 1000;
      console.log(`  隱含價格: 1 SOUL = ${pricePerSoul.toFixed(6)} USD`);
    } catch (error) {
      console.log(`  ❌ SOUL → USD 失敗: ${error.message}`);
    }

    // 檢查 Uniswap V3 池
    console.log('\n🏊 檢查 Uniswap V3 池:');
    const poolABI = [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function fee() view returns (uint24)",
      "function liquidity() view returns (uint128)",
      "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
    ];
    
    const pool = new ethers.Contract(poolAddress, poolABI, provider);
    
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    const liquidity = await pool.liquidity();
    const slot0 = await pool.slot0();
    
    console.log(`  Token0: ${token0}`);
    console.log(`  Token1: ${token1}`);
    console.log(`  手續費: ${Number(fee) / 10000}%`);
    console.log(`  流動性: ${liquidity}`);
    console.log(`  當前 Tick: ${slot0.tick}`);
    console.log(`  觀察基數: ${slot0.observationCardinality}`);

  } catch (error) {
    console.error('\n❌ 錯誤:', error);
  }
}

directOracleTest();
// 簡單的 Oracle 測試腳本
const { ethers } = require("hardhat");

async function simpleOracleTest() {
  console.log('\n🔮 簡單測試 V15 Oracle...\n');

  const ORACLE_ADDRESS = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const USD_ADDRESS = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";

  try {
    const [signer] = await ethers.getSigners();
    console.log('使用錢包:', signer.address);

    // 使用簡單的 ABI
    const oracleABI = [
      "function poolAddress() view returns (address)",
      "function soulShardToken() view returns (address)", 
      "function usdToken() view returns (address)",
      "function TWAP_DURATION() view returns (uint32)",
      "function getAmountOut(address tokenIn, uint256 amountIn) external returns (uint256)"
    ];

    const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleABI, signer);

    console.log('📋 檢查 Oracle 配置:');
    const poolAddress = await oracle.poolAddress();
    const soulShardToken = await oracle.soulShardToken();
    const usdToken = await oracle.usdToken();
    
    console.log(`  池地址: ${poolAddress}`);
    console.log(`  SoulShard: ${soulShardToken}`);
    console.log(`  USD: ${usdToken}`);

    console.log('\n📊 測試價格查詢:');
    
    // 測試 100 USD 轉 SOUL
    const usdAmount = ethers.parseEther("100");
    console.log(`\n測試: 100 USD → SOUL`);
    
    try {
      const tx = await oracle.getAmountOut(USD_ADDRESS, usdAmount);
      console.log(`  交易成功，結果: ${ethers.formatEther(tx)} SOUL`);
    } catch (error) {
      console.log(`  ❌ 錯誤: ${error.message}`);
      
      // 如果是 view 函數，嘗試使用 staticCall
      try {
        const result = await oracle.getAmountOut.staticCall(USD_ADDRESS, usdAmount);
        console.log(`  靜態調用成功，結果: ${ethers.formatEther(result)} SOUL`);
      } catch (staticError) {
        console.log(`  ❌ 靜態調用也失敗: ${staticError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

simpleOracleTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
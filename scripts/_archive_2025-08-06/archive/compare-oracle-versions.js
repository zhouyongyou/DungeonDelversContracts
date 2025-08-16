// 比較新舊 Oracle 版本的價格計算差異
const { ethers } = require("hardhat");

async function compareOracleVersions() {
  console.log('\n🔍 比較 Oracle 版本差異並診斷價格問題...\n');

  // 測試參數
  const TEST_USD_AMOUNT = ethers.parseEther("2"); // 2 USD with 18 decimals
  const USD_DECIMALS = 18; // BUSD has 18 decimals
  
  console.log('=== 問題分析 ===');
  console.log('顯示價格: 10000000000000000000.0000 SOUL');
  console.log('這個值正好是 10^19 = 10 * 10^18');
  console.log('預期價格: 約 2 SOUL (如果 1 SOUL = 1 USD)');
  
  console.log('\n=== DungeonCore 計算邏輯分析 ===');
  console.log('DungeonCore.getSoulShardAmountForUSD 函數:');
  console.log('```solidity');
  console.log('uint256 scaledAmount = (_amountUSD * (10**usdDecimals)) / 1e18;');
  console.log('return IOracle(oracleAddress).getAmountOut(usdTokenAddress, scaledAmount);');
  console.log('```');
  
  console.log('\n當 _amountUSD = 2e18, usdDecimals = 18:');
  const scaledAmount = (TEST_USD_AMOUNT * BigInt(10 ** USD_DECIMALS)) / ethers.parseEther("1");
  console.log(`scaledAmount = (2e18 * 10^18) / 10^18 = ${scaledAmount}`);
  console.log(`這應該等於 2e18`);
  
  console.log('\n=== 問題診斷 ===');
  console.log('可能的問題點:');
  console.log('1. Oracle 合約版本差異');
  console.log('   - 舊版 Oracle 可能使用不同的價格計算邏輯');
  console.log('   - 新版 Oracle 有 getSoulShardPriceInUSD() 函數');
  console.log('   - 價格轉換方向可能相反');
  
  console.log('\n2. 價格計算錯誤');
  console.log('   - 如果 Oracle 返回的是價格比率而不是代幣數量');
  console.log('   - 如果 Oracle 期望的輸入單位不同');
  
  console.log('\n3. 縮放邏輯問題');
  console.log('   - DungeonCore 的縮放邏輯可能多餘');
  console.log('   - 如果 USD 和 SOUL 都是 18 decimals，不需要縮放');
  
  console.log('\n=== 建議的修復方案 ===');
  console.log('\n方案 A: 修改 DungeonCore (推薦)');
  console.log('```solidity');
  console.log('function getSoulShardAmountForUSD(uint256 _amountUSD) external view returns (uint256) {');
  console.log('    require(oracleAddress != address(0), "Oracle not set");');
  console.log('    // 直接傳遞 _amountUSD，不做縮放');
  console.log('    return IOracle(oracleAddress).getAmountOut(usdTokenAddress, _amountUSD);');
  console.log('}');
  console.log('```');
  
  console.log('\n方案 B: 檢查 Oracle 實現');
  console.log('需要確認 Oracle.getAmountOut 的實現是否正確處理了:');
  console.log('- 輸入代幣的 decimals');
  console.log('- 價格計算方向');
  console.log('- TWAP 價格獲取');
  
  console.log('\n=== 測試建議 ===');
  console.log('1. 直接調用 Oracle.getAmountOut 測試:');
  console.log('   - 輸入: 2e18 USD');
  console.log('   - 預期輸出: ~2e18 SOUL (如果價格 1:1)');
  
  console.log('\n2. 檢查 Uniswap V3 池的實際價格');
  console.log('3. 確認 Oracle 是否正確讀取了池子價格');
  
  console.log('\n=== 臨時解決方案 ===');
  console.log('如果需要快速修復，可以:');
  console.log('1. 部署修正後的 DungeonCore');
  console.log('2. 或者調整 Hero/Relic 的 mintPriceUSD');
  console.log('   - 當前: 2e18');
  console.log('   - 調整為: 2e17 (補償 10 倍的錯誤)');
}

// 執行比較
compareOracleVersions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
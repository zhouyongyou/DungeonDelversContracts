const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 深入研究 VRF V2.5 配置問題 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // BSC 主網 VRF V2.5 官方地址
  const addresses = {
    vrfWrapper: "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94",
    vrfCoordinator: "0xd691f04bc0C9d2d4b7CAbDdaF00296aAC5d9bcB8", // V2.5 Coordinator
    linkToken: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
    linkNativeFeed: "0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8" // LINK/BNB feed
  };
  
  console.log("📍 BSC VRF V2.5 官方地址：");
  console.log("─".repeat(60));
  console.log("VRF V2.5 Wrapper:", addresses.vrfWrapper);
  console.log("VRF V2.5 Coordinator:", addresses.vrfCoordinator);
  console.log("LINK Token:", addresses.linkToken);
  console.log("LINK/BNB Price Feed:", addresses.linkNativeFeed);
  
  // 1. 檢查 VRF Wrapper 配置
  console.log("\n1. 檢查 VRF V2.5 Wrapper 配置");
  console.log("─".repeat(60));
  
  const wrapperAbi = [
    "function calculateRequestPriceNative(uint32 _callbackGasLimit, uint32 _numWords) view returns (uint256)",
    "function calculateRequestPrice(uint32 _callbackGasLimit, uint32 _numWords) view returns (uint256)",
    "function estimateRequestPriceNative(uint32 _callbackGasLimit, uint32 _numWords, uint256 _requestGasPriceWei) view returns (uint256)",
    "function lastRequestId() view returns (uint256)",
    "function s_configured() view returns (bool)",
    "function s_vrfCoordinator() view returns (address)",
    "function s_link() view returns (address)",
    "function s_linkNativeFeed() view returns (address)",
    "function SUBSCRIPTION_ID() view returns (uint256)"
  ];
  
  const wrapper = new ethers.Contract(addresses.vrfWrapper, wrapperAbi, provider);
  
  try {
    // 檢查配置狀態
    const isConfigured = await wrapper.s_configured();
    console.log("Wrapper 是否已配置:", isConfigured ? "✅ 是" : "❌ 否");
    
    const coordinator = await wrapper.s_vrfCoordinator();
    console.log("使用的 Coordinator:", coordinator);
    
    const link = await wrapper.s_link();
    console.log("LINK Token:", link);
    
    const feed = await wrapper.s_linkNativeFeed();
    console.log("Price Feed:", feed);
    
    const subId = await wrapper.SUBSCRIPTION_ID();
    console.log("Subscription ID:", subId.toString());
    
  } catch (error) {
    console.log("❌ 部分函數調用失敗（可能是 ABI 差異）");
  }
  
  // 2. 測試不同的價格計算方法
  console.log("\n2. 測試價格計算函數");
  console.log("─".repeat(60));
  
  const testGasLimits = [100000, 200000, 500000, 1000000];
  const numWords = 1;
  
  for (const gasLimit of testGasLimits) {
    console.log(`\nGas Limit: ${gasLimit}`);
    
    try {
      // calculateRequestPriceNative
      const priceNative = await wrapper.calculateRequestPriceNative(gasLimit, numWords);
      console.log(`  calculateRequestPriceNative: ${ethers.formatEther(priceNative)} BNB`);
    } catch (error) {
      console.log(`  calculateRequestPriceNative: ❌ 失敗`);
    }
    
    try {
      // calculateRequestPrice (LINK)
      const priceLink = await wrapper.calculateRequestPrice(gasLimit, numWords);
      console.log(`  calculateRequestPrice: ${ethers.formatUnits(priceLink, 18)} LINK`);
    } catch (error) {
      console.log(`  calculateRequestPrice: ❌ 失敗`);
    }
    
    try {
      // estimateRequestPriceNative with gas price
      const gasPrice = await provider.getFeeData();
      const priceEstimate = await wrapper.estimateRequestPriceNative(
        gasLimit, 
        numWords, 
        gasPrice.gasPrice
      );
      console.log(`  estimateRequestPriceNative: ${ethers.formatEther(priceEstimate)} BNB`);
    } catch (error) {
      console.log(`  estimateRequestPriceNative: ❌ 失敗`);
    }
  }
  
  // 3. 檢查 LINK/BNB 價格 Feed
  console.log("\n3. 檢查 LINK/BNB Price Feed");
  console.log("─".repeat(60));
  
  const priceFeedAbi = [
    "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() view returns (uint8)"
  ];
  
  try {
    const priceFeed = new ethers.Contract(addresses.linkNativeFeed, priceFeedAbi, provider);
    const decimals = await priceFeed.decimals();
    const latestRound = await priceFeed.latestRoundData();
    
    console.log("Price Feed Decimals:", decimals);
    console.log("最新價格:", ethers.formatUnits(latestRound.answer, decimals), "LINK/BNB");
    console.log("更新時間:", new Date(Number(latestRound.updatedAt) * 1000).toISOString());
    
    // 計算 1 LINK = ? BNB
    const linkPriceInBnb = Number(latestRound.answer) / (10 ** Number(decimals));
    console.log(`1 LINK = ${linkPriceInBnb.toFixed(6)} BNB`);
    
  } catch (error) {
    console.log("❌ Price Feed 讀取失敗:", error.message);
  }
  
  // 4. 分析問題
  console.log("\n" + "=".repeat(60));
  console.log("💡 問題分析");
  console.log("=".repeat(60));
  
  console.log("\n可能的原因：");
  console.log("1. calculateRequestPriceNative 返回 0 可能是因為：");
  console.log("   - Price Feed 沒有正確配置");
  console.log("   - Wrapper 合約的 subscription 餘額不足");
  console.log("   - 函數內部邏輯問題");
  
  console.log("\n2. 建議解決方案：");
  console.log("   A. 使用固定費用（不依賴 calculateRequestPriceNative）");
  console.log("   B. 使用 estimateRequestPriceNative（如果可用）");
  console.log("   C. 直接使用較高的固定費用確保足夠");
  
  // 5. 提供修復建議
  console.log("\n5. 修復建議");
  console.log("─".repeat(60));
  
  console.log("\n方案 A：修改 VRF Manager 合約");
  console.log("```solidity");
  console.log("// 不使用 calculateRequestPriceNative");
  console.log("// 直接使用配置的固定費用");
  console.log("function requestRandomness(...) {");
  console.log("    uint256 totalFee = vrfRequestPrice + platformFee;");
  console.log("    require(msg.value >= totalFee, 'Insufficient fee');");
  console.log("    ");
  console.log("    // 發送足夠的 BNB 給 Wrapper");
  console.log("    (requestId, ) = requestRandomnessPayInNative{value: vrfRequestPrice}(");
  console.log("        callbackGasLimit,");
  console.log("        requestConfirmations,");
  console.log("        numWords,");
  console.log("        extraArgs");
  console.log("    );");
  console.log("}");
  console.log("```");
  
  console.log("\n方案 B：設置足夠高的固定費用");
  console.log("- 設置 vrfRequestPrice = 0.002 BNB");
  console.log("- 設置 platformFee = 0.0001 BNB");
  console.log("- 總計每個 NFT: 0.0021 BNB");
  
  console.log("\n方案 C：使用 LINK 代幣支付（需要改動較大）");
  console.log("- 改用 requestRandomness 而非 requestRandomnessPayInNative");
  console.log("- 需要持有 LINK 代幣");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
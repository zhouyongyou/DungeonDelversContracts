const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 診斷 VRF 請求失敗原因 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // VRF 相關地址
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const vrfWrapperAddress = "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94"; // BSC VRF V2.5 Wrapper
  
  console.log("📍 地址檢查：");
  console.log("─".repeat(50));
  console.log("VRF Manager:", vrfManagerAddress);
  console.log("VRF Wrapper (Chainlink):", vrfWrapperAddress);
  
  // 1. 檢查 VRF Wrapper 是否正常
  console.log("\n1. 檢查 Chainlink VRF Wrapper 狀態");
  console.log("─".repeat(50));
  
  const wrapperAbi = [
    "function calculateRequestPriceNative(uint32 _callbackGasLimit, uint32 _numWords) view returns (uint256)",
    "function lastRequestId() view returns (uint256)"
  ];
  
  const wrapper = new ethers.Contract(vrfWrapperAddress, wrapperAbi, provider);
  
  try {
    // 測試計算價格
    const price = await wrapper.calculateRequestPriceNative(500000, 1);
    console.log("✅ Wrapper 正常運行");
    console.log("   計算的價格 (500000 gas, 1 word):", ethers.formatEther(price), "BNB");
    
    const lastId = await wrapper.lastRequestId();
    console.log("   最後請求 ID:", lastId.toString());
  } catch (error) {
    console.log("❌ Wrapper 調用失敗:", error.message);
  }
  
  // 2. 檢查 VRF Manager 內部狀態
  console.log("\n2. 檢查 VRF Manager 內部調用");
  console.log("─".repeat(50));
  
  // 嘗試直接調用 calculateRequestPriceNative
  const vrfAbi = [
    "function callbackGasLimit() view returns (uint32)",
    "function getTotalFee() view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  
  try {
    const gasLimit = await vrfManager.callbackGasLimit();
    console.log("VRF Manager 回調 Gas 限制:", gasLimit.toString());
    
    // 直接計算預期價格
    const expectedPrice = await wrapper.calculateRequestPriceNative(gasLimit, 1);
    console.log("預期 VRF 價格:", ethers.formatEther(expectedPrice), "BNB");
    
    // 檢查 getTotalFee
    const totalFee = await vrfManager.getTotalFee();
    console.log("getTotalFee() 返回:", ethers.formatEther(totalFee), "BNB");
    
    if (totalFee < expectedPrice) {
      console.log("\n🔴 問題發現！");
      console.log("getTotalFee 返回的值小於實際 VRF 價格");
      console.log("這會導致 VRF 請求因費用不足而失敗");
    }
  } catch (error) {
    console.log("❌ 檢查失敗:", error.message);
  }
  
  // 3. 分析失敗原因
  console.log("\n" + "=".repeat(60));
  console.log("💡 診斷結果");
  console.log("=".repeat(60));
  
  console.log("\n可能的失敗原因：");
  console.log("1. ❌ calculateRequestPriceNative 在 VRF Manager 內部調用失敗");
  console.log("   - 可能是 interface 定義問題");
  console.log("   - 可能是 gas 估算問題");
  
  console.log("\n2. ❌ 費用不足");
  console.log("   - vrfRequestPrice 設置的固定值可能太低");
  console.log("   - 實際 Chainlink 費用可能更高");
  
  console.log("\n建議解決方案：");
  console.log("─".repeat(50));
  
  console.log("\n方案 A：增加 VRF 請求價格");
  console.log("```javascript");
  console.log("// 設置更高的 VRF 請求價格");
  console.log("await vrfManager.setVrfRequestPrice(ethers.parseEther('0.001'));");
  console.log("```");
  
  console.log("\n方案 B：修改合約，使用固定費用");
  console.log("```solidity");
  console.log("// 不調用 calculateRequestPriceNative");
  console.log("// 直接使用配置的 vrfRequestPrice");
  console.log("uint256 totalFee = vrfRequestPrice + platformFee;");
  console.log("```");
  
  console.log("\n方案 C：前端直接與 Hero 合約交互");
  console.log("```javascript");
  console.log("// 計算正確的費用");
  console.log("const vrfFee = ethers.parseEther('0.001'); // 較高的固定費用");
  console.log("const totalFee = vrfFee.mul(quantity);");
  console.log("await hero.mintFromWallet(quantity, { value: totalFee });");
  console.log("```");
  
  // 4. 測試更高的費用
  console.log("\n4. 測試建議費用");
  console.log("─".repeat(50));
  
  const suggestedVrfPrice = ethers.parseEther("0.001"); // 0.001 BNB
  const suggestedPlatformFee = ethers.parseEther("0.0001"); // 0.0001 BNB
  const suggestedTotal = suggestedVrfPrice + suggestedPlatformFee;
  
  console.log("建議的費用設置：");
  console.log("- VRF 請求價格: 0.001 BNB");
  console.log("- 平台費: 0.0001 BNB");
  console.log("- 總計每個 NFT: 0.0011 BNB");
  console.log("\n批量鑄造費用：");
  console.log("- 1 個: " + ethers.formatEther(suggestedTotal * BigInt(1)) + " BNB");
  console.log("- 5 個: " + ethers.formatEther(suggestedTotal * BigInt(5)) + " BNB");
  console.log("- 50 個: " + ethers.formatEther(suggestedTotal * BigInt(50)) + " BNB");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 診斷鑄造失敗問題 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 合約地址
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  
  console.log("📋 檢查項目：");
  console.log("─".repeat(60));
  
  // 1. 檢查 VRF Manager getTotalFee 函數
  console.log("\n1. 測試 VRF Manager getTotalFee()");
  const vrfAbi = [
    "function getTotalFee() view returns (uint256)",
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  
  try {
    const totalFee = await vrfManager.getTotalFee();
    console.log("   ✅ getTotalFee() 成功:", ethers.formatEther(totalFee), "BNB");
  } catch (error) {
    console.log("   ❌ getTotalFee() 失敗:", error.message);
    console.log("\n   🔴 問題發現：getTotalFee() 函數調用失敗！");
    console.log("   可能原因：calculateRequestPriceNative 調用失敗");
    
    // 嘗試直接獲取費用
    console.log("\n   備選方案：直接讀取費用");
    try {
      const vrfPrice = await vrfManager.vrfRequestPrice();
      const platformFeeVrf = await vrfManager.platformFee();
      const totalManual = vrfPrice + platformFeeVrf;
      console.log("   - vrfRequestPrice:", ethers.formatEther(vrfPrice), "BNB");
      console.log("   - platformFee:", ethers.formatEther(platformFeeVrf), "BNB");
      console.log("   - 手動計算總費用:", ethers.formatEther(totalManual), "BNB");
    } catch (e) {
      console.log("   ❌ 無法讀取費用:", e.message);
    }
  }
  
  // 2. 檢查 Hero 合約狀態
  console.log("\n2. 檢查 Hero 合約狀態");
  const heroAbi = [
    "function vrfManager() view returns (address)",
    "function platformFee() view returns (uint256)",
    "function paused() view returns (bool)"
  ];
  
  const hero = new ethers.Contract(heroAddress, heroAbi, provider);
  
  try {
    const heroVrfManager = await hero.vrfManager();
    const heroPlatformFee = await hero.platformFee();
    const isPaused = await hero.paused();
    
    console.log("   - VRF Manager:", heroVrfManager);
    console.log("   - 是否正確:", heroVrfManager === vrfManagerAddress ? "✅" : "❌");
    console.log("   - Hero 平台費:", ethers.formatEther(heroPlatformFee), "BNB");
    console.log("   - 合約暫停狀態:", isPaused ? "❌ 已暫停" : "✅ 運行中");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 3. 模擬交易
  console.log("\n3. 模擬 mintFromWallet 交易");
  
  // 計算需要的費用
  let requiredBNB = ethers.parseEther("0.005"); // 前端發送的金額
  
  console.log("   模擬參數:");
  console.log("   - 數量: 1");
  console.log("   - 發送 BNB:", ethers.formatEther(requiredBNB));
  
  // 嘗試直接計算正確費用
  try {
    const vrfPrice = await vrfManager.vrfRequestPrice();
    const platformFeeVrf = await vrfManager.platformFee();
    const heroPlatformFee = await hero.platformFee();
    
    const totalVrfFee = vrfPrice + platformFeeVrf;
    const totalRequired = totalVrfFee + heroPlatformFee;
    
    console.log("\n   費用分解:");
    console.log("   - VRF 費用:", ethers.formatEther(vrfPrice), "BNB");
    console.log("   - VRF 平台費:", ethers.formatEther(platformFeeVrf), "BNB");
    console.log("   - Hero 平台費:", ethers.formatEther(heroPlatformFee), "BNB");
    console.log("   - 總計需要:", ethers.formatEther(totalRequired), "BNB");
    
    if (requiredBNB < totalRequired) {
      console.log("\n   ❌ 費用不足！");
      console.log("   需要:", ethers.formatEther(totalRequired), "BNB");
      console.log("   提供:", ethers.formatEther(requiredBNB), "BNB");
    } else {
      console.log("\n   ✅ 費用足夠");
    }
  } catch (error) {
    console.log("   ❌ 計算失敗:", error.message);
  }
  
  // 4. 解決方案
  console.log("\n" + "=".repeat(60));
  console.log("💡 解決方案");
  console.log("=".repeat(60));
  
  console.log("\n方案 1：修復 getTotalFee() 函數");
  console.log("- 簡化 getTotalFee() 直接返回 vrfRequestPrice + platformFee");
  console.log("- 不要調用 calculateRequestPriceNative");
  
  console.log("\n方案 2：前端直接計算");
  console.log("- 前端調用 vrfRequestPrice() 和 platformFee()");
  console.log("- 手動計算總費用");
  console.log("- 確保發送足夠的 BNB");
  
  console.log("\n建議的前端代碼:");
  console.log("```javascript");
  console.log("const vrfPrice = await vrfManager.vrfRequestPrice();");
  console.log("const vrfPlatformFee = await vrfManager.platformFee();");
  console.log("const heroPlatformFee = await hero.platformFee();");
  console.log("const totalFee = vrfPrice.add(vrfPlatformFee).add(heroPlatformFee).mul(quantity);");
  console.log("await hero.mintFromWallet(quantity, { value: totalFee });");
  console.log("```");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
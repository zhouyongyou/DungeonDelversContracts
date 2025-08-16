const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 檢查 VRF 費用設置 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // 合約地址
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  
  // VRF Manager ABI
  const vrfAbi = [
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)",
    "function calculateTotalFee(uint256 quantity) view returns (uint256)"
  ];
  
  // Hero ABI
  const heroAbi = [
    "function mintPriceUSD() view returns (uint256)",
    "function calculateMintPrice(uint256 quantity) view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  const hero = new ethers.Contract(heroAddress, heroAbi, provider);
  
  console.log("📊 費用分析：");
  console.log("─".repeat(60));
  
  // 檢查 VRF 費用
  const vrfPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  
  console.log("VRF Manager 費用設置：");
  console.log("- VRF 請求價格:", ethers.formatEther(vrfPrice), "BNB");
  console.log("- 平台費:", ethers.formatEther(platformFee), "BNB");
  console.log("- 單次總費用:", ethers.formatEther(vrfPrice + platformFee), "BNB");
  
  // 檢查 Hero 鑄造價格
  console.log("\nHero NFT 價格：");
  const mintPriceUSD = await hero.mintPriceUSD();
  console.log("- 鑄造價格 (USD):", ethers.formatUnits(mintPriceUSD, 18), "USD");
  
  // 計算不同數量的費用
  console.log("\n💰 鑄造費用計算：");
  console.log("─".repeat(60));
  
  const quantities = [1, 5, 10, 50];
  
  for (const qty of quantities) {
    console.log(`\n鑄造 ${qty} 個 NFT：`);
    
    // VRF 費用計算
    const totalVrfFee = (vrfPrice + platformFee) * BigInt(qty);
    console.log("- VRF 總費用:", ethers.formatEther(totalVrfFee), "BNB");
    
    // Hero 鑄造費用
    try {
      const mintFee = await hero.calculateMintPrice(qty);
      console.log("- NFT 鑄造費:", ethers.formatEther(mintFee), "BNB");
      console.log("- 總計需要:", ethers.formatEther(mintFee + totalVrfFee), "BNB");
    } catch (error) {
      console.log("- NFT 鑄造費: 計算失敗");
    }
  }
  
  // 分析失敗交易
  console.log("\n❌ 失敗交易分析：");
  console.log("─".repeat(60));
  console.log("交易嘗試鑄造: 50 個 NFT");
  console.log("支付金額: 0.005 BNB");
  
  const requiredForFifty = (vrfPrice + platformFee) * BigInt(50);
  console.log("需要 VRF 費用:", ethers.formatEther(requiredForFifty), "BNB");
  
  if (requiredForFifty > ethers.parseEther("0.005")) {
    console.log("\n🔴 問題原因：支付的 0.005 BNB 不足以支付 VRF 費用！");
    console.log("建議：");
    console.log("1. 減少 VRF 請求價格");
    console.log("2. 或者前端需要計算正確的費用");
  }
  
  // 建議設置
  console.log("\n💡 建議的費用設置：");
  console.log("─".repeat(60));
  const suggestedVrfPrice = ethers.parseEther("0.0001"); // 0.0001 BNB per request
  const suggestedPlatformFee = ethers.parseEther("0.00005"); // 0.00005 BNB platform fee
  
  console.log("建議 VRF 請求價格: 0.0001 BNB");
  console.log("建議平台費: 0.00005 BNB");
  console.log("單次總費用: 0.00015 BNB");
  console.log("50 個 NFT 的 VRF 費用: " + ethers.formatEther((suggestedVrfPrice + suggestedPlatformFee) * BigInt(50)) + " BNB");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
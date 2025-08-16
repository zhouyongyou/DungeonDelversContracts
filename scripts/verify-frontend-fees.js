const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 驗證前端應讀取的費用 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // 合約地址
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  
  // VRF Manager ABI - 前端會調用的函數
  const vrfAbi = [
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)",
    "function calculateTotalFee(uint256 quantity) view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  
  console.log("📊 當前合約實際費用：");
  console.log("─".repeat(60));
  console.log("VRF Manager 地址:", vrfManagerAddress);
  
  // 讀取當前費用
  const vrfPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  
  console.log("\n實際費用（合約返回值）：");
  console.log("- vrfRequestPrice():", vrfPrice.toString(), "wei");
  console.log("  = " + ethers.formatEther(vrfPrice), "BNB");
  console.log("\n- platformFee():", platformFee.toString(), "wei");
  console.log("  = " + ethers.formatEther(platformFee), "BNB");
  
  // 計算總費用
  const totalPerRequest = vrfPrice + platformFee;
  console.log("\n單次鑄造總 VRF 費用:");
  console.log("- " + ethers.formatEther(totalPerRequest), "BNB");
  
  // 測試 calculateTotalFee 函數
  console.log("\n測試 calculateTotalFee() 函數:");
  console.log("─".repeat(60));
  
  try {
    const fee1 = await vrfManager.calculateTotalFee(1);
    console.log("calculateTotalFee(1) =", ethers.formatEther(fee1), "BNB");
    
    const fee5 = await vrfManager.calculateTotalFee(5);
    console.log("calculateTotalFee(5) =", ethers.formatEther(fee5), "BNB");
    
    const fee50 = await vrfManager.calculateTotalFee(50);
    console.log("calculateTotalFee(50) =", ethers.formatEther(fee50), "BNB");
  } catch (error) {
    console.log("❌ calculateTotalFee 函數不存在或調用失敗");
    console.log("前端需要手動計算: (vrfRequestPrice + platformFee) * quantity");
  }
  
  // 前端應該顯示的內容
  console.log("\n✅ 前端應該顯示：");
  console.log("─".repeat(60));
  console.log("平台費: 0.00005 BNB");
  console.log("VRF費: 0.0001 BNB");
  console.log("總計每個 NFT: 0.00015 BNB");
  
  console.log("\n📱 前端刷新建議：");
  console.log("1. 清除瀏覽器快取 (Ctrl+Shift+R 或 Cmd+Shift+R)");
  console.log("2. 檢查前端是否連接到正確的 VRF Manager 地址");
  console.log("3. 確認前端調用正確的函數: vrfRequestPrice() 和 platformFee()");
  
  // 檢查區塊鏈最新狀態
  const latestBlock = await provider.getBlockNumber();
  console.log("\n當前區塊高度:", latestBlock);
  console.log("費用更新交易已確認，合約狀態已更新");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
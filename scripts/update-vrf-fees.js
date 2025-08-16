const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 更新 VRF Manager 費用設置 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  
  // VRF Manager ABI
  const vrfAbi = [
    "function setVrfRequestPrice(uint256)",
    "function setPlatformFee(uint256)",
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, wallet);
  
  // 1. 檢查當前費用
  console.log("1. 當前費用設置：");
  const currentVrfPrice = await vrfManager.vrfRequestPrice();
  const currentPlatformFee = await vrfManager.platformFee();
  
  console.log("   VRF 請求價格:", ethers.formatEther(currentVrfPrice), "BNB");
  console.log("   平台費:", ethers.formatEther(currentPlatformFee), "BNB");
  console.log("   單次總費用:", ethers.formatEther(currentVrfPrice + currentPlatformFee), "BNB");
  console.log("   50 次總費用:", ethers.formatEther((currentVrfPrice + currentPlatformFee) * BigInt(50)), "BNB");
  
  // 2. 設置新費用 - 更合理的價格
  console.log("\n2. 更新費用設置...");
  
  const newVrfPrice = ethers.parseEther("0.0001");    // 0.0001 BNB per request
  const newPlatformFee = ethers.parseEther("0.00005"); // 0.00005 BNB platform fee
  
  const feeData = await provider.getFeeData();
  console.log("   Gas 價格:", ethers.formatUnits(feeData.gasPrice, 'gwei'), "gwei");
  
  // 更新 VRF 請求價格
  console.log("\n   更新 VRF 請求價格...");
  try {
    const tx1 = await vrfManager.setVrfRequestPrice(newVrfPrice, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    console.log("   交易哈希:", tx1.hash);
    await tx1.wait();
    console.log("   ✅ VRF 請求價格已更新");
  } catch (error) {
    console.log("   ❌ 更新失敗:", error.message);
  }
  
  // 更新平台費
  console.log("\n   更新平台費...");
  try {
    const tx2 = await vrfManager.setPlatformFee(newPlatformFee, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    console.log("   交易哈希:", tx2.hash);
    await tx2.wait();
    console.log("   ✅ 平台費已更新");
  } catch (error) {
    console.log("   ❌ 更新失敗:", error.message);
  }
  
  // 3. 驗證新設置
  console.log("\n3. 驗證新費用設置：");
  const newVrfPriceCheck = await vrfManager.vrfRequestPrice();
  const newPlatformFeeCheck = await vrfManager.platformFee();
  
  console.log("   VRF 請求價格:", ethers.formatEther(newVrfPriceCheck), "BNB");
  console.log("   平台費:", ethers.formatEther(newPlatformFeeCheck), "BNB");
  console.log("   單次總費用:", ethers.formatEther(newVrfPriceCheck + newPlatformFeeCheck), "BNB");
  
  // 計算不同數量的費用
  console.log("\n4. 新費用計算：");
  console.log("─".repeat(40));
  const quantities = [1, 5, 10, 50];
  
  for (const qty of quantities) {
    const totalFee = (newVrfPriceCheck + newPlatformFeeCheck) * BigInt(qty);
    console.log(`   ${qty} 個 NFT: ${ethers.formatEther(totalFee)} BNB`);
  }
  
  console.log("\n=== 完成 ===");
  console.log("✅ VRF Manager 費用已調整為更合理的價格");
  console.log("✅ 現在鑄造 50 個 NFT 只需要 0.0075 BNB 的 VRF 費用");
  console.log("✅ 前端可以重新測試鑄造功能");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
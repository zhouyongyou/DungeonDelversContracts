const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 檢查 NFT 鑄造需求 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 合約地址
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  const oracleAddress = "0x67989939163bCFC57302767722E1988FFac46d64";
  
  // 讀取 ABI
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const hero = new ethers.Contract(heroAddress, heroJson.abi, wallet);
  
  const vrfPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const vrfJson = JSON.parse(fs.readFileSync(vrfPath, 'utf8'));
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfJson.abi, provider);
  
  console.log("📊 檢查價格設置");
  console.log("─".repeat(50));
  
  // 獲取 USD 價格
  const mintPriceUSD = await hero.mintPriceUSD();
  console.log("mintPriceUSD:", mintPriceUSD.toString());
  console.log("格式化 USD:", ethers.formatUnits(mintPriceUSD, 6), "USD");
  
  // 檢查 VRF Manager 地址
  const currentVRF = await hero.vrfManager();
  console.log("\nVRF Manager 設置:");
  console.log("當前:", currentVRF);
  console.log("預期:", vrfManagerAddress);
  console.log("匹配:", currentVRF.toLowerCase() === vrfManagerAddress.toLowerCase());
  
  // 檢查 VRF 費用
  console.log("\n📊 VRF 費用");
  console.log("─".repeat(50));
  
  // 嘗試從 Hero 合約獲取 VRF 費用
  try {
    const vrfPrice = await hero.vrfRequestPrice();
    console.log("Hero.vrfRequestPrice():", ethers.formatEther(vrfPrice), "BNB");
  } catch (e) {
    console.log("Hero 沒有 vrfRequestPrice 函數");
  }
  
  // 從 VRF Manager 獲取費用
  const vrfFee = await vrfManager.fee();
  const platformFee = await vrfManager.platformFee();
  console.log("VRFManager.fee():", ethers.formatEther(vrfFee), "BNB");
  console.log("VRFManager.platformFee():", ethers.formatEther(platformFee), "BNB");
  
  // 計算總費用
  console.log("\n📊 計算總費用（1 個 NFT）");
  console.log("─".repeat(50));
  
  // 獲取 BNB 價格
  try {
    const oracleAbi = [
      "function getUSDPriceInWei(uint256 usdAmount) view returns (uint256)",
      "function getBNBPrice() view returns (uint256)"
    ];
    const oracle = new ethers.Contract(oracleAddress, oracleAbi, provider);
    
    // 獲取 BNB 價格
    const bnbPrice = await oracle.getBNBPrice();
    console.log("BNB 價格:", ethers.formatUnits(bnbPrice, 6), "USD");
    
    // 計算 NFT 的 BNB 價格
    const mintPriceBNB = await oracle.getUSDPriceInWei(mintPriceUSD);
    console.log("NFT 價格 (BNB):", ethers.formatEther(mintPriceBNB), "BNB");
    
    // 總費用
    const totalVRFFee = vrfFee + platformFee;
    const totalCost = mintPriceBNB + totalVRFFee;
    
    console.log("\n💰 費用明細：");
    console.log("NFT 價格:", ethers.formatEther(mintPriceBNB), "BNB");
    console.log("VRF 費用:", ethers.formatEther(totalVRFFee), "BNB");
    console.log("─".repeat(30));
    console.log("總計:", ethers.formatEther(totalCost), "BNB");
    
    // 測試靜態調用
    console.log("\n🧪 測試靜態調用 mintFromWallet");
    console.log("─".repeat(50));
    
    try {
      await hero.mintFromWallet.staticCall(1, {
        value: totalCost
      });
      console.log("✅ 靜態調用成功，費用正確");
      console.log("建議發送:", ethers.formatEther(totalCost), "BNB");
    } catch (error) {
      console.log("❌ 靜態調用失敗:", error.message);
      
      // 嘗試更高的費用
      const higherCost = totalCost * 2n;
      try {
        await hero.mintFromWallet.staticCall(1, {
          value: higherCost
        });
        console.log("✅ 使用更高費用成功:", ethers.formatEther(higherCost), "BNB");
      } catch (e) {
        console.log("❌ 即使加倍費用也失敗");
        console.log("錯誤:", e.message);
      }
    }
    
  } catch (error) {
    console.log("❌ Oracle 錯誤:", error.message);
  }
  
  // 檢查合約狀態
  console.log("\n📊 合約狀態");
  console.log("─".repeat(50));
  
  const isPaused = await hero.paused();
  console.log("合約暫停:", isPaused);
  
  const totalSupply = await hero.totalSupply();
  console.log("總供應量:", totalSupply.toString());
  
  const userBalance = await hero.balanceOf(wallet.address);
  console.log("用戶餘額:", userBalance.toString(), "個 NFT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
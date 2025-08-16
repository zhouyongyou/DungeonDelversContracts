const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 測試批量鑄造 50 個 NFT ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const heroAddress = "0x575e7407C06ADeb47067AD19663af50DdAe460CF";
  const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"; // 使用已測試成功的
  
  // 讀取 ABI
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const hero = new ethers.Contract(heroAddress, heroJson.abi, wallet);
  
  const vrfPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const vrfJson = JSON.parse(fs.readFileSync(vrfPath, 'utf8'));
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfJson.abi, wallet);
  
  console.log("📊 配置檢查");
  console.log("─".repeat(60));
  console.log("Hero 合約:", heroAddress);
  console.log("VRF Manager:", vrfManagerAddress);
  
  // 檢查 VRF Manager 設置
  const currentVRF = await hero.vrfManager();
  if (currentVRF.toLowerCase() !== vrfManagerAddress.toLowerCase()) {
    console.log("❌ VRF Manager 不匹配，需要更新");
    console.log("當前:", currentVRF);
    console.log("預期:", vrfManagerAddress);
    return;
  }
  console.log("✅ VRF Manager 設置正確");
  
  // 計算費用
  console.log("\n💰 費用計算（50 個 NFT）");
  console.log("─".repeat(60));
  
  const quantity = 50;
  const vrfFee = await vrfManager.fee();
  const mintPriceUSD = await hero.mintPriceUSD();
  
  console.log("NFT 價格:", ethers.formatUnits(mintPriceUSD, 18), "USD/個");
  console.log("VRF 費用:", ethers.formatEther(vrfFee), "BNB/個");
  
  // 計算總費用
  // NFT: 2 USD × 50 = 100 USD ≈ 0.2 BNB (假設 1 BNB = 500 USD)
  // VRF: 0.0001 BNB × 50 = 0.005 BNB
  const estimatedNFTCost = ethers.parseEther("0.2");  // 100 USD
  const totalVRFCost = vrfFee * BigInt(quantity);     // 0.005 BNB
  const totalCost = estimatedNFTCost + totalVRFCost;  // 0.205 BNB
  
  console.log("\n費用明細：");
  console.log("NFT 費用 (100 USD):", ethers.formatEther(estimatedNFTCost), "BNB");
  console.log("VRF 費用 (50個):", ethers.formatEther(totalVRFCost), "BNB");
  console.log("─".repeat(30));
  console.log("總計:", ethers.formatEther(totalCost), "BNB");
  
  console.log("\n⚠️ 前端應該發送:", ethers.formatEther(totalCost), "BNB");
  console.log("而不是 0.005 BNB（那只是 VRF 費用）");
  
  // 測試鑄造
  console.log("\n🎲 開始批量鑄造");
  console.log("─".repeat(60));
  
  try {
    console.log("發送交易...");
    const tx = await hero.mintFromWallet(quantity, {
      value: totalCost,
      gasLimit: 1000000
    });
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 鑄造請求已發送");
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 等待 VRF 回調
    console.log("\n⏳ 等待 VRF 回調（50 個隨機數）...");
    console.log("預計等待 10-30 秒...");
    
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      
      const vrfResult = await vrfManager.getRandomForUser(wallet.address);
      if (vrfResult.fulfilled) {
        console.log("\n🎉 VRF 回調成功！");
        console.log("收到", vrfResult.randomWords.length, "個隨機數");
        
        const balance = await hero.balanceOf(wallet.address);
        console.log("Hero NFT 餘額:", balance.toString());
        break;
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`已等待 ${(i + 1) * 2} 秒...`);
      }
    }
    
  } catch (error) {
    console.log("❌ 鑄造失敗:", error.message);
    
    // 分析錯誤
    if (error.message.includes("Insufficient payment")) {
      console.log("\n問題：支付不足");
      console.log("解決：需要發送約 0.205 BNB，而不是 0.005 BNB");
    } else if (error.message.includes("execution reverted")) {
      console.log("\n可能的問題：");
      console.log("1. Oracle 無法計算 BNB 價格");
      console.log("2. 發送的 BNB 不足");
      console.log("3. 合約暫停");
      
      // 嘗試更高費用
      console.log("\n嘗試固定費用 0.25 BNB...");
      try {
        const fixedCost = ethers.parseEther("0.25");
        const tx2 = await hero.mintFromWallet(quantity, {
          value: fixedCost,
          gasLimit: 1000000
        });
        console.log("✅ 使用 0.25 BNB 成功");
        console.log("交易:", tx2.hash);
      } catch (e) {
        console.log("❌ 仍然失敗");
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 前端配置總結：");
  console.log("─".repeat(60));
  console.log("VRF Manager 地址:", vrfManagerAddress);
  console.log("VRF 費用/NFT: 0.0001 BNB");
  console.log("50 個 NFT 的 VRF 費用: 0.005 BNB");
  console.log("50 個 NFT 的總費用: ~0.205 BNB（包含 NFT 價格）");
  console.log("\n請更新前端使用這些值！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
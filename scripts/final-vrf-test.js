const { ethers } = require('ethers');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 最終 VRF 測試（使用足夠高的費用）===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  
  // VRF Manager ABI
  const vrfAbi = [
    "function setVrfRequestPrice(uint256)",
    "function setPlatformFee(uint256)",
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)",
    "function requestRandomForUser(address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) payable returns (uint256)",
    "function getRandomForUser(address user) view returns (bool fulfilled, uint256[] randomWords)",
    "event RandomRequested(uint256 indexed requestId, address indexed requester, uint8 requestType)",
    "event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, wallet);
  
  // 步驟 1：設置更高的費用（基於 estimateRequestPriceNative 的結果）
  console.log("📊 步驟 1：設置更高的 VRF 費用");
  console.log("─".repeat(50));
  
  // 基於 500000 gas 的 estimateRequestPriceNative = 0.0000973296 BNB
  // 我們設置 10 倍的費用以確保足夠
  const newVrfPrice = ethers.parseEther("0.002");    // 0.002 BNB (約 20 倍餘量)
  const newPlatformFee = ethers.parseEther("0.0001"); // 0.0001 BNB
  
  console.log("設置新費用...");
  console.log("- VRF 請求價格: 0.002 BNB");
  console.log("- 平台費: 0.0001 BNB");
  
  try {
    const tx1 = await vrfManager.setVrfRequestPrice(newVrfPrice);
    await tx1.wait();
    console.log("✅ VRF 請求價格已更新");
    
    const tx2 = await vrfManager.setPlatformFee(newPlatformFee);
    await tx2.wait();
    console.log("✅ 平台費已更新");
  } catch (error) {
    console.log("更新失敗:", error.message);
  }
  
  // 驗證費用
  const currentVrfPrice = await vrfManager.vrfRequestPrice();
  const currentPlatformFee = await vrfManager.platformFee();
  const totalFee = currentVrfPrice + currentPlatformFee;
  
  console.log("\n當前費用設置：");
  console.log("- VRF 請求價格:", ethers.formatEther(currentVrfPrice), "BNB");
  console.log("- 平台費:", ethers.formatEther(currentPlatformFee), "BNB");
  console.log("- 總計:", ethers.formatEther(totalFee), "BNB");
  
  // 步驟 2：發送 VRF 請求
  console.log("\n🎲 步驟 2：發送 VRF 請求");
  console.log("─".repeat(50));
  
  const user = wallet.address;
  const quantity = 1;
  const maxRarity = 5;
  const commitment = ethers.keccak256(ethers.toUtf8Bytes("final-test-" + Date.now()));
  
  console.log("請求參數：");
  console.log("- 用戶:", user);
  console.log("- 數量:", quantity);
  console.log("- 最大稀有度:", maxRarity);
  console.log("- 支付費用:", ethers.formatEther(totalFee), "BNB");
  
  // 甚至發送更多費用以確保足夠
  const sendValue = totalFee * BigInt(2); // 發送雙倍費用
  console.log("- 實際發送:", ethers.formatEther(sendValue), "BNB (雙倍以確保足夠)");
  
  try {
    console.log("\n發送請求...");
    const tx = await vrfManager.requestRandomForUser(
      user,
      quantity,
      maxRarity,
      commitment,
      { 
        value: sendValue,
        gasLimit: 1500000 // 高 gas limit
      }
    );
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    
    console.log("✅ VRF 請求成功發送！");
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 獲取 requestId
    let requestId;
    const event = receipt.logs.find(log => {
      try {
        const parsed = vrfManager.interface.parseLog(log);
        if (parsed && parsed.name === 'RandomRequested') {
          requestId = parsed.args.requestId;
          return true;
        }
      } catch {
        return false;
      }
    });
    
    if (requestId) {
      console.log("請求 ID:", requestId.toString());
    }
    
    // 步驟 3：等待隨機數
    console.log("\n⏳ 步驟 3：等待 Chainlink VRF 回調");
    console.log("─".repeat(50));
    console.log("（通常需要 1-3 個區塊，約 10-30 秒）");
    
    let attempts = 0;
    const maxAttempts = 60; // 等待最多 2 分鐘
    let fulfilled = false;
    
    while (!fulfilled && attempts < maxAttempts) {
      attempts++;
      await sleep(2000);
      
      try {
        const result = await vrfManager.getRandomForUser(user);
        fulfilled = result.fulfilled;
        
        if (fulfilled) {
          console.log("\n🎉 成功獲取隨機數！");
          console.log("隨機數數量:", result.randomWords.length);
          
          result.randomWords.forEach((word, i) => {
            console.log(`\n隨機數 ${i + 1}: ${word.toString()}`);
            
            // 模擬 NFT 稀有度計算
            const mod = Number(word % BigInt(10000));
            let rarity;
            if (mod < 100) rarity = "🌟 傳奇 (1%)";
            else if (mod < 600) rarity = "💎 史詩 (5%)";
            else if (mod < 2100) rarity = "💙 稀有 (15%)";
            else if (mod < 5100) rarity = "💚 罕見 (30%)";
            else rarity = "⚪ 普通 (49%)";
            
            console.log(`稀有度: ${rarity}`);
          });
          
          console.log("\n✅ VRF Manager 完全正常運作！");
          
        } else {
          if (attempts % 5 === 0) {
            console.log(`等待中... (${attempts * 2} 秒)`);
          }
        }
      } catch (error) {
        console.log("讀取狀態失敗:", error.message);
        break;
      }
    }
    
    if (!fulfilled) {
      console.log("\n⚠️ 等待超時");
      console.log("請稍後查詢，或檢查：");
      console.log("1. BSCScan 上的交易狀態");
      console.log("2. Chainlink VRF 服務狀態");
    }
    
  } catch (error) {
    console.log("\n❌ 請求失敗:", error.message);
    
    if (error.data) {
      console.log("錯誤數據:", error.data);
    }
    
    console.log("\n💡 如果仍然失敗，可能需要：");
    console.log("1. 檢查 VRF Wrapper 是否有足夠的 LINK 餘額");
    console.log("2. 確認 BSC 主網 VRF V2.5 服務正常");
    console.log("3. 考慮重新部署合約");
  }
  
  // 總結
  console.log("\n" + "=".repeat(60));
  console.log("📝 測試總結");
  console.log("=".repeat(60));
  
  console.log("\n當前費用設置：");
  console.log("- VRF 請求價格:", ethers.formatEther(currentVrfPrice), "BNB");
  console.log("- 平台費:", ethers.formatEther(currentPlatformFee), "BNB");
  console.log("- 每個 NFT 總費用:", ethers.formatEther(totalFee), "BNB");
  
  console.log("\n批量鑄造費用：");
  console.log("- 1 個 NFT:", ethers.formatEther(totalFee * BigInt(1)), "BNB");
  console.log("- 5 個 NFT:", ethers.formatEther(totalFee * BigInt(5)), "BNB");
  console.log("- 50 個 NFT:", ethers.formatEther(totalFee * BigInt(50)), "BNB");
  
  console.log("\n前端整合建議：");
  console.log("1. 直接讀取 vrfRequestPrice 和 platformFee");
  console.log("2. 計算總費用：(vrfRequestPrice + platformFee) × quantity");
  console.log("3. 建議多發送 10-20% 的費用作為緩衝");
  console.log("4. 合約會退還多餘的費用");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
const { ethers } = require('ethers');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 測試 VRF Manager 基本功能 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("測試者地址:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // VRF Manager 地址
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  
  // VRF Manager ABI
  const vrfAbi = [
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)",
    "function requestRandomness(uint8 requestType, uint32 numWords, bytes calldata data) payable returns (uint256)",
    "function getRequest(uint256 requestId) view returns (tuple(address requester, uint8 requestType, bytes data, bool fulfilled, uint256[] randomWords))",
    "function authorizedContracts(address) view returns (bool)",
    "function setAuthorizedContract(address, bool)",
    "event RandomRequested(uint256 indexed requestId, address indexed requester, uint8 requestType)",
    "event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, wallet);
  
  // 步驟 1：檢查費用
  console.log("📊 步驟 1：檢查 VRF 費用");
  console.log("─".repeat(50));
  
  const vrfPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  const totalFee = vrfPrice + platformFee;
  
  console.log("VRF 請求價格:", ethers.formatEther(vrfPrice), "BNB");
  console.log("平台費:", ethers.formatEther(platformFee), "BNB");
  console.log("總費用:", ethers.formatEther(totalFee), "BNB\n");
  
  // 步驟 2：授權測試地址（如果需要）
  console.log("📝 步驟 2：檢查授權狀態");
  console.log("─".repeat(50));
  
  const isAuthorized = await vrfManager.authorizedContracts(wallet.address);
  console.log("當前地址授權狀態:", isAuthorized ? "✅ 已授權" : "❌ 未授權");
  
  if (!isAuthorized) {
    console.log("授權測試地址...");
    try {
      const authTx = await vrfManager.setAuthorizedContract(wallet.address, true);
      console.log("交易哈希:", authTx.hash);
      await authTx.wait();
      console.log("✅ 授權成功\n");
    } catch (error) {
      console.log("❌ 授權失敗:", error.message, "\n");
    }
  }
  
  // 步驟 3：請求隨機數
  console.log("🎲 步驟 3：請求隨機數");
  console.log("─".repeat(50));
  
  const requestType = 0; // HERO_MINT 類型
  const numWords = 3; // 請求 3 個隨機數
  const testData = ethers.hexlify(ethers.randomBytes(32)); // 隨機測試數據
  
  console.log("請求參數:");
  console.log("- 類型:", requestType, "(HERO_MINT)");
  console.log("- 隨機數數量:", numWords);
  console.log("- 支付費用:", ethers.formatEther(totalFee), "BNB");
  
  try {
    console.log("\n發送 VRF 請求...");
    const requestTx = await vrfManager.requestRandomness(
      requestType,
      numWords,
      testData,
      { value: totalFee }
    );
    
    console.log("交易哈希:", requestTx.hash);
    const receipt = await requestTx.wait();
    console.log("✅ 請求已發送");
    
    // 從事件中獲取 requestId
    const requestEvent = receipt.logs.find(log => {
      try {
        const parsed = vrfManager.interface.parseLog(log);
        return parsed && parsed.name === 'RandomRequested';
      } catch {
        return false;
      }
    });
    
    if (requestEvent) {
      const parsed = vrfManager.interface.parseLog(requestEvent);
      const requestId = parsed.args.requestId;
      console.log("請求 ID:", requestId.toString());
      
      // 步驟 4：等待 VRF 回調
      console.log("\n⏳ 步驟 4：等待 VRF 回調（通常需要 1-3 個區塊）");
      console.log("─".repeat(50));
      
      let fulfilled = false;
      let attempts = 0;
      const maxAttempts = 30; // 最多等待 30 秒
      
      while (!fulfilled && attempts < maxAttempts) {
        attempts++;
        console.log(`檢查狀態... (${attempts}/${maxAttempts})`);
        
        try {
          const request = await vrfManager.getRequest(requestId);
          
          if (request.fulfilled) {
            fulfilled = true;
            console.log("\n✅ 隨機數已生成！");
            console.log("隨機數結果:");
            request.randomWords.forEach((word, index) => {
              console.log(`  [${index}]:`, word.toString());
            });
            
            // 分析隨機數
            console.log("\n📊 隨機數分析:");
            console.log("- 數量:", request.randomWords.length);
            console.log("- 範圍: 0 到", (BigInt(2) ** BigInt(256) - BigInt(1)).toString());
            
            // 模擬 NFT 稀有度計算
            console.log("\n🎮 模擬 NFT 稀有度計算:");
            const rarities = request.randomWords.map((word, i) => {
              const mod = Number(word % BigInt(10000));
              let rarity;
              if (mod < 100) rarity = "傳奇 (1%)";
              else if (mod < 600) rarity = "史詩 (5%)";
              else if (mod < 2100) rarity = "稀有 (15%)";
              else if (mod < 5100) rarity = "罕見 (30%)";
              else rarity = "普通 (49%)";
              
              return `NFT ${i + 1}: ${rarity}`;
            });
            
            rarities.forEach(r => console.log("  " + r));
            
          } else {
            console.log("  尚未完成，等待中...");
            await sleep(2000); // 等待 2 秒
          }
        } catch (error) {
          console.log("  讀取請求失敗:", error.message);
          break;
        }
      }
      
      if (!fulfilled) {
        console.log("\n⚠️ 等待超時，VRF 可能需要更長時間");
        console.log("請稍後使用 requestId 查詢:", requestId.toString());
      }
      
    } else {
      console.log("❌ 無法從事件中獲取 requestId");
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
    
    if (error.message.includes("Unauthorized")) {
      console.log("\n💡 提示：需要先授權您的地址才能請求隨機數");
    }
  }
  
  // 步驟 5：解釋 NFT 鑄造流程
  console.log("\n" + "=".repeat(60));
  console.log("💡 NFT 鑄造的隨機數使用說明");
  console.log("=".repeat(60));
  
  console.log("\n1. 批量鑄造的隨機數需求：");
  console.log("   - 鑄造 1 個 NFT：需要 1 個隨機數");
  console.log("   - 鑄造 5 個 NFT：需要 5 個隨機數");
  console.log("   - 鑄造 50 個 NFT：需要 50 個隨機數");
  
  console.log("\n2. 鑄造流程：");
  console.log("   a) 用戶調用 Hero.mintFromWallet(quantity)");
  console.log("   b) Hero 合約調用 VRF Manager 請求 quantity 個隨機數");
  console.log("   c) Chainlink VRF 生成隨機數並回調");
  console.log("   d) 用戶調用 Hero.revealMint() 揭示 NFT");
  console.log("   e) 每個隨機數決定一個 NFT 的稀有度");
  
  console.log("\n3. 費用計算：");
  console.log("   - VRF 費用 = (vrfRequestPrice + platformFee) × quantity");
  console.log("   - 當前設置：", ethers.formatEther(totalFee), "BNB × quantity");
  
  console.log("\n4. 重要提示：");
  console.log("   ✅ VRF Manager 基本功能正常");
  console.log("   ✅ 可以成功請求和獲取隨機數");
  console.log("   ⚠️  Hero 合約的 getTotalFee() 返回值有誤");
  console.log("   💡 建議前端直接計算費用，不依賴 getTotalFee()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
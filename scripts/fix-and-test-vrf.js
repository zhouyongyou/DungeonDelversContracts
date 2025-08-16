const { ethers } = require('ethers');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 修復並測試 VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  
  // VRF Manager ABI
  const vrfAbi = [
    "function setVrfRequestPrice(uint256)",
    "function setPlatformFee(uint256)",
    "function vrfRequestPrice() view returns (uint256)",
    "function platformFee() view returns (uint256)",
    "function requestRandomForUser(address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) payable returns (uint256)",
    "function getRandomForUser(address user) view returns (bool fulfilled, uint256[] randomWords)",
    "function authorizedContracts(address) view returns (bool)",
    "event RandomRequested(uint256 indexed requestId, address indexed requester, uint8 requestType)",
    "event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, wallet);
  
  // 步驟 1：更新費用為更高的值
  console.log("📊 步驟 1：更新 VRF 費用設置");
  console.log("─".repeat(50));
  
  const newVrfPrice = ethers.parseEther("0.001");   // 0.001 BNB
  const newPlatformFee = ethers.parseEther("0.0001"); // 0.0001 BNB
  
  console.log("設置新費用...");
  console.log("- VRF 請求價格: 0.001 BNB");
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
  
  // 驗證新費用
  const currentVrfPrice = await vrfManager.vrfRequestPrice();
  const currentPlatformFee = await vrfManager.platformFee();
  const totalFee = currentVrfPrice + currentPlatformFee;
  
  console.log("\n當前費用設置：");
  console.log("- VRF 請求價格:", ethers.formatEther(currentVrfPrice), "BNB");
  console.log("- 平台費:", ethers.formatEther(currentPlatformFee), "BNB");
  console.log("- 總計:", ethers.formatEther(totalFee), "BNB");
  
  // 步驟 2：測試 VRF 請求
  console.log("\n🎲 步驟 2：測試 VRF 請求");
  console.log("─".repeat(50));
  
  const user = wallet.address;
  const quantity = 1;
  const maxRarity = 5;
  const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-" + Date.now()));
  
  console.log("請求參數：");
  console.log("- 用戶:", user);
  console.log("- 數量:", quantity);
  console.log("- 支付費用:", ethers.formatEther(totalFee), "BNB");
  
  try {
    console.log("\n發送請求...");
    const tx = await vrfManager.requestRandomForUser(
      user,
      quantity,
      maxRarity,
      commitment,
      { 
        value: totalFee,
        gasLimit: 1000000 // 增加 gas limit
      }
    );
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ VRF 請求成功！");
    
    // 獲取 requestId
    const event = receipt.logs.find(log => {
      try {
        const parsed = vrfManager.interface.parseLog(log);
        return parsed && parsed.name === 'RandomRequested';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = vrfManager.interface.parseLog(event);
      console.log("請求 ID:", parsed.args.requestId.toString());
    }
    
    // 步驟 3：等待隨機數
    console.log("\n⏳ 步驟 3：等待隨機數生成");
    console.log("─".repeat(50));
    
    let attempts = 0;
    const maxAttempts = 30;
    let fulfilled = false;
    
    while (!fulfilled && attempts < maxAttempts) {
      attempts++;
      await sleep(2000);
      
      const result = await vrfManager.getRandomForUser(user);
      fulfilled = result.fulfilled;
      
      if (fulfilled) {
        console.log("\n✅ 隨機數已生成！");
        console.log("隨機數數量:", result.randomWords.length);
        result.randomWords.forEach((word, i) => {
          console.log(`隨機數 ${i + 1}:`, word.toString());
        });
        
        console.log("\n🎉 VRF Manager 工作正常！");
      } else {
        console.log(`檢查 ${attempts}/${maxAttempts}...`);
      }
    }
    
    if (!fulfilled) {
      console.log("\n⚠️ 等待超時，但請求已成功發送");
      console.log("隨機數可能需要更長時間生成");
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
    
    console.log("\n💡 如果還是失敗，可能需要：");
    console.log("1. 進一步增加費用（例如 0.01 BNB）");
    console.log("2. 檢查 Chainlink VRF 服務狀態");
    console.log("3. 考慮重新部署合約");
  }
  
  // 總結
  console.log("\n" + "=".repeat(60));
  console.log("📝 測試結果總結");
  console.log("=".repeat(60));
  
  console.log("\n✅ 完成的設置：");
  console.log("- VRF 請求價格: 0.001 BNB");
  console.log("- 平台費: 0.0001 BNB");
  console.log("- 總費用: 0.0011 BNB per NFT");
  
  console.log("\n📱 前端應該使用的費用：");
  console.log("- 1 個 NFT: 0.0011 BNB");
  console.log("- 5 個 NFT: 0.0055 BNB");
  console.log("- 50 個 NFT: 0.055 BNB");
  
  console.log("\n⚠️ 重要提醒：");
  console.log("1. 前端需要更新費用計算邏輯");
  console.log("2. 不要依賴 getTotalFee() 函數");
  console.log("3. 直接讀取 vrfRequestPrice 和 platformFee 並計算");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
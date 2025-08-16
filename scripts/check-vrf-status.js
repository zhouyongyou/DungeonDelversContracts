const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 檢查 VRF 請求狀態 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contractAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  const requestId = "83423089268499286921780531338426264351373411583532615500527668777984677463724";
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfConsumer = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  console.log("合約地址:", contractAddress);
  console.log("請求 ID:", requestId);
  
  try {
    // 檢查請求狀態
    const result = await vrfConsumer.getRequestStatus(requestId);
    
    console.log("\n📊 請求狀態：");
    console.log("─".repeat(50));
    console.log("已完成:", result.fulfilled);
    
    if (result.fulfilled) {
      console.log("\n🎉 成功獲取隨機數！");
      console.log("隨機數數量:", result.randomWords.length);
      for (let i = 0; i < result.randomWords.length; i++) {
        console.log(`隨機數 ${i+1}:`, result.randomWords[i].toString());
      }
      console.log("\n✅ VRF V2.5 訂閱模式成功運行！");
      
      // 檢查用戶的最後請求
      const userResult = await vrfConsumer.getRandomForUser(wallet.address);
      console.log("\n用戶最後請求狀態:");
      console.log("已完成:", userResult.fulfilled);
      if (userResult.fulfilled) {
        console.log("隨機數:", userResult.randomWords[0].toString());
      }
      
    } else {
      console.log("⏳ 請求仍在處理中...");
      console.log("請稍後再試");
    }
    
    // 檢查訂閱餘額
    const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    const coordinatorAbi = [
      "function getSubscription(uint256 subId) view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] consumers)"
    ];
    const coordinator = new ethers.Contract(coordinatorAddress, coordinatorAbi, provider);
    
    const subId = await vrfConsumer.s_subscriptionId();
    const subscription = await coordinator.getSubscription(subId);
    
    console.log("\n📊 訂閱狀態：");
    console.log("─".repeat(50));
    console.log("LINK 餘額:", ethers.formatEther(subscription.balance), "LINK");
    console.log("BNB 餘額:", ethers.formatEther(subscription.nativeBalance), "BNB");
    console.log("總請求次數:", subscription.reqCount.toString());
    
    // 建議優化
    console.log("\n💡 費用優化建議：");
    console.log("─".repeat(50));
    console.log("當前 Callback Gas Limit: 500,000");
    console.log("建議降低到: 200,000 或 300,000");
    console.log("這樣可以減少最大費用預留");
    
  } catch (error) {
    console.log("❌ 錯誤:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
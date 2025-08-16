const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 診斷 VRF 訂閱問題 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const managerAddress = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  
  // 讀取 VRF Manager ABI
  const managerPath = 'artifacts/contracts/current/core/VRFSubscriptionManager.sol/VRFSubscriptionManager.json';
  const managerJson = JSON.parse(fs.readFileSync(managerPath, 'utf8'));
  const vrfManager = new ethers.Contract(managerAddress, managerJson.abi, wallet);
  
  // 讀取 Coordinator ABI
  const coordinatorAbi = [
    "function getSubscription(uint256 subId) view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] consumers)",
    "function pendingRequestExists(uint256 subId) view returns (bool)",
    "function s_subscriptions(uint256) view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner)"
  ];
  const coordinator = new ethers.Contract(coordinatorAddress, coordinatorAbi, provider);
  
  console.log("📊 VRF Manager 配置");
  console.log("─".repeat(50));
  
  try {
    const subId = await vrfManager.subId();
    const fee = await vrfManager.fee();
    const keyHash = await vrfManager.keyHash();
    const gasLimit = await vrfManager.callbackGasLimit();
    
    console.log("訂閱 ID:", subId.toString());
    console.log("費用:", ethers.formatEther(fee), "BNB");
    console.log("Key Hash:", keyHash);
    console.log("Gas Limit:", gasLimit.toString());
    
    // 檢查訂閱詳情
    console.log("\n📊 訂閱詳情（從 Coordinator）");
    console.log("─".repeat(50));
    
    try {
      const subscription = await coordinator.getSubscription(subId);
      console.log("LINK 餘額:", ethers.formatEther(subscription.balance), "LINK");
      console.log("BNB 餘額:", ethers.formatEther(subscription.nativeBalance), "BNB");
      console.log("請求次數:", subscription.reqCount.toString());
      console.log("擁有者:", subscription.owner);
      console.log("Consumers 數量:", subscription.consumers.length);
      
      if (subscription.consumers.length > 0) {
        console.log("\nConsumers 列表:");
        for (const consumer of subscription.consumers) {
          console.log("  -", consumer);
          if (consumer.toLowerCase() === managerAddress.toLowerCase()) {
            console.log("    ✅ VRF Manager 已添加為 Consumer");
          }
        }
      }
      
      // 檢查是否有未完成的請求
      const hasPending = await coordinator.pendingRequestExists(subId);
      console.log("\n有未完成的請求:", hasPending);
      
    } catch (error) {
      console.log("❌ 無法獲取訂閱詳情:", error.message);
    }
    
    // 測試簡單調用
    console.log("\n🧪 測試 VRF 請求（模擬）");
    console.log("─".repeat(50));
    
    try {
      // 先用 staticCall 測試
      console.log("執行靜態調用測試...");
      const result = await vrfManager.requestRandomness.staticCall(1, {
        value: fee
      });
      console.log("✅ 靜態調用成功，預期 requestId:", result.toString());
    } catch (error) {
      console.log("❌ 靜態調用失敗:", error.message);
      
      // 嘗試解析錯誤
      if (error.message.includes("Subscription not set")) {
        console.log("問題：訂閱 ID 未設置");
      } else if (error.message.includes("Insufficient fee")) {
        console.log("問題：費用不足");
      } else if (error.message.includes("Not authorized")) {
        console.log("問題：調用者未授權");
      } else {
        console.log("未知錯誤，可能是 Coordinator 端的問題");
      }
    }
    
    // 檢查授權
    console.log("\n🔐 授權狀態");
    console.log("─".repeat(50));
    
    const isAuthorized = await vrfManager.authorized(wallet.address);
    console.log("測試地址已授權:", isAuthorized);
    
    const owner = await vrfManager.owner();
    console.log("合約擁有者:", owner);
    console.log("當前操作者:", wallet.address);
    console.log("是擁有者:", owner.toLowerCase() === wallet.address.toLowerCase());
    
  } catch (error) {
    console.log("❌ 錯誤:", error.message);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("診斷完成");
  console.log("\n可能的解決方案：");
  console.log("1. 確認訂閱 ID 正確");
  console.log("2. 確認 Consumer 已添加");
  console.log("3. 檢查訂閱餘額是否充足");
  console.log("4. 確認 Key Hash 和 Coordinator 地址匹配");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
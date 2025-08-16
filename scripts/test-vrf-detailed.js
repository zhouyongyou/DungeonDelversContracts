const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 詳細測試 VRF 請求 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const managerAddress = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFSubscriptionManager.sol/VRFSubscriptionManager.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfManager = new ethers.Contract(managerAddress, contractJson.abi, wallet);
  
  console.log("📊 合約狀態檢查");
  console.log("─".repeat(50));
  
  const subId = await vrfManager.subId();
  const fee = await vrfManager.fee();
  const keyHash = await vrfManager.keyHash();
  const gasLimit = await vrfManager.callbackGasLimit();
  const confirmations = await vrfManager.requestConfirmations();
  const coordinator = await vrfManager.vrfCoordinator();
  
  console.log("VRF Coordinator:", coordinator);
  console.log("訂閱 ID:", subId.toString());
  console.log("Key Hash:", keyHash);
  console.log("Callback Gas Limit:", gasLimit.toString());
  console.log("Confirmations:", confirmations.toString());
  console.log("費用:", ethers.formatEther(fee), "BNB");
  
  // 檢查餘額
  const balance = await provider.getBalance(wallet.address);
  console.log("\n錢包 BNB 餘額:", ethers.formatEther(balance), "BNB");
  
  if (balance < fee) {
    console.log("❌ BNB 餘額不足");
    return;
  }
  
  // 嘗試不同的調用方式
  console.log("\n🧪 測試請求方式 1：requestRandomness");
  console.log("─".repeat(50));
  
  try {
    // 增加 gas limit 和費用
    const increasedFee = ethers.parseEther("0.001"); // 增加到 0.001 BNB
    
    console.log("發送請求（增加費用到 0.001 BNB）...");
    const tx = await vrfManager.requestRandomness(1, {
      value: increasedFee,
      gasLimit: 1000000,
      gasPrice: ethers.parseUnits("5", "gwei") // 使用標準 gas price
    });
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 請求成功！");
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 從事件獲取 requestId
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
      
      // 等待回調
      console.log("\n⏳ 等待 Chainlink 回調...");
      let attempts = 0;
      while (attempts < 30) {
        attempts++;
        await sleep(2000);
        
        const result = await vrfManager.getRandomForUser(wallet.address);
        if (result.fulfilled) {
          console.log("✅ 收到隨機數:", result.randomWords[0].toString());
          break;
        }
        
        if (attempts % 5 === 0) {
          console.log(`等待中... (${attempts * 2} 秒)`);
        }
      }
    }
    
  } catch (error) {
    console.log("❌ 請求失敗");
    
    // 詳細分析錯誤
    if (error.receipt) {
      console.log("交易已被打包但執行失敗");
      console.log("交易哈希:", error.receipt.hash);
      console.log("區塊號:", error.receipt.blockNumber);
      console.log("Gas 使用:", error.receipt.gasUsed.toString());
      console.log("狀態:", error.receipt.status === 0 ? "失敗" : "成功");
    }
    
    // 嘗試解碼錯誤
    if (error.data) {
      try {
        const decodedError = vrfManager.interface.parseError(error.data);
        console.log("解碼的錯誤:", decodedError);
      } catch {
        console.log("無法解碼錯誤數據");
      }
    }
    
    console.log("\n錯誤詳情:", error.message);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("測試完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
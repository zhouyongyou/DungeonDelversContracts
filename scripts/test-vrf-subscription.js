const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 測試 VRF 訂閱管理器 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 讀取部署信息
  const deploymentInfo = JSON.parse(fs.readFileSync('vrf-subscription-deployment.json', 'utf8'));
  const managerAddress = deploymentInfo.VRFSubscriptionManager;
  
  console.log("VRF Manager:", managerAddress);
  console.log("操作者:", wallet.address);
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFSubscriptionManager.sol/VRFSubscriptionManager.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  const vrfManager = new ethers.Contract(managerAddress, contractJson.abi, wallet);
  
  // 檢查配置
  console.log("\n📊 檢查配置");
  console.log("─".repeat(50));
  
  const subId = await vrfManager.subId();
  const fee = await vrfManager.fee();
  const keyHash = await vrfManager.keyHash();
  
  console.log("訂閱 ID:", subId.toString());
  console.log("費用:", ethers.formatEther(fee), "BNB");
  console.log("Key Hash:", keyHash);
  
  // 檢查授權
  const isAuthorized = await vrfManager.authorized(wallet.address);
  console.log("測試地址已授權:", isAuthorized);
  
  if (!isAuthorized) {
    console.log("❌ 測試地址未授權");
    return;
  }
  
  // 請求隨機數
  console.log("\n🎲 請求隨機數");
  console.log("─".repeat(50));
  
  try {
    console.log("發送請求（1 個隨機數）...");
    const tx = await vrfManager.requestRandomness(1, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 請求成功！");
    
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
      const requestId = parsed.args.requestId;
      console.log("請求 ID:", requestId.toString());
      
      // 等待結果
      console.log("\n⏳ 等待 Chainlink 回調（約 20-60 秒）...");
      
      let attempts = 0;
      const maxAttempts = 60;
      let fulfilled = false;
      
      while (!fulfilled && attempts < maxAttempts) {
        attempts++;
        await sleep(2000);
        
        const result = await vrfManager.getRandomForUser(wallet.address);
        fulfilled = result.fulfilled;
        
        if (fulfilled) {
          console.log("\n🎉 成功獲取隨機數！");
          console.log("隨機數:", result.randomWords[0].toString());
          console.log("\n✅ VRF 訂閱模式測試成功！");
          
          // 顯示請求詳情
          const request = await vrfManager.getRequest(requestId);
          console.log("\n📋 請求詳情：");
          console.log("用戶:", request.user);
          console.log("已完成:", request.fulfilled);
          console.log("隨機數數量:", request.randomWords.length);
        } else {
          if (attempts % 5 === 0) {
            console.log(`等待中... (${attempts * 2} 秒)`);
          }
        }
      }
      
      if (!fulfilled) {
        console.log("\n⚠️ 等待超時（2 分鐘）");
        console.log("可能的原因：");
        console.log("1. 合約未添加為 Consumer");
        console.log("2. 訂閱餘額不足");
        console.log("3. 網絡延遲");
        console.log("\n請檢查：https://vrf.chain.link/bsc/" + deploymentInfo.subscriptionId);
      }
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
    
    if (error.message.includes("Subscription not set")) {
      console.log("\n需要設置訂閱 ID");
    } else if (error.message.includes("Insufficient fee")) {
      console.log("\n費用不足");
    } else {
      console.log("\n可能的原因：");
      console.log("1. 合約未添加為 Consumer");
      console.log("2. 訂閱餘額不足");
      console.log("3. 請先在 Chainlink 網站添加合約為 Consumer：");
      console.log("   https://vrf.chain.link/bsc/" + deploymentInfo.subscriptionId);
    }
  }
  
  // 測試批量請求
  console.log("\n🎲 測試批量請求（5 個隨機數）");
  console.log("─".repeat(50));
  
  try {
    console.log("發送批量請求...");
    const tx2 = await vrfManager.requestRandomForUser(
      wallet.address,
      5,  // quantity
      0,  // maxRarity (not used)
      ethers.zeroPadValue("0x", 32),  // commitment (not used)
      {
        value: ethers.parseEther("0.0005"), // 0.0001 * 5
        gasLimit: 600000
      }
    );
    
    console.log("交易哈希:", tx2.hash);
    await tx2.wait();
    console.log("✅ 批量請求成功！");
    
    console.log("\n等待結果（約 20-60 秒）...");
    
    let attempts2 = 0;
    let fulfilled2 = false;
    
    while (!fulfilled2 && attempts2 < 60) {
      attempts2++;
      await sleep(2000);
      
      const result = await vrfManager.getRandomForUser(wallet.address);
      fulfilled2 = result.fulfilled;
      
      if (fulfilled2) {
        console.log("\n🎉 成功獲取批量隨機數！");
        console.log("隨機數數量:", result.randomWords.length);
        for (let i = 0; i < result.randomWords.length; i++) {
          console.log(`隨機數 ${i+1}:`, result.randomWords[i].toString());
        }
      }
    }
    
  } catch (error) {
    console.log("❌ 批量請求失敗:", error.message);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("測試完成");
  console.log("VRF Manager:", managerAddress);
  console.log("BSCScan:", `https://bscscan.com/address/${managerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
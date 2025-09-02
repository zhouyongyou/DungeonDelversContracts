const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 測試 VRF V2.5 訂閱模式 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // 新的 VRF V2.5 合約地址
  const contractAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
  console.log("VRF V2Plus 合約:", contractAddress);
  console.log("操作者:", wallet.address);
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfConsumer = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  // 檢查配置
  console.log("\n📊 合約配置");
  console.log("─".repeat(50));
  
  const subId = await vrfConsumer.s_subscriptionId();
  const keyHash = await vrfConsumer.keyHash();
  const fee = await vrfConsumer.fee();
  const gasLimit = await vrfConsumer.callbackGasLimit();
  
  console.log("訂閱 ID:", subId.toString());
  console.log("Key Hash:", keyHash);
  console.log("費用:", ethers.formatEther(fee), "BNB");
  console.log("Callback Gas Limit:", gasLimit.toString());
  
  // 檢查授權
  const isAuthorized = await vrfConsumer.authorized(wallet.address);
  console.log("測試地址已授權:", isAuthorized);
  
  if (!isAuthorized) {
    console.log("❌ 測試地址未授權");
    return;
  }
  
  // 測試請求隨機數（使用 BNB 支付）
  console.log("\n🎲 測試請求隨機數（BNB 支付）");
  console.log("─".repeat(50));
  
  try {
    console.log("發送請求...");
    
    // 使用 BNB 支付（enableNativePayment = true）
    const tx = await vrfConsumer.requestRandomWords(
      true,  // enableNativePayment
      {
        value: fee,
        gasLimit: 500000
      }
    );
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 請求發送成功！");
    console.log("Gas 使用:", receipt.gasUsed.toString());
    
    // 從事件獲取 requestId
    let requestId;
    for (const log of receipt.logs) {
      try {
        const parsed = vrfConsumer.interface.parseLog(log);
        if (parsed && parsed.name === 'RequestSent') {
          requestId = parsed.args.requestId;
          console.log("請求 ID:", requestId.toString());
          break;
        }
      } catch {}
    }
    
    if (requestId) {
      // 等待結果
      console.log("\n⏳ 等待 Chainlink 回調（通常 20-60 秒）...");
      
      let attempts = 0;
      const maxAttempts = 60;  // 最多等待 2 分鐘
      
      while (attempts < maxAttempts) {
        attempts++;
        await sleep(2000);
        
        try {
          const result = await vrfConsumer.getRequestStatus(requestId);
          
          if (result.fulfilled) {
            console.log("\n🎉 成功獲取隨機數！");
            console.log("隨機數數量:", result.randomWords.length);
            for (let i = 0; i < result.randomWords.length; i++) {
              console.log(`隨機數 ${i+1}:`, result.randomWords[i].toString());
            }
            console.log("\n✅ VRF V2.5 訂閱模式測試成功！");
            break;
          }
        } catch {}
        
        if (attempts % 5 === 0) {
          console.log(`等待中... (${attempts * 2} 秒)`);
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log("\n⚠️ 等待超時（2 分鐘）");
        console.log("可能需要更多時間，稍後可以再查詢");
      }
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
    
    if (error.message.includes("InvalidConsumer")) {
      console.log("\n原因：合約未添加為 Consumer");
      console.log("請先添加 Consumer：");
      console.log("https://vrf.chain.link/bsc/88422796721004450630713121079263696788635490871993157345476848872165866246915");
      console.log("合約地址:", contractAddress);
    } else {
      console.log("\n其他錯誤，請檢查：");
      console.log("1. Consumer 是否已添加");
      console.log("2. 訂閱餘額是否充足");
    }
  }
  
  // 測試用戶請求（模擬 NFT 鑄造）
  console.log("\n🎲 測試批量請求（模擬 NFT 鑄造 - 3 個）");
  console.log("─".repeat(50));
  
  try {
    console.log("發送批量請求...");
    
    const tx2 = await vrfConsumer.requestRandomForUser(
      wallet.address,  // user
      3,               // quantity
      0,               // maxRarity (not used)
      ethers.zeroPadValue("0x", 32),  // commitment (not used)
      {
        value: ethers.parseEther("0.0003"),  // 0.0001 * 3
        gasLimit: 600000
      }
    );
    
    console.log("交易哈希:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("✅ 批量請求發送成功！");
    
    // 等待結果
    console.log("\n⏳ 等待批量結果...");
    
    let attempts2 = 0;
    while (attempts2 < 60) {
      attempts2++;
      await sleep(2000);
      
      const result = await vrfConsumer.getRandomForUser(wallet.address);
      
      if (result.fulfilled) {
        console.log("\n🎉 成功獲取批量隨機數！");
        console.log("隨機數數量:", result.randomWords.length);
        for (let i = 0; i < result.randomWords.length; i++) {
          console.log(`NFT ${i+1} 隨機數:`, result.randomWords[i].toString());
        }
        break;
      }
      
      if (attempts2 % 5 === 0) {
        console.log(`等待中... (${attempts2 * 2} 秒)`);
      }
    }
    
  } catch (error) {
    console.log("❌ 批量請求失敗:", error.message);
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("測試完成");
  console.log("\n📊 總結：");
  console.log("VRF V2Plus 合約:", contractAddress);
  console.log("BSCScan:", `https://bscscan.com/address/${contractAddress}`);
  console.log("\n如果測試成功，下一步：");
  console.log("1. 更新 NFT 合約的 VRF Manager 地址");
  console.log("2. 測試 NFT 鑄造流程");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
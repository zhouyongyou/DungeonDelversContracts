const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== 簡單 VRF 測試（優化後）===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contractAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfConsumer = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  console.log("合約:", contractAddress);
  const gasLimit = await vrfConsumer.callbackGasLimit();
  console.log("Gas Limit:", gasLimit.toString());
  
  console.log("\n🎲 發送新請求（使用 BNB）");
  console.log("─".repeat(50));
  
  try {
    const fee = await vrfConsumer.fee();
    console.log("費用:", ethers.formatEther(fee), "BNB");
    
    const tx = await vrfConsumer.requestRandomWords(
      true,  // 使用 BNB
      {
        value: fee,
        gasLimit: 300000
      }
    );
    
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ 請求已發送");
    
    // 獲取 requestId
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
      console.log("\n⏳ 等待回調（最多 2 分鐘）...");
      
      for (let i = 0; i < 60; i++) {
        await sleep(2000);
        
        try {
          const result = await vrfConsumer.getRequestStatus(requestId);
          if (result.fulfilled) {
            console.log("\n🎉 成功！");
            console.log("隨機數:", result.randomWords[0].toString());
            
            // 檢查訂閱狀態
            const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
            const coordinatorAbi = [
              "function getSubscription(uint256 subId) view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] consumers)"
            ];
            const coordinator = new ethers.Contract(coordinatorAddress, coordinatorAbi, provider);
            const subId = await vrfConsumer.s_subscriptionId();
            const subscription = await coordinator.getSubscription(subId);
            
            console.log("\n📊 訂閱狀態更新：");
            console.log("總請求次數:", subscription.reqCount.toString());
            console.log("剩餘 LINK:", ethers.formatEther(subscription.balance));
            console.log("剩餘 BNB:", ethers.formatEther(subscription.nativeBalance));
            
            return;
          }
        } catch {}
        
        if ((i + 1) % 10 === 0) {
          console.log(`等待 ${(i + 1) * 2} 秒...`);
        }
      }
      
      console.log("\n⚠️ 超時");
      console.log("請檢查：https://vrf.chain.link/bsc/114131353280130458891383141995968474440293173552039681622016393393251650814328");
    }
    
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
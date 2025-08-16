const hre = require("hardhat");

// V25 地址
const CONTRACTS = {
  HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
  RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
  VRF_MANAGER: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
};

async function testVRFMint() {
  console.log("🧪 開始測試 VRF 鑄造功能...\n");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("📱 測試帳號:", signer.address);
  
  // 檢查 VRF 訂閱狀態
  console.log("\n1️⃣ 檢查 VRF 設置");
  console.log("-------------------------------------");
  const vrfManager = await hre.ethers.getContractAt("VRFConsumerV2Plus", CONTRACTS.VRF_MANAGER);
  
  try {
    const subscriptionId = await vrfManager.s_subscriptionId();
    console.log("✅ VRF 訂閱 ID:", subscriptionId.toString());
    console.log("✅ VRF Manager 地址:", CONTRACTS.VRF_MANAGER);
  } catch (error) {
    console.log("❌ 無法讀取 VRF 訂閱狀態");
  }
  
  // 測試 Hero 鑄造
  console.log("\n2️⃣ 測試 Hero VRF 鑄造");
  console.log("-------------------------------------");
  
  try {
    const hero = await hre.ethers.getContractAt("Hero", CONTRACTS.HERO);
    
    // 檢查 VRF Manager 設置
    const heroVrfManager = await hero.vrfManager();
    console.log("Hero VRF Manager:", heroVrfManager);
    
    if (heroVrfManager.toLowerCase() !== CONTRACTS.VRF_MANAGER.toLowerCase()) {
      console.log("❌ Hero VRF Manager 設置錯誤!");
      return;
    }
    
    // 檢查鑄造價格
    const mintPriceUSD = await hero.mintPriceUSD();
    console.log("鑄造價格 (USD):", hre.ethers.formatUnits(mintPriceUSD, 6), "USD");
    
    // 獲取 BNB 價格
    const mintPriceBNB = await hero.getMintPriceInBNB();
    console.log("鑄造價格 (BNB):", hre.ethers.formatEther(mintPriceBNB), "BNB");
    
    // 檢查餘額
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("帳號餘額:", hre.ethers.formatEther(balance), "BNB");
    
    if (balance < mintPriceBNB) {
      console.log("❌ BNB 餘額不足!");
      return;
    }
    
    // 執行鑄造
    console.log("\n🎲 發送 VRF 鑄造請求...");
    const tx = await hero.mintBatchWithVRF(1, { value: mintPriceBNB });
    console.log("交易 Hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ 交易確認!");
    
    // 查找 VRF 請求事件
    const vrfRequestTopic = hre.ethers.id("VRFRequestSent(uint256,address,uint256,uint8,bytes32)");
    const vrfLogs = receipt.logs.filter(log => log.topics[0] === vrfRequestTopic);
    
    if (vrfLogs.length > 0) {
      const requestId = vrfLogs[0].topics[1];
      console.log("✅ VRF 請求 ID:", requestId);
      console.log("\n⏳ 等待 Chainlink VRF 回調 (約 2-3 個區塊)...");
      console.log("   可以在這裡查看: https://vrf.chain.link/bsc/29062");
      
      // 等待 VRF 回調
      let fulfilled = false;
      let attempts = 0;
      const maxAttempts = 30; // 最多等待 30 秒
      
      while (!fulfilled && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        // 檢查是否已完成
        try {
          const requestData = await vrfManager.requestIdToUser(requestId);
          if (requestData && requestData !== "0x0000000000000000000000000000000000000000") {
            // 檢查是否有新的 NFT
            const balance = await hero.balanceOf(signer.address);
            console.log("✅ VRF 回調完成! 當前 Hero 數量:", balance.toString());
            fulfilled = true;
          }
        } catch (e) {
          // 繼續等待
        }
        
        if (!fulfilled && attempts % 5 === 0) {
          console.log(`   仍在等待... (${attempts * 2} 秒)`);
        }
      }
      
      if (!fulfilled) {
        console.log("⚠️  VRF 回調超時，請稍後在鏈上查看結果");
      }
    } else {
      console.log("⚠️  未找到 VRF 請求事件");
    }
    
  } catch (error) {
    console.log("❌ Hero 鑄造失敗:", error.message);
  }
  
  // 測試 Relic 鑄造
  console.log("\n3️⃣ 測試 Relic VRF 鑄造");
  console.log("-------------------------------------");
  
  try {
    const relic = await hre.ethers.getContractAt("Relic", CONTRACTS.RELIC);
    
    // 檢查 VRF Manager 設置
    const relicVrfManager = await relic.vrfManager();
    console.log("Relic VRF Manager:", relicVrfManager);
    
    if (relicVrfManager.toLowerCase() !== CONTRACTS.VRF_MANAGER.toLowerCase()) {
      console.log("❌ Relic VRF Manager 設置錯誤!");
      return;
    }
    
    // 檢查 SoulShard 餘額
    const soulShard = await hre.ethers.getContractAt("IERC20", CONTRACTS.SOULSHARD);
    const soulShardBalance = await soulShard.balanceOf(signer.address);
    console.log("SoulShard 餘額:", hre.ethers.formatEther(soulShardBalance));
    
    const relicMintPrice = await relic.mintPriceSoulShard();
    console.log("Relic 鑄造價格:", hre.ethers.formatEther(relicMintPrice), "SoulShard");
    
    if (soulShardBalance >= relicMintPrice) {
      // 先授權
      console.log("授權 SoulShard...");
      const approveTx = await soulShard.approve(CONTRACTS.RELIC, relicMintPrice);
      await approveTx.wait();
      
      // 執行鑄造
      console.log("🎲 發送 Relic VRF 鑄造請求...");
      const tx = await relic.mintWithSoulShardVRF(1);
      console.log("交易 Hash:", tx.hash);
      await tx.wait();
      console.log("✅ Relic VRF 請求已發送!");
    } else {
      console.log("⚠️  SoulShard 餘額不足，跳過 Relic 測試");
    }
    
  } catch (error) {
    console.log("❌ Relic 測試失敗:", error.message);
  }
}

async function main() {
  console.log("=====================================");
  console.log("       VRF 鑄造功能測試");
  console.log("=====================================");
  console.log("版本: V25");
  console.log("網絡: BSC Mainnet");
  console.log("VRF 訂閱 ID: 29062");
  console.log("=====================================\n");
  
  await testVRFMint();
  
  console.log("\n=====================================");
  console.log("測試完成！");
  console.log("=====================================");
  console.log("\n提醒事項：");
  console.log("1. VRF 回調需要 2-3 個區塊時間");
  console.log("2. 可在 BSCScan 查看交易詳情");
  console.log("3. 可在 Chainlink VRF 網站查看請求狀態");
  console.log("   https://vrf.chain.link/bsc/29062");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
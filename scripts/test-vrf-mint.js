const hre = require("hardhat");

async function main() {
  console.log("🧪 測試 VRF 鑄造功能...\n");
  
  // 配置（需要更新）
  const HERO_ADDRESS = "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d";
  const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const VRF_CONSUMER_ADDRESS = process.env.VRF_CONSUMER_ADDRESS || "YOUR_VRF_CONSUMER_ADDRESS";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("🔑 測試帳號:", signer.address);
  
  // 連接合約
  const hero = await hre.ethers.getContractAt("Hero", HERO_ADDRESS);
  const soulShard = await hre.ethers.getContractAt("IERC20", SOULSHARD_ADDRESS);
  const vrfConsumer = await hre.ethers.getContractAt("VRFConsumerV2Plus", VRF_CONSUMER_ADDRESS);
  
  // 檢查設置
  console.log("\n📊 檢查設置：");
  const vrfManager = await hero.vrfManager();
  console.log("Hero VRF Manager:", vrfManager);
  console.log("預期 VRF Consumer:", VRF_CONSUMER_ADDRESS);
  console.log("VRF Manager 設置正確:", vrfManager.toLowerCase() === VRF_CONSUMER_ADDRESS.toLowerCase() ? "✅" : "❌");
  
  const isAuthorized = await vrfConsumer.authorized(HERO_ADDRESS);
  console.log("Hero 已授權使用 VRF:", isAuthorized ? "✅" : "❌");
  
  // 檢查餘額
  console.log("\n💰 檢查餘額：");
  const soulBalance = await soulShard.balanceOf(signer.address);
  console.log("SoulShard 餘額:", hre.ethers.formatEther(soulBalance));
  
  const platformFee = await hero.platformFee();
  console.log("平台費用:", hre.ethers.formatEther(platformFee), "BNB");
  
  const requiredSoul = await hero.getRequiredSoulShardAmount(1);
  console.log("需要 SoulShard:", hre.ethers.formatEther(requiredSoul));
  
  // 授權 SoulShard
  console.log("\n🔓 授權 SoulShard...");
  const approveTx = await soulShard.approve(HERO_ADDRESS, requiredSoul);
  await approveTx.wait();
  console.log("✅ SoulShard 授權成功");
  
  // 鑄造 NFT
  console.log("\n🎨 開始鑄造 1 個 Hero NFT...");
  try {
    const mintTx = await hero.mint(1, {
      value: platformFee,
      gasLimit: 500000
    });
    console.log("📤 交易已發送:", mintTx.hash);
    
    const receipt = await mintTx.wait();
    console.log("✅ 鑄造請求成功！");
    console.log("⛽ Gas 使用:", receipt.gasUsed.toString());
    
    // 監聽 VRF 事件
    console.log("\n⏳ 等待 VRF 回調...");
    
    // 監聽 VRF Consumer 的事件
    vrfConsumer.once("RequestSent", (requestId, numWords) => {
      console.log(`📡 VRF 請求已發送: ID=${requestId}, 數量=${numWords}`);
    });
    
    vrfConsumer.once("RequestFulfilled", async (requestId, randomWords) => {
      console.log(`✅ VRF 請求已完成: ID=${requestId}`);
      console.log(`🎲 隨機數: ${randomWords.join(", ")}`);
      
      // 檢查用戶的 commitment
      const commitment = await hero.userCommitments(signer.address);
      console.log("\n📦 用戶 Commitment 狀態:");
      console.log("  - 已完成:", commitment.fulfilled);
      console.log("  - 數量:", commitment.quantity.toString());
    });
    
    // 等待一段時間觀察事件
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待 30 秒
    
  } catch (error) {
    console.error("❌ 鑄造失敗:", error.message);
    if (error.data) {
      console.error("錯誤數據:", error.data);
    }
  }
  
  console.log("\n🏁 測試完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
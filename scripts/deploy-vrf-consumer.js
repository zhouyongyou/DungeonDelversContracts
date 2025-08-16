const hre = require("hardhat");

async function main() {
  console.log("🚀 部署 VRFConsumerV2Plus (純訂閱模式)...");
  
  // BSC Mainnet VRF V2.5 配置
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"; // 官方文檔地址
  const SUBSCRIPTION_ID = 29062; // 你的訂閱 ID
  
  // 獲取部署者
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者地址:", deployer.address);
  
  // 檢查餘額
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 BNB 餘額:", hre.ethers.formatEther(balance));
  
  // 部署合約
  const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
  console.log("📝 部署參數:");
  console.log("  - Subscription ID:", SUBSCRIPTION_ID);
  console.log("  - VRF Coordinator:", VRF_COORDINATOR);
  
  const vrfConsumer = await VRFConsumerV2Plus.deploy(
    SUBSCRIPTION_ID,
    VRF_COORDINATOR
  );

  await vrfConsumer.waitForDeployment();
  const address = await vrfConsumer.getAddress();
  
  console.log("✅ VRFConsumerV2Plus 部署成功！");
  console.log("📍 合約地址:", address);
  console.log("📊 訂閱 ID:", SUBSCRIPTION_ID);
  console.log("🔗 VRF Coordinator:", VRF_COORDINATOR);
  
  // 獲取 owner
  const owner = await vrfConsumer.owner();
  console.log("👤 合約 Owner:", owner);
  
  // 獲取配置
  const keyHash = await vrfConsumer.keyHash();
  const callbackGasLimit = await vrfConsumer.callbackGasLimit();
  const requestConfirmations = await vrfConsumer.requestConfirmations();
  
  console.log("\n⚙️ VRF 配置:");
  console.log("  - Key Hash:", keyHash);
  console.log("  - Callback Gas Limit:", callbackGasLimit.toString());
  console.log("  - Request Confirmations:", requestConfirmations.toString());
  
  // 等待區塊確認
  console.log("\n⏳ 等待 6 個區塊確認...");
  const deployTx = vrfConsumer.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(6);
    console.log("✅ 區塊確認完成");
  }
  
  // 驗證合約
  console.log("\n🔍 驗證合約...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [SUBSCRIPTION_ID, VRF_COORDINATOR],
    });
    console.log("✅ 合約驗證成功！");
  } catch (error) {
    console.log("⚠️ 驗證失敗:", error.message);
  }
  
  console.log("\n📋 下一步：");
  console.log("1. 在 https://vrf.chain.link/ 添加此合約為消費者");
  console.log("2. 確保訂閱有足夠的 LINK (建議 10+ LINK)");
  console.log("3. 運行授權腳本設置合約權限:");
  console.log(`   VRF_CONSUMER_ADDRESS=${address} npx hardhat run scripts/setup-vrf-authorization.js --network bsc`);
  
  // 保存地址到環境變數
  console.log("\n💾 請將以下內容添加到 .env 文件:");
  console.log(`VRF_CONSUMER_ADDRESS=${address}`);
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
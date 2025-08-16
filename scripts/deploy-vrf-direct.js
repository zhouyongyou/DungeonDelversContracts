const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 直接部署 VRFConsumerV2Plus...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  // 使用已知的工廠字節碼
  const contractFactory = await ethers.getContractFactory("VRFConsumerV2Plus");
  
  // 部署參數
  const SUBSCRIPTION_ID = 29062;
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  
  console.log("📝 構造參數:", SUBSCRIPTION_ID, VRF_COORDINATOR);
  
  try {
    // 直接部署
    const contract = await contractFactory.deploy(
      SUBSCRIPTION_ID,
      VRF_COORDINATOR
    );
    
    console.log("⏳ 等待部署交易...");
    console.log("📍 交易 Hash:", contract.deploymentTransaction()?.hash);
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log("✅ 部署成功\!");
    console.log("📍 合約地址:", address);
    
    // 保存地址
    console.log("\n💾 VRF_CONSUMER_ADDRESS=" + address);
    
  } catch (error) {
    console.error("❌ 部署失敗:", error);
    if (error.data) {
      console.error("錯誤數據:", error.data);
    }
    if (error.transaction) {
      console.error("交易數據:", error.transaction);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
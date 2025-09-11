// 測試 Hero 合約部署
const hre = require("hardhat");
const { ethers } = require("hardhat");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

async function main() {
  console.log("🧪 測試 Hero 合約部署");
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 部署者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  try {
    console.log("\n📦 獲取 Hero 合約工廠...");
    const HeroFactory = await ethers.getContractFactory("Hero", deployer);
    
    console.log("\n🚀 開始部署（使用固定 Gas 限制）...");
    
    // BSC 上的 Hero 合約部署通常需要約 4-5M Gas
    const gasLimit = 5000000n;
    console.log(`⛽ 使用 Gas 限制: ${gasLimit.toString()}`);
    console.log(`💰 估算成本: ${ethers.formatEther(gasLimit * GAS_PRICE)} BNB`);
    
    const hero = await HeroFactory.deploy({
      gasLimit: gasLimit,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ 部署交易: ${hero.deploymentTransaction().hash}`);
    
    await hero.waitForDeployment();
    const address = await hero.getAddress();
    
    console.log(`✅ Hero 部署成功: ${address}`);
    
  } catch (error) {
    console.error("❌ 部署失敗:", error.message);
    
    if (error.receipt) {
      console.error(`🔍 交易狀態: ${error.receipt.status}`);
      console.error(`🔍 Gas Used: ${error.receipt.gasUsed}`);
      console.error(`🔍 合約地址: ${error.receipt.contractAddress}`);
    }
    
    if (error.reason) {
      console.error(`🔍 失敗原因: ${error.reason}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 測試失敗:", error);
    process.exit(1);
  });
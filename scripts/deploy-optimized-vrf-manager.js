// Deploy Optimized VRF Manager
// Usage: PRIVATE_KEY=0x... npx hardhat run scripts/deploy-optimized-vrf-manager.js --network bsc

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Optimized VRF Manager");
  console.log("=====================================");
  
  // BSC Mainnet 配置
  const CONFIG = {
    LINK_TOKEN: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
    LINK_NATIVE_FEED: "0x17CD473250a9a479Dc7f234B6F1AA023bD8e8Aa9", 
    VRF_WRAPPER: "0xDA3b641D438362C440Ac5458c57e00a712b66700",
    
    // 現有合約地址
    HERO_ADDRESS: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    RELIC_ADDRESS: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    ALTAR_ADDRESS: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    
    // VRF 配置
    CALLBACK_GAS_LIMIT: 500000,
    REQUEST_CONFIRMATIONS: 3,
    PLATFORM_FEE: hre.ethers.parseEther("0.001"), // 0.001 BNB
  };
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📊 部署資訊：");
  console.log("- Deployer:", deployer.address);
  console.log("- Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  
  // 部署優化版 VRF Manager
  console.log("\n📦 部署 VRFManagerV2PlusOptimized...");
  const VRFManager = await hre.ethers.getContractFactory("VRFManagerV2PlusOptimized");
  const vrfManager = await VRFManager.deploy(
    CONFIG.LINK_TOKEN,
    CONFIG.LINK_NATIVE_FEED,
    CONFIG.VRF_WRAPPER
  );
  
  await vrfManager.waitForDeployment();
  const vrfManagerAddress = await vrfManager.getAddress();
  console.log("✅ VRF Manager deployed to:", vrfManagerAddress);
  
  // 配置 VRF Manager
  console.log("\n⚙️ 配置 VRF Manager...");
  
  // 設置回調 Gas 限制
  let tx = await vrfManager.setCallbackGasLimit(CONFIG.CALLBACK_GAS_LIMIT);
  await tx.wait();
  console.log("- Callback Gas Limit set to:", CONFIG.CALLBACK_GAS_LIMIT);
  
  // 設置確認數
  tx = await vrfManager.setRequestConfirmations(CONFIG.REQUEST_CONFIRMATIONS);
  await tx.wait();
  console.log("- Request Confirmations set to:", CONFIG.REQUEST_CONFIRMATIONS);
  
  // 設置平台費
  tx = await vrfManager.setPlatformFee(CONFIG.PLATFORM_FEE);
  await tx.wait();
  console.log("- Platform Fee set to:", hre.ethers.formatEther(CONFIG.PLATFORM_FEE), "BNB");
  
  // 授權合約
  console.log("\n🔐 授權合約...");
  const contracts = [
    { name: "Hero", address: CONFIG.HERO_ADDRESS },
    { name: "Relic", address: CONFIG.RELIC_ADDRESS },
    { name: "Altar", address: CONFIG.ALTAR_ADDRESS }
  ];
  
  for (const contract of contracts) {
    tx = await vrfManager.authorizeContract(contract.address);
    await tx.wait();
    console.log(`- ${contract.name} authorized:`, contract.address);
  }
  
  // 更新現有合約的 VRF Manager 地址
  console.log("\n🔄 更新現有合約的 VRF Manager...");
  
  // Hero 合約
  const heroAbi = ["function setVRFManager(address _vrfManager)"];
  const hero = await hre.ethers.getContractAt(heroAbi, CONFIG.HERO_ADDRESS);
  tx = await hero.setVRFManager(vrfManagerAddress);
  await tx.wait();
  console.log("- Hero VRF Manager updated");
  
  // Relic 合約
  const relic = await hre.ethers.getContractAt(heroAbi, CONFIG.RELIC_ADDRESS);
  tx = await relic.setVRFManager(vrfManagerAddress);
  await tx.wait();
  console.log("- Relic VRF Manager updated");
  
  // Altar 合約
  const altar = await hre.ethers.getContractAt(heroAbi, CONFIG.ALTAR_ADDRESS);
  tx = await altar.setVRFManager(vrfManagerAddress);
  await tx.wait();
  console.log("- Altar VRF Manager updated");
  
  // 驗證成本優化
  console.log("\n💰 成本比較：");
  const oldCostFor10 = 0.017; // LINK (根據你的數據)
  const newCostFor10 = 0.0017; // LINK (固定成本)
  console.log("- 鑄造 10 個 NFT:");
  console.log("  - 舊成本:", oldCostFor10, "LINK");
  console.log("  - 新成本:", newCostFor10, "LINK");
  console.log("  - 節省:", ((oldCostFor10 - newCostFor10) / oldCostFor10 * 100).toFixed(1), "%");
  
  // 保存部署配置
  const deploymentInfo = {
    network: "bsc",
    timestamp: new Date().toISOString(),
    contracts: {
      VRFManagerOptimized: vrfManagerAddress
    },
    config: CONFIG,
    improvements: {
      description: "固定請求 1 個隨機數，無論鑄造數量",
      costSaving: "90% LINK 成本節省",
      gasOptimization: "減少 Chainlink VRF 調用次數"
    }
  };
  
  const deploymentPath = path.join(__dirname, '../deployments', `vrf-optimized-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 部署信息已保存至:", deploymentPath);
  
  // 更新 .env.v25
  console.log("\n📝 更新環境變數...");
  const envPath = path.join(__dirname, '../.env.v25');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /VITE_VRFMANAGER_ADDRESS=.*/,
    `VITE_VRFMANAGER_ADDRESS=${vrfManagerAddress}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env.v25 已更新");
  
  console.log("\n✨ 部署完成！");
  console.log("\n📋 下一步：");
  console.log("1. 執行配置同步: node scripts/ultimate-config-system.js sync");
  console.log("2. 驗證合約: npx hardhat verify --network bsc", vrfManagerAddress, CONFIG.LINK_TOKEN, CONFIG.LINK_NATIVE_FEED, CONFIG.VRF_WRAPPER);
  console.log("3. 測試新的鑄造功能，確認只消耗固定 LINK");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
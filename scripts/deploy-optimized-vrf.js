const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 部署優化版 VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // BSC 主網 VRF V2.5 配置
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const subscriptionId = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
  
  console.log("📊 優化特性：");
  console.log("─".repeat(60));
  console.log("✅ 1 個隨機數可生成 1-100 個 NFT");
  console.log("✅ 節省 98% VRF 費用（50 NFT 只需 0.00005 BNB）");
  console.log("✅ 使用 keccak256 保證隨機性");
  
  // 編譯合約
  console.log("\n🔨 編譯 VRFConsumerV2PlusOptimized...");
  const { execSync } = require('child_process');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功");
  } catch (error) {
    console.log("❌ 編譯失敗");
    return;
  }
  
  // 讀取編譯後的合約
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2PlusOptimized.sol/VRFConsumerV2PlusOptimized.json';
  
  if (!fs.existsSync(contractPath)) {
    console.log("❌ 找不到編譯後的合約");
    return;
  }
  
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // 部署合約
  console.log("\n🚀 部署優化版 VRF Manager");
  console.log("─".repeat(60));
  
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  const contract = await factory.deploy(
    subscriptionId,
    coordinatorAddress,
    {
      gasLimit: 3000000
    }
  );
  
  console.log("交易哈希:", contract.deploymentTransaction().hash);
  console.log("等待確認...");
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("✅ 部署成功:", address);
  
  // 等待確認
  await contract.deploymentTransaction().wait(3);
  
  // 設置授權
  console.log("\n🔐 設置授權");
  console.log("─".repeat(60));
  
  const vrfOptimized = new ethers.Contract(address, contractJson.abi, wallet);
  
  // 授權 NFT 合約
  const contractsToAuthorize = [
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" },
    { name: "測試地址", address: wallet.address }
  ];
  
  for (const c of contractsToAuthorize) {
    console.log(`授權 ${c.name}...`);
    const tx = await vrfOptimized.setAuthorizedContract(c.address, true);
    await tx.wait();
    console.log(`✅ ${c.name} 已授權`);
  }
  
  // 設置費用
  console.log("\n💰 設置費用");
  const setFeeTx = await vrfOptimized.setFee(ethers.parseEther("0.0001"));
  await setFeeTx.wait();
  console.log("✅ 費用設置為 0.0001 BNB（固定，不管數量）");
  
  // 費用對比
  console.log("\n💰 費用對比（鑄造 50 個 NFT）：");
  console.log("─".repeat(60));
  console.log("舊版本: 50 × 0.00005 = 0.0025 BNB");
  console.log("優化版: 1 × 0.00005 = 0.00005 BNB");
  console.log("節省: 98% 🎉");
  
  // 重要提示
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  重要：接下來的步驟");
  console.log("=".repeat(60));
  
  console.log("\n📌 將合約添加為 Consumer：");
  console.log("1. 訪問: https://vrf.chain.link/bsc/" + subscriptionId);
  console.log("2. 點擊 'Add Consumer'");
  console.log("3. 輸入合約地址:", address);
  console.log("4. 確認添加");
  
  console.log("\n📋 後續步驟：");
  console.log("1. 添加 Consumer 完成後");
  console.log("2. 執行: node scripts/test-optimized-vrf.js");
  console.log("3. 更新 NFT 合約使用新的優化版 VRF Manager");
  
  // 保存部署信息
  const deploymentInfo = {
    VRFOptimized: address,
    coordinator: coordinatorAddress,
    subscriptionId: subscriptionId,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    features: {
      "單一請求生成多個": true,
      "費用節省": "98%",
      "最大批量": 100
    }
  };
  
  fs.writeFileSync(
    'vrf-optimized-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 部署信息已保存");
  console.log("合約地址:", address);
  console.log("BSCScan:", `https://bscscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
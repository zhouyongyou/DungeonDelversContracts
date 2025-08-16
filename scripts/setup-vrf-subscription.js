const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 設置 VRF V2.5 訂閱模式 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // BSC 主網 VRF V2.5 Coordinator (訂閱模式)
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  
  console.log("📋 步驟說明：");
  console.log("─".repeat(60));
  console.log("1. 訪問 https://vrf.chain.link/bsc");
  console.log("2. 連接錢包");
  console.log("3. 點擊 'Create Subscription'");
  console.log("4. 獲取 Subscription ID");
  console.log("5. 充值 LINK 到訂閱（建議至少 5 LINK）");
  console.log("6. 部署 VRFSubscriptionManager 合約");
  console.log("7. 將合約地址添加為 Consumer");
  
  console.log("\n📊 當前配置：");
  console.log("─".repeat(60));
  console.log("VRF Coordinator:", coordinatorAddress);
  console.log("Key Hash (200 gwei):", "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
  console.log("LINK Token:", "0x404460C6A5EdE2D891e8297795264fDe62ADBB75");
  
  // 編譯合約
  console.log("\n🔨 編譯 VRFSubscriptionManager...");
  const { execSync } = require('child_process');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功");
  } catch (error) {
    console.log("❌ 編譯失敗");
    return;
  }
  
  // 讀取編譯後的合約
  const fs = require('fs');
  const contractPath = 'artifacts/contracts/current/core/VRFSubscriptionManager.sol/VRFSubscriptionManager.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // 部署合約
  console.log("\n🚀 部署 VRFSubscriptionManager");
  console.log("─".repeat(60));
  
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  
  const contract = await factory.deploy(coordinatorAddress, {
    gasLimit: 3000000
  });
  
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
  
  const vrfManager = new ethers.Contract(address, contractJson.abi, wallet);
  
  // 授權 Hero, Relic, DungeonMaster, AltarOfAscension
  const contractsToAuthorize = [
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" },
    { name: "AltarOfAscension", address: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33" },
    { name: "測試地址", address: wallet.address }
  ];
  
  for (const c of contractsToAuthorize) {
    console.log(`授權 ${c.name}...`);
    const tx = await vrfManager.setAuthorizedContract(c.address, true);
    await tx.wait();
    console.log(`✅ ${c.name} 已授權`);
  }
  
  // 重要提示
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  重要：接下來的手動步驟");
  console.log("=".repeat(60));
  
  console.log("\n1️⃣ 創建訂閱（如果還沒有）：");
  console.log("   訪問: https://vrf.chain.link/bsc");
  console.log("   點擊: Create Subscription");
  console.log("   記錄: Subscription ID");
  
  console.log("\n2️⃣ 充值 LINK：");
  console.log("   在訂閱頁面點擊 'Add Funds'");
  console.log("   充值至少 5 LINK");
  
  console.log("\n3️⃣ 添加 Consumer：");
  console.log("   在訂閱頁面點擊 'Add Consumer'");
  console.log("   輸入合約地址:", address);
  console.log("   確認添加");
  
  console.log("\n4️⃣ 設置訂閱 ID：");
  console.log("   執行: node scripts/set-subscription-id.js [SUB_ID]");
  
  // 保存部署信息
  const deploymentInfo = {
    VRFSubscriptionManager: address,
    coordinator: coordinatorAddress,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    nextSteps: {
      1: "Create subscription at https://vrf.chain.link/bsc",
      2: "Fund subscription with LINK",
      3: `Add consumer: ${address}`,
      4: "Set subscription ID in contract"
    }
  };
  
  fs.writeFileSync(
    'vrf-subscription-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 部署信息已保存到 vrf-subscription-deployment.json");
  console.log("\n合約地址:", address);
  console.log("BSCScan:", `https://bscscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
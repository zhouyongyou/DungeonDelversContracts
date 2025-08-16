const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 部署 VRF 訂閱管理器（使用現有訂閱）===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // BSC 主網 VRF V2.5 訂閱模式配置
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const subscriptionId = "114131353280130458891383141995968474440293173552039681622016393393251650814328";
  
  console.log("📊 配置信息：");
  console.log("─".repeat(60));
  console.log("VRF Coordinator:", coordinatorAddress);
  console.log("訂閱 ID:", subscriptionId);
  console.log("Key Hash (200 gwei):", "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
  console.log("LINK Token:", "0x404460C6A5EdE2D891e8297795264fDe62ADBB75");
  console.log("\n訂閱餘額: 2.2 LINK, 0.04 BNB");
  
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
  
  // 設置訂閱 ID
  console.log("\n🔐 設置訂閱 ID");
  console.log("─".repeat(60));
  
  const vrfManager = new ethers.Contract(address, contractJson.abi, wallet);
  
  const setSubTx = await vrfManager.setSubscriptionId(subscriptionId);
  await setSubTx.wait();
  console.log("✅ 訂閱 ID 已設置");
  
  // 設置授權
  console.log("\n🔐 設置授權");
  console.log("─".repeat(60));
  
  // 授權 Hero, Relic, DungeonMaster, AltarOfAscension
  const contractsToAuthorize = [
    { name: "Hero", address: "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0" },
    { name: "Relic", address: "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366" },
    { name: "DungeonMaster", address: "0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703" },
    { name: "AltarOfAscension", address: "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3" },
    { name: "測試地址", address: wallet.address }
  ];
  
  for (const c of contractsToAuthorize) {
    console.log(`授權 ${c.name}...`);
    const tx = await vrfManager.setAuthorizedContract(c.address, true);
    await tx.wait();
    console.log(`✅ ${c.name} 已授權`);
  }
  
  // 設置費用
  console.log("\n💰 設置費用");
  const setFeeTx = await vrfManager.setFee(ethers.parseEther("0.0001")); // 0.0001 BNB
  await setFeeTx.wait();
  console.log("✅ 費用設置為 0.0001 BNB");
  
  // 重要提示
  console.log("\n" + "=".repeat(60));
  console.log("⚠️  重要：接下來的步驟");
  console.log("=".repeat(60));
  
  console.log("\n📌 將合約添加為 Consumer：");
  console.log("1. 訪問: https://vrf.chain.link/bsc/" + subscriptionId);
  console.log("2. 點擊 'Add Consumer'");
  console.log("3. 輸入合約地址:", address);
  console.log("4. 確認添加");
  
  console.log("\n📋 驗證步驟：");
  console.log("1. 等待添加 Consumer 完成");
  console.log("2. 執行: node scripts/test-vrf-subscription.js");
  
  // 保存部署信息
  const deploymentInfo = {
    VRFSubscriptionManager: address,
    coordinator: coordinatorAddress,
    subscriptionId: subscriptionId,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    authorizedContracts: contractsToAuthorize.map(c => c.address),
    fee: "0.0001 BNB",
    nextSteps: {
      1: `Add consumer at https://vrf.chain.link/bsc/${subscriptionId}`,
      2: `Consumer address: ${address}`,
      3: "Test with: node scripts/test-vrf-subscription.js"
    }
  };
  
  fs.writeFileSync(
    'vrf-subscription-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 部署信息已保存到 vrf-subscription-deployment.json");
  console.log("\n合約地址:", address);
  console.log("BSCScan:", `https://bscscan.com/address/${address}`);
  console.log("\n✅ 部署完成！請記得將合約添加為 Consumer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
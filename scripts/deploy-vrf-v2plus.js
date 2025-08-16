const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 部署正確的 VRF V2.5 合約 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // BSC 主網 VRF V2.5 配置
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const subscriptionId = "114131353280130458891383141995968474440293173552039681622016393393251650814328";
  
  console.log("📊 配置信息：");
  console.log("─".repeat(60));
  console.log("VRF Coordinator:", coordinatorAddress);
  console.log("訂閱 ID:", subscriptionId);
  console.log("Key Hash (200 gwei):", "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
  
  // 編譯合約
  console.log("\n🔨 編譯 VRFConsumerV2Plus...");
  const { execSync } = require('child_process');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功");
  } catch (error) {
    console.log("❌ 編譯失敗:", error.message);
    return;
  }
  
  // 讀取編譯後的合約
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  
  if (!fs.existsSync(contractPath)) {
    console.log("❌ 找不到編譯後的合約");
    return;
  }
  
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // 部署合約
  console.log("\n🚀 部署 VRFConsumerV2Plus");
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
  
  const vrfConsumer = new ethers.Contract(address, contractJson.abi, wallet);
  
  // 授權 NFT 合約
  const contractsToAuthorize = [
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" },
    { name: "AltarOfAscension", address: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33" },
    { name: "測試地址", address: wallet.address }
  ];
  
  for (const c of contractsToAuthorize) {
    console.log(`授權 ${c.name}...`);
    const tx = await vrfConsumer.setAuthorizedContract(c.address, true);
    await tx.wait();
    console.log(`✅ ${c.name} 已授權`);
  }
  
  // 設置費用
  console.log("\n💰 設置費用");
  const setFeeTx = await vrfConsumer.setFee(ethers.parseEther("0.0001"));
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
  
  console.log("\n📋 後續步驟：");
  console.log("1. 添加 Consumer 完成後");
  console.log("2. 執行: node scripts/test-vrf-v2plus.js");
  console.log("3. 更新 NFT 合約的 VRF Manager 地址");
  
  // 保存部署信息
  const deploymentInfo = {
    VRFConsumerV2Plus: address,
    coordinator: coordinatorAddress,
    subscriptionId: subscriptionId,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    authorizedContracts: contractsToAuthorize.map(c => c.address),
    fee: "0.0001 BNB",
    nextSteps: {
      1: `Add consumer at https://vrf.chain.link/bsc/${subscriptionId}`,
      2: `Consumer address: ${address}`,
      3: "Test with: node scripts/test-vrf-v2plus.js",
      4: "Update NFT contracts VRF Manager address"
    }
  };
  
  fs.writeFileSync(
    'vrf-v2plus-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📁 部署信息已保存到 vrf-v2plus-deployment.json");
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
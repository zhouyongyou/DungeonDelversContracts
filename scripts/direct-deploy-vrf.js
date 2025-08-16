const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// 合約 ABI 和 Bytecode
const contractInfo = JSON.parse(fs.readFileSync('artifacts/contracts/current/core/VRFManagerV2PlusFixed.sol/VRFManagerV2PlusFixed.json', 'utf8'));

async function main() {
  console.log("=== 直接部署 VRFManagerV2PlusFixed ===\n");
  
  // 連接到 BSC
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("部署者:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 部署參數
  const wrapperAddress = "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94";
  
  console.log("1. 部署合約...");
  const factory = new ethers.ContractFactory(contractInfo.abi, contractInfo.bytecode, wallet);
  
  // 檢查 gas 價格
  const feeData = await provider.getFeeData();
  console.log("   Gas 價格:", ethers.formatUnits(feeData.gasPrice, 'gwei'), "gwei");
  
  // 部署
  const contract = await factory.deploy(wrapperAddress, {
    gasLimit: 3000000,
    gasPrice: feeData.gasPrice
  });
  
  console.log("   交易哈希:", contract.deploymentTransaction().hash);
  console.log("   等待確認...");
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("   ✅ 部署成功:", address);
  
  // 等待更多確認
  console.log("   等待 5 個區塊確認...");
  await contract.deploymentTransaction().wait(5);
  
  // 設置授權
  console.log("\n2. 設置授權合約...");
  
  const contracts = [
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" }
  ];
  
  for (const c of contracts) {
    console.log(`   授權 ${c.name}...`);
    const tx = await contract.setAuthorizedContract(c.address, true, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    await tx.wait();
    console.log(`   ✅ ${c.name} 已授權`);
  }
  
  // 更新 Hero 和 Relic
  console.log("\n3. 更新 NFT 合約的 VRF Manager...");
  
  const heroAbi = ["function setVRFManager(address)"];
  const relicAbi = ["function setVRFManager(address)"];
  
  const hero = new ethers.Contract("0x575e7407C06ADeb47067AD19663af50DdAe460CF", heroAbi, wallet);
  const relic = new ethers.Contract("0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739", relicAbi, wallet);
  
  console.log("   更新 Hero...");
  let tx = await hero.setVRFManager(address, {
    gasLimit: 100000,
    gasPrice: feeData.gasPrice
  });
  await tx.wait();
  console.log("   ✅ Hero 已更新");
  
  console.log("   更新 Relic...");
  tx = await relic.setVRFManager(address, {
    gasLimit: 100000,
    gasPrice: feeData.gasPrice
  });
  await tx.wait();
  console.log("   ✅ Relic 已更新");
  
  // 驗證合約
  console.log("\n4. 驗證合約...");
  console.log("   請使用以下命令驗證:");
  console.log(`   npx hardhat verify --network bsc ${address} "${wrapperAddress}"`);
  
  // 輸出結果
  console.log("\n=== 部署完成 ===");
  console.log("VRFManagerV2PlusFixed:", address);
  console.log("BSCScan:", `https://bscscan.com/address/${address}#code`);
  
  // 保存配置
  const config = {
    VRFManagerV2PlusFixed: address,
    wrapper: wrapperAddress,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    txHash: contract.deploymentTransaction().hash
  };
  
  fs.writeFileSync(
    'vrf-manager-latest.json',
    JSON.stringify(config, null, 2)
  );
  
  console.log("\n配置已保存到 vrf-manager-latest.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
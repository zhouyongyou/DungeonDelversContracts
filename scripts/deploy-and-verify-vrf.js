const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("=== 部署並驗證 VRFManagerV2PlusFixed ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("餘額:", ethers.formatEther(balance), "BNB\n");
  
  // 1. 部署合約
  console.log("1. 部署 VRFManagerV2PlusFixed...");
  const VRFManager = await ethers.getContractFactory("VRFManagerV2PlusFixed");
  const wrapperAddress = "0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94";
  
  const vrfManager = await VRFManager.deploy(wrapperAddress);
  await vrfManager.waitForDeployment();
  const vrfAddress = await vrfManager.getAddress();
  
  console.log("   ✅ 部署成功:", vrfAddress);
  console.log("   等待區塊確認...");
  await vrfManager.deploymentTransaction().wait(5);
  
  // 2. 驗證合約
  console.log("\n2. 驗證合約...");
  try {
    await hre.run("verify:verify", {
      address: vrfAddress,
      constructorArguments: [wrapperAddress],
      contract: "contracts/current/core/VRFManagerV2PlusFixed.sol:VRFManagerV2PlusFixed"
    });
    console.log("   ✅ 驗證成功!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ 合約已經驗證");
    } else {
      console.log("   ⚠️ 驗證失敗:", error.message);
    }
  }
  
  // 3. 設置授權
  console.log("\n3. 設置授權合約...");
  
  const contracts = [
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" }
  ];
  
  for (const contract of contracts) {
    console.log(`   設置 ${contract.name}...`);
    const tx = await vrfManager.setAuthorizedContract(contract.address, true);
    await tx.wait();
    console.log(`   ✅ ${contract.name} 已授權`);
  }
  
  // 4. 更新 Hero 和 Relic 的 VRF Manager
  console.log("\n4. 更新 NFT 合約的 VRF Manager...");
  
  const heroAbi = ["function setVRFManager(address)"];
  const relicAbi = ["function setVRFManager(address)"];
  
  const hero = new ethers.Contract("0x575e7407C06ADeb47067AD19663af50DdAe460CF", heroAbi, deployer);
  const relic = new ethers.Contract("0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739", relicAbi, deployer);
  
  console.log("   更新 Hero...");
  let tx = await hero.setVRFManager(vrfAddress);
  await tx.wait();
  console.log("   ✅ Hero 已更新");
  
  console.log("   更新 Relic...");
  tx = await relic.setVRFManager(vrfAddress);
  await tx.wait();
  console.log("   ✅ Relic 已更新");
  
  // 5. 輸出結果
  console.log("\n=== 部署完成 ===");
  console.log("VRFManagerV2PlusFixed:", vrfAddress);
  console.log("BSCScan:", `https://bscscan.com/address/${vrfAddress}#code`);
  
  // 保存配置
  const config = {
    VRFManagerV2PlusFixed: vrfAddress,
    wrapper: wrapperAddress,
    deployedAt: new Date().toISOString(),
    network: "BSC Mainnet",
    deployedWith: "Hardhat",
    verified: true
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'vrf-manager-deployment.json',
    JSON.stringify(config, null, 2)
  );
  
  console.log("\n配置已保存到 vrf-manager-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
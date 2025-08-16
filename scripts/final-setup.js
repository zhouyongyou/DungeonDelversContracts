const hre = require("hardhat");
const { execSync } = require('child_process');
const fs = require("fs");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 部署 AltarOfAscension
async function deployAltar() {
  console.log("\n📦 部署 AltarOfAscension...");
  
  try {
    const Factory = await hre.ethers.getContractFactory("AltarOfAscensionVRF");
    const [deployer] = await hre.ethers.getSigners();
    const contract = await Factory.deploy(deployer.address);
    await contract.waitForDeployment();
    return await contract.getAddress();
  } catch (error) {
    const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
    if (match && match[1]) {
      console.log("   交易 Hash:", match[1]);
      console.log("   等待確認...");
      await sleep(15000);
      
      const cmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${match[1]}"],"id":1}' | jq -r '.result.contractAddress'`;
      const address = execSync(cmd).toString().trim();
      
      if (address && address !== 'null') {
        console.log("   ✅ AltarOfAscension 部署成功:", address);
        return address;
      }
    }
    throw error;
  }
}

async function main() {
  console.log("🚀 完成 VRF 最終設置...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  // 所有合約地址
  const contracts = {
    VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscension: null
  };
  
  // 1. 部署 AltarOfAscension
  contracts.AltarOfAscension = await deployAltar();
  
  console.log("\n✅ 所有合約已部署！");
  console.log("=====================================");
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`${name.padEnd(20)} ${address}`);
  }
  console.log("=====================================");
  
  // 2. 設置步驟
  console.log("\n📋 現在需要執行以下設置：");
  
  console.log("\n1️⃣ 設置 VRF Manager (在每個合約):");
  for (const [name, address] of Object.entries(contracts)) {
    if (name !== "VRFConsumerV2Plus") {
      console.log(`   ${name}.setVRFManager("${contracts.VRFConsumerV2Plus}")`);
    }
  }
  
  console.log("\n2️⃣ 授權合約使用 VRF (在 VRFConsumerV2Plus):");
  for (const [name, address] of Object.entries(contracts)) {
    if (name !== "VRFConsumerV2Plus") {
      console.log(`   VRFConsumerV2Plus.setAuthorizedContract("${address}", true)`);
    }
  }
  
  console.log("\n3️⃣ 設置合約互連:");
  console.log(`   Hero.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13")`);
  console.log(`   Hero.setSoulShardToken("0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF")`);
  console.log(`   Relic.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13")`);
  console.log(`   Relic.setSoulShardToken("0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF")`);
  console.log(`   Relic.setAscensionAltarAddress("${contracts.AltarOfAscension}")`);
  console.log(`   DungeonMaster.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13")`);
  console.log(`   DungeonMaster.setDungeonStorage("0x88EF98E7F9095610d7762C30165854f271525B97")`);
  console.log(`   AltarOfAscension.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13")`);
  console.log(`   AltarOfAscension.setHeroContract("${contracts.Hero}")`);
  console.log(`   AltarOfAscension.setRelicContract("${contracts.Relic}")`);
  
  console.log("\n4️⃣ 在 Chainlink VRF 網站添加消費者:");
  console.log(`   https://vrf.chain.link/bsc/29062`);
  console.log(`   添加地址: ${contracts.VRFConsumerV2Plus}`);
  
  console.log("\n5️⃣ 驗證新合約:");
  console.log(`   npx hardhat verify --network bsc ${contracts.DungeonMaster} ${deployer.address}`);
  console.log(`   npx hardhat verify --network bsc ${contracts.AltarOfAscension} ${deployer.address}`);
  
  // 保存配置
  const finalConfig = {
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: contracts
  };
  
  const filename = `deployments/vrf-final-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(finalConfig, null, 2));
  console.log(`\n💾 配置已保存到: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
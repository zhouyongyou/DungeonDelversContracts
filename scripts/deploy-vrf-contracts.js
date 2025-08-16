const hre = require("hardhat");
const fs = require("fs");

async function deployContract(name, args = []) {
  console.log(`\n📦 部署 ${name}...`);
  try {
    const Contract = await hre.ethers.getContractFactory(name);
    const contract = await Contract.deploy(...args);
    
    // 等待部署
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(`✅ ${name} 部署成功: ${address}`);
    
    // 等待確認
    const deployTx = contract.deploymentTransaction();
    if (deployTx) {
      console.log(`⏳ 等待 6 個區塊確認...`);
      await deployTx.wait(6);
    }
    
    // 自動驗證合約
    console.log(`🔍 驗證 ${name} 合約...`);
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
      });
      console.log(`✅ ${name} 驗證成功！`);
    } catch (verifyError) {
      if (verifyError.message.includes("Already Verified")) {
        console.log(`ℹ️ ${name} 已經驗證過了`);
      } else {
        console.log(`⚠️ ${name} 驗證失敗:`, verifyError.message);
      }
    }
    
    return address;
  } catch (error) {
    console.error(`❌ ${name} 部署失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 開始部署 VRF 相關合約...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 餘額:", hre.ethers.formatEther(balance), "BNB\n");
  
  // 已知地址
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const SOULSHARD = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const ORACLE = "0x67989939163bCFC57302767722E1988FFac46d64";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  // VRF 配置
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"; // BSC Mainnet V2.5
  const SUBSCRIPTION_ID = 29062;
  
  const deployments = {};
  
  try {
    // 0. 部署 VRFConsumerV2Plus
    console.log("0️⃣ VRFConsumerV2Plus (VRF Manager)");
    deployments.VRFConsumerV2Plus = await deployContract("VRFConsumerV2Plus", [
      SUBSCRIPTION_ID,
      VRF_COORDINATOR
    ]);
    const VRF_CONSUMER = deployments.VRFConsumerV2Plus;
    
    // 1. 部署 Hero
    console.log("1️⃣ Hero NFT");
    deployments.Hero = await deployContract("Hero", [deployer.address]);
    
    // 2. 部署 Relic
    console.log("2️⃣ Relic NFT");
    deployments.Relic = await deployContract("Relic", [deployer.address]);
    
    // 3. 部署 DungeonMaster
    console.log("3️⃣ DungeonMaster");
    deployments.DungeonMaster = await deployContract("DungeonMaster", [
      deployer.address,
      DUNGEON_CORE,
      DUNGEON_STORAGE
    ]);
    
    // 4. 部署 AltarOfAscension
    console.log("4️⃣ AltarOfAscension");
    deployments.AltarOfAscension = await deployContract("AltarOfAscension", [deployer.address]);
    
    // 保存部署結果
    const result = {
      network: "BSC Mainnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      vrfConsumer: VRF_CONSUMER,
      deployments: deployments
    };
    
    // 寫入文件
    const filename = `deployments/vrf-deployment-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`\n💾 部署結果已保存到: ${filename}`);
    
    // 顯示總結
    console.log("\n✅ 部署完成！新合約地址：");
    console.log("=====================================");
    console.log(`Hero:              ${deployments.Hero}`);
    console.log(`Relic:             ${deployments.Relic}`);
    console.log(`DungeonMaster:     ${deployments.DungeonMaster}`);
    console.log(`AltarOfAscension:  ${deployments.AltarOfAscension}`);
    console.log(`VRF Consumer:      ${deployments.VRFConsumerV2Plus}`);
    console.log("=====================================");
    
    console.log("\n📋 下一步：");
    console.log("1. 設置各合約的 VRF Manager 地址");
    console.log("2. 設置 DungeonCore 連接");
    console.log("3. 在 VRF Consumer 授權這些合約");
    console.log("4. 在 Chainlink 添加 VRF Consumer 為消費者");
    console.log("5. 驗證合約代碼");
    
  } catch (error) {
    console.error("\n❌ 部署過程出錯:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
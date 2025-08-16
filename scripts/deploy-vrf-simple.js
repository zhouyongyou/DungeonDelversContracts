const hre = require("hardhat");
const fs = require("fs");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🚀 開始部署 VRF 相關合約...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 餘額:", hre.ethers.formatEther(balance), "BNB\n");
  
  // VRF 配置
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const SUBSCRIPTION_ID = 29062;
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  const deployments = {};
  
  try {
    // 1. VRFConsumerV2Plus
    console.log("\n📦 部署 VRFConsumerV2Plus...");
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    const vrfConsumer = await VRFConsumerV2Plus.deploy(SUBSCRIPTION_ID, VRF_COORDINATOR);
    
    // 等待一會兒讓交易處理
    await sleep(5000);
    
    // 嘗試獲取地址
    let vrfAddress;
    try {
      vrfAddress = await vrfConsumer.getAddress();
    } catch (e) {
      // 如果 getAddress 失敗，嘗試其他方法
      vrfAddress = vrfConsumer.target || vrfConsumer.address;
    }
    
    if (!vrfAddress) {
      // 從交易 hash 獲取地址
      const deployTx = vrfConsumer.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        console.log("⏳ 等待交易確認...");
        
        // 使用 curl 查詢
        const { execSync } = require('child_process');
        await sleep(10000); // 等待 10 秒
        
        const curlCmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${deployTx.hash}"],"id":1}' | jq -r '.result.contractAddress'`;
        
        try {
          vrfAddress = execSync(curlCmd).toString().trim();
          if (vrfAddress && vrfAddress !== 'null') {
            console.log("✅ VRFConsumerV2Plus 部署成功:", vrfAddress);
            deployments.VRFConsumerV2Plus = vrfAddress;
          }
        } catch (e) {
          console.log("⚠️ 無法獲取合約地址，請手動檢查交易");
        }
      }
    } else {
      console.log("✅ VRFConsumerV2Plus 部署成功:", vrfAddress);
      deployments.VRFConsumerV2Plus = vrfAddress;
    }
    
    // 2. Hero
    console.log("\n📦 部署 Hero...");
    const Hero = await hre.ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await sleep(5000);
    
    let heroAddress;
    try {
      heroAddress = await hero.getAddress();
    } catch (e) {
      heroAddress = hero.target || hero.address;
    }
    
    if (!heroAddress) {
      const deployTx = hero.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        await sleep(10000);
        const { execSync } = require('child_process');
        const curlCmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${deployTx.hash}"],"id":1}' | jq -r '.result.contractAddress'`;
        try {
          heroAddress = execSync(curlCmd).toString().trim();
          if (heroAddress && heroAddress !== 'null') {
            console.log("✅ Hero 部署成功:", heroAddress);
            deployments.Hero = heroAddress;
          }
        } catch (e) {
          console.log("⚠️ 無法獲取合約地址");
        }
      }
    } else {
      console.log("✅ Hero 部署成功:", heroAddress);
      deployments.Hero = heroAddress;
    }
    
    // 3. Relic
    console.log("\n📦 部署 Relic...");
    const Relic = await hre.ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await sleep(5000);
    
    let relicAddress;
    try {
      relicAddress = await relic.getAddress();
    } catch (e) {
      relicAddress = relic.target || relic.address;
    }
    
    if (!relicAddress) {
      const deployTx = relic.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        await sleep(10000);
        const { execSync } = require('child_process');
        const curlCmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${deployTx.hash}"],"id":1}' | jq -r '.result.contractAddress'`;
        try {
          relicAddress = execSync(curlCmd).toString().trim();
          if (relicAddress && relicAddress !== 'null') {
            console.log("✅ Relic 部署成功:", relicAddress);
            deployments.Relic = relicAddress;
          }
        } catch (e) {
          console.log("⚠️ 無法獲取合約地址");
        }
      }
    } else {
      console.log("✅ Relic 部署成功:", relicAddress);
      deployments.Relic = relicAddress;
    }
    
    // 4. DungeonMaster
    console.log("\n📦 部署 DungeonMaster...");
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = await DungeonMaster.deploy(
      deployer.address,
      DUNGEON_CORE,
      DUNGEON_STORAGE
    );
    await sleep(5000);
    
    let dmAddress;
    try {
      dmAddress = await dungeonMaster.getAddress();
    } catch (e) {
      dmAddress = dungeonMaster.target || dungeonMaster.address;
    }
    
    if (!dmAddress) {
      const deployTx = dungeonMaster.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        await sleep(10000);
        const { execSync } = require('child_process');
        const curlCmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${deployTx.hash}"],"id":1}' | jq -r '.result.contractAddress'`;
        try {
          dmAddress = execSync(curlCmd).toString().trim();
          if (dmAddress && dmAddress !== 'null') {
            console.log("✅ DungeonMaster 部署成功:", dmAddress);
            deployments.DungeonMaster = dmAddress;
          }
        } catch (e) {
          console.log("⚠️ 無法獲取合約地址");
        }
      }
    } else {
      console.log("✅ DungeonMaster 部署成功:", dmAddress);
      deployments.DungeonMaster = dmAddress;
    }
    
    // 5. AltarOfAscension
    console.log("\n📦 部署 AltarOfAscension...");
    const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
    const altar = await AltarOfAscension.deploy(deployer.address);
    await sleep(5000);
    
    let altarAddress;
    try {
      altarAddress = await altar.getAddress();
    } catch (e) {
      altarAddress = altar.target || altar.address;
    }
    
    if (!altarAddress) {
      const deployTx = altar.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        await sleep(10000);
        const { execSync } = require('child_process');
        const curlCmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${deployTx.hash}"],"id":1}' | jq -r '.result.contractAddress'`;
        try {
          altarAddress = execSync(curlCmd).toString().trim();
          if (altarAddress && altarAddress !== 'null') {
            console.log("✅ AltarOfAscension 部署成功:", altarAddress);
            deployments.AltarOfAscension = altarAddress;
          }
        } catch (e) {
          console.log("⚠️ 無法獲取合約地址");
        }
      }
    } else {
      console.log("✅ AltarOfAscension 部署成功:", altarAddress);
      deployments.AltarOfAscension = altarAddress;
    }
    
    // 保存結果
    const result = {
      network: "BSC Mainnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      deployments: deployments
    };
    
    const filename = `deployments/vrf-deployment-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    
    console.log("\n✅ 部署完成！");
    console.log("=====================================");
    console.log("VRF Consumer:     ", deployments.VRFConsumerV2Plus || "請檢查交易");
    console.log("Hero:             ", deployments.Hero || "請檢查交易");
    console.log("Relic:            ", deployments.Relic || "請檢查交易");
    console.log("DungeonMaster:    ", deployments.DungeonMaster || "請檢查交易");
    console.log("AltarOfAscension: ", deployments.AltarOfAscension || "請檢查交易");
    console.log("=====================================");
    
  } catch (error) {
    console.error("\n❌ 部署失敗:", error.message);
    console.error("請手動檢查交易狀態");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
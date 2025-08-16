const hre = require("hardhat");
const fs = require("fs");
const { execSync } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getContractAddress(txHash) {
  // 等待交易被打包
  await sleep(10000);
  
  try {
    const cmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${txHash}"],"id":1}' | jq -r '.result.contractAddress'`;
    const address = execSync(cmd).toString().trim();
    
    if (address && address !== 'null' && address !== '') {
      return address;
    }
  } catch (e) {
    console.log("⚠️ 無法獲取地址:", e.message);
  }
  return null;
}

async function deployWithHardhat(name, args = []) {
  console.log(`\n📦 部署 ${name}...`);
  
  try {
    const Factory = await hre.ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    
    // 嘗試等待部署，但忽略錯誤
    try {
      await contract.waitForDeployment();
    } catch (e) {
      // 忽略 ethers v6 的錯誤
    }
    
    // 嘗試獲取地址
    let address;
    try {
      address = await contract.getAddress();
    } catch (e) {
      address = contract.target || contract.address;
    }
    
    // 如果沒有地址，從交易獲取
    if (!address) {
      const deployTx = contract.deploymentTransaction();
      if (deployTx && deployTx.hash) {
        console.log("📍 交易 Hash:", deployTx.hash);
        address = await getContractAddress(deployTx.hash);
      }
    }
    
    if (address) {
      console.log(`✅ ${name} 部署成功: ${address}`);
      
      // 等待更多區塊確認後驗證
      console.log(`⏳ 等待區塊確認...`);
      await sleep(20000);
      
      // 嘗試驗證
      console.log(`🔍 驗證 ${name}...`);
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: args,
        });
        console.log(`✅ ${name} 驗證成功！`);
      } catch (verifyError) {
        if (verifyError.message && verifyError.message.includes("Already Verified")) {
          console.log(`ℹ️ ${name} 已經驗證過了`);
        } else {
          console.log(`⚠️ ${name} 驗證失敗:`, verifyError.message || "未知錯誤");
        }
      }
      
      return address;
    }
    
    console.log(`⚠️ ${name} 部署地址未知，請手動檢查交易`);
    return null;
    
  } catch (error) {
    // 如果是 ethers v6 的格式錯誤，嘗試從錯誤信息中提取 hash
    if (error.message && error.message.includes("invalid value for value.to")) {
      const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
      if (match && match[1]) {
        console.log("📍 交易 Hash:", match[1]);
        const address = await getContractAddress(match[1]);
        if (address) {
          console.log(`✅ ${name} 部署成功: ${address}`);
          
          // 驗證
          await sleep(20000);
          console.log(`🔍 驗證 ${name}...`);
          try {
            await hre.run("verify:verify", {
              address: address,
              constructorArguments: args,
            });
            console.log(`✅ ${name} 驗證成功！`);
          } catch (verifyError) {
            if (verifyError.message && verifyError.message.includes("Already Verified")) {
              console.log(`ℹ️ ${name} 已經驗證過了`);
            } else {
              console.log(`⚠️ ${name} 驗證失敗:`, verifyError.message || "未知錯誤");
            }
          }
          
          return address;
        }
      }
    }
    
    console.error(`❌ ${name} 部署失敗:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 開始部署 VRF 相關合約...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 餘額:", hre.ethers.formatEther(balance), "BNB\n");
  
  // 配置
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const SUBSCRIPTION_ID = 29062;
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  const deployments = {};
  
  // 部署所有合約
  // 注意：VRFConsumerV2Plus 已經部署了，地址是 0x980d224ec4d198d94f34a8af76a19c00dabe2436
  // 如果要重新部署，取消註釋下面的代碼
  /*
  deployments.VRFConsumerV2Plus = await deployWithHardhat(
    "VRFConsumerV2Plus",
    [SUBSCRIPTION_ID, VRF_COORDINATOR]
  );
  */
  deployments.VRFConsumerV2Plus = "0x980d224ec4d198d94f34a8af76a19c00dabe2436"; // 已部署
  
  deployments.Hero = await deployWithHardhat("Hero", [deployer.address]);
  
  deployments.Relic = await deployWithHardhat("Relic", [deployer.address]);
  
  deployments.DungeonMaster = await deployWithHardhat(
    "DungeonMaster",
    [deployer.address, DUNGEON_CORE, DUNGEON_STORAGE]
  );
  
  deployments.AltarOfAscension = await deployWithHardhat(
    "AltarOfAscension",
    [deployer.address]
  );
  
  // 保存結果
  const result = {
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    deployments: deployments
  };
  
  const filename = `deployments/vrf-deployment-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`\n💾 部署結果已保存到: ${filename}`);
  
  // 顯示總結
  console.log("\n✅ 部署完成！");
  console.log("=====================================");
  console.log("VRF Consumer:     ", deployments.VRFConsumerV2Plus);
  console.log("Hero:             ", deployments.Hero);
  console.log("Relic:            ", deployments.Relic);
  console.log("DungeonMaster:    ", deployments.DungeonMaster);
  console.log("AltarOfAscension: ", deployments.AltarOfAscension);
  console.log("=====================================");
  
  console.log("\n📋 下一步：");
  console.log("1. 設置各合約的 VRF Manager 地址");
  console.log("2. 設置 DungeonCore 連接");
  console.log("3. 在 VRF Consumer 授權這些合約");
  console.log("4. 在 Chainlink 添加 VRF Consumer 為消費者");
  console.log("5. 測試 VRF 功能");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");
const fs = require("fs");
const { execSync } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 從錯誤信息中提取交易 hash
function extractTxHash(error) {
  const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
  return match ? match[1] : null;
}

// 查詢交易的合約地址
async function getContractAddressFromTx(txHash) {
  console.log(`   📍 交易 Hash: ${txHash}`);
  console.log(`   ⏳ 等待交易確認...`);
  await sleep(15000); // 等待 15 秒
  
  try {
    const cmd = `curl -s -X POST https://bsc-dataseed.binance.org/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${txHash}"],"id":1}' | jq -r '.result.contractAddress'`;
    const address = execSync(cmd).toString().trim();
    
    if (address && address !== 'null' && address !== '') {
      return address;
    }
  } catch (e) {
    console.log("   ⚠️ 無法獲取地址");
  }
  return null;
}

// 部署合約並處理 ethers v6 錯誤
async function deployContract(name, args = []) {
  console.log(`\n📦 部署 ${name}...`);
  
  try {
    const Factory = await hre.ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    
    // 這裡通常會失敗，但交易已發送
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`   ✅ ${name} 部署成功: ${address}`);
    return address;
    
  } catch (error) {
    // 處理 ethers v6 錯誤
    if (error.message && error.message.includes("invalid value for value.to")) {
      const txHash = extractTxHash(error);
      if (txHash) {
        const address = await getContractAddressFromTx(txHash);
        if (address) {
          console.log(`   ✅ ${name} 部署成功: ${address}`);
          return address;
        }
      }
    }
    
    console.error(`   ❌ ${name} 部署失敗:`, error.message);
    return null;
  }
}

// 驗證合約
async function verifyContract(address, name, args) {
  console.log(`\n🔍 驗證 ${name}...`);
  
  // 等待 BSCScan 索引
  await sleep(30000); // 等待 30 秒
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: args,
    });
    console.log(`   ✅ ${name} 驗證成功！`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`   ℹ️ ${name} 已經驗證過了`);
    } else if (error.message.includes("does not have bytecode")) {
      console.log(`   ⏳ 等待索引，稍後手動驗證`);
    } else {
      console.log(`   ⚠️ 驗證失敗:`, error.message);
    }
  }
}

async function main() {
  console.log("🚀 開始部署 VRF 相關合約（Workaround 版）...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 餘額:", hre.ethers.formatEther(balance), "BNB");
  
  // 配置
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  const deployments = {
    VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436", // 已部署
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef", // 已部署
  };
  
  console.log("\n✅ 已部署的合約：");
  console.log("   VRFConsumerV2Plus:", deployments.VRFConsumerV2Plus);
  console.log("   Hero:", deployments.Hero);
  
  // 繼續部署剩餘合約
  console.log("\n📋 繼續部署剩餘合約...");
  
  // Relic
  const relicAddress = await deployContract("Relic", [deployer.address]);
  if (relicAddress) deployments.Relic = relicAddress;
  
  // DungeonMaster
  const dmAddress = await deployContract("DungeonMaster", [
    deployer.address,
    DUNGEON_CORE,
    DUNGEON_STORAGE
  ]);
  if (dmAddress) deployments.DungeonMaster = dmAddress;
  
  // AltarOfAscension
  const altarAddress = await deployContract("AltarOfAscension", [deployer.address]);
  if (altarAddress) deployments.AltarOfAscension = altarAddress;
  
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
  console.log("\n=====================================");
  console.log("✅ 部署總結");
  console.log("=====================================");
  console.log("VRF Consumer:     ", deployments.VRFConsumerV2Plus);
  console.log("Hero:             ", deployments.Hero);
  console.log("Relic:            ", deployments.Relic || "請檢查交易");
  console.log("DungeonMaster:    ", deployments.DungeonMaster || "請檢查交易");
  console.log("AltarOfAscension: ", deployments.AltarOfAscension || "請檢查交易");
  console.log("=====================================");
  
  // 驗證合約
  console.log("\n📝 開始驗證合約...");
  
  await verifyContract(deployments.VRFConsumerV2Plus, "VRFConsumerV2Plus", [
    29062,
    "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"
  ]);
  
  await verifyContract(deployments.Hero, "Hero", [deployer.address]);
  
  if (deployments.Relic) {
    await verifyContract(deployments.Relic, "Relic", [deployer.address]);
  }
  
  if (deployments.DungeonMaster) {
    await verifyContract(deployments.DungeonMaster, "DungeonMaster", [
      deployer.address,
      DUNGEON_CORE,
      DUNGEON_STORAGE
    ]);
  }
  
  if (deployments.AltarOfAscension) {
    await verifyContract(deployments.AltarOfAscension, "AltarOfAscension", [deployer.address]);
  }
  
  console.log("\n✅ 完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
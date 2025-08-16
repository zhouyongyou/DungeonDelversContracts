const hre = require("hardhat");
const fs = require("fs");
const { deployContractSafe } = require("./ethers-v6-fix");

async function deployAndVerify(name, args = []) {
  console.log(`\n📦 部署 ${name}...`);
  
  try {
    // 使用安全的部署方法
    const result = await deployContractSafe(name, args);
    console.log(`✅ ${name} 部署成功: ${result.address}`);
    console.log(`   交易 Hash: ${result.deployTransaction.hash}`);
    console.log(`   Gas Used: ${result.receipt.gasUsed.toString()}`);
    
    // 等待更多確認
    console.log(`⏳ 等待 6 個區塊確認...`);
    await result.deployTransaction.wait(6);
    
    // 驗證合約
    console.log(`🔍 驗證 ${name}...`);
    try {
      await hre.run("verify:verify", {
        address: result.address,
        constructorArguments: args,
      });
      console.log(`✅ ${name} 驗證成功！`);
    } catch (verifyError) {
      if (verifyError.message.includes("Already Verified")) {
        console.log(`ℹ️ ${name} 已經驗證過了`);
      } else if (verifyError.message.includes("does not have bytecode")) {
        console.log(`⏳ 等待索引...稍後重試驗證`);
      } else {
        console.log(`⚠️ 驗證失敗:`, verifyError.message);
      }
    }
    
    return result.address;
    
  } catch (error) {
    console.error(`❌ ${name} 部署失敗:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 開始部署 VRF 相關合約（使用修復版）...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 部署者:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 餘額:", hre.ethers.formatEther(balance), "BNB");
  
  // 配置
  const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const SUBSCRIPTION_ID = 29062;
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  const DUNGEON_STORAGE = "0x88EF98E7F9095610d7762C30165854f271525B97";
  
  const deployments = {};
  
  try {
    // 1. VRFConsumerV2Plus (如果需要重新部署)
    // 註：已部署到 0x980d224ec4d198d94f34a8af76a19c00dabe2436
    const deployNewVRF = false; // 設為 true 重新部署
    
    if (deployNewVRF) {
      deployments.VRFConsumerV2Plus = await deployAndVerify(
        "VRFConsumerV2Plus",
        [SUBSCRIPTION_ID, VRF_COORDINATOR]
      );
    } else {
      deployments.VRFConsumerV2Plus = "0x980d224ec4d198d94f34a8af76a19c00dabe2436";
      console.log("\n✅ 使用已部署的 VRFConsumerV2Plus:", deployments.VRFConsumerV2Plus);
    }
    
    // 2. Hero
    deployments.Hero = await deployAndVerify("Hero", [deployer.address]);
    
    // 3. Relic
    deployments.Relic = await deployAndVerify("Relic", [deployer.address]);
    
    // 4. DungeonMaster
    deployments.DungeonMaster = await deployAndVerify(
      "DungeonMaster",
      [deployer.address, DUNGEON_CORE, DUNGEON_STORAGE]
    );
    
    // 5. AltarOfAscension
    deployments.AltarOfAscension = await deployAndVerify(
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
    console.log("\n=====================================");
    console.log("✅ 所有合約部署成功！");
    console.log("=====================================");
    console.log("VRF Consumer:     ", deployments.VRFConsumerV2Plus);
    console.log("Hero:             ", deployments.Hero);
    console.log("Relic:            ", deployments.Relic);
    console.log("DungeonMaster:    ", deployments.DungeonMaster);
    console.log("AltarOfAscension: ", deployments.AltarOfAscension);
    console.log("=====================================");
    
    // 設置腳本
    console.log("\n📋 下一步 - 運行設置腳本：");
    console.log("1. 設置 VRF Manager 地址：");
    console.log(`   npx hardhat run scripts/setup-vrf-connections.js --network bsc`);
    console.log("\n2. 在 Chainlink VRF 網站添加消費者：");
    console.log(`   https://vrf.chain.link/bsc/${SUBSCRIPTION_ID}`);
    console.log(`   添加地址: ${deployments.VRFConsumerV2Plus}`);
    console.log("\n3. 測試 VRF 功能：");
    console.log(`   npx hardhat run scripts/test-vrf-mint.js --network bsc`);
    
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
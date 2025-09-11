// scripts/deploy-nft-trinity.js
// 🚀 部署三個 NFT 合約：VIPStaking, Hero, Relic
// 並設置雙向互連

const hre = require("hardhat");
const { ethers } = require("hardhat");

// 🎯 重要：統一 Gas Price 設定 (0.11 gwei)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// 📋 配置常數
const CONFIG = {
  // 驗證延遲（秒）
  VERIFICATION_DELAY: 30,
  
  // Gas 配置
  GAS_LIMIT: {
    DEPLOY: 3000000,
    SET_FUNCTION: 200000
  },
  
  // 合約名稱
  CONTRACTS: {
    VIPSTAKING: "VIPStaking",
    HERO: "Hero", 
    RELIC: "Relic"
  }
};

// 🔍 檢查現有地址配置
async function loadExistingAddresses() {
  try {
    const fs = require('fs');
    const envPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
    
    if (!fs.existsSync(envPath)) {
      console.log("❌ .env 文件不存在");
      return {};
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const addresses = {};
    
    // 解析現有地址
    const dungeonCoreMatch = envContent.match(/VITE_DUNGEONCORE_ADDRESS=(.+)/);
    if (dungeonCoreMatch) {
      addresses.DUNGEONCORE = dungeonCoreMatch[1].trim();
      console.log(`✅ 找到 DungeonCore 地址: ${addresses.DUNGEONCORE}`);
    }
    
    return addresses;
  } catch (error) {
    console.log("⚠️ 無法載入現有地址，將使用新部署地址");
    return {};
  }
}

// 🚀 部署單個合約
async function deployContract(contractName, constructorArgs = [], signer) {
  console.log(`\n📦 部署 ${contractName}...`);
  
  try {
    const ContractFactory = await ethers.getContractFactory(contractName, signer);
    
    const deployTx = await ContractFactory.deploy(...constructorArgs, {
      gasLimit: CONFIG.GAS_LIMIT.DEPLOY,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ ${contractName} 部署交易已送出: ${deployTx.deploymentTransaction().hash}`);
    
    // 等待部署確認
    await deployTx.waitForDeployment();
    const address = await deployTx.getAddress();
    
    console.log(`✅ ${contractName} 部署成功: ${address}`);
    
    return {
      contract: deployTx,
      address: address,
      deployTxHash: deployTx.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error(`❌ ${contractName} 部署失敗:`, error.message);
    throw error;
  }
}

// 🔧 設置合約配置
async function setupContract(contract, contractName, dungeonCoreAddress, signer) {
  console.log(`\n🔧 配置 ${contractName}...`);
  
  try {
    // 設置 DungeonCore 地址
    const setCoreTx = await contract.setDungeonCore(dungeonCoreAddress, {
      gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ ${contractName} setDungeonCore 交易: ${setCoreTx.hash}`);
    await setCoreTx.wait();
    console.log(`✅ ${contractName} DungeonCore 設置完成`);
    
    return true;
  } catch (error) {
    console.error(`❌ ${contractName} 配置失敗:`, error.message);
    return false;
  }
}

// 🔍 驗證合約
async function verifyContract(address, contractName, constructorArgs = []) {
  console.log(`\n📋 驗證合約 ${contractName} (${address})...`);
  
  try {
    // 等待驗證延遲
    console.log(`⏳ 等待 ${CONFIG.VERIFICATION_DELAY} 秒讓區塊鏈同步...`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.VERIFICATION_DELAY * 1000));
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    
    console.log(`✅ ${contractName} 驗證成功`);
    return true;
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ ${contractName} 已經驗證過了`);
      return true;
    } else {
      console.error(`❌ ${contractName} 驗證失敗:`, error.message);
      return false;
    }
  }
}

// 💾 保存部署結果
async function saveDeploymentResults(deployedContracts) {
  console.log("\n💾 保存部署結果...");
  
  const fs = require('fs');
  const path = require('path');
  
  // 準備部署結果
  const results = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    gasPrice: "0.11 gwei",
    contracts: {}
  };
  
  for (const [name, data] of Object.entries(deployedContracts)) {
    results.contracts[name] = {
      address: data.address,
      deployTxHash: data.deployTxHash,
      verified: data.verified || false
    };
  }
  
  // 保存到文件
  const outputPath = path.join(__dirname, '../deployment-results', `nft-trinity-${Date.now()}.json`);
  
  // 確保目錄存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ 部署結果已保存到: ${outputPath}`);
  
  // 打印摘要
  console.log("\n📊 部署摘要:");
  console.log("=".repeat(50));
  for (const [name, data] of Object.entries(deployedContracts)) {
    console.log(`${name}: ${data.address}`);
  }
  console.log("=".repeat(50));
}

// 🚀 主要部署流程
async function main() {
  console.log("🚀 開始部署 NFT Trinity (VIPStaking, Hero, Relic)");
  console.log(`📍 網路: ${hre.network.name}`);
  console.log(`⛽ Gas Price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);
  
  // 獲取簽名者
  const [deployer] = await ethers.getSigners();
  console.log(`👤 部署者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.02")) {
    throw new Error("❌ BNB 餘額不足，至少需要 0.02 BNB");
  }
  
  // 載入現有地址
  const existingAddresses = await loadExistingAddresses();
  
  if (!existingAddresses.DUNGEONCORE) {
    throw new Error("❌ 找不到 DungeonCore 地址，請先部署或配置 DungeonCore");
  }
  
  const deployedContracts = {};
  
  try {
    // 🏗️ 階段 1: 部署合約
    console.log("\n🏗️ === 階段 1: 部署合約 ===");
    
    // 1. 部署 VIPStaking
    const vipStaking = await deployContract(CONFIG.CONTRACTS.VIPSTAKING, [], deployer);
    deployedContracts.VIPStaking = vipStaking;
    
    // 2. 部署 Hero
    const hero = await deployContract(CONFIG.CONTRACTS.HERO, [], deployer);
    deployedContracts.Hero = hero;
    
    // 3. 部署 Relic
    const relic = await deployContract(CONFIG.CONTRACTS.RELIC, [], deployer);
    deployedContracts.Relic = relic;
    
    // 🔧 階段 2: 配置合約
    console.log("\n🔧 === 階段 2: 配置合約 ===");
    
    // 配置所有合約的 DungeonCore 連接
    await setupContract(vipStaking.contract, "VIPStaking", existingAddresses.DUNGEONCORE, deployer);
    await setupContract(hero.contract, "Hero", existingAddresses.DUNGEONCORE, deployer);
    await setupContract(relic.contract, "Relic", existingAddresses.DUNGEONCORE, deployer);
    
    // 📋 階段 3: 驗證合約
    console.log("\n📋 === 階段 3: 驗證合約 ===");
    
    // 併行驗證所有合約
    const verificationPromises = [
      verifyContract(vipStaking.address, "VIPStaking"),
      verifyContract(hero.address, "Hero"), 
      verifyContract(relic.address, "Relic")
    ];
    
    const verificationResults = await Promise.allSettled(verificationPromises);
    
    // 記錄驗證結果
    deployedContracts.VIPStaking.verified = verificationResults[0].status === 'fulfilled' && verificationResults[0].value;
    deployedContracts.Hero.verified = verificationResults[1].status === 'fulfilled' && verificationResults[1].value;
    deployedContracts.Relic.verified = verificationResults[2].status === 'fulfilled' && verificationResults[2].value;
    
    // 💾 階段 4: 保存結果
    await saveDeploymentResults(deployedContracts);
    
    // 🎯 階段 5: 提醒 DungeonCore 配置
    console.log("\n🎯 === 階段 5: 後續配置提醒 ===");
    console.log("⚠️ 重要：需要在 DungeonCore 中設置以下地址:");
    console.log(`- setVIPStakingAddress(${deployedContracts.VIPStaking.address})`);
    console.log(`- setHeroAddress(${deployedContracts.Hero.address})`);
    console.log(`- setRelicAddress(${deployedContracts.Relic.address})`);
    
    console.log("\n🎉 NFT Trinity 部署完成！");
    
  } catch (error) {
    console.error("\n💥 部署過程中發生錯誤:", error);
    
    // 保存部分結果（如果有的話）
    if (Object.keys(deployedContracts).length > 0) {
      console.log("\n💾 保存已成功部署的合約...");
      await saveDeploymentResults(deployedContracts);
    }
    
    process.exit(1);
  }
}

// 🚀 執行主函數
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 腳本執行失敗:", error);
    process.exit(1);
  });
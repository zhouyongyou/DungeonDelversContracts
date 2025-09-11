// scripts/deploy-and-connect-nft-trinity.js
// 🚀 完整流程：部署三個 NFT 合約 + 驗證開源 + 設置雙向互連
// 一鍵完成所有部署和配置任務

const hre = require("hardhat");
const { ethers } = require("hardhat");

// 🎯 重要：統一 Gas Price 設定 (0.11 gwei)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// 📋 配置常數
const CONFIG = {
  VERIFICATION_DELAY: 30,
  GAS_LIMIT: {
    DEPLOY: 5000000,  // 增加部署 Gas 限制
    SET_FUNCTION: 300000  // 增加設置函數 Gas 限制
  },
  CONTRACTS: {
    VIPSTAKING: "VIPStaking",
    HERO: "Hero", 
    RELIC: "Relic",
    DUNGEONCORE: "DungeonCore"
  }
};

// 🔍 檢查現有 DungeonCore 地址
async function loadDungeonCoreAddress() {
  try {
    const fs = require('fs');
    const envPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
    
    if (!fs.existsSync(envPath)) {
      throw new Error("❌ .env 文件不存在");
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_DUNGEONCORE_ADDRESS=(.+)/);
    
    if (match) {
      const address = match[1].trim();
      console.log(`✅ 找到 DungeonCore 地址: ${address}`);
      return address;
    } else {
      throw new Error("❌ 未找到 DungeonCore 地址");
    }
  } catch (error) {
    console.error("❌ 載入 DungeonCore 地址失敗:", error.message);
    throw error;
  }
}

// 🚀 部署單個合約
async function deployContract(contractName, constructorArgs = [], signer) {
  console.log(`\n📦 部署 ${contractName}...`);
  
  try {
    const ContractFactory = await ethers.getContractFactory(contractName, signer);
    
    // BSC 鏈上使用固定 Gas 限制（避免估算錯誤）
    const gasLimit = BigInt(CONFIG.GAS_LIMIT.DEPLOY);
    
    console.log(`⛽ 使用 Gas 限制: ${gasLimit.toString()}`);
    console.log(`💰 估算成本: ${ethers.formatEther(gasLimit * GAS_PRICE)} BNB`);
    
    const deployTx = await ContractFactory.deploy(...constructorArgs, {
      gasLimit: gasLimit,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ ${contractName} 部署交易: ${deployTx.deploymentTransaction().hash}`);
    
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
    
    // 提供更詳細的錯誤信息
    if (error.receipt && error.receipt.status === 0) {
      console.error(`🔍 交易失敗詳情: Gas Used: ${error.receipt.gasUsed}, Gas Price: ${error.receipt.gasPrice}`);
    }
    
    throw error;
  }
}

// 🔧 配置 NFT 合約的 DungeonCore 連接
async function setupNFTContract(contract, contractName, dungeonCoreAddress, signer) {
  console.log(`\n🔧 配置 ${contractName} → DungeonCore 連接...`);
  
  try {
    const setCoreTx = await contract.setDungeonCore(dungeonCoreAddress, {
      gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ ${contractName}.setDungeonCore(): ${setCoreTx.hash}`);
    await setCoreTx.wait();
    console.log(`✅ ${contractName} → DungeonCore 連接完成`);
    
    return true;
  } catch (error) {
    console.error(`❌ ${contractName} → DungeonCore 連接失敗:`, error.message);
    return false;
  }
}

// 🔄 設置 DungeonCore → NFT 連接
async function setupDungeonCoreConnections(dungeonCoreAddress, nftContracts, signer) {
  console.log(`\n🔄 配置 DungeonCore → NFT 連接...`);
  
  try {
    const DungeonCore = await ethers.getContractFactory(CONFIG.CONTRACTS.DUNGEONCORE, signer);
    const dungeonCore = DungeonCore.attach(dungeonCoreAddress);
    
    const txPromises = [];
    
    // 設置 VIPStaking
    if (nftContracts.VIPStaking) {
      console.log(`⏳ DungeonCore.setVipStaking(${nftContracts.VIPStaking.address})`);
      const tx = dungeonCore.setVipStaking(nftContracts.VIPStaking.address, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      txPromises.push(tx.then(t => ({ name: "setVipStaking", tx: t })));
    }
    
    // 設置 Hero
    if (nftContracts.Hero) {
      console.log(`⏳ DungeonCore.setHeroContract(${nftContracts.Hero.address})`);
      const tx = dungeonCore.setHeroContract(nftContracts.Hero.address, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      txPromises.push(tx.then(t => ({ name: "setHeroContract", tx: t })));
    }
    
    // 設置 Relic
    if (nftContracts.Relic) {
      console.log(`⏳ DungeonCore.setRelicContract(${nftContracts.Relic.address})`);
      const tx = dungeonCore.setRelicContract(nftContracts.Relic.address, {
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION,
        gasPrice: GAS_PRICE
      });
      txPromises.push(tx.then(t => ({ name: "setRelicContract", tx: t })));
    }
    
    // 並行執行所有設置交易
    const results = await Promise.all(txPromises);
    
    // 等待所有交易確認
    for (const { name, tx } of results) {
      await tx.wait();
      console.log(`✅ DungeonCore.${name}() 完成: ${tx.hash}`);
    }
    
    console.log("✅ DungeonCore → NFT 連接設置完成");
    return true;
    
  } catch (error) {
    console.error("❌ DungeonCore → NFT 連接設置失敗:", error.message);
    return false;
  }
}

// 🔍 驗證合約
async function verifyContract(address, contractName, constructorArgs = []) {
  console.log(`\n📋 驗證 ${contractName} (${address})...`);
  
  try {
    console.log(`⏳ 等待 ${CONFIG.VERIFICATION_DELAY} 秒...`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.VERIFICATION_DELAY * 1000));
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    
    console.log(`✅ ${contractName} 驗證成功`);
    return true;
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ ${contractName} 已經驗證`);
      return true;
    } else {
      console.error(`❌ ${contractName} 驗證失敗:`, error.message);
      return false;
    }
  }
}

// 🔍 驗證雙向連接
async function verifyAllConnections(dungeonCoreAddress, nftContracts, signer) {
  console.log(`\n🔍 驗證雙向連接...`);
  
  try {
    const DungeonCore = await ethers.getContractFactory(CONFIG.CONTRACTS.DUNGEONCORE, signer);
    const dungeonCore = DungeonCore.attach(dungeonCoreAddress);
    
    const verificationResults = [];
    
    // 驗證 DungeonCore → NFT
    console.log("\n📋 DungeonCore → NFT 連接:");
    
    for (const [contractName, data] of Object.entries(nftContracts)) {
      let storedAddress = "";
      let isCorrect = false;
      
      try {
        switch (contractName) {
          case "VIPStaking":
            storedAddress = await dungeonCore.vipStakingAddress();
            break;
          case "Hero":
            storedAddress = await dungeonCore.heroContractAddress();
            break;
          case "Relic":
            storedAddress = await dungeonCore.relicContractAddress();
            break;
        }
        
        isCorrect = storedAddress.toLowerCase() === data.address.toLowerCase();
        console.log(`${contractName}: ${storedAddress} ${isCorrect ? '✅' : '❌'}`);
        verificationResults.push({ contract: contractName, direction: "Core→NFT", success: isCorrect });
        
      } catch (error) {
        console.log(`${contractName}: 驗證失敗 (${error.message.split('.')[0]})`);
        verificationResults.push({ contract: contractName, direction: "Core→NFT", success: false });
      }
    }
    
    // 驗證 NFT → DungeonCore  
    console.log("\n📋 NFT → DungeonCore 連接:");
    
    for (const [contractName, data] of Object.entries(nftContracts)) {
      try {
        const storedAddress = await data.contract.dungeonCore();
        const isCorrect = storedAddress.toLowerCase() === dungeonCoreAddress.toLowerCase();
        console.log(`${contractName}: ${storedAddress} ${isCorrect ? '✅' : '❌'}`);
        verificationResults.push({ contract: contractName, direction: "NFT→Core", success: isCorrect });
        
      } catch (error) {
        console.log(`${contractName}: 驗證失敗 (${error.message.split('.')[0]})`);
        verificationResults.push({ contract: contractName, direction: "NFT→Core", success: false });
      }
    }
    
    const allSuccess = verificationResults.every(r => r.success);
    console.log(`\n${allSuccess ? '✅' : '❌'} 雙向連接驗證${allSuccess ? '完全成功' : '部分失敗'}`);
    
    return verificationResults;
    
  } catch (error) {
    console.error("❌ 連接驗證失敗:", error.message);
    return [];
  }
}

// 💾 保存完整部署結果
async function saveCompleteResults(dungeonCoreAddress, nftContracts, verificationResults) {
  console.log("\n💾 保存完整部署結果...");
  
  const fs = require('fs');
  const path = require('path');
  
  const results = {
    deployment: {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      gasPrice: "0.11 gwei",
      dungeonCore: dungeonCoreAddress
    },
    contracts: {},
    connections: verificationResults,
    summary: {
      totalContracts: Object.keys(nftContracts).length,
      successfulDeployments: Object.keys(nftContracts).length,
      successfulVerifications: Object.values(nftContracts).filter(c => c.verified).length,
      successfulConnections: verificationResults.filter(r => r.success).length
    }
  };
  
  // 記錄合約資訊
  for (const [name, data] of Object.entries(nftContracts)) {
    results.contracts[name] = {
      address: data.address,
      deployTxHash: data.deployTxHash,
      verified: data.verified || false
    };
  }
  
  // 保存詳細報告
  const outputPath = path.join(__dirname, '../deployment-results', `nft-trinity-complete-${Date.now()}.json`);
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ 完整部署結果已保存: ${outputPath}`);
  
  // 生成摘要
  console.log("\n📊 完整部署摘要:");
  console.log("=".repeat(60));
  console.log(`網路: ${results.deployment.network}`);
  console.log(`Gas Price: ${results.deployment.gasPrice}`);
  console.log(`DungeonCore: ${results.deployment.dungeonCore}`);
  console.log("");
  
  for (const [name, data] of Object.entries(results.contracts)) {
    console.log(`${name}:`);
    console.log(`  地址: ${data.address}`);
    console.log(`  驗證: ${data.verified ? '✅' : '❌'}`);
    console.log("");
  }
  
  console.log(`連接狀態: ${results.summary.successfulConnections}/${verificationResults.length} 成功`);
  console.log("=".repeat(60));
}

// 🚀 主要執行流程
async function main() {
  console.log("🚀 開始完整 NFT Trinity 部署流程");
  console.log(`📍 網路: ${hre.network.name}`);
  console.log(`⛽ Gas Price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 部署者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.05")) {
    throw new Error("❌ BNB 餘額不足，至少需要 0.05 BNB");
  }
  
  try {
    // 🔍 階段 1: 載入 DungeonCore
    console.log("\n🔍 === 階段 1: 載入 DungeonCore 地址 ===");
    const dungeonCoreAddress = await loadDungeonCoreAddress();
    
    // 🏗️ 階段 2: 部署 NFT 合約
    console.log("\n🏗️ === 階段 2: 部署 NFT 合約 ===");
    const nftContracts = {};
    
    nftContracts.VIPStaking = await deployContract(CONFIG.CONTRACTS.VIPSTAKING, [], deployer);
    nftContracts.Hero = await deployContract(CONFIG.CONTRACTS.HERO, [], deployer);
    nftContracts.Relic = await deployContract(CONFIG.CONTRACTS.RELIC, [], deployer);
    
    // 🔧 階段 3: 設置 NFT → DungeonCore 連接
    console.log("\n🔧 === 階段 3: 設置 NFT → DungeonCore 連接 ===");
    await setupNFTContract(nftContracts.VIPStaking.contract, "VIPStaking", dungeonCoreAddress, deployer);
    await setupNFTContract(nftContracts.Hero.contract, "Hero", dungeonCoreAddress, deployer);
    await setupNFTContract(nftContracts.Relic.contract, "Relic", dungeonCoreAddress, deployer);
    
    // 🔄 階段 4: 設置 DungeonCore → NFT 連接
    console.log("\n🔄 === 階段 4: 設置 DungeonCore → NFT 連接 ===");
    await setupDungeonCoreConnections(dungeonCoreAddress, nftContracts, deployer);
    
    // 📋 階段 5: 並行驗證合約
    console.log("\n📋 === 階段 5: 並行驗證合約 ===");
    const verificationPromises = [
      verifyContract(nftContracts.VIPStaking.address, "VIPStaking"),
      verifyContract(nftContracts.Hero.address, "Hero"),
      verifyContract(nftContracts.Relic.address, "Relic")
    ];
    
    const verificationResults = await Promise.allSettled(verificationPromises);
    nftContracts.VIPStaking.verified = verificationResults[0].status === 'fulfilled' && verificationResults[0].value;
    nftContracts.Hero.verified = verificationResults[1].status === 'fulfilled' && verificationResults[1].value;
    nftContracts.Relic.verified = verificationResults[2].status === 'fulfilled' && verificationResults[2].value;
    
    // 🔍 階段 6: 驗證雙向連接
    console.log("\n🔍 === 階段 6: 驗證雙向連接 ===");
    const connectionResults = await verifyAllConnections(dungeonCoreAddress, nftContracts, deployer);
    
    // 💾 階段 7: 保存完整結果
    console.log("\n💾 === 階段 7: 保存完整結果 ===");
    await saveCompleteResults(dungeonCoreAddress, nftContracts, connectionResults);
    
    console.log("\n🎉 NFT Trinity 完整部署流程成功完成！");
    console.log("✅ 所有合約已部署、驗證並建立雙向連接");
    
  } catch (error) {
    console.error("\n💥 部署流程失敗:", error);
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
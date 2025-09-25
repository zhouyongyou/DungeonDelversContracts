// deploy-5-nft-contracts.js
// 🚀 專用腳本：部署 5 個 NFT 合約 + 驗證開源 + 設置與 CORE 的互連
// 目標合約：AltarOfAscension, Party, Relic, VIPStaking, Hero

const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// 🎯 重要：統一 Gas Price 設定 (0.11 gwei)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// 📋 配置常數
const CONFIG = {
  VERIFICATION_DELAY: 30,
  GAS_LIMIT: {
    DEPLOY: 8000000,
    SET_FUNCTION: 500000
  },
  CONTRACTS: {
    ALTAR: "AltarOfAscension",
    PARTY: "Party",
    RELIC: "Relic",
    VIPSTAKING: "VIPStaking",
    HERO: "Hero",
    DUNGEONCORE: "DungeonCore"
  }
};

// 🔍 檢查現有 DungeonCore 地址
async function loadDungeonCoreAddress() {
  try {
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
      throw new Error("❌ 未找到 DungeonCore 地址，請先在 .env 中設置 VITE_DUNGEONCORE_ADDRESS");
    }
  } catch (error) {
    console.error("❌ 載入 DungeonCore 地址失敗:", error.message);
    throw error;
  }
}

// 🏗️ Gas 優化的部署函數
async function deployContract(contractName, constructorArgs = []) {
  console.log(`\n🚀 部署 ${contractName}...`);

  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...constructorArgs, {
      gasPrice: GAS_PRICE,
      gasLimit: CONFIG.GAS_LIMIT.DEPLOY
    });

    console.log(`⏳ 等待 ${contractName} 部署確認...`);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();

    console.log(`✅ ${contractName} 部署成功!`);
    console.log(`   地址: ${address}`);
    console.log(`   交易哈希: ${deployTx.hash}`);

    return {
      contract,
      address,
      deployTxHash: deployTx.hash
    };
  } catch (error) {
    console.error(`❌ ${contractName} 部署失敗:`, error.message);
    throw error;
  }
}

// 🔗 設置合約與 DungeonCore 的連接
async function setupConnections(deployedContracts, dungeonCoreAddress) {
  console.log("\n🔗 === 設置合約連接 ===");

  const dungeonCore = await ethers.getContractAt(CONFIG.CONTRACTS.DUNGEONCORE, dungeonCoreAddress);
  const connections = [];

  try {
    // Step 1: 設置 NFT 合約 → DungeonCore 連接
    console.log("\n📤 設置 NFT → DungeonCore 連接...");

    for (const [name, contractData] of Object.entries(deployedContracts)) {
      if (name === 'ALTAR') continue; // AltarOfAscension 有不同的連接方式

      console.log(`🔧 設置 ${name} → DungeonCore...`);
      const contract = contractData.contract;

      const tx = await contract.setDungeonCore(dungeonCoreAddress, {
        gasPrice: GAS_PRICE,
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION
      });
      await tx.wait();

      connections.push({
        contract: name,
        direction: "NFT→Core",
        success: true,
        txHash: tx.hash
      });
      console.log(`✅ ${name}.setDungeonCore() 完成`);
    }

    // Step 2: 設置 DungeonCore → NFT 連接
    console.log("\n📥 設置 DungeonCore → NFT 連接...");

    const coreConnections = [
      { name: 'VIPSTAKING', method: 'setVipStaking' },
      { name: 'HERO', method: 'setHeroContract' },
      { name: 'RELIC', method: 'setRelicContract' },
      { name: 'PARTY', method: 'setPartyContract' },
      { name: 'ALTAR', method: 'setAltarOfAscension' }
    ];

    for (const conn of coreConnections) {
      if (deployedContracts[conn.name]) {
        console.log(`🔧 設置 DungeonCore.${conn.method}()...`);
        const tx = await dungeonCore[conn.method](deployedContracts[conn.name].address, {
          gasPrice: GAS_PRICE,
          gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION
        });
        await tx.wait();

        connections.push({
          contract: conn.name,
          direction: "Core→NFT",
          success: true,
          txHash: tx.hash
        });
        console.log(`✅ DungeonCore.${conn.method}() 完成`);
      }
    }

    // Step 3: AltarOfAscension 特殊連接設置
    if (deployedContracts.ALTAR) {
      console.log("\n🏛️ 設置 AltarOfAscension 特殊連接...");
      const altar = deployedContracts.ALTAR.contract;

      // 設置 Hero 和 Relic 合約地址
      if (deployedContracts.HERO) {
        const tx1 = await altar.setHeroContract(deployedContracts.HERO.address, {
          gasPrice: GAS_PRICE,
          gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION
        });
        await tx1.wait();
        console.log(`✅ Altar.setHeroContract() 完成`);
      }

      if (deployedContracts.RELIC) {
        const tx2 = await altar.setRelicContract(deployedContracts.RELIC.address, {
          gasPrice: GAS_PRICE,
          gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION
        });
        await tx2.wait();
        console.log(`✅ Altar.setRelicContract() 完成`);
      }

      // 設置 DungeonCore
      const tx3 = await altar.setDungeonCore(dungeonCoreAddress, {
        gasPrice: GAS_PRICE,
        gasLimit: CONFIG.GAS_LIMIT.SET_FUNCTION
      });
      await tx3.wait();
      console.log(`✅ Altar.setDungeonCore() 完成`);
    }

    return connections;

  } catch (error) {
    console.error("❌ 連接設置失敗:", error.message);
    throw error;
  }
}

// 📋 並行驗證合約
async function verifyContracts(deployedContracts) {
  console.log(`\n📋 === 等待 ${CONFIG.VERIFICATION_DELAY} 秒後開始驗證... ===`);
  await new Promise(resolve => setTimeout(resolve, CONFIG.VERIFICATION_DELAY * 1000));

  const verificationPromises = Object.entries(deployedContracts).map(async ([name, data]) => {
    try {
      console.log(`🔍 驗證 ${name}...`);
      await hre.run("verify:verify", {
        address: data.address,
        constructorArguments: []
      });
      console.log(`✅ ${name} 驗證成功`);
      return { contract: name, verified: true };
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${name} 已經驗證過了`);
        return { contract: name, verified: true };
      } else {
        console.error(`❌ ${name} 驗證失敗:`, error.message);
        return { contract: name, verified: false, error: error.message };
      }
    }
  });

  return await Promise.all(verificationPromises);
}

// 🔍 驗證所有連接
async function validateConnections(deployedContracts, dungeonCoreAddress) {
  console.log("\n🔍 === 驗證連接狀態 ===");

  const dungeonCore = await ethers.getContractAt(CONFIG.CONTRACTS.DUNGEONCORE, dungeonCoreAddress);
  const validations = [];

  try {
    // 驗證 DungeonCore → NFT 方向
    const coreChecks = [
      { name: 'VIPSTAKING', method: 'vipStakingAddress' },
      { name: 'HERO', method: 'heroContractAddress' },
      { name: 'RELIC', method: 'relicContractAddress' },
      { name: 'PARTY', method: 'partyContractAddress' },
      { name: 'ALTAR', method: 'altarOfAscensionAddress' }
    ];

    for (const check of coreChecks) {
      if (deployedContracts[check.name]) {
        const actual = await dungeonCore[check.method]();
        const expected = deployedContracts[check.name].address;
        const matches = actual.toLowerCase() === expected.toLowerCase();

        console.log(`${matches ? '✅' : '❌'} DungeonCore.${check.method}(): ${matches ? 'OK' : 'MISMATCH'}`);
        validations.push({
          contract: check.name,
          direction: "Core→NFT",
          expected,
          actual,
          matches
        });
      }
    }

    // 驗證 NFT → DungeonCore 方向
    for (const [name, data] of Object.entries(deployedContracts)) {
      if (name === 'ALTAR') continue; // AltarOfAscension 特殊檢查

      const contract = data.contract;
      const actual = await contract.dungeonCore();
      const matches = actual.toLowerCase() === dungeonCoreAddress.toLowerCase();

      console.log(`${matches ? '✅' : '❌'} ${name}.dungeonCore(): ${matches ? 'OK' : 'MISMATCH'}`);
      validations.push({
        contract: name,
        direction: "NFT→Core",
        expected: dungeonCoreAddress,
        actual,
        matches
      });
    }

    return validations;

  } catch (error) {
    console.error("❌ 連接驗證失敗:", error.message);
    throw error;
  }
}

// 💾 保存部署結果
async function saveDeploymentResults(deployedContracts, verificationResults, connections, validations, dungeonCoreAddress) {
  const timestamp = new Date().toISOString();
  const results = {
    deployment: {
      network: hre.network.name,
      timestamp,
      gasPrice: "0.11 gwei",
      dungeonCore: dungeonCoreAddress
    },
    contracts: {},
    verifications: verificationResults,
    connections,
    validations,
    summary: {
      totalContracts: Object.keys(deployedContracts).length,
      successfulDeployments: Object.keys(deployedContracts).length,
      successfulVerifications: verificationResults.filter(v => v.verified).length,
      successfulConnections: connections.filter(c => c.success).length,
      allConnectionsValid: validations.every(v => v.matches)
    }
  };

  // 轉換合約數據
  for (const [name, data] of Object.entries(deployedContracts)) {
    results.contracts[name] = {
      address: data.address,
      deployTxHash: data.deployTxHash
    };
  }

  // 保存到文件
  const resultsDir = path.join(__dirname, 'deployment-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filename = `5-nft-contracts-complete-${Date.now()}.json`;
  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

  console.log(`\n💾 完整部署結果已保存: ${filepath}`);
  return results;
}

// 🚀 主函數
async function main() {
  console.log("🚀 5-NFT 合約部署 + 驗證 + 互連腳本");
  console.log("⚡ BSC 優化: 0.11 gwei gas price");
  console.log("🎯 目標合約: AltarOfAscension, Party, Relic, VIPStaking, Hero");
  console.log("=" .repeat(80));

  // 檢查部署者帳戶
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`👤 部署者: ${deployer.address}`);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("❌ BNB 餘額不足，至少需要 0.1 BNB");
  }

  // 載入 DungeonCore 地址
  const dungeonCoreAddress = await loadDungeonCoreAddress();

  try {
    // Phase 1: 部署所有合約
    console.log("\n🏗️ === Phase 1: 部署合約 ===");

    const deployedContracts = {};
    const contractsToDeploy = [
      'ALTAR', 'PARTY', 'RELIC', 'VIPSTAKING', 'HERO'
    ];

    for (const contractKey of contractsToDeploy) {
      const contractName = CONFIG.CONTRACTS[contractKey];
      const result = await deployContract(contractName);
      deployedContracts[contractKey] = result;
    }

    // Phase 2: 設置連接
    console.log("\n🔗 === Phase 2: 設置連接 ===");
    const connections = await setupConnections(deployedContracts, dungeonCoreAddress);

    // Phase 3: 驗證合約
    console.log("\n📋 === Phase 3: 驗證合約 ===");
    const verificationResults = await verifyContracts(deployedContracts);

    // Phase 4: 驗證連接
    console.log("\n🔍 === Phase 4: 驗證連接 ===");
    const validations = await validateConnections(deployedContracts, dungeonCoreAddress);

    // Phase 5: 保存結果
    console.log("\n💾 === Phase 5: 保存結果 ===");
    const results = await saveDeploymentResults(
      deployedContracts,
      verificationResults,
      connections,
      validations,
      dungeonCoreAddress
    );

    // 最終報告
    console.log("\n🎉 === 部署完成報告 ===");
    console.log(`✅ 合約部署: ${results.summary.successfulDeployments}/${results.summary.totalContracts}`);
    console.log(`✅ 合約驗證: ${results.summary.successfulVerifications}/${results.summary.totalContracts}`);
    console.log(`✅ 連接設置: ${results.summary.successfulConnections} 個`);
    console.log(`✅ 連接驗證: ${results.summary.allConnectionsValid ? '全部正確' : '存在問題'}`);

    console.log("\n📋 合約地址總覽:");
    for (const [name, data] of Object.entries(deployedContracts)) {
      console.log(`   ${CONFIG.CONTRACTS[name]}: ${data.address}`);
    }

    if (results.summary.allConnectionsValid) {
      console.log("\n🎉 所有 5 個 NFT 合約已成功部署、驗證並建立與 CORE 的雙向連接！");
    } else {
      console.log("\n⚠️ 部署成功但部分連接可能需要手動檢查");
    }

  } catch (error) {
    console.error("\n❌ 部署流程失敗:", error.message);
    console.error("詳細錯誤:", error);
    process.exit(1);
  }
}

// 執行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
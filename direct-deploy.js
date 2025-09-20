// Direct deployment script without Hardhat
// 使用 0.11 gwei gas price 部署所有核心合約

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

// 配置
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000n;
const MIN_BALANCE = ethers.parseEther("0.03"); // 改為 0.03 BNB

// BSC RPC
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

async function main() {
  console.log("🚀 Direct Contract Deployment Script");
  console.log("=" .repeat(60));

  // 連接到 BSC
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 Deployer address:", wallet.address);

  // 檢查餘額
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "BNB");

  if (balance < MIN_BALANCE) {
    console.error("❌ 餘額不足！至少需要 0.03 BNB");
    process.exit(1);
  }

  const deployedContracts = {};
  const timestamp = Date.now();

  // 部署函數
  async function deployContract(name, bytecode, abi, constructorArgs = []) {
    console.log(`\n📦 Deploying ${name}...`);

    try {
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);

      const contract = await factory.deploy(...constructorArgs, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });

      await contract.waitForDeployment();
      const address = await contract.getAddress();

      console.log(`✅ ${name} deployed at: ${address}`);

      deployedContracts[name] = {
        address: address,
        deployTx: contract.deploymentTransaction().hash,
        timestamp: new Date().toISOString()
      };

      return contract;
    } catch (error) {
      console.error(`❌ Failed to deploy ${name}:`, error.message);
      throw error;
    }
  }

  // 讀取合約 artifacts (從 forge 的 out 目錄)
  function loadArtifact(contractPath) {
    const name = path.basename(contractPath, '.sol');
    const artifactPath = path.join(
      __dirname,
      'out',
      `${name}.sol`,
      `${name}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.log(`⚠️ Artifact not found for ${name}, will skip`);
      return null;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return {
      abi: artifact.abi,
      bytecode: artifact.bytecode.object
    };
  }

  // 已部署的代幣地址（從 .env 讀取）
  const SOULSHARD_ADDRESS = "0x1a98769b8034d400745cc658dc204cd079de36fa";
  const USD_ADDRESS = "0x916a2a1eb605e88561139c56af0698de241169f2";

  // 部署順序（按照依賴關係）
  const deploymentOrder = [
    // Phase 1: Oracle & VRF
    { path: 'current/core/VRFConsumerV2Plus.sol', args: [] },

    // Phase 2: Storage & Core
    { path: 'current/core/DungeonStorage.sol', args: [] },
    {
      path: 'current/core/DungeonCore.sol',
      args: [wallet.address, USD_ADDRESS, SOULSHARD_ADDRESS]  // 3個參數: owner, usdToken, soulShardToken
    },

    // Phase 3: DeFi
    { path: 'current/defi/PlayerVault.sol', args: [] },

    // Phase 4: NFTs
    { path: 'current/nft/VIPStaking.sol', args: [] },
    { path: 'current/nft/Hero.sol', args: [] },
    { path: 'current/nft/Relic.sol', args: [] },
    { path: 'current/nft/PlayerProfile.sol', args: [] },
    { path: 'current/nft/Party.sol', args: [] },

    // Phase 5: Game Logic
    { path: 'current/core/DungeonMaster.sol', args: [] },
    { path: 'current/core/AltarOfAscension.sol', args: [] },
  ];

  console.log("\n🎯 開始部署流程...");

  for (const { path: contractPath, args } of deploymentOrder) {
    const name = path.basename(contractPath, '.sol');
    const artifact = loadArtifact(contractPath);

    if (!artifact) {
      console.log(`⏭️ Skipping ${name} (no artifact)`);
      continue;
    }

    await deployContract(name, artifact.bytecode, artifact.abi, args);

    // 避免 nonce 問題，等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 保存部署結果
  const resultPath = path.join(
    __dirname,
    'deployment-results',
    `direct-deploy-${timestamp}.json`
  );

  if (!fs.existsSync(path.dirname(resultPath))) {
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  }

  fs.writeFileSync(resultPath, JSON.stringify({
    network: 'bsc',
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    gasPrice: ethers.formatUnits(GAS_PRICE, 'gwei'),
    contracts: deployedContracts
  }, null, 2));

  console.log("\n🎉 部署完成！");
  console.log(`📄 結果已保存至: ${resultPath}`);

  // 顯示摘要
  console.log("\n📊 部署摘要:");
  console.log("-".repeat(60));
  for (const [name, info] of Object.entries(deployedContracts)) {
    console.log(`${name}: ${info.address}`);
  }
}

// 執行並處理錯誤
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("\n❌ 部署失敗:", error);
    process.exit(1);
  });
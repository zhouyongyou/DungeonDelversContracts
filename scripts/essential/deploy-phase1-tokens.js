// deploy-phase1-tokens.js - Phase 1: Deploy test tokens
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("🪙 Phase 1: Deploying Test Tokens");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient BNB balance for deployment");
  }

  const deployedContracts = {};
  const deploymentTimestamp = Date.now();

  async function deployContract(contractName, constructorArgs = []) {
    console.log(`\n🚀 Deploying ${contractName}...`);
    
    try {
      const ContractFactory = await ethers.getContractFactory(contractName);
      const contract = await ContractFactory.deploy(...constructorArgs, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });
      
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log(`✅ ${contractName} deployed to: ${address}`);
      console.log(`📊 Transaction hash: ${contract.deploymentTransaction().hash}`);
      
      deployedContracts[contractName] = {
        address: address,
        transactionHash: contract.deploymentTransaction().hash,
        blockNumber: contract.deploymentTransaction().blockNumber?.toString()
      };
      
      return contract;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  try {
    // 1. Deploy TestUSD1 (Test USD Token)
    const tusd1 = await deployContract("TestUSD1");
    
    // 2. Deploy SoulShard (Soul Shard Token)
    const tsoul = await deployContract("SoulShard");
    
    console.log("\n📊 Phase 1 Summary");
    console.log("=" .repeat(60));
    
    Object.entries(deployedContracts).forEach(([name, info]) => {
      console.log(`${name}: ${info.address}`);
    });
    
    // Save deployment record
    const deploymentRecord = {
      phase: "1-tokens",
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      deployer: deployer.address,
      timestamp: deploymentTimestamp,
      gasPrice: "0.11 gwei",
      contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, `../../deployments/phase1-tokens-${deploymentTimestamp}.json`);
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`\n💾 Phase 1 record saved: ${recordPath}`);
    console.log("\n🎉 Phase 1 completed successfully!");
    console.log("\n⚡ Next steps:");
    console.log("1. Create Uniswap V3 pool with TUSD1 and TSOUL");
    console.log("2. Note the pool address for Phase 2");
    console.log("3. Run Phase 2: npm run deploy:phase2");
    
    console.log("\n📝 Pool Creation Guide:");
    console.log(`TestUSD1 Address: ${deployedContracts.TestUSD1.address}`);
    console.log(`SoulShard Address: ${deployedContracts.SoulShard.address}`);
    
  } catch (error) {
    console.error("\n❌ Phase 1 deployment failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
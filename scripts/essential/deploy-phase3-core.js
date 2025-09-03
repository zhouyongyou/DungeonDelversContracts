// deploy-phase3-core.js - Phase 3: Deploy DungeonCore
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("🏰 Phase 3: Deploying DungeonCore");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // DungeonCore constructor parameters (from previous deployments)
  const soulShardAddress = "0x1A98769B8034d400745cC658DC204CD079De36Fa";
  const testUSD1Address = "0x916a2a1eb605e88561139c56Af0698DE241169F2";
  
  console.log(`💎 SoulShard Address: ${soulShardAddress}`);
  console.log(`💵 TestUSD1 Address: ${testUSD1Address}`);

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
    // Deploy DungeonCore (Central hub)
    const dungeonCore = await deployContract("DungeonCore", [deployer.address, testUSD1Address, soulShardAddress]);
    
    console.log("\n📊 Phase 3 Summary");
    console.log("=" .repeat(60));
    console.log(`DungeonCore: ${deployedContracts.DungeonCore.address}`);
    
    // Save deployment record
    const deploymentRecord = {
      phase: "3-core",
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      deployer: deployer.address,
      timestamp: deploymentTimestamp,
      gasPrice: "0.11 gwei",
      contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, `../../deployments/phase3-core-${deploymentTimestamp}.json`);
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`\n💾 Phase 3 record saved: ${recordPath}`);
    console.log("\n🎉 Phase 3 completed successfully!");
    console.log("\n⚡ Next steps:");
    console.log("1. Run Phase 4: npm run deploy:phase4");
    
  } catch (error) {
    console.error("\n❌ Phase 3 deployment failed:", error.message);
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
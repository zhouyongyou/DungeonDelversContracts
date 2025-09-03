// deploy-phase2-oracle.js - Phase 2: Deploy Oracle with V3 pool
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("🔮 Phase 2: Deploying Oracle");
  console.log("=" .repeat(60));

  // Oracle constructor parameters (from Phase 1 deployment)
  const poolAddress = process.env.V3_POOL_ADDRESS || process.argv[2] || "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba";
  const soulShardAddress = process.env.SOUL_SHARD_ADDRESS || "0x1A98769B8034d400745cC658DC204CD079De36Fa";
  const testUSD1Address = process.env.TEST_USD1_ADDRESS || "0x916a2a1eb605e88561139c56Af0698DE241169F2";
  
  console.log(`🏊 V3 Pool Address: ${poolAddress}`);
  console.log(`💎 SoulShard Address: ${soulShardAddress}`);
  console.log(`💵 TestUSD1 Address: ${testUSD1Address}`);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

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
    // Deploy Oracle with pool address and token addresses
    const oracle = await deployContract("Oracle", [poolAddress, soulShardAddress, testUSD1Address]);
    
    console.log("\n📊 Phase 2 Summary");
    console.log("=" .repeat(60));
    console.log(`Oracle: ${deployedContracts.Oracle.address}`);
    console.log(`V3 Pool: ${poolAddress}`);
    
    // Save deployment record
    const deploymentRecord = {
      phase: "2-oracle",
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      deployer: deployer.address,
      timestamp: deploymentTimestamp,
      gasPrice: "0.11 gwei",
      v3PoolAddress: poolAddress,
      contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, `../../deployments/phase2-oracle-${deploymentTimestamp}.json`);
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`\n💾 Phase 2 record saved: ${recordPath}`);
    console.log("\n🎉 Phase 2 completed successfully!");
    console.log("\n⚡ Next steps:");
    console.log("1. Run Phase 3: npm run deploy:phase3");
    
  } catch (error) {
    console.error("\n❌ Phase 2 deployment failed:", error.message);
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
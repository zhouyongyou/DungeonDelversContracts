// deploy-complete.js - Unified deployment script for all DungeonDelvers contracts
// Optimized for BSC with 0.11 gwei gas price

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// BSC Gas Optimization - Critical for cost efficiency
const GAS_PRICE = ethers.parseUnits("0.11", "gwei"); // BSC optimal: 0.11 gwei
const GAS_LIMIT = 8000000; // BSC block gas limit consideration

async function main() {
  console.log("🏰 DungeonDelvers Complete Deployment Script");
  console.log("⚡ BSC Optimized: 0.11 gwei gas price");
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

  // Gas-optimized deployment function
  async function deployContract(contractName, constructorArgs = [], libraries = {}) {
    console.log(`\n📋 Deploying ${contractName}...`);
    
    try {
      const ContractFactory = await ethers.getContractFactory(contractName, { libraries });
      const contract = await ContractFactory.deploy(...constructorArgs, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });
      
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      
      console.log(`✅ ${contractName} deployed at: ${address}`);
      
      deployedContracts[contractName] = {
        address: address,
        constructorArgs: constructorArgs,
        timestamp: new Date().toISOString()
      };
      
      return contract;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  try {
    console.log("\n🚀 Phase 1: Core Infrastructure");
    
    // 1. Deploy DungeonCore (Central hub)
    const dungeonCore = await deployContract("DungeonCore");
    
    // 2. Deploy Oracle with hardcoded pool address (BSC USDT/BNB pool)
    const bscUsdtBnbPool = "0x36696169C63e42cd08ce11f5deeBbCeBae652050"; // BSC USDT/BNB V3 pool
    const oracle = await deployContract("Oracle", [bscUsdtBnbPool]);
    
    // 3. Deploy DungeonStorage
    const dungeonStorage = await deployContract("DungeonStorage");
    
    console.log("\n🎮 Phase 2: Game Tokens");
    
    // 4. Deploy TSOUL (Soul Shard Token)
    const tsoul = await deployContract("TSOUL");
    
    // 5. Deploy TUSD1 (Test USD Token)  
    const tusd1 = await deployContract("TUSD1");
    
    console.log("\n🖼️  Phase 3: NFT Contracts");
    
    // 6. Deploy Hero NFT
    const hero = await deployContract("Hero");
    
    // 7. Deploy Relic NFT
    const relic = await deployContract("Relic");
    
    // 8. Deploy Party NFT  
    const party = await deployContract("Party");
    
    // 9. Deploy PlayerProfile
    const playerProfile = await deployContract("PlayerProfile");
    
    // 10. Deploy VIPStaking
    const vipStaking = await deployContract("VIPStaking");
    
    console.log("\n💰 Phase 4: DeFi Components");
    
    // 11. Deploy PlayerVault
    const playerVault = await deployContract("PlayerVault");
    
    console.log("\n🎯 Phase 5: Game Logic");
    
    // 12. Deploy DungeonMaster
    const dungeonMaster = await deployContract("DungeonMaster");
    
    // 13. Deploy AltarOfAscension  
    const altarOfAscension = await deployContract("AltarOfAscension");
    
    console.log("\n🎲 Phase 6: VRF System");
    
    // 14. Deploy VRFConsumerV2Plus
    const vrfConsumer = await deployContract("VRFConsumerV2Plus");
    
    console.log("\n📊 Deployment Summary");
    console.log("=" .repeat(60));
    
    Object.entries(deployedContracts).forEach(([name, info]) => {
      console.log(`${name}: ${info.address}`);
    });
    
    // Save deployment record
    const deploymentRecord = {
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      deployer: deployer.address,
      timestamp: deploymentTimestamp,
      gasPrice: "0.11 gwei",
      contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, `../../deployments/v25-complete-${deploymentTimestamp}.json`);
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`\n💾 Deployment record saved: ${recordPath}`);
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("\n⚡ Next steps:");
    console.log("1. Run: npm run verify (to verify contracts on BSCScan)");
    console.log("2. Run: npm run setup (to configure contract connections)");
    console.log("3. Run: npm run extract-abi (to update frontend ABIs)");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("💡 Tip: Check your .env file and BNB balance");
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
// deploy-phase4-remaining.js - Phase 4: Deploy remaining contracts
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("🎮 Phase 4: Deploying Remaining Contracts");
  console.log("=" .repeat(60));

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
        blockNumber: contract.deploymentTransaction().blockNumber
      };
      
      return contract;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  try {
    console.log("\n💰 DeFi Components");
    
    // 1. Deploy PlayerVault
    const playerVault = await deployContract("PlayerVault");
    
    console.log("\n🖼️  NFT Contracts");
    
    // 2. Deploy Hero NFT
    const hero = await deployContract("Hero");
    
    // 3. Deploy Relic NFT
    const relic = await deployContract("Relic");
    
    // 4. Deploy Party NFT
    const party = await deployContract("Party");
    
    // 5. Deploy PlayerProfile
    const playerProfile = await deployContract("PlayerProfile");
    
    // 6. Deploy VIPStaking
    const vipStaking = await deployContract("VIPStaking");
    
    console.log("\n🎯 Game Logic");
    
    // 7. Deploy VRFConsumerV2Plus
    const vrfConsumer = await deployContract("VRFConsumerV2Plus");
    
    // 8. Deploy AltarOfAscension
    const altarOfAscension = await deployContract("AltarOfAscension");
    
    // 9. Deploy DungeonMaster
    const dungeonMaster = await deployContract("DungeonMaster");
    
    // 10. Deploy DungeonStorage
    const dungeonStorage = await deployContract("DungeonStorage");
    
    console.log("\n📊 Phase 4 Summary");
    console.log("=" .repeat(60));
    
    Object.entries(deployedContracts).forEach(([name, info]) => {
      console.log(`${name}: ${info.address}`);
    });
    
    // Save deployment record
    const deploymentRecord = {
      phase: "4-remaining",
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId),
      deployer: deployer.address,
      timestamp: deploymentTimestamp,
      gasPrice: "0.11 gwei",
      contracts: deployedContracts
    };
    
    const recordPath = path.join(__dirname, `../../deployments/phase4-remaining-${deploymentTimestamp}.json`);
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`\n💾 Phase 4 record saved: ${recordPath}`);
    console.log("\n🎉 Phase 4 completed successfully!");
    console.log("\n⚡ Next steps:");
    console.log("1. Run: npm run verify:all (to verify all contracts)");
    console.log("2. Run: npm run setup:connections (to configure contract connections)");
    console.log("3. Run: npm run extract-abi (to update frontend ABIs)");
    
  } catch (error) {
    console.error("\n❌ Phase 4 deployment failed:", error.message);
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
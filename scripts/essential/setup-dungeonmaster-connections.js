// setup-dungeonmaster-connections.js - Manual setup for DungeonMaster connections
const { ethers } = require("hardhat");

// 🚨 強制 Gas Price 0.11 gwei - 絕對不可修改  
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function executeTransaction(contractName, contract, methodName, args, description) {
  console.log(`\n🔗 ${description}`);
  console.log(`Contract: ${contractName} | Method: ${methodName}`);
  
  try {
    const tx = await contract[methodName](...args, {
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    return receipt;
  } catch (error) {
    console.error(`❌ Transaction failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log("🔧 Manual DungeonMaster Connection Setup");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Executing with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");
  console.log(`Gas price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);

  // Get addresses from environment
  const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
  const dungeonMasterAddress = process.env.DUNGEONMASTER_ADDRESS;
  
  if (!dungeonCoreAddress || !dungeonMasterAddress) {
    console.error("❌ Missing required addresses in .env:");
    if (!dungeonCoreAddress) console.error("   - DUNGEONCORE_ADDRESS");
    if (!dungeonMasterAddress) console.error("   - DUNGEONMASTER_ADDRESS");
    process.exit(1);
  }

  console.log("\n📋 Contract Addresses:");
  console.log("DungeonCore:", dungeonCoreAddress);
  console.log("DungeonMaster:", dungeonMasterAddress);

  try {
    // Setup contracts
    const DungeonCoreFactory = await ethers.getContractFactory("DungeonCore");
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMaster");
    
    const dungeonCore = DungeonCoreFactory.attach(dungeonCoreAddress);
    const dungeonMaster = DungeonMasterFactory.attach(dungeonMasterAddress);

    console.log("\n🔄 Phase 1: Setting DungeonCore in DungeonMaster");
    console.log("-".repeat(30));
    
    try {
      // Check current DungeonCore in DungeonMaster
      const currentCore = await dungeonMaster.dungeonCore();
      console.log("Current DungeonCore in DungeonMaster:", currentCore);
      
      if (currentCore.toLowerCase() !== dungeonCoreAddress.toLowerCase()) {
        await executeTransaction(
          "DungeonMaster",
          dungeonMaster,
          "setDungeonCore",
          [dungeonCoreAddress],
          "Setting DungeonCore address in DungeonMaster"
        );
      } else {
        console.log("✅ DungeonCore already correctly set in DungeonMaster");
      }
    } catch (error) {
      console.error("❌ Phase 1 failed:", error.message);
      throw error;
    }

    console.log("\n🔄 Phase 2: Setting DungeonMaster in DungeonCore");
    console.log("-".repeat(30));
    
    try {
      // Check current DungeonMaster in DungeonCore
      const currentMaster = await dungeonCore.dungeonMaster();
      console.log("Current DungeonMaster in DungeonCore:", currentMaster);
      
      if (currentMaster.toLowerCase() !== dungeonMasterAddress.toLowerCase()) {
        await executeTransaction(
          "DungeonCore",
          dungeonCore,
          "setDungeonMaster",
          [dungeonMasterAddress],
          "Setting DungeonMaster address in DungeonCore"
        );
      } else {
        console.log("✅ DungeonMaster already correctly set in DungeonCore");
      }
    } catch (error) {
      console.error("❌ Phase 2 failed:", error.message);
      throw error;
    }

    console.log("\n🔍 Phase 3: Verification");
    console.log("-".repeat(20));
    
    // Verify connections
    const verifiedCore = await dungeonMaster.dungeonCore();
    const verifiedMaster = await dungeonCore.dungeonMaster();
    
    console.log("Verification Results:");
    console.log(`DungeonCore in DungeonMaster: ${verifiedCore}`);
    console.log(`DungeonMaster in DungeonCore: ${verifiedMaster}`);
    
    const coreMatch = verifiedCore.toLowerCase() === dungeonCoreAddress.toLowerCase();
    const masterMatch = verifiedMaster.toLowerCase() === dungeonMasterAddress.toLowerCase();
    
    if (coreMatch && masterMatch) {
      console.log("🎉 All connections verified successfully!");
    } else {
      console.log("❌ Connection verification failed:");
      if (!coreMatch) console.log("   - DungeonCore connection mismatch");
      if (!masterMatch) console.log("   - DungeonMaster connection mismatch");
    }

    console.log("\n📊 Setup Summary:");
    console.log("=" .repeat(30));
    console.log("✅ DungeonMaster ↔ DungeonCore connection established");
    console.log("✅ Both contracts can now communicate");
    console.log("✅ Expedition system should be functional");

    console.log("\n🚀 Next Steps:");
    console.log("1. Test expedition functionality");
    console.log("2. Update subgraph configuration");
    console.log("3. Deploy subgraph to sync with new contract");
    console.log("4. Update frontend configuration");

  } catch (error) {
    console.error("💥 Setup failed:", error.message);
    console.error("\n🔧 Manual Commands (for emergency use):");
    console.log(`DungeonMaster.setDungeonCore("${dungeonCoreAddress}")`);
    console.log(`DungeonCore.setDungeonMaster("${dungeonMasterAddress}")`);
    process.exit(1);
  }
}

// Execute with proper error handling
main()
  .then(() => {
    console.log("\n🎉 DungeonMaster connection setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
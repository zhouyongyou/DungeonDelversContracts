// redeploy-dungeonmaster.js - Redeploy DungeonMaster with CORE interconnection
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// 🚨 強制 Gas Price 0.11 gwei - 絕對不可修改
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("⚔️ Redeploying DungeonMaster with CORE Integration");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");
  console.log(`Gas price: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);

  // Validate required addresses
  const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;
  if (!dungeonCoreAddress) {
    console.error("❌ DUNGEONCORE_ADDRESS not found in .env");
    process.exit(1);
  }
  console.log("DungeonCore address:", dungeonCoreAddress);

  try {
    // Phase 1: Deploy DungeonMaster
    console.log("\n🚀 Phase 1: Deploying DungeonMaster...");
    
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMaster");
    const dungeonMaster = await DungeonMasterFactory.deploy({
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });

    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    
    console.log("✅ DungeonMaster deployed at:", dungeonMasterAddress);

    // Phase 2: Set DungeonCore in DungeonMaster
    console.log("\n🔗 Phase 2: Setting DungeonCore connection...");
    
    try {
      const setCoreTx = await dungeonMaster.setDungeonCore(dungeonCoreAddress, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });
      
      console.log(`📤 Setting DungeonCore transaction: ${setCoreTx.hash}`);
      await setCoreTx.wait();
      console.log("✅ DungeonCore address set in DungeonMaster");
    } catch (coreError) {
      console.warn("⚠️  Failed to set DungeonCore in DungeonMaster:", coreError.message);
      console.log("💡 This might need to be done manually after deployment");
    }

    // Phase 3: Update .env file
    console.log("\n📝 Phase 3: Updating .env file...");
    
    const envPath = path.join(__dirname, "../../.env");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update both VITE_ and non-VITE versions
    envContent = envContent.replace(
      /VITE_DUNGEONMASTER_ADDRESS=.*/,
      `VITE_DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`
    );
    envContent = envContent.replace(
      /DUNGEONMASTER_ADDRESS=.*/,
      `DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with new DungeonMaster address");

    // Phase 4: Update ABI file
    console.log("\n📋 Phase 4: Updating ABI file...");
    
    const artifactPath = path.join(__dirname, "../../artifacts/contracts/current/core/DungeonMaster.sol/DungeonMaster.json");
    const abiDestPath = path.join(__dirname, "../../abis/DungeonMaster.json");
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(abiDestPath, JSON.stringify(artifact.abi, null, 2));
      console.log("✅ Updated DungeonMaster ABI file");
    } else {
      console.warn("⚠️  DungeonMaster artifact not found, ABI not updated");
    }

    // Phase 5: Setup CORE interconnection
    console.log("\n🔄 Phase 5: Setting up CORE interconnection...");
    
    try {
      const DungeonCoreFactory = await ethers.getContractFactory("DungeonCore");
      const dungeonCore = DungeonCoreFactory.attach(dungeonCoreAddress);
      
      const setMasterTx = await dungeonCore.setDungeonMaster(dungeonMasterAddress, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });
      
      console.log(`📤 Setting DungeonMaster in Core transaction: ${setMasterTx.hash}`);
      await setMasterTx.wait();
      console.log("✅ DungeonMaster address set in DungeonCore");
      
    } catch (interconnectError) {
      console.warn("⚠️  Failed to set DungeonMaster in DungeonCore:", interconnectError.message);
      console.log("💡 This might need to be done manually using the setup script");
    }

    // Phase 6: Verify configuration
    console.log("\n🔍 Phase 6: Verifying configuration...");
    
    try {
      const storedCore = await dungeonMaster.dungeonCore();
      console.log("DungeonCore in DungeonMaster:", storedCore);
      
      if (storedCore.toLowerCase() === dungeonCoreAddress.toLowerCase()) {
        console.log("✅ DungeonCore connection verified");
      } else {
        console.log("❌ DungeonCore connection mismatch");
      }
    } catch (verifyError) {
      console.warn("⚠️  Verification failed:", verifyError.message);
    }

    console.log("\n🎯 Deployment Summary:");
    console.log("=" .repeat(40));
    console.log("DungeonMaster:", dungeonMasterAddress);
    console.log("DungeonCore:", dungeonCoreAddress);
    console.log(`Gas Used: ${ethers.formatUnits(GAS_PRICE, "gwei")} gwei`);

    console.log("\n⚠️  Next Steps:");
    console.log("1. Verify DungeonMaster connection in DungeonCore using:");
    console.log("   node scripts/essential/test-contract-connections.js");
    console.log("2. Update subgraph configuration with new DungeonMaster address");
    console.log("3. Sync configuration to frontend using:");
    console.log("   node scripts/ultimate-config-system.js sync");
    console.log("4. Test expedition functionality");

    console.log("\n🔧 Manual Setup Commands (if automated setup failed):");
    console.log(`DungeonCore.setDungeonMaster("${dungeonMasterAddress}")`);
    console.log(`DungeonMaster.setDungeonCore("${dungeonCoreAddress}")`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    console.error("Error details:", error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("💰 Please ensure sufficient BNB balance for gas fees");
    }
    
    process.exit(1);
  }
}

// Execute with proper error handling
main()
  .then(() => {
    console.log("\n🎉 DungeonMaster redeploy completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
// setup-playerprofile-dungeoncore.js - Set dungeonCore address in PlayerProfile contract
const { ethers } = require("hardhat");

// Load addresses from environment variables
const playerProfileAddress = process.env.PLAYERPROFILE_ADDRESS;
const dungeonCoreAddress = process.env.DUNGEONCORE_ADDRESS;

if (!playerProfileAddress) {
  console.error('❌ PLAYERPROFILE_ADDRESS not found in environment variables');
  process.exit(1);
}

if (!dungeonCoreAddress) {
  console.error('❌ DUNGEONCORE_ADDRESS not found in environment variables');
  process.exit(1);
}

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 2000000;

async function main() {
  console.log("🔗 Setting dungeonCore address in PlayerProfile contract");
  console.log("=".repeat(60));
  
  const [signer] = await ethers.getSigners();
  console.log(`📍 Using account: ${signer.address}`);
  console.log(`🏰 PlayerProfile contract: ${playerProfileAddress}`);
  console.log(`⚡ DungeonCore address to set: ${dungeonCoreAddress}`);
  
  // Get PlayerProfile contract instance
  const playerProfile = await ethers.getContractAt("PlayerProfile", playerProfileAddress);
  
  try {
    // Check current dungeonCore address
    console.log("\n🔍 Checking current dungeonCore address...");
    const currentDungeonCore = await playerProfile.dungeonCore();
    console.log(`   Current: ${currentDungeonCore}`);
    
    if (currentDungeonCore.toLowerCase() === dungeonCoreAddress.toLowerCase()) {
      console.log("✅ DungeonCore address is already correctly set!");
      return;
    }
    
    // Set the dungeonCore address
    console.log("\n🔧 Setting dungeonCore address...");
    const tx = await playerProfile.setDungeonCore(dungeonCoreAddress, {
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    
    // Verify the change
    console.log("\n🔍 Verifying the change...");
    const newDungeonCore = await playerProfile.dungeonCore();
    console.log(`   New dungeonCore: ${newDungeonCore}`);
    
    if (newDungeonCore.toLowerCase() === dungeonCoreAddress.toLowerCase()) {
      console.log("🎉 DungeonCore address successfully set in PlayerProfile!");
    } else {
      console.error("❌ Verification failed - address not set correctly");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ Failed to set dungeonCore address:", error.message);
    
    // Common error messages and solutions
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.error("💡 Solution: Use the owner account that deployed PlayerProfile");
    } else if (error.message.includes("zero address")) {
      console.error("💡 Solution: Ensure dungeonCore address is valid");
    } else if (error.message.includes("gas")) {
      console.error("💡 Solution: Try increasing gas limit or gas price");
    }
    
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Setup failed:", error);
      process.exit(1);
    });
}

module.exports = main;
// verify-dungeonmaster-setup.js - Comprehensive verification of DungeonMaster setup
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 DungeonMaster Setup Verification");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("Verifying with account:", deployer.address);

  // Get addresses from environment
  const addresses = {
    dungeonCore: process.env.DUNGEONCORE_ADDRESS,
    dungeonMaster: process.env.DUNGEONMASTER_ADDRESS,
    oracle: process.env.ORACLE_ADDRESS,
    vrfManager: process.env.VRF_MANAGER_V2PLUS_ADDRESS
  };

  // Check required addresses
  const missingAddresses = Object.entries(addresses)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingAddresses.length > 0) {
    console.error("❌ Missing required addresses in .env:");
    missingAddresses.forEach(addr => console.error(`   - ${addr.toUpperCase()}_ADDRESS`));
    process.exit(1);
  }

  console.log("\n📋 Contract Addresses:");
  Object.entries(addresses).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  try {
    // Setup contract instances
    const DungeonCoreFactory = await ethers.getContractFactory("DungeonCore");
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMaster");
    
    const dungeonCore = DungeonCoreFactory.attach(addresses.dungeonCore);
    const dungeonMaster = DungeonMasterFactory.attach(addresses.dungeonMaster);

    console.log("\n🔗 Phase 1: Connection Verification");
    console.log("-".repeat(30));

    // Test 1: DungeonCore in DungeonMaster
    try {
      const coreInMaster = await dungeonMaster.dungeonCore();
      const coreMatch = coreInMaster.toLowerCase() === addresses.dungeonCore.toLowerCase();
      
      console.log(`DungeonCore in DungeonMaster: ${coreInMaster}`);
      console.log(`✅ Match: ${coreMatch ? 'YES' : 'NO'}`);
      
      if (!coreMatch) {
        console.log("❌ DungeonCore address mismatch in DungeonMaster");
      }
    } catch (error) {
      console.log("❌ Failed to read DungeonCore from DungeonMaster:", error.message);
    }

    // Test 2: DungeonMaster in DungeonCore
    try {
      const masterInCore = await dungeonCore.dungeonMaster();
      const masterMatch = masterInCore.toLowerCase() === addresses.dungeonMaster.toLowerCase();
      
      console.log(`DungeonMaster in DungeonCore: ${masterInCore}`);
      console.log(`✅ Match: ${masterMatch ? 'YES' : 'NO'}`);
      
      if (!masterMatch) {
        console.log("❌ DungeonMaster address mismatch in DungeonCore");
      }
    } catch (error) {
      console.log("❌ Failed to read DungeonMaster from DungeonCore:", error.message);
    }

    console.log("\n⚙️  Phase 2: Contract State Verification");
    console.log("-".repeat(35));

    // Test 3: DungeonMaster basic parameters
    try {
      const owner = await dungeonMaster.owner();
      const explorationFee = await dungeonMaster.explorationFee();
      const rewardMultiplier = await dungeonMaster.globalRewardMultiplier();
      const cooldownPeriod = await dungeonMaster.COOLDOWN_PERIOD();
      
      console.log("DungeonMaster Configuration:");
      console.log(`  Owner: ${owner}`);
      console.log(`  Exploration Fee: ${ethers.formatEther(explorationFee)} BNB`);
      console.log(`  Global Reward Multiplier: ${rewardMultiplier}`);
      console.log(`  Cooldown Period: ${cooldownPeriod} seconds (${cooldownPeriod / 3600} hours)`);
      
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("✅ Deployer is owner");
      } else {
        console.log("⚠️  Deployer is not owner");
      }
    } catch (error) {
      console.log("❌ Failed to read DungeonMaster configuration:", error.message);
    }

    // Test 4: DungeonCore basic state  
    try {
      const coreOwner = await dungeonCore.owner();
      const oracle = await dungeonCore.oracle();
      const vrfManager = await dungeonCore.vrfManager();
      
      console.log("\nDungeonCore Configuration:");
      console.log(`  Owner: ${coreOwner}`);
      console.log(`  Oracle: ${oracle}`);
      console.log(`  VRF Manager: ${vrfManager}`);
      
      // Check if other addresses match
      const oracleMatch = oracle.toLowerCase() === addresses.oracle.toLowerCase();
      const vrfMatch = vrfManager.toLowerCase() === addresses.vrfManager.toLowerCase();
      
      console.log(`  Oracle Match: ${oracleMatch ? '✅ YES' : '❌ NO'}`);
      console.log(`  VRF Manager Match: ${vrfMatch ? '✅ YES' : '❌ NO'}`);
      
    } catch (error) {
      console.log("❌ Failed to read DungeonCore configuration:", error.message);
    }

    console.log("\n🧪 Phase 3: Functional Tests");
    console.log("-".repeat(25));

    // Test 5: Check if contracts are paused
    try {
      const masterPaused = await dungeonMaster.paused();
      const corePaused = await dungeonCore.paused();
      
      console.log(`DungeonMaster Paused: ${masterPaused ? '⏸️  YES' : '▶️  NO'}`);
      console.log(`DungeonCore Paused: ${corePaused ? '⏸️  YES' : '▶️  NO'}`);
      
      if (masterPaused || corePaused) {
        console.log("⚠️  Some contracts are paused - they may need to be unpaused");
      }
    } catch (error) {
      console.log("❌ Failed to check pause status:", error.message);
    }

    // Test 6: Check events (recent deployment)
    try {
      const latestBlock = await ethers.provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 1000); // Check last 1000 blocks
      
      const masterEvents = await dungeonMaster.queryFilter(
        dungeonMaster.filters.DungeonCoreSet(),
        fromBlock
      );
      
      console.log(`\nRecent DungeonCoreSet events: ${masterEvents.length}`);
      if (masterEvents.length > 0) {
        const latest = masterEvents[masterEvents.length - 1];
        console.log(`  Latest: Block ${latest.blockNumber}, Address: ${latest.args[0]}`);
      }
      
    } catch (error) {
      console.log("⚠️  Could not check recent events:", error.message);
    }

    console.log("\n📊 Verification Summary");
    console.log("=" .repeat(25));
    
    // Overall health check
    let healthScore = 0;
    let maxScore = 6;
    
    // Check each component
    try {
      const coreInMaster = await dungeonMaster.dungeonCore();
      if (coreInMaster.toLowerCase() === addresses.dungeonCore.toLowerCase()) healthScore++;
    } catch {}
    
    try {
      const masterInCore = await dungeonCore.dungeonMaster();
      if (masterInCore.toLowerCase() === addresses.dungeonMaster.toLowerCase()) healthScore++;
    } catch {}
    
    try {
      const owner = await dungeonMaster.owner();
      if (owner && owner !== ethers.ZeroAddress) healthScore++;
    } catch {}
    
    try {
      const coreOwner = await dungeonCore.owner();
      if (coreOwner && coreOwner !== ethers.ZeroAddress) healthScore++;
    } catch {}
    
    try {
      const masterPaused = await dungeonMaster.paused();
      const corePaused = await dungeonCore.paused();
      if (!masterPaused && !corePaused) healthScore++;
    } catch {}
    
    try {
      const oracle = await dungeonCore.oracle();
      if (oracle && oracle !== ethers.ZeroAddress) healthScore++;
    } catch {}

    const healthPercentage = Math.round((healthScore / maxScore) * 100);
    console.log(`Health Score: ${healthScore}/${maxScore} (${healthPercentage}%)`);
    
    if (healthPercentage >= 90) {
      console.log("🎉 Excellent! DungeonMaster setup is fully operational");
    } else if (healthPercentage >= 70) {
      console.log("✅ Good! DungeonMaster setup is mostly working");
    } else if (healthPercentage >= 50) {
      console.log("⚠️  Warning! DungeonMaster setup needs attention");
    } else {
      console.log("❌ Critical! DungeonMaster setup has major issues");
    }

    console.log("\n🔧 Recommendations:");
    if (healthPercentage < 100) {
      console.log("1. Run connection setup script:");
      console.log("   node scripts/essential/setup-dungeonmaster-connections.js");
      console.log("2. Check contract ownership and permissions");
      console.log("3. Verify gas settings and account balance");
    } else {
      console.log("✅ All systems operational!");
      console.log("1. Test expedition functionality");
      console.log("2. Update subgraph with new address");
      console.log("3. Sync frontend configuration");
    }

  } catch (error) {
    console.error("💥 Verification failed:", error.message);
    process.exit(1);
  }
}

// Execute with proper error handling
main()
  .then(() => {
    console.log("\n✅ DungeonMaster verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
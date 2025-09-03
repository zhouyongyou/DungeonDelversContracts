// setup-contract-connections.js - Setup contract interconnections
const { ethers } = require("hardhat");

// All deployed contract addresses - ENV-ONLY mode
const addresses = {
  testUSD1: process.env.USD_ADDRESS,
  soulShard: process.env.SOULSHARD_ADDRESS,
  oracle: process.env.ORACLE_ADDRESS,
  dungeonCore: process.env.DUNGEONCORE_ADDRESS,
  playerVault: process.env.PLAYERVAULT_ADDRESS,
  hero: process.env.HERO_ADDRESS,
  relic: process.env.RELIC_ADDRESS,
  party: process.env.PARTY_ADDRESS,
  playerProfile: process.env.PLAYERPROFILE_ADDRESS,
  vipStaking: process.env.VIPSTAKING_ADDRESS,
  vrfConsumer: process.env.VRF_MANAGER_V2PLUS_ADDRESS,
  altarOfAscension: process.env.ALTAROFASCENSION_ADDRESS,
  dungeonMaster: process.env.DUNGEONMASTER_ADDRESS,
  dungeonStorage: process.env.DUNGEONSTORAGE_ADDRESS,
  v3Pool: process.env.V3_POOL_ADDRESS
};

// Validate all addresses are provided
const missingAddresses = Object.entries(addresses)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingAddresses.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingAddresses.forEach(addr => console.error(`   - ${addr.toUpperCase()}_ADDRESS`));
  process.exit(1);
}

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
    console.error(`❌ Failed to execute ${methodName} on ${contractName}:`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  console.log("🔗 Setting up contract interconnections");
  console.log("=".repeat(60));
  
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Get contract instances
  const contracts = {
    dungeonCore: await ethers.getContractAt("DungeonCore", addresses.dungeonCore),
    playerVault: await ethers.getContractAt("PlayerVault", addresses.playerVault),
    hero: await ethers.getContractAt("Hero", addresses.hero),
    relic: await ethers.getContractAt("Relic", addresses.relic),
    party: await ethers.getContractAt("Party", addresses.party),
    playerProfile: await ethers.getContractAt("PlayerProfile", addresses.playerProfile),
    vipStaking: await ethers.getContractAt("VIPStaking", addresses.vipStaking),
    altarOfAscension: await ethers.getContractAt("AltarOfAscension", addresses.altarOfAscension),
    dungeonMaster: await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster),
    dungeonStorage: await ethers.getContractAt("DungeonStorage", addresses.dungeonStorage)
  };

  console.log("\n🏰 Phase 1: Setup DungeonCore connections");
  console.log("-".repeat(40));
  
  try {
    // Set Oracle in DungeonCore
    await executeTransaction(
      "DungeonCore", 
      contracts.dungeonCore, 
      "setOracle", 
      [addresses.oracle],
      "Setting Oracle address in DungeonCore"
    );

    // Set PlayerVault in DungeonCore  
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setPlayerVault", 
      [addresses.playerVault],
      "Setting PlayerVault address in DungeonCore"
    );

    // Set Hero Contract in DungeonCore
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setHeroContract",
      [addresses.hero],
      "Setting Hero contract address in DungeonCore"
    );

    // Set Relic Contract in DungeonCore  
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setRelicContract",
      [addresses.relic], 
      "Setting Relic contract address in DungeonCore"
    );

    // Set Party Contract in DungeonCore
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setPartyContract",
      [addresses.party],
      "Setting Party contract address in DungeonCore"
    );

    // Set PlayerProfile in DungeonCore
    await executeTransaction(
      "DungeonCore", 
      contracts.dungeonCore,
      "setPlayerProfile",
      [addresses.playerProfile],
      "Setting PlayerProfile address in DungeonCore"
    );

    // Set VIPStaking in DungeonCore
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore, 
      "setVipStaking",
      [addresses.vipStaking],
      "Setting VIPStaking address in DungeonCore"
    );

    // Set AltarOfAscension in DungeonCore
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setAltarOfAscension", 
      [addresses.altarOfAscension],
      "Setting AltarOfAscension address in DungeonCore"
    );

    // Set DungeonMaster in DungeonCore
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setDungeonMaster",
      [addresses.dungeonMaster],
      "Setting DungeonMaster address in DungeonCore"  
    );

    // Set VRFManager in DungeonCore (using VRFConsumer as VRF Manager)
    await executeTransaction(
      "DungeonCore",
      contracts.dungeonCore,
      "setVRFManager",
      [addresses.vrfConsumer],
      "Setting VRF Manager address in DungeonCore"
    );

    // Set DungeonStorage in DungeonCore
    await executeTransaction(
      "DungeonCore", 
      contracts.dungeonCore,
      "setDungeonStorage",
      [addresses.dungeonStorage],
      "Setting DungeonStorage address in DungeonCore"
    );

    console.log("\n✅ Phase 1 completed: DungeonCore connections setup");

  } catch (error) {
    console.error("❌ Phase 1 failed:", error.message);
    throw error;
  }

  console.log("\n📊 Phase 2: Setup cross-contract permissions");
  console.log("-".repeat(40));
  
  try {
    // These would depend on the specific contract implementations
    // Example permissions (adjust based on actual contract requirements):
    
    // Allow Hero contract to mint/access player profiles
    // Allow Relic contract to access player vaults
    // Allow VIPStaking to access soul shard balances
    // etc.
    
    console.log("⚠️  Cross-contract permissions need to be set based on specific contract requirements");
    console.log("    This includes setting approved operators, minters, and spending allowances");
    
  } catch (error) {
    console.error("❌ Phase 2 failed:", error.message);
  }

  console.log("\n🎉 Contract interconnection setup completed!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify all contract connections are working");
  console.log("2. Set up any required token approvals"); 
  console.log("3. Configure game-specific parameters");
  console.log("4. Test end-to-end functionality");

  console.log("\n📊 Contract Summary:");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, addresses };
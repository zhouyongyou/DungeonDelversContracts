// verify-all-contract-connections.js - Verify all contract address mappings are correct
const { ethers } = require("hardhat");

// Load addresses from environment variables
const addresses = {
  dungeonCore: process.env.DUNGEONCORE_ADDRESS,
  hero: process.env.HERO_ADDRESS,
  relic: process.env.RELIC_ADDRESS,
  party: process.env.PARTY_ADDRESS,
  playerProfile: process.env.PLAYERPROFILE_ADDRESS,
  vipStaking: process.env.VIPSTAKING_ADDRESS,
  altarOfAscension: process.env.ALTAROFASCENSION_ADDRESS,
  playerVault: process.env.PLAYERVAULT_ADDRESS,
  dungeonMaster: process.env.DUNGEONMASTER_ADDRESS,
  dungeonStorage: process.env.DUNGEONSTORAGE_ADDRESS,
  oracle: process.env.ORACLE_ADDRESS,
  vrfManager: process.env.VRF_MANAGER_V2PLUS_ADDRESS,
  soulShard: process.env.SOULSHARD_ADDRESS
};

async function checkContractConnection(contractName, contractAddress, methodName, expectedAddress, description) {
  try {
    const contract = await ethers.getContractAt(contractName, contractAddress);
    const actualAddress = await contract[methodName]();
    
    const isCorrect = actualAddress.toLowerCase() === expectedAddress.toLowerCase();
    const status = isCorrect ? "✅" : "❌";
    
    console.log(`${status} ${description}`);
    console.log(`   Expected: ${expectedAddress}`);
    console.log(`   Actual:   ${actualAddress}`);
    
    if (!isCorrect) {
      console.log(`   ⚠️  MISMATCH DETECTED!`);
    }
    
    return isCorrect;
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Verifying all contract address mappings");
  console.log("=".repeat(70));
  
  let allCorrect = true;
  const issues = [];

  console.log("\n🏰 SECTION 1: DungeonCore → Other Contracts");
  console.log("-".repeat(50));
  
  const dungeonCoreChecks = [
    { method: "heroContractAddress", expected: addresses.hero, desc: "DungeonCore → Hero" },
    { method: "relicContractAddress", expected: addresses.relic, desc: "DungeonCore → Relic" },
    { method: "partyContractAddress", expected: addresses.party, desc: "DungeonCore → Party" },
    { method: "playerProfileAddress", expected: addresses.playerProfile, desc: "DungeonCore → PlayerProfile" },
    { method: "vipStakingAddress", expected: addresses.vipStaking, desc: "DungeonCore → VIPStaking" },
    { method: "altarOfAscensionAddress", expected: addresses.altarOfAscension, desc: "DungeonCore → AltarOfAscension" },
    { method: "playerVaultAddress", expected: addresses.playerVault, desc: "DungeonCore → PlayerVault" },
    { method: "dungeonMasterAddress", expected: addresses.dungeonMaster, desc: "DungeonCore → DungeonMaster" },
    { method: "oracleAddress", expected: addresses.oracle, desc: "DungeonCore → Oracle" },
    { method: "vrfManager", expected: addresses.vrfManager, desc: "DungeonCore → VRF Manager" },
    { method: "soulShardTokenAddress", expected: addresses.soulShard, desc: "DungeonCore → SoulShard" },
    { method: "dungeonStorageAddress", expected: addresses.dungeonStorage, desc: "DungeonCore → DungeonStorage" }
  ];

  for (const check of dungeonCoreChecks) {
    const result = await checkContractConnection(
      "DungeonCore", 
      addresses.dungeonCore, 
      check.method, 
      check.expected, 
      check.desc
    );
    if (!result) {
      allCorrect = false;
      issues.push(`${check.desc}: Expected ${check.expected}, method: ${check.method}`);
    }
  }

  console.log("\n🔄 SECTION 2: Other Contracts → DungeonCore");
  console.log("-".repeat(50));
  
  const backConnectionChecks = [
    { contract: "Hero", address: addresses.hero, method: "dungeonCore", desc: "Hero → DungeonCore" },
    { contract: "Relic", address: addresses.relic, method: "dungeonCore", desc: "Relic → DungeonCore" },
    { contract: "Party", address: addresses.party, method: "dungeonCoreContract", desc: "Party → DungeonCore" },
    { contract: "PlayerProfile", address: addresses.playerProfile, method: "dungeonCore", desc: "PlayerProfile → DungeonCore" },
    { contract: "VIPStaking", address: addresses.vipStaking, method: "dungeonCore", desc: "VIPStaking → DungeonCore" },
    { contract: "AltarOfAscension", address: addresses.altarOfAscension, method: "dungeonCore", desc: "AltarOfAscension → DungeonCore" },
    { contract: "PlayerVault", address: addresses.playerVault, method: "dungeonCore", desc: "PlayerVault → DungeonCore" },
    { contract: "DungeonMaster", address: addresses.dungeonMaster, method: "dungeonCore", desc: "DungeonMaster → DungeonCore" },
    { contract: "DungeonStorage", address: addresses.dungeonStorage, method: "dungeonCore", desc: "DungeonStorage → DungeonCore" }
  ];

  for (const check of backConnectionChecks) {
    const result = await checkContractConnection(
      check.contract, 
      check.address, 
      check.method, 
      addresses.dungeonCore, 
      check.desc
    );
    if (!result) {
      allCorrect = false;
      issues.push(`${check.desc}: Expected ${addresses.dungeonCore}, method: ${check.method}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  
  if (allCorrect) {
    console.log("🎉 ALL CONTRACT CONNECTIONS ARE CORRECT!");
    console.log("✅ All addresses match expected values");
    console.log("✅ No mismatches detected");
  } else {
    console.log("⚠️  ISSUES DETECTED:");
    console.log(`❌ Found ${issues.length} mismatched connections:`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log("\n💡 To fix these issues:");
    console.log("1. Use the setup-contract-connections.js script");
    console.log("2. Or use individual setup scripts for specific contracts");
    console.log("3. Make sure you're using the owner account for transactions");
  }
  
  console.log("\n📊 Configuration Summary:");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("💥 Verification failed:", error);
      process.exit(1);
    });
}

module.exports = main;
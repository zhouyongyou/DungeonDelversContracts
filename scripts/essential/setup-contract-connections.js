// setup-contract-connections.js - Setup contract interconnections
const { ethers } = require("hardhat");

// All deployed contract addresses
const addresses = {
  // Phase 1: Tokens
  testUSD1: "0x916a2a1eb605e88561139c56af0698de241169f2",
  soulShard: "0x1a98769b8034d400745cc658dc204cd079de36fa",
  
  // Phase 2: Oracle  
  oracle: "0x21928de992cb31ede864b62bc94002fb449c2738",
  
  // Phase 3: Core
  dungeonCore: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
  
  // Phase 4: Remaining
  playerVault: "0xe3c03d3e270d7eb3f8e27017790135f5a885a66f",
  hero: "0xdb40cb3a1ba6fd3e8e6323c296f3f17cc7ec9c0e",
  relic: "0xb6038db5c6a168c74995dc9a0c8a6ab1910198fd",
  party: "0xb393e482495bacde5aaf08d25323146cc5b9567f",
  playerProfile: "0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b",
  vipStaking: "0x409d964675235a5a00f375053535fce9f6e79882",
  vrfConsumer: "0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40",
  altarOfAscension: "0x7f4b3d0ff2994182200fc3b306fb5b035680de3c",
  dungeonMaster: "0xdbee76d1c6e94f93ceecf743a0a0132c57371254",
  dungeonStorage: "0x30dcbe703b258fa1e421d22c8ada643da51ceb4c",
  
  // Infrastructure
  v3Pool: "0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba"
};

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
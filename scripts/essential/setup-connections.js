// setup-connections.js - Configure contract interconnections and permissions
// BSC gas optimized: 0.11 gwei for all transactions

const { ethers } = require("hardhat");
const fs = require("fs").promises;
const path = require("path");

// BSC Gas Optimization
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 300000; // Conservative limit for setup transactions

async function main() {
  console.log("🔗 DungeonDelvers Contract Setup & Interconnection");
  console.log("⚡ BSC Optimized: 0.11 gwei gas price");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Setup account:", deployer.address);

  // Load deployment record
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const files = await fs.readdir(deploymentsDir);
  const deploymentFiles = files.filter(f => f.startsWith("v25-complete-") && f.endsWith(".json"));
  
  if (deploymentFiles.length === 0) {
    throw new Error("No deployment record found. Run 'npm run deploy' first.");
  }

  const latestFile = deploymentFiles.sort().pop();
  const recordPath = path.join(deploymentsDir, latestFile);
  const deploymentRecord = JSON.parse(await fs.readFile(recordPath, "utf8"));
  const contracts = deploymentRecord.contracts;

  console.log(`📋 Using deployment: ${latestFile}\n`);

  // Helper function for gas-optimized transactions
  async function executeTransaction(contract, methodName, args = [], description = "") {
    try {
      console.log(`🔧 ${description || `Executing ${methodName}`}...`);
      
      const tx = await contract[methodName](...args, {
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT
      });
      
      const receipt = await tx.wait();
      console.log(`✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
      return receipt;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      throw error;
    }
  }

  // Get contract instances
  const dungeonCore = await ethers.getContractAt("DungeonCore", contracts.DungeonCore.address);
  const dungeonMaster = await ethers.getContractAt("DungeonMaster", contracts.DungeonMaster.address);
  const dungeonStorage = await ethers.getContractAt("DungeonStorage", contracts.DungeonStorage.address);
  const altarOfAscension = await ethers.getContractAt("AltarOfAscension", contracts.AltarOfAscension.address);
  const hero = await ethers.getContractAt("Hero", contracts.Hero.address);
  const relic = await ethers.getContractAt("Relic", contracts.Relic.address);
  const vrfConsumer = await ethers.getContractAt("VRFConsumerV2Plus", contracts.VRFConsumerV2Plus.address);

  console.log("🚀 Phase 1: DungeonCore Configuration");
  console.log("-".repeat(40));

  // Configure DungeonCore with all contract addresses
  await executeTransaction(
    dungeonCore, 
    "setDungeonMaster", 
    [contracts.DungeonMaster.address],
    "Setting DungeonMaster in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setDungeonStorage", 
    [contracts.DungeonStorage.address],
    "Setting DungeonStorage in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setHeroContract",
    [contracts.Hero.address], 
    "Setting Hero contract in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setRelicContract",
    [contracts.Relic.address],
    "Setting Relic contract in DungeonCore" 
  );

  await executeTransaction(
    dungeonCore,
    "setPartyContract",
    [contracts.Party.address],
    "Setting Party contract in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setPlayerProfile",
    [contracts.PlayerProfile.address],
    "Setting PlayerProfile in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setPlayerVault", 
    [contracts.PlayerVault.address],
    "Setting PlayerVault in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setVipStaking",
    [contracts.VIPStaking.address],
    "Setting VIPStaking in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setOracle",
    [contracts.Oracle.address],
    "Setting Oracle in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setAltarOfAscension",
    [contracts.AltarOfAscension.address], 
    "Setting AltarOfAscension in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setSoulShardToken",
    [contracts.TSOUL.address],
    "Setting TSOUL token in DungeonCore"
  );

  await executeTransaction(
    dungeonCore,
    "setVRFManager",
    [contracts.VRFConsumerV2Plus.address],
    "Setting VRF Manager in DungeonCore"
  );

  console.log("\n🎯 Phase 2: VRF System Configuration");
  console.log("-".repeat(40));

  // Configure VRF authorizations
  await executeTransaction(
    vrfConsumer,
    "authorizeContract",
    [contracts.Hero.address],
    "Authorizing Hero contract in VRF"
  );

  await executeTransaction(
    vrfConsumer,
    "authorizeContract", 
    [contracts.Relic.address],
    "Authorizing Relic contract in VRF"
  );

  await executeTransaction(
    vrfConsumer,
    "authorizeContract",
    [contracts.DungeonMaster.address],
    "Authorizing DungeonMaster in VRF"
  );

  await executeTransaction(
    vrfConsumer,
    "authorizeContract",
    [contracts.AltarOfAscension.address],
    "Authorizing AltarOfAscension in VRF"
  );

  console.log("\n🏰 Phase 3: Contract-to-Core Connections");
  console.log("-".repeat(40));

  // Set DungeonCore in all contracts that need it
  await executeTransaction(
    dungeonMaster,
    "setDungeonCore", 
    [contracts.DungeonCore.address],
    "Setting DungeonCore in DungeonMaster"
  );

  await executeTransaction(
    hero,
    "setDungeonCore",
    [contracts.DungeonCore.address],
    "Setting DungeonCore in Hero"
  );

  await executeTransaction(
    relic,
    "setDungeonCore", 
    [contracts.DungeonCore.address],
    "Setting DungeonCore in Relic"
  );

  await executeTransaction(
    altarOfAscension,
    "setDungeonCore",
    [contracts.DungeonCore.address],
    "Setting DungeonCore in AltarOfAscension"
  );

  console.log("\n🎲 Phase 4: Game Logic Setup");
  console.log("-".repeat(40));

  // Initialize basic dungeon configuration (dungeon ID 1-3)
  const basicDungeons = [
    { id: 1, requiredPower: 100, rewardAmountUSD: 10, baseSuccessRate: 80 },
    { id: 2, requiredPower: 250, rewardAmountUSD: 25, baseSuccessRate: 70 },
    { id: 3, requiredPower: 500, rewardAmountUSD: 50, baseSuccessRate: 60 }
  ];

  for (const dungeon of basicDungeons) {
    await executeTransaction(
      dungeonStorage,
      "setDungeon",
      [
        dungeon.id,
        [
          dungeon.requiredPower,
          dungeon.rewardAmountUSD, 
          dungeon.baseSuccessRate,
          true
        ]
      ],
      `Initializing Dungeon ${dungeon.id} (Power: ${dungeon.requiredPower})`
    );
  }

  // Save setup results
  const setupRecord = {
    timestamp: Date.now(),
    network: "bsc", 
    deploymentTimestamp: deploymentRecord.timestamp,
    setupTransactions: {
      dungeonCoreConnections: 12,
      vrfAuthorizations: 4,
      contractToCoreConnections: 4,
      dungeonInitializations: basicDungeons.length
    },
    contractAddresses: Object.fromEntries(
      Object.entries(contracts).map(([name, info]) => [name, info.address])
    )
  };

  const setupPath = path.join(__dirname, `../../deployments/setup-${Date.now()}.json`);
  await fs.writeFile(setupPath, JSON.stringify(setupRecord, null, 2));

  console.log("\n📊 Setup Summary");
  console.log("=" .repeat(60));
  console.log(`✅ DungeonCore connections: 12 configured`);
  console.log(`✅ VRF authorizations: 4 contracts authorized`);
  console.log(`✅ Contract-to-Core links: 4 established`);
  console.log(`✅ Initial dungeons: ${basicDungeons.length} configured`);
  console.log(`📋 Setup record saved: ${path.basename(setupPath)}`);

  console.log("\n🎉 Contract setup completed successfully!");
  console.log("\n⚡ Next step: npm run extract-abi (update frontend ABIs)");
  console.log("🎮 Your DungeonDelvers contracts are now ready for gameplay!");

  return setupRecord;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Setup failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main };
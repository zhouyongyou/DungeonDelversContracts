const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

/**
 * V26 Deployment Script - Complete Infrastructure Rebuild
 * 
 * This script deploys all contracts with new ownership after private key compromise
 * New owner addresses are generated in .env.v26
 */

async function main() {
  console.log('🚀 Starting V26 Deployment - Complete Infrastructure Rebuild');
  console.log('=' . repeat(70));

  // Load V26 configuration
  require('dotenv').config({ path: '.env.v26' });
  
  const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  const VRF_FUNDER_KEY = process.env.VRF_FUNDER_PRIVATE_KEY;
  
  if (!DEPLOYER_KEY || !OWNER_ADDRESS) {
    throw new Error('Missing required environment variables in .env.v26');
  }

  // Create deployer signer
  const deployer = new hre.ethers.Wallet(DEPLOYER_KEY, hre.ethers.provider);
  console.log(`\n📋 Deployment Configuration:`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  New Owner: ${OWNER_ADDRESS}`);
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Deployer Balance: ${hre.ethers.formatEther(balance)} BNB`);
  
  if (balance < hre.ethers.parseEther("0.3")) {
    throw new Error('Insufficient BNB balance for deployment. Need at least 0.3 BNB');
  }

  const contracts = {};
  const deploymentInfo = {
    version: 'V26',
    network: 'BSC Mainnet',
    chainId: 56,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    owner: OWNER_ADDRESS,
    treasury: TREASURY_ADDRESS,
    contracts: {}
  };

  console.log('\n🔨 Starting Contract Deployment...\n');

  // 1. Deploy Core Infrastructure
  console.log('1️⃣ Deploying Core Infrastructure');
  console.log('-' . repeat(50));

  // Deploy DungeonCore
  const DungeonCore = await hre.ethers.getContractFactory("DungeonCore", deployer);
  contracts.dungeonCore = await DungeonCore.deploy();
  await contracts.dungeonCore.waitForDeployment();
  console.log(`✅ DungeonCore deployed to: ${await contracts.dungeonCore.getAddress()}`);

  // Deploy Oracle
  const Oracle = await hre.ethers.getContractFactory("Oracle", deployer);
  contracts.oracle = await Oracle.deploy(await contracts.dungeonCore.getAddress());
  await contracts.oracle.waitForDeployment();
  console.log(`✅ Oracle deployed to: ${await contracts.oracle.getAddress()}`);

  // Deploy SoulShard Token
  const SoulShard = await hre.ethers.getContractFactory("SoulShard", deployer);
  contracts.soulShard = await SoulShard.deploy();
  await contracts.soulShard.waitForDeployment();
  console.log(`✅ SoulShard deployed to: ${await contracts.soulShard.getAddress()}`);

  // 2. Deploy NFT Contracts
  console.log('\n2️⃣ Deploying NFT Contracts');
  console.log('-' . repeat(50));

  // Deploy Hero NFT
  const Hero = await hre.ethers.getContractFactory("Hero", deployer);
  contracts.hero = await Hero.deploy(await contracts.dungeonCore.getAddress());
  await contracts.hero.waitForDeployment();
  console.log(`✅ Hero NFT deployed to: ${await contracts.hero.getAddress()}`);

  // Deploy Relic NFT
  const Relic = await hre.ethers.getContractFactory("Relic", deployer);
  contracts.relic = await Relic.deploy(await contracts.dungeonCore.getAddress());
  await contracts.relic.waitForDeployment();
  console.log(`✅ Relic NFT deployed to: ${await contracts.relic.getAddress()}`);

  // Deploy Party NFT
  const Party = await hre.ethers.getContractFactory("Party", deployer);
  contracts.party = await Party.deploy(await contracts.dungeonCore.getAddress());
  await contracts.party.waitForDeployment();
  console.log(`✅ Party NFT deployed to: ${await contracts.party.getAddress()}`);

  // 3. Deploy Game Logic Contracts
  console.log('\n3️⃣ Deploying Game Logic Contracts');
  console.log('-' . repeat(50));

  // Deploy DungeonStorage
  const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage", deployer);
  contracts.dungeonStorage = await DungeonStorage.deploy(await contracts.dungeonCore.getAddress());
  await contracts.dungeonStorage.waitForDeployment();
  console.log(`✅ DungeonStorage deployed to: ${await contracts.dungeonStorage.getAddress()}`);

  // Deploy DungeonMaster
  const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster", deployer);
  contracts.dungeonMaster = await DungeonMaster.deploy(await contracts.dungeonCore.getAddress());
  await contracts.dungeonMaster.waitForDeployment();
  console.log(`✅ DungeonMaster deployed to: ${await contracts.dungeonMaster.getAddress()}`);

  // Deploy AltarOfAscension
  const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension", deployer);
  contracts.altarOfAscension = await AltarOfAscension.deploy(await contracts.dungeonCore.getAddress());
  await contracts.altarOfAscension.waitForDeployment();
  console.log(`✅ AltarOfAscension deployed to: ${await contracts.altarOfAscension.getAddress()}`);

  // Deploy PlayerVault
  const PlayerVault = await hre.ethers.getContractFactory("PlayerVault", deployer);
  contracts.playerVault = await PlayerVault.deploy(await contracts.dungeonCore.getAddress());
  await contracts.playerVault.waitForDeployment();
  console.log(`✅ PlayerVault deployed to: ${await contracts.playerVault.getAddress()}`);

  // Deploy PlayerProfile
  const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile", deployer);
  contracts.playerProfile = await PlayerProfile.deploy(await contracts.dungeonCore.getAddress());
  await contracts.playerProfile.waitForDeployment();
  console.log(`✅ PlayerProfile deployed to: ${await contracts.playerProfile.getAddress()}`);

  // Deploy VIPStaking
  const VIPStaking = await hre.ethers.getContractFactory("VIPStaking", deployer);
  contracts.vipStaking = await VIPStaking.deploy(await contracts.dungeonCore.getAddress());
  await contracts.vipStaking.waitForDeployment();
  console.log(`✅ VIPStaking deployed to: ${await contracts.vipStaking.getAddress()}`);

  // 4. Deploy VRF Manager
  console.log('\n4️⃣ Deploying VRF Manager');
  console.log('-' . repeat(50));

  const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus", deployer);
  contracts.vrfManager = await VRFConsumerV2Plus.deploy();
  await contracts.vrfManager.waitForDeployment();
  console.log(`✅ VRF Manager deployed to: ${await contracts.vrfManager.getAddress()}`);

  // 5. Configure Contract Connections
  console.log('\n5️⃣ Configuring Contract Connections');
  console.log('-' . repeat(50));

  // Set all module addresses in DungeonCore
  console.log('Setting module addresses in DungeonCore...');
  await contracts.dungeonCore.setOracle(await contracts.oracle.getAddress());
  await contracts.dungeonCore.setSoulShard(await contracts.soulShard.getAddress());
  await contracts.dungeonCore.setHero(await contracts.hero.getAddress());
  await contracts.dungeonCore.setRelic(await contracts.relic.getAddress());
  await contracts.dungeonCore.setParty(await contracts.party.getAddress());
  await contracts.dungeonCore.setDungeonMaster(await contracts.dungeonMaster.getAddress());
  await contracts.dungeonCore.setDungeonStorage(await contracts.dungeonStorage.getAddress());
  await contracts.dungeonCore.setAltarOfAscension(await contracts.altarOfAscension.getAddress());
  await contracts.dungeonCore.setPlayerVault(await contracts.playerVault.getAddress());
  await contracts.dungeonCore.setPlayerProfile(await contracts.playerProfile.getAddress());
  await contracts.dungeonCore.setVIPStaking(await contracts.vipStaking.getAddress());
  await contracts.dungeonCore.setVRFManager(await contracts.vrfManager.getAddress());
  console.log('✅ All module addresses set in DungeonCore');

  // Configure DungeonMaster
  console.log('Configuring DungeonMaster...');
  await contracts.dungeonMaster.setDungeonStorage(await contracts.dungeonStorage.getAddress());
  console.log('✅ DungeonMaster configured');

  // Configure VRF Manager
  console.log('Configuring VRF Manager...');
  await contracts.vrfManager.setDungeonCore(await contracts.dungeonCore.getAddress());
  await contracts.vrfManager.setAltarOfAscension(await contracts.altarOfAscension.getAddress());
  console.log('✅ VRF Manager configured');

  // 6. Transfer Ownership
  console.log('\n6️⃣ Transferring Ownership to New Owner');
  console.log('-' . repeat(50));

  const contractsToTransfer = [
    'dungeonCore', 'oracle', 'soulShard', 'hero', 'relic', 'party',
    'dungeonMaster', 'dungeonStorage', 'altarOfAscension', 
    'playerVault', 'playerProfile', 'vipStaking', 'vrfManager'
  ];

  for (const contractName of contractsToTransfer) {
    console.log(`Transferring ${contractName} ownership...`);
    await contracts[contractName].transferOwnership(OWNER_ADDRESS);
  }
  console.log(`✅ All contracts transferred to: ${OWNER_ADDRESS}`);

  // 7. Save Deployment Info
  console.log('\n7️⃣ Saving Deployment Information');
  console.log('-' . repeat(50));

  // Collect all addresses
  for (const [name, contract] of Object.entries(contracts)) {
    deploymentInfo.contracts[name] = await contract.getAddress();
  }

  // Save deployment info
  const deploymentPath = path.join(__dirname, '..', 'deployments', `v26-deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentPath}`);

  // Create .env.v26.deployed with addresses
  const envContent = `# V26 Deployed Contract Addresses
# Deployed at: ${deploymentInfo.deployedAt}
# Network: BSC Mainnet

# Core Contracts
DUNGEONCORE_ADDRESS=${deploymentInfo.contracts.dungeonCore}
ORACLE_ADDRESS=${deploymentInfo.contracts.oracle}
SOULSHARD_ADDRESS=${deploymentInfo.contracts.soulShard}

# NFT Contracts
HERO_ADDRESS=${deploymentInfo.contracts.hero}
RELIC_ADDRESS=${deploymentInfo.contracts.relic}
PARTY_ADDRESS=${deploymentInfo.contracts.party}

# Game Contracts
DUNGEONMASTER_ADDRESS=${deploymentInfo.contracts.dungeonMaster}
DUNGEONSTORAGE_ADDRESS=${deploymentInfo.contracts.dungeonStorage}
ALTAROFASCENSION_ADDRESS=${deploymentInfo.contracts.altarOfAscension}
PLAYERVAULT_ADDRESS=${deploymentInfo.contracts.playerVault}
PLAYERPROFILE_ADDRESS=${deploymentInfo.contracts.playerProfile}
VIPSTAKING_ADDRESS=${deploymentInfo.contracts.vipStaking}

# VRF Manager
VRFMANAGER_ADDRESS=${deploymentInfo.contracts.vrfManager}

# Ownership
OWNER_ADDRESS=${OWNER_ADDRESS}
TREASURY_ADDRESS=${TREASURY_ADDRESS}
`;

  fs.writeFileSync('.env.v26.deployed', envContent);
  console.log('✅ Contract addresses saved to .env.v26.deployed');

  // 8. Summary
  console.log('\n' + '=' . repeat(70));
  console.log('🎉 V26 DEPLOYMENT COMPLETE!');
  console.log('=' . repeat(70));
  console.log('\n📋 Deployment Summary:');
  console.log(`  Total Contracts: ${Object.keys(contracts).length}`);
  console.log(`  New Owner: ${OWNER_ADDRESS}`);
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);
  console.log(`  Config File: .env.v26.deployed`);
  console.log(`  Deployment Info: ${deploymentPath}`);
  
  console.log('\n⏭️ Next Steps:');
  console.log('1. Verify contracts on BSCScan');
  console.log('2. Fund VRF subscription with VRF_FUNDER wallet');
  console.log('3. Update frontend with new addresses');
  console.log('4. Test all major functions');
  console.log('5. Update monitoring systems');
  console.log('\n' + '=' . repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
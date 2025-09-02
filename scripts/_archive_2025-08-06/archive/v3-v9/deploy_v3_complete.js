// scripts/deploy_v3_complete.js
// 完整的 V3 版本部署腳本

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// 日誌函數
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 保存部署地址
function saveDeployment(contractName, address, network) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const networkDir = path.join(deploymentsDir, network);
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir);
  }
  
  const deploymentFile = path.join(networkDir, `${contractName}.json`);
  const deployment = {
    address: address,
    deployedAt: new Date().toISOString(),
    network: network,
    contractName: contractName
  };
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
}

// 保存所有地址到一個文件
function saveAllAddresses(addresses, network) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const allAddressesFile = path.join(deploymentsDir, `${network}_all_addresses.json`);
  
  const timestamp = new Date().toISOString();
  const data = {
    network: network,
    deployedAt: timestamp,
    addresses: addresses
  };
  
  fs.writeFileSync(allAddressesFile, JSON.stringify(data, null, 2));
  
  // 同時創建 .env 格式的文件
  const envFile = path.join(deploymentsDir, `${network}_addresses.env`);
  let envContent = `# DungeonDelvers V3 Deployment Addresses\n`;
  envContent += `# Network: ${network}\n`;
  envContent += `# Deployed at: ${timestamp}\n\n`;
  
  Object.entries(addresses).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
  
  fs.writeFileSync(envFile, envContent);
}

async function main() {
  log('\n🚀 Starting DungeonDelvers V3 Complete Deployment', 'bright');
  log('================================================\n', 'bright');
  
  const network = hre.network.name;
  log(`📍 Network: ${network}`, 'cyan');
  
  const [deployer] = await ethers.getSigners();
  log(`👤 Deployer: ${deployer.address}`, 'cyan');
  
  const balance = await deployer.provider.getBalance(deployer.address);
  log(`💰 Balance: ${ethers.formatEther(balance)} BNB\n`, 'cyan');
  
  const addresses = {};
  
  try {
    // ============ Phase 1: Deploy Infrastructure ============
    log('\n📦 Phase 1: Deploying Infrastructure Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 2. Deploy SoulShard Token (需要先部署才能給 Oracle)
    log('\n1️⃣  Deploying SoulShard Token...', 'magenta');
    const SoulShard = await ethers.getContractFactory("Test_SoulShard");
    const soulShard = await SoulShard.deploy(deployer.address);
    await soulShard.waitForDeployment();
    addresses.SOULSHARD_ADDRESS = soulShard.address;
    saveDeployment('SoulShard', soulShard.address, network);
    log(`✅ SoulShard deployed at: ${soulShard.address}`, 'green');
    
    // 1. Deploy Oracle (使用現有的地址)
    log('\n2️⃣  Deploying Oracle...', 'magenta');
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(
      "0x737c5b0430d5aeb104680460179aaa38608b6169", // POOL_ADDRESS from .env
      soulShard.address, // SoulShard token
      "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"  // USD_TOKEN_ADDRESS from .env
    );
    await oracle.deployed();
    addresses.ORACLE_ADDRESS = oracle.address;
    saveDeployment('Oracle', oracle.address, network);
    log(`✅ Oracle deployed at: ${oracle.address}`, 'green');
    
    
    // ============ Phase 2: Deploy Storage Contracts ============
    log('\n📦 Phase 2: Deploying Storage Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 3. Deploy DungeonStorage
    log('\n3️⃣  Deploying DungeonStorage...', 'magenta');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployer.address);
    await dungeonStorage.deployed();
    addresses.DUNGEONSTORAGE_ADDRESS = dungeonStorage.address;
    saveDeployment('DungeonStorage', dungeonStorage.address, network);
    log(`✅ DungeonStorage deployed at: ${dungeonStorage.address}`, 'green');
    
    // ============ Phase 3: Deploy NFT Contracts ============
    log('\n📦 Phase 3: Deploying NFT Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 4. Deploy Hero NFT
    log('\n4️⃣  Deploying Hero NFT...', 'magenta');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await hero.deployed();
    addresses.HERO_ADDRESS = hero.address;
    saveDeployment('Hero', hero.address, network);
    log(`✅ Hero deployed at: ${hero.address}`, 'green');
    
    // 5. Deploy Relic NFT
    log('\n5️⃣  Deploying Relic NFT...', 'magenta');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await relic.deployed();
    addresses.RELIC_ADDRESS = relic.address;
    saveDeployment('Relic', relic.address, network);
    log(`✅ Relic deployed at: ${relic.address}`, 'green');
    
    // 6. Deploy Party V3 NFT
    log('\n6️⃣  Deploying Party V3 NFT...', 'magenta');
    const Party = await ethers.getContractFactory("Party");
    const partyV3 = await Party.deploy(deployer.address);
    await partyV3.deployed();
    addresses.PARTY_ADDRESS = partyV3.address;
    saveDeployment('Party', partyV3.address, network);
    log(`✅ Party V3 deployed at: ${partyV3.address}`, 'green');
    
    // ============ Phase 4: Deploy Game Mechanics ============
    log('\n📦 Phase 4: Deploying Game Mechanics', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 7. Deploy PlayerVault
    log('\n7️⃣  Deploying PlayerVault...', 'magenta');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployer.address);
    await playerVault.deployed();
    addresses.PLAYERVAULT_ADDRESS = playerVault.address;
    saveDeployment('PlayerVault', playerVault.address, network);
    log(`✅ PlayerVault deployed at: ${playerVault.address}`, 'green');
    
    // 8. Deploy PlayerProfile
    log('\n8️⃣  Deploying PlayerProfile...', 'magenta');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployer.address);
    await playerProfile.deployed();
    addresses.PLAYERPROFILE_ADDRESS = playerProfile.address;
    saveDeployment('PlayerProfile', playerProfile.address, network);
    log(`✅ PlayerProfile deployed at: ${playerProfile.address}`, 'green');
    
    // 9. Deploy AltarOfAscension
    log('\n9️⃣  Deploying AltarOfAscension...', 'magenta');
    const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
    const altarOfAscension = await AltarOfAscension.deploy(deployer.address);
    await altarOfAscension.deployed();
    addresses.ALTAROFASCENSION_ADDRESS = altarOfAscension.address;
    saveDeployment('AltarOfAscension', altarOfAscension.address, network);
    log(`✅ AltarOfAscension deployed at: ${altarOfAscension.address}`, 'green');
    
    // 10. Deploy VIPStaking
    log('\n🔟 Deploying VIPStaking...', 'magenta');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployer.address);
    await vipStaking.deployed();
    addresses.VIPSTAKING_ADDRESS = vipStaking.address;
    saveDeployment('VIPStaking', vipStaking.address, network);
    log(`✅ VIPStaking deployed at: ${vipStaking.address}`, 'green');
    
    // ============ Phase 5: Deploy Core Contracts ============
    log('\n📦 Phase 5: Deploying Core Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 11. Deploy DungeonCore
    log('\n1️⃣ 1️⃣  Deploying DungeonCore...', 'magenta');
    const DungeonCore = await ethers.getContractFactory("DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployer.address);
    await dungeonCore.deployed();
    addresses.DUNGEONCORE_ADDRESS = dungeonCore.address;
    saveDeployment('DungeonCore', dungeonCore.address, network);
    log(`✅ DungeonCore deployed at: ${dungeonCore.address}`, 'green');
    
    // 12. Deploy DungeonMaster V7
    log('\n1️⃣ 2️⃣  Deploying DungeonMaster V7...', 'magenta');
    const DungeonMasterV7 = await ethers.getContractFactory("DungeonMasterV7");
    const dungeonMasterV7 = await DungeonMasterV7.deploy(deployer.address);
    await dungeonMasterV7.deployed();
    addresses.DUNGEONMASTER_ADDRESS = dungeonMasterV7.address;
    saveDeployment('DungeonMasterV7', dungeonMasterV7.address, network);
    log(`✅ DungeonMaster V7 deployed at: ${dungeonMasterV7.address}`, 'green');
    
    // DungeonMaster Wallet (保持不變)
    addresses.DUNGEONMASTERWALLET_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    // ============ Phase 6: Setup Connections ============
    log('\n🔗 Phase 6: Setting up Contract Connections', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 設置 DungeonCore 中的所有地址
    log('\n🔗 Setting up DungeonCore addresses...', 'cyan');
    
    await dungeonCore.setOracle(oracle.address);
    log('  ✅ Oracle set');
    
    await dungeonCore.setSoulShardToken(soulShard.address);
    log('  ✅ SoulShard token set');
    
    await dungeonCore.setHeroContract(hero.address);
    log('  ✅ Hero contract set');
    
    await dungeonCore.setRelicContract(relic.address);
    log('  ✅ Relic contract set');
    
    await dungeonCore.setPartyContract(partyV3.address);
    log('  ✅ Party V3 contract set');
    
    await dungeonCore.setPlayerVault(playerVault.address);
    log('  ✅ PlayerVault set');
    
    await dungeonCore.setPlayerProfile(playerProfile.address);
    log('  ✅ PlayerProfile set');
    
    await dungeonCore.setVIPStaking(vipStaking.address);
    log('  ✅ VIPStaking set');
    
    // 設置各個合約的 DungeonCore 地址
    log('\n🔗 Setting DungeonCore in all contracts...', 'cyan');
    
    await hero.setDungeonCore(dungeonCore.address);
    log('  ✅ Hero -> DungeonCore');
    
    await relic.setDungeonCore(dungeonCore.address);
    log('  ✅ Relic -> DungeonCore');
    
    await partyV3.setDungeonCore(dungeonCore.address);
    log('  ✅ Party V3 -> DungeonCore');
    
    await playerVault.setDungeonCore(dungeonCore.address);
    log('  ✅ PlayerVault -> DungeonCore');
    
    await playerProfile.setDungeonCore(dungeonCore.address);
    log('  ✅ PlayerProfile -> DungeonCore');
    
    await altarOfAscension.setDungeonCore(dungeonCore.address);
    log('  ✅ AltarOfAscension -> DungeonCore');
    
    await vipStaking.setDungeonCore(dungeonCore.address);
    log('  ✅ VIPStaking -> DungeonCore');
    
    await dungeonMasterV7.setDungeonCore(dungeonCore.address);
    log('  ✅ DungeonMaster V7 -> DungeonCore');
    
    // 設置 DungeonMaster 的額外連接
    log('\n🔗 Setting up DungeonMaster V7 connections...', 'cyan');
    
    await dungeonMasterV7.setDungeonStorage(dungeonStorage.address);
    log('  ✅ DungeonStorage set');
    
    await dungeonMasterV7.setSoulShardToken(soulShard.address);
    log('  ✅ SoulShard token set');
    
    // 設置 Party V3 的合約連接
    log('\n🔗 Setting up Party V3 connections...', 'cyan');
    
    await partyV3.setHeroContract(hero.address);
    log('  ✅ Hero contract set');
    
    await partyV3.setRelicContract(relic.address);
    log('  ✅ Relic contract set');
    
    // ============ Phase 7: Initialize Game Data ============
    log('\n🎮 Phase 7: Initializing Game Data', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 初始化地城數據
    log('\n🏰 Initializing dungeons...', 'cyan');
    
    const dungeons = [
      { id: 1, requiredPower: 100, rewardUSD: 10e18, successRate: 80 },
      { id: 2, requiredPower: 300, rewardUSD: 30e18, successRate: 70 },
      { id: 3, requiredPower: 600, rewardUSD: 60e18, successRate: 60 },
      { id: 4, requiredPower: 1000, rewardUSD: 100e18, successRate: 50 },
      { id: 5, requiredPower: 1500, rewardUSD: 150e18, successRate: 40 }
    ];
    
    for (const dungeon of dungeons) {
      await dungeonMasterV7.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardUSD,
        dungeon.successRate
      );
      log(`  ✅ Dungeon ${dungeon.id} initialized (Power: ${dungeon.requiredPower})`);
    }
    
    // 設置授權操作員
    log('\n👥 Setting up operator approvals...', 'cyan');
    
    await dungeonStorage.addAuthorizedOperator(dungeonMasterV7.address);
    log('  ✅ DungeonMaster V7 authorized as DungeonStorage operator');
    
    // ============ Save Deployment Info ============
    log('\n💾 Saving deployment information...', 'yellow');
    saveAllAddresses(addresses, network);
    
    // ============ Deployment Summary ============
    log('\n' + '='.repeat(60), 'bright');
    log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉', 'bright');
    log('='.repeat(60) + '\n', 'bright');
    
    log('📋 Contract Addresses:', 'green');
    log('---------------------', 'green');
    
    Object.entries(addresses).forEach(([name, address]) => {
      log(`${name}: ${address}`, 'cyan');
    });
    
    log('\n📁 Deployment files saved to:', 'yellow');
    log(`  - deployments/${network}_all_addresses.json`, 'yellow');
    log(`  - deployments/${network}_addresses.env`, 'yellow');
    
    log('\n⚡ Next Steps:', 'magenta');
    log('  1. Verify contracts on BSCScan', 'magenta');
    log('  2. Update frontend configuration', 'magenta');
    log('  3. Update backend configuration', 'magenta');
    log('  4. Deploy subgraph', 'magenta');
    
  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
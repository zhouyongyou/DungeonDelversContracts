// scripts/deploy-complete-v13.js
// V13 部署腳本 - 使用內聯接口版本避免 import 路徑問題

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
function saveAllAddresses(addresses, network, blockNumber) {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const summaryFile = path.join(deploymentsDir, `${network}-v13-summary.json`);
  const summary = {
    network: network,
    version: "V13",
    deployedAt: new Date().toISOString(),
    startBlock: blockNumber,
    addresses: addresses,
    note: "V13 deployment using inline interface versions for 100% verification compatibility"
  };
  
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  // 同時保存為 .env 格式
  const envFile = path.join(deploymentsDir, `${network}-v13.env`);
  let envContent = `# DungeonDelvers V13 Environment Variables\n`;
  envContent += `# Network: ${network}\n`;
  envContent += `# Deployed: ${new Date().toISOString()}\n`;
  envContent += `# Start Block: ${blockNumber}\n\n`;
  
  for (const [key, value] of Object.entries(addresses)) {
    envContent += `VITE_MAINNET_${key}=${value}\n`;
  }
  
  fs.writeFileSync(envFile, envContent);
}

async function main() {
  log('\n🚀 DungeonDelvers V13 Complete Deployment', 'magenta');
  log('=======================================================', 'magenta');
  log('🎯 使用內聯接口版本，確保 100% 開源驗證相容性', 'cyan');
  log('=======================================================', 'magenta');
  
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  log(`\n📋 部署資訊:`, 'cyan');
  log(`🌐 Network: ${network}`, 'yellow');
  log(`👤 Deployer: ${deployerAddress}`, 'yellow');
  log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployerAddress))} BNB`, 'yellow');
  
  // 獲取起始區塊號
  const startBlock = await ethers.provider.getBlockNumber();
  log(`📦 Start Block: ${startBlock}`, 'yellow');
  
  const addresses = {};
  const deployedContracts = {};
  
  // 預設代幣地址
  const USD_TOKEN_ADDRESS = process.env.USD_TOKEN_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
  addresses.USD_TOKEN_ADDRESS = USD_TOKEN_ADDRESS;
  
  try {
    // 1. Deploy or use existing SoulShard
    log('\n1️⃣  Handling SoulShard Token...', 'magenta');
    const existingSoulShard = process.env.EXISTING_SOULSHARD_ADDRESS;
    
    if (existingSoulShard && existingSoulShard !== "") {
      log(`🔗 Using existing SoulShard at: ${existingSoulShard}`, 'green');
      addresses.SOULSHARD_ADDRESS = existingSoulShard;
    } else {
      log('🆕 Deploying new Test SoulShard...', 'yellow');
      const SoulShard = await ethers.getContractFactory("Test_SoulShard");
      const soulShard = await SoulShard.deploy();
      await soulShard.waitForDeployment();
      addresses.SOULSHARD_ADDRESS = await soulShard.getAddress();
      deployedContracts.soulShard = soulShard;
      
      saveDeployment('SoulShard', addresses.SOULSHARD_ADDRESS, network);
      log(`✅ SoulShard deployed at: ${addresses.SOULSHARD_ADDRESS}`, 'green');
    }

    // 2. Deploy Oracle (使用內聯接口版本)
    log('\n2️⃣  Deploying Oracle (Inline Interface Version)...', 'magenta');
    const Oracle = await ethers.getContractFactory("contracts/defi/Oracle_VerificationFix.sol:Oracle");
    const poolAddress = process.env.POOL_ADDRESS || "0x737c5b0430d5aeb104680460179aaa38608b6169";
    const oracle = await Oracle.deploy(
      poolAddress,
      addresses.SOULSHARD_ADDRESS,
      USD_TOKEN_ADDRESS
    );
    await oracle.waitForDeployment();
    addresses.ORACLE_ADDRESS = await oracle.getAddress();
    deployedContracts.oracle = oracle;
    
    saveDeployment('Oracle', addresses.ORACLE_ADDRESS, network);
    log(`✅ Oracle (Inline) deployed at: ${addresses.ORACLE_ADDRESS}`, 'green');

    // 3. Deploy DungeonStorage
    log('\n3️⃣  Deploying DungeonStorage...', 'magenta');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployerAddress);
    await dungeonStorage.waitForDeployment();
    addresses.DUNGEONSTORAGE_ADDRESS = await dungeonStorage.getAddress();
    deployedContracts.dungeonStorage = dungeonStorage;
    
    saveDeployment('DungeonStorage', addresses.DUNGEONSTORAGE_ADDRESS, network);
    log(`✅ DungeonStorage deployed at: ${addresses.DUNGEONSTORAGE_ADDRESS}`, 'green');

    // 4. Deploy Hero
    log('\n4️⃣  Deploying Hero...', 'magenta');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployerAddress);
    await hero.waitForDeployment();
    addresses.HERO_ADDRESS = await hero.getAddress();
    deployedContracts.hero = hero;
    
    saveDeployment('Hero', addresses.HERO_ADDRESS, network);
    log(`✅ Hero deployed at: ${addresses.HERO_ADDRESS}`, 'green');

    // 5. Deploy Relic
    log('\n5️⃣  Deploying Relic...', 'magenta');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployerAddress);
    await relic.waitForDeployment();
    addresses.RELIC_ADDRESS = await relic.getAddress();
    deployedContracts.relic = relic;
    
    saveDeployment('Relic', addresses.RELIC_ADDRESS, network);
    log(`✅ Relic deployed at: ${addresses.RELIC_ADDRESS}`, 'green');

    // 6. Deploy PartyV3
    log('\n6️⃣  Deploying PartyV3...', 'magenta');
    const PartyV3 = await ethers.getContractFactory("PartyV3");
    const party = await PartyV3.deploy(deployerAddress);
    await party.waitForDeployment();
    addresses.PARTY_ADDRESS = await party.getAddress();
    deployedContracts.party = party;
    
    saveDeployment('PartyV3', addresses.PARTY_ADDRESS, network);
    log(`✅ PartyV3 deployed at: ${addresses.PARTY_ADDRESS}`, 'green');

    // 7. Deploy PlayerVault
    log('\n7️⃣  Deploying PlayerVault...', 'magenta');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployerAddress);
    await playerVault.waitForDeployment();
    addresses.PLAYERVAULT_ADDRESS = await playerVault.getAddress();
    deployedContracts.playerVault = playerVault;
    
    saveDeployment('PlayerVault', addresses.PLAYERVAULT_ADDRESS, network);
    log(`✅ PlayerVault deployed at: ${addresses.PLAYERVAULT_ADDRESS}`, 'green');

    // 8. Deploy PlayerProfile
    log('\n8️⃣  Deploying PlayerProfile...', 'magenta');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployerAddress);
    await playerProfile.waitForDeployment();
    addresses.PLAYERPROFILE_ADDRESS = await playerProfile.getAddress();
    deployedContracts.playerProfile = playerProfile;
    
    saveDeployment('PlayerProfile', addresses.PLAYERPROFILE_ADDRESS, network);
    log(`✅ PlayerProfile deployed at: ${addresses.PLAYERPROFILE_ADDRESS}`, 'green');

    // 9. Deploy AltarOfAscension
    log('\n9️⃣  Deploying AltarOfAscension...', 'magenta');
    const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
    const altarOfAscension = await AltarOfAscension.deploy(deployerAddress);
    await altarOfAscension.waitForDeployment();
    addresses.ALTAROFASCENSION_ADDRESS = await altarOfAscension.getAddress();
    deployedContracts.altarOfAscension = altarOfAscension;
    
    saveDeployment('AltarOfAscension', addresses.ALTAROFASCENSION_ADDRESS, network);
    log(`✅ AltarOfAscension deployed at: ${addresses.ALTAROFASCENSION_ADDRESS}`, 'green');

    // 10. Deploy VIPStaking
    log('\n🔟 Deploying VIPStaking...', 'magenta');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployerAddress);
    await vipStaking.waitForDeployment();
    addresses.VIPSTAKING_ADDRESS = await vipStaking.getAddress();
    deployedContracts.vipStaking = vipStaking;
    
    saveDeployment('VIPStaking', addresses.VIPSTAKING_ADDRESS, network);
    log(`✅ VIPStaking deployed at: ${addresses.VIPSTAKING_ADDRESS}`, 'green');

    // 11. Deploy DungeonCore (使用內聯接口版本)
    log('\n1️⃣1️⃣ Deploying DungeonCore (Inline Interface Version)...', 'magenta');
    const DungeonCore = await ethers.getContractFactory("contracts/core/DungeonCore_VerificationFix.sol:DungeonCore");
    const dungeonCore = await DungeonCore.deploy(
      deployerAddress,
      USD_TOKEN_ADDRESS,
      addresses.SOULSHARD_ADDRESS
    );
    await dungeonCore.waitForDeployment();
    addresses.DUNGEONCORE_ADDRESS = await dungeonCore.getAddress();
    deployedContracts.dungeonCore = dungeonCore;
    
    saveDeployment('DungeonCore', addresses.DUNGEONCORE_ADDRESS, network);
    log(`✅ DungeonCore (Inline) deployed at: ${addresses.DUNGEONCORE_ADDRESS}`, 'green');
    
    // DungeonMaster wallet address
    addresses.DUNGEONMASTERWALLET_ADDRESS = process.env.DUNGEONMASTER_WALLET || deployerAddress;

    // 12. Deploy DungeonMasterV8
    log('\n1️⃣2️⃣ Deploying DungeonMasterV8...', 'magenta');
    const DungeonMasterV8 = await ethers.getContractFactory("DungeonMasterV8");
    const dungeonMaster = await DungeonMasterV8.deploy(deployerAddress);
    await dungeonMaster.waitForDeployment();
    addresses.DUNGEONMASTER_ADDRESS = await dungeonMaster.getAddress();
    deployedContracts.dungeonMaster = dungeonMaster;
    
    saveDeployment('DungeonMasterV8', addresses.DUNGEONMASTER_ADDRESS, network);
    log(`✅ DungeonMasterV8 deployed at: ${addresses.DUNGEONMASTER_ADDRESS}`, 'green');

    // 配置階段
    log('\n⚙️  Configuration Phase...', 'magenta');
    log('=======================================================', 'cyan');

    // 配置 DungeonCore
    log('\n🔗 Configuring DungeonCore with all contract addresses...', 'yellow');
    await deployedContracts.dungeonCore.setOracle(addresses.ORACLE_ADDRESS);
    await deployedContracts.dungeonCore.setHeroContract(addresses.HERO_ADDRESS);
    await deployedContracts.dungeonCore.setRelicContract(addresses.RELIC_ADDRESS);
    await deployedContracts.dungeonCore.setPartyContract(addresses.PARTY_ADDRESS);
    await deployedContracts.dungeonCore.setDungeonMaster(addresses.DUNGEONMASTER_ADDRESS);
    await deployedContracts.dungeonCore.setPlayerVault(addresses.PLAYERVAULT_ADDRESS);
    await deployedContracts.dungeonCore.setPlayerProfile(addresses.PLAYERPROFILE_ADDRESS);
    await deployedContracts.dungeonCore.setAltarOfAscension(addresses.ALTAROFASCENSION_ADDRESS);
    await deployedContracts.dungeonCore.setVipStaking(addresses.VIPSTAKING_ADDRESS);
    log(`✅ DungeonCore fully configured`, 'green');

    // 配置其他合約的 DungeonCore 地址
    log('\n🔗 Configuring all contracts with DungeonCore address...', 'yellow');
    await deployedContracts.hero.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.relic.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.party.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.playerVault.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.playerProfile.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.altarOfAscension.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    await deployedContracts.vipStaking.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log(`✅ All contracts configured with DungeonCore`, 'green');

    // 配置 DungeonMaster 的 DungeonStorage
    log('\n🔗 Configuring DungeonMaster with DungeonStorage...', 'yellow');
    await deployedContracts.dungeonMaster.setDungeonStorage(addresses.DUNGEONSTORAGE_ADDRESS);
    log(`✅ DungeonMaster configured with DungeonStorage`, 'green');

    // 保存部署摘要
    saveAllAddresses(addresses, network, startBlock);
    
    // 最終總結
    log('\n🎉 V13 Deployment Completed Successfully!', 'green');
    log('=======================================================', 'green');
    log('🌟 Features of V13:', 'cyan');
    log('  ✅ Oracle with inline interface (verification-ready)', 'green');
    log('  ✅ DungeonCore with inline interface (verification-ready)', 'green');
    log('  ✅ Clean hardhat.config.ts (no console.log, no viaIR)', 'green');
    log('  ✅ All contracts fully configured and connected', 'green');
    log('  ✅ Ready for immediate verification', 'green');
    
    log('\n📋 Deployment Summary:', 'cyan');
    Object.entries(addresses).forEach(([name, address]) => {
      log(`  ${name}: ${address}`, 'yellow');
    });
    
    log(`\n📁 Files saved:`, 'cyan');
    log(`  🗂️  deployments/${network}-v13-summary.json`, 'yellow');
    log(`  🗂️  deployments/${network}-v13.env`, 'yellow');
    
    log('\n🚀 Next Steps:', 'magenta');
    log('  1️⃣  Update frontend .env with new addresses', 'cyan');
    log('  2️⃣  Update backend .env with new addresses', 'cyan');
    log('  3️⃣  Update subgraph with new addresses and start block', 'cyan');
    log('  4️⃣  Run verification script immediately', 'cyan');
    log('  5️⃣  Test all functionality', 'cyan');
    
    log('\n🎯 Verification Command:', 'magenta');
    log('  node scripts/verify-v13.js', 'yellow');
    
  } catch (error) {
    log(`\n💥 Deployment failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
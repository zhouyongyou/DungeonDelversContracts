// scripts/deploy-v10-final.js
// 真正完整的部署腳本，包含所有功能

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
  
  const timestamp = new Date().toISOString();
  
  // JSON 格式 - 包含區塊號
  const allAddressesFile = path.join(deploymentsDir, `${network}_all_addresses.json`);
  const data = {
    network: network,
    deployedAt: timestamp,
    blockNumber: blockNumber,
    addresses: addresses
  };
  fs.writeFileSync(allAddressesFile, JSON.stringify(data, null, 2));
  
  // .env 格式
  const envFile = path.join(deploymentsDir, `${network}_addresses.env`);
  let envContent = `# DungeonDelvers V10 Final Deployment\n`;
  envContent += `# Network: ${network}\n`;
  envContent += `# Deployed at: ${timestamp}\n`;
  envContent += `# Block Number: ${blockNumber}\n\n`;
  
  Object.entries(addresses).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
  
  fs.writeFileSync(envFile, envContent);
  
  // 生成子圖更新指南
  const subgraphGuide = path.join(deploymentsDir, `${network}_subgraph_update.md`);
  let guideContent = `# Subgraph Update Guide\n\n`;
  guideContent += `## Deployment Info\n`;
  guideContent += `- Network: ${network}\n`;
  guideContent += `- Block Number: ${blockNumber}\n`;
  guideContent += `- Deployed at: ${timestamp}\n\n`;
  guideContent += `## Contract Addresses to Update\n\n`;
  guideContent += `\`\`\`yaml\n`;
  Object.entries(addresses).forEach(([name, address]) => {
    guideContent += `${name}: ${address}\n`;
  });
  guideContent += `\`\`\`\n\n`;
  guideContent += `## Update Steps\n`;
  guideContent += `1. Update subgraph.yaml with new addresses\n`;
  guideContent += `2. Update src/config.ts with new addresses\n`;
  guideContent += `3. Set startBlock to ${blockNumber}\n`;
  guideContent += `4. Run: npm run codegen\n`;
  guideContent += `5. Run: npm run build\n`;
  guideContent += `6. Run: npm run deploy\n`;
  
  fs.writeFileSync(subgraphGuide, guideContent);
}

// 生成 ABI 文件
async function generateABIs(contracts) {
  const abisDir = path.join(__dirname, '..', 'abis');
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir);
  }
  
  const contractsDir = path.join(__dirname, "../artifacts/contracts");
  
  for (const [name, info] of Object.entries(contracts)) {
    try {
      const artifactPath = path.join(contractsDir, `${info.fileName || name}.sol/${info.contractName || name}.json`);
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        fs.writeFileSync(
          path.join(abisDir, `${name}.json`),
          JSON.stringify(artifact.abi, null, 2)
        );
        log(`  ✅ ABI exported for ${name}`, 'green');
      }
    } catch (error) {
      log(`  ⚠️  Failed to export ABI for ${name}: ${error.message}`, 'yellow');
    }
  }
}

async function main() {
  log('\n🚀 Starting DungeonDelvers V10 Final Deployment', 'bright');
  log('================================================\n', 'bright');
  
  const network = hre.network.name;
  log(`📍 Network: ${network}`, 'cyan');
  
  const [deployer] = await ethers.getSigners();
  log(`👤 Deployer: ${deployer.address}`, 'cyan');
  
  const balance = await deployer.provider.getBalance(deployer.address);
  log(`💰 Balance: ${ethers.formatEther(balance)} BNB`, 'cyan');
  
  // 獲取當前區塊號（用於子圖）
  const blockNumber = await ethers.provider.getBlockNumber();
  log(`📦 Current Block: ${blockNumber}\n`, 'cyan');
  
  // Metadata Server 配置
  const METADATA_SERVER_URL = process.env.METADATA_SERVER_BASE_URL || 
                             "https://dungeon-delvers-metadata-server.onrender.com";
  log(`📡 Metadata Server: ${METADATA_SERVER_URL}\n`, 'cyan');
  
  const addresses = {};
  const deployedContracts = {};
  
  try {
    // ============ Phase 1: Deploy Infrastructure ============
    log('\n📦 Phase 1: Deploying Infrastructure Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 1. 處理 SoulShard Token
    const USE_TEST_TOKEN = process.env.DEPLOY_TEST_TOKEN === 'true';
    if (USE_TEST_TOKEN) {
      log('\n1️⃣  Deploying Test SoulShard Token...', 'magenta');
      const SoulShard = await ethers.getContractFactory("Test_SoulShard");
      const soulShard = await SoulShard.deploy(deployer.address);
      await soulShard.waitForDeployment();
      addresses.SOULSHARD_ADDRESS = await soulShard.getAddress();
      deployedContracts.soulShard = soulShard;
      saveDeployment('Test_SoulShard', addresses.SOULSHARD_ADDRESS, network);
      log(`✅ Test SoulShard deployed at: ${addresses.SOULSHARD_ADDRESS}`, 'green');
    } else {
      addresses.SOULSHARD_ADDRESS = process.env.SOUL_SHARD_TOKEN_ADDRESS || 
                                   "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
      log(`📌 Using existing SoulShard: ${addresses.SOULSHARD_ADDRESS}`, 'cyan');
    }
    
    // 2. Deploy Oracle（重要：V9 遺漏了這個）
    log('\n2️⃣  Deploying Oracle...', 'magenta');
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy();
    await oracle.waitForDeployment();
    addresses.ORACLE_ADDRESS = await oracle.getAddress();
    deployedContracts.oracle = oracle;
    
    // 設定 Oracle 參數
    await oracle.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
    await oracle.setUsdToken(process.env.USD_TOKEN_ADDRESS || "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE");
    await oracle.setPoolAddress(process.env.POOL_ADDRESS || "0x737c5b0430d5aeb104680460179aaa38608b6169");
    
    saveDeployment('Oracle', addresses.ORACLE_ADDRESS, network);
    log(`✅ Oracle deployed and configured at: ${addresses.ORACLE_ADDRESS}`, 'green');
    
    // ============ Phase 2: Deploy Storage Contracts ============
    log('\n📦 Phase 2: Deploying Storage Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 3. Deploy DungeonStorage
    log('\n3️⃣  Deploying DungeonStorage...', 'magenta');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployer.address);
    await dungeonStorage.waitForDeployment();
    addresses.DUNGEONSTORAGE_ADDRESS = await dungeonStorage.getAddress();
    deployedContracts.dungeonStorage = dungeonStorage;
    saveDeployment('DungeonStorage', addresses.DUNGEONSTORAGE_ADDRESS, network);
    log(`✅ DungeonStorage deployed at: ${addresses.DUNGEONSTORAGE_ADDRESS}`, 'green');
    
    // ============ Phase 3: Deploy NFT Contracts with BaseURI ============
    log('\n📦 Phase 3: Deploying NFT Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 4. Deploy Hero NFT
    log('\n4️⃣  Deploying Hero NFT...', 'magenta');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await hero.waitForDeployment();
    addresses.HERO_ADDRESS = await hero.getAddress();
    deployedContracts.hero = hero;
    await hero.setBaseURI(`${METADATA_SERVER_URL}/api/hero/`);
    saveDeployment('Hero', addresses.HERO_ADDRESS, network);
    log(`✅ Hero deployed at: ${addresses.HERO_ADDRESS}`, 'green');
    log(`   BaseURI set to: ${METADATA_SERVER_URL}/api/hero/`, 'cyan');
    
    // 5. Deploy Relic NFT
    log('\n5️⃣  Deploying Relic NFT...', 'magenta');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await relic.waitForDeployment();
    addresses.RELIC_ADDRESS = await relic.getAddress();
    deployedContracts.relic = relic;
    await relic.setBaseURI(`${METADATA_SERVER_URL}/api/relic/`);
    saveDeployment('Relic', addresses.RELIC_ADDRESS, network);
    log(`✅ Relic deployed at: ${addresses.RELIC_ADDRESS}`, 'green');
    log(`   BaseURI set to: ${METADATA_SERVER_URL}/api/relic/`, 'cyan');
    
    // 6. Deploy Party V3 NFT（修正：使用正確的合約名稱）
    log('\n6️⃣  Deploying Party V3 NFT...', 'magenta');
    const PartyV3 = await ethers.getContractFactory("PartyV3");
    const partyV3 = await PartyV3.deploy(deployer.address);
    await partyV3.waitForDeployment();
    addresses.PARTY_ADDRESS = await partyV3.getAddress();
    deployedContracts.partyV3 = partyV3;
    await partyV3.setBaseURI(`${METADATA_SERVER_URL}/api/party/`);
    saveDeployment('PartyV3', addresses.PARTY_ADDRESS, network);
    log(`✅ Party V3 deployed at: ${addresses.PARTY_ADDRESS}`, 'green');
    log(`   BaseURI set to: ${METADATA_SERVER_URL}/api/party/`, 'cyan');
    
    // ============ Phase 4: Deploy Game Mechanics ============
    log('\n📦 Phase 4: Deploying Game Mechanics', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 7. Deploy PlayerVault
    log('\n7️⃣  Deploying PlayerVault...', 'magenta');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployer.address);
    await playerVault.waitForDeployment();
    addresses.PLAYERVAULT_ADDRESS = await playerVault.getAddress();
    deployedContracts.playerVault = playerVault;
    saveDeployment('PlayerVault', addresses.PLAYERVAULT_ADDRESS, network);
    log(`✅ PlayerVault deployed at: ${addresses.PLAYERVAULT_ADDRESS}`, 'green');
    
    // 8. Deploy PlayerProfile
    log('\n8️⃣  Deploying PlayerProfile...', 'magenta');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployer.address);
    await playerProfile.waitForDeployment();
    addresses.PLAYERPROFILE_ADDRESS = await playerProfile.getAddress();
    deployedContracts.playerProfile = playerProfile;
    await playerProfile.setBaseURI(`${METADATA_SERVER_URL}/api/profile/`);
    saveDeployment('PlayerProfile', addresses.PLAYERPROFILE_ADDRESS, network);
    log(`✅ PlayerProfile deployed at: ${addresses.PLAYERPROFILE_ADDRESS}`, 'green');
    log(`   BaseURI set to: ${METADATA_SERVER_URL}/api/profile/`, 'cyan');
    
    // 9. Deploy AltarOfAscension
    log('\n9️⃣  Deploying AltarOfAscension...', 'magenta');
    const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
    const altarOfAscension = await AltarOfAscension.deploy(deployer.address);
    await altarOfAscension.waitForDeployment();
    addresses.ALTAROFASCENSION_ADDRESS = await altarOfAscension.getAddress();
    deployedContracts.altarOfAscension = altarOfAscension;
    saveDeployment('AltarOfAscension', addresses.ALTAROFASCENSION_ADDRESS, network);
    log(`✅ AltarOfAscension deployed at: ${addresses.ALTAROFASCENSION_ADDRESS}`, 'green');
    
    // 10. Deploy VIPStaking
    log('\n🔟 Deploying VIPStaking...', 'magenta');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployer.address);
    await vipStaking.waitForDeployment();
    addresses.VIPSTAKING_ADDRESS = await vipStaking.getAddress();
    deployedContracts.vipStaking = vipStaking;
    await vipStaking.setBaseURI(`${METADATA_SERVER_URL}/api/vip/`);
    
    // VIP 特殊設定（V9 遺漏）
    await vipStaking.setUnstakeCooldown(15); // 15 秒測試用，正式應該是 7-14 天
    
    saveDeployment('VIPStaking', addresses.VIPSTAKING_ADDRESS, network);
    log(`✅ VIPStaking deployed at: ${addresses.VIPSTAKING_ADDRESS}`, 'green');
    log(`   BaseURI set to: ${METADATA_SERVER_URL}/api/vip/`, 'cyan');
    log(`   Unstake cooldown set to: 15 seconds (for testing)`, 'cyan');
    
    // ============ Phase 5: Deploy Core Contracts ============
    log('\n📦 Phase 5: Deploying Core Contracts', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 11. Deploy DungeonCore
    log('\n1️⃣ 1️⃣  Deploying DungeonCore...', 'magenta');
    const DungeonCore = await ethers.getContractFactory("DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployer.address);
    await dungeonCore.waitForDeployment();
    addresses.DUNGEONCORE_ADDRESS = await dungeonCore.getAddress();
    deployedContracts.dungeonCore = dungeonCore;
    saveDeployment('DungeonCore', addresses.DUNGEONCORE_ADDRESS, network);
    log(`✅ DungeonCore deployed at: ${addresses.DUNGEONCORE_ADDRESS}`, 'green');
    
    // 12. Deploy DungeonMaster V7
    log('\n1️⃣ 2️⃣  Deploying DungeonMaster V7...', 'magenta');
    const DungeonMasterV7 = await ethers.getContractFactory("DungeonMasterV7");
    const dungeonMasterV7 = await DungeonMasterV7.deploy(deployer.address);
    await dungeonMasterV7.waitForDeployment();
    addresses.DUNGEONMASTER_ADDRESS = await dungeonMasterV7.getAddress();
    deployedContracts.dungeonMasterV7 = dungeonMasterV7;
    saveDeployment('DungeonMasterV7', addresses.DUNGEONMASTER_ADDRESS, network);
    log(`✅ DungeonMaster V7 deployed at: ${addresses.DUNGEONMASTER_ADDRESS}`, 'green');
    
    // DungeonMaster Wallet
    addresses.DUNGEONMASTERWALLET_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    
    // ============ Phase 6: Setup Complete Connections ============
    log('\n🔗 Phase 6: Setting up Contract Connections', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 設置 DungeonCore 中的所有地址（V9 遺漏了部分）
    log('\n🔗 Setting up DungeonCore addresses...', 'cyan');
    
    await dungeonCore.setOracleContract(addresses.ORACLE_ADDRESS);
    log('  ✅ Oracle set');
    
    await dungeonCore.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
    log('  ✅ SoulShard token set');
    
    await dungeonCore.setHeroContract(addresses.HERO_ADDRESS);
    log('  ✅ Hero contract set');
    
    await dungeonCore.setRelicContract(addresses.RELIC_ADDRESS);
    log('  ✅ Relic contract set');
    
    await dungeonCore.setPartyContract(addresses.PARTY_ADDRESS);
    log('  ✅ Party contract set');
    
    await dungeonCore.setDungeonMasterContract(addresses.DUNGEONMASTER_ADDRESS);
    log('  ✅ DungeonMaster contract set');
    
    await dungeonCore.setPlayerVaultContract(addresses.PLAYERVAULT_ADDRESS);
    log('  ✅ PlayerVault set');
    
    await dungeonCore.setPlayerProfileContract(addresses.PLAYERPROFILE_ADDRESS);
    log('  ✅ PlayerProfile set');
    
    await dungeonCore.setAltarOfAscensionContract(addresses.ALTAROFASCENSION_ADDRESS);
    log('  ✅ AltarOfAscension set');
    
    await dungeonCore.setVipStakingContract(addresses.VIPSTAKING_ADDRESS);
    log('  ✅ VIPStaking set');
    
    await dungeonCore.setDungeonStorageContract(addresses.DUNGEONSTORAGE_ADDRESS);
    log('  ✅ DungeonStorage set');
    
    // 設置各個合約的 DungeonCore 地址
    log('\n🔗 Setting DungeonCore in all contracts...', 'cyan');
    
    await hero.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ Hero -> DungeonCore');
    
    await relic.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ Relic -> DungeonCore');
    
    await partyV3.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ Party V3 -> DungeonCore');
    
    await playerVault.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ PlayerVault -> DungeonCore');
    
    await playerProfile.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ PlayerProfile -> DungeonCore');
    
    await altarOfAscension.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ AltarOfAscension -> DungeonCore');
    
    await vipStaking.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ VIPStaking -> DungeonCore');
    
    await dungeonMasterV7.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ DungeonMaster V7 -> DungeonCore');
    
    await dungeonStorage.setDungeonCore(addresses.DUNGEONCORE_ADDRESS);
    log('  ✅ DungeonStorage -> DungeonCore');
    
    // 設置 DungeonMaster 的額外連接
    log('\n🔗 Setting up DungeonMaster V7 connections...', 'cyan');
    
    await dungeonMasterV7.setDungeonStorage(addresses.DUNGEONSTORAGE_ADDRESS);
    log('  ✅ DungeonStorage set');
    
    await dungeonMasterV7.setSoulShardToken(addresses.SOULSHARD_ADDRESS);
    log('  ✅ SoulShard token set');
    
    // 設置 Party V3 的合約連接
    log('\n🔗 Setting up Party V3 connections...', 'cyan');
    
    await partyV3.setHeroContract(addresses.HERO_ADDRESS);
    log('  ✅ Hero contract set');
    
    await partyV3.setRelicContract(addresses.RELIC_ADDRESS);
    log('  ✅ Relic contract set');
    
    // 授權操作員（V9 遺漏）
    log('\n👥 Setting up operator approvals...', 'cyan');
    
    await dungeonStorage.addAuthorizedOperator(addresses.DUNGEONMASTER_ADDRESS);
    log('  ✅ DungeonMaster V7 authorized as DungeonStorage operator');
    
    // ============ Phase 7: Initialize Game Data ============
    log('\n🎮 Phase 7: Initializing Game Data', 'yellow');
    log('----------------------------------------', 'yellow');
    
    // 設定探索費用（V9 遺漏）
    log('\n💰 Setting exploration fee...', 'cyan');
    const explorationFee = ethers.parseEther("0.0015"); // 0.0015 BNB
    await dungeonMasterV7.setExplorationFee(explorationFee);
    log(`  ✅ Exploration fee set to: 0.0015 BNB`, 'green');
    
    // 設定儲備價格（V9 遺漏）
    const reservePriceUSD = ethers.parseEther("5"); // $5 USD
    await dungeonMasterV7.setReservePriceUSD(reservePriceUSD);
    log(`  ✅ Reserve price set to: $5 USD`, 'green');
    
    // 設定獎勵倍數（V9 遺漏）
    await dungeonMasterV7.setGlobalRewardMultiplier(100); // 100 = 1x
    log(`  ✅ Global reward multiplier set to: 1x`, 'green');
    
    // 初始化地城數據
    log('\n🏰 Initializing dungeons...', 'cyan');
    
    const dungeons = [
      { id: 1, requiredPower: 100, rewardUSD: ethers.parseEther("10"), successRate: 80 },
      { id: 2, requiredPower: 300, rewardUSD: ethers.parseEther("30"), successRate: 70 },
      { id: 3, requiredPower: 600, rewardUSD: ethers.parseEther("60"), successRate: 60 },
      { id: 4, requiredPower: 1000, rewardUSD: ethers.parseEther("100"), successRate: 50 },
      { id: 5, requiredPower: 1500, rewardUSD: ethers.parseEther("150"), successRate: 40 }
    ];
    
    for (const dungeon of dungeons) {
      await dungeonMasterV7.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardUSD,
        dungeon.successRate
      );
      log(`  ✅ Dungeon ${dungeon.id} initialized (Power: ${dungeon.requiredPower}, Reward: $${ethers.formatEther(dungeon.rewardUSD)}, Success: ${dungeon.successRate}%)`);
    }
    
    // ============ Phase 8: Generate ABIs ============
    log('\n📁 Phase 8: Generating ABI Files', 'yellow');
    log('----------------------------------------', 'yellow');
    
    const contractInfo = {
      Hero: { fileName: "Hero", contractName: "Hero" },
      Relic: { fileName: "Relic", contractName: "Relic" },
      PartyV3: { fileName: "Party_V3", contractName: "PartyV3" },
      VIPStaking: { fileName: "VIPStaking", contractName: "VIPStaking" },
      PlayerProfile: { fileName: "PlayerProfile", contractName: "PlayerProfile" },
      PlayerVault: { fileName: "PlayerVault", contractName: "PlayerVault" },
      AltarOfAscension: { fileName: "AltarOfAscension", contractName: "AltarOfAscension" },
      DungeonCore: { fileName: "DungeonCore", contractName: "DungeonCore" },
      DungeonMasterV7: { fileName: "DungeonMasterV7", contractName: "DungeonMasterV7" },
      DungeonStorage: { fileName: "DungeonStorage", contractName: "DungeonStorage" },
      Oracle: { fileName: "Oracle", contractName: "Oracle" }
    };
    
    await generateABIs(contractInfo);
    
    // ============ Save Deployment Info ============
    log('\n💾 Saving deployment information...', 'yellow');
    saveAllAddresses(addresses, network, blockNumber);
    
    // ============ Deployment Summary ============
    log('\n' + '='.repeat(60), 'bright');
    log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉', 'bright');
    log('='.repeat(60) + '\n', 'bright');
    
    log('📋 Contract Addresses:', 'green');
    log('---------------------', 'green');
    
    Object.entries(addresses).forEach(([name, address]) => {
      log(`${name}: ${address}`, 'cyan');
    });
    
    log('\n📡 All NFTs configured with Metadata Server:', 'green');
    log(`  ${METADATA_SERVER_URL}/api/{type}/`, 'cyan');
    
    log('\n🎮 Game Parameters:', 'green');
    log(`  Exploration Fee: 0.0015 BNB`, 'cyan');
    log(`  Reserve Price: $5 USD`, 'cyan');
    log(`  Reward Multiplier: 1x`, 'cyan');
    log(`  VIP Unstake Cooldown: 15 seconds (testing)`, 'cyan');
    
    log('\n📁 Deployment files saved to:', 'yellow');
    log(`  - deployments/${network}_all_addresses.json`, 'yellow');
    log(`  - deployments/${network}_addresses.env`, 'yellow');
    log(`  - deployments/${network}_subgraph_update.md`, 'yellow');
    log(`  - abis/ (all contract ABIs)`, 'yellow');
    
    log('\n⚡ Next Steps:', 'magenta');
    log('  1. Copy addresses from .env file to your project .env', 'magenta');
    log('  2. Run verification script: npx hardhat run scripts/verify-v10-contracts.js --network ' + network, 'magenta');
    log('  3. Update frontend contracts.ts', 'magenta');
    log('  4. Update backend configuration', 'magenta');
    log('  5. Update The Graph subgraph using the guide', 'magenta');
    log('  6. Sync to Vercel: npx hardhat run scripts/sync-to-vercel.js', 'magenta');
    log('  7. Sync to Render: npx hardhat run scripts/sync-to-render.js', 'magenta');
    log('  8. Test all functions work correctly', 'magenta');
    log('  9. Consider transferring ownership to multisig', 'magenta');
    
  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    
    // 儲存錯誤記錄
    const errorPath = path.join(
      __dirname,
      `../deployments/ERROR_${network}_${Date.now()}.json`
    );
    const errorData = {
      error: error.message,
      stack: error.stack,
      addresses: addresses,
      timestamp: new Date().toISOString(),
      blockNumber: blockNumber || 'unknown'
    };
    
    fs.writeFileSync(errorPath, JSON.stringify(errorData, null, 2));
    log(`\n📄 Error details saved to: ${errorPath}`, 'yellow');
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

/**
 * V25.0.3 Deployment Script
 * 
 * 部署順序：
 * 1. TSOUL 和 TUSD1 代幣（優先部署）
 * 2. 6個核心合約（DungeonStorage, DungeonMaster, Hero, Relic, AltarOfAscension, Party）
 * 3. 配置合約連接
 * 4. 更新 VRF 訂閱
 * 
 * 複用合約：
 * - DungeonCore, PlayerVault, PlayerProfile, VIPStaking, Oracle, VRFManagerV2Plus
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.blue}🚀 Starting V25.0.3 Deployment${colors.reset}`);
  console.log('=' . repeat(70));
  console.log(`📅 Deployment Time: ${new Date().toISOString()}`);
  console.log(`📦 Version: V25.0.3`);
  console.log(`🔗 Network: BSC Mainnet`);
  console.log(`📊 Start Block: 58266666`);
  console.log(`🌐 Subgraph Version: v3.9.4`);
  console.log('=' . repeat(70));

  // 檢查私鑰
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('❌ Missing PRIVATE_KEY in .env file');
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 Deployer: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} BNB`);
  
  if (balance < ethers.parseEther("0.5")) {
    throw new Error('❌ Insufficient BNB balance. Need at least 0.5 BNB');
  }

  // 新管理員錢包（替代被洩露的錢包）
  const NEW_ADMIN_WALLET = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
  console.log(`🔑 New Admin Wallet: ${NEW_ADMIN_WALLET}`);

  // 複用的合約地址
  const REUSED_CONTRACTS = {
    DUNGEONCORE: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
    ORACLE: "0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d",
    PLAYERVAULT: "0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65",
    PLAYERPROFILE: "0x7E1E437cC88C581ca41698b345bE8aeCA8084559",
    VIPSTAKING: "0x2A758Fb08A80E49a3164BC217fe822c06c726752",
    VRF_MANAGER_V2PLUS: "0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5"
  };

  // VRF 配置
  const VRF_CONFIG = {
    COORDINATOR: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    KEY_HASH: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
    SUBSCRIPTION_ID: "88422796721004450630713121079263696788635490871993157345476848872165866246915",
    CALLBACK_GAS_LIMIT: 2500000,
    REQUEST_CONFIRMATIONS: 6,
    NUM_WORDS: 1
  };

  const contracts = {};
  const deploymentInfo = {
    version: 'V25.0.3',
    deploymentTime: new Date().toISOString(),
    startBlock: 58266666,
    network: 'BSC Mainnet',
    chainId: 56,
    deployer: deployer.address,
    adminWallet: NEW_ADMIN_WALLET,
    contracts: {},
    reusedContracts: REUSED_CONTRACTS,
    vrfConfig: VRF_CONFIG
  };

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}PHASE 1: Deploy Token Contracts${colors.reset}`);
  console.log('=' . repeat(70));

  // 1. 部署 TSOUL 代幣
  console.log('\n📌 Deploying TSOUL Token...');
  const TSOUL = await hre.ethers.getContractFactory("TSOUL");
  contracts.tsoul = await TSOUL.deploy();
  await contracts.tsoul.waitForDeployment();
  const tsoulAddress = await contracts.tsoul.getAddress();
  console.log(`${colors.green}✅ TSOUL deployed to: ${tsoulAddress}${colors.reset}`);

  // 2. 部署 TUSD1 代幣
  console.log('\n📌 Deploying TUSD1 Token...');
  const TUSD1 = await hre.ethers.getContractFactory("TUSD1");
  contracts.tusd1 = await TUSD1.deploy();
  await contracts.tusd1.waitForDeployment();
  const tusd1Address = await contracts.tusd1.getAddress();
  console.log(`${colors.green}✅ TUSD1 deployed to: ${tusd1Address}${colors.reset}`);

  console.log(`\n${colors.yellow}⏸️  PAUSE: Please create Uniswap V3 pool manually now${colors.reset}`);
  console.log(`  Token A: TSOUL - ${tsoulAddress}`);
  console.log(`  Token B: TUSD1 - ${tusd1Address}`);
  console.log(`  Fee Tier: 0.3% (3000)`);
  console.log(`  Initial Price: Set according to your requirements`);
  console.log(`\n${colors.yellow}Press Enter after pool creation to continue...${colors.reset}`);

  // 等待用戶確認池子創建
  if (process.env.CI !== 'true') {
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}PHASE 2: Deploy Core Game Contracts${colors.reset}`);
  console.log('=' . repeat(70));

  // 3. 部署 DungeonStorage
  console.log('\n📌 Deploying DungeonStorage...');
  const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
  contracts.dungeonStorage = await DungeonStorage.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.dungeonStorage.waitForDeployment();
  const dungeonStorageAddress = await contracts.dungeonStorage.getAddress();
  console.log(`${colors.green}✅ DungeonStorage deployed to: ${dungeonStorageAddress}${colors.reset}`);

  // 4. 部署 DungeonMaster
  console.log('\n📌 Deploying DungeonMaster...');
  const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
  contracts.dungeonMaster = await DungeonMaster.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.dungeonMaster.waitForDeployment();
  const dungeonMasterAddress = await contracts.dungeonMaster.getAddress();
  console.log(`${colors.green}✅ DungeonMaster deployed to: ${dungeonMasterAddress}${colors.reset}`);

  // 5. 部署 Hero NFT
  console.log('\n📌 Deploying Hero NFT...');
  const Hero = await hre.ethers.getContractFactory("Hero");
  contracts.hero = await Hero.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.hero.waitForDeployment();
  const heroAddress = await contracts.hero.getAddress();
  console.log(`${colors.green}✅ Hero deployed to: ${heroAddress}${colors.reset}`);

  // 6. 部署 Relic NFT
  console.log('\n📌 Deploying Relic NFT...');
  const Relic = await hre.ethers.getContractFactory("Relic");
  contracts.relic = await Relic.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.relic.waitForDeployment();
  const relicAddress = await contracts.relic.getAddress();
  console.log(`${colors.green}✅ Relic deployed to: ${relicAddress}${colors.reset}`);

  // 7. 部署 AltarOfAscension
  console.log('\n📌 Deploying AltarOfAscension...');
  const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
  contracts.altarOfAscension = await AltarOfAscension.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.altarOfAscension.waitForDeployment();
  const altarAddress = await contracts.altarOfAscension.getAddress();
  console.log(`${colors.green}✅ AltarOfAscension deployed to: ${altarAddress}${colors.reset}`);

  // 8. 部署 Party NFT
  console.log('\n📌 Deploying Party NFT...');
  const Party = await hre.ethers.getContractFactory("Party");
  contracts.party = await Party.deploy(REUSED_CONTRACTS.DUNGEONCORE);
  await contracts.party.waitForDeployment();
  const partyAddress = await contracts.party.getAddress();
  console.log(`${colors.green}✅ Party deployed to: ${partyAddress}${colors.reset}`);

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}PHASE 3: Configure Contract Connections${colors.reset}`);
  console.log('=' . repeat(70));

  // 配置 DungeonMaster 與 DungeonStorage 的連接
  console.log('\n🔧 Configuring DungeonMaster...');
  await contracts.dungeonMaster.setDungeonStorage(dungeonStorageAddress);
  console.log(`${colors.green}✅ DungeonMaster configured with DungeonStorage${colors.reset}`);

  // 配置 DungeonCore 中的新合約地址（需要 DungeonCore 的 owner 權限）
  console.log('\n🔧 Updating DungeonCore addresses...');
  console.log(`${colors.yellow}⚠️  Note: This requires DungeonCore owner permissions${colors.reset}`);
  
  // 收集所有部署的地址
  deploymentInfo.contracts = {
    TSOUL: tsoulAddress,
    TUSD1: tusd1Address,
    DungeonStorage: dungeonStorageAddress,
    DungeonMaster: dungeonMasterAddress,
    Hero: heroAddress,
    Relic: relicAddress,
    AltarOfAscension: altarAddress,
    Party: partyAddress
  };

  // 保存部署信息
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}PHASE 4: Save Deployment Information${colors.reset}`);
  console.log('=' . repeat(70));

  // 創建部署記錄文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const deploymentPath = path.join(__dirname, '..', 'deployments', `v25-0-3-deployment-${timestamp}.json`);
  
  // 確保 deployments 目錄存在
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📁 Deployment info saved to: ${deploymentPath}`);

  // 更新 .env.v25.0.3 配置文件
  const envContent = `# V25.0.3 Deployment Configuration
# Generated: ${deploymentInfo.deploymentTime}
# Network: BSC Mainnet
# Start Block: 58266666

# ==================== 新部署的合約 (V25.0.3) ====================
VITE_HERO_ADDRESS=${heroAddress}
VITE_RELIC_ADDRESS=${relicAddress}
VITE_PARTY_ADDRESS=${partyAddress}
VITE_DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}
VITE_DUNGEONSTORAGE_ADDRESS=${dungeonStorageAddress}
VITE_ALTAROFASCENSION_ADDRESS=${altarAddress}

# 新部署的代幣
VITE_SOULSHARD_ADDRESS=${tsoulAddress}
VITE_USD_ADDRESS=${tusd1Address}

# ==================== 複用的合約 ====================
VITE_DUNGEONCORE_ADDRESS=${REUSED_CONTRACTS.DUNGEONCORE}
VITE_ORACLE_ADDRESS=${REUSED_CONTRACTS.ORACLE}
VITE_PLAYERVAULT_ADDRESS=${REUSED_CONTRACTS.PLAYERVAULT}
VITE_PLAYERPROFILE_ADDRESS=${REUSED_CONTRACTS.PLAYERPROFILE}
VITE_VIPSTAKING_ADDRESS=${REUSED_CONTRACTS.VIPSTAKING}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${REUSED_CONTRACTS.VRF_MANAGER_V2PLUS}

# ==================== VRF 配置 ====================
VITE_VRF_COORDINATOR=${VRF_CONFIG.COORDINATOR}
VITE_VRF_KEY_HASH=${VRF_CONFIG.KEY_HASH}
VITE_VRF_SUBSCRIPTION_ID=${VRF_CONFIG.SUBSCRIPTION_ID}
VITE_VRF_CALLBACK_GAS_LIMIT=${VRF_CONFIG.CALLBACK_GAS_LIMIT}
VITE_VRF_REQUEST_CONFIRMATIONS=${VRF_CONFIG.REQUEST_CONFIRMATIONS}

# ==================== 服務端點 ====================
VITE_SUBGRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.4
VITE_SUBGRAPH_DECENTRALIZED_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 網路配置 ====================
VITE_CONTRACT_VERSION=V25.0.3
VITE_START_BLOCK=58266666
VITE_DEPLOYMENT_DATE=${deploymentInfo.deploymentTime}
VITE_ADMIN_WALLET=${NEW_ADMIN_WALLET}
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56
`;

  fs.writeFileSync('.env.v25.0.3', envContent);
  console.log(`📁 Configuration saved to: .env.v25.0.3`);

  // 顯示部署總結
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 V25.0.3 DEPLOYMENT COMPLETE!${colors.reset}`);
  console.log('=' . repeat(70));
  
  console.log('\n📊 Deployment Summary:');
  console.log(`  Version: V25.0.3`);
  console.log(`  Start Block: 58266666`);
  console.log(`  Subgraph Version: v3.9.4`);
  console.log(`  Admin Wallet: ${NEW_ADMIN_WALLET}`);
  
  console.log('\n📝 Deployed Contracts:');
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  console.log('\n♻️ Reused Contracts:');
  Object.entries(REUSED_CONTRACTS).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.yellow}⏭️ NEXT STEPS:${colors.reset}`);
  console.log('=' . repeat(70));
  console.log('1. ✅ Verify contracts on BSCScan');
  console.log('2. ✅ Update DungeonCore with new contract addresses (requires owner)');
  console.log('3. ✅ Sync configuration to frontend/backend/subgraph:');
  console.log(`   ${colors.blue}cd /Users/sotadic/Documents/DungeonDelversContracts${colors.reset}`);
  console.log(`   ${colors.blue}node scripts/ultimate-config-system.js sync${colors.reset}`);
  console.log('4. ✅ Compile subgraph for deployment');
  console.log('5. ✅ Test all major functions');
  console.log('6. ✅ Update monitoring systems');
  console.log('\n' + '=' . repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n${colors.red}❌ Deployment failed:${colors.reset}`, error);
    process.exit(1);
  });
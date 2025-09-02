const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

/**
 * V25.0.3 步驟 2 (續): 繼續部署剩餘的合約
 * 
 * 使用已部署的 DungeonCore: 0x5B64A5939735Ff762493D9B9666b3e13118c5722
 * 
 * 繼續部署：
 * - Oracle (需要 pool, soulShard, usd 地址)
 * - VRFConsumerV2Plus
 * - 所有 NFT 和遊戲合約
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        V25.0.3 步驟 2 (續) - 繼續部署剩餘合約                        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 部署時間: ${new Date().toISOString()}`);
  console.log(`📦 版本: V25.0.3`);
  console.log(`🔗 網路: BSC Mainnet`);
  console.log('=' . repeat(70));

  // 檢查私鑰
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error('❌ Missing PRIVATE_KEY in .env file');
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👷 部署者: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);

  // 管理員錢包
  const ADMIN_WALLET = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
  console.log(`🔑 管理員錢包: ${ADMIN_WALLET}`);

  // 已部署的合約地址
  const DEPLOYED_CONTRACTS = {
    // 代幣
    TSOUL: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    TUSD1: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa",
    
    // 已部署的 DungeonCore
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722"
  };

  console.log(`\n📌 已部署的合約:`);
  console.log(`  ${colors.green}✅ DungeonCore: ${DEPLOYED_CONTRACTS.DUNGEONCORE}${colors.reset}`);
  console.log(`  TSOUL: ${DEPLOYED_CONTRACTS.TSOUL}`);
  console.log(`  TUSD1: ${DEPLOYED_CONTRACTS.TUSD1}`);
  console.log(`  Uniswap Pool: ${DEPLOYED_CONTRACTS.UNISWAP_POOL}`);

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
    step: "2-continue",
    version: 'V25.0.3',
    deploymentTime: new Date().toISOString(),
    startBlock: 58266666,
    network: 'BSC Mainnet',
    chainId: 56,
    deployer: deployer.address,
    adminWallet: ADMIN_WALLET,
    existingContracts: DEPLOYED_CONTRACTS,
    contracts: {},
    vrfConfig: VRF_CONFIG
  };

  // 獲取已部署的 DungeonCore 合約實例
  const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
  contracts.dungeonCore = DungeonCore.attach(DEPLOYED_CONTRACTS.DUNGEONCORE);
  const dungeonCoreAddress = DEPLOYED_CONTRACTS.DUNGEONCORE;

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}繼續部署剩餘合約${colors.reset}`);
    console.log('=' . repeat(70));

    // 1. 部署 Oracle（修正參數）
    console.log('\n📌 [1/11] 部署 Oracle...');
    console.log('  功能: 價格預言機，計算 USD 價值');
    console.log('  構造參數: poolAddress, soulShardToken, usdToken');
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    contracts.oracle = await Oracle.deploy(
      DEPLOYED_CONTRACTS.UNISWAP_POOL,  // _poolAddress
      DEPLOYED_CONTRACTS.TSOUL,          // _soulShardTokenAddress
      DEPLOYED_CONTRACTS.TUSD1           // _usdTokenAddress
    );
    await contracts.oracle.waitForDeployment();
    const oracleAddress = await contracts.oracle.getAddress();
    console.log(`  ${colors.green}✅ Oracle 部署成功！${colors.reset}`);
    console.log(`  地址: ${oracleAddress}`);
    await contracts.oracle.deploymentTransaction().wait(3);

    // 2. 部署 VRFConsumerV2Plus
    console.log('\n📌 [2/11] 部署 VRFConsumerV2Plus...');
    console.log('  功能: Chainlink VRF 隨機數管理');
    console.log('  構造參數: subscriptionId, vrfCoordinator');
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus");
    contracts.vrfManager = await VRFConsumerV2Plus.deploy(
      VRF_CONFIG.SUBSCRIPTION_ID,  // subscriptionId
      VRF_CONFIG.COORDINATOR        // vrfCoordinator
    );
    await contracts.vrfManager.waitForDeployment();
    const vrfManagerAddress = await contracts.vrfManager.getAddress();
    console.log(`  ${colors.green}✅ VRFConsumerV2Plus 部署成功！${colors.reset}`);
    console.log(`  地址: ${vrfManagerAddress}`);
    await contracts.vrfManager.deploymentTransaction().wait(3);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}部署 NFT 合約${colors.reset}`);
    console.log('=' . repeat(70));

    // 3. 部署 Hero NFT
    console.log('\n📌 [3/11] 部署 Hero NFT...');
    const Hero = await hre.ethers.getContractFactory("Hero");
    contracts.hero = await Hero.deploy(dungeonCoreAddress);
    await contracts.hero.waitForDeployment();
    const heroAddress = await contracts.hero.getAddress();
    console.log(`  ${colors.green}✅ Hero 部署成功！${colors.reset}`);
    console.log(`  地址: ${heroAddress}`);
    await contracts.hero.deploymentTransaction().wait(3);

    // 4. 部署 Relic NFT
    console.log('\n📌 [4/11] 部署 Relic NFT...');
    const Relic = await hre.ethers.getContractFactory("Relic");
    contracts.relic = await Relic.deploy(dungeonCoreAddress);
    await contracts.relic.waitForDeployment();
    const relicAddress = await contracts.relic.getAddress();
    console.log(`  ${colors.green}✅ Relic 部署成功！${colors.reset}`);
    console.log(`  地址: ${relicAddress}`);
    await contracts.relic.deploymentTransaction().wait(3);

    // 5. 部署 Party NFT
    console.log('\n📌 [5/11] 部署 Party NFT...');
    const Party = await hre.ethers.getContractFactory("Party");
    contracts.party = await Party.deploy(dungeonCoreAddress);
    await contracts.party.waitForDeployment();
    const partyAddress = await contracts.party.getAddress();
    console.log(`  ${colors.green}✅ Party 部署成功！${colors.reset}`);
    console.log(`  地址: ${partyAddress}`);
    await contracts.party.deploymentTransaction().wait(3);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}部署遊戲邏輯合約${colors.reset}`);
    console.log('=' . repeat(70));

    // 6. 部署 DungeonStorage
    console.log('\n📌 [6/11] 部署 DungeonStorage...');
    const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
    contracts.dungeonStorage = await DungeonStorage.deploy(dungeonCoreAddress);
    await contracts.dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await contracts.dungeonStorage.getAddress();
    console.log(`  ${colors.green}✅ DungeonStorage 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonStorageAddress}`);
    await contracts.dungeonStorage.deploymentTransaction().wait(3);

    // 7. 部署 DungeonMaster
    console.log('\n📌 [7/11] 部署 DungeonMaster...');
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    contracts.dungeonMaster = await DungeonMaster.deploy(dungeonCoreAddress);
    await contracts.dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await contracts.dungeonMaster.getAddress();
    console.log(`  ${colors.green}✅ DungeonMaster 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonMasterAddress}`);
    await contracts.dungeonMaster.deploymentTransaction().wait(3);

    // 8. 部署 AltarOfAscension
    console.log('\n📌 [8/11] 部署 AltarOfAscension...');
    const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
    contracts.altarOfAscension = await AltarOfAscension.deploy(dungeonCoreAddress);
    await contracts.altarOfAscension.waitForDeployment();
    const altarAddress = await contracts.altarOfAscension.getAddress();
    console.log(`  ${colors.green}✅ AltarOfAscension 部署成功！${colors.reset}`);
    console.log(`  地址: ${altarAddress}`);
    await contracts.altarOfAscension.deploymentTransaction().wait(3);

    // 9. 部署 PlayerVault
    console.log('\n📌 [9/11] 部署 PlayerVault...');
    const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
    contracts.playerVault = await PlayerVault.deploy(dungeonCoreAddress);
    await contracts.playerVault.waitForDeployment();
    const playerVaultAddress = await contracts.playerVault.getAddress();
    console.log(`  ${colors.green}✅ PlayerVault 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerVaultAddress}`);
    await contracts.playerVault.deploymentTransaction().wait(3);

    // 10. 部署 PlayerProfile
    console.log('\n📌 [10/11] 部署 PlayerProfile...');
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    contracts.playerProfile = await PlayerProfile.deploy(dungeonCoreAddress);
    await contracts.playerProfile.waitForDeployment();
    const playerProfileAddress = await contracts.playerProfile.getAddress();
    console.log(`  ${colors.green}✅ PlayerProfile 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerProfileAddress}`);
    await contracts.playerProfile.deploymentTransaction().wait(3);

    // 11. 部署 VIPStaking
    console.log('\n📌 [11/11] 部署 VIPStaking...');
    const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
    contracts.vipStaking = await VIPStaking.deploy(dungeonCoreAddress);
    await contracts.vipStaking.waitForDeployment();
    const vipStakingAddress = await contracts.vipStaking.getAddress();
    console.log(`  ${colors.green}✅ VIPStaking 部署成功！${colors.reset}`);
    console.log(`  地址: ${vipStakingAddress}`);
    await contracts.vipStaking.deploymentTransaction().wait(3);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}配置合約連接${colors.reset}`);
    console.log('=' . repeat(70));

    // 配置 DungeonCore 中的所有模組地址
    console.log('\n🔧 配置 DungeonCore 模組地址...');
    
    console.log('  設置 Oracle...');
    await contracts.dungeonCore.setOracle(oracleAddress);
    
    // SoulShard 和 USD 已經在 DungeonCore 構造時設置
    console.log('  ✅ SoulShard (TSOUL) - 已在構造時設置');
    console.log('  ✅ USD (TUSD1) - 已在構造時設置');
    
    console.log('  設置 Hero...');
    await contracts.dungeonCore.setHeroContract(heroAddress);
    
    console.log('  設置 Relic...');
    await contracts.dungeonCore.setRelicContract(relicAddress);
    
    console.log('  設置 Party...');
    await contracts.dungeonCore.setPartyContract(partyAddress);
    
    console.log('  設置 DungeonMaster...');
    await contracts.dungeonCore.setDungeonMaster(dungeonMasterAddress);
    
    console.log('  設置 DungeonStorage...');
    await contracts.dungeonCore.setDungeonStorage(dungeonStorageAddress);
    
    console.log('  設置 AltarOfAscension...');
    await contracts.dungeonCore.setAltarOfAscension(altarAddress);
    
    console.log('  設置 PlayerVault...');
    await contracts.dungeonCore.setPlayerVault(playerVaultAddress);
    
    console.log('  設置 PlayerProfile...');
    await contracts.dungeonCore.setPlayerProfile(playerProfileAddress);
    
    console.log('  設置 VIPStaking...');
    await contracts.dungeonCore.setVipStaking(vipStakingAddress);
    
    console.log('  設置 VRFManager...');
    await contracts.dungeonCore.setVRFManager(vrfManagerAddress);
    
    console.log(`  ${colors.green}✅ DungeonCore 配置完成！${colors.reset}`);

    // 配置 DungeonMaster 與 DungeonStorage 的連接
    console.log('\n🔧 配置 DungeonMaster...');
    await contracts.dungeonMaster.setDungeonStorage(dungeonStorageAddress);
    console.log(`  ${colors.green}✅ DungeonStorage 已連接${colors.reset}`);

    // 配置 VRF Manager
    console.log('\n🔧 配置 VRF Manager...');
    await contracts.vrfManager.setDungeonCore(dungeonCoreAddress);
    await contracts.vrfManager.setAltarOfAscension(altarAddress);
    await contracts.vrfManager.setSubscriptionId(VRF_CONFIG.SUBSCRIPTION_ID);
    console.log(`  ${colors.green}✅ VRF Manager 配置完成！${colors.reset}`);

    // 收集所有部署的地址
    deploymentInfo.contracts = {
      // 已存在
      DungeonCore: dungeonCoreAddress,
      
      // 新部署
      Oracle: oracleAddress,
      VRFManagerV2Plus: vrfManagerAddress,
      Hero: heroAddress,
      Relic: relicAddress,
      Party: partyAddress,
      DungeonStorage: dungeonStorageAddress,
      DungeonMaster: dungeonMasterAddress,
      AltarOfAscension: altarAddress,
      PlayerVault: playerVaultAddress,
      PlayerProfile: playerProfileAddress,
      VIPStaking: vipStakingAddress
    };

    // 保存部署信息
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentPath = path.join(__dirname, '..', 'deployments', `v25-0-3-complete-${timestamp}.json`);
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 部署信息保存到: ${deploymentPath}`);

    // 創建完整的 .env.v25.0.3 配置文件
    const envContent = `# V25.0.3 完整部署配置
# 生成時間: ${deploymentInfo.deploymentTime}
# 網路: BSC Mainnet
# 起始區塊: 58266666
# 子圖版本: v3.9.4

# ==================== 代幣合約 ====================
VITE_SOULSHARD_ADDRESS=${DEPLOYED_CONTRACTS.TSOUL}
VITE_USD_ADDRESS=${DEPLOYED_CONTRACTS.TUSD1}
VITE_UNISWAP_POOL_ADDRESS=${DEPLOYED_CONTRACTS.UNISWAP_POOL}

# ==================== 核心基礎設施 ====================
VITE_DUNGEONCORE_ADDRESS=${dungeonCoreAddress}
VITE_ORACLE_ADDRESS=${oracleAddress}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${vrfManagerAddress}
VITE_VRFMANAGER_ADDRESS=${vrfManagerAddress}

# ==================== NFT 合約 ====================
VITE_HERO_ADDRESS=${heroAddress}
VITE_RELIC_ADDRESS=${relicAddress}
VITE_PARTY_ADDRESS=${partyAddress}

# ==================== 遊戲邏輯合約 ====================
VITE_DUNGEONSTORAGE_ADDRESS=${dungeonStorageAddress}
VITE_DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}
VITE_ALTAROFASCENSION_ADDRESS=${altarAddress}
VITE_PLAYERVAULT_ADDRESS=${playerVaultAddress}
VITE_PLAYERPROFILE_ADDRESS=${playerProfileAddress}
VITE_VIPSTAKING_ADDRESS=${vipStakingAddress}

# ==================== VRF 配置 ====================
VITE_VRF_COORDINATOR=${VRF_CONFIG.COORDINATOR}
VITE_VRF_KEY_HASH=${VRF_CONFIG.KEY_HASH}
VITE_VRF_SUBSCRIPTION_ID=${VRF_CONFIG.SUBSCRIPTION_ID}
VITE_VRF_CALLBACK_GAS_LIMIT=${VRF_CONFIG.CALLBACK_GAS_LIMIT}
VITE_VRF_REQUEST_CONFIRMATIONS=${VRF_CONFIG.REQUEST_CONFIRMATIONS}
VITE_VRF_ENABLED=true
VITE_VRF_PRICE=0
VITE_PLATFORM_FEE=0

# ==================== 服務端點 ====================
VITE_SUBGRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.4
VITE_SUBGRAPH_DECENTRALIZED_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
VITE_SUBGRAPH_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 網路配置 ====================
VITE_CONTRACT_VERSION=V25.0.3
VITE_START_BLOCK=58266666
VITE_DEPLOYMENT_DATE=${deploymentInfo.deploymentTime}
VITE_ADMIN_WALLET=${ADMIN_WALLET}
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56
`;

    fs.writeFileSync('.env.v25.0.3', envContent);
    console.log(`📁 完整配置保存到: .env.v25.0.3`);

    // 顯示部署總結
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 部署完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 部署總結:');
    console.log(`  總合約數: 14 個`);
    console.log(`  版本: V25.0.3`);
    console.log(`  起始區塊: 58266666`);
    
    console.log('\n📝 完整合約地址列表:');
    console.log(`\n${colors.yellow}代幣:${colors.reset}`);
    console.log(`  TSOUL: ${DEPLOYED_CONTRACTS.TSOUL}`);
    console.log(`  TUSD1: ${DEPLOYED_CONTRACTS.TUSD1}`);
    console.log(`  Uniswap Pool: ${DEPLOYED_CONTRACTS.UNISWAP_POOL}`);
    
    console.log(`\n${colors.yellow}核心:${colors.reset}`);
    console.log(`  DungeonCore: ${dungeonCoreAddress}`);
    console.log(`  Oracle: ${oracleAddress}`);
    console.log(`  VRFManagerV2Plus: ${vrfManagerAddress}`);
    
    console.log(`\n${colors.yellow}NFT:${colors.reset}`);
    console.log(`  Hero: ${heroAddress}`);
    console.log(`  Relic: ${relicAddress}`);
    console.log(`  Party: ${partyAddress}`);
    
    console.log(`\n${colors.yellow}遊戲:${colors.reset}`);
    console.log(`  DungeonStorage: ${dungeonStorageAddress}`);
    console.log(`  DungeonMaster: ${dungeonMasterAddress}`);
    console.log(`  AltarOfAscension: ${altarAddress}`);
    console.log(`  PlayerVault: ${playerVaultAddress}`);
    console.log(`  PlayerProfile: ${playerProfileAddress}`);
    console.log(`  VIPStaking: ${vipStakingAddress}`);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    console.log('1. ✅ 驗證合約: npx hardhat run scripts/verify-v25-0-3-full.js --network bsc');
    console.log('2. ✅ 同步配置: node scripts/sync-v25-0-3-full.js');
    console.log('3. ✅ 在 Chainlink VRF 網站添加 VRF 消費者');
    console.log('4. ✅ 測試合約功能');
    console.log('=' . repeat(70));

  } catch (error) {
    console.error(`\n${colors.red}❌ 部署失敗:${colors.reset}`, error);
    throw error;
  }
}

main()
  .then(() => {
    console.log(`\n${colors.green}✨ 腳本執行成功${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 腳本執行失敗:${colors.reset}`, error);
    process.exit(1);
  });
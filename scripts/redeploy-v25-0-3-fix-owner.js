const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

/**
 * V25.0.3 修正部署 - 重新部署 9 個 owner 設置錯誤的合約
 * 
 * 問題：原部署腳本錯誤地使用 dungeonCoreAddress 作為 initialOwner
 * 解決：使用正確的管理員錢包地址作為 owner
 * 
 * 需要重新部署的合約：
 * 1. DungeonStorage
 * 2. DungeonMaster
 * 3. Hero
 * 4. Relic
 * 5. Party
 * 6. AltarOfAscension
 * 7. PlayerVault
 * 8. PlayerProfile
 * 9. VIPStaking
 * 
 * 保持不變的合約（正確的）：
 * - DungeonCore: 0x5B64A5939735Ff762493D9B9666b3e13118c5722
 * - Oracle: 0xEE322Eff70320759487f67875113C062AC1F4cfB
 * - VRFConsumerV2Plus: 0xa94555C309Dd83d9fB0531852d209c46Fa50637f
 * - TSOUL: 0xB73FE158689EAB3396B64794b573D4BEc7113412
 * - TUSD1: 0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61
 * - Uniswap Pool: 0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa
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
  console.log(`${colors.cyan}║         V25.0.3 修正部署 - 重新部署 Owner 錯誤的合約                ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📅 部署時間: ${new Date().toISOString()}`);
  console.log(`📦 版本: V25.0.3-FIX`);
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
  
  if (balance < ethers.parseEther("0.05")) {
    throw new Error('❌ 餘額不足，需要至少 0.05 BNB');
  }

  // 正確的管理員錢包地址
  const ADMIN_WALLET = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
  console.log(`🔑 管理員錢包（將作為 owner）: ${ADMIN_WALLET}`);

  // 保持不變的合約地址
  const KEEP_CONTRACTS = {
    DUNGEONCORE: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
    ORACLE: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
    VRF_MANAGER: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f",
    TSOUL: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
    TUSD1: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
    UNISWAP_POOL: "0xD082e41ef5dBa0209e5Dc7CFBC04D8383D6d50aa"
  };

  console.log(`\n📌 保持不變的合約:`);
  console.log(`  ${colors.green}✅ DungeonCore: ${KEEP_CONTRACTS.DUNGEONCORE}${colors.reset}`);
  console.log(`  ${colors.green}✅ Oracle: ${KEEP_CONTRACTS.ORACLE}${colors.reset}`);
  console.log(`  ${colors.green}✅ VRFConsumerV2Plus: ${KEEP_CONTRACTS.VRF_MANAGER}${colors.reset}`);

  const contracts = {};
  const deploymentInfo = {
    step: 'fix-owner',
    version: 'V25.0.3-FIX',
    deploymentTime: new Date().toISOString(),
    network: 'BSC Mainnet',
    chainId: 56,
    deployer: deployer.address,
    adminWallet: ADMIN_WALLET,
    keptContracts: KEEP_CONTRACTS,
    newContracts: {}
  };

  try {
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.magenta}開始重新部署合約（使用正確的 owner）${colors.reset}`);
    console.log('=' . repeat(70));

    // 1. 部署 DungeonStorage
    console.log('\n📌 [1/9] 部署 DungeonStorage...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
    contracts.dungeonStorage = await DungeonStorage.deploy(ADMIN_WALLET);
    await contracts.dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await contracts.dungeonStorage.getAddress();
    console.log(`  ${colors.green}✅ DungeonStorage 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonStorageAddress}`);
    await contracts.dungeonStorage.deploymentTransaction().wait(3);

    // 2. 部署 DungeonMaster
    console.log('\n📌 [2/9] 部署 DungeonMaster...');
    console.log(`  正確參數: _initialOwner = ${ADMIN_WALLET}`);
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
    contracts.dungeonMaster = await DungeonMaster.deploy(ADMIN_WALLET);
    await contracts.dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await contracts.dungeonMaster.getAddress();
    console.log(`  ${colors.green}✅ DungeonMaster 部署成功！${colors.reset}`);
    console.log(`  地址: ${dungeonMasterAddress}`);
    await contracts.dungeonMaster.deploymentTransaction().wait(3);

    // 3. 部署 Hero NFT
    console.log('\n📌 [3/9] 部署 Hero NFT...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const Hero = await hre.ethers.getContractFactory("Hero");
    contracts.hero = await Hero.deploy(ADMIN_WALLET);
    await contracts.hero.waitForDeployment();
    const heroAddress = await contracts.hero.getAddress();
    console.log(`  ${colors.green}✅ Hero 部署成功！${colors.reset}`);
    console.log(`  地址: ${heroAddress}`);
    await contracts.hero.deploymentTransaction().wait(3);

    // 4. 部署 Relic NFT
    console.log('\n📌 [4/9] 部署 Relic NFT...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const Relic = await hre.ethers.getContractFactory("Relic");
    contracts.relic = await Relic.deploy(ADMIN_WALLET);
    await contracts.relic.waitForDeployment();
    const relicAddress = await contracts.relic.getAddress();
    console.log(`  ${colors.green}✅ Relic 部署成功！${colors.reset}`);
    console.log(`  地址: ${relicAddress}`);
    await contracts.relic.deploymentTransaction().wait(3);

    // 5. 部署 Party NFT
    console.log('\n📌 [5/9] 部署 Party NFT...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const Party = await hre.ethers.getContractFactory("Party");
    contracts.party = await Party.deploy(ADMIN_WALLET);
    await contracts.party.waitForDeployment();
    const partyAddress = await contracts.party.getAddress();
    console.log(`  ${colors.green}✅ Party 部署成功！${colors.reset}`);
    console.log(`  地址: ${partyAddress}`);
    await contracts.party.deploymentTransaction().wait(3);

    // 6. 部署 AltarOfAscension
    console.log('\n📌 [6/9] 部署 AltarOfAscension...');
    console.log(`  正確參數: _initialOwner = ${ADMIN_WALLET}`);
    const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
    contracts.altarOfAscension = await AltarOfAscension.deploy(ADMIN_WALLET);
    await contracts.altarOfAscension.waitForDeployment();
    const altarAddress = await contracts.altarOfAscension.getAddress();
    console.log(`  ${colors.green}✅ AltarOfAscension 部署成功！${colors.reset}`);
    console.log(`  地址: ${altarAddress}`);
    await contracts.altarOfAscension.deploymentTransaction().wait(3);

    // 7. 部署 PlayerVault
    console.log('\n📌 [7/9] 部署 PlayerVault...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
    contracts.playerVault = await PlayerVault.deploy(ADMIN_WALLET);
    await contracts.playerVault.waitForDeployment();
    const playerVaultAddress = await contracts.playerVault.getAddress();
    console.log(`  ${colors.green}✅ PlayerVault 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerVaultAddress}`);
    await contracts.playerVault.deploymentTransaction().wait(3);

    // 8. 部署 PlayerProfile
    console.log('\n📌 [8/9] 部署 PlayerProfile...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    contracts.playerProfile = await PlayerProfile.deploy(ADMIN_WALLET);
    await contracts.playerProfile.waitForDeployment();
    const playerProfileAddress = await contracts.playerProfile.getAddress();
    console.log(`  ${colors.green}✅ PlayerProfile 部署成功！${colors.reset}`);
    console.log(`  地址: ${playerProfileAddress}`);
    await contracts.playerProfile.deploymentTransaction().wait(3);

    // 9. 部署 VIPStaking
    console.log('\n📌 [9/9] 部署 VIPStaking...');
    console.log(`  正確參數: initialOwner = ${ADMIN_WALLET}`);
    const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
    contracts.vipStaking = await VIPStaking.deploy(ADMIN_WALLET);
    await contracts.vipStaking.waitForDeployment();
    const vipStakingAddress = await contracts.vipStaking.getAddress();
    console.log(`  ${colors.green}✅ VIPStaking 部署成功！${colors.reset}`);
    console.log(`  地址: ${vipStakingAddress}`);
    await contracts.vipStaking.deploymentTransaction().wait(3);

    // 收集所有新部署的地址
    deploymentInfo.newContracts = {
      DungeonStorage: dungeonStorageAddress,
      DungeonMaster: dungeonMasterAddress,
      Hero: heroAddress,
      Relic: relicAddress,
      Party: partyAddress,
      AltarOfAscension: altarAddress,
      PlayerVault: playerVaultAddress,
      PlayerProfile: playerProfileAddress,
      VIPStaking: vipStakingAddress
    };

    // 保存部署信息
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const deploymentPath = path.join(__dirname, '..', 'deployments', `v25-0-3-fix-${timestamp}.json`);
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📁 部署信息保存到: ${deploymentPath}`);

    // 更新 .env 文件
    const envContent = `# V25.0.3-FIX 完整部署配置
# 生成時間: ${deploymentInfo.deploymentTime}
# 網路: BSC Mainnet
# 起始區塊: 58266666
# 子圖版本: v3.9.4

# ==================== 代幣合約（不變）====================
VITE_SOULSHARD_ADDRESS=${KEEP_CONTRACTS.TSOUL}
VITE_USD_ADDRESS=${KEEP_CONTRACTS.TUSD1}
VITE_UNISWAP_POOL_ADDRESS=${KEEP_CONTRACTS.UNISWAP_POOL}

# ==================== 核心基礎設施（部分不變）====================
VITE_DUNGEONCORE_ADDRESS=${KEEP_CONTRACTS.DUNGEONCORE}
VITE_ORACLE_ADDRESS=${KEEP_CONTRACTS.ORACLE}
VITE_VRF_MANAGER_V2PLUS_ADDRESS=${KEEP_CONTRACTS.VRF_MANAGER}
VITE_VRFMANAGER_ADDRESS=${KEEP_CONTRACTS.VRF_MANAGER}

# ==================== NFT 合約（新部署）====================
VITE_HERO_ADDRESS=${heroAddress}
VITE_RELIC_ADDRESS=${relicAddress}
VITE_PARTY_ADDRESS=${partyAddress}

# ==================== 遊戲邏輯合約（新部署）====================
VITE_DUNGEONSTORAGE_ADDRESS=${dungeonStorageAddress}
VITE_DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}
VITE_ALTAROFASCENSION_ADDRESS=${altarAddress}
VITE_PLAYERVAULT_ADDRESS=${playerVaultAddress}
VITE_PLAYERPROFILE_ADDRESS=${playerProfileAddress}
VITE_VIPSTAKING_ADDRESS=${vipStakingAddress}

# ==================== 管理員配置 ====================
VITE_ADMIN_WALLET=${ADMIN_WALLET}`;

    fs.writeFileSync('.env.v25.0.3.fixed', envContent);
    console.log(`📁 新配置保存到: .env.v25.0.3.fixed`);

    // 顯示部署總結
    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.green}🎉 V25.0.3 修正部署完成！${colors.reset}`);
    console.log('=' . repeat(70));
    
    console.log('\n📊 部署總結:');
    console.log(`  重新部署: 9 個合約`);
    console.log(`  保持不變: 6 個合約`);
    console.log(`  版本: V25.0.3-FIX`);
    
    console.log('\n📝 新合約地址:');
    console.log(`${colors.yellow}遊戲邏輯:${colors.reset}`);
    console.log(`  DungeonStorage: ${dungeonStorageAddress}`);
    console.log(`  DungeonMaster: ${dungeonMasterAddress}`);
    console.log(`  AltarOfAscension: ${altarAddress}`);
    console.log(`  PlayerVault: ${playerVaultAddress}`);
    console.log(`  PlayerProfile: ${playerProfileAddress}`);
    console.log(`  VIPStaking: ${vipStakingAddress}`);
    
    console.log(`${colors.yellow}NFT:${colors.reset}`);
    console.log(`  Hero: ${heroAddress}`);
    console.log(`  Relic: ${relicAddress}`);
    console.log(`  Party: ${partyAddress}`);

    console.log('\n' + '=' . repeat(70));
    console.log(`${colors.cyan}⏭️ 下一步操作:${colors.reset}`);
    console.log('=' . repeat(70));
    console.log('1. ✅ 配置合約連接: npx hardhat run scripts/configure-v25-0-3-fixed.js --network bsc');
    console.log('2. ✅ 驗證新合約: npx hardhat run scripts/verify-v25-0-3-fixed.js --network bsc');
    console.log('3. ✅ 更新前端/後端/子圖配置');
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
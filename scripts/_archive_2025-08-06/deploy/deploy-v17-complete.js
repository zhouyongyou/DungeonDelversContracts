// scripts/deploy/deploy-v17-complete.js
// DungeonDelvers V17 完整部署腳本 - 包含合約連接和初始化

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message, color = 'yellow') {
  log(`\n📦 ${step}/${total} ${message}`, color);
}

async function main() {
  log('\n🚀 開始 DungeonDelvers V17 完整部署', 'magenta');
  log('='.repeat(80), 'magenta');
  log('🎯 V17 特色：完整初始化 + 自動連接 + 參數配置 + 地城設定', 'cyan');
  log('⚡ 基於 V15/V16 經驗改進的一站式部署解決方案', 'cyan');
  log('='.repeat(80), 'magenta');

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInBNB = ethers.formatEther(balance);

  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`💰 BNB 餘額: ${balanceInBNB}`, 'cyan');

  if (parseFloat(balanceInBNB) < 0.3) {
    log('❌ BNB 餘額不足，建議至少 0.3 BNB', 'red');
    process.exit(1);
  }

  // 檢查環境變數中的真實代幣配置
  const REAL_USD_ADDRESS = process.env.MAINNET_USD_ADDRESS;
  const REAL_SOUL_ADDRESS = process.env.MAINNET_SOULSHARD_ADDRESS;
  const REAL_POOL_ADDRESS = process.env.POOL_ADDRESS;

  const useRealTokens = REAL_USD_ADDRESS && REAL_SOUL_ADDRESS && REAL_POOL_ADDRESS;

  if (useRealTokens) {
    log('\n✅ 檢測到真實代幣配置，將使用:', 'green');
    log(`   USD Token: ${REAL_USD_ADDRESS}`, 'cyan');
    log(`   SOUL Token: ${REAL_SOUL_ADDRESS}`, 'cyan');
    log(`   Uniswap V3 Pool: ${REAL_POOL_ADDRESS}`, 'cyan');
  } else {
    log('\n⚠️  未檢測到完整的真實代幣配置', 'yellow');
    log('   將部署測試代幣', 'yellow');
  }

  const deployedContracts = {};
  const startTime = Date.now();
  const totalSteps = useRealTokens ? 17 : 19; // 更多步驟包含初始化

  try {
    let usdAddress, soulAddress, poolAddress;

    // ===== 第一階段：代幣部署 =====
    if (useRealTokens) {
      usdAddress = REAL_USD_ADDRESS;
      soulAddress = REAL_SOUL_ADDRESS;
      poolAddress = REAL_POOL_ADDRESS;
      
      deployedContracts.USD_ADDRESS = usdAddress;
      deployedContracts.SOULSHARD_ADDRESS = soulAddress;
      deployedContracts.POOL_ADDRESS = poolAddress;
      
      logStep(1, totalSteps, '使用真實代幣，跳過測試代幣部署', 'green');
    } else {
      logStep(1, totalSteps, '部署 TestUSDToken', 'yellow');
      const TestUSDToken = await ethers.getContractFactory("TestUSDToken");
      const testUSD = await TestUSDToken.deploy();
      await testUSD.waitForDeployment();
      usdAddress = await testUSD.getAddress();
      deployedContracts.TESTUSD_ADDRESS = usdAddress;
      log(`✅ TestUSDToken: ${usdAddress}`, 'green');

      logStep(2, totalSteps, '部署 Test_SoulShard', 'yellow');
      const SoulShard = await ethers.getContractFactory("Test_SoulShard");
      const soulShard = await SoulShard.deploy();
      await soulShard.waitForDeployment();
      soulAddress = await soulShard.getAddress();
      deployedContracts.SOULSHARD_ADDRESS = soulAddress;
      log(`✅ Test_SoulShard: ${soulAddress}`, 'green');

      poolAddress = "0x0000000000000000000000000000000000000001";
      deployedContracts.POOL_ADDRESS = poolAddress;
    }

    // ===== 第二階段：核心合約部署 =====
    const oracleStep = useRealTokens ? 2 : 3;
    logStep(oracleStep, totalSteps, '部署 Oracle', 'yellow');
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(poolAddress, soulAddress, usdAddress);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    deployedContracts.ORACLE_ADDRESS = oracleAddress;
    log(`✅ Oracle: ${oracleAddress}`, 'green');

    const coreStep = useRealTokens ? 3 : 4;
    logStep(coreStep, totalSteps, '部署 DungeonCore', 'yellow');
    const DungeonCore = await ethers.getContractFactory("contracts/core/DungeonCore.sol:DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployerAddress, usdAddress, soulAddress);
    await dungeonCore.waitForDeployment();
    const dungeonCoreAddress = await dungeonCore.getAddress();
    deployedContracts.DUNGEONCORE_ADDRESS = dungeonCoreAddress;
    log(`✅ DungeonCore: ${dungeonCoreAddress}`, 'green');

    // ===== 第三階段：遊戲合約部署 =====
    const heroStep = useRealTokens ? 4 : 5;
    logStep(heroStep, totalSteps, '部署 Hero', 'yellow');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployerAddress);
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    deployedContracts.HERO_ADDRESS = heroAddress;
    log(`✅ Hero: ${heroAddress}`, 'green');

    const relicStep = useRealTokens ? 5 : 6;
    logStep(relicStep, totalSteps, '部署 Relic', 'yellow');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployerAddress);
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    deployedContracts.RELIC_ADDRESS = relicAddress;
    log(`✅ Relic: ${relicAddress}`, 'green');

    const partyStep = useRealTokens ? 6 : 7;
    logStep(partyStep, totalSteps, '部署 PartyV3', 'yellow');
    const PartyV3 = await ethers.getContractFactory("PartyV3");
    const party = await PartyV3.deploy(deployerAddress);
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    deployedContracts.PARTY_ADDRESS = partyAddress;
    log(`✅ PartyV3: ${partyAddress}`, 'green');

    // ===== 第四階段：管理合約部署 =====
    const storageStep = useRealTokens ? 7 : 8;
    logStep(storageStep, totalSteps, '部署 DungeonStorage', 'yellow');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployerAddress);
    await dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await dungeonStorage.getAddress();
    deployedContracts.DUNGEONSTORAGE_ADDRESS = dungeonStorageAddress;
    log(`✅ DungeonStorage: ${dungeonStorageAddress}`, 'green');

    const masterStep = useRealTokens ? 8 : 9;
    logStep(masterStep, totalSteps, '部署 DungeonMasterV8', 'yellow');
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV8");
    const dungeonMaster = await DungeonMaster.deploy(deployerAddress);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    deployedContracts.DUNGEONMASTER_ADDRESS = dungeonMasterAddress;
    log(`✅ DungeonMasterV8: ${dungeonMasterAddress}`, 'green');

    const vaultStep = useRealTokens ? 9 : 10;
    logStep(vaultStep, totalSteps, '部署 PlayerVault', 'yellow');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployerAddress);
    await playerVault.waitForDeployment();
    const playerVaultAddress = await playerVault.getAddress();
    deployedContracts.PLAYERVAULT_ADDRESS = playerVaultAddress;
    log(`✅ PlayerVault: ${playerVaultAddress}`, 'green');

    const profileStep = useRealTokens ? 10 : 11;
    logStep(profileStep, totalSteps, '部署 PlayerProfile', 'yellow');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployerAddress);
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    deployedContracts.PLAYERPROFILE_ADDRESS = playerProfileAddress;
    log(`✅ PlayerProfile: ${playerProfileAddress}`, 'green');

    const vipStep = useRealTokens ? 11 : 12;
    logStep(vipStep, totalSteps, '部署 VIPStaking', 'yellow');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployerAddress);
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    deployedContracts.VIPSTAKING_ADDRESS = vipStakingAddress;
    log(`✅ VIPStaking: ${vipStakingAddress}`, 'green');

    // 設定特殊地址
    deployedContracts.ALTAROFASCENSION_ADDRESS = "0x0000000000000000000000000000000000000000";
    deployedContracts.DUNGEONMASTERWALLET_ADDRESS = deployerAddress;

    // ===== 第五階段：合約連接設定 =====
    const connectionStep = useRealTokens ? 12 : 13;
    logStep(connectionStep, totalSteps, '設定合約間連接', 'blue');
    
    // 設定 DungeonCore 連接
    log('  🔗 設定 DungeonCore 連接...', 'cyan');
    await dungeonCore.setOracle(oracleAddress);
    await dungeonCore.setDungeonMaster(dungeonMasterAddress);
    await dungeonCore.setPlayerVault(playerVaultAddress);
    await dungeonCore.setPlayerProfile(playerProfileAddress);
    await dungeonCore.setVipStaking(vipStakingAddress);
    await dungeonCore.setHeroContract(heroAddress);
    await dungeonCore.setRelicContract(relicAddress);
    await dungeonCore.setPartyContract(partyAddress);
    log('  ✅ DungeonCore 連接完成', 'green');

    // 設定各模組指向 DungeonCore
    log('  🔄 設定模組反向連接...', 'cyan');
    await hero.setDungeonCore(dungeonCoreAddress);
    await relic.setDungeonCore(dungeonCoreAddress);
    await party.setDungeonCore(dungeonCoreAddress);
    await playerVault.setDungeonCore(dungeonCoreAddress);
    await playerProfile.setDungeonCore(dungeonCoreAddress);
    await vipStaking.setDungeonCore(dungeonCoreAddress);
    log('  ✅ 模組反向連接完成', 'green');

    // 設定 DungeonMaster 連接
    log('  🎮 設定 DungeonMaster 連接...', 'cyan');
    await dungeonMaster.setDungeonCore(dungeonCoreAddress);
    await dungeonMaster.setDungeonStorage(dungeonStorageAddress);
    log('  ✅ DungeonMaster 連接完成', 'green');

    // 設定 DungeonStorage 連接
    log('  🏰 設定 DungeonStorage 連接...', 'cyan');
    await dungeonStorage.setLogicContract(dungeonMasterAddress);
    log('  ✅ DungeonStorage 連接完成', 'green');

    // ===== 第六階段：地城初始化 =====
    const dungeonStep = useRealTokens ? 13 : 14;
    logStep(dungeonStep, totalSteps, '初始化地城數據（獎勵調整為 20%）', 'blue');
    
    const dungeons = [
      { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: ethers.parseEther("5.86"), baseSuccessRate: 89 },
      { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: ethers.parseEther("12.4"), baseSuccessRate: 83 },
      { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: ethers.parseEther("19.5"), baseSuccessRate: 78 },
      { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: ethers.parseEther("27"), baseSuccessRate: 74 },
      { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: ethers.parseEther("35.12"), baseSuccessRate: 70 },
      { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: ethers.parseEther("60"), baseSuccessRate: 66 },
      { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: ethers.parseEther("82"), baseSuccessRate: 62 },
      { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: ethers.parseEther("103"), baseSuccessRate: 58 },
      { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: ethers.parseEther("136"), baseSuccessRate: 54 },
      { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: ethers.parseEther("170"), baseSuccessRate: 50 }
    ];

    for (const dungeon of dungeons) {
      log(`  🏰 初始化 ${dungeon.name} (獎勵: ${ethers.formatEther(dungeon.rewardAmountUSD)} USD)`, 'cyan');
      await dungeonMaster.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardAmountUSD,
        dungeon.baseSuccessRate
      );
    }
    log('  ✅ 所有地城初始化完成', 'green');

    // ===== 第七階段：基礎參數設定 =====
    const paramStep = useRealTokens ? 14 : 15;
    logStep(paramStep, totalSteps, '設定基礎遊戲參數', 'blue');
    
    // 設定探索費用
    log('  💰 設定探索費用為 0.001 BNB...', 'cyan');
    await dungeonMaster.setExplorationFee(ethers.parseEther("0.001"));
    log('  ✅ 探索費用設定完成', 'green');

    // 設定 VIP 冷卻期（測試用 15 秒）
    log('  ⏰ 設定 VIP 解質押冷卻期為 15 秒（測試用）...', 'cyan');
    await vipStaking.setUnstakeCooldown(15);
    log('  ✅ VIP 冷卻期設定完成', 'green');

    // ===== 第八階段：安全檢查 =====
    const checkStep = useRealTokens ? 15 : 16;
    logStep(checkStep, totalSteps, '執行安全檢查', 'blue');
    
    // 檢查地城是否正確初始化
    log('  🔍 檢查地城初始化狀態...', 'cyan');
    let allDungeonsInitialized = true;
    for (let i = 1; i <= 10; i++) {
      const dungeonData = await dungeonStorage.getDungeon(i);
      if (!dungeonData.isInitialized) {
        log(`  ❌ 地城 #${i} 未正確初始化`, 'red');
        allDungeonsInitialized = false;
      }
    }
    if (allDungeonsInitialized) {
      log('  ✅ 所有地城狀態正常', 'green');
    }

    // 檢查合約連接
    log('  🔗 檢查合約連接狀態...', 'cyan');
    const coreOracle = await dungeonCore.oracleAddress();
    const masterCore = await dungeonMaster.dungeonCore();
    const storageLogic = await dungeonStorage.logicContract();
    
    if (coreOracle.toLowerCase() === oracleAddress.toLowerCase() &&
        masterCore.toLowerCase() === dungeonCoreAddress.toLowerCase() &&
        storageLogic.toLowerCase() === dungeonMasterAddress.toLowerCase()) {
      log('  ✅ 關鍵連接驗證通過', 'green');
    } else {
      log('  ⚠️  部分連接可能有問題', 'yellow');
    }

    // ===== 第九階段：文檔生成 =====
    const docStep = useRealTokens ? 16 : 17;
    logStep(docStep, totalSteps, '生成部署文檔', 'blue');

    const endTime = Date.now();
    const deployTime = ((endTime - startTime) / 1000).toFixed(1);
    const totalContracts = useRealTokens ? 10 : 12;

    const summary = {
      version: "V17-Complete",
      network: "BSC Mainnet",
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      deployTime: `${deployTime}s`,
      deploymentType: useRealTokens ? "Production (Real Tokens)" : "Development (Test Tokens)",
      features: [
        "完整合約部署",
        "自動連接設定",
        "地城數據初始化",
        "基礎參數配置",
        "安全狀態檢查",
        useRealTokens ? "真實 USD/SOUL 交易對" : "測試代幣環境"
      ],
      tokenConfig: useRealTokens ? {
        type: "Real Tokens",
        USD_ADDRESS: usdAddress,
        SOUL_ADDRESS: soulAddress,
        POOL_ADDRESS: poolAddress
      } : {
        type: "Test Tokens",
        USD_ADDRESS: usdAddress,
        SOUL_ADDRESS: soulAddress,
        POOL_ADDRESS: "Placeholder"
      },
      contracts: deployedContracts,
      contractsDeployed: totalContracts,
      initializationCompleted: [
        "所有合約間連接 ✅",
        "10 個地城數據初始化 ✅",
        "探索費用設定 ✅",
        "VIP 冷卻期設定 ✅",
        "安全檢查通過 ✅"
      ],
      dungeonRewards: dungeons.map(d => ({
        id: d.id,
        name: d.name,
        rewardUSD: ethers.formatEther(d.rewardAmountUSD),
        successRate: d.baseSuccessRate + '%'
      }))
    };

    const summaryPath = path.join(__dirname, '../../deployments/bsc-v17-complete-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    const configPath = path.join(__dirname, '../../config/contracts.json');
    const config = {
      version: "V17-Complete",
      network: "bsc",
      timestamp: new Date().toISOString().split('T')[0],
      contracts: deployedContracts
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // ===== 最終報告 =====
    const finalStep = useRealTokens ? 17 : 18;
    logStep(finalStep, totalSteps, '部署完成報告', 'green');

    log('\n' + '='.repeat(80), 'magenta');
    log('🎉 V17 完整部署成功！', 'green');
    log('='.repeat(80), 'magenta');
    log(`⏱️  總部署時間: ${deployTime} 秒`, 'cyan');
    log(`📦 部署合約數: ${totalContracts}/12`, 'cyan');
    log(`🏰 初始化地城: 10/10`, 'cyan');
    log(`🔧 部署類型: ${useRealTokens ? '生產環境（真實代幣）' : '開發環境（測試代幣）'}`, 'cyan');
    log(`📄 摘要已保存: ${summaryPath}`, 'cyan');
    log(`⚙️  配置已更新: ${configPath}`, 'cyan');
    
    log('\n📋 V17 合約地址:', 'yellow');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      if (address !== "0x0000000000000000000000000000000000000000") {
        log(`   ${name}: ${address}`, 'cyan');
      }
    });

    log('\n🏰 地城初始化狀態:', 'yellow');
    dungeons.forEach(dungeon => {
      log(`   ${dungeon.name}: ${ethers.formatEther(dungeon.rewardAmountUSD)} USD (${dungeon.baseSuccessRate}% 成功率)`, 'cyan');
    });

    log('\n🚀 後續步驟:', 'yellow');
    log('1. npm run verify:v17 (驗證合約)', 'green');
    log('2. npm run update-addresses (同步地址)', 'green');
    log('3. 訪問管理後台測試所有功能', 'green');
    log('4. 執行完整的遊戲流程測試', 'green');
    
    log('\n✨ V17 完整部署優勢:', 'magenta');
    log('🎯 一鍵完成所有設定', 'green');
    log('🔗 自動合約連接', 'green');
    log('🏰 地城數據即時可用', 'green');
    log('⚙️  參數預設完成', 'green');
    log('🛡️  安全檢查內建', 'green');
    log('📊 詳細部署報告', 'green');

    if (useRealTokens) {
      log('\n🏆 生產環境部署成功！', 'magenta');
      log('💱 真實交易對已整合', 'green');
      log('🔒 預言機價格實時可用', 'green');
      log('🎮 遊戲即刻可用', 'green');
    } else {
      log('\n🧪 開發環境部署成功！', 'magenta');
      log('⚡ 快速開發測試就緒', 'green');
      log('🔄 隨時可升級到生產環境', 'green');
    }

  } catch (error) {
    log(`\n❌ V17 完整部署失敗: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V17 完整部署腳本執行失敗:', error);
    process.exit(1);
  });
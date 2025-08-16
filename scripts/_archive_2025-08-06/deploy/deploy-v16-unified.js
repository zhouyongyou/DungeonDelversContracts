const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 開始 DungeonDelvers V16 統一部署', 'magenta');
  log('='.repeat(70), 'magenta');
  log('🎯 V16 特色：單階段部署 + 真實代幣整合 + 完整生態系統', 'cyan');
  log('⚡ 使用環境變數中的真實 USD/SOUL/PAIR 地址', 'cyan');
  log('='.repeat(70), 'magenta');

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInBNB = ethers.formatEther(balance);

  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`💰 BNB 餘額: ${balanceInBNB}`, 'cyan');

  if (parseFloat(balanceInBNB) < 0.2) {
    log('❌ BNB 餘額不足，建議至少 0.2 BNB', 'red');
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

  try {
    let usdAddress, soulAddress, poolAddress;

    // 1. 處理代幣地址（使用真實或部署測試）
    if (useRealTokens) {
      usdAddress = REAL_USD_ADDRESS;
      soulAddress = REAL_SOUL_ADDRESS;
      poolAddress = REAL_POOL_ADDRESS;
      
      deployedContracts.USD_ADDRESS = usdAddress;
      deployedContracts.SOULSHARD_ADDRESS = soulAddress;
      deployedContracts.POOL_ADDRESS = poolAddress;
      
      log('\n💱 使用真實代幣，跳過測試代幣部署', 'green');
    } else {
      // 部署測試代幣
      log('\n💵 1/12 部署 TestUSDToken...', 'yellow');
      const TestUSDToken = await ethers.getContractFactory("TestUSDToken");
      const testUSD = await TestUSDToken.deploy();
      await testUSD.waitForDeployment();
      usdAddress = await testUSD.getAddress();
      deployedContracts.TESTUSD_ADDRESS = usdAddress;
      log(`✅ TestUSDToken 部署成功: ${usdAddress}`, 'green');

      log('\n🔮 2/12 部署 Test_SoulShard...', 'yellow');
      const SoulShard = await ethers.getContractFactory("Test_SoulShard");
      const soulShard = await SoulShard.deploy();
      await soulShard.waitForDeployment();
      soulAddress = await soulShard.getAddress();
      deployedContracts.SOULSHARD_ADDRESS = soulAddress;
      log(`✅ Test_SoulShard 部署成功: ${soulAddress}`, 'green');

      // 測試環境使用佔位符池地址
      poolAddress = "0x0000000000000000000000000000000000000001";
      deployedContracts.POOL_ADDRESS = poolAddress;
    }

    // 2. 部署 Oracle（使用真實或測試代幣地址）
    const oracleStep = useRealTokens ? 1 : 3;
    log(`\n📊 ${oracleStep}/12 部署 Oracle...`, 'yellow');
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(poolAddress, soulAddress, usdAddress);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    deployedContracts.ORACLE_ADDRESS = oracleAddress;
    log(`✅ Oracle 部署成功: ${oracleAddress}`, 'green');
    log(`🔗 配置: Pool=${poolAddress.slice(0,10)}...`, 'green');

    // 3. 部署 Hero
    const heroStep = useRealTokens ? 2 : 4;
    log(`\n🦸 ${heroStep}/12 部署 Hero...`, 'yellow');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployerAddress);
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    deployedContracts.HERO_ADDRESS = heroAddress;
    log(`✅ Hero 部署成功: ${heroAddress}`, 'green');

    // 4. 部署 Relic
    const relicStep = useRealTokens ? 3 : 5;
    log(`\n🏺 ${relicStep}/12 部署 Relic...`, 'yellow');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployerAddress);
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    deployedContracts.RELIC_ADDRESS = relicAddress;
    log(`✅ Relic 部署成功: ${relicAddress}`, 'green');

    // 5. 部署 PartyV3
    const partyStep = useRealTokens ? 4 : 6;
    log(`\n👥 ${partyStep}/12 部署 PartyV3...`, 'yellow');
    const PartyV3 = await ethers.getContractFactory("PartyV3");
    const party = await PartyV3.deploy(deployerAddress);
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    deployedContracts.PARTY_ADDRESS = partyAddress;
    log(`✅ PartyV3 部署成功: ${partyAddress}`, 'green');

    // 6. 部署 DungeonCore（使用正確的代幣地址）
    const coreStep = useRealTokens ? 5 : 7;
    log(`\n🏰 ${coreStep}/12 部署 DungeonCore...`, 'yellow');
    const DungeonCore = await ethers.getContractFactory("contracts/core/DungeonCore.sol:DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployerAddress, usdAddress, soulAddress);
    await dungeonCore.waitForDeployment();
    const dungeonCoreAddress = await dungeonCore.getAddress();
    deployedContracts.DUNGEONCORE_ADDRESS = dungeonCoreAddress;
    log(`✅ DungeonCore 部署成功: ${dungeonCoreAddress}`, 'green');

    // 7. 設定 DungeonCore 的預言機
    log('\n⚙️  配置 DungeonCore 預言機...', 'yellow');
    const setOracleTx = await dungeonCore.setOracle(oracleAddress);
    await setOracleTx.wait();
    log(`✅ DungeonCore 預言機設定完成`, 'green');

    // 8. 部署 DungeonMasterV8
    const masterStep = useRealTokens ? 6 : 8;
    log(`\n🎮 ${masterStep}/12 部署 DungeonMasterV8...`, 'yellow');
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV8");
    const dungeonMaster = await DungeonMaster.deploy(deployerAddress);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    deployedContracts.DUNGEONMASTER_ADDRESS = dungeonMasterAddress;
    log(`✅ DungeonMasterV8 部署成功: ${dungeonMasterAddress}`, 'green');

    // 9. 部署 DungeonStorage
    const storageStep = useRealTokens ? 7 : 9;
    log(`\n📦 ${storageStep}/12 部署 DungeonStorage...`, 'yellow');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployerAddress);
    await dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await dungeonStorage.getAddress();
    deployedContracts.DUNGEONSTORAGE_ADDRESS = dungeonStorageAddress;
    log(`✅ DungeonStorage 部署成功: ${dungeonStorageAddress}`, 'green');

    // 10. 部署 PlayerVault
    const vaultStep = useRealTokens ? 8 : 10;
    log(`\n🏦 ${vaultStep}/12 部署 PlayerVault...`, 'yellow');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployerAddress);
    await playerVault.waitForDeployment();
    const playerVaultAddress = await playerVault.getAddress();
    deployedContracts.PLAYERVAULT_ADDRESS = playerVaultAddress;
    log(`✅ PlayerVault 部署成功: ${playerVaultAddress}`, 'green');

    // 11. 部署 PlayerProfile
    const profileStep = useRealTokens ? 9 : 11;
    log(`\n👤 ${profileStep}/12 部署 PlayerProfile...`, 'yellow');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployerAddress);
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    deployedContracts.PLAYERPROFILE_ADDRESS = playerProfileAddress;
    log(`✅ PlayerProfile 部署成功: ${playerProfileAddress}`, 'green');

    // 12. 部署 VIPStaking
    const vipStep = useRealTokens ? 10 : 12;
    log(`\n💎 ${vipStep}/12 部署 VIPStaking...`, 'yellow');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployerAddress);
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    deployedContracts.VIPSTAKING_ADDRESS = vipStakingAddress;
    log(`✅ VIPStaking 部署成功: ${vipStakingAddress}`, 'green');

    // 設定特殊地址
    deployedContracts.ALTAROFASCENSION_ADDRESS = "0x0000000000000000000000000000000000000000";
    deployedContracts.DUNGEONMASTERWALLET_ADDRESS = deployerAddress;

    const endTime = Date.now();
    const deployTime = ((endTime - startTime) / 1000).toFixed(1);
    const totalContracts = useRealTokens ? 10 : 12;

    // 保存部署摘要
    const summary = {
      version: "V16-Unified",
      network: "BSC Mainnet",
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      deployTime: `${deployTime}s`,
      deploymentType: useRealTokens ? "Production (Real Tokens)" : "Development (Test Tokens)",
      features: [
        "單階段統一部署",
        "viaIR 啟用 + 依賴統一",
        useRealTokens ? "真實 USD/SOUL 交易對" : "測試代幣",
        "預言機自動配置",
        "完整生態系統",
        "環境變數自動檢測"
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
      configurationCompleted: [
        "DungeonCore.setOracle() ✅",
        "Oracle 配置完成 ✅",
        "所有合約部署完成 ✅"
      ]
    };

    const summaryPath = path.join(__dirname, '../../deployments/bsc-v16-unified-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // 更新配置文件
    const configPath = path.join(__dirname, '../../config/contracts.json');
    const config = {
      version: "V16-Unified",
      network: "bsc",
      timestamp: new Date().toISOString().split('T')[0],
      contracts: deployedContracts
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 V16 統一部署完成！', 'green');
    log('='.repeat(70), 'magenta');
    log(`⏱️  總部署時間: ${deployTime} 秒`, 'cyan');
    log(`📦 部署合約數: ${totalContracts}/12`, 'cyan');
    log(`🔧 部署類型: ${useRealTokens ? '生產環境（真實代幣）' : '開發環境（測試代幣）'}`, 'cyan');
    log(`📄 摘要已保存: ${summaryPath}`, 'cyan');
    log(`⚙️  配置已更新: ${configPath}`, 'cyan');
    
    log('\n📋 V16 合約地址:', 'yellow');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      if (address !== "0x0000000000000000000000000000000000000000") {
        log(`   ${name}: ${address}`, 'cyan');
      }
    });

    log('\n🚀 下一步:', 'yellow');
    log('1. npm run verify:v16 (一次性驗證所有合約)', 'green');
    log('2. npm run update-addresses (同步到前端/後端)', 'green');
    log('3. 測試完整功能', 'green');
    
    log('\n✨ V16 統一部署優勢:', 'magenta');
    log('🚀 單階段完成所有部署', 'green');
    log('🎯 環境變數自動檢測', 'green');
    log('⚡ 預言機即時配置', 'green');
    log('💎 真實代幣無縫整合', 'green');
    log('📈 部署效率最大化', 'green');

    if (useRealTokens) {
      log('\n🏆 生產環境部署成功！', 'magenta');
      log('💱 真實交易對已整合', 'green');
      log('🔒 預言機價格實時可用', 'green');
    }

  } catch (error) {
    log(`\n❌ V16 統一部署失敗: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V16 統一部署腳本執行失敗:', error);
    process.exit(1);
  });
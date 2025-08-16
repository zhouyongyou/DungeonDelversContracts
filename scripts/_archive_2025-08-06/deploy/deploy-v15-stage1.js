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
  log('\n🚀 開始 DungeonDelvers V15 階段一部署', 'magenta');
  log('='.repeat(70), 'magenta');
  log('🎯 V15 特色：viaIR 重新啟用 + 分階段部署 + 依賴統一', 'cyan');
  log('📋 階段一：核心合約（無預言機依賴）', 'cyan');
  log('='.repeat(70), 'magenta');

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInBNB = ethers.formatEther(balance);

  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`💰 BNB 餘額: ${balanceInBNB}`, 'cyan');

  if (parseFloat(balanceInBNB) < 0.15) {
    log('❌ BNB 餘額不足，建議至少 0.15 BNB', 'red');
    process.exit(1);
  }

  const deployedContracts = {};
  const startTime = Date.now();

  try {
    // 1. 部署 TestUSDToken
    log('\n💵 1/11 部署 TestUSDToken...', 'yellow');
    const TestUSDToken = await ethers.getContractFactory("TestUSDToken");
    const testUSD = await TestUSDToken.deploy();
    await testUSD.waitForDeployment();
    const testUSDAddress = await testUSD.getAddress();
    deployedContracts.TESTUSD_ADDRESS = testUSDAddress;
    log(`✅ TestUSDToken 部署成功: ${testUSDAddress}`, 'green');

    // 2. 部署 Test_SoulShard
    log('\n🔮 2/11 部署 Test_SoulShard...', 'yellow');
    const SoulShard = await ethers.getContractFactory("Test_SoulShard");
    const soulShard = await SoulShard.deploy();
    await soulShard.waitForDeployment();
    const soulShardAddress = await soulShard.getAddress();
    deployedContracts.SOULSHARD_ADDRESS = soulShardAddress;
    log(`✅ Test_SoulShard 部署成功: ${soulShardAddress}`, 'green');

    // 3. 部署 Hero
    log('\n🦸 3/11 部署 Hero...', 'yellow');
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployerAddress);
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    deployedContracts.HERO_ADDRESS = heroAddress;
    log(`✅ Hero 部署成功: ${heroAddress}`, 'green');

    // 4. 部署 Relic
    log('\n🏺 4/11 部署 Relic...', 'yellow');
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployerAddress);
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    deployedContracts.RELIC_ADDRESS = relicAddress;
    log(`✅ Relic 部署成功: ${relicAddress}`, 'green');

    // 5. 部署 PartyV3
    log('\n👥 5/11 部署 PartyV3...', 'yellow');
    const PartyV3 = await ethers.getContractFactory("PartyV3");
    const party = await PartyV3.deploy(deployerAddress);
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    deployedContracts.PARTY_ADDRESS = partyAddress;
    log(`✅ PartyV3 部署成功: ${partyAddress}`, 'green');

    // 6. 部署 DungeonCore (暫時不設預言機)
    log('\n🏰 6/11 部署 DungeonCore...', 'yellow');
    const DungeonCore = await ethers.getContractFactory("contracts/core/DungeonCore.sol:DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployerAddress, testUSDAddress, soulShardAddress);
    await dungeonCore.waitForDeployment();
    const dungeonCoreAddress = await dungeonCore.getAddress();
    deployedContracts.DUNGEONCORE_ADDRESS = dungeonCoreAddress;
    log(`✅ DungeonCore 部署成功: ${dungeonCoreAddress}`, 'green');

    // 7. 部署 DungeonMasterV8
    log('\n🎮 7/11 部署 DungeonMasterV8...', 'yellow');
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV8");
    const dungeonMaster = await DungeonMaster.deploy(deployerAddress);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    deployedContracts.DUNGEONMASTER_ADDRESS = dungeonMasterAddress;
    log(`✅ DungeonMasterV8 部署成功: ${dungeonMasterAddress}`, 'green');

    // 8. 部署 DungeonStorage (只需 1 個參數)
    log('\n📦 8/11 部署 DungeonStorage...', 'yellow');
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployerAddress);
    await dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await dungeonStorage.getAddress();
    deployedContracts.DUNGEONSTORAGE_ADDRESS = dungeonStorageAddress;
    log(`✅ DungeonStorage 部署成功: ${dungeonStorageAddress}`, 'green');

    // 9. 部署 PlayerVault
    log('\n🏦 9/11 部署 PlayerVault...', 'yellow');
    const PlayerVault = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployerAddress);
    await playerVault.waitForDeployment();
    const playerVaultAddress = await playerVault.getAddress();
    deployedContracts.PLAYERVAULT_ADDRESS = playerVaultAddress;
    log(`✅ PlayerVault 部署成功: ${playerVaultAddress}`, 'green');

    // 10. 部署 PlayerProfile (只需 1 個參數)
    log('\n👤 10/11 部署 PlayerProfile...', 'yellow');
    const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployerAddress);
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    deployedContracts.PLAYERPROFILE_ADDRESS = playerProfileAddress;
    log(`✅ PlayerProfile 部署成功: ${playerProfileAddress}`, 'green');

    // 11. 部署 VIPStaking (只需 1 個參數)
    log('\n💎 11/11 部署 VIPStaking...', 'yellow');
    const VIPStaking = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployerAddress);
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    deployedContracts.VIPSTAKING_ADDRESS = vipStakingAddress;
    log(`✅ VIPStaking 部署成功: ${vipStakingAddress}`, 'green');

    // 設定特殊地址
    deployedContracts.ALTAROFASCENSION_ADDRESS = "0x0000000000000000000000000000000000000000";
    deployedContracts.DUNGEONMASTERWALLET_ADDRESS = deployerAddress;
    // 預言機地址暫時為空，等階段二設定
    deployedContracts.ORACLE_ADDRESS = "0x0000000000000000000000000000000000000000";

    const endTime = Date.now();
    const deployTime = ((endTime - startTime) / 1000).toFixed(1);

    // 保存階段一部署摘要
    const summary = {
      version: "V15-Stage1",
      network: "BSC Mainnet",
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      deployTime: `${deployTime}s`,
      stage: "Stage 1 - Core Contracts (No Oracle)",
      features: [
        "重新啟用 viaIR 優化",
        "OpenZeppelin 5.3.0 統一",
        "分階段部署策略",
        "避免循環依賴",
        "完整的核心合約套件"
      ],
      contracts: deployedContracts,
      nextSteps: [
        "創建 USD/SOUL 交易對",
        "執行 V15 階段二：部署預言機",
        "配置所有合約間的連接",
        "執行完整驗證測試"
      ]
    };

    const summaryPath = path.join(__dirname, '../../deployments/bsc-v15-stage1-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // 更新配置文件
    const configPath = path.join(__dirname, '../../config/contracts.json');
    const config = {
      version: "V15-Stage1",
      network: "bsc",
      timestamp: new Date().toISOString().split('T')[0],
      contracts: deployedContracts
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 V15 階段一部署完成！', 'green');
    log('='.repeat(70), 'magenta');
    log(`⏱️  總部署時間: ${deployTime} 秒`, 'cyan');
    log(`📄 摘要已保存: ${summaryPath}`, 'cyan');
    log(`⚙️  配置已更新: ${configPath}`, 'cyan');
    
    log('\n📋 V15 階段一合約地址:', 'yellow');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      if (address !== "0x0000000000000000000000000000000000000000") {
        log(`   ${name}: ${address}`, 'cyan');
      }
    });

    log('\n🚀 下一步:', 'yellow');
    log('1. npm run verify:v15-stage1 (驗證階段一合約)', 'green');
    log('2. 創建 USD/SOUL 交易對', 'green');
    log('3. npm run deploy:v15-stage2 (部署預言機)', 'green');
    log('4. 配置合約間連接', 'green');

    log('\n✨ V15 階段一革新特色:', 'magenta');
    log('🔄 viaIR 重新啟用測試', 'green');
    log('🎯 分階段部署策略', 'green');
    log('🚫 避免循環依賴', 'green');
    log('📦 完整核心合約套件', 'green');

  } catch (error) {
    log(`\n❌ V15 階段一部署失敗: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 階段一部署腳本執行失敗:', error);
    process.exit(1);
  });
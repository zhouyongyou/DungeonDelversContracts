// scripts/deploy/deploy-v19-oracle-fix.js
// DungeonDelvers V19 完整部署腳本 - 修復 Oracle 和價格問題
// 基於 V18 改進，修復所有已知問題

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function deployContract(contractName, ...args) {
  log(`\n🔨 部署 ${contractName}...`, 'cyan');
  const Factory = await ethers.getContractFactory(contractName);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  log(`✅ ${contractName} 部署成功: ${address}`, 'green');
  return contract;
}

async function main() {
  log('\n🚀 開始 DungeonDelvers V19 完整部署（Oracle 修復版）', 'magenta');
  log('='.repeat(80), 'magenta');
  log('🎯 V19 特色：修復 Oracle 配置 + 正確的價格設置 + 環境變數支持', 'cyan');
  log('⚡ 修復問題：Oracle USD 地址配對 + mintPriceUSD 正確設置', 'cyan');
  log('='.repeat(80), 'magenta');

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInBNB = ethers.formatEther(balance);

  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`💰 BNB 餘額: ${balanceInBNB}`, 'cyan');

  if (parseFloat(balanceInBNB) < 0.2) {
    log('\n❌ BNB 餘額不足，建議至少 0.2 BNB 進行部署', 'red');
    process.exit(1);
  }

  const deployedAddresses = {};
  const totalSteps = 14; // 總步驟數
  let currentStep = 0;

  try {
    // Step 1: 部署核心代幣合約
    logStep(++currentStep, totalSteps, '部署 TestUSD 代幣', 'yellow');
    const testUSD = await deployContract("TestUSD");
    deployedAddresses.TESTUSD = await testUSD.getAddress();

    logStep(++currentStep, totalSteps, '部署 SoulShard 代幣', 'yellow');
    const soulShard = await deployContract("SoulShard", deployerAddress);
    deployedAddresses.SOULSHARD = await soulShard.getAddress();

    // Step 2: 部署 Oracle - V19 關鍵修復
    logStep(++currentStep, totalSteps, '部署 Oracle 價格預言機 (V19 修復版)', 'yellow');
    
    // 從環境變數讀取或使用預設值
    const USD_ADDRESS = process.env.MAINNET_USD_ADDRESS || deployedAddresses.TESTUSD;
    const SOUL_ADDRESS = process.env.MAINNET_SOULSHARD_ADDRESS || deployedAddresses.SOULSHARD;
    const POOL_ADDRESS = process.env.POOL_ADDRESS || ethers.ZeroAddress;
    
    log(`  📌 USD Token: ${USD_ADDRESS}`, 'cyan');
    log(`  📌 SOUL Token: ${SOUL_ADDRESS}`, 'cyan');
    log(`  📌 Pool Address: ${POOL_ADDRESS}`, 'cyan');
    
    // 部署正確配置的 Oracle
    const oracle = await deployContract(
      "contracts/defi/Oracle_VerificationFix.sol:Oracle",
      POOL_ADDRESS,
      SOUL_ADDRESS,
      USD_ADDRESS
    );
    deployedAddresses.ORACLE = await oracle.getAddress();
    
    // 如果沒有 Pool，部署 MockOracle
    if (POOL_ADDRESS === ethers.ZeroAddress) {
      log('\n⚠️  未配置 Uniswap V3 Pool，部署 MockOracle 作為備用', 'yellow');
      
      // 創建 MockOracle 合約
      const MockOracleFactory = await ethers.getContractFactory("MockOracle");
      const mockOracle = await MockOracleFactory.deploy(USD_ADDRESS, SOUL_ADDRESS);
      await mockOracle.waitForDeployment();
      deployedAddresses.MOCKORACLE = await mockOracle.getAddress();
      log(`✅ MockOracle 部署成功: ${deployedAddresses.MOCKORACLE}`, 'green');
      
      // 使用 MockOracle 作為 Oracle
      deployedAddresses.ORACLE = deployedAddresses.MOCKORACLE;
      log('  📌 使用 MockOracle 作為價格源 (1 USD = 16,500 SOUL)', 'cyan');
    }

    // Step 3: 部署 DungeonCore
    logStep(++currentStep, totalSteps, '部署 DungeonCore 總機合約', 'yellow');
    const dungeonCore = await deployContract("DungeonCore", deployerAddress);
    deployedAddresses.DUNGEONCORE = await dungeonCore.getAddress();

    // Step 4: 部署遊戲機制合約
    logStep(++currentStep, totalSteps, '部署 PlayerVault 玩家金庫', 'yellow');
    const playerVault = await deployContract("PlayerVault", deployerAddress);
    deployedAddresses.PLAYERVAULT = await playerVault.getAddress();

    logStep(++currentStep, totalSteps, '部署 PlayerProfile 玩家檔案', 'yellow');
    const playerProfile = await deployContract("PlayerProfile", deployerAddress);
    deployedAddresses.PLAYERPROFILE = await playerProfile.getAddress();

    logStep(++currentStep, totalSteps, '部署 VIPStaking 質押系統', 'yellow');
    const vipStaking = await deployContract("VIPStaking", deployerAddress);
    deployedAddresses.VIPSTAKING = await vipStaking.getAddress();

    logStep(++currentStep, totalSteps, '部署 DungeonStorage 地城存儲', 'yellow');
    const dungeonStorage = await deployContract("DungeonStorage", deployerAddress);
    deployedAddresses.DUNGEONSTORAGE = await dungeonStorage.getAddress();

    logStep(++currentStep, totalSteps, '部署 DungeonMaster 地城主控', 'yellow');
    const dungeonMaster = await deployContract("DungeonMaster", deployerAddress);
    deployedAddresses.DUNGEONMASTER = await dungeonMaster.getAddress();

    // Step 5: 部署 NFT 合約
    logStep(++currentStep, totalSteps, '部署 Hero NFT 合約', 'yellow');
    const hero = await deployContract("Hero", deployerAddress);
    deployedAddresses.HERO = await hero.getAddress();

    logStep(++currentStep, totalSteps, '部署 Relic NFT 合約', 'yellow');
    const relic = await deployContract("Relic", deployerAddress);
    deployedAddresses.RELIC = await relic.getAddress();

    logStep(++currentStep, totalSteps, '部署 Party NFT 合約', 'yellow');
    const party = await deployContract("Party", deployerAddress);
    deployedAddresses.PARTY = await party.getAddress();

    // Step 6: 部署祭壇合約
    logStep(++currentStep, totalSteps, '部署 AltarOfAscension 升星祭壇', 'yellow');
    const altarOfAscension = await deployContract("AltarOfAscension", deployerAddress);
    deployedAddresses.ALTAROFASCENSION = await altarOfAscension.getAddress();

    // Step 7: 設置合約連接
    logStep(++currentStep, totalSteps, '設置合約間連接', 'yellow');
    log('\n🔗 開始設置合約連接...', 'cyan');

    // 在 DungeonCore 中設置各模組地址
    const dungeonCoreSettings = [
      { name: 'Oracle', func: 'setOracle', address: deployedAddresses.ORACLE },
      { name: 'PlayerVault', func: 'setPlayerVault', address: deployedAddresses.PLAYERVAULT },
      { name: 'DungeonMaster', func: 'setDungeonMaster', address: deployedAddresses.DUNGEONMASTER },
      { name: 'PlayerProfile', func: 'setPlayerProfile', address: deployedAddresses.PLAYERPROFILE },
      { name: 'VIPStaking', func: 'setVipStaking', address: deployedAddresses.VIPSTAKING },
      { name: 'Hero', func: 'setHeroContract', address: deployedAddresses.HERO },
      { name: 'Relic', func: 'setRelicContract', address: deployedAddresses.RELIC },
      { name: 'Party', func: 'setPartyContract', address: deployedAddresses.PARTY },
      { name: 'AltarOfAscension', func: 'setAltarOfAscension', address: deployedAddresses.ALTAROFASCENSION }
    ];

    for (const setting of dungeonCoreSettings) {
      log(`  - 在 DungeonCore 設置 ${setting.name}...`, 'yellow');
      await dungeonCore[setting.func](setting.address);
      log(`    ✅ ${setting.name} 設置成功`, 'green');
    }

    // 各模組回連 DungeonCore
    const backConnections = [
      { contract: hero, name: 'Hero' },
      { contract: relic, name: 'Relic' },
      { contract: party, name: 'Party' },
      { contract: dungeonMaster, name: 'DungeonMaster' },
      { contract: playerProfile, name: 'PlayerProfile' },
      { contract: vipStaking, name: 'VIPStaking' },
      { contract: altarOfAscension, name: 'AltarOfAscension' }
    ];

    for (const { contract, name } of backConnections) {
      log(`  - 在 ${name} 設置 DungeonCore...`, 'yellow');
      await contract.setDungeonCore(deployedAddresses.DUNGEONCORE);
      log(`    ✅ ${name} 回連成功`, 'green');
    }

    // 特殊連接設置
    log(`  - 在 DungeonMaster 設置 DungeonStorage...`, 'yellow');
    await dungeonMaster.setDungeonStorage(deployedAddresses.DUNGEONSTORAGE);
    log(`    ✅ DungeonStorage 設置成功`, 'green');

    log(`  - 在 DungeonStorage 授權 DungeonMaster...`, 'yellow');
    await dungeonStorage.setLogicContract(deployedAddresses.DUNGEONMASTER);
    log(`    ✅ DungeonMaster 授權成功`, 'green');

    log(`  - 在 DungeonMaster 設置 SoulShard Token...`, 'yellow');
    await dungeonMaster.setSoulShardToken(deployedAddresses.SOULSHARD);
    log(`    ✅ SoulShard Token 設置成功`, 'green');

    // Step 8: 設置遊戲參數 - V19 關鍵修復
    logStep(++currentStep, totalSteps, '設置遊戲參數 (V19 價格修復)', 'yellow');
    
    // ⚠️ V19 修復：setMintPriceUSD 會自動乘以 1e18，所以只傳入純數字
    const mintPrices = [
      { contract: hero, name: 'Hero', price: '2' },   // 2 USD (不是 2e18)
      { contract: relic, name: 'Relic', price: '2' }, // 2 USD (不是 2e18)
      { contract: party, name: 'Party', price: '0' }  // 0 USD (免費)
    ];

    for (const { contract, name, price } of mintPrices) {
      log(`  - 設置 ${name} 鑄造價格: ${price} USD...`, 'yellow');
      await contract.setMintPriceUSD(price);
      log(`    ✅ 已設置為 ${price} USD`, 'green');
    }

    // 設置平台費用
    const platformFees = [
      { contract: hero, name: 'Hero', fee: ethers.parseEther('0.002') },
      { contract: relic, name: 'Relic', fee: ethers.parseEther('0.002') }
    ];

    for (const { contract, name, fee } of platformFees) {
      log(`  - 設置 ${name} 平台費用: ${ethers.formatEther(fee)} BNB...`, 'yellow');
      await contract.setPlatformFee(fee);
      log(`    ✅ 平台費用設置成功`, 'green');
    }

    // 設置 VIP 參數
    log('  - 設置 VIP 質押參數...', 'yellow');
    await vipStaking.setVipRequirement(1, ethers.parseEther('10'));   // VIP 1: 10 SOUL
    await vipStaking.setVipRequirement(2, ethers.parseEther('100'));  // VIP 2: 100 SOUL
    await vipStaking.setVipRequirement(3, ethers.parseEther('1000')); // VIP 3: 1000 SOUL
    await vipStaking.setUnstakeCooldown(15);  // 15 秒冷卻期（測試用）
    log('    ✅ VIP 質押參數設置成功', 'green');

    // 設置 PartyConfig 參數
    log('  - 設置隊伍組建參數...', 'yellow');
    await dungeonCore.setPartyConfig({
      power: 50,              // 初始戰力
      capacity: 5,            // 初始容量
      mintPrice: ethers.parseEther('0'), // 免費鑄造
      upgradePriceForPower: ethers.parseEther('10'),
      upgradePriceForCapacity: ethers.parseEther('10'),
      heroIncreaseForPower: 10,
      heroIncreaseForCapacity: 1
    });
    log('    ✅ 隊伍參數設置成功', 'green');

    // Step 9: 初始化地城 - 2025-01 經濟模型
    logStep(++currentStep, totalSteps, '初始化地城（2025-01 經濟模型）', 'yellow');
    
    const dungeonConfigs = [
      { id: 1, name: '幽暗森林', requiredPower: 100, soulShardReward: ethers.parseEther('25'), cooldownTime: 86400 },
      { id: 2, name: '廢棄礦坑', requiredPower: 250, soulShardReward: ethers.parseEther('75'), cooldownTime: 86400 },
      { id: 3, name: '遠古遺跡', requiredPower: 500, soulShardReward: ethers.parseEther('175'), cooldownTime: 86400 },
      { id: 4, name: '龍之巢穴', requiredPower: 1000, soulShardReward: ethers.parseEther('400'), cooldownTime: 86400 },
      { id: 5, name: '惡魔城堡', requiredPower: 2000, soulShardReward: ethers.parseEther('900'), cooldownTime: 86400 },
      { id: 6, name: '天空之城', requiredPower: 3000, soulShardReward: ethers.parseEther('1500'), cooldownTime: 86400 },
      { id: 7, name: '時空裂縫', requiredPower: 5000, soulShardReward: ethers.parseEther('2750'), cooldownTime: 86400 },
      { id: 8, name: '混沌深淵', requiredPower: 8000, soulShardReward: ethers.parseEther('4800'), cooldownTime: 86400 }
    ];

    for (const config of dungeonConfigs) {
      log(`  - 初始化地城 ${config.id}: ${config.name}...`, 'yellow');
      await dungeonMaster.initializeDungeon(
        config.id,
        config.requiredPower,
        config.soulShardReward,
        config.cooldownTime
      );
      log(`    ✅ ${config.name} 初始化成功`, 'green');
    }

    // Step 10: 保存部署結果
    logStep(++currentStep, totalSteps, '保存部署結果', 'yellow');
    
    const deploymentRecord = {
      version: 'V19',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: deployerAddress,
      addresses: deployedAddresses,
      configuration: {
        oracle: {
          type: deployedAddresses.MOCKORACLE ? 'MockOracle' : 'Uniswap V3 Oracle',
          pool: POOL_ADDRESS,
          priceRatio: '1 USD = 16,500 SOUL'
        },
        mintPrices: {
          hero: '2 USD',
          relic: '2 USD',
          party: '0 USD (免費)'
        },
        platformFees: {
          hero: '0.002 BNB',
          relic: '0.002 BNB'
        },
        vipRequirements: {
          vip1: '10 SOUL',
          vip2: '100 SOUL',
          vip3: '1000 SOUL'
        }
      }
    };

    const recordPath = path.join(__dirname, '../../deployments', `deployment-v19-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    log(`\n📝 部署記錄已保存至: ${recordPath}`, 'green');

    // 生成環境變數檔案
    const envContent = Object.entries(deployedAddresses)
      .map(([key, value]) => `MAINNET_${key}_ADDRESS=${value}`)
      .join('\n');
    
    const envPath = path.join(__dirname, '../../.env.v19');
    fs.writeFileSync(envPath, envContent);
    log(`📝 環境變數已保存至: ${envPath}`, 'green');

    // 輸出部署總結
    log('\n' + '='.repeat(80), 'magenta');
    log('🎉 DungeonDelvers V19 部署成功！', 'magenta');
    log('='.repeat(80), 'magenta');
    
    log('\n📋 部署地址總結:', 'cyan');
    Object.entries(deployedAddresses).forEach(([name, address]) => {
      log(`  ${name}: ${address}`, 'yellow');
    });

    log('\n⚠️  V19 修復說明:', 'yellow');
    log('  1. Oracle 正確配置了 USD/SOUL 地址配對', 'green');
    log('  2. mintPriceUSD 使用正確的數值（2 而非 2e18）', 'green');
    log('  3. 支持環境變數配置真實 Uniswap V3 Pool', 'green');
    log('  4. 自動回退到 MockOracle（1 USD = 16,500 SOUL）', 'green');

    log('\n📌 下一步操作建議:', 'cyan');
    log('  1. 將 .env.v19 的內容更新到主 .env 文件', 'yellow');
    log('  2. 運行驗證腳本確認所有合約正常工作', 'yellow');
    log('  3. 更新前端配置文件中的合約地址', 'yellow');
    log('  4. 如有真實 Pool，更新 Oracle 配置', 'yellow');

  } catch (error) {
    log(`\n❌ 部署失敗: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 執行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
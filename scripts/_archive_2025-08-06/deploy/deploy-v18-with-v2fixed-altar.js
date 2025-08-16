// scripts/deploy/deploy-v18-with-v2fixed-altar.js
// DungeonDelvers V18 完整部署腳本 - 使用 V2Fixed 祭壇
// 包含所有新功能：冷卻時間、VIP 加成、升級統計等

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

async function deployContract(contractName, ...args) {
  log(`\n🔨 部署 ${contractName}...`, 'cyan');
  
  // 處理需要完整路徑的合約
  let fullContractName = contractName;
  if (contractName === "DungeonCore") {
    fullContractName = "contracts/core/DungeonCore_VerificationFix.sol:DungeonCore";
  } else if (contractName === "DungeonMaster") {
    fullContractName = "contracts/core/DungeonMaster_V8.sol:DungeonMasterV8";
  } else if (contractName === "Oracle") {
    fullContractName = "contracts/defi/Oracle_VerificationFix.sol:Oracle";
  } else if (contractName === "Party") {
    fullContractName = "contracts/nft/Party_V3.sol:PartyV3";
  }
  
  const Factory = await ethers.getContractFactory(fullContractName);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  log(`✅ ${contractName} 部署成功: ${address}`, 'green');
  return contract;
}

async function main() {
  log('\n🚀 開始 DungeonDelvers V18 完整部署（V2Fixed 祭壇）', 'magenta');
  log('='.repeat(80), 'magenta');
  log('🎯 V18 特色：V2Fixed 祭壇 + 冷卻時間 + VIP 系統 + 統計追蹤', 'cyan');
  log('⚡ 使用增強版祭壇，提供更好的遊戲體驗和運營工具', 'cyan');
  log('='.repeat(80), 'magenta');

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInBNB = ethers.formatEther(balance);

  log(`\n👤 部署者地址: ${deployerAddress}`, 'cyan');
  log(`💰 BNB 餘額: ${balanceInBNB}`, 'cyan');

  if (parseFloat(balanceInBNB) < 0.5) {
    log('❌ BNB 餘額不足，建議至少 0.5 BNB', 'red');
    process.exit(1);
  }

  // 部署地址記錄
  const deployedAddresses = {};
  const totalSteps = 21; // 增加步驟以包含 VIP 設置
  let currentStep = 0;

  try {
    // Step 1: 使用現有的代幣地址（從環境變數）
    logStep(++currentStep, totalSteps, '使用現有的 TestUSD 代幣', 'yellow');
    deployedAddresses.TESTUSD = process.env.TESTUSD_ADDRESS || '0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074';
    log(`✅ TestUSD 地址: ${deployedAddresses.TESTUSD}`, 'green');

    logStep(++currentStep, totalSteps, '使用現有的 SoulShard 代幣', 'yellow');
    deployedAddresses.SOULSHARD = process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
    log(`✅ SoulShard 地址: ${deployedAddresses.SOULSHARD}`, 'green');

    // Step 2: 部署 Oracle
    logStep(++currentStep, totalSteps, '部署 Oracle 價格預言機', 'yellow');
    const POOL_ADDRESS = process.env.POOL_ADDRESS || '0x0000000000000000000000000000000000000000'; // 稍後設置
    const oracle = await deployContract("Oracle", 
      POOL_ADDRESS,
      deployedAddresses.SOULSHARD,
      deployedAddresses.TESTUSD
    );
    deployedAddresses.ORACLE = await oracle.getAddress();

    // Step 3: 部署 DungeonCore
    logStep(++currentStep, totalSteps, '部署 DungeonCore 總機合約', 'yellow');
    const dungeonCore = await deployContract("DungeonCore", 
      deployerAddress,
      deployedAddresses.TESTUSD,
      deployedAddresses.SOULSHARD
    );
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

    // Step 6: ⭐ 部署 V2Fixed 祭壇合約
    logStep(++currentStep, totalSteps, '部署 AltarOfAscensionV2Fixed 增強版祭壇', 'yellow');
    const altarOfAscension = await deployContract("AltarOfAscensionV2Fixed", deployerAddress);
    deployedAddresses.ALTAROFASCENSION = await altarOfAscension.getAddress();
    log('⭐ V2Fixed 祭壇部署成功！包含冷卻時間、VIP 加成、統計追蹤等新功能', 'green');

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
      { contract: vipStaking, name: 'VIPStaking' }
    ];

    for (const { contract, name } of backConnections) {
      log(`  - 在 ${name} 設置 DungeonCore...`, 'yellow');
      await contract.setDungeonCore(deployedAddresses.DUNGEONCORE);
      log(`    ✅ ${name} 回連成功`, 'green');
    }

    // ⭐ V2Fixed 祭壇特殊設置
    log(`  - 在祭壇設置合約地址（DungeonCore、Hero、Relic）...`, 'yellow');
    await altarOfAscension.setContracts(
      deployedAddresses.DUNGEONCORE,
      deployedAddresses.HERO,
      deployedAddresses.RELIC
    );
    log(`    ✅ 祭壇合約地址設置成功`, 'green');

    // 在 Hero/Relic 設置祭壇地址
    log(`  - 在 Hero 設置祭壇地址...`, 'yellow');
    await hero.setAscensionAltarAddress(deployedAddresses.ALTAROFASCENSION);
    log(`    ✅ Hero 祭壇地址設置成功`, 'green');

    log(`  - 在 Relic 設置祭壇地址...`, 'yellow');
    await relic.setAscensionAltarAddress(deployedAddresses.ALTAROFASCENSION);
    log(`    ✅ Relic 祭壇地址設置成功`, 'green');

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

    // Step 8: 初始化 Oracle（Pool 已在構造函數中設置）
    logStep(++currentStep, totalSteps, '檢查 Oracle 設置', 'yellow');
    const ACTUAL_POOL_ADDRESS = process.env.POOL_ADDRESS;
    if (ACTUAL_POOL_ADDRESS && ACTUAL_POOL_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      log('  ✅ Oracle Pool 地址已在部署時設置', 'green');
    } else {
      log('  ⚠️  Oracle 使用零地址作為 Pool（需要後續更新）', 'yellow');
    }

    // Step 9: 設置遊戲參數
    logStep(++currentStep, totalSteps, '設置遊戲參數', 'yellow');
    
    // 設置鑄造價格
    // 注意：setMintPriceUSD 會自動乘以 1e18，所以只需要傳入純數字
    const mintPrices = [
      { contract: hero, name: 'Hero', price: '2' },   // 2 USD
      { contract: relic, name: 'Relic', price: '2' }  // 2 USD
    ];

    for (const { contract, name, price } of mintPrices) {
      log(`  - 設置 ${name} 鑄造價格: ${price} USD...`, 'yellow');
      // 只傳入數字，合約內部會自動 * 1e18
      await contract.setMintPriceUSD(price);
      log(`    ✅ ${name} 價格設置成功`, 'green');
    }

    // 設置平台費用（如果支援）
    // DungeonMasterV8 可能沒有這個函數
    // log(`  - 設置平台探索費用: 0.001 BNB...`, 'yellow');
    // await dungeonMaster.setPlatformFeeAmount(ethers.parseEther('0.001'));
    // log(`    ✅ 平台費用設置成功`, 'green');

    // 設置稅務參數（如果支援）
    // PlayerVault 可能沒有這些函數
    // const taxSettings = [
    //   { func: 'setLargeWithdrawalThreshold', value: '1000', name: '大額提款門檻' },
    //   { func: 'setSmallWithdrawalThreshold', value: '10', name: '小額提款門檻' },
    //   { func: 'setStandardTaxBasisPoints', value: '800', name: '標準稅率 (8%)' },
    //   { func: 'setLargeTaxBasisPoints', value: '1500', name: '大額稅率 (15%)' },
    //   { func: 'setTimeDecayBasisPoints', value: '50', name: '時間衰減率' },
    //   { func: 'setDecayPeriod', value: '86400', name: '衰減週期 (1天)' }
    // ];

    // Step 10: 初始化地城
    logStep(++currentStep, totalSteps, '初始化地城配置', 'yellow');
    // 使用 2025-01 經濟模型版本
    const dungeons = [
      { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: ethers.parseEther("29.30"), baseSuccessRate: 89 },
      { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: ethers.parseEther("62.00"), baseSuccessRate: 83 },
      { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: ethers.parseEther("96.00"), baseSuccessRate: 77 },
      { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: ethers.parseEther("151.00"), baseSuccessRate: 69 },
      { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: ethers.parseEther("205.00"), baseSuccessRate: 63 },
      { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: ethers.parseEther("271.00"), baseSuccessRate: 57 },
      { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: ethers.parseEther("418.00"), baseSuccessRate: 52 },
      { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: ethers.parseEther("539.00"), baseSuccessRate: 52 },
      { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: ethers.parseEther("685.00"), baseSuccessRate: 50 },
      { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: ethers.parseEther("850.00"), baseSuccessRate: 50 }
    ];

    for (const dungeon of dungeons) {
      log(`  - 初始化地城 #${dungeon.id} ${dungeon.name}...`, 'yellow');
      await dungeonMaster.adminSetDungeon(
        dungeon.id,
        dungeon.requiredPower,
        dungeon.rewardAmountUSD,
        dungeon.baseSuccessRate
      );
      log(`    ✅ ${dungeon.name} 初始化成功`, 'green');
    }

    // Step 11: ⭐ 設置 V2Fixed 祭壇升級規則（包含冷卻時間）
    logStep(++currentStep, totalSteps, '設置 V2Fixed 祭壇升級規則', 'yellow');
    const altarRules = [
      { 
        rarity: 1, 
        materials: 5, 
        fee: '0.005', 
        greatSuccess: 5, 
        success: 65, 
        partialFail: 28,
        cooldown: 3600, // 1 小時
        isActive: true
      },
      { 
        rarity: 2, 
        materials: 4, 
        fee: '0.01', 
        greatSuccess: 4, 
        success: 51, 
        partialFail: 35,
        cooldown: 7200, // 2 小時
        isActive: true
      },
      { 
        rarity: 3, 
        materials: 3, 
        fee: '0.02', 
        greatSuccess: 3, 
        success: 32, 
        partialFail: 45,
        cooldown: 14400, // 4 小時
        isActive: true
      },
      { 
        rarity: 4, 
        materials: 2, 
        fee: '0.05', 
        greatSuccess: 2, 
        success: 18, 
        partialFail: 50,
        cooldown: 28800, // 8 小時
        isActive: true
      }
    ];

    for (const rule of altarRules) {
      log(`  - 設置 ${rule.rarity}★ → ${rule.rarity + 1}★ 升級規則...`, 'yellow');
      await altarOfAscension.setUpgradeRule(rule.rarity, {
        materialsRequired: rule.materials,
        nativeFee: ethers.parseEther(rule.fee),
        greatSuccessChance: rule.greatSuccess,
        successChance: rule.success,
        partialFailChance: rule.partialFail,
        cooldownTime: rule.cooldown,
        isActive: rule.isActive
      });
      log(`    ✅ ${rule.rarity}★ 升級規則設置成功（含 ${rule.cooldown/3600} 小時冷卻）`, 'green');
    }

    // Step 12: ⭐ 設置初始 VIP 用戶（示例）
    logStep(++currentStep, totalSteps, '設置 VIP 用戶加成', 'yellow');
    
    // 這裡可以根據實際需求設置 VIP 用戶
    // 示例：設置部署者為 VIP（測試用）
    if (process.env.INITIAL_VIP_USERS) {
      const vipUsers = process.env.INITIAL_VIP_USERS.split(',');
      const vipBonuses = process.env.INITIAL_VIP_BONUSES ? 
        process.env.INITIAL_VIP_BONUSES.split(',').map(Number) : 
        new Array(vipUsers.length).fill(10); // 默認 10% 加成

      log(`  - 批量設置 ${vipUsers.length} 個 VIP 用戶...`, 'yellow');
      await altarOfAscension.setVIPBonusBatch(vipUsers, vipBonuses);
      log(`    ✅ VIP 用戶設置成功`, 'green');
    } else {
      log(`  ⚠️  未設置初始 VIP 用戶，跳過`, 'yellow');
    }

    // Step 13: 保存部署記錄
    logStep(++currentStep, totalSteps, '保存部署記錄', 'yellow');
    
    const deploymentRecord = {
      version: 'V18-V2Fixed',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: deployerAddress,
      addresses: deployedAddresses,
      features: [
        '完整合約部署',
        '自動合約連接',
        '參數初始化',
        '地城配置',
        'V2Fixed 祭壇（增強版）',
        '冷卻時間機制',
        'VIP 加成系統',
        '升級統計追蹤'
      ],
      altarFeatures: {
        cooldownEnabled: true,
        vipSystemEnabled: true,
        statsTrackingEnabled: true,
        upgradeRules: altarRules
      }
    };

    // 保存 JSON 記錄
    const recordPath = path.join(__dirname, '../../deployments', `deployment-v18-v2fixed-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    // 更新 deployed-addresses.json
    const deployedAddressesPath = path.join(__dirname, '../../deployed-addresses.json');
    fs.writeFileSync(deployedAddressesPath, JSON.stringify(deployedAddresses, null, 2));
    
    // 生成環境變數文件
    const envContent = Object.entries(deployedAddresses)
      .map(([key, value]) => `${key}_ADDRESS=${value}`)
      .join('\n');
    
    const envPath = path.join(__dirname, '../../.env.v18-v2fixed');
    fs.writeFileSync(envPath, envContent);

    // 打印部署總結
    log('\n' + '='.repeat(80), 'magenta');
    log('🎉 DungeonDelvers V18 (V2Fixed 祭壇) 部署完成！', 'green');
    log('='.repeat(80), 'magenta');
    
    log('\n📋 部署摘要:', 'cyan');
    log(`  版本: V18 with V2Fixed Altar`, 'yellow');
    log(`  網路: BSC Mainnet`, 'yellow');
    log(`  部署者: ${deployerAddress}`, 'yellow');
    log(`  時間: ${new Date().toLocaleString()}`, 'yellow');
    
    log('\n🏛️ 已部署合約:', 'cyan');
    Object.entries(deployedAddresses).forEach(([name, address]) => {
      log(`  ${name}: ${address}`, 'yellow');
    });
    
    log('\n✨ V2Fixed 祭壇新功能:', 'cyan');
    log('  - 冷卻時間機制（1-8小時）', 'green');
    log('  - VIP 加成系統（最高20%）', 'green');
    log('  - 升級統計追蹤', 'green');
    log('  - 詳細事件記錄', 'green');
    log('  - 規則開關控制', 'green');
    log('  - 安全隨機數生成', 'green');
    
    log('\n📄 部署記錄已保存至:', 'cyan');
    log(`  JSON: ${recordPath}`, 'yellow');
    log(`  地址: ${deployedAddressesPath}`, 'yellow');
    log(`  環境變數: ${envPath}`, 'yellow');
    
    log('\n⚠️  後續步驟:', 'cyan');
    log('  1. 驗證所有合約代碼', 'yellow');
    log('  2. 更新前端配置', 'yellow');
    log('  3. 更新子圖配置', 'yellow');
    log('  4. 測試所有功能', 'yellow');
    log('  5. 配置初始 VIP 用戶', 'yellow');
    
    log('\n🎊 恭喜！V18 部署成功完成！', 'green');
    log('='.repeat(80), 'magenta');

  } catch (error) {
    log('\n❌ 部署失敗:', 'red');
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
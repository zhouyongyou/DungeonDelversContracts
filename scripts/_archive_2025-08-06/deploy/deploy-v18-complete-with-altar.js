// scripts/deploy/deploy-v18-complete-with-altar.js
// DungeonDelvers V18 完整部署腳本 - 包含祭壇合約
// 基於 V17 改進，加入遺漏的 AltarOfAscension 部署

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
  const Factory = await ethers.getContractFactory(contractName);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  log(`✅ ${contractName} 部署成功: ${address}`, 'green');
  return contract;
}

async function main() {
  log('\n🚀 開始 DungeonDelvers V18 完整部署（含祭壇）', 'magenta');
  log('='.repeat(80), 'magenta');
  log('🎯 V18 特色：完整初始化 + 祭壇合約 + 自動連接 + 參數配置', 'cyan');
  log('⚡ 修復 V17 遺漏的祭壇部署，實現真正的完整部署', 'cyan');
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
  const totalSteps = 20; // 增加步驟數以包含祭壇相關設置
  let currentStep = 0;

  try {
    // Step 1: 部署核心代幣合約
    logStep(++currentStep, totalSteps, '部署 TestUSD 代幣', 'yellow');
    const testUSD = await deployContract("TestUSD");
    deployedAddresses.TESTUSD = await testUSD.getAddress();

    logStep(++currentStep, totalSteps, '部署 SoulShard 代幣', 'yellow');
    const soulShard = await deployContract("SoulShard", deployerAddress);
    deployedAddresses.SOULSHARD = await soulShard.getAddress();

    // Step 2: 部署 Oracle
    logStep(++currentStep, totalSteps, '部署 Oracle 價格預言機', 'yellow');
    const oracle = await deployContract("Oracle");
    deployedAddresses.ORACLE = await oracle.getAddress();

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

    // Step 6: ⭐ 部署祭壇合約（V18 新增）
    logStep(++currentStep, totalSteps, '部署 AltarOfAscension 升星祭壇', 'yellow');
    // 使用原版 AltarOfAscension，因為已經修復了函數調用問題
    const altarOfAscension = await deployContract("AltarOfAscension", deployerAddress);
    deployedAddresses.ALTAROFASCENSION = await altarOfAscension.getAddress();
    log('⭐ 祭壇合約部署成功！使用已修復的 V1 版本', 'green');

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

    // Step 8: 初始化 Oracle (如果有 pool 地址)
    logStep(++currentStep, totalSteps, '初始化 Oracle', 'yellow');
    const POOL_ADDRESS = process.env.POOL_ADDRESS;
    if (POOL_ADDRESS) {
      log('  - 設置 PancakeSwap V3 Pool...', 'yellow');
      await oracle.setPool(POOL_ADDRESS);
      log('    ✅ Pool 設置成功', 'green');
    } else {
      log('  ⚠️  未設置 POOL_ADDRESS，跳過 Oracle 初始化', 'yellow');
    }

    // Step 9: 設置遊戲參數
    logStep(++currentStep, totalSteps, '設置遊戲參數', 'yellow');
    
    // 設置鑄造價格
    // 注意：setMintPriceUSD 會自動乘以 1e18，所以只需要傳入純數字
    const mintPrices = [
      { contract: hero, name: 'Hero', price: '2' },   // 2 USD
      { contract: relic, name: 'Relic', price: '2' }, // 2 USD
      { contract: party, name: 'Party', price: '0' }  // 0 USD (免費)
    ];

    for (const { contract, name, price } of mintPrices) {
      log(`  - 設置 ${name} 鑄造價格: ${price} USD...`, 'yellow');
      // 只傳入數字，合約內部會自動 * 1e18
      await contract.setMintPriceUSD(price);
      log(`    ✅ ${name} 價格設置成功`, 'green');
    }

    // 設置平台費用
    log(`  - 設置平台探索費用: 0.001 BNB...`, 'yellow');
    await dungeonMaster.setPlatformFeeAmount(ethers.parseEther('0.001'));
    log(`    ✅ 平台費用設置成功`, 'green');

    // 設置稅務參數
    const taxSettings = [
      { func: 'setLargeWithdrawalThreshold', value: '1000', name: '大額提款門檻' },
      { func: 'setSmallWithdrawalThreshold', value: '10', name: '小額提款門檻' },
      { func: 'setStandardTaxBasisPoints', value: '800', name: '標準稅率 (8%)' },
      { func: 'setLargeTaxBasisPoints', value: '1500', name: '大額稅率 (15%)' },
      { func: 'setTimeDecayBasisPoints', value: '50', name: '時間衰減率' },
      { func: 'setDecayPeriod', value: '86400', name: '衰減週期 (1天)' }
    ];

    for (const setting of taxSettings) {
      log(`  - 設置 ${setting.name}: ${setting.value}...`, 'yellow');
      if (setting.func.includes('BasisPoints') || setting.func === 'setDecayPeriod') {
        await playerVault[setting.func](setting.value);
      } else {
        await playerVault[setting.func](ethers.parseEther(setting.value));
      }
      log(`    ✅ ${setting.name} 設置成功`, 'green');
    }

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

    // Step 11: ⭐ 設置祭壇升級規則（V18 新增）
    logStep(++currentStep, totalSteps, '設置祭壇升級規則', 'yellow');
    const altarRules = [
      { rarity: 1, materials: 5, fee: '0.005', greatSuccess: 5, success: 65, partialFail: 28 },
      { rarity: 2, materials: 4, fee: '0.01', greatSuccess: 4, success: 51, partialFail: 35 },
      { rarity: 3, materials: 3, fee: '0.02', greatSuccess: 3, success: 32, partialFail: 45 },
      { rarity: 4, materials: 2, fee: '0.05', greatSuccess: 2, success: 18, partialFail: 50 }
    ];

    for (const rule of altarRules) {
      log(`  - 設置 ${rule.rarity}★ → ${rule.rarity + 1}★ 升級規則...`, 'yellow');
      await altarOfAscension.setUpgradeRule(rule.rarity, {
        materialsRequired: rule.materials,
        nativeFee: ethers.parseEther(rule.fee),
        greatSuccessChance: rule.greatSuccess,
        successChance: rule.success,
        partialFailChance: rule.partialFail
      });
      log(`    ✅ ${rule.rarity}★ 升級規則設置成功`, 'green');
    }

    // Step 12: 保存部署記錄
    logStep(++currentStep, totalSteps, '保存部署記錄', 'yellow');
    
    const deploymentRecord = {
      version: 'V18',
      timestamp: new Date().toISOString(),
      network: 'BSC Mainnet',
      deployer: deployerAddress,
      addresses: deployedAddresses,
      features: [
        '完整合約部署',
        '自動合約連接',
        '參數初始化',
        '地城配置',
        '祭壇部署與配置（新增）'
      ]
    };

    // 保存 JSON 記錄
    const recordPath = path.join(__dirname, '../../deployments', `deployment-v18-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    // 更新 deployed-addresses.json
    const deployedAddressesPath = path.join(__dirname, '../../deployed-addresses.json');
    fs.writeFileSync(deployedAddressesPath, JSON.stringify(deployedAddresses, null, 2));

    // 生成部署報告
    const reportPath = path.join(__dirname, '../../DEPLOYMENT_RECORD_V18.md');
    const report = `# DungeonDelvers V18 部署記錄

## 基本信息
- **版本**: V18
- **時間**: ${new Date().toISOString()}
- **網路**: BSC Mainnet
- **部署者**: ${deployerAddress}

## 部署地址
\`\`\`
${Object.entries(deployedAddresses).map(([name, addr]) => `${name}: ${addr}`).join('\n')}
\`\`\`

## V18 特色
1. ✅ 完整合約部署（含祭壇）
2. ✅ 自動合約連接
3. ✅ 參數初始化
4. ✅ 地城配置（10個地城）
5. ✅ 祭壇升級規則配置

## 祭壇升級規則
- 1★ → 2★: 需要 5 個材料，0.005 BNB，大成功 5%，成功 65%，部分失敗 28%
- 2★ → 3★: 需要 4 個材料，0.01 BNB，大成功 4%，成功 51%，部分失敗 35%
- 3★ → 4★: 需要 3 個材料，0.02 BNB，大成功 3%，成功 32%，部分失敗 45%
- 4★ → 5★: 需要 2 個材料，0.05 BNB，大成功 2%，成功 18%，部分失敗 50%

## 部署步驟
${Array.from({ length: totalSteps }, (_, i) => `${i + 1}. ✅ 步驟完成`).join('\n')}

## 注意事項
- 祭壇合約已完整部署並設置規則
- 所有合約連接已建立
- 地城參數已初始化
- 子圖需要更新以支援祭壇事件
`;

    fs.writeFileSync(reportPath, report);

    // 完成部署
    log('\n' + '='.repeat(80), 'magenta');
    log('🎉 恭喜！DungeonDelvers V18 部署完成！', 'green');
    log('='.repeat(80), 'magenta');
    
    log('\n📋 部署摘要:', 'cyan');
    log(`  - 總共部署: ${Object.keys(deployedAddresses).length} 個合約`, 'yellow');
    log(`  - 部署記錄: ${recordPath}`, 'yellow');
    log(`  - 部署報告: ${reportPath}`, 'yellow');
    log(`  - 地址文件: ${deployedAddressesPath}`, 'yellow');
    
    log('\n⭐ V18 重要改進:', 'green');
    log('  - 包含完整的祭壇合約部署', 'green');
    log('  - 設置了祭壇升級規則', 'green');
    log('  - 修復了 V17 的遺漏問題', 'green');
    
    log('\n📌 下一步:', 'cyan');
    log('  1. 更新前端配置文件', 'yellow');
    log('  2. 更新子圖以支援祭壇事件', 'yellow');
    log('  3. 在 BSCScan 驗證合約', 'yellow');
    log('  4. 測試所有功能', 'yellow');

  } catch (error) {
    log(`\n❌ 部署失敗: ${error.message}`, 'red');
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
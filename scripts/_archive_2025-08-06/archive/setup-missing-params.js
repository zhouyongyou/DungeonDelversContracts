#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約地址
const PLAYERPROFILE_ADDRESS = '0x4998FADF96Be619d54f6E9bcc654F89937201FBe';
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';
const ALTAROFASCENSION_ADDRESS = '0xfb121441510296A92c8A2Cc04B6Aff1a2f72cd3f';

// ABIs
const PLAYERPROFILE_ABI = [
  "function setReferralCommissionPercentage(uint256 _percentage)",
  "function referralCommissionPercentage() view returns (uint256)"
];

const DUNGEONCORE_ABI = [
  "function setTaxPercentage(uint256 _taxPercentage)",
  "function taxPercentage() view returns (uint256)"
];

const DUNGEONMASTER_ABI = [
  "function setChallengeCooldown(uint256 _cooldown)",
  "function challengeCooldown() view returns (uint256)"
];

const ALTAROFASCENSION_ABI = [
  "function setDungeonCore(address _dungeonCore)",
  "function dungeonCore() view returns (address)",
  "function setPlatformFeePercentage(uint256 _percentage)",
  "function platformFeePercentage() view returns (uint256)",
  "function setSacrificeRequirements(uint8 stars, uint256 firstRequirement, uint256 additionalRequirement)",
  "function sacrificeRequirements(uint8) view returns (uint256 firstRequirement, uint256 additionalRequirement)"
];

// 參數配置
const PARAMS = {
  referralCommission: 10,        // 10% 邀請佣金
  taxPercentage: 10,            // 10% 稅率
  challengeCooldown: 300,       // 5 分鐘冷卻
  altarPlatformFee: 5,          // 5% 升星平台費
  sacrificeRequirements: [
    { stars: 0, first: 3, additional: 1 },   // 0->1星: 3個起，每次+1
    { stars: 1, first: 5, additional: 2 },   // 1->2星: 5個起，每次+2
    { stars: 2, first: 8, additional: 3 },   // 2->3星: 8個起，每次+3
    { stars: 3, first: 12, additional: 4 },  // 3->4星: 12個起，每次+4
    { stars: 4, first: 20, additional: 5 }   // 4->5星: 20個起，每次+5
  ]
};

async function setupMissingParams() {
  console.log('⚙️  設置缺失的參數...\n');
  
  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`📝 執行者地址: ${deployer.address}\n`);

  try {
    // 1. 設置 PlayerProfile 邀請佣金率
    console.log('1️⃣ 設置 PlayerProfile 邀請佣金率...');
    const playerProfile = new ethers.Contract(PLAYERPROFILE_ADDRESS, PLAYERPROFILE_ABI, deployer);
    
    try {
      const currentCommission = await playerProfile.referralCommissionPercentage();
      console.log(`   當前佣金率: ${currentCommission}%`);
    } catch (e) {
      console.log('   當前佣金率: 未設置');
    }
    
    console.log(`   設置新佣金率: ${PARAMS.referralCommission}%`);
    const tx1 = await playerProfile.setReferralCommissionPercentage(PARAMS.referralCommission);
    console.log(`   交易哈希: ${tx1.hash}`);
    console.log('   ⏳ 等待確認...');
    await tx1.wait();
    console.log('   ✅ 設置成功\n');

    // 2. 設置 DungeonCore 稅率
    console.log('2️⃣ 設置 DungeonCore 稅率...');
    const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, deployer);
    
    try {
      const currentTax = await dungeonCore.taxPercentage();
      console.log(`   當前稅率: ${currentTax}%`);
    } catch (e) {
      console.log('   當前稅率: 未設置');
    }
    
    console.log(`   設置新稅率: ${PARAMS.taxPercentage}%`);
    const tx2 = await dungeonCore.setTaxPercentage(PARAMS.taxPercentage);
    console.log(`   交易哈希: ${tx2.hash}`);
    console.log('   ⏳ 等待確認...');
    await tx2.wait();
    console.log('   ✅ 設置成功\n');

    // 3. 設置 DungeonMaster 冷卻時間
    console.log('3️⃣ 設置 DungeonMaster 冷卻時間...');
    const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, deployer);
    
    try {
      const currentCooldown = await dungeonMaster.challengeCooldown();
      console.log(`   當前冷卻時間: ${currentCooldown} 秒`);
    } catch (e) {
      console.log('   當前冷卻時間: 未設置');
    }
    
    console.log(`   設置新冷卻時間: ${PARAMS.challengeCooldown} 秒`);
    const tx3 = await dungeonMaster.setChallengeCooldown(PARAMS.challengeCooldown);
    console.log(`   交易哈希: ${tx3.hash}`);
    console.log('   ⏳ 等待確認...');
    await tx3.wait();
    console.log('   ✅ 設置成功\n');

    // 4. 設置 AltarOfAscension
    console.log('4️⃣ 設置 AltarOfAscension...');
    const altar = new ethers.Contract(ALTAROFASCENSION_ADDRESS, ALTAROFASCENSION_ABI, deployer);
    
    // 設置 DungeonCore
    console.log('   設置 DungeonCore 連接...');
    const altarCore = await altar.dungeonCore();
    if (altarCore === ethers.ZeroAddress) {
      const tx4 = await altar.setDungeonCore(DUNGEONCORE_ADDRESS);
      console.log(`   交易哈希: ${tx4.hash}`);
      await tx4.wait();
      console.log('   ✅ DungeonCore 設置成功');
    } else {
      console.log(`   ℹ️  DungeonCore 已設置: ${altarCore}`);
    }
    
    // 設置平台費
    console.log(`   設置平台費: ${PARAMS.altarPlatformFee}%`);
    const tx5 = await altar.setPlatformFeePercentage(PARAMS.altarPlatformFee);
    console.log(`   交易哈希: ${tx5.hash}`);
    await tx5.wait();
    console.log('   ✅ 平台費設置成功');
    
    // 設置升星祭品需求
    console.log('   設置升星祭品需求...');
    for (const req of PARAMS.sacrificeRequirements) {
      console.log(`     ${req.stars}星 -> ${req.stars + 1}星: 首次 ${req.first} 個，額外 +${req.additional}`);
      const tx = await altar.setSacrificeRequirements(req.stars, req.first, req.additional);
      await tx.wait();
    }
    console.log('   ✅ 所有升星需求設置成功\n');

    console.log('✅ 所有參數設置完成！');
    
  } catch (error) {
    console.error('\n❌ 設置失敗:', error);
    process.exit(1);
  }
}

// 執行設置
setupMissingParams().catch(console.error);
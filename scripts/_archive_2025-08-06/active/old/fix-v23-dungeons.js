#!/usr/bin/env node

// V23 地城修復腳本 - 使用正確的參數類型

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 正確的地城配置
const DUNGEONS = [
  { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
  { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 83 },
  { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 78 },
  { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 27, successRate: 74 },
  { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 35, successRate: 70 },
  { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 60, successRate: 66 },
  { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 82, successRate: 62 },
  { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 103, successRate: 58 },
  { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 136, successRate: 54 },
  { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 50 }
];

async function fixDungeons() {
  console.log('🏰 修復 V23 地城設置...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`📋 版本: ${v23Config.version}\n`);

  // 正確的 setDungeon ABI - 注意第四個參數是 uint8
  const DUNGEONMASTER_ABI = [
    'function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external',
    'function owner() view returns (address)',
    'function dungeonStorage() view returns (address)'
  ];

  const DUNGEONSTORAGE_ABI = [
    'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))'
  ];

  const dungeonMaster = new ethers.Contract(v23Config.contracts.DUNGEONMASTER.address, DUNGEONMASTER_ABI, deployer);
  const dungeonStorage = new ethers.Contract(v23Config.contracts.DUNGEONSTORAGE.address, DUNGEONSTORAGE_ABI, provider);

  try {
    // 檢查 owner
    const owner = await dungeonMaster.owner();
    console.log(`DungeonMaster Owner: ${owner}`);
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error('❌ 你不是 DungeonMaster 的 owner！');
      return;
    }

    console.log('\n🏰 開始設置地城...\n');
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const dungeon of DUNGEONS) {
      console.log(`地城 #${dungeon.id}: ${dungeon.name}`);
      
      try {
        // 檢查當前狀態
        const current = await dungeonStorage.getDungeon(dungeon.id);
        if (current.isInitialized && 
            current.requiredPower.toString() === dungeon.requiredPower.toString() &&
            ethers.formatUnits(current.rewardAmountUSD, 18) === dungeon.rewardUSD.toString() &&
            current.baseSuccessRate === dungeon.successRate) {
          console.log(`   ⏭️ 已正確設置，跳過`);
          skipCount++;
          continue;
        }

        // 設置地城
        const rewardAmountWei = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
        
        console.log(`   戰力: ${dungeon.requiredPower}`);
        console.log(`   獎勵: ${dungeon.rewardUSD} USD`);
        console.log(`   成功率: ${dungeon.successRate}%`);
        
        const tx = await dungeonMaster.setDungeon(
          dungeon.id,
          dungeon.requiredPower,
          rewardAmountWei,
          dungeon.successRate  // 這會自動轉換為 uint8
        );
        
        console.log(`   交易: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ 設置成功\n`);
        
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ 失敗: ${error.message}\n`);
        failCount++;
      }
    }

    console.log('\n📊 結果：');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ⏭️ 跳過: ${skipCount}`);
    console.log(`   ❌ 失敗: ${failCount}`);

    if (successCount > 0 || skipCount === DUNGEONS.length) {
      console.log('\n🎉 地城系統準備就緒！');
      
      // 顯示最終狀態
      console.log('\n📋 地城最終狀態：');
      for (const dungeon of DUNGEONS) {
        try {
          const data = await dungeonStorage.getDungeon(dungeon.id);
          if (data.isInitialized) {
            console.log(`   ${dungeon.name}: 戰力 ${data.requiredPower}, 獎勵 $${ethers.formatUnits(data.rewardAmountUSD, 18)}, 成功率 ${data.baseSuccessRate}%`);
          }
        } catch (e) {
          // 忽略
        }
      }
    }

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

if (require.main === module) {
  fixDungeons().catch(console.error);
}

module.exports = { fixDungeons };
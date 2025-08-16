#!/usr/bin/env node

// V23 地城初始化腳本 - 基於 V22 的經驗

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 地城配置（正確的數值）
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

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  'function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external',
  'function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint256 _baseSuccessRate) external',
  'function dungeonStorage() public view returns (address)',
  'function owner() public view returns (address)',
  'function paused() public view returns (bool)'
];

// DungeonStorage ABI
const DUNGEONSTORAGE_ABI = [
  'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
  'function logicContract() external view returns (address)',
  'function setLogicContract(address _logicContract) external'
];

async function initV23Dungeons() {
  console.log('🏰 初始化 V23 地城系統...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`📋 版本: ${v23Config.version}\n`);
  
  // 合約實例
  const dungeonMaster = new ethers.Contract(v23Config.contracts.DUNGEONMASTER.address, DUNGEONMASTER_ABI, deployer);
  const dungeonStorage = new ethers.Contract(v23Config.contracts.DUNGEONSTORAGE.address, DUNGEONSTORAGE_ABI, deployer);

  try {
    // 1. 檢查合約狀態
    console.log('🔍 檢查合約狀態...');
    
    const owner = await dungeonMaster.owner();
    console.log(`   DungeonMaster Owner: ${owner}`);
    console.log(`   匹配: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    
    const isPaused = await dungeonMaster.paused();
    console.log(`   合約狀態: ${isPaused ? '⏸️ 已暫停' : '▶️ 運行中'}`);
    
    const storageAddr = await dungeonMaster.dungeonStorage();
    console.log(`   DungeonStorage: ${storageAddr}`);
    console.log(`   匹配: ${storageAddr.toLowerCase() === v23Config.contracts.DUNGEONSTORAGE.address.toLowerCase() ? '✅' : '❌'}`);
    
    // 檢查 DungeonStorage 的邏輯合約
    const logicContract = await dungeonStorage.logicContract();
    console.log(`   邏輯合約: ${logicContract}`);
    console.log(`   匹配: ${logicContract.toLowerCase() === v23Config.contracts.DUNGEONMASTER.address.toLowerCase() ? '✅' : '❌'}`);

    // 2. 初始化地城
    console.log('\n🏰 開始初始化地城...');
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (const dungeon of DUNGEONS) {
      console.log(`\n   地城 #${dungeon.id}: ${dungeon.name}`);
      
      try {
        // 檢查是否已初始化
        try {
          const currentDungeon = await dungeonStorage.getDungeon(dungeon.id);
          if (currentDungeon.isInitialized) {
            console.log(`      ⏭️ 已初始化`);
            console.log(`      當前戰力: ${currentDungeon.requiredPower}`);
            console.log(`      當前獎勵: ${ethers.formatUnits(currentDungeon.rewardAmountUSD, 18)} USD`);
            console.log(`      當前成功率: ${currentDungeon.baseSuccessRate}%`);
            skipCount++;
            continue;
          }
        } catch (error) {
          // 讀取失敗，繼續初始化
        }
        
        const rewardAmountWei = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
        
        console.log(`      戰力要求: ${dungeon.requiredPower}`);
        console.log(`      獎勵: ${dungeon.rewardUSD} USD`);
        console.log(`      成功率: ${dungeon.successRate}%`);
        
        // 先嘗試 adminSetDungeon
        let tx;
        try {
          tx = await dungeonMaster.adminSetDungeon(
            dungeon.id,
            dungeon.requiredPower,
            rewardAmountWei,
            dungeon.successRate
          );
          console.log(`      ✅ 使用 adminSetDungeon`);
        } catch (error) {
          // 如果 adminSetDungeon 失敗，嘗試 setDungeon
          console.log(`      ⚠️ adminSetDungeon 失敗，嘗試 setDungeon`);
          tx = await dungeonMaster.setDungeon(
            dungeon.id,
            dungeon.requiredPower,
            rewardAmountWei,
            dungeon.successRate
          );
          console.log(`      ✅ 使用 setDungeon`);
        }
        
        console.log(`      交易: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`      ✅ 初始化成功 (區塊: ${receipt.blockNumber})`);
        
        successCount++;
        
        // 延遲避免 RPC 請求過快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`      ❌ 初始化失敗: ${error.message}`);
        failCount++;
      }
    }
    
    // 3. 驗證結果
    console.log('\n📊 初始化結果：');
    console.log(`   ✅ 成功: ${successCount} 個地城`);
    console.log(`   ⏭️ 跳過: ${skipCount} 個地城`);
    console.log(`   ❌ 失敗: ${failCount} 個地城`);
    
    if (successCount > 0 || skipCount === DUNGEONS.length) {
      console.log('\n🎉 地城系統就緒！');
      
      // 顯示所有地城狀態
      console.log('\n📋 地城狀態總覽：');
      for (let i = 1; i <= 10; i++) {
        try {
          const dungeon = await dungeonStorage.getDungeon(i);
          if (dungeon.isInitialized) {
            console.log(`   地城 ${i}: 戰力 ${dungeon.requiredPower}, 獎勵 ${ethers.formatUnits(dungeon.rewardAmountUSD, 18)} USD, 成功率 ${dungeon.baseSuccessRate}%`);
          }
        } catch (error) {
          // 忽略錯誤
        }
      }
    }

  } catch (error) {
    console.error('\n❌ 初始化失敗:', error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('\n💡 請確認：');
      console.log('1. 你是 DungeonMaster 合約的擁有者');
      console.log('2. 使用正確的私鑰');
    }
  }
}

// 執行初始化
if (require.main === module) {
  initV23Dungeons().catch(console.error);
}

module.exports = { initV23Dungeons };
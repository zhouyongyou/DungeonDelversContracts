#!/usr/bin/env node

// V22 地城初始化腳本

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  'function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external',
  'function owner() public view returns (address)',
  'function dungeonStorage() public view returns (address)',
  'function setDungeonStorage(address _storage) external',
  'function setDungeonCore(address _core) external',
  'function setSoulShardToken(address _token) external',
  'function setDungeonMasterWallet(address _wallet) external'
];

// DungeonStorage ABI
const DUNGEONSTORAGE_ABI = [
  'function getDungeon(uint256 _dungeonId) external view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))',
  'function NUM_DUNGEONS() external view returns (uint256)',
  'function setLogicContract(address _logicContract) external'
];

async function initDungeons() {
  console.log('🏰 初始化 V22 地城系統...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  
  // 合約實例
  const dungeonMaster = new ethers.Contract(v22Config.contracts.DUNGEONMASTER.address, DUNGEONMASTER_ABI, deployer);
  const dungeonStorage = new ethers.Contract(v22Config.contracts.DUNGEONSTORAGE.address, DUNGEONSTORAGE_ABI, deployer);

  try {
    // 1. 檢查並設置 DungeonMaster 的依賴
    console.log('🔧 檢查 DungeonMaster 配置...');
    
    try {
      await dungeonMaster.setDungeonStorage(v22Config.contracts.DUNGEONSTORAGE.address);
      console.log('   ✅ 設置 DungeonStorage');
    } catch (error) {
      console.log(`   ⚠️ DungeonStorage 可能已設置: ${error.message.substring(0, 50)}...`);
    }
    
    try {
      await dungeonMaster.setDungeonCore(v22Config.contracts.DUNGEONCORE.address);
      console.log('   ✅ 設置 DungeonCore');
    } catch (error) {
      console.log(`   ⚠️ DungeonCore 可能已設置: ${error.message.substring(0, 50)}...`);
    }
    
    try {
      await dungeonMaster.setSoulShardToken(v22Config.contracts.SOULSHARD.address);
      console.log('   ✅ 設置 SoulShardToken');
    } catch (error) {
      console.log(`   ⚠️ SoulShardToken 可能已設置: ${error.message.substring(0, 50)}...`);
    }
    
    try {
      await dungeonMaster.setDungeonMasterWallet(v22Config.contracts.DUNGEONMASTERWALLET.address);
      console.log('   ✅ 設置 DungeonMasterWallet');
    } catch (error) {
      console.log(`   ⚠️ DungeonMasterWallet 可能已設置: ${error.message.substring(0, 50)}...`);
    }

    // 2. 設置 DungeonStorage 的邏輯合約
    console.log('\n🔧 設置 DungeonStorage...');
    try {
      const tx1 = await dungeonStorage.setLogicContract(v22Config.contracts.DUNGEONMASTER.address);
      await tx1.wait();
      console.log('   ✅ 設置 LogicContract');
    } catch (error) {
      console.log(`   ⚠️ LogicContract 可能已設置: ${error.message.substring(0, 50)}...`);
    }

    // 3. 初始化所有地城
    console.log('\n🏰 初始化地城...');
    const dungeons = v22Config.parameters.dungeons;
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const dungeon of dungeons) {
      try {
        console.log(`\n   地城 #${dungeon.id}: ${dungeon.name}`);
        
        // 檢查是否已初始化
        try {
          const currentDungeon = await dungeonStorage.getDungeon(dungeon.id);
          if (currentDungeon.isInitialized) {
            console.log(`      ⏭️ 已初始化，跳過`);
            skipCount++;
            continue;
          }
        } catch (error) {
          // 忽略讀取錯誤，繼續初始化
        }
        
        // 初始化地城
        const rewardAmountWei = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
        
        console.log(`      戰力要求: ${dungeon.requiredPower}`);
        console.log(`      獎勵: ${dungeon.rewardUSD} USD`);
        console.log(`      成功率: ${dungeon.successRate}%`);
        
        const tx = await dungeonMaster.adminSetDungeon(
          dungeon.id,
          dungeon.requiredPower,
          rewardAmountWei,
          dungeon.successRate
        );
        
        console.log(`      交易: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`      ✅ 初始化成功 (區塊: ${receipt.blockNumber})`);
        
        successCount++;
        
        // 延遲避免 RPC 請求過快
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`      ❌ 初始化失敗: ${error.message}`);
      }
    }
    
    console.log('\n📊 初始化結果：');
    console.log(`   ✅ 成功: ${successCount} 個地城`);
    console.log(`   ⏭️ 跳過: ${skipCount} 個地城`);
    console.log(`   ❌ 失敗: ${dungeons.length - successCount - skipCount} 個地城`);
    
    if (successCount > 0) {
      console.log('\n🎉 地城初始化完成！現在可以進行地城探索了。');
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
  initDungeons().catch(console.error);
}

module.exports = { initDungeons };
#!/usr/bin/env node

// 設置 DungeonMaster 的必要連接

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址（使用標準校驗和格式）
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';
const SOULSHARD_ADDRESS = '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF';
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';
const DUNGEONSTORAGE_ADDRESS = '0x2fcd1bbbB88cce8040A2DE92E97d5375d8B088da';

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  "function setSoulShardToken(address _token) external",
  "function setDungeonCore(address _dungeonCore) external",
  "function setDungeonStorage(address _dungeonStorage) external",
  "function soulShardToken() view returns (address)",
  "function dungeonCore() view returns (address)",
  "function dungeonStorage() view returns (address)",
  "function owner() view returns (address)"
];

async function setupDungeonMasterConnections() {
  console.log('🔧 設置 DungeonMaster 連接\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  const dungeonMaster = new ethers.Contract(
    DUNGEONMASTER_ADDRESS,
    DUNGEONMASTER_ABI,
    signer
  );
  
  try {
    // 檢查 owner
    const owner = await dungeonMaster.owner();
    console.log(`📋 DungeonMaster Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ 錯誤: 您不是 DungeonMaster 的 owner');
      console.log(`   您的地址: ${signer.address}`);
      console.log(`   Owner 地址: ${owner}`);
      return;
    }
    
    // 檢查當前設置
    const currentSoulShard = await dungeonMaster.soulShardToken();
    const currentDungeonCore = await dungeonMaster.dungeonCore();
    const currentDungeonStorage = await dungeonMaster.dungeonStorage();
    
    console.log('\n📊 當前設置:');
    console.log(`SoulShard Token: ${currentSoulShard}`);
    console.log(`DungeonCore: ${currentDungeonCore}`);
    console.log(`DungeonStorage: ${currentDungeonStorage}`);
    
    let needsUpdate = false;
    const updates = [];
    
    // 檢查 SoulShard Token
    if (currentSoulShard === ethers.ZeroAddress || currentSoulShard.toLowerCase() !== SOULSHARD_ADDRESS.toLowerCase()) {
      needsUpdate = true;
      updates.push({
        name: 'SoulShard Token',
        current: currentSoulShard,
        target: SOULSHARD_ADDRESS,
        setter: 'setSoulShardToken'
      });
    }
    
    // 檢查 DungeonCore
    if (currentDungeonCore === ethers.ZeroAddress || currentDungeonCore.toLowerCase() !== DUNGEONCORE_ADDRESS.toLowerCase()) {
      needsUpdate = true;
      updates.push({
        name: 'DungeonCore',
        current: currentDungeonCore,
        target: DUNGEONCORE_ADDRESS,
        setter: 'setDungeonCore'
      });
    }
    
    // 檢查 DungeonStorage
    if (currentDungeonStorage === ethers.ZeroAddress || currentDungeonStorage.toLowerCase() !== DUNGEONSTORAGE_ADDRESS.toLowerCase()) {
      needsUpdate = true;
      updates.push({
        name: 'DungeonStorage',
        current: currentDungeonStorage,
        target: DUNGEONSTORAGE_ADDRESS,
        setter: 'setDungeonStorage'
      });
    }
    
    if (!needsUpdate) {
      console.log('\n✅ 所有連接已正確設置！');
      return;
    }
    
    // 執行更新
    console.log('\n📦 需要更新的設置:');
    for (const update of updates) {
      console.log(`- ${update.name}: ${update.current} → ${update.target}`);
    }
    
    console.log('\n📤 開始更新...');
    
    for (const update of updates) {
      console.log(`\n更新 ${update.name}...`);
      const tx = await dungeonMaster[update.setter](update.target);
      console.log(`交易哈希: ${tx.hash}`);
      console.log('⏳ 等待確認...');
      await tx.wait();
      console.log('✅ 更新成功');
    }
    
    // 驗證更新
    console.log('\n🔍 驗證更新...');
    const newSoulShard = await dungeonMaster.soulShardToken();
    const newDungeonCore = await dungeonMaster.dungeonCore();
    const newDungeonStorage = await dungeonMaster.dungeonStorage();
    
    console.log('\n🎉 最終設置:');
    console.log(`SoulShard Token: ${newSoulShard}`);
    console.log(`DungeonCore: ${newDungeonCore}`);
    console.log(`DungeonStorage: ${newDungeonStorage}`);
    
    console.log('\n✅ DungeonMaster 連接設置完成！');
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.message.includes('execution reverted')) {
      console.log('\n可能的原因:');
      console.log('1. 您不是合約的 owner');
      console.log('2. 合約被暫停（paused）');
      console.log('3. 目標地址無效');
    }
  }
}

setupDungeonMasterConnections().catch(console.error);
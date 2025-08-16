#!/usr/bin/env node

// 修復地城獎勵設置

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// DungeonMaster ABI
const DUNGEON_MASTER_ABI = [
  'function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external',
  'function dungeonCore() public view returns (address)',
  'function owner() public view returns (address)'
];

// DungeonStorage ABI
const DUNGEON_STORAGE_ABI = [
  'function dungeons(uint256) public view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized)'
];

async function fixDungeonRewards() {
  console.log('🔧 修復地城獎勵設置...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🏰 DungeonMaster 地址: ${v22Config.contracts.DUNGEONMASTER.address}`);
  console.log(`📦 DungeonStorage 地址: ${v22Config.contracts.DUNGEONSTORAGE.address}\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEON_MASTER_ABI,
    deployer
  );

  const dungeonStorage = new ethers.Contract(
    v22Config.contracts.DUNGEONSTORAGE.address,
    DUNGEON_STORAGE_ABI,
    provider
  );

  try {
    // 1. 檢查權限
    const owner = await dungeonMaster.owner();
    console.log(`🔑 DungeonMaster Owner: ${owner}`);
    console.log(`✅ 你是 Owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '是' : '否'}\n`);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error('你不是 DungeonMaster 的 Owner');
    }

    // 2. 修復每個地城的獎勵
    console.log('📝 開始修復地城獎勵...\n');
    
    for (const dungeon of v22Config.parameters.dungeons) {
      console.log(`🏰 地城 ${dungeon.id}: ${dungeon.name}`);
      
      // 檢查當前狀態
      const [currentPower, currentRewardUSD, currentSuccessRate, isInitialized] = 
        await dungeonStorage.dungeons(dungeon.id);
      
      const currentUSDFormatted = parseFloat(ethers.formatUnits(currentRewardUSD, 18));
      console.log(`   當前 USD 獎勵: $${currentUSDFormatted}`);
      console.log(`   預期 USD 獎勵: $${dungeon.rewardUSD}`);
      
      // 如果獎勵不正確，修復它
      if (Math.abs(currentUSDFormatted - dungeon.rewardUSD) > 0.01) {
        console.log('   ⚠️ 需要修復');
        
        // 準備新的獎勵值 (轉換為 wei)
        const newRewardUSD = ethers.parseUnits(dungeon.rewardUSD.toString(), 18);
        
        console.log(`   設置新獎勵: ${dungeon.rewardUSD} USD (${newRewardUSD.toString()} wei)`);
        
        // 發送交易
        const tx = await dungeonMaster.adminSetDungeon(
          dungeon.id,
          dungeon.requiredPower,
          newRewardUSD,
          dungeon.successRate
        );
        
        console.log(`   交易哈希: ${tx.hash}`);
        console.log('   等待確認...');
        
        const receipt = await tx.wait();
        console.log(`   ✅ 地城 ${dungeon.id} 獎勵已更新！區塊: ${receipt.blockNumber}\n`);
        
        // 等待一下避免太快
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('   ✅ 獎勵已正確\n');
      }
    }

    // 3. 驗證修復結果
    console.log('\n🔍 驗證修復結果...');
    console.log('ID | 名稱 | USD獎勵 | 預期USD | 狀態');
    console.log('---|------|---------|---------|------');
    
    let allFixed = true;
    
    for (const dungeon of v22Config.parameters.dungeons) {
      const [, rewardUSD] = await dungeonStorage.dungeons(dungeon.id);
      const usdFormatted = parseFloat(ethers.formatUnits(rewardUSD, 18));
      const status = Math.abs(usdFormatted - dungeon.rewardUSD) < 0.01 ? '✅' : '❌';
      
      if (status === '❌') {
        allFixed = false;
      }
      
      console.log(`${dungeon.id.toString().padStart(2)} | ${dungeon.name.padEnd(12)} | $${usdFormatted.toFixed(2).padStart(6)} | $${dungeon.rewardUSD.toString().padStart(6)} | ${status}`);
    }

    // 4. 總結
    console.log('\n🎯 修復總結：');
    if (allFixed) {
      console.log('🎉 所有地城獎勵已成功修復！');
      console.log('✅ 前端現在應該正確顯示地城獎勵');
      console.log('💡 玩家可以看到正確的 SOUL 和 USD 獎勵');
    } else {
      console.log('❌ 部分地城獎勵修復失敗');
      console.log('請檢查錯誤日誌並重試');
    }

  } catch (error) {
    console.error('\n❌ 修復失敗:', error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('💡 確認你是 DungeonMaster 合約的擁有者');
    }
  }
}

// 執行修復
if (require.main === module) {
  fixDungeonRewards().catch(console.error);
}

module.exports = { fixDungeonRewards };
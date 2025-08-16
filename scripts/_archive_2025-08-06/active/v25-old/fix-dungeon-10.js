#!/usr/bin/env node

// 修復地城 10 (混沌深淵) 的獎勵

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// DungeonMaster ABI
const DUNGEON_MASTER_ABI = [
  'function adminSetDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external'
];

async function fixDungeon10() {
  console.log('🔧 修復地城 10 (混沌深淵) 獎勵...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🏰 DungeonMaster 地址: ${v22Config.contracts.DUNGEONMASTER.address}\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEON_MASTER_ABI,
    deployer
  );

  try {
    // 地城 10 的配置
    const dungeon = v22Config.parameters.dungeons.find(d => d.id === 10);
    console.log(`🏰 地城 ${dungeon.id}: ${dungeon.name}`);
    console.log(`   戰力需求: ${dungeon.requiredPower}`);
    console.log(`   預期 USD 獎勵: $${dungeon.rewardUSD}`);
    console.log(`   成功率: ${dungeon.successRate}%`);
    
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
    
    console.log(`\n📤 交易已發送:`);
    console.log(`   哈希: ${tx.hash}`);
    console.log('   等待確認...');
    
    const receipt = await tx.wait();
    console.log(`\n✅ 地城 10 獎勵已成功更新！`);
    console.log(`   區塊號: ${receipt.blockNumber}`);
    console.log(`   Gas 使用: ${ethers.formatUnits(receipt.gasUsed, 'gwei')} Gwei`);
    
    console.log('\n🎉 修復完成！');
    console.log('   現在所有 10 個地城都應該有正確的 USD 獎勵');
    console.log('   前端將正確顯示地城獎勵（SOUL 和 USD）');

  } catch (error) {
    console.error('\n❌ 修復失敗:', error.message);
  }
}

// 執行修復
if (require.main === module) {
  fixDungeon10().catch(console.error);
}

module.exports = { fixDungeon10 };
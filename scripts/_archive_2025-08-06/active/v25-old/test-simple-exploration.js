#!/usr/bin/env node

// 最簡單的地城探索測試

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 簡單的 ABI
const SIMPLE_ABI = [
  'function exploreDungeon(uint256 partyId, uint256 dungeonId) external',
  'function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable'
];

async function testSimpleExploration() {
  console.log('🎮 簡單地城探索測試...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const player = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 玩家地址: ${player.address}`);
  console.log(`💰 餘額: ${ethers.formatEther(await provider.getBalance(player.address))} BNB\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    SIMPLE_ABI,
    player
  );

  const partyId = 1;
  const dungeonId = 1;

  // 1. 嘗試 exploreDungeon（如果存在）
  console.log('📋 嘗試 exploreDungeon 函數...');
  try {
    const tx = await dungeonMaster.exploreDungeon(partyId, dungeonId);
    console.log(`✅ 成功！交易哈希: ${tx.hash}`);
    console.log('等待確認...');
    const receipt = await tx.wait();
    console.log(`確認完成！區塊: ${receipt.blockNumber}`);
  } catch (error) {
    console.log(`❌ exploreDungeon 失敗: ${error.message.substring(0, 100)}...`);
  }

  // 2. 嘗試 requestExpedition
  console.log('\n📋 嘗試 requestExpedition 函數...');
  try {
    // 使用較高的費用確保足夠
    const tx = await dungeonMaster.requestExpedition(partyId, dungeonId, {
      value: ethers.parseEther("0.01") // 0.01 BNB
    });
    console.log(`✅ 成功！交易哈希: ${tx.hash}`);
    console.log('等待確認...');
    const receipt = await tx.wait();
    console.log(`確認完成！區塊: ${receipt.blockNumber}`);
  } catch (error) {
    console.log(`❌ requestExpedition 失敗: ${error.message.substring(0, 100)}...`);
    
    // 詳細錯誤分析
    if (error.data) {
      console.log('\n錯誤數據:', error.data);
    }
  }

  // 3. 嘗試直接 call 看看錯誤
  console.log('\n📋 嘗試 staticCall 分析錯誤...');
  try {
    await dungeonMaster.requestExpedition.staticCall(partyId, dungeonId, {
      value: ethers.parseEther("0.01")
    });
    console.log('✅ staticCall 成功（不應該發生）');
  } catch (error) {
    console.log('❌ staticCall 錯誤詳情:');
    console.log('  錯誤類型:', error.code);
    console.log('  錯誤原因:', error.reason || '未知');
    console.log('  錯誤數據:', error.data || '無');
    
    // 嘗試解碼錯誤
    if (error.data && error.data !== '0x') {
      console.log('  錯誤選擇器:', error.data.substring(0, 10));
    }
  }
}

// 執行測試
if (require.main === module) {
  testSimpleExploration().catch(console.error);
}

module.exports = { testSimpleExploration };
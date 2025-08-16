#!/usr/bin/env node

// 修復 Party 合約的 DungeonCore 連接問題
// 使用正確的函數名 setDungeonCore 而不是 setDungeonCoreContract

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// Party ABI - 使用正確的函數名
const PARTY_ABI = [
  'function setDungeonCore(address _newAddress) external',
  'function dungeonCoreAddress() public view returns (address)',
  'function owner() public view returns (address)'
];

async function fixPartyDungeonCore() {
  console.log('🔧 修復 Party 合約的 DungeonCore 連接...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}\n`);

  const party = new ethers.Contract(
    v22Config.contracts.PARTY.address,
    PARTY_ABI,
    deployer
  );

  try {
    // 1. 檢查當前設置
    console.log('📋 檢查當前設置：');
    console.log(`Party 地址: ${v22Config.contracts.PARTY.address}`);
    console.log(`DungeonCore 地址: ${v22Config.contracts.DUNGEONCORE.address}`);
    
    // 檢查擁有者
    try {
      const owner = await party.owner();
      console.log(`Party 合約擁有者: ${owner}`);
      console.log(`執行者是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`無法獲取擁有者: ${error.message}`);
    }

    // 檢查當前 DungeonCore 地址
    try {
      const currentDungeonCore = await party.dungeonCoreAddress();
      console.log(`\n當前 DungeonCore: ${currentDungeonCore}`);
      
      if (currentDungeonCore.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase()) {
        console.log('✅ DungeonCore 地址已經正確設置！');
        return;
      }
    } catch (error) {
      console.log(`❌ 無法讀取當前 DungeonCore: ${error.message}`);
    }

    // 2. 執行修復
    console.log('\n🔗 設置 DungeonCore 地址...');
    
    try {
      const tx = await party.setDungeonCore(v22Config.contracts.DUNGEONCORE.address);
      console.log(`交易哈希: ${tx.hash}`);
      console.log('等待確認...');
      
      const receipt = await tx.wait();
      console.log(`✅ 成功！區塊: ${receipt.blockNumber}`);
      
      // 3. 驗證設置
      console.log('\n📋 驗證設置：');
      const newDungeonCore = await party.dungeonCoreAddress();
      console.log(`新的 DungeonCore: ${newDungeonCore}`);
      console.log(`設置正確: ${newDungeonCore.toLowerCase() === v22Config.contracts.DUNGEONCORE.address.toLowerCase() ? '✅' : '❌'}`);
      
      console.log('\n🎉 修復完成！');
      console.log('Party 合約現在應該可以正確調用 DungeonCore 了。');
      
    } catch (error) {
      if (error.message.includes('Ownable: caller is not the owner')) {
        console.log('\n❌ 失敗: 你不是 Party 合約的擁有者');
        console.log('需要使用合約擁有者地址執行此腳本。');
      } else {
        console.log(`\n❌ 設置失敗: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ 修復失敗:', error.message);
  }
}

// 執行修復
if (require.main === module) {
  fixPartyDungeonCore().catch(console.error);
}

module.exports = { fixPartyDungeonCore };
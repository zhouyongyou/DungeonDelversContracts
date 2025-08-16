#!/usr/bin/env node

// 修復 DungeonMaster 合約連接

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// DungeonMaster ABI
const DUNGEONMASTER_ABI = [
  'function setDungeonCore(address _newAddress) external',
  'function setDungeonStorage(address _newAddress) external',
  'function setSoulShardToken(address _newAddress) external',
  'function setDungeonMasterWallet(address _newAddress) external',
  'function dungeonCore() public view returns (address)',
  'function dungeonStorage() public view returns (address)',
  'function soulShardToken() public view returns (address)',
  'function dungeonMasterWallet() public view returns (address)',
  'function owner() public view returns (address)'
];

async function fixDungeonMasterConnections() {
  console.log('🔧 修復 DungeonMaster 合約連接...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}\n`);

  const dungeonMaster = new ethers.Contract(
    v22Config.contracts.DUNGEONMASTER.address,
    DUNGEONMASTER_ABI,
    deployer
  );

  try {
    // 1. 檢查當前設置
    console.log('📋 檢查當前設置：');
    console.log(`DungeonMaster 地址: ${v22Config.contracts.DUNGEONMASTER.address}`);
    
    // 檢查擁有者
    try {
      const owner = await dungeonMaster.owner();
      console.log(`合約擁有者: ${owner}`);
      console.log(`執行者是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
      
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log('\n❌ 錯誤: 你不是合約擁有者');
        return;
      }
    } catch (error) {
      console.log(`無法獲取擁有者: ${error.message}`);
    }

    // 檢查當前連接
    console.log('\n📋 檢查當前連接：');
    
    const connections = [
      { name: 'DungeonCore', getter: 'dungeonCore', expected: v22Config.contracts.DUNGEONCORE.address },
      { name: 'DungeonStorage', getter: 'dungeonStorage', expected: v22Config.contracts.DUNGEONSTORAGE.address },
      { name: 'SoulShard Token', getter: 'soulShardToken', expected: v22Config.contracts.SOULSHARD.address },
      { name: 'DungeonMaster Wallet', getter: 'dungeonMasterWallet', expected: v22Config.contracts.DUNGEONMASTERWALLET.address }
    ];
    
    const toFix = [];
    
    for (const conn of connections) {
      try {
        const currentAddress = await dungeonMaster[conn.getter]();
        const isCorrect = currentAddress.toLowerCase() === conn.expected.toLowerCase();
        const isZero = currentAddress === ethers.ZeroAddress;
        
        console.log(`${conn.name}: ${currentAddress}`);
        console.log(`   預期: ${conn.expected}`);
        console.log(`   狀態: ${isZero ? '❌ 未設置' : (isCorrect ? '✅ 正確' : '⚠️ 不匹配')}`);
        
        if (!isCorrect) {
          toFix.push(conn);
        }
      } catch (error) {
        console.log(`${conn.name}: ❌ 無法讀取 - ${error.message}`);
        toFix.push(conn);
      }
    }

    // 2. 執行修復
    if (toFix.length === 0) {
      console.log('\n✅ 所有連接都正確！');
      return;
    }

    console.log(`\n🔗 需要修復 ${toFix.length} 個連接...`);
    
    for (const conn of toFix) {
      console.log(`\n修復 ${conn.name}...`);
      
      try {
        let tx;
        switch (conn.name) {
          case 'DungeonCore':
            tx = await dungeonMaster.setDungeonCore(conn.expected);
            break;
          case 'DungeonStorage':
            tx = await dungeonMaster.setDungeonStorage(conn.expected);
            break;
          case 'SoulShard Token':
            tx = await dungeonMaster.setSoulShardToken(conn.expected);
            break;
          case 'DungeonMaster Wallet':
            tx = await dungeonMaster.setDungeonMasterWallet(conn.expected);
            break;
        }
        
        console.log(`交易哈希: ${tx.hash}`);
        console.log('等待確認...');
        
        const receipt = await tx.wait();
        console.log(`✅ 成功！區塊: ${receipt.blockNumber}`);
        
      } catch (error) {
        console.log(`❌ 失敗: ${error.message}`);
      }
    }

    // 3. 驗證修復
    console.log('\n📋 驗證修復結果：');
    
    for (const conn of connections) {
      try {
        const currentAddress = await dungeonMaster[conn.getter]();
        const isCorrect = currentAddress.toLowerCase() === conn.expected.toLowerCase();
        console.log(`${conn.name}: ${isCorrect ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`${conn.name}: ❌ 驗證失敗`);
      }
    }
    
    console.log('\n🎉 修復完成！');
    
  } catch (error) {
    console.error('\n❌ 修復失敗:', error.message);
  }
}

// 執行修復
if (require.main === module) {
  fixDungeonMasterConnections().catch(console.error);
}

module.exports = { fixDungeonMasterConnections };
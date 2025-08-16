#!/usr/bin/env node

// 設置 V22 合約間的連接

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 合約 ABI
const ABI_SET_DUNGEONCORE = ['function setDungeonCore(address _newAddress) external'];
const ABI_SET_SOULSHARD = ['function setSoulShardToken(address _newAddress) external'];
const ABI_SET_STORAGE = ['function setDungeonStorage(address _newAddress) external'];
const ABI_SET_WALLET = ['function setDungeonMasterWallet(address _newAddress) external'];
const ABI_SET_HERO = ['function setHeroContract(address _newAddress) external'];
const ABI_SET_RELIC = ['function setRelicContract(address _newAddress) external'];

async function setupV22Connections() {
  console.log('🔧 設置 V22 合約連接...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}\n`);

  const setupTasks = [
    // 1. Party 設置 DungeonCore
    {
      name: 'Party -> DungeonCore',
      contract: v22Config.contracts.PARTY.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    
    // 2. Party 設置 Hero 和 Relic
    {
      name: 'Party -> Hero',
      contract: v22Config.contracts.PARTY.address,
      abi: ABI_SET_HERO,
      method: 'setHeroContract',
      args: [v22Config.contracts.HERO.address]
    },
    {
      name: 'Party -> Relic',
      contract: v22Config.contracts.PARTY.address,
      abi: ABI_SET_RELIC,
      method: 'setRelicContract',
      args: [v22Config.contracts.RELIC.address]
    },
    
    // 3. Hero 設置 DungeonCore 和 SoulShard
    {
      name: 'Hero -> DungeonCore',
      contract: v22Config.contracts.HERO.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    {
      name: 'Hero -> SoulShard',
      contract: v22Config.contracts.HERO.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    },
    
    // 4. Relic 設置 DungeonCore 和 SoulShard
    {
      name: 'Relic -> DungeonCore',
      contract: v22Config.contracts.RELIC.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    {
      name: 'Relic -> SoulShard',
      contract: v22Config.contracts.RELIC.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    },
    
    // 5. DungeonMaster 設置
    {
      name: 'DungeonMaster -> DungeonCore',
      contract: v22Config.contracts.DUNGEONMASTER.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    {
      name: 'DungeonMaster -> DungeonStorage',
      contract: v22Config.contracts.DUNGEONMASTER.address,
      abi: ABI_SET_STORAGE,
      method: 'setDungeonStorage',
      args: [v22Config.contracts.DUNGEONSTORAGE.address]
    },
    {
      name: 'DungeonMaster -> SoulShard',
      contract: v22Config.contracts.DUNGEONMASTER.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    },
    {
      name: 'DungeonMaster -> Wallet',
      contract: v22Config.contracts.DUNGEONMASTER.address,
      abi: ABI_SET_WALLET,
      method: 'setDungeonMasterWallet',
      args: [v22Config.contracts.DUNGEONMASTERWALLET.address]
    },
    
    // 6. PlayerVault 設置
    {
      name: 'PlayerVault -> DungeonCore',
      contract: v22Config.contracts.PLAYERVAULT.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    {
      name: 'PlayerVault -> SoulShard',
      contract: v22Config.contracts.PLAYERVAULT.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    },
    
    // 7. VIPStaking 設置
    {
      name: 'VIPStaking -> SoulShard',
      contract: v22Config.contracts.VIPSTAKING.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    },
    
    // 8. AltarOfAscension 設置
    {
      name: 'AltarOfAscension -> DungeonCore',
      contract: v22Config.contracts.ALTAROFASCENSION.address,
      abi: ABI_SET_DUNGEONCORE,
      method: 'setDungeonCore',
      args: [v22Config.contracts.DUNGEONCORE.address]
    },
    {
      name: 'AltarOfAscension -> SoulShard',
      contract: v22Config.contracts.ALTAROFASCENSION.address,
      abi: ABI_SET_SOULSHARD,
      method: 'setSoulShardToken',
      args: [v22Config.contracts.SOULSHARD.address]
    }
  ];

  let successCount = 0;
  let failureCount = 0;
  
  for (const task of setupTasks) {
    console.log(`\n🔗 設置 ${task.name}...`);
    console.log(`   合約: ${task.contract}`);
    console.log(`   方法: ${task.method}(${task.args[0]})`);
    
    try {
      const contract = new ethers.Contract(task.contract, task.abi, deployer);
      
      // 先檢查是否需要設置（避免重複交易）
      // 注意：這裡我們直接執行，因為檢查可能失敗
      
      const tx = await contract[task.method](...task.args);
      console.log(`   交易哈希: ${tx.hash}`);
      console.log('   等待確認...');
      
      const receipt = await tx.wait();
      console.log(`   ✅ 成功！區塊: ${receipt.blockNumber}`);
      successCount++;
      
    } catch (error) {
      if (error.message.includes('Ownable: caller is not the owner')) {
        console.log('   ❌ 失敗: 你不是合約擁有者');
      } else if (error.message.includes('Already set')) {
        console.log('   ⚠️ 跳過: 已經設置過了');
        successCount++;
      } else {
        console.log(`   ❌ 失敗: ${error.message}`);
      }
      failureCount++;
    }
    
    // 避免太快發送交易
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 總結
  console.log('\n📊 設置總結：');
  console.log(`   ✅ 成功: ${successCount} 個`);
  console.log(`   ❌ 失敗: ${failureCount} 個`);
  console.log(`   📋 總計: ${setupTasks.length} 個任務`);
  
  if (failureCount > 0) {
    console.log('\n⚠️  部分設置失敗');
    console.log('可能的原因：');
    console.log('1. 你不是某些合約的擁有者');
    console.log('2. 某些設置已經完成');
    console.log('3. 合約地址錯誤');
    
    console.log('\n建議：');
    console.log('1. 檢查合約擁有權');
    console.log('2. 重新運行檢查腳本: node scripts/active/check-dungeoncore-setup.js');
  } else {
    console.log('\n🎉 所有連接設置成功！');
    console.log('現在應該可以正常進行地城探索了。');
  }
}

// 執行設置
if (require.main === module) {
  setupV22Connections().catch(console.error);
}

module.exports = { setupV22Connections };
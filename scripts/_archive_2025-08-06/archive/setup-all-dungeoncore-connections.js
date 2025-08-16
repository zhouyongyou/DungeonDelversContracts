#!/usr/bin/env node

// 設置所有合約的 DungeonCore 連接
// 包括：Party, PlayerProfile, VIPStaking, AltarOfAscension

const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 最新合約地址
const CONTRACTS = {
  DUNGEONCORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  PARTY: '0x514AFBb114fa6c77CC025720A31aaeE038fBbcd7',
  PLAYER_PROFILE: '0x5d4582266654CBEA6cC6Bdf696B68B8473521b63',
  VIP_STAKING: '0x9c2fdD1c692116aB5209983e467286844B3b9921',
  ALTAR_OF_ASCENSION: '0xbA76D9E0063280d4B0F6e139B5dD45A47BBD1e4e'
};

// ABI 定義
const ABIS = {
  Party: [
    "function dungeonCoreContract() view returns (address)",
    "function setDungeonCore(address _dungeonCore) external",
    "function owner() view returns (address)"
  ],
  PlayerProfile: [
    "function dungeonCore() view returns (address)",
    "function setDungeonCore(address _dungeonCore) external",
    "function owner() view returns (address)"
  ],
  VIPStaking: [
    "function dungeonCore() view returns (address)",
    "function setDungeonCore(address _dungeonCore) external",
    "function owner() view returns (address)"
  ],
  AltarOfAscension: [
    "function dungeonCore() view returns (address)",
    "function setDungeonCore(address _dungeonCore) external",
    "function owner() view returns (address)"
  ]
};

async function setupAllConnections() {
  console.log('🔧 設置所有合約的 DungeonCore 連接\n');

  if (!PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  console.log(`🏰 DungeonCore 地址: ${CONTRACTS.DUNGEONCORE}\n`);

  const contractsToSetup = [
    { 
      name: 'Party', 
      address: CONTRACTS.PARTY, 
      abi: ABIS.Party,
      getterMethod: 'dungeonCoreContract'
    },
    { 
      name: 'PlayerProfile', 
      address: CONTRACTS.PLAYER_PROFILE, 
      abi: ABIS.PlayerProfile,
      getterMethod: 'dungeonCore'
    },
    { 
      name: 'VIPStaking', 
      address: CONTRACTS.VIP_STAKING, 
      abi: ABIS.VIPStaking,
      getterMethod: 'dungeonCore'
    },
    { 
      name: 'AltarOfAscension', 
      address: CONTRACTS.ALTAR_OF_ASCENSION, 
      abi: ABIS.AltarOfAscension,
      getterMethod: 'dungeonCore'
    }
  ];

  for (const contractInfo of contractsToSetup) {
    console.log(`\n📦 處理 ${contractInfo.name} 合約...`);
    console.log(`   地址: ${contractInfo.address}`);

    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
      
      // 檢查 owner
      const owner = await contract.owner();
      console.log(`   Owner: ${owner}`);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`   ❌ 錯誤: 您不是 ${contractInfo.name} 的 owner`);
        console.log(`   跳過此合約...`);
        continue;
      }

      // 檢查當前的 DungeonCore 設置
      const currentDungeonCore = await contract[contractInfo.getterMethod]();
      console.log(`   當前 DungeonCore: ${currentDungeonCore}`);

      if (currentDungeonCore === ethers.ZeroAddress || 
          currentDungeonCore.toLowerCase() !== CONTRACTS.DUNGEONCORE.toLowerCase()) {
        
        console.log(`   ⚠️  需要更新 DungeonCore 連接`);
        console.log(`   📤 發送交易...`);
        
        const tx = await contract.setDungeonCore(CONTRACTS.DUNGEONCORE);
        console.log(`   交易哈希: ${tx.hash}`);
        console.log(`   ⏳ 等待確認...`);
        
        await tx.wait();
        console.log(`   ✅ ${contractInfo.name} DungeonCore 連接設置成功！`);
        
        // 驗證設置
        const newDungeonCore = await contract[contractInfo.getterMethod]();
        console.log(`   驗證新設置: ${newDungeonCore}`);
        
      } else {
        console.log(`   ✅ ${contractInfo.name} DungeonCore 連接已正確設置`);
      }
      
    } catch (error) {
      console.error(`\n   ❌ ${contractInfo.name} 處理失敗:`, error.message);
      
      if (error.message.includes('execution reverted')) {
        console.log(`   可能的原因:`);
        console.log(`   1. 您不是合約的 owner`);
        console.log(`   2. 合約被暫停（paused）`);
        console.log(`   3. 合約沒有 setDungeonCore 方法`);
      }
    }
  }

  console.log('\n📊 設置總結:');
  console.log('='.repeat(50));
  
  // 再次檢查所有合約的最終狀態
  for (const contractInfo of contractsToSetup) {
    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, provider);
      const currentDungeonCore = await contract[contractInfo.getterMethod]();
      const isCorrect = currentDungeonCore.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase();
      const status = isCorrect ? '✅' : '❌';
      console.log(`${status} ${contractInfo.name}: ${currentDungeonCore}`);
    } catch (error) {
      console.log(`❌ ${contractInfo.name}: 無法讀取狀態`);
    }
  }
  
  console.log('='.repeat(50));
  console.log('\n🎉 DungeonCore 連接設置流程完成！');
}

setupAllConnections().catch(console.error);
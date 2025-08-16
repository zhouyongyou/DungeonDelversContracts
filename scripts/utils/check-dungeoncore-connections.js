#!/usr/bin/env node

// 檢查所有合約的 DungeonCore 連接狀態

const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 最新合約地址
const CONTRACTS = {
  DUNGEONCORE: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  DUNGEONMASTER: '0xd13250E0F0766006816d7AfE95EaEEc5e215d082',
  PARTY: '0x514AFBb114fa6c77CC025720A31aaeE038fBbcd7',
  PLAYER_PROFILE: '0x5d4582266654CBEA6cC6Bdf696B68B8473521b63',
  VIP_STAKING: '0x9c2fdD1c692116aB5209983e467286844B3b9921',
  ALTAR_OF_ASCENSION: '0xbA76D9E0063280d4B0F6e139B5dD45A47BBD1e4e',
  PLAYER_VAULT: '0x34d94193aa59f8a7E34040Ed4F0Ea5B231811388',
  HERO: '0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2',
  RELIC: '0xaEa78C3FC4bc50966aC41D76331fD0bf219D00ac'
};

// ABI 定義
const ABIS = {
  DungeonMaster: [
    "function dungeonCore() view returns (address)"
  ],
  Party: [
    "function dungeonCoreContract() view returns (address)"
  ],
  PlayerProfile: [
    "function dungeonCore() view returns (address)"
  ],
  VIPStaking: [
    "function dungeonCore() view returns (address)"
  ],
  AltarOfAscension: [
    "function dungeonCore() view returns (address)"
  ],
  PlayerVault: [
    "function dungeonCore() view returns (address)"
  ],
  Hero: [
    "function dungeonCore() view returns (address)"
  ],
  Relic: [
    "function dungeonCore() view returns (address)"
  ]
};

async function checkConnections() {
  console.log('🔍 檢查所有合約的 DungeonCore 連接狀態\n');
  console.log(`📅 檢查時間: ${new Date().toLocaleString()}`);
  console.log(`🏰 預期的 DungeonCore 地址: ${CONTRACTS.DUNGEONCORE}\n`);
  console.log('='.repeat(70));

  const provider = new ethers.JsonRpcProvider(BSC_RPC);

  const contractsToCheck = [
    { name: 'DungeonMaster', address: CONTRACTS.DUNGEONMASTER, abi: ABIS.DungeonMaster, getterMethod: 'dungeonCore' },
    { name: 'Party', address: CONTRACTS.PARTY, abi: ABIS.Party, getterMethod: 'dungeonCoreContract' },
    { name: 'PlayerProfile', address: CONTRACTS.PLAYER_PROFILE, abi: ABIS.PlayerProfile, getterMethod: 'dungeonCore' },
    { name: 'VIPStaking', address: CONTRACTS.VIP_STAKING, abi: ABIS.VIPStaking, getterMethod: 'dungeonCore' },
    { name: 'AltarOfAscension', address: CONTRACTS.ALTAR_OF_ASCENSION, abi: ABIS.AltarOfAscension, getterMethod: 'dungeonCore' },
    { name: 'PlayerVault', address: CONTRACTS.PLAYER_VAULT, abi: ABIS.PlayerVault, getterMethod: 'dungeonCore' },
    { name: 'Hero', address: CONTRACTS.HERO, abi: ABIS.Hero, getterMethod: 'dungeonCore' },
    { name: 'Relic', address: CONTRACTS.RELIC, abi: ABIS.Relic, getterMethod: 'dungeonCore' }
  ];

  let correctCount = 0;
  let incorrectCount = 0;
  let errorCount = 0;
  const results = [];

  for (const contractInfo of contractsToCheck) {
    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, provider);
      const currentDungeonCore = await contract[contractInfo.getterMethod]();
      
      const isCorrect = currentDungeonCore.toLowerCase() === CONTRACTS.DUNGEONCORE.toLowerCase();
      const isZeroAddress = currentDungeonCore === ethers.ZeroAddress;
      
      let status, emoji;
      if (isCorrect) {
        status = '正確';
        emoji = '✅';
        correctCount++;
      } else if (isZeroAddress) {
        status = '未設置';
        emoji = '⚠️';
        incorrectCount++;
      } else {
        status = '錯誤';
        emoji = '❌';
        incorrectCount++;
      }

      results.push({
        name: contractInfo.name,
        address: contractInfo.address,
        currentDungeonCore,
        status,
        emoji
      });

      console.log(`${emoji} ${contractInfo.name.padEnd(20)} | ${currentDungeonCore} | ${status}`);
      
    } catch (error) {
      errorCount++;
      results.push({
        name: contractInfo.name,
        address: contractInfo.address,
        currentDungeonCore: 'N/A',
        status: '錯誤',
        emoji: '💥'
      });
      
      console.log(`💥 ${contractInfo.name.padEnd(20)} | 讀取失敗: ${error.message}`);
    }
  }

  console.log('='.repeat(70));
  console.log('\n📊 檢查總結:');
  console.log(`   ✅ 正確設置: ${correctCount} 個`);
  console.log(`   ❌ 需要修正: ${incorrectCount} 個`);
  console.log(`   💥  讀取錯誤: ${errorCount} 個`);
  console.log(`   📦 總計檢查: ${contractsToCheck.length} 個合約`);

  // 列出需要修正的合約
  const needsFixing = results.filter(r => r.status !== '正確' && r.status !== '錯誤');
  if (needsFixing.length > 0) {
    console.log('\n⚠️  需要設置 DungeonCore 的合約:');
    needsFixing.forEach(contract => {
      console.log(`   - ${contract.name} (${contract.address})`);
      console.log(`     當前值: ${contract.currentDungeonCore}`);
    });
    
    console.log('\n💡 修復建議:');
    console.log('   執行: npx hardhat run scripts/setup-all-dungeoncore-connections.js --network bsc');
  } else if (incorrectCount === 0 && errorCount === 0) {
    console.log('\n🎉 太好了！所有合約的 DungeonCore 連接都已正確設置！');
  }

  // 額外檢查：DungeonCore 中註冊的合約地址
  console.log('\n🔄 檢查 DungeonCore 中註冊的合約地址...');
  try {
    const dungeonCoreABI = [
      "function dungeonMasterAddress() view returns (address)",
      "function playerVaultAddress() view returns (address)",
      "function playerProfileAddress() view returns (address)",
      "function vipStakingAddress() view returns (address)",
      "function heroContractAddress() view returns (address)",
      "function relicContractAddress() view returns (address)",
      "function partyContractAddress() view returns (address)",
      "function altarOfAscensionAddress() view returns (address)"
    ];
    
    const dungeonCore = new ethers.Contract(CONTRACTS.DUNGEONCORE, dungeonCoreABI, provider);
    
    const registrations = [
      { name: 'DungeonMaster', getter: 'dungeonMasterAddress', expected: CONTRACTS.DUNGEONMASTER },
      { name: 'PlayerVault', getter: 'playerVaultAddress', expected: CONTRACTS.PLAYER_VAULT },
      { name: 'PlayerProfile', getter: 'playerProfileAddress', expected: CONTRACTS.PLAYER_PROFILE },
      { name: 'VIPStaking', getter: 'vipStakingAddress', expected: CONTRACTS.VIP_STAKING },
      { name: 'Hero', getter: 'heroContractAddress', expected: CONTRACTS.HERO },
      { name: 'Relic', getter: 'relicContractAddress', expected: CONTRACTS.RELIC },
      { name: 'Party', getter: 'partyContractAddress', expected: CONTRACTS.PARTY },
      { name: 'AltarOfAscension', getter: 'altarOfAscensionAddress', expected: CONTRACTS.ALTAR_OF_ASCENSION }
    ];

    console.log('');
    for (const reg of registrations) {
      try {
        const registered = await dungeonCore[reg.getter]();
        const isCorrect = registered.toLowerCase() === reg.expected.toLowerCase();
        const emoji = isCorrect ? '✅' : '❌';
        console.log(`${emoji} DungeonCore.${reg.getter}(): ${registered}`);
      } catch (e) {
        console.log(`💥 DungeonCore.${reg.getter}(): 讀取失敗`);
      }
    }
    
  } catch (error) {
    console.log('❌ 無法檢查 DungeonCore 註冊狀態:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('檢查完成！\n');
}

checkConnections().catch(console.error);
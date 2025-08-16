const { ethers } = require('ethers');
require('dotenv').config();

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const contracts = {
  Party: '0x096aa1e0F9c87E57e8b69a7DD35D893D13BbA8F5',
  PlayerProfile: '0xc5A972b7186562f768c8Ac97d3B4Ca15a019657d',
  VIPStaking: '0x43F03C89AF6091090bE05c00A65Cc4934Cf5f90D',
  AltarOfAscension: '0xFaEDa7886cc9dF32A96EBc7DAf4da1A27d3FB3de'
};

// 預期的 DungeonCore
const EXPECTED_DUNGEONCORE = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';

// ABI
const PARTY_ABI = ["function dungeonCoreContract() view returns (address)"];
const OTHER_ABI = ["function dungeonCore() view returns (address)"];

async function checkConnections() {
  console.log('🔍 檢查所有合約的 DungeonCore 連接\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  // 檢查 Party 合約
  console.log('📦 檢查 Party 合約...');
  try {
    const party = new ethers.Contract(contracts.Party, PARTY_ABI, provider);
    const dungeonCore = await party.dungeonCoreContract();
    console.log(`  地址: ${contracts.Party}`);
    console.log(`  DungeonCore: ${dungeonCore}`);
    console.log(`  狀態: ${dungeonCore === EXPECTED_DUNGEONCORE ? '✅ 正確' : '❌ 錯誤'}`);
  } catch (error) {
    console.log(`  ❌ 錯誤: ${error.message}`);
  }
  
  // 檢查其他合約
  for (const [name, address] of Object.entries(contracts)) {
    if (name === 'Party') continue;
    
    console.log(`\n📦 檢查 ${name} 合約...`);
    try {
      const contract = new ethers.Contract(address, OTHER_ABI, provider);
      const dungeonCore = await contract.dungeonCore();
      console.log(`  地址: ${address}`);
      console.log(`  DungeonCore: ${dungeonCore}`);
      console.log(`  狀態: ${dungeonCore === EXPECTED_DUNGEONCORE ? '✅ 正確' : '❌ 錯誤'}`);
    } catch (error) {
      console.log(`  ❌ 錯誤: ${error.message}`);
    }
  }
  
  console.log('\n📊 總結：');
  console.log(`預期的 DungeonCore: ${EXPECTED_DUNGEONCORE}`);
}

checkConnections().catch(console.error);
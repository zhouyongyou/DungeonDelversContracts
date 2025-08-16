const { ethers } = require('ethers');

const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const DUNGEONCORE_ADDRESS = '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9';

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  "function partyContractAddress() view returns (address)",
  "function playerProfileAddress() view returns (address)",
  "function vipStakingAddress() view returns (address)",
  "function altarOfAscensionAddress() view returns (address)",
  "function heroContractAddress() view returns (address)",
  "function relicContractAddress() view returns (address)",
  "function playerVaultAddress() view returns (address)",
  "function dungeonMasterAddress() view returns (address)",
  "function oracleAddress() view returns (address)",
  "function soulShardTokenAddress() view returns (address)",
  "function usdTokenAddress() view returns (address)"
];

async function getAddressesFromDungeonCore() {
  console.log('🔍 從 DungeonCore 獲取註冊的合約地址\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, provider);
  
  console.log(`📋 DungeonCore 地址: ${DUNGEONCORE_ADDRESS}\n`);
  
  const contracts = [
    { name: 'Party', getter: 'partyContractAddress' },
    { name: 'PlayerProfile', getter: 'playerProfileAddress' },
    { name: 'VIPStaking', getter: 'vipStakingAddress' },
    { name: 'AltarOfAscension', getter: 'altarOfAscensionAddress' },
    { name: 'Hero', getter: 'heroContractAddress' },
    { name: 'Relic', getter: 'relicContractAddress' },
    { name: 'PlayerVault', getter: 'playerVaultAddress' },
    { name: 'DungeonMaster', getter: 'dungeonMasterAddress' },
    { name: 'Oracle', getter: 'oracleAddress' },
    { name: 'SoulShard', getter: 'soulShardTokenAddress' },
    { name: 'USD', getter: 'usdTokenAddress' }
  ];
  
  const addresses = {};
  
  for (const contract of contracts) {
    try {
      const address = await dungeonCore[contract.getter]();
      addresses[contract.name] = address;
      
      // 檢查地址是否有合約
      const code = await provider.getCode(address);
      const hasContract = code !== '0x';
      
      console.log(`${contract.name}:`);
      console.log(`  地址: ${address}`);
      console.log(`  狀態: ${hasContract ? '✅ 有合約' : '❌ 無合約'}`);
      console.log('');
    } catch (e) {
      console.log(`${contract.name}: ❌ 讀取失敗`);
      console.log('');
    }
  }
  
  console.log('\n📊 正確的配置應該是：');
  console.log(JSON.stringify(addresses, null, 2));
}

getAddressesFromDungeonCore().catch(console.error);
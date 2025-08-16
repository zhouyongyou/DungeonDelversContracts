const { ethers } = require('ethers');

const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 所有需要檢查的合約地址
const contracts = {
  Party: '0x096aa1e0F9c87E57e8b69a7DD35D893D13BbA8F5',
  PlayerProfile: '0xc5A972b7186562f768c8Ac97d3B4Ca15a019657d',
  VIPStaking: '0x43F03C89AF6091090bE05c00A65Cc4934Cf5f90D',
  AltarOfAscension: '0xFaEDa7886cc9dF32A96EBc7DAf4da1A27d3FB3de',
  DungeonCore: '0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9',
  DungeonMaster: '0xd13250E0F0766006816d7AfE95EaEEc5e215d082',
  DungeonStorage: '0x2fcd1bbbB88cce8040A2DE92E97d5375d8B088da'
};

async function checkContracts() {
  console.log('🔍 檢查合約是否存在於鏈上\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  for (const [name, address] of Object.entries(contracts)) {
    const code = await provider.getCode(address);
    const hasContract = code !== '0x';
    
    console.log(`${name}:`);
    console.log(`  地址: ${address}`);
    console.log(`  狀態: ${hasContract ? '✅ 有合約' : '❌ 無合約'}`);
    
    if (hasContract) {
      console.log(`  代碼長度: ${code.length} bytes`);
    }
    console.log('');
  }
}

checkContracts().catch(console.error);
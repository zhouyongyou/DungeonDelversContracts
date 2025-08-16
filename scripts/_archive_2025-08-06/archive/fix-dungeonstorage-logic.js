const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONSTORAGE_ADDRESS = '0x2fcd1bbbB88cce8040A2DE92E97d5375d8B088da';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonStorage 完整 ABI
const DUNGEONSTORAGE_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "initialOwner", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "logicContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_logicContract", "type": "address"}],
    "name": "setLogicContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function fixDungeonStorageLogic() {
  console.log('🔧 修復 DungeonStorage 邏輯合約設置\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  console.log(`📦 DungeonStorage 地址: ${DUNGEONSTORAGE_ADDRESS}`);
  console.log(`🎯 目標 DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
  
  try {
    // 先檢查合約是否存在
    const code = await provider.getCode(DUNGEONSTORAGE_ADDRESS);
    if (code === '0x') {
      console.log('\n❌ DungeonStorage 地址上沒有合約！');
      return;
    }
    console.log('\n✅ 找到 DungeonStorage 合約');
    
    const dungeonStorage = new ethers.Contract(
      DUNGEONSTORAGE_ADDRESS,
      DUNGEONSTORAGE_ABI,
      signer
    );
    
    // 嘗試讀取 owner
    console.log('\n📊 讀取合約狀態...');
    try {
      const owner = await dungeonStorage.owner();
      console.log(`👤 Owner: ${owner}`);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log('❌ 您不是 owner，無法設置 logicContract');
        return;
      }
    } catch (e) {
      console.log('❌ 無法讀取 owner，可能合約結構不同');
    }
    
    // 嘗試讀取當前 logicContract
    try {
      const currentLogic = await dungeonStorage.logicContract();
      console.log(`📋 當前 logicContract: ${currentLogic}`);
      
      if (currentLogic.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase()) {
        console.log('\n✅ logicContract 已正確設置！');
        return;
      }
    } catch (e) {
      console.log('❌ 無法讀取 logicContract');
    }
    
    // 設置 logicContract
    console.log('\n📤 設置 logicContract...');
    try {
      const tx = await dungeonStorage.setLogicContract(DUNGEONMASTER_ADDRESS);
      console.log(`交易哈希: ${tx.hash}`);
      console.log('⏳ 等待確認...');
      await tx.wait();
      console.log('✅ 設置成功！');
      
      // 驗證
      const newLogic = await dungeonStorage.logicContract();
      console.log(`\n驗證新設置: ${newLogic}`);
    } catch (e) {
      console.log('❌ 設置失敗:', e.message);
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

fixDungeonStorageLogic().catch(console.error);
const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = 'https://bsc-dataseed.binance.org/';

// 合約地址
const DUNGEONSTORAGE_ADDRESS = '0x2fcd1bbbB88cce8040A2DE92E97d5375d8B088da';
const DUNGEONMASTER_ADDRESS = '0xd13250E0F0766006816d7AfE95EaEEc5e215d082';

// DungeonStorage ABI
const DUNGEONSTORAGE_ABI = [
  "function logicContract() view returns (address)",
  "function setLogicContract(address _logicContract) external",
  "function owner() view returns (address)",
  "function getDungeon(uint256 _dungeonId) view returns (tuple(uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized))"
];

async function checkAndSetLogic() {
  console.log('🔍 檢查 DungeonStorage 邏輯合約設置\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`📝 操作者地址: ${signer.address}`);
  
  const dungeonStorage = new ethers.Contract(
    DUNGEONSTORAGE_ADDRESS,
    DUNGEONSTORAGE_ABI,
    signer
  );
  
  try {
    // 檢查 owner
    const owner = await dungeonStorage.owner();
    console.log(`📋 DungeonStorage Owner: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log('❌ 錯誤: 您不是 DungeonStorage 的 owner');
      return;
    }
    
    // 檢查當前邏輯合約
    const currentLogic = await dungeonStorage.logicContract();
    console.log(`\n📊 當前邏輯合約: ${currentLogic}`);
    console.log(`🎯 目標 DungeonMaster: ${DUNGEONMASTER_ADDRESS}`);
    
    if (currentLogic.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase()) {
      console.log('\n✅ 邏輯合約已正確設置！');
      
      // 檢查地城狀態
      console.log('\n📊 檢查地城狀態：');
      for (let i = 1; i <= 10; i++) {
        try {
          const dungeon = await dungeonStorage.getDungeon(i);
          console.log(`地城 #${i}: ${dungeon.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
          if (dungeon.isInitialized) {
            console.log(`  戰力: ${dungeon.requiredPower}, 獎勵: $${ethers.formatEther(dungeon.rewardAmountUSD)}`);
          }
        } catch (e) {
          console.log(`地城 #${i}: ❌ 讀取失敗`);
        }
      }
      
      return;
    }
    
    // 設置邏輯合約
    console.log('\n📤 設置邏輯合約...');
    const tx = await dungeonStorage.setLogicContract(DUNGEONMASTER_ADDRESS);
    console.log(`交易哈希: ${tx.hash}`);
    console.log('⏳ 等待確認...');
    await tx.wait();
    
    // 驗證設置
    const newLogic = await dungeonStorage.logicContract();
    console.log(`\n✅ 邏輯合約更新成功: ${newLogic}`);
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

checkAndSetLogic().catch(console.error);
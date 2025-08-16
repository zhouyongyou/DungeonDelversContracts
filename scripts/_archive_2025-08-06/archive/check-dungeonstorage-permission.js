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
  "function owner() view returns (address)"
];

async function checkAndSetPermissions() {
  console.log('🔍 檢查 DungeonStorage 權限設置\n');

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
    console.log(`🎯 目標邏輯合約: ${DUNGEONMASTER_ADDRESS}`);
    
    if (currentLogic.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase()) {
      console.log('\n✅ 邏輯合約已正確設置！');
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

checkAndSetPermissions().catch(console.error);
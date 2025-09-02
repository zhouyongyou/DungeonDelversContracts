#!/usr/bin/env node

/**
 * 檢查 V25 VRF Manager 授權狀態
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('🔐 檢查 V25 VRF Manager 授權狀態');
  console.log('==================================\n');

  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請在 .env 文件中設置 PRIVATE_KEY');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  
  // V25 合約地址
  const contracts = {
    VRFMANAGER: '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1',
    HERO: '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
    RELIC: '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
    DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    ALTAROFASCENSION: '0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1'
  };
  
  const vrfABI = [
    'function isAuthorized(address) view returns (bool)',
    'function authorizeContract(address) external',
    'function owner() view returns (address)',
    'function getRandomForUser(address) view returns (bool, uint256[])'
  ];
  
  const vrfManager = new ethers.Contract(contracts.VRFMANAGER, vrfABI, signer);
  
  console.log(`📋 VRF Manager: ${contracts.VRFMANAGER}`);
  console.log(`🔑 執行者: ${signer.address}`);
  
  try {
    const owner = await vrfManager.owner();
    console.log(`👑 VRF Manager Owner: ${owner}`);
    console.log(`🔗 是否為 Owner: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}\n`);
    
    // 檢查授權狀態
    console.log('📊 合約授權狀態：');
    console.log('─────────────────────────────────');
    
    for (const [name, address] of Object.entries(contracts)) {
      if (name === 'VRFMANAGER') continue;
      
      try {
        const isAuth = await vrfManager.isAuthorized(address);
        console.log(`${name.padEnd(15)}: ${isAuth ? '✅ 已授權' : '❌ 未授權'} (${address})`);
        
        // 如果未授權且我們是 owner，則進行授權
        if (!isAuth && owner.toLowerCase() === signer.address.toLowerCase()) {
          console.log(`   🔧 正在授權 ${name}...`);
          const tx = await vrfManager.authorizeContract(address);
          await tx.wait();
          console.log(`   ✅ ${name} 授權完成`);
        }
      } catch (error) {
        console.log(`${name.padEnd(15)}: ❌ 檢查失敗: ${error.message}`);
      }
    }
    
    console.log('\n🎲 檢查 VRF 功能：');
    console.log('─────────────────────────────────');
    
    // 檢查一個測試用戶的 VRF 狀態
    const testUser = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
    try {
      const [fulfilled, randomWords] = await vrfManager.getRandomForUser(testUser);
      console.log(`測試用戶 VRF 狀態: ${fulfilled ? '已完成' : '未請求或未完成'}`);
      console.log(`隨機數數量: ${randomWords.length}`);
    } catch (error) {
      console.log(`VRF 狀態檢查失敗: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('腳本執行失敗:', error);
    process.exit(1);
  });
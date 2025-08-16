#!/usr/bin/env node

// 驗證 DungeonMaster 合約部署

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

async function verifyDungeonMasterDeployment() {
  console.log('🔍 驗證 DungeonMaster 部署狀態...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const dmAddress = v22Config.contracts.DUNGEONMASTER.address;
  console.log(`DungeonMaster 地址: ${dmAddress}`);
  
  // 1. 檢查合約是否存在
  console.log('\n📋 檢查合約存在性...');
  const code = await provider.getCode(dmAddress);
  
  if (code === '0x') {
    console.log('❌ 錯誤: 該地址沒有部署合約！');
    return;
  }
  
  console.log(`✅ 合約存在，字節碼長度: ${code.length} 字符`);
  
  // 2. 嘗試獲取函數選擇器
  console.log('\n📋 嘗試解析函數選擇器...');
  
  // 常見的函數選擇器
  const functionSelectors = {
    'exploreDungeon(uint256,uint256)': '0x33d37373',
    'requestExpedition(uint256,uint256)': '0xc143c4a8',
    'buyProvisions(uint256,uint256)': '0x89907e7f',
    'getCooldownStatus(address)': '0xc4c53a42',
    'getPartyStatus(uint256)': '0x7fa23093',
    'owner()': '0x8da5cb5b',
    'paused()': '0x5c975abb'
  };
  
  // 3. 檢查特定函數是否存在
  console.log('\n📋 檢查函數實現...');
  
  // 檢查 owner 函數
  try {
    const ownerData = await provider.call({
      to: dmAddress,
      data: '0x8da5cb5b' // owner()
    });
    console.log(`✅ owner() 返回: ${ethers.getAddress('0x' + ownerData.slice(26))}`);
  } catch (error) {
    console.log('❌ owner() 調用失敗');
  }
  
  // 檢查 paused 函數
  try {
    const pausedData = await provider.call({
      to: dmAddress,
      data: '0x5c975abb' // paused()
    });
    const isPaused = pausedData === '0x0000000000000000000000000000000000000000000000000000000000000001';
    console.log(`✅ paused() 返回: ${isPaused}`);
  } catch (error) {
    console.log('❌ paused() 調用失敗');
  }
  
  // 檢查 requestExpedition 是否可調用
  console.log('\n📋 測試 requestExpedition 函數簽名...');
  try {
    // 構造調用數據：requestExpedition(1, 1)
    const callData = '0xc143c4a8' + 
      '0000000000000000000000000000000000000000000000000000000000000001' +
      '0000000000000000000000000000000000000000000000000000000000000001';
    
    await provider.call({
      to: dmAddress,
      data: callData,
      from: '0x10925A7138649C7E1794CE646182eeb5BF8ba647',
      value: ethers.parseEther('0.01')
    });
    console.log('✅ 函數簽名正確（但執行失敗是正常的）');
  } catch (error) {
    if (error.data === '0x') {
      console.log('❌ 函數不存在或簽名錯誤！');
    } else {
      console.log('⚠️ 函數存在但執行失敗:', error.message.substring(0, 50) + '...');
    }
  }
  
  // 4. 分析可能的問題
  console.log('\n📊 診斷結果：');
  console.log('可能的問題：');
  console.log('1. 合約部署時使用了錯誤的源碼');
  console.log('2. 合約版本不匹配（可能部署了舊版本）');
  console.log('3. 函數簽名發生了變化');
  console.log('\n建議：');
  console.log('1. 檢查部署記錄，確認部署的合約版本');
  console.log('2. 比對合約字節碼與預期版本');
  console.log('3. 考慮重新部署 DungeonMaster 合約');
}

// 執行驗證
if (require.main === module) {
  verifyDungeonMasterDeployment().catch(console.error);
}

module.exports = { verifyDungeonMasterDeployment };
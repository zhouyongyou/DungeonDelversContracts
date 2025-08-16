#!/usr/bin/env node

// 檢查 Oracle 合約的字節碼和狀態

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function inspectOracle() {
  console.log('🔍 檢查 Oracle 合約詳細信息...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const oracleAddress = v22Config.contracts.ORACLE.address;
  
  console.log(`🔮 Oracle 地址: ${oracleAddress}\n`);

  try {
    // 1. 獲取合約字節碼
    console.log('📄 合約字節碼檢查：');
    const code = await provider.getCode(oracleAddress);
    console.log(`   字節碼長度: ${code.length - 2} 字節`);
    console.log(`   字節碼前綴: ${code.substring(0, 42)}...`);
    console.log(`   字節碼後綴: ...${code.substring(code.length - 40)}`);
    
    if (code === '0x') {
      console.log('   ❌ 沒有合約字節碼！這不是一個有效的合約');
      return;
    }

    // 2. 檢查合約存儲
    console.log('\n💾 合約存儲檢查：');
    
    // 檢查存儲槽 0 (通常是初始化標誌或擁有者)
    const slot0 = await provider.getStorage(oracleAddress, 0);
    console.log(`   存儲槽 0: ${slot0}`);
    
    // 檢查存儲槽 1
    const slot1 = await provider.getStorage(oracleAddress, 1);
    console.log(`   存儲槽 1: ${slot1}`);
    
    // 檢查存儲槽 2
    const slot2 = await provider.getStorage(oracleAddress, 2);
    console.log(`   存儲槽 2: ${slot2}`);

    // 3. 嘗試調用最基本的函數
    console.log('\n🔧 基本函數測試：');
    
    // 嘗試調用 owner() - 這是 Ownable 的基本函數
    try {
      const ownerCalldata = '0x8da5cb5b'; // owner() 函數選擇器
      const result = await provider.call({
        to: oracleAddress,
        data: ownerCalldata
      });
      console.log(`   owner() 調用結果: ${result}`);
      
      if (result !== '0x') {
        const ownerAddress = ethers.getAddress('0x' + result.slice(-40));
        console.log(`   ✅ 擁有者地址: ${ownerAddress}`);
      }
    } catch (error) {
      console.log(`   ❌ owner() 調用失敗: ${error.message}`);
    }

    // 4. 檢查交易歷史
    console.log('\n📊 部署信息檢查：');
    
    // 獲取最近的幾個區塊來查找部署交易
    const currentBlock = await provider.getBlockNumber();
    console.log(`   當前區塊: ${currentBlock}`);
    
    // 嘗試查找創建此合約的交易
    for (let i = 0; i < 5; i++) {
      const blockNumber = currentBlock - i;
      try {
        const block = await provider.getBlock(blockNumber);
        if (block && block.transactions) {
          for (const txHash of block.transactions) {
            const tx = await provider.getTransaction(txHash);
            if (tx && tx.to === null && tx.creates && tx.creates.toLowerCase() === oracleAddress.toLowerCase()) {
              console.log(`   ✅ 發現部署交易: ${txHash}`);
              console.log(`   部署區塊: ${blockNumber}`);
              console.log(`   部署者: ${tx.from}`);
              break;
            }
          }
        }
      } catch (e) {
        // 忽略區塊查詢錯誤
      }
    }

    // 5. 嘗試使用不同的 ABI
    console.log('\n🧪 ABI 兼容性測試：');
    
    const testABIs = [
      // 基本 Ownable
      ['function owner() public view returns (address)'],
      // 基本 Oracle 函數
      ['function getUsdToSoulTWAP() external view returns (uint256)'],
      // 初始化函數
      ['function initialize(address, address) external'],
      // 簡單的視圖函數
      ['function initialized() external view returns (bool)']
    ];

    for (const [index, abi] of testABIs.entries()) {
      try {
        const contract = new ethers.Contract(oracleAddress, abi, provider);
        const functionName = abi[0].split('(')[0].split(' ').pop();
        
        if (functionName === 'owner') {
          const result = await contract.owner();
          console.log(`   ✅ ABI ${index + 1} (${functionName}): ${result}`);
        } else if (functionName === 'initialized') {
          const result = await contract.initialized();
          console.log(`   ✅ ABI ${index + 1} (${functionName}): ${result}`);
        } else {
          console.log(`   ⏭️ ABI ${index + 1} (${functionName}): 跳過測試`);
        }
      } catch (error) {
        console.log(`   ❌ ABI ${index + 1}: ${error.message.substring(0, 80)}...`);
      }
    }

    // 6. 生成建議
    console.log('\n💡 診斷建議：');
    
    if (code.length > 100) {
      console.log('✅ 合約確實存在');
      console.log('❌ 但所有函數調用都失敗');
      console.log('\n可能的原因：');
      console.log('1. 🔧 合約構造函數拋出異常，導致合約處於無效狀態');
      console.log('2. 📝 ABI 與實際部署的合約不匹配');
      console.log('3. 🐛 合約代碼有 bug，導致所有外部調用失敗');
      console.log('4. 🔐 合約有特殊的權限檢查或初始化要求');
      
      console.log('\n🚀 建議解決方案：');
      console.log('1. 重新部署一個新的 Oracle 合約');
      console.log('2. 檢查原始合約源碼和構造函數參數');
      console.log('3. 使用 BSCScan 查看合約的驗證狀態');
      console.log('4. 查看部署交易的執行結果');
    } else {
      console.log('❌ 沒有有效的合約字節碼');
      console.log('🚀 建議：部署新的 Oracle 合約');
    }

  } catch (error) {
    console.error('\n❌ 檢查過程中發生錯誤:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  inspectOracle().catch(console.error);
}

module.exports = { inspectOracle };
#!/usr/bin/env node

// V22 Oracle 初始化腳本

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// Oracle ABI
const ORACLE_ABI = [
  'function initialize(address _factory, address _soulShard) external',
  'function initialized() external view returns (bool)',
  'function soulShardToken() external view returns (address)',
  'function factory() external view returns (address)',
  'function owner() external view returns (address)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function emergencySetRate(uint256 _rate) external',
  'function setAdaptivePeriods(uint256[] memory _periods) external'
];

async function initializeOracle() {
  console.log('🔮 V22 Oracle 初始化...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🔮 Oracle 地址: ${v22Config.contracts.ORACLE.address}\n`);
  
  const oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, ORACLE_ABI, deployer);

  try {
    // 1. 檢查當前狀態
    console.log('📊 檢查 Oracle 當前狀態：');
    
    let isInitialized = false;
    try {
      isInitialized = await oracle.initialized();
      console.log(`   已初始化: ${isInitialized ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   無法讀取初始化狀態: ${error.message}`);
    }

    let owner = '';
    try {
      owner = await oracle.owner();
      console.log(`   擁有者: ${owner}`);
      console.log(`   你是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   無法讀取擁有者: ${error.message}`);
    }

    // 2. 如果未初始化，進行初始化
    if (!isInitialized) {
      console.log('\n🔧 開始初始化 Oracle...');
      
      // PancakeSwap V2 Factory 地址
      const factoryAddress = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
      const soulShardAddress = v22Config.contracts.SOULSHARD.address;
      
      console.log(`   Factory: ${factoryAddress}`);
      console.log(`   SoulShard: ${soulShardAddress}`);
      
      try {
        const tx = await oracle.initialize(factoryAddress, soulShardAddress);
        console.log(`   交易哈希: ${tx.hash}`);
        console.log('   等待確認...');
        
        const receipt = await tx.wait();
        console.log(`   ✅ 初始化成功！區塊: ${receipt.blockNumber}`);
        
        // 等待一些時間讓狀態更新
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log(`   ❌ 初始化失敗: ${error.message}`);
        
        if (error.message.includes('already initialized')) {
          console.log('   ℹ️ Oracle 可能已經初始化');
        } else if (error.message.includes('Ownable: caller is not the owner')) {
          console.log('   ❌ 權限錯誤: 不是合約擁有者');
          return;
        }
      }
    } else {
      console.log('\n✅ Oracle 已經初始化');
    }

    // 3. 驗證初始化結果
    console.log('\n📊 驗證初始化結果：');
    
    try {
      const newInitStatus = await oracle.initialized();
      console.log(`   初始化狀態: ${newInitStatus ? '✅' : '❌'}`);
      
      const soulShardAddr = await oracle.soulShardToken();
      console.log(`   SoulShard Token: ${soulShardAddr}`);
      console.log(`   配置中的 SoulShard: ${v22Config.contracts.SOULSHARD.address}`);
      console.log(`   地址匹配: ${soulShardAddr.toLowerCase() === v22Config.contracts.SOULSHARD.address.toLowerCase() ? '✅' : '❌'}`);
      
      const factoryAddr = await oracle.factory();
      console.log(`   Factory: ${factoryAddr}`);
      
    } catch (error) {
      console.log(`   ❌ 驗證失敗: ${error.message}`);
    }

    // 4. 設置自適應週期（如果需要）
    console.log('\n⚙️ 設置自適應週期：');
    const adaptivePeriods = v22Config.parameters.oracle.adaptivePeriods; // [1800, 900, 300, 60]
    
    try {
      const tx = await oracle.setAdaptivePeriods(adaptivePeriods);
      console.log(`   設置週期: [${adaptivePeriods.join(', ')}] 秒`);
      console.log(`   交易哈希: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ 週期設置成功！區塊: ${receipt.blockNumber}`);
    } catch (error) {
      console.log(`   ⚠️ 週期設置失敗: ${error.message}`);
      
      if (error.message.includes('Ownable: caller is not the owner')) {
        console.log('   ℹ️ 可能週期已經設置或權限不足');
      }
    }

    // 5. 測試價格查詢
    console.log('\n💰 測試價格查詢：');
    try {
      const rate = await oracle.getUsdToSoulTWAP();
      const rateValue = parseFloat(ethers.formatUnits(rate, 18));
      console.log(`   ✅ 1 USD = ${rateValue.toFixed(6)} SOUL`);
      
      if (rateValue > 0 && rateValue < 1e18) {
        console.log('   ✅ 價格看起來合理');
      } else {
        console.log('   ⚠️ 價格可能異常，考慮設置緊急價格');
        
        // 設置緊急價格 (例如 1 USD = 16,500 SOUL)
        const emergencyRate = ethers.parseUnits('16500', 18);
        try {
          const emergencyTx = await oracle.emergencySetRate(emergencyRate);
          console.log(`   設置緊急價格: 1 USD = 16,500 SOUL`);
          console.log(`   交易哈希: ${emergencyTx.hash}`);
          
          const emergencyReceipt = await emergencyTx.wait();
          console.log(`   ✅ 緊急價格設置成功！區塊: ${emergencyReceipt.blockNumber}`);
        } catch (emergencyError) {
          console.log(`   ❌ 緊急價格設置失敗: ${emergencyError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ 價格查詢失敗: ${error.message}`);
      
      if (error.message.includes('no data present')) {
        console.log('   💡 建議: Oracle 可能需要等待交易對數據或設置緊急價格');
        
        // 嘗試設置緊急價格
        try {
          const emergencyRate = ethers.parseUnits('16500', 18); // 1 USD = 16,500 SOUL
          const emergencyTx = await oracle.emergencySetRate(emergencyRate);
          console.log(`   設置緊急價格: 1 USD = 16,500 SOUL`);
          console.log(`   交易哈希: ${emergencyTx.hash}`);
          
          const emergencyReceipt = await emergencyTx.wait();
          console.log(`   ✅ 緊急價格設置成功！區塊: ${emergencyReceipt.blockNumber}`);
          
          // 再次測試
          const newRate = await oracle.getUsdToSoulTWAP();
          const newRateValue = parseFloat(ethers.formatUnits(newRate, 18));
          console.log(`   ✅ 新價格: 1 USD = ${newRateValue.toFixed(6)} SOUL`);
          
        } catch (emergencyError) {
          console.log(`   ❌ 緊急價格設置失敗: ${emergencyError.message}`);
        }
      }
    }

    console.log('\n🎉 Oracle 初始化完成！');
    console.log('💡 建議接下來：');
    console.log('1. 運行診斷腳本確認所有連接正常');
    console.log('2. 測試 Hero 和 Relic 的價格計算');
    console.log('3. 測試地城探索功能');

  } catch (error) {
    console.error('\n❌ 初始化過程中發生錯誤:', error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('\n💡 解決方案：');
      console.log('1. 確認你是 Oracle 合約的擁有者');
      console.log('2. 使用正確的私鑰');
      console.log('3. 如果不是擁有者，聯繫合約部署者');
    }
  }
}

// 執行初始化
if (require.main === module) {
  initializeOracle().catch(console.error);
}

module.exports = { initializeOracle };
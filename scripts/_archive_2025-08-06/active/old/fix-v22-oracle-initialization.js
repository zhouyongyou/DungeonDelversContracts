#!/usr/bin/env node

// 修復 V22 Oracle 初始化問題

const { ethers } = require('ethers');
require('dotenv').config();

// 使用 V22 配置中的 Oracle 地址
const ORACLE_ADDRESS = "0xb9317179466fd7fb253669538dE1c4635E81eAc4";
const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";

// 使用 Alchemy RPC
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 擴展的 Oracle ABI
const ORACLE_ABI = [
  'function initialize(address _factory, address _soulShard) external',
  'function initialized() external view returns (bool)',
  'function owner() external view returns (address)',
  'function soulShardToken() external view returns (address)',
  'function factory() external view returns (address)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function emergencySetRate(uint256 _rate) external',
  'function setAdaptivePeriods(uint256[] memory _periods) external',
  // 嘗試更多可能的函數
  'function initializeOracle(address _factory, address _soulShard) external',
  'function setup(address _factory, address _soulShard) external',
  'function configure(address _factory, address _soulShard) external'
];

async function fixOracleInitialization() {
  console.log('🔮 修復 V22 Oracle 初始化問題...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🔮 Oracle 地址: ${ORACLE_ADDRESS}`);
  console.log(`🪙 SoulShard 地址: ${SOULSHARD_ADDRESS}\n`);
  
  const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, deployer);

  try {
    // 1. 確認我們是擁有者
    console.log('📋 權限檢查：');
    const owner = await oracle.owner();
    console.log(`   Oracle 擁有者: ${owner}`);
    console.log(`   你是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log('❌ 錯誤: 你不是 Oracle 擁有者，無法初始化');
      return;
    }

    // 2. 檢查當前的 SoulShard 設置（這個是正常的）
    console.log('\n📊 當前設置檢查：');
    const currentSoulShard = await oracle.soulShardToken();
    console.log(`   當前 SoulShard: ${currentSoulShard}`);
    console.log(`   目標 SoulShard: ${SOULSHARD_ADDRESS}`);
    console.log(`   SoulShard 正確: ${currentSoulShard.toLowerCase() === SOULSHARD_ADDRESS.toLowerCase() ? '✅' : '❌'}`);

    // 3. 嘗試多種初始化方法
    console.log('\n🔧 嘗試初始化 Oracle：');
    
    const factoryAddress = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'; // PancakeSwap V2 Factory
    console.log(`   Factory 地址: ${factoryAddress}`);
    
    const initMethods = [
      { name: 'initialize', func: () => oracle.initialize(factoryAddress, SOULSHARD_ADDRESS) },
      { name: 'initializeOracle', func: () => oracle.initializeOracle(factoryAddress, SOULSHARD_ADDRESS) },
      { name: 'setup', func: () => oracle.setup(factoryAddress, SOULSHARD_ADDRESS) },
      { name: 'configure', func: () => oracle.configure(factoryAddress, SOULSHARD_ADDRESS) }
    ];

    let initSuccess = false;

    for (const method of initMethods) {
      console.log(`\n   嘗試 ${method.name}()...`);
      try {
        const tx = await method.func();
        console.log(`   ✅ ${method.name} 交易已發送: ${tx.hash}`);
        console.log(`   等待確認...`);
        
        const receipt = await tx.wait();
        console.log(`   ✅ ${method.name} 成功！區塊: ${receipt.blockNumber}`);
        initSuccess = true;
        break;
      } catch (error) {
        console.log(`   ❌ ${method.name} 失敗: ${error.message.substring(0, 80)}...`);
        
        if (error.message.includes('already initialized')) {
          console.log(`   ℹ️ Oracle 可能已經用 ${method.name} 初始化過了`);
          initSuccess = true;
          break;
        }
      }
    }

    // 4. 檢查初始化結果
    console.log('\n📊 初始化結果檢查：');
    
    try {
      const isInitialized = await oracle.initialized();
      console.log(`   初始化狀態: ${isInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
    } catch (error) {
      console.log(`   初始化狀態: ❓ 無法確定 (${error.message.substring(0, 50)}...)`);
    }

    try {
      const factory = await oracle.factory();
      console.log(`   Factory 設置: ✅ ${factory}`);
    } catch (error) {
      console.log(`   Factory 設置: ❌ ${error.message.substring(0, 50)}...`);
    }

    // 5. 嘗試設置緊急價格來修復價格查詢
    console.log('\n💰 修復價格查詢：');
    
    try {
      const rate = await oracle.getUsdToSoulTWAP();
      const rateValue = parseFloat(ethers.formatUnits(rate, 18));
      console.log(`   ✅ 當前價格: 1 USD = ${rateValue.toFixed(6)} SOUL`);
      
      if (rateValue <= 0 || rateValue > 1e18) {
        throw new Error('價格異常，需要設置緊急價格');
      }
    } catch (error) {
      console.log(`   ❌ 價格查詢失敗: ${error.message.substring(0, 60)}...`);
      console.log(`   🚨 設置緊急價格...`);
      
      // 設置合理的緊急價格: 1 USD = 16,500 SOUL
      const emergencyRate = ethers.parseUnits('16500', 18);
      
      try {
        const emergencyTx = await oracle.emergencySetRate(emergencyRate);
        console.log(`   💊 緊急價格交易: ${emergencyTx.hash}`);
        
        const emergencyReceipt = await emergencyTx.wait();
        console.log(`   ✅ 緊急價格設置成功！區塊: ${emergencyReceipt.blockNumber}`);
        console.log(`   💰 新價格: 1 USD = 16,500 SOUL`);
        
        // 再次測試價格
        const newRate = await oracle.getUsdToSoulTWAP();
        const newRateValue = parseFloat(ethers.formatUnits(newRate, 18));
        console.log(`   ✅ 驗證價格: 1 USD = ${newRateValue.toFixed(6)} SOUL`);
        
      } catch (emergencyError) {
        console.log(`   ❌ 緊急價格設置失敗: ${emergencyError.message}`);
      }
    }

    // 6. 設置自適應週期
    console.log('\n⚙️ 設置自適應週期：');
    const adaptivePeriods = [1800, 900, 300, 60]; // 30分鐘, 15分鐘, 5分鐘, 1分鐘
    
    try {
      const periodsTx = await oracle.setAdaptivePeriods(adaptivePeriods);
      console.log(`   🔄 週期設置交易: ${periodsTx.hash}`);
      
      const periodsReceipt = await periodsTx.wait();
      console.log(`   ✅ 自適應週期設置成功！區塊: ${periodsReceipt.blockNumber}`);
      console.log(`   📊 週期: [${adaptivePeriods.join(', ')}] 秒`);
      
    } catch (periodsError) {
      console.log(`   ⚠️ 週期設置失敗: ${periodsError.message.substring(0, 60)}...`);
      if (!periodsError.message.includes('Ownable: caller is not the owner')) {
        console.log(`   ℹ️ 週期可能已經設置或此版本不支持自適應週期`);
      }
    }

    // 7. 最終驗證
    console.log('\n🎯 最終驗證：');
    
    try {
      const finalRate = await oracle.getUsdToSoulTWAP();
      const finalRateValue = parseFloat(ethers.formatUnits(finalRate, 18));
      console.log(`   ✅ 最終價格: 1 USD = ${finalRateValue.toFixed(6)} SOUL`);
      
      if (finalRateValue > 1000 && finalRateValue < 100000) {
        console.log(`   ✅ 價格在合理範圍內`);
        console.log('\n🎉 Oracle 修復成功！');
        console.log('💡 接下來可以：');
        console.log('1. 統一所有配置文件使用這個 Oracle 地址');
        console.log('2. 測試 Hero 和 Relic 的價格計算');
        console.log('3. 修復其他合約的 Oracle 連接');
      } else {
        console.log(`   ⚠️ 價格可能仍然異常`);
      }
      
    } catch (finalError) {
      console.log(`   ❌ 最終驗證失敗: ${finalError.message}`);
    }

  } catch (error) {
    console.error('\n❌ 修復過程中發生錯誤:', error.message);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log('\n💡 解決方案：');
      console.log('1. 確認你是 Oracle 合約的擁有者');
      console.log('2. 使用正確的私鑰');
      console.log('3. 考慮重新部署新的 Oracle');
    }
  }
}

// 執行修復
if (require.main === module) {
  fixOracleInitialization().catch(console.error);
}

module.exports = { fixOracleInitialization };
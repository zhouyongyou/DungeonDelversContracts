#!/usr/bin/env node

// 測試 .env 配置中的 Oracle

const { ethers } = require('ethers');
require('dotenv').config();

// 使用 .env 配置中的 Oracle 地址
const ORACLE_ADDRESS = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af";
const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";

// 使用 Alchemy RPC
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 簡化的 Oracle ABI - 嘗試常見函數
const ORACLE_ABI = [
  'function getPrice() external view returns (uint256)',
  'function getSoulPerUsd() external view returns (uint256)',
  'function getUsdToSoulRate() external view returns (uint256)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function getSoulShardAmountForUSD(uint256 _usdAmount) external view returns (uint256)',
  'function owner() external view returns (address)',
  'function soulShardToken() external view returns (address)',
  'function updatePrice() external',
  'function getLatestPrice() external view returns (uint256)',
  'function emergencySetRate(uint256 _rate) external'
];

async function testEnvOracle() {
  console.log('🔮 測試 .env 配置中的 Oracle...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🔮 Oracle 地址: ${ORACLE_ADDRESS}`);
  console.log(`🪙 SoulShard 地址: ${SOULSHARD_ADDRESS}\n`);
  
  const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);

  try {
    // 1. 基本信息檢查
    console.log('📋 基本信息檢查：');
    
    const owner = await oracle.owner();
    console.log(`   Oracle 擁有者: ${owner}`);
    console.log(`   你是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    
    const soulShard = await oracle.soulShardToken();
    console.log(`   SoulShard Token: ${soulShard}`);
    console.log(`   SoulShard 正確: ${soulShard.toLowerCase() === SOULSHARD_ADDRESS.toLowerCase() ? '✅' : '❌'}`);

    // 2. 嘗試各種價格查詢函數
    console.log('\n💰 價格查詢測試：');
    
    const priceFunctions = [
      'getUsdToSoulTWAP',
      'getPrice', 
      'getSoulPerUsd',
      'getUsdToSoulRate',
      'getLatestPrice'
    ];

    let workingFunction = null;
    let priceValue = null;

    for (const funcName of priceFunctions) {
      try {
        console.log(`   嘗試 ${funcName}()...`);
        const result = await oracle[funcName]();
        const rate = parseFloat(ethers.formatUnits(result, 18));
        console.log(`   ✅ ${funcName}(): ${rate.toFixed(6)} SOUL per USD`);
        
        if (rate > 1000 && rate < 100000) {
          workingFunction = funcName;
          priceValue = rate;
          console.log(`   ✅ 價格看起來合理！`);
        }
      } catch (error) {
        console.log(`   ❌ ${funcName}(): ${error.message.substring(0, 50)}...`);
      }
    }

    // 3. 測試 USD 到 SOUL 轉換函數
    console.log('\n🔄 USD 轉換測試：');
    try {
      const usdAmount = ethers.parseUnits('2', 18); // 2 USD
      const soulAmount = await oracle.getSoulShardAmountForUSD(usdAmount);
      const soulValue = parseFloat(ethers.formatUnits(soulAmount, 18));
      console.log(`   ✅ 2 USD = ${soulValue.toFixed(4)} SOUL`);
      console.log(`   單價: 1 USD = ${(soulValue / 2).toFixed(4)} SOUL`);
      
      if (soulValue / 2 > 1000 && soulValue / 2 < 100000) {
        console.log(`   ✅ 轉換函數價格合理！`);
        workingFunction = 'getSoulShardAmountForUSD';
        priceValue = soulValue / 2;
      }
      
    } catch (error) {
      console.log(`   ❌ getSoulShardAmountForUSD(): ${error.message.substring(0, 50)}...`);
    }

    // 4. 如果有正常工作的函數，嘗試設置緊急價格（如果需要）
    if (workingFunction && priceValue) {
      console.log(`\n✅ Oracle 部分功能正常！`);
      console.log(`   工作函數: ${workingFunction}()`);
      console.log(`   當前價格: 1 USD = ${priceValue.toFixed(4)} SOUL`);
    } else {
      console.log(`\n❌ Oracle 所有價格函數都失敗`);
      
      // 嘗試設置緊急價格
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log(`\n🚨 嘗試設置緊急價格...`);
        try {
          const oracleWithSigner = oracle.connect(deployer);
          const emergencyRate = ethers.parseUnits('16500', 18); // 1 USD = 16,500 SOUL
          
          const emergencyTx = await oracleWithSigner.emergencySetRate(emergencyRate);
          console.log(`   💊 緊急價格交易: ${emergencyTx.hash}`);
          
          const emergencyReceipt = await emergencyTx.wait();
          console.log(`   ✅ 緊急價格設置成功！區塊: ${emergencyReceipt.blockNumber}`);
          
          // 再次測試價格
          for (const funcName of priceFunctions) {
            try {
              const result = await oracle[funcName]();
              const rate = parseFloat(ethers.formatUnits(result, 18));
              console.log(`   ✅ 緊急價格後 ${funcName}(): ${rate.toFixed(6)} SOUL per USD`);
              break;
            } catch (error) {
              // 繼續嘗試下一個函數
            }
          }
          
        } catch (emergencyError) {
          console.log(`   ❌ 緊急價格設置失敗: ${emergencyError.message}`);
        }
      }
    }

    // 5. 檢查是否需要更新價格
    console.log('\n🔄 價格更新測試：');
    try {
      const oracleWithSigner = oracle.connect(deployer);
      const updateTx = await oracleWithSigner.updatePrice();
      console.log(`   🔄 價格更新交易: ${updateTx.hash}`);
      
      const updateReceipt = await updateTx.wait();
      console.log(`   ✅ 價格更新成功！區塊: ${updateReceipt.blockNumber}`);
      
      // 再次測試價格
      if (workingFunction) {
        const newResult = await oracle[workingFunction]();
        const newRate = parseFloat(ethers.formatUnits(newResult, 18));
        console.log(`   ✅ 更新後價格: ${newRate.toFixed(6)} SOUL per USD`);
      }
      
    } catch (updateError) {
      console.log(`   ⚠️ 價格更新失敗或不需要: ${updateError.message.substring(0, 50)}...`);
    }

    // 6. 生成建議
    console.log('\n💡 建議：');
    if (workingFunction && priceValue) {
      console.log('✅ 這個 Oracle 有基本功能');
      console.log(`   推薦使用: ${ORACLE_ADDRESS}`);
      console.log(`   工作函數: ${workingFunction}()`);
      console.log(`   當前價格: 1 USD = ${priceValue.toFixed(4)} SOUL`);
      
      return {
        working: true,
        address: ORACLE_ADDRESS,
        workingFunction,
        price: priceValue
      };
    } else {
      console.log('❌ 這個 Oracle 也有問題');
      console.log('   建議重新部署新的 Oracle');
      
      return {
        working: false,
        address: ORACLE_ADDRESS
      };
    }

  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error.message);
    return {
      working: false,
      address: ORACLE_ADDRESS,
      error: error.message
    };
  }
}

// 執行測試
if (require.main === module) {
  testEnvOracle().catch(console.error);
}

module.exports = { testEnvOracle };
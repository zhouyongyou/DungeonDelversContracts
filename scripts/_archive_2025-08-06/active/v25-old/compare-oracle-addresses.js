#!/usr/bin/env node

// 比較兩個 Oracle 地址，確定哪個是正確且功能正常的

const { ethers } = require('ethers');
require('dotenv').config();

// 兩個 Oracle 地址
const ORACLE_V22_CONFIG = "0xb9317179466fd7fb253669538dE1c4635E81eAc4"; // V22 配置文件中的
const ORACLE_ENV_CONFIG = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af"; // .env 文件中的

// 使用 Alchemy RPC
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// Oracle ABI
const ORACLE_ABI = [
  'function owner() public view returns (address)',
  'function getUsdToSoulTWAP() external view returns (uint256)',
  'function initialized() external view returns (bool)',
  'function soulShardToken() external view returns (address)',
  'function factory() external view returns (address)'
];

async function compareOracleAddresses() {
  console.log('🔍 比較兩個 Oracle 地址...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const oracles = [
    { name: "V22 配置", address: ORACLE_V22_CONFIG },
    { name: ".env 配置", address: ORACLE_ENV_CONFIG }
  ];

  const results = {};

  for (const oracleInfo of oracles) {
    console.log(`📊 檢查 ${oracleInfo.name} Oracle:`);
    console.log(`   地址: ${oracleInfo.address}\n`);
    
    const result = {
      address: oracleInfo.address,
      name: oracleInfo.name,
      exists: false,
      hasCode: false,
      functions: {},
      errors: []
    };

    try {
      // 1. 檢查是否有合約程式碼
      const code = await provider.getCode(oracleInfo.address);
      result.hasCode = code !== '0x';
      console.log(`   合約程式碼: ${result.hasCode ? '✅ 存在' : '❌ 不存在'} (${code.length - 2} 字節)`);
      
      if (result.hasCode) {
        result.exists = true;
        
        // 2. 創建合約實例
        const oracle = new ethers.Contract(oracleInfo.address, ORACLE_ABI, provider);
        
        // 3. 測試各個函數
        const functions = [
          { name: 'owner', func: () => oracle.owner() },
          { name: 'initialized', func: () => oracle.initialized() },
          { name: 'soulShardToken', func: () => oracle.soulShardToken() },
          { name: 'factory', func: () => oracle.factory() },
          { name: 'getUsdToSoulTWAP', func: () => oracle.getUsdToSoulTWAP() }
        ];
        
        for (const fn of functions) {
          try {
            const fnResult = await fn.func();
            result.functions[fn.name] = { success: true, value: fnResult };
            
            if (fn.name === 'owner') {
              console.log(`   ${fn.name}(): ✅ ${fnResult}`);
            } else if (fn.name === 'initialized') {
              console.log(`   ${fn.name}(): ${fnResult ? '✅ true' : '❌ false'}`);
            } else if (fn.name === 'getUsdToSoulTWAP') {
              const rate = parseFloat(ethers.formatUnits(fnResult, 18));
              console.log(`   ${fn.name}(): ✅ ${rate.toFixed(6)} SOUL per USD`);
              result.functions[fn.name].rate = rate;
            } else {
              console.log(`   ${fn.name}(): ✅ ${fnResult}`);
            }
          } catch (error) {
            result.functions[fn.name] = { success: false, error: error.message };
            console.log(`   ${fn.name}(): ❌ ${error.message.substring(0, 60)}...`);
          }
        }
      }
      
    } catch (error) {
      result.errors.push(error.message);
      console.log(`   ❌ 檢查失敗: ${error.message}`);
    }
    
    results[oracleInfo.name] = result;
    console.log('');
  }

  // 分析結果並給出建議
  console.log('📋 比較結果分析：\n');
  
  let recommendedOracle = null;
  let recommendedReason = '';

  // 檢查哪個 Oracle 更健康
  for (const [name, result] of Object.entries(results)) {
    console.log(`${name}:`);
    console.log(`   ✅ 存在: ${result.exists}`);
    console.log(`   ✅ 有程式碼: ${result.hasCode}`);
    
    if (result.exists) {
      const successCount = Object.values(result.functions).filter(f => f.success).length;
      const totalCount = Object.keys(result.functions).length;
      console.log(`   ✅ 函數成功率: ${successCount}/${totalCount}`);
      
      // 檢查價格函數
      if (result.functions.getUsdToSoulTWAP && result.functions.getUsdToSoulTWAP.success) {
        const rate = result.functions.getUsdToSoulTWAP.rate;
        console.log(`   ✅ 價格正常: ${rate > 1000 && rate < 100000 ? '是' : '否'} (${rate.toFixed(2)} SOUL/USD)`);
        
        // 如果價格在合理範圍內，這是好的候選
        if (rate > 1000 && rate < 100000 && successCount >= 4) {
          if (!recommendedOracle || successCount > Object.values(results[recommendedOracle].functions).filter(f => f.success).length) {
            recommendedOracle = name;
            recommendedReason = `函數完整性高 (${successCount}/${totalCount}) 且價格正常 (${rate.toFixed(2)} SOUL/USD)`;
          }
        }
      }
      
      // 檢查初始化狀態
      if (result.functions.initialized && result.functions.initialized.success && result.functions.initialized.value) {
        console.log(`   ✅ 已初始化: 是`);
      } else {
        console.log(`   ⚠️ 已初始化: 否或未知`);
      }
    }
    console.log('');
  }

  // 最終建議
  console.log('🎯 建議：');
  if (recommendedOracle) {
    const recommendedAddress = results[recommendedOracle].address;
    console.log(`✅ 推薦使用: ${recommendedOracle}`);
    console.log(`   地址: ${recommendedAddress}`);
    console.log(`   原因: ${recommendedReason}`);
    
    console.log('\n🔧 需要執行的操作：');
    console.log('1. 統一所有配置文件使用這個 Oracle 地址');
    console.log('2. 更新 V22 配置文件');
    console.log('3. 更新 .env 文件');
    console.log('4. 確保所有其他合約 (Hero, Relic, DungeonCore) 都連接到這個 Oracle');
    
    return {
      recommended: recommendedOracle,
      address: recommendedAddress,
      reason: recommendedReason,
      results: results
    };
  } else {
    console.log('❌ 兩個 Oracle 都有問題！');
    console.log('\n可能的解決方案：');
    console.log('1. 重新部署一個新的 Oracle');
    console.log('2. 修復現有 Oracle 的初始化問題');
    console.log('3. 檢查是否有其他可用的 Oracle 版本');
    
    return {
      recommended: null,
      results: results
    };
  }
}

// 執行比較
if (require.main === module) {
  compareOracleAddresses().then(result => {
    if (result.recommended) {
      console.log('\n✅ 分析完成，建議已生成');
    } else {
      console.log('\n❌ 需要進一步診斷或部署新的 Oracle');
    }
  }).catch(console.error);
}

module.exports = { compareOracleAddresses };
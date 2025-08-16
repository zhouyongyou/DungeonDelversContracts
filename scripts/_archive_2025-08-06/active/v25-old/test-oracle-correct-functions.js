#!/usr/bin/env node

// 使用正確的函數名測試兩個 Oracle

const { ethers } = require('ethers');
require('dotenv').config();

// 兩個 Oracle 地址
const ORACLE_V22_CONFIG = "0xb9317179466fd7fb253669538dE1c4635E81eAc4"; // V22 配置文件中的
const ORACLE_ENV_CONFIG = "0x623caa925445BeACd54Cc6C62Bb725B5d93698af"; // .env 文件中的

// 使用 Alchemy RPC
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";

// 正確的 Oracle ABI（基於合約源碼）
const ORACLE_ABI = [
  'function owner() external view returns (address)',
  'function soulShardToken() external view returns (address)',
  'function getSoulShardPriceInUSD() public view returns (uint256)',
  'function getLatestPrice() public view returns (uint256)',
  'function getRequiredSoulShardAmount(uint256 usdAmount) public view returns (uint256)',
  'function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256)',
  'function getPriceAdaptive() public view returns (uint256 price, uint32 usedPeriod)',
  'function testAllPeriods() external view returns (bool[] memory available, uint256[] memory prices)',
  'function getAdaptivePeriods() external view returns (uint32[] memory)',
  'function setAdaptivePeriods(uint32[] calldata _periods) external'
];

async function testOracleCorrectFunctions() {
  console.log('🔮 使用正確的函數名測試 Oracle...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const oracles = [
    { name: "V22 配置", address: ORACLE_V22_CONFIG },
    { name: ".env 配置", address: ORACLE_ENV_CONFIG }
  ];

  for (const oracleInfo of oracles) {
    console.log(`📊 測試 ${oracleInfo.name} Oracle:`);
    console.log(`   地址: ${oracleInfo.address}\n`);
    
    const oracle = new ethers.Contract(oracleInfo.address, ORACLE_ABI, provider);

    try {
      // 1. 基本信息
      console.log('📋 基本信息：');
      
      const owner = await oracle.owner();
      console.log(`   擁有者: ${owner}`);
      
      const soulShard = await oracle.soulShardToken();
      console.log(`   SoulShard: ${soulShard}`);

      // 2. 測試價格函數
      console.log('\n💰 價格函數測試：');
      
      try {
        const priceInUSD = await oracle.getSoulShardPriceInUSD();
        const priceValue = parseFloat(ethers.formatUnits(priceInUSD, 18));
        console.log(`   ✅ getSoulShardPriceInUSD(): ${priceValue.toFixed(6)} USD per SOUL`);
        
        // 注意：這裡的價格是 SoulShard 的 USD 價格，我們需要轉換為 USD 的 SOUL 價格
        if (priceValue > 0) {
          const soulPerUsd = 1 / priceValue;
          console.log(`   ✅ 轉換後: 1 USD = ${soulPerUsd.toFixed(2)} SOUL`);
          
          if (soulPerUsd > 1000 && soulPerUsd < 100000) {
            console.log(`   ✅ 價格合理範圍！`);
          } else {
            console.log(`   ⚠️ 價格可能異常`);
          }
        }
      } catch (error) {
        console.log(`   ❌ getSoulShardPriceInUSD(): ${error.message.substring(0, 60)}...`);
      }

      try {
        const latestPrice = await oracle.getLatestPrice();
        const latestValue = parseFloat(ethers.formatUnits(latestPrice, 18));
        console.log(`   ✅ getLatestPrice(): ${latestValue.toFixed(6)} USD per SOUL`);
      } catch (error) {
        console.log(`   ❌ getLatestPrice(): ${error.message.substring(0, 60)}...`);
      }

      // 3. 測試 USD 轉換
      console.log('\n🔄 USD 轉換測試：');
      
      try {
        const usdAmount = ethers.parseUnits('2', 18); // 2 USD
        const soulAmount = await oracle.getRequiredSoulShardAmount(usdAmount);
        const soulValue = parseFloat(ethers.formatUnits(soulAmount, 18));
        console.log(`   ✅ 2 USD = ${soulValue.toFixed(4)} SOUL`);
        console.log(`   ✅ 1 USD = ${(soulValue / 2).toFixed(4)} SOUL`);
        
        if (soulValue / 2 > 1000 && soulValue / 2 < 100000) {
          console.log(`   ✅ 轉換函數價格合理！`);
        }
      } catch (error) {
        console.log(`   ❌ getRequiredSoulShardAmount(): ${error.message.substring(0, 60)}...`);
      }

      // 4. 測試自適應功能（V22 特有）
      console.log('\n🔄 自適應功能測試：');
      
      try {
        const [adaptivePrice, usedPeriod] = await oracle.getPriceAdaptive();
        const adaptiveValue = parseFloat(ethers.formatUnits(adaptivePrice, 18));
        console.log(`   ✅ getPriceAdaptive(): ${adaptiveValue.toFixed(6)} USD per SOUL (週期: ${usedPeriod}s)`);
      } catch (error) {
        console.log(`   ❌ getPriceAdaptive(): ${error.message.substring(0, 60)}...`);
      }
      
      try {
        const periods = await oracle.getAdaptivePeriods();
        console.log(`   ✅ 自適應週期: [${periods.join(', ')}] 秒`);
      } catch (error) {
        console.log(`   ❌ getAdaptivePeriods(): ${error.message.substring(0, 60)}...`);
      }

      try {
        const [available, prices] = await oracle.testAllPeriods();
        console.log(`   📊 週期測試結果:`);
        for (let i = 0; i < available.length; i++) {
          if (available[i]) {
            const priceValue = parseFloat(ethers.formatUnits(prices[i], 18));
            console.log(`     週期 ${i + 1}: ✅ ${priceValue.toFixed(6)} USD per SOUL`);
          } else {
            console.log(`     週期 ${i + 1}: ❌ 不可用`);
          }
        }
      } catch (error) {
        console.log(`   ❌ testAllPeriods(): ${error.message.substring(0, 60)}...`);
      }

    } catch (error) {
      console.log(`   ❌ 基本測試失敗: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('💡 結論：');
  console.log('如果任何一個 Oracle 的基本函數（getSoulShardPriceInUSD, getRequiredSoulShardAmount）正常工作，');
  console.log('我們就可以修復聖物價格顯示問題了！');
}

// 執行測試
if (require.main === module) {
  testOracleCorrectFunctions().catch(console.error);
}

module.exports = { testOracleCorrectFunctions };
#!/usr/bin/env node

// 檢查 DungeonCore 的 Oracle 連接

const { ethers } = require('ethers');
require('dotenv').config();

const v22Config = require('../../config/v22-config');
const BSC_RPC = "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf";
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

// 正確的 Oracle 地址
const CORRECT_ORACLE = "0xb9317179466fd7fb253669538dE1c4635E81eAc4";

// DungeonCore ABI
const DUNGEONCORE_ABI = [
  'function oracleAddress() external view returns (address)',
  'function setOracle(address _newAddress) external',
  'function getSoulShardAmountForUSD(uint256 _amountUSD) external view returns (uint256)',
  'function getUSDValueForSoulShard(uint256 _soulShardAmount) external view returns (uint256)',
  'function owner() external view returns (address)',
  'function usdTokenAddress() external view returns (address)',
  'function soulShardTokenAddress() external view returns (address)'
];

// Oracle ABI
const ORACLE_ABI = [
  'function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256)',
  'function getSoulShardPriceInUSD() public view returns (uint256)',
  'function soulShardToken() external view returns (address)',
  'function usdToken() external view returns (address)'
];

async function checkDungeonCoreOracle() {
  console.log('🏰 檢查 DungeonCore Oracle 連接...\n');

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  console.log(`🏰 DungeonCore 地址: ${v22Config.contracts.DUNGEONCORE.address}`);
  console.log(`🔮 正確 Oracle 地址: ${CORRECT_ORACLE}\n`);

  const dungeonCore = new ethers.Contract(v22Config.contracts.DUNGEONCORE.address, DUNGEONCORE_ABI, provider);

  try {
    // 1. 檢查當前配置
    console.log('📋 DungeonCore 當前配置：');
    
    const owner = await dungeonCore.owner();
    console.log(`   擁有者: ${owner}`);
    console.log(`   你是擁有者: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
    
    const currentOracle = await dungeonCore.oracleAddress();
    console.log(`   當前 Oracle: ${currentOracle}`);
    console.log(`   正確 Oracle: ${CORRECT_ORACLE}`);
    console.log(`   Oracle 正確: ${currentOracle.toLowerCase() === CORRECT_ORACLE.toLowerCase() ? '✅' : '❌'}`);
    
    const usdToken = await dungeonCore.usdTokenAddress();
    const soulShardToken = await dungeonCore.soulShardTokenAddress();
    console.log(`   USD Token: ${usdToken}`);
    console.log(`   SoulShard Token: ${soulShardToken}`);

    // 2. 如果 Oracle 不正確，更新它
    if (currentOracle.toLowerCase() !== CORRECT_ORACLE.toLowerCase()) {
      console.log('\n🔧 更新 DungeonCore Oracle...');
      
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        try {
          const dungeonCoreWithSigner = dungeonCore.connect(deployer);
          const updateTx = await dungeonCoreWithSigner.setOracle(CORRECT_ORACLE);
          console.log(`   交易哈希: ${updateTx.hash}`);
          console.log('   等待確認...');
          
          const receipt = await updateTx.wait();
          console.log(`   ✅ Oracle 更新成功！區塊: ${receipt.blockNumber}`);
          
          // 驗證更新
          const newOracle = await dungeonCore.oracleAddress();
          console.log(`   新 Oracle: ${newOracle}`);
          
        } catch (error) {
          console.log(`   ❌ Oracle 更新失敗: ${error.message}`);
        }
      } else {
        console.log(`   ❌ 沒有權限更新 Oracle`);
      }
    }

    // 3. 測試 Oracle 連接和函數
    console.log('\n🔮 測試 Oracle 連接：');
    
    const oracle = new ethers.Contract(CORRECT_ORACLE, ORACLE_ABI, provider);
    
    // 檢查 Oracle 的 token 設置
    const oracleUsdToken = await oracle.usdToken();
    const oracleSoulToken = await oracle.soulShardToken();
    console.log(`   Oracle USD Token: ${oracleUsdToken}`);
    console.log(`   Oracle SoulShard Token: ${oracleSoulToken}`);
    console.log(`   USD Token 匹配: ${oracleUsdToken.toLowerCase() === usdToken.toLowerCase() ? '✅' : '❌'}`);
    console.log(`   SoulShard Token 匹配: ${oracleSoulToken.toLowerCase() === soulShardToken.toLowerCase() ? '✅' : '❌'}`);

    // 4. 測試價格轉換函數
    console.log('\n💰 測試價格轉換：');
    
    try {
      // 測試 Oracle 的 getAmountOut 函數
      const testUSDAmount = ethers.parseUnits('2', 18); // 2 USD
      const soulAmount = await oracle.getAmountOut(usdToken, testUSDAmount);
      const soulValue = parseFloat(ethers.formatUnits(soulAmount, 18));
      console.log(`   Oracle.getAmountOut(${ethers.formatUnits(testUSDAmount, 18)} USD): ${soulValue.toFixed(4)} SOUL`);
      
      if (soulValue > 1000 && soulValue < 100000) {
        console.log(`   ✅ Oracle getAmountOut 正常`);
      } else {
        console.log(`   ⚠️ Oracle getAmountOut 價格異常`);
      }
      
    } catch (error) {
      console.log(`   ❌ Oracle.getAmountOut 失敗: ${error.message}`);
    }

    try {
      // 測試 DungeonCore 的轉換函數
      const testUSDAmount = ethers.parseUnits('2', 18); // 2 USD
      const coreSoulAmount = await dungeonCore.getSoulShardAmountForUSD(testUSDAmount);
      const coreSoulValue = parseFloat(ethers.formatUnits(coreSoulAmount, 18));
      console.log(`   DungeonCore.getSoulShardAmountForUSD(${ethers.formatUnits(testUSDAmount, 18)} USD): ${coreSoulValue.toFixed(4)} SOUL`);
      
      if (coreSoulValue > 1000 && coreSoulValue < 100000) {
        console.log(`   ✅ DungeonCore 轉換正常`);
      } else {
        console.log(`   ⚠️ DungeonCore 轉換價格異常`);
      }
      
    } catch (error) {
      console.log(`   ❌ DungeonCore.getSoulShardAmountForUSD 失敗: ${error.message}`);
    }

    // 5. 測試 Hero 價格計算（現在應該正常）
    console.log('\n⚔️ 測試 Hero 價格計算：');
    
    const heroABI = ['function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256)'];
    const hero = new ethers.Contract(v22Config.contracts.HERO.address, heroABI, provider);
    
    try {
      const heroPrice1 = await hero.getRequiredSoulShardAmount(1);
      const heroPriceValue = parseFloat(ethers.formatUnits(heroPrice1, 18));
      console.log(`   Hero.getRequiredSoulShardAmount(1): ${heroPriceValue.toFixed(4)} SOUL`);
      
      if (heroPriceValue > 1000 && heroPriceValue < 100000) {
        console.log(`   ✅ Hero 價格正常`);
      } else {
        console.log(`   ❌ Hero 價格異常`);
      }
      
    } catch (error) {
      console.log(`   ❌ Hero 價格計算失敗: ${error.message}`);
    }

    // 6. 測試 Relic 價格計算
    console.log('\n💎 測試 Relic 價格計算：');
    
    const relicABI = ['function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256)'];
    const relic = new ethers.Contract(v22Config.contracts.RELIC.address, relicABI, provider);
    
    try {
      const relicPrice1 = await relic.getRequiredSoulShardAmount(1);
      const relicPriceValue = parseFloat(ethers.formatUnits(relicPrice1, 18));
      console.log(`   Relic.getRequiredSoulShardAmount(1): ${relicPriceValue.toFixed(4)} SOUL`);
      
      if (relicPriceValue > 1000 && relicPriceValue < 100000) {
        console.log(`   ✅ Relic 價格正常 - 前端顯示問題已修復！`);
      } else {
        console.log(`   ❌ Relic 價格仍然異常`);
      }
      
    } catch (error) {
      console.log(`   ❌ Relic 價格計算失敗: ${error.message}`);
    }

    console.log('\n🎯 總結：');
    console.log('如果所有價格計算都正常，聖物的前端顯示問題就解決了！');

  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message);
  }
}

// 執行檢查
if (require.main === module) {
  checkDungeonCoreOracle().catch(console.error);
}

module.exports = { checkDungeonCoreOracle };
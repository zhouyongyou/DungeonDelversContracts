#!/usr/bin/env node

// 修復 Relic 聖物的鑄造價格問題

const { ethers } = require('ethers');
require('dotenv').config();

// 載入配置
const v22Config = require('../../config/v22-config');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

// 合約 ABI
const RELIC_ABI = [
  'function mintPriceUSD() public view returns (uint256)',
  'function setMintPriceUSD(uint256 _price) external',
  'function getRequiredSoulShardAmount(uint256 quantity) public view returns (uint256)',
  'function owner() public view returns (address)'
];

async function fixRelicPrice() {
  console.log('🔧 修復 Relic 聖物價格...\n');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ 錯誤: 未設置 DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY.replace('0x', ''), provider);
  
  console.log(`👤 執行者地址: ${deployer.address}`);
  
  const relic = new ethers.Contract(v22Config.contracts.RELIC.address, RELIC_ABI, provider);

  try {
    // 檢查擁有者
    const owner = await relic.owner();
    console.log(`📋 合約擁有者: ${owner}`);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error('❌ 錯誤: 你不是合約擁有者');
      process.exit(1);
    }

    // 檢查當前價格
    console.log('\n📊 當前狀態：');
    const currentPrice = await relic.mintPriceUSD();
    console.log(`   當前 mintPriceUSD: ${ethers.formatUnits(currentPrice, 18)} USD`);
    
    // 測試當前價格計算
    try {
      const testAmount = await relic.getRequiredSoulShardAmount(1);
      const soulAmount = parseFloat(ethers.formatUnits(testAmount, 18));
      console.log(`   1 個聖物需要: ${soulAmount.toFixed(4)} SOUL`);
      
      if (soulAmount > 1000000) {
        console.log(`   ⚠️ 價格異常高！需要修復`);
      }
    } catch (error) {
      console.log(`   ❌ 無法計算價格: ${error.message}`);
    }

    // 根據 v22Config 的預期價格設置
    const expectedPrice = ethers.parseUnits('2', 18); // 2 USD
    
    if (currentPrice.toString() !== expectedPrice.toString()) {
      console.log('\n🔧 修復價格...');
      console.log(`   新價格: 2 USD`);
      
      const relicWithSigner = relic.connect(deployer);
      const tx = await relicWithSigner.setMintPriceUSD(expectedPrice);
      console.log(`   交易哈希: ${tx.hash}`);
      console.log('   等待確認...');
      
      const receipt = await tx.wait();
      console.log(`   ✅ 交易確認！區塊: ${receipt.blockNumber}`);
      
      // 驗證修復
      console.log('\n📊 驗證修復：');
      const newPrice = await relic.mintPriceUSD();
      console.log(`   新 mintPriceUSD: ${ethers.formatUnits(newPrice, 18)} USD`);
      
      const newTestAmount = await relic.getRequiredSoulShardAmount(1);
      const newSoulAmount = parseFloat(ethers.formatUnits(newTestAmount, 18));
      console.log(`   1 個聖物現在需要: ${newSoulAmount.toFixed(4)} SOUL`);
      
      if (newSoulAmount < 100000 && newSoulAmount > 1000) {
        console.log(`   ✅ 價格已恢復正常！`);
      } else {
        console.log(`   ⚠️ 價格仍然異常，可能需要檢查 Oracle`);
      }
    } else {
      console.log('\n✅ mintPriceUSD 已經是正確的 2 USD');
      console.log('   問題可能在 Oracle 或 getRequiredSoulShardAmount 函數');
      
      // 檢查 Oracle
      console.log('\n🔍 檢查 Oracle...');
      const oracleABI = ['function getUsdToSoulTWAP() external view returns (uint256)'];
      const oracle = new ethers.Contract(v22Config.contracts.ORACLE.address, oracleABI, provider);
      
      try {
        const usdToSoul = await oracle.getUsdToSoulTWAP();
        const rate = parseFloat(ethers.formatUnits(usdToSoul, 18));
        console.log(`   Oracle: 1 USD = ${rate.toFixed(6)} SOUL`);
        
        if (rate > 1e18 || rate < 1) {
          console.log(`   ⚠️ Oracle 返回的價格異常！`);
          console.log(`   這可能是導致聖物價格顯示錯誤的原因`);
        }
      } catch (error) {
        console.log(`   ❌ 無法讀取 Oracle: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  }
}

// 執行修復
if (require.main === module) {
  fixRelicPrice().catch(console.error);
}

module.exports = { fixRelicPrice };
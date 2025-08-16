#!/usr/bin/env node

// 檢查 Hero 和 Relic 的實際價格

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function checkPrices() {
  console.log('💰 檢查 V23 實際鑄造價格...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  
  const priceABI = ["function mintPriceUSD() view returns (uint256)"];
  
  // 檢查 Hero
  const hero = new ethers.Contract(v23Config.contracts.HERO.address, priceABI, provider);
  const heroPrice = await hero.mintPriceUSD();
  console.log(`Hero 鑄造價格:`);
  console.log(`  原始值: ${heroPrice.toString()}`);
  console.log(`  格式化: ${ethers.formatUnits(heroPrice, 18)} USD`);
  console.log(`  是否正確: ${heroPrice.toString() === ethers.parseUnits('2', 18).toString() ? '✅' : '❌'}`);
  
  // 檢查 Relic
  const relic = new ethers.Contract(v23Config.contracts.RELIC.address, priceABI, provider);
  const relicPrice = await relic.mintPriceUSD();
  console.log(`\nRelic 鑄造價格:`);
  console.log(`  原始值: ${relicPrice.toString()}`);
  console.log(`  格式化: ${ethers.formatUnits(relicPrice, 18)} USD`);
  console.log(`  是否正確: ${relicPrice.toString() === ethers.parseUnits('2', 18).toString() ? '✅' : '❌'}`);
  
  // 顯示正確的價格應該是什麼
  console.log(`\n正確的價格應該是: ${ethers.parseUnits('2', 18).toString()}`);
}

checkPrices().catch(console.error);
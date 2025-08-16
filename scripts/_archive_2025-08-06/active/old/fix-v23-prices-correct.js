#!/usr/bin/env node

// 正確修復 V23 價格問題 - 傳入 2 而不是 2*1e18

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function fixPricesCorrectly() {
  console.log('💰 正確修復 V23 鑄造價格...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  // 注意：setMintPriceUSD 會自動乘以 1e18，所以我們只需要傳入 2
  const priceToSet = 2; // 不是 2 * 1e18！
  const expectedFinalPrice = ethers.parseUnits('2', 18);
  
  console.log(`要設置的值: ${priceToSet} (函數會自動乘以 1e18)`);
  console.log(`預期最終價格: ${expectedFinalPrice.toString()} (2 * 1e18)\n`);
  
  const contracts = [
    { name: 'Hero', address: v23Config.contracts.HERO.address },
    { name: 'Relic', address: v23Config.contracts.RELIC.address }
  ];
  
  for (const contract of contracts) {
    try {
      console.log(`修復 ${contract.name}...`);
      
      const abi = [
        "function mintPriceUSD() view returns (uint256)",
        "function setMintPriceUSD(uint256 _newPrice) external",
        "function owner() view returns (address)"
      ];
      
      const nft = new ethers.Contract(contract.address, abi, deployer);
      
      // 檢查當前價格
      const currentPrice = await nft.mintPriceUSD();
      console.log(`  當前價格: ${currentPrice.toString()}`);
      console.log(`  格式化: ${ethers.formatUnits(currentPrice, 18)} USD`);
      
      // 設置價格為 2（函數會自動乘以 1e18）
      console.log(`  設置價格為 ${priceToSet}...`);
      const tx = await nft.setMintPriceUSD(priceToSet);
      console.log(`  交易: ${tx.hash}`);
      await tx.wait();
      
      // 驗證新價格
      const newPrice = await nft.mintPriceUSD();
      console.log(`  新價格: ${newPrice.toString()}`);
      console.log(`  格式化: ${ethers.formatUnits(newPrice, 18)} USD`);
      console.log(`  正確性: ${newPrice.toString() === expectedFinalPrice.toString() ? '✅' : '❌'}\n`);
      
    } catch (error) {
      console.log(`  ❌ 錯誤: ${error.message}\n`);
    }
  }
  
  console.log('✅ 價格修復完成！');
}

fixPricesCorrectly().catch(console.error);
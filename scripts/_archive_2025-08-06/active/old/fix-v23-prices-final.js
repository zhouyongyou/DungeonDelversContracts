#!/usr/bin/env node

// 最終修復 V23 價格問題

const { ethers } = require('ethers');
require('dotenv').config();

const v23Config = require('../../config/v23-config');
const DEPLOYER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC = process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/';

async function fixPrices() {
  console.log('💰 修復 V23 鑄造價格...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  
  const correctPrice = ethers.parseUnits('2', 18); // 2 USD
  console.log(`正確價格: ${correctPrice.toString()} (2 USD)\n`);
  
  const contracts = [
    { name: 'Hero', address: v23Config.contracts.HERO.address },
    { name: 'Relic', address: v23Config.contracts.RELIC.address }
  ];
  
  for (const contract of contracts) {
    try {
      console.log(`修復 ${contract.name}...`);
      
      // 檢查當前價格
      const checkABI = ["function mintPriceUSD() view returns (uint256)"];
      const nft = new ethers.Contract(contract.address, checkABI, provider);
      const currentPrice = await nft.mintPriceUSD();
      console.log(`  當前價格: ${currentPrice.toString()}`);
      console.log(`  格式化: ${ethers.formatUnits(currentPrice, 18)} USD`);
      
      if (currentPrice.toString() !== correctPrice.toString()) {
        // 設置正確價格
        const setABI = [
          "function setMintPriceUSD(uint256 _price) external",
          "function owner() view returns (address)"
        ];
        const nftSetter = new ethers.Contract(contract.address, setABI, deployer);
        
        // 檢查 owner
        const owner = await nftSetter.owner();
        console.log(`  Owner: ${owner}`);
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.log(`  ❌ 不是 owner，無法設置價格`);
          continue;
        }
        
        console.log(`  設置新價格...`);
        const tx = await nftSetter.setMintPriceUSD(correctPrice);
        console.log(`  交易: ${tx.hash}`);
        await tx.wait();
        
        // 驗證新價格
        const newPrice = await nft.mintPriceUSD();
        console.log(`  新價格: ${newPrice.toString()}`);
        console.log(`  格式化: ${ethers.formatUnits(newPrice, 18)} USD`);
        console.log(`  ✅ 成功\n`);
      } else {
        console.log(`  ✅ 價格已正確\n`);
      }
    } catch (error) {
      console.log(`  ❌ 錯誤: ${error.message}\n`);
    }
  }
}

fixPrices().catch(console.error);
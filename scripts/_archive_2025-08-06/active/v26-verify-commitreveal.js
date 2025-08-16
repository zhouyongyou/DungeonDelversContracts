#!/usr/bin/env node

/**
 * V26 Commit-Reveal 合約驗證腳本
 * 
 * 使用方式：
 * 1. 確保 .env 中有正確的合約地址
 * 2. 執行：node scripts/active/v26-verify-commitreveal.js
 */

const hre = require("hardhat");
require('dotenv').config();

const contracts = [
  {
    name: "Oracle",
    address: process.env.ORACLE_ADDRESS,
    constructorArguments: [
      process.env.USDT_ADDRESS || '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
      process.env.SOULSHARD_ADDRESS || '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
      process.env.UNISWAP_POOL || '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
      process.env.DEPLOYER_ADDRESS
    ]
  },
  {
    name: "DungeonCore",
    address: process.env.DUNGEONCORE_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "PlayerVault",
    address: process.env.PLAYERVAULT_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "PlayerProfile",
    address: process.env.PLAYERPROFILE_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "VIPStaking",
    address: process.env.VIPSTAKING_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "DungeonStorage",
    address: process.env.DUNGEONSTORAGE_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "DungeonMasterV2_Fixed", // Commit-Reveal 版本
    address: process.env.DUNGEONMASTER_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "Hero", // Commit-Reveal 版本
    address: process.env.HERO_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "Relic", // Commit-Reveal 版本
    address: process.env.RELIC_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "Party",
    address: process.env.PARTY_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  },
  {
    name: "AltarOfAscension", // Commit-Reveal 版本
    address: process.env.ALTAROFASCENSION_ADDRESS,
    constructorArguments: [process.env.DEPLOYER_ADDRESS]
  }
];

async function main() {
  console.log("🔍 開始驗證 V26 Commit-Reveal 合約...\n");
  
  for (const contract of contracts) {
    if (!contract.address) {
      console.log(`⚠️  跳過 ${contract.name}：地址未設置`);
      continue;
    }
    
    console.log(`\n📋 驗證 ${contract.name}...`);
    console.log(`   地址: ${contract.address}`);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
        contract: contract.contractPath
      });
      console.log(`✅ ${contract.name} 驗證成功！`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contract.name} 已經驗證過了`);
      } else {
        console.log(`❌ ${contract.name} 驗證失敗：${error.message}`);
      }
    }
  }
  
  console.log("\n✨ 驗證完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
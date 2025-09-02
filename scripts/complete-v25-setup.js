#!/usr/bin/env node

/**
 * 完成 V25 部署設置
 * 繼續未完成的配置步驟
 */

const { ethers } = require("hardhat");
require('dotenv').config();

// 已部署的合約地址
const DEPLOYED_CONTRACTS = {
  Oracle: "0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d",
  DungeonCore: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
  DungeonStorage: "0x5d8513681506540338d3A1669243144F68eC16a3",
  VRFConsumerV2Plus: "0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5",
  Hero: "0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8",
  Relic: "0x0B030a01682b2871950C9994a1f4274da96edBB1",
  Party: "0x5196631AB636a0C951c56943f84029a909540B9E",
  PlayerVault: "0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65",
  PlayerProfile: "0x7E1E437cC88C581ca41698b345bE8aeCA8084559",
  VIPStaking: "0x2A758Fb08A80E49a3164BC217fe822c06c726752",
  DungeonMaster: "0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9",
  AltarOfAscension: "0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B",
  
  // 複用的合約
  SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
};

// 遊戲配置
const GAME_CONFIG = {
  platformFee: ethers.parseEther("0.0000001011"), // 極小的費用
  partyFee: ethers.parseEther("0.001"),
  mintPriceUSD: ethers.parseEther("2"),
  
  baseURIs: {
    Hero: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/',
    Relic: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/',
    Party: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/party/',
    VIPStaking: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/vip/',
    PlayerProfile: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/profile/'
  },
  
  dungeons: [
    { id: 1, power: 300, rewardUSD: 6, rate: 89 },
    { id: 2, power: 600, rewardUSD: 12, rate: 84 },
    { id: 3, power: 900, rewardUSD: 20, rate: 79 },
    { id: 4, power: 1200, rewardUSD: 33, rate: 74 },
    { id: 5, power: 1500, rewardUSD: 52, rate: 69 },
    { id: 6, power: 1800, rewardUSD: 78, rate: 64 },
    { id: 7, power: 2100, rewardUSD: 113, rate: 59 },
    { id: 8, power: 2400, rewardUSD: 156, rate: 54 },
    { id: 9, power: 2700, rewardUSD: 209, rate: 49 },
    { id: 10, power: 3000, rewardUSD: 225, rate: 44 },
    { id: 11, power: 3300, rewardUSD: 320, rate: 39 },
    { id: 12, power: 3600, rewardUSD: 450, rate: 34 }
  ]
};

async function main() {
  console.log("=== 完成 V25 部署設置 ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("執行者地址:", deployer.address);
  console.log("\n");
  
  try {
    // 1. 完成 setDungeonCore 設置
    console.log("📋 Step 1: 設置 DungeonCore 地址...");
    
    const contractsNeedingDungeonCore = [
      'Relic', 'Party', 'PlayerVault', 'PlayerProfile', 
      'VIPStaking', 'DungeonMaster', 'AltarOfAscension'
    ];
    
    for (const contractName of contractsNeedingDungeonCore) {
      try {
        const contract = await ethers.getContractAt(contractName, DEPLOYED_CONTRACTS[contractName]);
        const tx = await contract.setDungeonCore(DEPLOYED_CONTRACTS.DungeonCore, {
          gasLimit: 200000
        });
        await tx.wait();
        console.log(`✅ ${contractName}.setDungeonCore 完成`);
      } catch (error) {
        console.log(`⚠️ ${contractName}.setDungeonCore 失敗或已設置: ${error.message}`);
      }
    }
    
    // 2. 設置 DungeonMaster 的 DungeonStorage
    console.log("\n📋 Step 2: 設置 DungeonMaster 的 DungeonStorage...");
    const dungeonMaster = await ethers.getContractAt('DungeonMaster', DEPLOYED_CONTRACTS.DungeonMaster);
    try {
      const tx = await dungeonMaster.setDungeonStorage(DEPLOYED_CONTRACTS.DungeonStorage);
      await tx.wait();
      console.log("✅ DungeonMaster.setDungeonStorage 完成");
    } catch (error) {
      console.log(`⚠️ DungeonMaster.setDungeonStorage 失敗或已設置: ${error.message}`);
    }
    
    // 3. 設置 DungeonStorage 的 DungeonMaster
    console.log("\n📋 Step 3: 設置 DungeonStorage 的 DungeonMaster...");
    const dungeonStorage = await ethers.getContractAt('DungeonStorage', DEPLOYED_CONTRACTS.DungeonStorage);
    try {
      const tx = await dungeonStorage.setDungeonMaster(DEPLOYED_CONTRACTS.DungeonMaster);
      await tx.wait();
      console.log("✅ DungeonStorage.setDungeonMaster 完成");
    } catch (error) {
      console.log(`⚠️ DungeonStorage.setDungeonMaster 失敗或已設置: ${error.message}`);
    }
    
    // 4. 設置平台費
    console.log("\n📋 Step 4: 設置平台費...");
    const hero = await ethers.getContractAt('Hero', DEPLOYED_CONTRACTS.Hero);
    const relic = await ethers.getContractAt('Relic', DEPLOYED_CONTRACTS.Relic);
    const party = await ethers.getContractAt('Party', DEPLOYED_CONTRACTS.Party);
    const altar = await ethers.getContractAt('AltarOfAscension', DEPLOYED_CONTRACTS.AltarOfAscension);
    
    for (const [contract, name] of [[hero, 'Hero'], [relic, 'Relic'], [altar, 'AltarOfAscension']]) {
      try {
        const tx = await contract.setPlatformFee(GAME_CONFIG.platformFee);
        await tx.wait();
        console.log(`✅ ${name}.setPlatformFee 完成`);
      } catch (error) {
        console.log(`⚠️ ${name}.setPlatformFee 失敗或已設置`);
      }
    }
    
    try {
      const tx = await party.setFee(GAME_CONFIG.partyFee);
      await tx.wait();
      console.log(`✅ Party.setFee 完成`);
    } catch (error) {
      console.log(`⚠️ Party.setFee 失敗或已設置`);
    }
    
    // 5. 設置 Base URIs
    console.log("\n📋 Step 5: 設置 Base URIs...");
    for (const [contractName, uri] of Object.entries(GAME_CONFIG.baseURIs)) {
      if (DEPLOYED_CONTRACTS[contractName]) {
        try {
          const contract = await ethers.getContractAt(contractName, DEPLOYED_CONTRACTS[contractName]);
          const tx = await contract.setBaseURI(uri);
          await tx.wait();
          console.log(`✅ ${contractName}.setBaseURI 完成`);
        } catch (error) {
          console.log(`⚠️ ${contractName}.setBaseURI 失敗或已設置`);
        }
      }
    }
    
    // 6. 初始化地城
    console.log("\n📋 Step 6: 初始化地城數據...");
    for (const dungeon of GAME_CONFIG.dungeons) {
      try {
        const tx = await dungeonStorage.initializeDungeon(
          dungeon.id,
          dungeon.power,
          ethers.parseEther(dungeon.rewardUSD.toString()),
          dungeon.rate
        );
        await tx.wait();
        console.log(`✅ 地城 ${dungeon.id} 初始化完成`);
      } catch (error) {
        console.log(`⚠️ 地城 ${dungeon.id} 初始化失敗或已設置`);
      }
    }
    
    // 7. 測試 canMint 函數
    console.log("\n📋 Step 7: 測試新功能...");
    try {
      const canMint = await hero.canMint(deployer.address);
      console.log(`✅ Hero.canMint 測試成功，返回: ${canMint}`);
    } catch (error) {
      console.log(`❌ Hero.canMint 測試失敗: ${error.message}`);
    }
    
    // 保存最終配置
    const fs = require('fs');
    const path = require('path');
    
    const finalConfig = {
      network: "BSC Mainnet",
      deploymentDate: new Date().toISOString(),
      deployer: deployer.address,
      contracts: DEPLOYED_CONTRACTS,
      gameConfig: {
        platformFee: ethers.formatEther(GAME_CONFIG.platformFee),
        partyFee: ethers.formatEther(GAME_CONFIG.partyFee),
        mintPriceUSD: ethers.formatEther(GAME_CONFIG.mintPriceUSD)
      },
      status: "completed"
    };
    
    const configFile = path.join(__dirname, '../deployments/v25-final-config.json');
    fs.writeFileSync(configFile, JSON.stringify(finalConfig, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ V25 部署設置完成！");
    console.log("配置已保存到:", configFile);
    console.log("\n⚠️ 接下來需要：");
    console.log("1. 更新 .env.v25 文件的合約地址");
    console.log("2. 執行: node scripts/ultimate-config-system.js sync");
    console.log("3. 重啟前端服務");
    
  } catch (error) {
    console.error("\n❌ 設置失敗:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("致命錯誤:", error);
    process.exit(1);
  });
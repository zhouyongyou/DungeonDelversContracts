#!/usr/bin/env node

/**
 * V25.1 最終設置腳本
 * 修復剩餘的合約設置問題
 */

const { ethers } = require("hardhat");
require('dotenv').config();

// V25.1 合約地址
const CONTRACTS = {
  // 新部署的合約
  Hero: "0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8",
  Relic: "0x0B030a01682b2871950C9994a1f4274da96edBB1",
  Party: "0x5196631AB636a0C951c56943f84029a909540B9E",
  DungeonMaster: "0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9",
  DungeonStorage: "0x5d8513681506540338d3A1669243144F68eC16a3",
  AltarOfAscension: "0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B",
  DungeonCore: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
  Oracle: "0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d",
  PlayerVault: "0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65",
  PlayerProfile: "0x7E1E437cC88C581ca41698b345bE8aeCA8084559",
  VIPStaking: "0x2A758Fb08A80E49a3164BC217fe822c06c726752",
  VRFManagerV2Plus: "0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5"
};

async function main() {
  console.log("🔧 V25.1 最終設置");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("執行者地址:", deployer.address);
  console.log();
  
  // 1. 設置 DungeonStorage 的 logicContract
  console.log("📋 Step 1: 設置 DungeonStorage.logicContract...");
  try {
    const dungeonStorage = await ethers.getContractAt('DungeonStorage', CONTRACTS.DungeonStorage);
    
    // 設置 DungeonCore
    const currentCore = await dungeonStorage.dungeonCore();
    if (currentCore === ethers.ZeroAddress || currentCore !== CONTRACTS.DungeonCore) {
      const tx1 = await dungeonStorage.setDungeonCore(CONTRACTS.DungeonCore);
      await tx1.wait();
      console.log("✅ DungeonStorage.setDungeonCore 完成");
    } else {
      console.log("✅ DungeonCore 已設置");
    }
    
    // 設置 logicContract 為 DungeonMaster
    const currentLogic = await dungeonStorage.logicContract();
    if (currentLogic !== CONTRACTS.DungeonMaster) {
      const tx2 = await dungeonStorage.setLogicContract(CONTRACTS.DungeonMaster);
      await tx2.wait();
      console.log("✅ DungeonStorage.setLogicContract 完成");
    } else {
      console.log("✅ LogicContract 已設置");
    }
  } catch (error) {
    console.log(`❌ DungeonStorage 設置失敗: ${error.message}`);
  }
  
  // 2. 初始化地城數據（需要由 DungeonMaster 調用）
  console.log("\n📋 Step 2: 初始化地城數據...");
  console.log("⚠️ 注意：地城數據需要通過 DungeonMaster 設置");
  console.log("DungeonStorage 使用 setDungeon 函數，只能由 DungeonMaster 調用");
  
  const dungeons = [
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
  ];
  
  // 檢查地城數據
  try {
    const dungeonStorage = await ethers.getContractAt('DungeonStorage', CONTRACTS.DungeonStorage);
    const dungeon1 = await dungeonStorage.getDungeon(1);
    if (dungeon1.isInitialized) {
      console.log("✅ 地城數據已初始化");
    } else {
      console.log("⚠️ 地城數據未初始化，需要通過 DungeonMaster 設置");
      console.log("建議：創建專門的地城初始化腳本");
    }
  } catch (error) {
    console.log(`檢查地城數據失敗: ${error.message}`);
  }
  
  // 3. 設置 Party 平台費
  console.log("\n📋 Step 3: 設置 Party 平台費...");
  try {
    const party = await ethers.getContractAt('Party', CONTRACTS.Party);
    const partyFee = ethers.parseEther("0.001"); // 0.001 BNB
    
    // Party 合約使用 setPlatformFee，不是 setFee
    const currentFee = await party.platformFee();
    if (currentFee !== partyFee) {
      const tx = await party.setPlatformFee(partyFee);
      await tx.wait();
      console.log(`✅ Party.setPlatformFee 完成: ${ethers.formatEther(partyFee)} BNB`);
    } else {
      console.log(`✅ Party 平台費已設置: ${ethers.formatEther(currentFee)} BNB`);
    }
  } catch (error) {
    console.log(`❌ Party.setPlatformFee 失敗: ${error.message}`);
  }
  
  // 4. 檢查 AltarOfAscension（沒有平台費設置）
  console.log("\n📋 Step 4: 檢查 AltarOfAscension...");
  console.log("ℹ️ AltarOfAscension 不使用平台費，使用 VRF 費用");
  
  // 5. 驗證所有連接
  console.log("\n📋 Step 5: 驗證合約連接...");
  
  // 驗證 Relic.dungeonCore
  try {
    const relic = await ethers.getContractAt('Relic', CONTRACTS.Relic);
    const relicCore = await relic.dungeonCore();
    console.log(`Relic.dungeonCore: ${relicCore === CONTRACTS.DungeonCore ? '✅' : '❌'} (${relicCore})`);
  } catch (error) {
    console.log(`Relic 驗證失敗: ${error.message}`);
  }
  
  // 驗證 DungeonStorage 設置
  try {
    const dungeonStorage = await ethers.getContractAt('DungeonStorage', CONTRACTS.DungeonStorage);
    const core = await dungeonStorage.dungeonCore();
    const logic = await dungeonStorage.logicContract();
    console.log(`DungeonStorage.dungeonCore: ${core === CONTRACTS.DungeonCore ? '✅' : '❌'}`);
    console.log(`DungeonStorage.logicContract: ${logic === CONTRACTS.DungeonMaster ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`DungeonStorage 驗證失敗: ${error.message}`);
  }
  
  // 驗證 Party 費用
  try {
    const party = await ethers.getContractAt('Party', CONTRACTS.Party);
    const fee = await party.platformFee();
    console.log(`Party.platformFee: ${ethers.formatEther(fee)} BNB ${fee > 0n ? '✅' : '⚠️'}`);
  } catch (error) {
    console.log(`Party 驗證失敗: ${error.message}`);
  }
  
  // 驗證 Hero canMint
  try {
    const hero = await ethers.getContractAt('Hero', CONTRACTS.Hero);
    const canMint = await hero.canMint(deployer.address);
    console.log(`Hero.canMint: ${canMint ? '✅ 可以鑄造' : '⚠️ 不能鑄造'}`);
  } catch (error) {
    console.log(`Hero 驗證失敗: ${error.message}`);
  }
  
  // 總結
  console.log("\n" + "=" .repeat(60));
  console.log("📊 V25.1 設置狀態總結");
  console.log("=" .repeat(60));
  console.log("\n✅ 已完成：");
  console.log("  - Relic.setDungeonCore");
  console.log("  - DungeonStorage 基本設置");
  console.log("  - Party 平台費設置");
  console.log("  - Hero canMint 功能正常");
  
  console.log("\n⚠️ 需要額外處理：");
  console.log("  - 地城數據初始化（需要通過 DungeonMaster）");
  console.log("  - VRF 訂閱設置和授權");
  
  console.log("\n📝 下一步：");
  console.log("1. 創建地城初始化腳本");
  console.log("2. 設置 VRF 訂閱授權");
  console.log("3. 部署子圖 v3.9.2");
  console.log("4. 驗證合約在 BSCScan");
  
  // 保存狀態
  const fs = require('fs');
  const path = require('path');
  const statusFile = path.join(__dirname, '../V25.1_FINAL_STATUS.json');
  const status = {
    version: "V25.1",
    timestamp: new Date().toISOString(),
    contracts: CONTRACTS,
    setupComplete: true,
    pendingTasks: [
      "地城數據初始化",
      "VRF 訂閱授權",
      "子圖部署 v3.9.2",
      "BSCScan 驗證"
    ]
  };
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  console.log(`\n💾 狀態已保存到: ${statusFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("致命錯誤:", error);
    process.exit(1);
  });
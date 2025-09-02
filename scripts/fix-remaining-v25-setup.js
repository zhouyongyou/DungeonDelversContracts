#!/usr/bin/env node

/**
 * 修復 V25 剩餘的設置項目
 */

const { ethers } = require("hardhat");
require('dotenv').config();

// V25 部署的合約地址
const CONTRACTS = {
  Relic: "0x0B030a01682b2871950C9994a1f4274da96edBB1",
  Party: "0x5196631AB636a0C951c56943f84029a909540B9E",
  AltarOfAscension: "0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B",
  DungeonStorage: "0x5d8513681506540338d3A1669243144F68eC16a3",
  DungeonCore: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
  DungeonMaster: "0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9"
};

// 地城配置
const DUNGEONS = [
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

async function main() {
  console.log("🔧 修復 V25 剩餘設置項目");
  console.log("=" .repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("執行者地址:", deployer.address);
  console.log();
  
  let successCount = 0;
  let failCount = 0;
  
  // 1. 修復 Relic.setDungeonCore
  console.log("📋 Step 1: 設置 Relic.setDungeonCore...");
  try {
    const relic = await ethers.getContractAt('Relic', CONTRACTS.Relic);
    
    // 檢查是否已設置
    const currentCore = await relic.dungeonCore();
    if (currentCore === ethers.ZeroAddress || currentCore !== CONTRACTS.DungeonCore) {
      const tx = await relic.setDungeonCore(CONTRACTS.DungeonCore, {
        gasLimit: 200000,
        gasPrice: ethers.parseUnits("5", "gwei") // 設置較高的 gas price
      });
      await tx.wait();
      console.log("✅ Relic.setDungeonCore 完成");
      successCount++;
    } else {
      console.log("✅ Relic.setDungeonCore 已設置");
      successCount++;
    }
  } catch (error) {
    console.log(`❌ Relic.setDungeonCore 失敗: ${error.message}`);
    failCount++;
  }
  
  // 2. 初始化 DungeonStorage 地城數據
  console.log("\n📋 Step 2: 初始化地城數據...");
  const dungeonStorage = await ethers.getContractAt('DungeonStorage', CONTRACTS.DungeonStorage);
  
  // 先設置 DungeonMaster 權限
  try {
    const currentMaster = await dungeonStorage.dungeonMaster();
    if (currentMaster === ethers.ZeroAddress || currentMaster !== CONTRACTS.DungeonMaster) {
      const tx = await dungeonStorage.setDungeonMaster(CONTRACTS.DungeonMaster, {
        gasLimit: 200000
      });
      await tx.wait();
      console.log("✅ DungeonStorage.setDungeonMaster 完成");
    }
  } catch (error) {
    console.log(`⚠️ DungeonStorage.setDungeonMaster: ${error.message}`);
  }
  
  // 初始化每個地城
  for (const dungeon of DUNGEONS) {
    try {
      // 檢查地城是否已存在
      const dungeonData = await dungeonStorage.getDungeon(dungeon.id);
      if (dungeonData.requiredPower === 0n) {
        const tx = await dungeonStorage.initializeDungeon(
          dungeon.id,
          dungeon.power,
          ethers.parseEther(dungeon.rewardUSD.toString()),
          dungeon.rate,
          {
            gasLimit: 300000
          }
        );
        await tx.wait();
        console.log(`✅ 地城 ${dungeon.id} 初始化完成`);
        successCount++;
      } else {
        console.log(`✅ 地城 ${dungeon.id} 已存在`);
      }
    } catch (error) {
      console.log(`❌ 地城 ${dungeon.id} 初始化失敗: ${error.message}`);
      failCount++;
    }
  }
  
  // 3. 設置 Party 費用
  console.log("\n📋 Step 3: 設置 Party 費用...");
  try {
    const party = await ethers.getContractAt('Party', CONTRACTS.Party);
    const partyFee = ethers.parseEther("0.001"); // 0.001 BNB
    
    // 檢查當前費用
    const currentFee = await party.fee();
    if (currentFee !== partyFee) {
      const tx = await party.setFee(partyFee, {
        gasLimit: 100000
      });
      await tx.wait();
      console.log(`✅ Party.setFee 完成: ${ethers.formatEther(partyFee)} BNB`);
      successCount++;
    } else {
      console.log(`✅ Party 費用已設置: ${ethers.formatEther(currentFee)} BNB`);
      successCount++;
    }
  } catch (error) {
    console.log(`❌ Party.setFee 失敗: ${error.message}`);
    failCount++;
  }
  
  // 4. 設置 AltarOfAscension 平台費
  console.log("\n📋 Step 4: 設置 AltarOfAscension 平台費...");
  try {
    const altar = await ethers.getContractAt('AltarOfAscension', CONTRACTS.AltarOfAscension);
    const platformFee = ethers.parseEther("0.0000001011"); // 極小費用（測試）
    
    // 檢查當前費用
    const currentFee = await altar.platformFee();
    if (currentFee !== platformFee) {
      const tx = await altar.setPlatformFee(platformFee, {
        gasLimit: 100000
      });
      await tx.wait();
      console.log(`✅ AltarOfAscension.setPlatformFee 完成: ${ethers.formatEther(platformFee)} BNB`);
      successCount++;
    } else {
      console.log(`✅ AltarOfAscension 平台費已設置: ${ethers.formatEther(currentFee)} BNB`);
      successCount++;
    }
  } catch (error) {
    console.log(`❌ AltarOfAscension.setPlatformFee 失敗: ${error.message}`);
    failCount++;
  }
  
  // 5. 驗證所有設置
  console.log("\n📋 Step 5: 驗證所有設置...");
  
  try {
    // 驗證 Relic
    const relic = await ethers.getContractAt('Relic', CONTRACTS.Relic);
    const relicCore = await relic.dungeonCore();
    console.log(`Relic.dungeonCore: ${relicCore === CONTRACTS.DungeonCore ? '✅' : '❌'}`);
    
    // 驗證地城數據
    const dungeon1 = await dungeonStorage.getDungeon(1);
    console.log(`地城1 power: ${dungeon1.requiredPower > 0n ? '✅' : '❌'} (${dungeon1.requiredPower})`);
    
    // 驗證 Party 費用
    const party = await ethers.getContractAt('Party', CONTRACTS.Party);
    const partyFee = await party.fee();
    console.log(`Party 費用: ${partyFee > 0n ? '✅' : '❌'} (${ethers.formatEther(partyFee)} BNB)`);
    
    // 驗證 Altar 平台費
    const altar = await ethers.getContractAt('AltarOfAscension', CONTRACTS.AltarOfAscension);
    const altarFee = await altar.platformFee();
    console.log(`Altar 平台費: ${altarFee >= 0n ? '✅' : '❌'} (${ethers.formatEther(altarFee)} BNB)`);
    
  } catch (error) {
    console.log(`驗證失敗: ${error.message}`);
  }
  
  // 總結
  console.log("\n" + "=" .repeat(60));
  console.log("📊 執行總結");
  console.log("=" .repeat(60));
  console.log(`✅ 成功: ${successCount} 項`);
  console.log(`❌ 失敗: ${failCount} 項`);
  
  if (failCount === 0) {
    console.log("\n🎉 所有設置已完成！");
  } else {
    console.log(`\n⚠️ 有 ${failCount} 項設置失敗，請檢查並重試`);
  }
  
  // 保存狀態
  const fs = require('fs');
  const path = require('path');
  const statusFile = path.join(__dirname, '../V25_SETUP_STATUS.json');
  const status = {
    timestamp: new Date().toISOString(),
    success: successCount,
    failed: failCount,
    contracts: CONTRACTS,
    completed: failCount === 0
  };
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  console.log(`\n狀態已保存到: ${statusFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("致命錯誤:", error);
    process.exit(1);
  });
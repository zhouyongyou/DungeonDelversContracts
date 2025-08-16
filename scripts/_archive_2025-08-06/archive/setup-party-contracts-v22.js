const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 載入 V22 配置
const v22Config = require('../config/v22-config.js');

async function main() {
  console.log("🎮 設置 Party 合約連接 (V22)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("執行者地址:", deployer.address);

  // 從 V22 配置獲取地址
  const partyAddress = v22Config.contracts.PARTY.address;
  const heroAddress = v22Config.contracts.HERO.address;
  const relicAddress = v22Config.contracts.RELIC.address;
  const dungeonCoreAddress = v22Config.contracts.DUNGEONCORE.address;

  console.log("📋 V22 合約地址:");
  console.log("Party:", partyAddress);
  console.log("Hero:", heroAddress);
  console.log("Relic:", relicAddress);
  console.log("DungeonCore:", dungeonCoreAddress);
  console.log("");

  // 連接到 Party 合約
  const party = await ethers.getContractAt(
    "contracts/current/nft/Party.sol:Party",
    partyAddress
  );

  try {
    // 1. 檢查當前設置
    console.log("🔍 檢查當前合約設置...");
    
    try {
      const currentHero = await party.heroContract();
      console.log("當前 Hero 合約:", currentHero);
      
      const currentRelic = await party.relicContract();
      console.log("當前 Relic 合約:", currentRelic);
      
      const currentDungeonCore = await party.dungeonCoreContract();
      console.log("當前 DungeonCore 合約:", currentDungeonCore);
    } catch (error) {
      console.log("❌ 無法讀取當前設置（合約可能尚未初始化）");
    }

    console.log("\n⚙️ 開始設置合約連接...");

    // 2. 設置 Hero 合約
    if (await needsUpdate(party, "heroContract", heroAddress)) {
      console.log("\n📝 設置 Hero 合約地址...");
      const tx1 = await party.setHeroContract(heroAddress);
      console.log("交易哈希:", tx1.hash);
      await tx1.wait();
      console.log("✅ Hero 合約設置成功!");
    } else {
      console.log("✅ Hero 合約已正確設置");
    }

    // 3. 設置 Relic 合約
    if (await needsUpdate(party, "relicContract", relicAddress)) {
      console.log("\n📝 設置 Relic 合約地址...");
      const tx2 = await party.setRelicContract(relicAddress);
      console.log("交易哈希:", tx2.hash);
      await tx2.wait();
      console.log("✅ Relic 合約設置成功!");
    } else {
      console.log("✅ Relic 合約已正確設置");
    }

    // 4. 設置 DungeonCore 合約
    if (await needsUpdate(party, "dungeonCoreContract", dungeonCoreAddress)) {
      console.log("\n📝 設置 DungeonCore 合約地址...");
      const tx3 = await party.setDungeonCoreContract(dungeonCoreAddress);
      console.log("交易哈希:", tx3.hash);
      await tx3.wait();
      console.log("✅ DungeonCore 合約設置成功!");
    } else {
      console.log("✅ DungeonCore 合約已正確設置");
    }

    // 5. 驗證設置
    console.log("\n🔍 驗證最終設置...");
    const finalHero = await party.heroContract();
    const finalRelic = await party.relicContract();
    const finalDungeonCore = await party.dungeonCoreContract();

    const success = 
      finalHero.toLowerCase() === heroAddress.toLowerCase() &&
      finalRelic.toLowerCase() === relicAddress.toLowerCase() &&
      finalDungeonCore.toLowerCase() === dungeonCoreAddress.toLowerCase();

    if (success) {
      console.log("✅ 所有合約連接已正確設置!");
      console.log("  Hero:", finalHero);
      console.log("  Relic:", finalRelic);
      console.log("  DungeonCore:", finalDungeonCore);
      
      // 保存設置記錄
      const timestamp = new Date().toISOString();
      const setupRecord = {
        timestamp,
        party: partyAddress,
        settings: {
          heroContract: finalHero,
          relicContract: finalRelic,
          dungeonCoreContract: finalDungeonCore
        },
        executor: deployer.address
      };
      
      const recordPath = path.join(__dirname, '../deployments/party-setup-v22.json');
      fs.writeFileSync(recordPath, JSON.stringify(setupRecord, null, 2));
      console.log(`\n📄 設置記錄已保存到: ${recordPath}`);
    } else {
      console.log("❌ 設置驗證失敗！");
    }

  } catch (error) {
    console.error("\n❌ 設置過程出錯:", error.message);
    if (error.reason) {
      console.error("原因:", error.reason);
    }
    throw error;
  }
}

// 檢查是否需要更新
async function needsUpdate(contract, getter, expectedAddress) {
  try {
    const currentAddress = await contract[getter]();
    return currentAddress.toLowerCase() !== expectedAddress.toLowerCase();
  } catch {
    return true; // 如果讀取失敗，假設需要更新
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
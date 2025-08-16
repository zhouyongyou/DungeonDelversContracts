const { ethers } = require("hardhat");
const v22Config = require('../config/v22-config.js');

async function main() {
  console.log("🔍 檢查所有合約連接狀態 (V22)...\n");

  const [signer] = await ethers.getSigners();
  console.log("檢查者地址:", signer.address);
  console.log("=" * 50);

  const results = [];

  // 1. 檢查 DungeonCore 連接
  console.log("\n📋 DungeonCore 合約連接:");
  try {
    const dungeonCore = await ethers.getContractAt(
      "contracts/current/core/DungeonCore.sol:DungeonCore", 
      v22Config.contracts.DUNGEONCORE.address
    );

    const modules = [
      { name: "Oracle", getter: "oracle" },
      { name: "SoulShard", getter: "soulShard" },
      { name: "Hero", getter: "hero" },
      { name: "Relic", getter: "relic" },
      { name: "Party", getter: "party" },
      { name: "DungeonMaster", getter: "dungeonMaster" },
      { name: "PlayerVault", getter: "playerVault" },
      { name: "PlayerProfile", getter: "playerProfile" },
      { name: "AltarOfAscension", getter: "altarOfAscension" },
      { name: "VIPStaking", getter: "vipStaking" }
    ];

    for (const module of modules) {
      try {
        const address = await dungeonCore[module.getter]();
        const expected = v22Config.contracts[module.name.toUpperCase()]?.address || "N/A";
        const match = address.toLowerCase() === expected?.toLowerCase();
        
        console.log(`  ${module.name}: ${address} ${match ? '✅' : '❌'}`);
        if (!match) {
          console.log(`    預期: ${expected}`);
        }
        
        results.push({ 
          contract: "DungeonCore", 
          module: module.name, 
          current: address, 
          expected, 
          match 
        });
      } catch (error) {
        console.log(`  ${module.name}: ❌ 無法讀取`);
        results.push({ 
          contract: "DungeonCore", 
          module: module.name, 
          error: error.message 
        });
      }
    }
  } catch (error) {
    console.log("❌ 無法連接到 DungeonCore:", error.message);
  }

  // 2. 檢查 Party 合約連接
  console.log("\n📋 Party 合約連接:");
  try {
    const party = await ethers.getContractAt(
      "contracts/current/nft/Party.sol:PartyV3", 
      v22Config.contracts.PARTY.address
    );

    const partyConnections = [
      { name: "Hero", getter: "heroContract", expected: v22Config.contracts.HERO.address },
      { name: "Relic", getter: "relicContract", expected: v22Config.contracts.RELIC.address },
      { name: "DungeonCore", getter: "dungeonCoreContract", expected: v22Config.contracts.DUNGEONCORE.address }
    ];

    for (const conn of partyConnections) {
      try {
        const address = await party[conn.getter]();
        const match = address.toLowerCase() === conn.expected.toLowerCase();
        
        console.log(`  ${conn.name}: ${address} ${match ? '✅' : '❌'}`);
        if (!match) {
          console.log(`    預期: ${conn.expected}`);
        }
        
        results.push({ 
          contract: "Party", 
          module: conn.name, 
          current: address, 
          expected: conn.expected, 
          match 
        });
      } catch (error) {
        console.log(`  ${conn.name}: ❌ 無法讀取`);
        results.push({ 
          contract: "Party", 
          module: conn.name, 
          error: error.message 
        });
      }
    }
  } catch (error) {
    console.log("❌ 無法連接到 Party:", error.message);
  }

  // 3. 檢查 DungeonMaster 連接
  console.log("\n📋 DungeonMaster 合約連接:");
  try {
    const dungeonMaster = await ethers.getContractAt(
      "contracts/current/game/DungeonMaster.sol:DungeonMaster", 
      v22Config.contracts.DUNGEONMASTER.address
    );

    // 檢查 DungeonCore
    try {
      const dungeonCore = await dungeonMaster.dungeonCoreContract();
      const expected = v22Config.contracts.DUNGEONCORE.address;
      const match = dungeonCore.toLowerCase() === expected.toLowerCase();
      
      console.log(`  DungeonCore: ${dungeonCore} ${match ? '✅' : '❌'}`);
      if (!match) {
        console.log(`    預期: ${expected}`);
      }
    } catch (error) {
      console.log(`  DungeonCore: ❌ 無法讀取`);
    }

    // 檢查 DungeonStorage
    try {
      const dungeonStorage = await dungeonMaster.dungeonStorage();
      const expected = v22Config.contracts.DUNGEONSTORAGE.address;
      const match = dungeonStorage.toLowerCase() === expected.toLowerCase();
      
      console.log(`  DungeonStorage: ${dungeonStorage} ${match ? '✅' : '❌'}`);
      if (!match) {
        console.log(`    預期: ${expected}`);
      }
    } catch (error) {
      console.log(`  DungeonStorage: ❌ 無法讀取`);
    }
  } catch (error) {
    console.log("❌ 無法連接到 DungeonMaster:", error.message);
  }

  // 4. 檢查其他合約的 DungeonCore 連接
  const contractsToCheck = [
    { name: "Hero", address: v22Config.contracts.HERO.address },
    { name: "Relic", address: v22Config.contracts.RELIC.address },
    { name: "PlayerVault", address: v22Config.contracts.PLAYERVAULT.address },
    { name: "AltarOfAscension", address: v22Config.contracts.ALTAROFASCENSION.address },
    { name: "VIPStaking", address: v22Config.contracts.VIPSTAKING.address }
  ];

  console.log("\n📋 其他合約的 DungeonCore 連接:");
  for (const contract of contractsToCheck) {
    try {
      const instance = await ethers.getContractAt(contract.name, contract.address);
      const dungeonCore = await instance.dungeonCoreContract();
      const expected = v22Config.contracts.DUNGEONCORE.address;
      const match = dungeonCore.toLowerCase() === expected.toLowerCase();
      
      console.log(`  ${contract.name}: ${dungeonCore} ${match ? '✅' : '❌'}`);
      if (!match) {
        console.log(`    預期: ${expected}`);
      }
    } catch (error) {
      console.log(`  ${contract.name}: ❌ 無法讀取 DungeonCore 連接`);
    }
  }

  // 總結
  console.log("\n📊 檢查總結:");
  const issues = results.filter(r => !r.match || r.error);
  if (issues.length === 0) {
    console.log("✅ 所有合約連接都正確設置!");
  } else {
    console.log(`❌ 發現 ${issues.length} 個問題需要修復:`);
    issues.forEach(issue => {
      if (issue.error) {
        console.log(`  - ${issue.contract}.${issue.module}: ${issue.error}`);
      } else {
        console.log(`  - ${issue.contract}.${issue.module}: ${issue.current} → ${issue.expected}`);
      }
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
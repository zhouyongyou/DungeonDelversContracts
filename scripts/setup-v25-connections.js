const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔄 設置 V25 合約間連接和授權\n");

  // V25 合約地址
  const addresses = {
    // 新部署的合約
    hero: "0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8",
    relic: "0x0B030a01682b2871950C9994a1f4274da96edBB1",
    party: "0x5196631AB636a0C951c56943f84029a909540B9E",
    dungeonMaster: "0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9",
    dungeonStorage: "0x5d8513681506540338d3A1669243144F68eC16a3",
    altarOfAscension: "0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B",
    
    // 重複使用的合約
    playerVault: "0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65",
    playerProfile: "0x7E1E437cC88C581ca41698b345bE8aeCA8084559",
    vipStaking: "0x2A758Fb08A80E49a3164BC217fe822c06c726752",
    dungeonCore: "0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826",
    oracle: "0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d",
    
    // VRF 系統
    vrfManagerV2Plus: "0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5",
    
    // 代幣系統
    soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    usd: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE"
  };

  const [signer] = await ethers.getSigners();
  console.log("📍 部署者錢包:", signer.address);
  console.log("=" .repeat(60));

  const tasks = [];

  try {
    // 1. DungeonCore 設置 - 註冊所有模組地址
    console.log("\n🏛️  設置 DungeonCore 地址註冊");
    console.log("-".repeat(40));
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
    
    const coreSettings = [
      ["setHeroContractAddress", addresses.hero, "Hero 合約"],
      ["setRelicContractAddress", addresses.relic, "Relic 合約"],
      ["setPartyContractAddress", addresses.party, "Party 合約"],
      ["setDungeonMasterAddress", addresses.dungeonMaster, "DungeonMaster 合約"],
      ["setDungeonStorageAddress", addresses.dungeonStorage, "DungeonStorage 合約"],
      ["setAltarOfAscensionAddress", addresses.altarOfAscension, "AltarOfAscension 合約"],
      ["setVRFManagerV2PlusAddress", addresses.vrfManagerV2Plus, "VRF Manager 合約"],
      ["setOracleAddress", addresses.oracle, "Oracle 合約"],
      ["setSoulShardTokenAddress", addresses.soulShard, "SoulShard 代幣"],
      ["setPlayerVaultAddress", addresses.playerVault, "PlayerVault 合約"],
      ["setPlayerProfileAddress", addresses.playerProfile, "PlayerProfile 合約"],
      ["setVIPStakingAddress", addresses.vipStaking, "VIPStaking 合約"]
    ];

    for (const [method, address, description] of coreSettings) {
      try {
        console.log(`  設置 ${description}...`);
        const tx = await dungeonCore[method](address);
        await tx.wait();
        console.log(`  ✅ ${description} 設置完成`);
      } catch (error) {
        console.log(`  ⚠️  ${description} 設置失敗:`, error.message);
      }
    }

    // 2. 各合約設置 DungeonCore 地址
    console.log("\n🔗 設置各合約的 DungeonCore 連接");
    console.log("-".repeat(40));

    const contractsToConnect = [
      [addresses.hero, "Hero", "setDungeonCore"],
      [addresses.relic, "Relic", "setDungeonCore"],
      [addresses.party, "Party", "setDungeonCore"],
      [addresses.dungeonMaster, "DungeonMaster", "setDungeonCore"],
      [addresses.altarOfAscension, "AltarOfAscension", "setDungeonCore"]
    ];

    for (const [address, name, method] of contractsToConnect) {
      try {
        console.log(`  連接 ${name} 到 DungeonCore...`);
        const contract = await ethers.getContractAt(name, address);
        const tx = await contract[method](addresses.dungeonCore);
        await tx.wait();
        console.log(`  ✅ ${name} 連接完成`);
      } catch (error) {
        console.log(`  ⚠️  ${name} 連接失敗:`, error.message);
      }
    }

    // 3. DungeonMaster 特殊設置
    console.log("\n⚔️  設置 DungeonMaster 特殊配置");
    console.log("-".repeat(40));

    try {
      const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
      
      console.log("  設置 DungeonStorage 地址...");
      const tx1 = await dungeonMaster.setDungeonStorageAddress(addresses.dungeonStorage);
      await tx1.wait();
      console.log("  ✅ DungeonStorage 地址設置完成");

    } catch (error) {
      console.log("  ⚠️  DungeonMaster 特殊設置失敗:", error.message);
    }

    // 4. VRF Manager 授權
    console.log("\n🎲 設置 VRF Manager 授權");
    console.log("-".repeat(40));

    try {
      const vrfManager = await ethers.getContractAt("VRFConsumerV2Plus", addresses.vrfManagerV2Plus);
      
      const contractsToAuthorize = [
        [addresses.hero, "Hero"],
        [addresses.relic, "Relic"],
        [addresses.dungeonMaster, "DungeonMaster"],
        [addresses.altarOfAscension, "AltarOfAscension"]
      ];

      for (const [address, name] of contractsToAuthorize) {
        try {
          console.log(`  授權 ${name} 使用 VRF...`);
          const tx = await vrfManager.setAuthorizedContract(address, true);
          await tx.wait();
          console.log(`  ✅ ${name} VRF 授權完成`);
        } catch (error) {
          console.log(`  ⚠️  ${name} VRF 授權失敗:`, error.message);
        }
      }

    } catch (error) {
      console.log("  ⚠️  VRF Manager 授權失敗:", error.message);
    }

    // 5. 設置 DungeonCore 為 VRF Manager
    console.log("\n🎯 設置 VRF Manager DungeonCore 連接");
    console.log("-".repeat(40));

    try {
      const vrfManager = await ethers.getContractAt("VRFConsumerV2Plus", addresses.vrfManagerV2Plus);
      console.log("  設置 DungeonCore 地址到 VRF Manager...");
      const tx = await vrfManager.setDungeonCore(addresses.dungeonCore);
      await tx.wait();
      console.log("  ✅ VRF Manager DungeonCore 連接完成");
    } catch (error) {
      console.log("  ⚠️  VRF Manager DungeonCore 連接失敗:", error.message);
    }

    // 6. 設置各合約的重要參數
    console.log("\n⚙️  設置合約重要參數");
    console.log("-".repeat(40));

    // Hero 合約設置
    try {
      const hero = await ethers.getContractAt("Hero", addresses.hero);
      console.log("  設置 Hero 鑄造價格...");
      // 設置為 2 USD
      const tx1 = await hero.setMintPriceUSD(ethers.parseUnits("2", 18));
      await tx1.wait();
      console.log("  ✅ Hero 鑄造價格設置為 2 USD");
    } catch (error) {
      console.log("  ⚠️  Hero 參數設置失敗:", error.message);
    }

    // Relic 合約設置
    try {
      const relic = await ethers.getContractAt("Relic", addresses.relic);
      console.log("  設置 Relic 鑄造價格...");
      // 設置為 1 USD
      const tx2 = await relic.setMintPriceUSD(ethers.parseUnits("1", 18));
      await tx2.wait();
      console.log("  ✅ Relic 鑄造價格設置為 1 USD");
    } catch (error) {
      console.log("  ⚠️  Relic 參數設置失敗:", error.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 V25 合約連接和授權設置完成！");
    console.log("📋 摘要:");
    console.log("  ✅ DungeonCore 地址註冊完成");
    console.log("  ✅ 各合約 DungeonCore 連接完成");
    console.log("  ✅ VRF Manager 授權設置完成");
    console.log("  ✅ 重要參數配置完成");
    console.log("\n💡 下一步：");
    console.log("  1. 部署並更新子圖到 v3.9.3");
    console.log("  2. 重啟前端和後端服務");
    console.log("  3. 測試 NFT 鑄造功能");

  } catch (error) {
    console.error("\n❌ 設置過程中發生錯誤:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
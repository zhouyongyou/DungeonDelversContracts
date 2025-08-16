const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 開始設定 V7 合約...\n");

  const [deployer] = await ethers.getSigners();
  console.log("使用帳戶:", deployer.address);
  
  // 合約地址
  const addresses = {
    dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",
    dungeonMasterV7: "0x108ed6B38D30099E1d2D141Ef0813938E279C0Fe",
    partyV3: "0xe4A55375f7Aba70785f958E2661E08F9FD5f7ab1",
    hero: "0x929a4187a462314fCC480ff547019fA122A283f0",
    relic: "0x1067295025D21f59C8AcB5E777E42F3866a6D2fF",
    dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
    soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
  };

  // 獲取合約實例
  console.log("📋 獲取合約實例...");
  const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
  const dungeonMasterV7 = await ethers.getContractAt("DungeonMasterV7", addresses.dungeonMasterV7);
  const partyV3 = await ethers.getContractAt("PartyV3", addresses.partyV3);

  console.log("✅ 合約實例已載入\n");

  // 1. DungeonCore 設定
  console.log("=== 1. DungeonCore 設定 ===");
  
  // 檢查當前設定
  const currentDM = await dungeonCore.dungeonMasterAddress();
  const currentParty = await dungeonCore.partyContractAddress();
  
  console.log("當前 DungeonMaster:", currentDM);
  console.log("目標 DungeonMaster:", addresses.dungeonMasterV7);
  
  if (currentDM.toLowerCase() !== addresses.dungeonMasterV7.toLowerCase()) {
    console.log("🔄 設定 DungeonMaster...");
    const tx1 = await dungeonCore.setDungeonMaster(addresses.dungeonMasterV7);
    await tx1.wait();
    console.log("✅ DungeonMaster 已設定");
  } else {
    console.log("✅ DungeonMaster 已是最新");
  }

  console.log("\n當前 Party 合約:", currentParty);
  console.log("目標 Party 合約:", addresses.partyV3);
  
  if (currentParty.toLowerCase() !== addresses.partyV3.toLowerCase()) {
    console.log("🔄 設定 Party 合約...");
    const tx2 = await dungeonCore.setPartyContract(addresses.partyV3);
    await tx2.wait();
    console.log("✅ Party 合約已設定");
  } else {
    console.log("✅ Party 合約已是最新");
  }

  // 2. PartyV3 設定
  console.log("\n=== 2. PartyV3 設定 ===");
  
  try {
    const currentHero = await partyV3.heroContract();
    const currentRelic = await partyV3.relicContract();
    const currentCore = await partyV3.dungeonCoreContract();
    
    console.log("當前 Hero 合約:", currentHero);
    console.log("當前 Relic 合約:", currentRelic);
    console.log("當前 DungeonCore:", currentCore);
    
    if (currentHero === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 Hero 合約...");
      const tx3 = await partyV3.setHeroContract(addresses.hero);
      await tx3.wait();
      console.log("✅ Hero 合約已設定");
    } else {
      console.log("✅ Hero 合約已設定");
    }
    
    if (currentRelic === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 Relic 合約...");
      const tx4 = await partyV3.setRelicContract(addresses.relic);
      await tx4.wait();
      console.log("✅ Relic 合約已設定");
    } else {
      console.log("✅ Relic 合約已設定");
    }
    
    if (currentCore === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 DungeonCore...");
      const tx5 = await partyV3.setDungeonCore(addresses.dungeonCore);
      await tx5.wait();
      console.log("✅ DungeonCore 已設定");
    } else {
      console.log("✅ DungeonCore 已設定");
    }
  } catch (error) {
    console.log("⚠️ PartyV3 可能需要手動設定:", error.message);
  }

  // 3. DungeonMasterV7 設定
  console.log("\n=== 3. DungeonMasterV7 設定 ===");
  
  try {
    const currentDCore = await dungeonMasterV7.dungeonCore();
    const currentDStorage = await dungeonMasterV7.dungeonStorage();
    const currentSoulShard = await dungeonMasterV7.soulShardToken();
    
    console.log("當前 DungeonCore:", currentDCore);
    console.log("當前 DungeonStorage:", currentDStorage);
    console.log("當前 SoulShard:", currentSoulShard);
    
    if (currentDCore === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 DungeonCore...");
      const tx6 = await dungeonMasterV7.setDungeonCore(addresses.dungeonCore);
      await tx6.wait();
      console.log("✅ DungeonCore 已設定");
    } else {
      console.log("✅ DungeonCore 已設定");
    }
    
    if (currentDStorage === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 DungeonStorage...");
      const tx7 = await dungeonMasterV7.setDungeonStorage(addresses.dungeonStorage);
      await tx7.wait();
      console.log("✅ DungeonStorage 已設定");
    } else {
      console.log("✅ DungeonStorage 已設定");
    }
    
    if (currentSoulShard === "0x0000000000000000000000000000000000000000") {
      console.log("🔄 設定 SoulShardToken...");
      const tx8 = await dungeonMasterV7.setSoulShardToken(addresses.soulShard);
      await tx8.wait();
      console.log("✅ SoulShardToken 已設定");
    } else {
      console.log("✅ SoulShardToken 已設定");
    }
  } catch (error) {
    console.log("⚠️ DungeonMasterV7 可能需要手動設定:", error.message);
  }

  console.log("\n🎉 所有合約設定完成！");
  
  // 驗證設定
  console.log("\n=== 驗證最終設定 ===");
  console.log("DungeonCore:");
  console.log("  - DungeonMaster:", await dungeonCore.dungeonMasterAddress());
  console.log("  - Party:", await dungeonCore.partyContractAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
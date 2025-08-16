const hre = require("hardhat");

async function main() {
  console.log("🔍 全面檢查合約互連狀態...\n");
  
  // 所有合約地址
  const contracts = {
    // 新部署 VRF 合約
    VRFConsumerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436",
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscensionVRF: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    
    // 核心合約
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    DungeonStorage: "0x88EF98E7F9095610d7762C30165854f271525B97",
    SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    
    // V25 其他合約
    Oracle: "0x67989939163bCFC57302767722E1988FFac46d64",
    PlayerVault: "0x39523e8eeB6c54fCe65D62ec696cA5ad888eF25c",
    PlayerProfile: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7",
    VipStaking: "0x186a89e5418645459ed0a469FF97C9d4B2ca5355",
    Party: "0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5"
  };
  
  const results = {
    correct: [],
    incorrect: [],
    errors: []
  };
  
  try {
    console.log("=====================================");
    console.log("1️⃣ 檢查 DungeonCore 設置");
    console.log("=====================================");
    
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", contracts.DungeonCore);
    
    const coreSettings = {
      hero: await dungeonCore.heroContractAddress(),
      relic: await dungeonCore.relicContractAddress(),
      dungeonMaster: await dungeonCore.dungeonMasterAddress(),
      altarOfAscension: await dungeonCore.altarOfAscensionAddress(),
      oracle: await dungeonCore.oracleAddress(),
      playerVault: await dungeonCore.playerVaultAddress(),
      playerProfile: await dungeonCore.playerProfileAddress(),
      vipStaking: await dungeonCore.vipStakingAddress(),
      party: await dungeonCore.partyContractAddress()
    };
    
    // 檢查新合約
    if (coreSettings.hero.toLowerCase() === contracts.Hero.toLowerCase()) {
      results.correct.push("DungeonCore.heroContract = Hero ✓");
    } else {
      results.incorrect.push(`DungeonCore.heroContract = ${coreSettings.hero} (應為 ${contracts.Hero})`);
    }
    
    if (coreSettings.relic.toLowerCase() === contracts.Relic.toLowerCase()) {
      results.correct.push("DungeonCore.relicContract = Relic ✓");
    } else {
      results.incorrect.push(`DungeonCore.relicContract = ${coreSettings.relic} (應為 ${contracts.Relic})`);
    }
    
    if (coreSettings.dungeonMaster.toLowerCase() === contracts.DungeonMaster.toLowerCase()) {
      results.correct.push("DungeonCore.dungeonMaster = DungeonMaster ✓");
    } else {
      results.incorrect.push(`DungeonCore.dungeonMaster = ${coreSettings.dungeonMaster} (應為 ${contracts.DungeonMaster})`);
    }
    
    if (coreSettings.altarOfAscension.toLowerCase() === contracts.AltarOfAscensionVRF.toLowerCase()) {
      results.correct.push("DungeonCore.altarOfAscension = AltarOfAscensionVRF ✓");
    } else {
      results.incorrect.push(`DungeonCore.altarOfAscension = ${coreSettings.altarOfAscension} (應為 ${contracts.AltarOfAscensionVRF})`);
    }
    
    console.log("\n=====================================");
    console.log("2️⃣ 檢查 VRF 設置");
    console.log("=====================================");
    
    // 檢查 VRF Manager 設置
    const hero = await hre.ethers.getContractAt("Hero", contracts.Hero);
    const heroVrfManager = await hero.vrfManager();
    if (heroVrfManager.toLowerCase() === contracts.VRFConsumerV2Plus.toLowerCase()) {
      results.correct.push("Hero.vrfManager = VRFConsumerV2Plus ✓");
    } else {
      results.incorrect.push(`Hero.vrfManager = ${heroVrfManager} (應為 ${contracts.VRFConsumerV2Plus})`);
    }
    
    const relic = await hre.ethers.getContractAt("Relic", contracts.Relic);
    const relicVrfManager = await relic.vrfManager();
    if (relicVrfManager.toLowerCase() === contracts.VRFConsumerV2Plus.toLowerCase()) {
      results.correct.push("Relic.vrfManager = VRFConsumerV2Plus ✓");
    } else {
      results.incorrect.push(`Relic.vrfManager = ${relicVrfManager} (應為 ${contracts.VRFConsumerV2Plus})`);
    }
    
    const dungeonMaster = await hre.ethers.getContractAt("DungeonMaster", contracts.DungeonMaster);
    const dmVrfManager = await dungeonMaster.vrfManager();
    if (dmVrfManager.toLowerCase() === contracts.VRFConsumerV2Plus.toLowerCase()) {
      results.correct.push("DungeonMaster.vrfManager = VRFConsumerV2Plus ✓");
    } else {
      results.incorrect.push(`DungeonMaster.vrfManager = ${dmVrfManager} (應為 ${contracts.VRFConsumerV2Plus})`);
    }
    
    console.log("\n=====================================");
    console.log("3️⃣ 檢查 DungeonCore 連接");
    console.log("=====================================");
    
    // 檢查各合約的 DungeonCore 設置
    const heroDungeonCore = await hero.dungeonCore();
    if (heroDungeonCore.toLowerCase() === contracts.DungeonCore.toLowerCase()) {
      results.correct.push("Hero.dungeonCore = DungeonCore ✓");
    } else {
      results.incorrect.push(`Hero.dungeonCore = ${heroDungeonCore} (應為 ${contracts.DungeonCore})`);
    }
    
    const relicDungeonCore = await relic.dungeonCore();
    if (relicDungeonCore.toLowerCase() === contracts.DungeonCore.toLowerCase()) {
      results.correct.push("Relic.dungeonCore = DungeonCore ✓");
    } else {
      results.incorrect.push(`Relic.dungeonCore = ${relicDungeonCore} (應為 ${contracts.DungeonCore})`);
    }
    
    const dmDungeonCore = await dungeonMaster.dungeonCore();
    if (dmDungeonCore.toLowerCase() === contracts.DungeonCore.toLowerCase()) {
      results.correct.push("DungeonMaster.dungeonCore = DungeonCore ✓");
    } else {
      results.incorrect.push(`DungeonMaster.dungeonCore = ${dmDungeonCore} (應為 ${contracts.DungeonCore})`);
    }
    
    console.log("\n=====================================");
    console.log("4️⃣ 檢查其他設置");
    console.log("=====================================");
    
    // 檢查 DungeonStorage
    const dmDungeonStorage = await dungeonMaster.dungeonStorage();
    if (dmDungeonStorage.toLowerCase() === contracts.DungeonStorage.toLowerCase()) {
      results.correct.push("DungeonMaster.dungeonStorage = DungeonStorage ✓");
    } else {
      results.incorrect.push(`DungeonMaster.dungeonStorage = ${dmDungeonStorage} (應為 ${contracts.DungeonStorage})`);
    }
    
    // 檢查 SoulShard Token
    const heroSoulShard = await hero.soulShardToken();
    if (heroSoulShard.toLowerCase() === contracts.SoulShard.toLowerCase()) {
      results.correct.push("Hero.soulShardToken = SoulShard ✓");
    } else {
      results.incorrect.push(`Hero.soulShardToken = ${heroSoulShard} (應為 ${contracts.SoulShard})`);
    }
    
    const relicSoulShard = await relic.soulShardToken();
    if (relicSoulShard.toLowerCase() === contracts.SoulShard.toLowerCase()) {
      results.correct.push("Relic.soulShardToken = SoulShard ✓");
    } else {
      results.incorrect.push(`Relic.soulShardToken = ${relicSoulShard} (應為 ${contracts.SoulShard})`);
    }
    
    // 檢查 Relic 的 AscensionAltar
    const relicAscensionAltar = await relic.ascensionAltarAddress();
    if (relicAscensionAltar.toLowerCase() === contracts.AltarOfAscensionVRF.toLowerCase()) {
      results.correct.push("Relic.ascensionAltarAddress = AltarOfAscensionVRF ✓");
    } else {
      results.incorrect.push(`Relic.ascensionAltarAddress = ${relicAscensionAltar} (應為 ${contracts.AltarOfAscensionVRF})`);
    }
    
  } catch (error) {
    results.errors.push(error.message);
  }
  
  // 顯示結果總結
  console.log("\n=====================================");
  console.log("📊 檢查結果總結");
  console.log("=====================================");
  
  if (results.correct.length > 0) {
    console.log("\n✅ 正確設置 (" + results.correct.length + " 項):");
    results.correct.forEach(item => console.log("   " + item));
  }
  
  if (results.incorrect.length > 0) {
    console.log("\n❌ 錯誤設置 (" + results.incorrect.length + " 項):");
    results.incorrect.forEach(item => console.log("   " + item));
  }
  
  if (results.errors.length > 0) {
    console.log("\n⚠️  檢查錯誤:");
    results.errors.forEach(error => console.log("   " + error));
  }
  
  if (results.incorrect.length === 0 && results.errors.length === 0) {
    console.log("\n🎉 所有合約互連都已正確設置！");
  } else {
    console.log("\n⚠️  發現 " + (results.incorrect.length + results.errors.length) + " 個問題需要修復");
  }
  
  // 保存檢查結果
  const fs = require("fs");
  const report = {
    timestamp: new Date().toISOString(),
    contracts: contracts,
    results: results
  };
  
  const filename = `deployments/connection-check-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 檢查報告已保存到: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log("🔍 檢查 DungeonCore 設置狀況...\n");
  
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  
  // 新部署的合約地址
  const NEW_CONTRACTS = {
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
  };
  
  // V25 版本合約（仍在使用）
  const V25_CONTRACTS = {
    Oracle: "0x67989939163bCFC57302767722E1988FFac46d64",
    PlayerVault: "0x39523e8eeB6c54fCe65D62ec696cA5ad888eF25c",
    PlayerProfile: "0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7",
    VipStaking: "0x186a89e5418645459ed0a469FF97C9d4B2ca5355",
    Party: "0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5"
  };
  
  // 舊合約地址（需要替換）
  const OLD_CONTRACTS = {
    Hero: "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0",
    Relic: "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366",
    DungeonMaster: "0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703",
    AltarOfAscension: "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3"
  };
  
  try {
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", DUNGEON_CORE);
    
    console.log("📋 DungeonCore 當前設置：");
    console.log("=====================================");
    
    // 檢查各個合約地址
    const currentSettings = {
      oracle: await dungeonCore.oracleAddress(),
      playerVault: await dungeonCore.playerVaultAddress(),
      dungeonMaster: await dungeonCore.dungeonMasterAddress(),
      altarOfAscension: await dungeonCore.altarOfAscensionAddress(),
      heroContract: await dungeonCore.heroContractAddress(),
      relicContract: await dungeonCore.relicContractAddress(),
      partyContract: await dungeonCore.partyContractAddress(),
      playerProfile: await dungeonCore.playerProfileAddress(),
      vipStaking: await dungeonCore.vipStakingAddress()
    };
    
    // 檢查並顯示狀態
    console.log("\n🔴 需要更新的合約：");
    let needsUpdate = false;
    
    if (currentSettings.heroContract.toLowerCase() !== NEW_CONTRACTS.Hero.toLowerCase()) {
      console.log(`Hero: ${currentSettings.heroContract} → ${NEW_CONTRACTS.Hero}`);
      needsUpdate = true;
    }
    
    if (currentSettings.relicContract.toLowerCase() !== NEW_CONTRACTS.Relic.toLowerCase()) {
      console.log(`Relic: ${currentSettings.relicContract} → ${NEW_CONTRACTS.Relic}`);
      needsUpdate = true;
    }
    
    if (currentSettings.dungeonMaster.toLowerCase() !== NEW_CONTRACTS.DungeonMaster.toLowerCase()) {
      console.log(`DungeonMaster: ${currentSettings.dungeonMaster} → ${NEW_CONTRACTS.DungeonMaster}`);
      needsUpdate = true;
    }
    
    if (currentSettings.altarOfAscension.toLowerCase() !== NEW_CONTRACTS.AltarOfAscension.toLowerCase()) {
      console.log(`AltarOfAscension: ${currentSettings.altarOfAscension} → ${NEW_CONTRACTS.AltarOfAscension}`);
      needsUpdate = true;
    }
    
    if (!needsUpdate) {
      console.log("無需更新");
    }
    
    console.log("\n🟢 正確設置的合約：");
    if (currentSettings.oracle.toLowerCase() === V25_CONTRACTS.Oracle.toLowerCase()) {
      console.log(`Oracle: ${currentSettings.oracle} ✓`);
    }
    if (currentSettings.playerVault.toLowerCase() === V25_CONTRACTS.PlayerVault.toLowerCase()) {
      console.log(`PlayerVault: ${currentSettings.playerVault} ✓`);
    }
    if (currentSettings.playerProfile.toLowerCase() === V25_CONTRACTS.PlayerProfile.toLowerCase()) {
      console.log(`PlayerProfile: ${currentSettings.playerProfile} ✓`);
    }
    if (currentSettings.vipStaking.toLowerCase() === V25_CONTRACTS.VipStaking.toLowerCase()) {
      console.log(`VipStaking: ${currentSettings.vipStaking} ✓`);
    }
    if (currentSettings.partyContract.toLowerCase() === V25_CONTRACTS.Party.toLowerCase()) {
      console.log(`Party: ${currentSettings.partyContract} ✓`);
    }
    
    console.log("\n=====================================");
    
    if (needsUpdate) {
      console.log("\n⚠️  DungeonCore 需要更新以下合約地址：");
      console.log("1. setHeroContract(" + NEW_CONTRACTS.Hero + ")");
      console.log("2. setRelicContract(" + NEW_CONTRACTS.Relic + ")");
      console.log("3. setDungeonMaster(" + NEW_CONTRACTS.DungeonMaster + ")");
      console.log("4. setAltarOfAscension(" + NEW_CONTRACTS.AltarOfAscension + ")");
      console.log("\n執行更新腳本：");
      console.log("npx hardhat run scripts/update-dungeoncore.js --network bsc");
    } else {
      console.log("\n✅ DungeonCore 所有合約地址都已正確設置！");
    }
    
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
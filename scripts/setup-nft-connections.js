// NFT 合約互連設置腳本 (V25.1.5)
// 設置 NFT 合約與 DungeonCore 之間的雙向連接

const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 開始設置 V25.1.5 NFT 合約互連");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("操作錢包:", deployer.address);

  // 從環境變數讀取合約地址
  const addresses = {
    dungeonCore: process.env.VITE_DUNGEONCORE_ADDRESS,
    hero: process.env.VITE_HERO_ADDRESS,
    relic: process.env.VITE_RELIC_ADDRESS,
    party: process.env.VITE_PARTY_ADDRESS,
    playerProfile: process.env.VITE_PLAYERPROFILE_ADDRESS,
    vipStaking: process.env.VITE_VIPSTAKING_ADDRESS
  };

  console.log("合約地址配置:");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(15)}: ${address || '❌ 地址未設定'}`);
  });

  // 驗證所有地址都已設定
  const missingAddresses = Object.entries(addresses)
    .filter(([_, address]) => !address)
    .map(([name, _]) => name);

  if (missingAddresses.length > 0) {
    console.log(`\n❌ 缺少地址: ${missingAddresses.join(', ')}`);
    console.log("請先在 .env 文件中設定所有合約地址");
    process.exit(1);
  }

  // 初始化合約實例
  const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
  const hero = await ethers.getContractAt("Hero", addresses.hero);
  const relic = await ethers.getContractAt("Relic", addresses.relic);
  const party = await ethers.getContractAt("Party", addresses.party);
  const playerProfile = await ethers.getContractAt("PlayerProfile", addresses.playerProfile);
  const vipStaking = await ethers.getContractAt("VIPStaking", addresses.vipStaking);

  console.log("\n🔧 開始執行互連設置...");

  const results = {};

  try {
    // ==================== Phase 1: NFT 合約 → DungeonCore ====================
    console.log("\n📝 Phase 1: 設置 NFT 合約 → DungeonCore 連接");
    console.log("-".repeat(50));

    // 1.1 Hero → DungeonCore
    console.log("1.1 設置 Hero.setDungeonCore()...");
    try {
      const tx1 = await hero.setDungeonCore(addresses.dungeonCore);
      await tx1.wait();
      console.log("✅ Hero → DungeonCore 設置完成");
      console.log("   交易 Hash:", tx1.hash);
      results.heroDungeonCore = "✅";
    } catch (error) {
      console.log("❌ Hero → DungeonCore 設置失敗:", error.message);
      results.heroDungeonCore = "❌";
    }

    // 1.2 Relic → DungeonCore  
    console.log("\n1.2 設置 Relic.setDungeonCore()...");
    try {
      const tx2 = await relic.setDungeonCore(addresses.dungeonCore);
      await tx2.wait();
      console.log("✅ Relic → DungeonCore 設置完成");
      console.log("   交易 Hash:", tx2.hash);
      results.relicDungeonCore = "✅";
    } catch (error) {
      console.log("❌ Relic → DungeonCore 設置失敗:", error.message);
      results.relicDungeonCore = "❌";
    }

    // 1.3 Party → DungeonCore
    console.log("\n1.3 設置 Party.setDungeonCore()...");
    try {
      const tx3 = await party.setDungeonCore(addresses.dungeonCore);
      await tx3.wait();
      console.log("✅ Party → DungeonCore 設置完成");
      console.log("   交易 Hash:", tx3.hash);
      results.partyDungeonCore = "✅";
    } catch (error) {
      console.log("❌ Party → DungeonCore 設置失敗:", error.message);
      results.partyDungeonCore = "❌";
    }

    // 1.4 PlayerProfile → DungeonCore
    console.log("\n1.4 設置 PlayerProfile.setDungeonCore()...");
    try {
      const tx4 = await playerProfile.setDungeonCore(addresses.dungeonCore);
      await tx4.wait();
      console.log("✅ PlayerProfile → DungeonCore 設置完成");
      console.log("   交易 Hash:", tx4.hash);
      results.playerProfileDungeonCore = "✅";
    } catch (error) {
      console.log("❌ PlayerProfile → DungeonCore 設置失敗:", error.message);
      results.playerProfileDungeonCore = "❌";
    }

    // 1.5 VIPStaking → DungeonCore
    console.log("\n1.5 設置 VIPStaking.setDungeonCore()...");
    try {
      const tx5 = await vipStaking.setDungeonCore(addresses.dungeonCore);
      await tx5.wait();
      console.log("✅ VIPStaking → DungeonCore 設置完成");
      console.log("   交易 Hash:", tx5.hash);
      results.vipStakingDungeonCore = "✅";
    } catch (error) {
      console.log("❌ VIPStaking → DungeonCore 設置失敗:", error.message);
      results.vipStakingDungeonCore = "❌";
    }

    // ==================== Phase 2: DungeonCore → NFT 合約 ====================
    console.log("\n📝 Phase 2: 設置 DungeonCore → NFT 合約連接");
    console.log("-".repeat(50));

    // 2.1 DungeonCore → Hero
    console.log("2.1 設置 DungeonCore.setHeroContract()...");
    try {
      const tx6 = await dungeonCore.setHeroContract(addresses.hero);
      await tx6.wait();
      console.log("✅ DungeonCore → Hero 設置完成");
      console.log("   交易 Hash:", tx6.hash);
      results.dungeonCoreHero = "✅";
    } catch (error) {
      console.log("❌ DungeonCore → Hero 設置失敗:", error.message);
      results.dungeonCoreHero = "❌";
    }

    // 2.2 DungeonCore → Relic
    console.log("\n2.2 設置 DungeonCore.setRelicContract()...");
    try {
      const tx7 = await dungeonCore.setRelicContract(addresses.relic);
      await tx7.wait();
      console.log("✅ DungeonCore → Relic 設置完成");
      console.log("   交易 Hash:", tx7.hash);
      results.dungeonCoreRelic = "✅";
    } catch (error) {
      console.log("❌ DungeonCore → Relic 設置失敗:", error.message);
      results.dungeonCoreRelic = "❌";
    }

    // 2.3 DungeonCore → Party
    console.log("\n2.3 設置 DungeonCore.setPartyContract()...");
    try {
      const tx8 = await dungeonCore.setPartyContract(addresses.party);
      await tx8.wait();
      console.log("✅ DungeonCore → Party 設置完成");
      console.log("   交易 Hash:", tx8.hash);
      results.dungeonCoreParty = "✅";
    } catch (error) {
      console.log("❌ DungeonCore → Party 設置失敗:", error.message);
      results.dungeonCoreParty = "❌";
    }

    // 2.4 DungeonCore → PlayerProfile
    console.log("\n2.4 設置 DungeonCore.setPlayerProfile()...");
    try {
      const tx9 = await dungeonCore.setPlayerProfile(addresses.playerProfile);
      await tx9.wait();
      console.log("✅ DungeonCore → PlayerProfile 設置完成");
      console.log("   交易 Hash:", tx9.hash);
      results.dungeonCorePlayerProfile = "✅";
    } catch (error) {
      console.log("❌ DungeonCore → PlayerProfile 設置失敗:", error.message);
      results.dungeonCorePlayerProfile = "❌";
    }

    // 2.5 DungeonCore → VIPStaking
    console.log("\n2.5 設置 DungeonCore.setVipStaking()...");
    try {
      const tx10 = await dungeonCore.setVipStaking(addresses.vipStaking);
      await tx10.wait();
      console.log("✅ DungeonCore → VIPStaking 設置完成");
      console.log("   交易 Hash:", tx10.hash);
      results.dungeonCoreVipStaking = "✅";
    } catch (error) {
      console.log("❌ DungeonCore → VIPStaking 設置失敗:", error.message);
      results.dungeonCoreVipStaking = "❌";
    }

    // ==================== Phase 3: 驗證所有連接 ====================
    console.log("\n📝 Phase 3: 驗證所有連接");
    console.log("-".repeat(50));

    console.log("3.1 驗證 NFT 合約 → DungeonCore 連接...");
    const heroDC = await hero.dungeonCore();
    const relicDC = await relic.dungeonCore();
    const partyDC = await party.dungeonCoreContract();
    const profileDC = await playerProfile.dungeonCore();
    const vipDC = await vipStaking.dungeonCore();

    console.log(`Hero.dungeonCore(): ${heroDC === addresses.dungeonCore ? '✅' : '❌'} ${heroDC}`);
    console.log(`Relic.dungeonCore(): ${relicDC === addresses.dungeonCore ? '✅' : '❌'} ${relicDC}`);
    console.log(`Party.dungeonCoreContract(): ${partyDC === addresses.dungeonCore ? '✅' : '❌'} ${partyDC}`);
    console.log(`PlayerProfile.dungeonCore(): ${profileDC === addresses.dungeonCore ? '✅' : '❌'} ${profileDC}`);
    console.log(`VIPStaking.dungeonCore(): ${vipDC === addresses.dungeonCore ? '✅' : '❌'} ${vipDC}`);

    console.log("\n3.2 驗證 DungeonCore → NFT 合約連接...");
    const dcHero = await dungeonCore.heroContractAddress();
    const dcRelic = await dungeonCore.relicContractAddress();
    const dcParty = await dungeonCore.partyContractAddress();
    const dcProfile = await dungeonCore.playerProfileAddress();
    const dcVip = await dungeonCore.vipStakingAddress();

    console.log(`DungeonCore.heroContractAddress(): ${dcHero === addresses.hero ? '✅' : '❌'} ${dcHero}`);
    console.log(`DungeonCore.relicContractAddress(): ${dcRelic === addresses.relic ? '✅' : '❌'} ${dcRelic}`);
    console.log(`DungeonCore.partyContractAddress(): ${dcParty === addresses.party ? '✅' : '❌'} ${dcParty}`);
    console.log(`DungeonCore.playerProfileAddress(): ${dcProfile === addresses.playerProfile ? '✅' : '❌'} ${dcProfile}`);
    console.log(`DungeonCore.vipStakingAddress(): ${dcVip === addresses.vipStaking ? '✅' : '❌'} ${dcVip}`);

    // ==================== 結果總結 ====================
    console.log("\n" + "=".repeat(60));
    console.log("📊 V25.1.5 合約互連設置結果總結:");
    console.log("=".repeat(60));
    
    console.log("NFT 合約 → DungeonCore:");
    console.log(`  Hero → DungeonCore:        ${results.heroDungeonCore}`);
    console.log(`  Relic → DungeonCore:       ${results.relicDungeonCore}`);
    console.log(`  Party → DungeonCore:       ${results.partyDungeonCore}`);
    console.log(`  PlayerProfile → DungeonCore: ${results.playerProfileDungeonCore}`);
    console.log(`  VIPStaking → DungeonCore:  ${results.vipStakingDungeonCore}`);

    console.log("\nDungeonCore → NFT 合約:");
    console.log(`  DungeonCore → Hero:        ${results.dungeonCoreHero}`);
    console.log(`  DungeonCore → Relic:       ${results.dungeonCoreRelic}`);
    console.log(`  DungeonCore → Party:       ${results.dungeonCoreParty}`);
    console.log(`  DungeonCore → PlayerProfile: ${results.dungeonCorePlayerProfile}`);
    console.log(`  DungeonCore → VIPStaking:  ${results.dungeonCoreVipStaking}`);

    const successCount = Object.values(results).filter(status => status === "✅").length;
    console.log(`\n📊 設置統計: ${successCount}/10 個連接設置成功`);

    if (successCount === 10) {
      console.log("🎉 所有合約互連設置完成!");
      console.log("\n📝 下一步:");
      console.log("運行地址同步腳本: npm run sync-all");
    } else {
      console.log("⚠️  部分連接設置失敗，請檢查錯誤信息");
    }

  } catch (error) {
    console.error("❌ 互連設置過程中發生錯誤:", error);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ 互連設置腳本執行完成!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 互連設置腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = main;
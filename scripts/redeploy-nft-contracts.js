// NFT 合約重新部署腳本 (V25.1.5)
// 部署順序: Hero, Relic, Party, PlayerProfile, VIPStaking
// 包括：部署 → 驗證 → 互連設置 → 地址更新

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 開始 V25.1.5 NFT 合約重新部署");
  console.log("=".repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("部署錢包:", deployer.address);
  
  // 現有核心合約地址
  const DUNGEON_CORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
  console.log("DungeonCore 地址:", DUNGEON_CORE_ADDRESS);
  
  // 部署結果存儲
  const deployedContracts = {
    timestamp: new Date().toISOString(),
    network: "BSC Mainnet",
    deployer: deployer.address,
    dungeonCore: DUNGEON_CORE_ADDRESS,
    contracts: {}
  };

  try {
    // ==================== 1. 部署 Hero 合約 ====================
    console.log("\n📝 Step 1: 部署 Hero 合約...");
    const HeroFactory = await ethers.getContractFactory("Hero");
    const hero = await HeroFactory.deploy();
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    
    console.log("✅ Hero 合約已部署:");
    console.log("   地址:", heroAddress);
    deployedContracts.contracts.hero = heroAddress;

    // ==================== 2. 部署 Relic 合約 ====================
    console.log("\n📝 Step 2: 部署 Relic 合約...");
    const RelicFactory = await ethers.getContractFactory("Relic");
    const relic = await RelicFactory.deploy();
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    
    console.log("✅ Relic 合約已部署:");
    console.log("   地址:", relicAddress);
    deployedContracts.contracts.relic = relicAddress;

    // ==================== 3. 部署 Party 合約 ====================
    console.log("\n📝 Step 3: 部署 Party 合約...");
    const PartyFactory = await ethers.getContractFactory("Party");
    const party = await PartyFactory.deploy();
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    
    console.log("✅ Party 合約已部署:");
    console.log("   地址:", partyAddress);
    deployedContracts.contracts.party = partyAddress;

    // ==================== 4. 部署 PlayerProfile 合約 ====================
    console.log("\n📝 Step 4: 部署 PlayerProfile 合約...");
    const PlayerProfileFactory = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfileFactory.deploy();
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    
    console.log("✅ PlayerProfile 合約已部署:");
    console.log("   地址:", playerProfileAddress);
    deployedContracts.contracts.playerProfile = playerProfileAddress;

    // ==================== 5. 部署 VIPStaking 合約 ====================
    console.log("\n📝 Step 5: 部署 VIPStaking 合約...");
    const VIPStakingFactory = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStakingFactory.deploy();
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    
    console.log("✅ VIPStaking 合約已部署:");
    console.log("   地址:", vipStakingAddress);
    deployedContracts.contracts.vipStaking = vipStakingAddress;

    console.log("\n" + "=".repeat(60));
    console.log("📊 V25.1.5 部署完成總結:");
    console.log("=".repeat(60));
    console.log("Hero:", heroAddress);
    console.log("Relic:", relicAddress);
    console.log("Party:", partyAddress);
    console.log("PlayerProfile:", playerProfileAddress);
    console.log("VIPStaking:", vipStakingAddress);
    console.log("DungeonCore:", DUNGEON_CORE_ADDRESS);

    // 保存部署記錄
    const fs = require('fs');
    const deploymentRecord = JSON.stringify(deployedContracts, null, 2);
    const filename = `deployments/v25-1-5-nft-deployment-${Date.now()}.json`;
    fs.writeFileSync(filename, deploymentRecord);
    console.log(`\n💾 部署記錄已保存: ${filename}`);

    // 生成環境變數更新
    console.log("\n📝 環境變數更新 (.env):");
    console.log(`VITE_HERO_ADDRESS=${heroAddress}`);
    console.log(`VITE_RELIC_ADDRESS=${relicAddress}`);
    console.log(`VITE_PARTY_ADDRESS=${partyAddress}`);
    console.log(`VITE_PLAYERPROFILE_ADDRESS=${playerProfileAddress}`);
    console.log(`VITE_VIPSTAKING_ADDRESS=${vipStakingAddress}`);

    console.log("\n⚠️  重要提醒:");
    console.log("1. 請手動更新 .env 文件中的地址");
    console.log("2. 運行驗證腳本: npm run verify-nft-contracts");
    console.log("3. 運行互連設置腳本: npm run setup-nft-connections");
    console.log("4. 運行地址同步腳本: npm run sync-all");

    return {
      hero: heroAddress,
      relic: relicAddress,
      party: partyAddress,
      playerProfile: playerProfileAddress,
      vipStaking: vipStakingAddress,
      dungeonCore: DUNGEON_CORE_ADDRESS
    };

  } catch (error) {
    console.error("❌ 部署失敗:", error);
    throw error;
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main()
    .then((addresses) => {
      console.log("\n🎉 部署腳本執行完成!");
      console.log("請繼續執行後續步驟...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 部署腳本執行失敗:", error);
      process.exit(1);
    });
}

module.exports = main;
// 部署剩餘的 4 個合約 (從 Relic 開始)
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 繼續部署剩餘的 NFT 合約");
  console.log("=".repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("部署錢包:", deployer.address);
  
  // 已部署的 Hero 地址
  const heroAddress = "0x304Cd1513f886d4538fBd0Ab12C626d23b6b48fB";
  console.log("已部署 Hero:", heroAddress);
  
  const deployedContracts = {
    hero: heroAddress
  };

  try {
    // ==================== 2. 部署 Relic 合約 ====================
    console.log("\n📝 Step 2: 部署 Relic 合約...");
    const RelicFactory = await ethers.getContractFactory("Relic");
    const relic = await RelicFactory.deploy();
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    
    console.log("✅ Relic 合約已部署:");
    console.log("   地址:", relicAddress);
    deployedContracts.relic = relicAddress;

    // ==================== 3. 部署 Party 合約 ====================
    console.log("\n📝 Step 3: 部署 Party 合約...");
    const PartyFactory = await ethers.getContractFactory("Party");
    const party = await PartyFactory.deploy();
    await party.waitForDeployment();
    const partyAddress = await party.getAddress();
    
    console.log("✅ Party 合約已部署:");
    console.log("   地址:", partyAddress);
    deployedContracts.party = partyAddress;

    // ==================== 4. 部署 PlayerProfile 合約 ====================
    console.log("\n📝 Step 4: 部署 PlayerProfile 合約...");
    const PlayerProfileFactory = await ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfileFactory.deploy();
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    
    console.log("✅ PlayerProfile 合約已部署:");
    console.log("   地址:", playerProfileAddress);
    deployedContracts.playerProfile = playerProfileAddress;

    // ==================== 5. 部署 VIPStaking 合約 ====================
    console.log("\n📝 Step 5: 部署 VIPStaking 合約...");
    const VIPStakingFactory = await ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStakingFactory.deploy();
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    
    console.log("✅ VIPStaking 合約已部署:");
    console.log("   地址:", vipStakingAddress);
    deployedContracts.vipStaking = vipStakingAddress;

    console.log("\n" + "=".repeat(60));
    console.log("📊 V25.1.5 完整部署地址:");
    console.log("=".repeat(60));
    console.log("Hero:", deployedContracts.hero);
    console.log("Relic:", deployedContracts.relic);
    console.log("Party:", deployedContracts.party);
    console.log("PlayerProfile:", deployedContracts.playerProfile);
    console.log("VIPStaking:", deployedContracts.vipStaking);

    // 保存地址到文件
    const fs = require('fs');
    const addressRecord = `
# V25.1.5 新部署地址
VITE_HERO_ADDRESS=${deployedContracts.hero}
VITE_RELIC_ADDRESS=${deployedContracts.relic}
VITE_PARTY_ADDRESS=${deployedContracts.party}
VITE_PLAYERPROFILE_ADDRESS=${deployedContracts.playerProfile}
VITE_VIPSTAKING_ADDRESS=${deployedContracts.vipStaking}
    `;
    
    fs.writeFileSync('v25-1-5-addresses.txt', addressRecord);
    console.log("\n💾 地址已保存到 v25-1-5-addresses.txt");

    return deployedContracts;

  } catch (error) {
    console.error("❌ 部署失敗:", error);
    throw error;
  }
}

main().catch(console.error);
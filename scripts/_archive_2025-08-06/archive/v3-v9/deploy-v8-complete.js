// scripts/deploy-v8-complete.js
// 完整的部署腳本，包含所有 baseURI 設定

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 部署 DungeonDelvers 完整系統...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 帳戶餘額:", hre.ethers.formatEther(balance), "BNB\n");

  // 基礎配置
  const METADATA_SERVER_URL = process.env.METADATA_SERVER_BASE_URL || 
                             "https://dungeon-delvers-metadata-server.onrender.com";
  
  console.log("📡 Metadata Server:", METADATA_SERVER_URL);

  // 記錄部署資訊
  const deployment = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    metadataServer: METADATA_SERVER_URL,
    contracts: {}
  };

  try {
    // ===== 1. NFT 合約部署 =====
    console.log("\n=== 部署 NFT 合約 ===\n");
    
    // 1.1 Hero
    console.log("📦 部署 Hero...");
    const Hero = await hre.ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    await hero.setBaseURI(`${METADATA_SERVER_URL}/api/hero/`);
    console.log("✅ Hero 部署至:", heroAddress);
    deployment.contracts.Hero = heroAddress;

    // 1.2 Relic
    console.log("\n📦 部署 Relic...");
    const Relic = await hre.ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    await relic.setBaseURI(`${METADATA_SERVER_URL}/api/relic/`);
    console.log("✅ Relic 部署至:", relicAddress);
    deployment.contracts.Relic = relicAddress;

    // 1.3 PartyV3
    console.log("\n📦 部署 PartyV3...");
    const PartyV3 = await hre.ethers.getContractFactory("PartyV3");
    const partyV3 = await PartyV3.deploy(deployer.address);
    await partyV3.waitForDeployment();
    const partyV3Address = await partyV3.getAddress();
    await partyV3.setBaseURI(`${METADATA_SERVER_URL}/api/party/`);
    console.log("✅ PartyV3 部署至:", partyV3Address);
    deployment.contracts.PartyV3 = partyV3Address;

    // 1.4 VIPStaking
    console.log("\n📦 部署 VIPStaking...");
    const VIPStaking = await hre.ethers.getContractFactory("VIPStaking");
    const vipStaking = await VIPStaking.deploy(deployer.address);
    await vipStaking.waitForDeployment();
    const vipStakingAddress = await vipStaking.getAddress();
    await vipStaking.setBaseURI(`${METADATA_SERVER_URL}/api/vip/`);
    console.log("✅ VIPStaking 部署至:", vipStakingAddress);
    deployment.contracts.VIPStaking = vipStakingAddress;

    // 1.5 PlayerProfile
    console.log("\n📦 部署 PlayerProfile...");
    const PlayerProfile = await hre.ethers.getContractFactory("PlayerProfile");
    const playerProfile = await PlayerProfile.deploy(deployer.address);
    await playerProfile.waitForDeployment();
    const playerProfileAddress = await playerProfile.getAddress();
    await playerProfile.setBaseURI(`${METADATA_SERVER_URL}/api/profile/`);
    console.log("✅ PlayerProfile 部署至:", playerProfileAddress);
    deployment.contracts.PlayerProfile = playerProfileAddress;

    // ===== 2. 核心系統合約部署 =====
    console.log("\n\n=== 部署核心系統合約 ===\n");

    // 2.1 Oracle
    console.log("📦 部署 Oracle...");
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ Oracle 部署至:", oracleAddress);
    deployment.contracts.Oracle = oracleAddress;

    // 2.2 DungeonStorage
    console.log("\n📦 部署 DungeonStorage...");
    const DungeonStorage = await hre.ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await DungeonStorage.deploy(deployer.address);
    await dungeonStorage.waitForDeployment();
    const dungeonStorageAddress = await dungeonStorage.getAddress();
    console.log("✅ DungeonStorage 部署至:", dungeonStorageAddress);
    deployment.contracts.DungeonStorage = dungeonStorageAddress;

    // 2.3 PlayerVault
    console.log("\n📦 部署 PlayerVault...");
    const PlayerVault = await hre.ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVault.deploy(deployer.address);
    await playerVault.waitForDeployment();
    const playerVaultAddress = await playerVault.getAddress();
    console.log("✅ PlayerVault 部署至:", playerVaultAddress);
    deployment.contracts.PlayerVault = playerVaultAddress;

    // 2.4 AltarOfAscension
    console.log("\n📦 部署 AltarOfAscension...");
    const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscension");
    const altarOfAscension = await AltarOfAscension.deploy(deployer.address);
    await altarOfAscension.waitForDeployment();
    const altarOfAscensionAddress = await altarOfAscension.getAddress();
    console.log("✅ AltarOfAscension 部署至:", altarOfAscensionAddress);
    deployment.contracts.AltarOfAscension = altarOfAscensionAddress;

    // 2.5 DungeonMaster (最新版本)
    console.log("\n📦 部署 DungeonMaster...");
    const DungeonMaster = await hre.ethers.getContractFactory("DungeonMasterV7");
    const dungeonMaster = await DungeonMaster.deploy(deployer.address);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    console.log("✅ DungeonMaster 部署至:", dungeonMasterAddress);
    deployment.contracts.DungeonMaster = dungeonMasterAddress;

    // 2.6 DungeonCore
    console.log("\n📦 部署 DungeonCore...");
    const DungeonCore = await hre.ethers.getContractFactory("DungeonCore");
    const dungeonCore = await DungeonCore.deploy(deployer.address);
    await dungeonCore.waitForDeployment();
    const dungeonCoreAddress = await dungeonCore.getAddress();
    console.log("✅ DungeonCore 部署至:", dungeonCoreAddress);
    deployment.contracts.DungeonCore = dungeonCoreAddress;

    // ===== 3. 設定合約連接 =====
    console.log("\n\n=== 設定合約連接 ===\n");

    // 3.1 設定 DungeonCore 的所有模組
    console.log("🔧 設定 DungeonCore 模組...");
    await dungeonCore.setHeroContract(heroAddress);
    await dungeonCore.setRelicContract(relicAddress);
    await dungeonCore.setPartyContract(partyV3Address);
    await dungeonCore.setDungeonMasterContract(dungeonMasterAddress);
    await dungeonCore.setPlayerVaultContract(playerVaultAddress);
    await dungeonCore.setPlayerProfileContract(playerProfileAddress);
    await dungeonCore.setAltarOfAscensionContract(altarOfAscensionAddress);
    await dungeonCore.setVipStakingContract(vipStakingAddress);
    await dungeonCore.setDungeonStorageContract(dungeonStorageAddress);
    await dungeonCore.setOracleContract(oracleAddress);
    console.log("✅ DungeonCore 模組設定完成");

    // 3.2 各合約設定 DungeonCore
    console.log("\n🔧 各合約連接 DungeonCore...");
    await hero.setDungeonCore(dungeonCoreAddress);
    await relic.setDungeonCore(dungeonCoreAddress);
    await partyV3.setDungeonCore(dungeonCoreAddress);
    await vipStaking.setDungeonCore(dungeonCoreAddress);
    await playerProfile.setDungeonCore(dungeonCoreAddress);
    await playerVault.setDungeonCore(dungeonCoreAddress);
    await altarOfAscension.setDungeonCore(dungeonCoreAddress);
    await dungeonMaster.setDungeonCore(dungeonCoreAddress);
    await dungeonStorage.setDungeonCore(dungeonCoreAddress);
    console.log("✅ 所有合約已連接 DungeonCore");

    // 3.3 DungeonMaster 特殊設定
    console.log("\n🔧 DungeonMaster 額外設定...");
    await dungeonMaster.setDungeonStorage(dungeonStorageAddress);
    const soulShardAddress = process.env.SOUL_SHARD_TOKEN_ADDRESS;
    if (soulShardAddress) {
      await dungeonMaster.setSoulShardToken(soulShardAddress);
      console.log("✅ SoulShard Token 已設定");
    }

    // 3.4 PartyV3 設定 Hero 和 Relic 合約
    console.log("\n🔧 PartyV3 設定 NFT 合約...");
    await partyV3.setHeroContract(heroAddress);
    await partyV3.setRelicContract(relicAddress);
    console.log("✅ PartyV3 已連接 Hero 和 Relic");

    // ===== 4. 儲存部署記錄 =====
    const deploymentPath = path.join(
      __dirname,
      `../deployments/V8_complete_${hre.network.name}_${Date.now()}.json`
    );
    
    const dir = path.dirname(deploymentPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("\n📄 部署記錄已保存:", deploymentPath);

    // ===== 5. 顯示總結 =====
    console.log("\n" + "=".repeat(60));
    console.log("🎉 完整系統部署成功！");
    console.log("=".repeat(60));
    
    console.log("\n📋 合約地址總覽：");
    console.log("NFT 合約:");
    console.log(`  Hero: ${heroAddress}`);
    console.log(`  Relic: ${relicAddress}`);
    console.log(`  Party: ${partyV3Address}`);
    console.log(`  VIPStaking: ${vipStakingAddress}`);
    console.log(`  PlayerProfile: ${playerProfileAddress}`);
    console.log("\n核心合約:");
    console.log(`  DungeonCore: ${dungeonCoreAddress}`);
    console.log(`  DungeonMaster: ${dungeonMasterAddress}`);
    console.log(`  DungeonStorage: ${dungeonStorageAddress}`);
    console.log(`  PlayerVault: ${playerVaultAddress}`);
    console.log(`  AltarOfAscension: ${altarOfAscensionAddress}`);
    console.log(`  Oracle: ${oracleAddress}`);
    
    console.log("\n📡 所有 NFT 都已設定 Metadata Server:");
    console.log(`  ${METADATA_SERVER_URL}/api/{type}/`);
    
    console.log("\n⚡ 下一步:");
    console.log("1. 更新 .env 文件中的所有合約地址");
    console.log("2. 驗證所有合約");
    console.log("3. 更新前端 contracts.ts");
    console.log("4. 更新後端配置");
    console.log("5. 更新 The Graph subgraph");
    
  } catch (error) {
    console.error("\n❌ 部署失敗:", error);
    
    // 儲存錯誤記錄
    const errorPath = path.join(
      __dirname,
      `../deployments/ERROR_${Date.now()}.json`
    );
    fs.writeFileSync(errorPath, JSON.stringify({
      error: error.message,
      deployment: deployment,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
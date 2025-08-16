const hre = require("hardhat");

// V25 正確地址 (2025-08-07 pm6)
const V25_ADDRESSES = {
  // 核心合約
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  
  // 新部署的合約
  DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
  HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
  RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
  ALTAROFASCENSION: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  
  // 輔助合約
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  
  // Token 合約
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
  
  // VRF
  VRF_MANAGER: "0x980d224ec4d198d94f34a8af76a19c00dabe2436"
};

async function updateSetting(contractInstance, method, value, description) {
  try {
    console.log(`   ${description}...`);
    const tx = await contractInstance[method](value);
    console.log(`   ✅ 交易: ${tx.hash}`);
    await tx.wait();
    return true;
  } catch (error) {
    if (error.message && error.message.includes("invalid value")) {
      const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
      if (match) {
        console.log(`   ✅ 交易已發送: ${match[1]}`);
        return true;
      }
    }
    console.log(`   ❌ 失敗: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 更新到 V25 最終版本...\n");
  console.log("版本：V25");
  console.log("時間：2025-08-07 pm6");
  console.log("子圖版本：v3.8.0");
  console.log("起始區塊：56757876\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 執行者:", deployer.address);
  console.log("=====================================\n");
  
  // 1. 更新 DungeonMaster 的 DungeonStorage
  console.log("1️⃣ 更新 DungeonMaster 設置");
  console.log("-------------------------------------");
  try {
    const dungeonMaster = await hre.ethers.getContractAt("DungeonMaster", V25_ADDRESSES.DUNGEONMASTER);
    
    // 檢查當前 DungeonStorage
    const currentStorage = await dungeonMaster.dungeonStorage();
    console.log("當前 DungeonStorage:", currentStorage);
    console.log("目標 DungeonStorage:", V25_ADDRESSES.DUNGEONSTORAGE);
    
    if (currentStorage.toLowerCase() !== V25_ADDRESSES.DUNGEONSTORAGE.toLowerCase()) {
      await updateSetting(dungeonMaster, "setDungeonStorage", V25_ADDRESSES.DUNGEONSTORAGE, "更新 DungeonStorage");
    } else {
      console.log("   ✅ DungeonStorage 已是正確地址");
    }
  } catch (error) {
    console.log("   ⚠️  DungeonMaster 更新錯誤:", error.message);
  }
  
  // 2. 更新 DungeonCore 的所有地址
  console.log("\n2️⃣ 更新 DungeonCore 設置");
  console.log("-------------------------------------");
  try {
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", V25_ADDRESSES.DUNGEONCORE);
    
    // 檢查並更新各個地址
    const updates = [
      { method: "setOracle", address: V25_ADDRESSES.ORACLE, name: "Oracle" },
      { method: "setPlayerVault", address: V25_ADDRESSES.PLAYERVAULT, name: "PlayerVault" },
      { method: "setPlayerProfile", address: V25_ADDRESSES.PLAYERPROFILE, name: "PlayerProfile" },
      { method: "setVipStaking", address: V25_ADDRESSES.VIPSTAKING, name: "VipStaking" },
      { method: "setPartyContract", address: V25_ADDRESSES.PARTY, name: "Party" },
      { method: "setHeroContract", address: V25_ADDRESSES.HERO, name: "Hero" },
      { method: "setRelicContract", address: V25_ADDRESSES.RELIC, name: "Relic" },
      { method: "setDungeonMaster", address: V25_ADDRESSES.DUNGEONMASTER, name: "DungeonMaster" },
      { method: "setAltarOfAscension", address: V25_ADDRESSES.ALTAROFASCENSION, name: "AltarOfAscension" }
    ];
    
    for (const update of updates) {
      await updateSetting(dungeonCore, update.method, update.address, `設置 ${update.name}`);
    }
  } catch (error) {
    console.log("   ⚠️  DungeonCore 更新錯誤:", error.message);
  }
  
  // 3. 更新新 Party 合約的 Hero 和 Relic
  console.log("\n3️⃣ 更新 Party 合約設置");
  console.log("-------------------------------------");
  try {
    const party = await hre.ethers.getContractAt("Party", V25_ADDRESSES.PARTY);
    
    await updateSetting(party, "setHeroContract", V25_ADDRESSES.HERO, "設置 Hero");
    await updateSetting(party, "setRelicContract", V25_ADDRESSES.RELIC, "設置 Relic");
    await updateSetting(party, "setDungeonCore", V25_ADDRESSES.DUNGEONCORE, "設置 DungeonCore");
  } catch (error) {
    console.log("   ⚠️  Party 更新錯誤:", error.message);
  }
  
  // 4. 顯示最終配置
  console.log("\n=====================================");
  console.log("📋 V25 最終配置");
  console.log("=====================================");
  console.log("\n核心合約：");
  console.log(`  DungeonCore:       ${V25_ADDRESSES.DUNGEONCORE}`);
  console.log(`  DungeonStorage:    ${V25_ADDRESSES.DUNGEONSTORAGE}`);
  console.log(`  DungeonMaster:     ${V25_ADDRESSES.DUNGEONMASTER}`);
  
  console.log("\nNFT 合約：");
  console.log(`  Hero:              ${V25_ADDRESSES.HERO}`);
  console.log(`  Relic:             ${V25_ADDRESSES.RELIC}`);
  console.log(`  Party:             ${V25_ADDRESSES.PARTY}`);
  console.log(`  AltarOfAscension:  ${V25_ADDRESSES.ALTAROFASCENSION}`);
  
  console.log("\n輔助合約：");
  console.log(`  PlayerVault:       ${V25_ADDRESSES.PLAYERVAULT}`);
  console.log(`  PlayerProfile:     ${V25_ADDRESSES.PLAYERPROFILE}`);
  console.log(`  VipStaking:        ${V25_ADDRESSES.VIPSTAKING}`);
  console.log(`  Oracle:            ${V25_ADDRESSES.ORACLE}`);
  
  console.log("\nToken & VRF：");
  console.log(`  SoulShard:         ${V25_ADDRESSES.SOULSHARD}`);
  console.log(`  USD (測試):        ${V25_ADDRESSES.USD}`);
  console.log(`  VRF Manager:       ${V25_ADDRESSES.VRF_MANAGER}`);
  
  console.log("\n⚠️  重要提醒：");
  console.log("1. 前往 Chainlink 添加 VRF 消費者:");
  console.log(`   https://vrf.chain.link/bsc/29062`);
  console.log(`   添加地址: ${V25_ADDRESSES.VRF_MANAGER}`);
  console.log("\n2. 同步前後端配置：");
  console.log("   - 子圖更新到 v3.8.0");
  console.log("   - 起始區塊: 56757876");
  console.log("   - 更新前端合約地址");
  console.log("   - 更新後端合約地址");
  
  // 保存配置
  const fs = require("fs");
  const config = {
    version: "V25",
    timestamp: new Date().toISOString(),
    network: "BSC Mainnet",
    subgraphVersion: "v3.8.0",
    startBlock: 56757876,
    addresses: V25_ADDRESSES
  };
  
  const filename = `deployments/v25-final-config-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(config, null, 2));
  console.log(`\n💾 配置已保存到: ${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
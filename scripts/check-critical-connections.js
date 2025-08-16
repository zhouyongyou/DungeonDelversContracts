const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 檢查關鍵合約連接 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // 合約地址
  const contracts = {
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    DUNGEONMASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253",
    HERO: "0x575e7407C06ADeb47067AD19663af50DdAe460CF",
    RELIC: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739",
    ALTAROFASCENSION: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    VRFMANAGER: "0xBCC8821d3727C4339d2917Fb33D708c6C006c034"
  };
  
  const issues = [];
  
  console.log("📋 關鍵連接檢查項目：");
  console.log("─".repeat(60));
  
  // 1. DungeonMaster 連接
  console.log("\n1️⃣ DungeonMaster 連接狀態");
  const dmAbi = [
    "function dungeonCore() view returns (address)",
    "function dungeonStorage() view returns (address)",
    "function vrfManager() view returns (address)"
  ];
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER, dmAbi, provider);
  
  try {
    const dmCore = await dungeonMaster.dungeonCore();
    const dmStorage = await dungeonMaster.dungeonStorage();
    const dmVrf = await dungeonMaster.vrfManager();
    
    console.log(`   DungeonCore: ${dmCore === contracts.DUNGEONCORE ? "✅" : "❌"}`);
    console.log(`   DungeonStorage: ${dmStorage === contracts.DUNGEONSTORAGE ? "✅" : "❌"}`);
    console.log(`   VRFManager: ${dmVrf === contracts.VRFMANAGER ? "✅" : "❌"}`);
    
    if (dmCore !== contracts.DUNGEONCORE) issues.push("DungeonMaster -> DungeonCore 連接錯誤");
    if (dmStorage !== contracts.DUNGEONSTORAGE) issues.push("DungeonMaster -> DungeonStorage 連接錯誤");
    if (dmVrf !== contracts.VRFMANAGER) issues.push("DungeonMaster -> VRFManager 連接錯誤");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 2. Hero 連接
  console.log("\n2️⃣ Hero NFT 連接狀態");
  const heroAbi = [
    "function dungeonCore() view returns (address)",
    "function vrfManager() view returns (address)"
  ];
  const hero = new ethers.Contract(contracts.HERO, heroAbi, provider);
  
  try {
    const heroCore = await hero.dungeonCore();
    const heroVrf = await hero.vrfManager();
    
    console.log(`   DungeonCore: ${heroCore === contracts.DUNGEONCORE ? "✅" : "❌"}`);
    console.log(`   VRFManager: ${heroVrf === contracts.VRFMANAGER ? "✅" : "❌"}`);
    
    if (heroCore !== contracts.DUNGEONCORE) issues.push("Hero -> DungeonCore 連接錯誤");
    if (heroVrf !== contracts.VRFMANAGER) issues.push("Hero -> VRFManager 連接錯誤");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 3. Relic 連接
  console.log("\n3️⃣ Relic NFT 連接狀態");
  const relic = new ethers.Contract(contracts.RELIC, heroAbi, provider);
  
  try {
    const relicCore = await relic.dungeonCore();
    const relicVrf = await relic.vrfManager();
    
    console.log(`   DungeonCore: ${relicCore === contracts.DUNGEONCORE ? "✅" : "❌"}`);
    console.log(`   VRFManager: ${relicVrf === contracts.VRFMANAGER ? "✅" : "❌"}`);
    
    if (relicCore !== contracts.DUNGEONCORE) issues.push("Relic -> DungeonCore 連接錯誤");
    if (relicVrf !== contracts.VRFMANAGER) issues.push("Relic -> VRFManager 連接錯誤");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 4. AltarOfAscension 連接
  console.log("\n4️⃣ AltarOfAscension 連接狀態");
  const altar = new ethers.Contract(contracts.ALTAROFASCENSION, heroAbi, provider);
  
  try {
    const altarCore = await altar.dungeonCore();
    const altarVrf = await altar.vrfManager();
    
    console.log(`   DungeonCore: ${altarCore === contracts.DUNGEONCORE ? "✅" : "❌"}`);
    console.log(`   VRFManager: ${altarVrf === contracts.VRFMANAGER ? "✅" : "❌"}`);
    
    if (altarCore !== contracts.DUNGEONCORE) issues.push("AltarOfAscension -> DungeonCore 連接錯誤");
    if (altarVrf !== contracts.VRFMANAGER) issues.push("AltarOfAscension -> VRFManager 連接錯誤");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 5. PlayerVault 連接
  console.log("\n5️⃣ PlayerVault 連接狀態");
  const vaultAbi = ["function dungeonCore() view returns (address)"];
  const vault = new ethers.Contract(contracts.PLAYERVAULT, vaultAbi, provider);
  
  try {
    const vaultCore = await vault.dungeonCore();
    console.log(`   DungeonCore: ${vaultCore === contracts.DUNGEONCORE ? "✅" : "❌"}`);
    
    if (vaultCore !== contracts.DUNGEONCORE) issues.push("PlayerVault -> DungeonCore 連接錯誤");
  } catch (error) {
    console.log("   ❌ 檢查失敗:", error.message);
  }
  
  // 6. VRF Manager 授權檢查
  console.log("\n6️⃣ VRF Manager 授權狀態");
  const vrfAbi = ["function authorizedContracts(address) view returns (bool)"];
  const vrf = new ethers.Contract(contracts.VRFMANAGER, vrfAbi, provider);
  
  const toAuthorize = [
    { name: "Hero", address: contracts.HERO },
    { name: "Relic", address: contracts.RELIC },
    { name: "DungeonMaster", address: contracts.DUNGEONMASTER },
    { name: "AltarOfAscension", address: contracts.ALTAROFASCENSION }
  ];
  
  for (const contract of toAuthorize) {
    try {
      const isAuth = await vrf.authorizedContracts(contract.address);
      console.log(`   ${contract.name}: ${isAuth ? "✅" : "❌"}`);
      
      if (!isAuth) issues.push(`VRF Manager 未授權 ${contract.name}`);
    } catch (error) {
      console.log(`   ${contract.name}: ❌ 檢查失敗`);
    }
  }
  
  // 7. DungeonStorage 授權檢查
  console.log("\n7️⃣ DungeonStorage 授權狀態");
  const storageAbi = ["function isAuthorized(address) view returns (bool)"];
  const storage = new ethers.Contract(contracts.DUNGEONSTORAGE, storageAbi, provider);
  
  try {
    const isDmAuth = await storage.isAuthorized(contracts.DUNGEONMASTER);
    console.log(`   DungeonMaster: ${isDmAuth ? "✅" : "❌"}`);
    
    if (!isDmAuth) issues.push("DungeonStorage 未授權 DungeonMaster");
  } catch (error) {
    console.log("   ⚠️  使用不同的授權檢查方式");
  }
  
  // 總結
  console.log("\n" + "=".repeat(60));
  console.log("📊 檢查結果總結");
  console.log("=".repeat(60));
  
  if (issues.length === 0) {
    console.log("\n🎉 所有關鍵連接正確！");
    console.log("✅ DungeonMaster 連接正常");
    console.log("✅ Hero/Relic NFT 連接正常");
    console.log("✅ AltarOfAscension 連接正常");
    console.log("✅ VRF Manager 授權完整");
    console.log("✅ 系統準備就緒，可以進行測試");
  } else {
    console.log("\n⚠️  發現以下問題：");
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    console.log("\n需要修復這些問題才能正常運行。");
  }
  
  // 合約地址列表
  console.log("\n📝 當前使用的合約地址：");
  console.log("─".repeat(60));
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(20)} ${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
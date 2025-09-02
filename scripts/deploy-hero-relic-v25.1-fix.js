const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 V25.1 Hero & Relic 修復部署");
    console.log("================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    // 現有合約地址（不需要重新部署）
    const DUNGEONCORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    const VRF_MANAGER_ADDRESS = "0x0497108f4734BbC0381DF82e95A41e1425C53981";
    
    // 舊的合約地址（將被替換）
    const OLD_HERO_ADDRESS = "0x60bdCE3d1412C1aA8F18a58801895Bb0C3D45357";
    const OLD_RELIC_ADDRESS = "0xE80d9c0E6dA24f1C71C3A77E0565abc8bb139817";
    
    console.log("\n📋 現有合約:");
    console.log("DungeonCore:", DUNGEONCORE_ADDRESS);
    console.log("VRF Manager:", VRF_MANAGER_ADDRESS);
    console.log("舊 Hero:", OLD_HERO_ADDRESS);
    console.log("舊 Relic:", OLD_RELIC_ADDRESS);
    
    // Step 1: 部署新的 Hero 合約
    console.log("\n📝 Step 1: 部署新的 Hero 合約...");
    const Hero = await ethers.getContractFactory("Hero");
    const hero = await Hero.deploy();
    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    console.log("✅ 新 Hero 部署完成:", heroAddress);
    
    // Step 2: 部署新的 Relic 合約
    console.log("\n📝 Step 2: 部署新的 Relic 合約...");
    const Relic = await ethers.getContractFactory("Relic");
    const relic = await Relic.deploy();
    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    console.log("✅ 新 Relic 部署完成:", relicAddress);
    
    // Step 3: 設定 Hero 的 DungeonCore
    console.log("\n📝 Step 3: 設定 Hero 的 DungeonCore...");
    const tx1 = await hero.setDungeonCore(DUNGEONCORE_ADDRESS);
    await tx1.wait();
    console.log("✅ Hero → DungeonCore 設定完成");
    
    // Step 4: 設定 Relic 的 DungeonCore
    console.log("\n📝 Step 4: 設定 Relic 的 DungeonCore...");
    const tx2 = await relic.setDungeonCore(DUNGEONCORE_ADDRESS);
    await tx2.wait();
    console.log("✅ Relic → DungeonCore 設定完成");
    
    // Step 5: 更新 DungeonCore 的 Hero 地址
    console.log("\n📝 Step 5: 更新 DungeonCore 的 Hero 地址...");
    const dungeonCore = await ethers.getContractAt(
        ["function setHeroContract(address)", "function heroContractAddress() view returns (address)"],
        DUNGEONCORE_ADDRESS
    );
    const tx3 = await dungeonCore.setHeroContract(heroAddress);
    await tx3.wait();
    console.log("✅ DungeonCore → Hero 更新完成");
    
    // Step 6: 更新 DungeonCore 的 Relic 地址
    console.log("\n📝 Step 6: 更新 DungeonCore 的 Relic 地址...");
    const dungeonCoreRelic = await ethers.getContractAt(
        ["function setRelicContract(address)", "function relicContractAddress() view returns (address)"],
        DUNGEONCORE_ADDRESS
    );
    const tx4 = await dungeonCoreRelic.setRelicContract(relicAddress);
    await tx4.wait();
    console.log("✅ DungeonCore → Relic 更新完成");
    
    // Step 7: 驗證設定
    console.log("\n🔍 驗證所有設定...");
    
    // 驗證 Hero 設定
    const heroDungeonCore = await hero.dungeonCore();
    console.log("Hero → DungeonCore:", heroDungeonCore === DUNGEONCORE_ADDRESS ? "✅" : "❌");
    
    // 驗證 Relic 設定
    const relicDungeonCore = await relic.dungeonCore();
    console.log("Relic → DungeonCore:", relicDungeonCore === DUNGEONCORE_ADDRESS ? "✅" : "❌");
    
    // 驗證 DungeonCore 設定
    const coreHero = await dungeonCore.heroContractAddress();
    const coreRelic = await dungeonCoreRelic.relicContractAddress();
    console.log("DungeonCore → Hero:", coreHero === heroAddress ? "✅" : "❌");
    console.log("DungeonCore → Relic:", coreRelic === relicAddress ? "✅" : "❌");
    
    // 輸出配置更新
    console.log("\n📋 部署總結:");
    console.log("====================");
    console.log("新 Hero 地址:", heroAddress);
    console.log("新 Relic 地址:", relicAddress);
    console.log("\n⚠️ 請更新以下配置:");
    console.log("1. 前端 .env 文件");
    console.log("2. 後端 contracts.json");
    console.log("3. 子圖 networks.json");
    console.log("\n建議執行:");
    console.log("cd /Users/sotadic/Documents/DungeonDelversContracts");
    console.log("node scripts/ultimate-config-system.js sync");
    
    // 保存部署結果
    const fs = require('fs');
    const deploymentData = {
        timestamp: new Date().toISOString(),
        network: "BSC Mainnet",
        contracts: {
            Hero: heroAddress,
            Relic: relicAddress,
            DungeonCore: DUNGEONCORE_ADDRESS,
            VRFManager: VRF_MANAGER_ADDRESS
        },
        oldContracts: {
            Hero: OLD_HERO_ADDRESS,
            Relic: OLD_RELIC_ADDRESS
        }
    };
    
    const filename = `deployments/v25.1-fix-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
    console.log("\n💾 部署記錄已保存:", filename);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
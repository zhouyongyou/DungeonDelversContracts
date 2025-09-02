// 手動設置 V25.1.6 RequestId 更新合約的連接
// 新合約地址需要與 DungeonCore 建立雙向連接

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🔧 開始手動設置合約連接");
    console.log("📍 操作者地址:", deployer.address);
    
    // 新部署的合約地址
    const newAddresses = {
        hero: "0x67DdB736D1D9F7aecDfd0D5eDC84331Dd8684454",
        relic: "0xd4692e9f113624B4fA901d8BBAD0616a25bBD958",
        altar: "0xB2680EB761096F5599955F36Db59202c503dF5bC",
        dungeonMaster: "0x4af1C93Df44266Ed27Cf93Ce641bbc46e7ffFDB5"
    };
    
    // 現有合約地址（從 .env 讀取）
    const coreAddress = "0x5B64A5939735Ff762493D9B9666b3e13118c5722";
    const vrfManagerAddress = "0x0735FB572f1eDc26D86f8Bb9fd37d015A572544d";
    const dungeonStorageAddress = "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec";
    
    try {
        // 1. 連接到 DungeonCore 合約
        console.log("\n=== 1. 更新 DungeonCore 中的合約地址 ===");
        const DungeonCore = await ethers.getContractFactory("DungeonCore");
        const dungeonCore = DungeonCore.attach(coreAddress);
        
        // 設置新的 Hero 地址
        console.log("設置 Hero 地址...");
        await dungeonCore.setHeroContract(newAddresses.hero);
        console.log("✅ Hero 地址已更新");
        
        // 設置新的 Relic 地址
        console.log("設置 Relic 地址...");
        await dungeonCore.setRelicContract(newAddresses.relic);
        console.log("✅ Relic 地址已更新");
        
        // 設置新的 AltarOfAscension 地址
        console.log("設置 AltarOfAscension 地址...");
        await dungeonCore.setAltarOfAscension(newAddresses.altar);
        console.log("✅ AltarOfAscension 地址已更新");
        
        // 設置新的 DungeonMaster 地址
        console.log("設置 DungeonMaster 地址...");
        await dungeonCore.setDungeonMaster(newAddresses.dungeonMaster);
        console.log("✅ DungeonMaster 地址已更新");
        
        console.log("\n=== 2. 設置新合約中的 DungeonCore 地址 ===");
        
        // 2a. 設置 Hero 合約的 DungeonCore 地址
        console.log("設置 Hero 合約的 DungeonCore...");
        const Hero = await ethers.getContractFactory("Hero");
        const hero = Hero.attach(newAddresses.hero);
        await hero.setDungeonCore(coreAddress);
        console.log("✅ Hero -> DungeonCore 連接已建立");
        
        // 2b. 設置 Relic 合約的 DungeonCore 地址
        console.log("設置 Relic 合約的 DungeonCore...");
        const Relic = await ethers.getContractFactory("Relic");
        const relic = Relic.attach(newAddresses.relic);
        await relic.setDungeonCore(coreAddress);
        console.log("✅ Relic -> DungeonCore 連接已建立");
        
        // 2c. 設置 AltarOfAscension 的連接
        console.log("設置 AltarOfAscension 的連接...");
        const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
        const altar = AltarOfAscension.attach(newAddresses.altar);
        await altar.setDungeonCore(coreAddress);
        console.log("✅ AltarOfAscension 連接已建立");
        
        // 2d. 設置 DungeonMaster 的連接
        console.log("設置 DungeonMaster 的連接...");
        const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = DungeonMaster.attach(newAddresses.dungeonMaster);
        await dungeonMaster.setDungeonCore(coreAddress);
        await dungeonMaster.setDungeonStorage(dungeonStorageAddress);
        console.log("✅ DungeonMaster 連接已建立");
        
        console.log("\n=== 3. 驗證連接狀態 ===");
        
        // 驗證 DungeonCore 中的地址
        const heroAddr = await dungeonCore.heroContractAddress();
        const relicAddr = await dungeonCore.relicContractAddress();
        const altarAddr = await dungeonCore.altarOfAscensionAddress();
        const dmAddr = await dungeonCore.dungeonMasterAddress();
        
        console.log("DungeonCore 中的地址:");
        console.log("  Hero:", heroAddr);
        console.log("  Relic:", relicAddr);
        console.log("  Altar:", altarAddr);
        console.log("  DungeonMaster:", dmAddr);
        
        // 驗證各合約中的 DungeonCore 地址
        const heroCoreAddr = await hero.dungeonCore();
        const relicCoreAddr = await relic.dungeonCore();
        const altarCoreAddr = await altar.dungeonCore();
        const dmCoreAddr = await dungeonMaster.dungeonCore();
        
        console.log("\n各合約中的 DungeonCore 地址:");
        console.log("  Hero -> Core:", heroCoreAddr);
        console.log("  Relic -> Core:", relicCoreAddr);
        console.log("  Altar -> Core:", altarCoreAddr);
        console.log("  DungeonMaster -> Core:", dmCoreAddr);
        
        // 檢查連接是否正確
        const allConnected = 
            heroAddr.toLowerCase() === newAddresses.hero.toLowerCase() &&
            relicAddr.toLowerCase() === newAddresses.relic.toLowerCase() &&
            altarAddr.toLowerCase() === newAddresses.altar.toLowerCase() &&
            dmAddr.toLowerCase() === newAddresses.dungeonMaster.toLowerCase() &&
            heroCoreAddr.toLowerCase() === coreAddress.toLowerCase() &&
            relicCoreAddr.toLowerCase() === coreAddress.toLowerCase() &&
            altarCoreAddr.toLowerCase() === coreAddress.toLowerCase() &&
            dmCoreAddr.toLowerCase() === coreAddress.toLowerCase();
        
        if (allConnected) {
            console.log("\n🎉 === 連接設置完成 ===");
            console.log("✅ 所有合約連接已正確建立");
            console.log("✅ 雙向連接驗證通過");
            
            console.log("\n📋 下一步操作:");
            console.log("1. 同步配置到前端、後端、子圖");
            console.log("2. 部署新版子圖 (v4.0.9)");
            console.log("3. 測試 RequestId 匹配功能");
            
            return true;
        } else {
            console.log("\n❌ 連接設置有誤，請檢查");
            return false;
        }
        
    } catch (error) {
        console.error("❌ 設置過程中發生錯誤:", error);
        throw error;
    }
}

main()
    .then((success) => {
        if (success) {
            console.log("\n✅ 合約連接設置成功完成");
            process.exit(0);
        } else {
            console.log("\n❌ 合約連接設置失敗");
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
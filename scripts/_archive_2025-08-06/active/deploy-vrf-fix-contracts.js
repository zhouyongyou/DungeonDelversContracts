// deploy-vrf-fix-contracts.js - 部署修復後的 VRF 合約
// 專門部署四個已修復 VRF 回調接口的合約：Hero, Relic, AltarOfAscension, DungeonMaster

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 開始部署修復後的 VRF 合約...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("部署者餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB\n");

    const deploymentRecord = {
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        network: hre.network.name,
        contracts: {},
        gasUsed: {},
        errors: []
    };

    // 獲取當前合約地址（用於設置連接）
    const currentAddresses = {
        DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        VRFMANAGER: '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD',
        DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468'
    };

    try {
        // 1. 部署 Hero 合約
        console.log("📦 部署 Hero 合約...");
        const Hero = await hre.ethers.getContractFactory("Hero");
        const hero = await Hero.deploy(deployer.address);
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        
        deploymentRecord.contracts.HERO = heroAddress;
        deploymentRecord.gasUsed.HERO = await hero.deploymentTransaction().wait();
        
        console.log("✅ Hero 部署成功:", heroAddress);

        // 2. 部署 Relic 合約
        console.log("\n📦 部署 Relic 合約...");
        const Relic = await hre.ethers.getContractFactory("Relic");
        const relic = await Relic.deploy(deployer.address);
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        
        deploymentRecord.contracts.RELIC = relicAddress;
        deploymentRecord.gasUsed.RELIC = await relic.deploymentTransaction().wait();
        
        console.log("✅ Relic 部署成功:", relicAddress);

        // 3. 部署 AltarOfAscensionVRF 合約
        console.log("\n📦 部署 AltarOfAscension 合約...");
        const AltarOfAscension = await hre.ethers.getContractFactory("AltarOfAscensionVRF");
        const altar = await AltarOfAscension.deploy(deployer.address);
        await altar.waitForDeployment();
        const altarAddress = await altar.getAddress();
        
        deploymentRecord.contracts.ALTAROFASCENSION = altarAddress;
        deploymentRecord.gasUsed.ALTAROFASCENSION = await altar.deploymentTransaction().wait();
        
        console.log("✅ AltarOfAscension 部署成功:", altarAddress);

        // 4. 部署 DungeonMaster 合約
        console.log("\n📦 部署 DungeonMaster 合約...");
        const DungeonMaster = await hre.ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMaster.deploy(deployer.address);
        await dungeonMaster.waitForDeployment();
        const dungeonMasterAddress = await dungeonMaster.getAddress();
        
        deploymentRecord.contracts.DUNGEONMASTER = dungeonMasterAddress;
        deploymentRecord.gasUsed.DUNGEONMASTER = await dungeonMaster.deploymentTransaction().wait();
        
        console.log("✅ DungeonMaster 部署成功:", dungeonMasterAddress);

        // 5. 設置合約連接
        console.log("\n⚙️ 設置合約連接...");

        // 設置 Hero 合約連接
        console.log("🔗 設置 Hero 合約連接...");
        await hero.setDungeonCore(currentAddresses.DUNGEONCORE);
        await hero.setSoulShardToken(currentAddresses.SOULSHARD);
        await hero.setVRFManager(currentAddresses.VRFMANAGER);
        console.log("✅ Hero 連接設置完成");

        // 設置 Relic 合約連接
        console.log("🔗 設置 Relic 合約連接...");
        await relic.setDungeonCore(currentAddresses.DUNGEONCORE);
        await relic.setSoulShardToken(currentAddresses.SOULSHARD);
        await relic.setVRFManager(currentAddresses.VRFMANAGER);
        console.log("✅ Relic 連接設置完成");

        // 設置 AltarOfAscension 合約連接
        console.log("🔗 設置 AltarOfAscension 合約連接...");
        await altar.setDungeonCore(currentAddresses.DUNGEONCORE);
        await altar.setVRFManager(currentAddresses.VRFMANAGER);
        console.log("✅ AltarOfAscension 連接設置完成");

        // 設置 DungeonMaster 合約連接
        console.log("🔗 設置 DungeonMaster 合約連接...");
        await dungeonMaster.setDungeonCore(currentAddresses.DUNGEONCORE);
        await dungeonMaster.setDungeonStorage(currentAddresses.DUNGEONSTORAGE);
        await dungeonMaster.setVRFManager(currentAddresses.VRFMANAGER);
        console.log("✅ DungeonMaster 連接設置完成");

        // 6. 授權合約使用 VRF Manager
        console.log("\n🔐 授權合約使用 VRF Manager...");
        const vrfManager = await hre.ethers.getContractAt("VRFManager", currentAddresses.VRFMANAGER);
        
        await vrfManager.authorizeContract(heroAddress);
        console.log("✅ Hero 已授權使用 VRF");
        
        await vrfManager.authorizeContract(relicAddress);
        console.log("✅ Relic 已授權使用 VRF");
        
        await vrfManager.authorizeContract(altarAddress);
        console.log("✅ AltarOfAscension 已授權使用 VRF");
        
        await vrfManager.authorizeContract(dungeonMasterAddress);
        console.log("✅ DungeonMaster 已授權使用 VRF");

        // 7. 輸出最終結果
        console.log("\n🎉 所有合約部署和設置完成！");
        console.log("\n📋 新合約地址：");
        console.log("HERO:", heroAddress);
        console.log("RELIC:", relicAddress);
        console.log("ALTAROFASCENSION:", altarAddress);
        console.log("DUNGEONMASTER:", dungeonMasterAddress);

        // 8. 保存部署記錄
        const deploymentPath = path.join(__dirname, `../deployments/vrf-fix-deployment-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
        console.log("\n💾 部署記錄已保存到:", deploymentPath);

        // 9. 生成環境變數
        console.log("\n📝 環境變數配置：");
        console.log(`HERO_ADDRESS=${heroAddress}`);
        console.log(`RELIC_ADDRESS=${relicAddress}`);
        console.log(`ALTAROFASCENSION_ADDRESS=${altarAddress}`);
        console.log(`DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`);

        // 10. 下一步提醒
        console.log("\n⚠️ 重要提醒：");
        console.log("1. 請更新 DungeonCore 合約中的這些地址");
        console.log("2. 請更新前端和子圖配置文件");
        console.log("3. 請驗證所有合約在 BSCScan 上");
        console.log("4. 請測試鑄造功能是否正常工作");

    } catch (error) {
        console.error("❌ 部署過程中發生錯誤:", error);
        deploymentRecord.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // 保存錯誤記錄
        const errorPath = path.join(__dirname, `../deployments/vrf-fix-error-${Date.now()}.json`);
        fs.writeFileSync(errorPath, JSON.stringify(deploymentRecord, null, 2));
        console.log("💾 錯誤記錄已保存到:", errorPath);
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
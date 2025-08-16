const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("=== 重新部署修復後的 Hero 和 Relic 合約 ===\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("部署者餘額:", ethers.formatEther(balance), "BNB\n");
    
    // V25 相關地址
    const ADDRESSES = {
        DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
        VRF_MANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1",
        OLD_HERO: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD",
        OLD_RELIC: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4"
    };
    
    try {
        console.log("📦 部署新的 Hero 合約...");
        const HeroFactory = await ethers.getContractFactory("Hero");
        const hero = await HeroFactory.deploy(deployer.address);
        await hero.waitForDeployment();
        const heroAddress = await hero.getAddress();
        console.log("✅ Hero 部署完成:", heroAddress);
        
        console.log("📦 部署新的 Relic 合約...");
        const RelicFactory = await ethers.getContractFactory("Relic");
        const relic = await RelicFactory.deploy(deployer.address);
        await relic.waitForDeployment();
        const relicAddress = await relic.getAddress();
        console.log("✅ Relic 部署完成:", relicAddress);
        
        console.log("\n🔧 配置新的 Hero 合約...");
        
        // 設定 DungeonCore
        let tx = await hero.setDungeonCore(ADDRESSES.DUNGEONCORE);
        await tx.wait();
        console.log("✅ Hero DungeonCore 設定完成");
        
        // 設定 VRF Manager  
        tx = await hero.setVRFManager(ADDRESSES.VRF_MANAGER);
        await tx.wait();
        console.log("✅ Hero VRF Manager 設定完成");
        
        // 設定平台費為 0
        tx = await hero.setPlatformFee(0);
        await tx.wait();
        console.log("✅ Hero 平台費設為 0");
        
        console.log("\n🔧 配置新的 Relic 合約...");
        
        // 設定 DungeonCore
        tx = await relic.setDungeonCore(ADDRESSES.DUNGEONCORE);
        await tx.wait();
        console.log("✅ Relic DungeonCore 設定完成");
        
        // 設定 VRF Manager
        tx = await relic.setVRFManager(ADDRESSES.VRF_MANAGER);
        await tx.wait();
        console.log("✅ Relic VRF Manager 設定完成");
        
        // 設定平台費為 0
        tx = await relic.setPlatformFee(0);
        await tx.wait();
        console.log("✅ Relic 平台費設為 0");
        
        console.log("\n🔧 設定 VRF Manager 授權...");
        const vrfManager = await ethers.getContractAt("IVRFManager", ADDRESSES.VRF_MANAGER);
        
        try {
            tx = await vrfManager.authorizeContract(heroAddress);
            await tx.wait();
            console.log("✅ VRF Manager 授權 Hero");
        } catch (error) {
            console.log("⚠️ VRF Manager 授權 Hero 失敗:", error.message);
        }
        
        try {
            tx = await vrfManager.authorizeContract(relicAddress);
            await tx.wait();
            console.log("✅ VRF Manager 授權 Relic");
        } catch (error) {
            console.log("⚠️ VRF Manager 授權 Relic 失敗:", error.message);
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ 修復部署完成！");
        console.log("─".repeat(60));
        console.log("🆕 新的合約地址:");
        console.log("HERO (修復版):", heroAddress);
        console.log("RELIC (修復版):", relicAddress);
        
        console.log("\n📋 舊地址 (需要在前端/子圖更新):");
        console.log("HERO (舊):", ADDRESSES.OLD_HERO);
        console.log("RELIC (舊):", ADDRESSES.OLD_RELIC);
        
        console.log("\n🔧 修復內容:");
        console.log("- 將 getTotalFee() 改為 vrfRequestPrice()");
        console.log("- VRF 費用現在正確讀取為 0.0001 BNB");
        console.log("- 平台費設為 0 BNB");
        
        console.log("\n⚠️ 後續同步工作:");
        console.log("1. 更新前端合約地址");
        console.log("2. 更新子圖合約地址");
        console.log("3. 更新後端 API 地址");
        console.log("4. 更新 DungeonCore 中的 Hero/Relic 地址");
        
        // 驗證修復
        console.log("\n🧪 驗證修復效果...");
        const vrfFee = await vrfManager.vrfRequestPrice();
        console.log("VRF 費用:", ethers.formatEther(vrfFee), "BNB");
        
        const heroPlatformFee = await hero.platformFee();
        console.log("Hero 平台費:", ethers.formatEther(heroPlatformFee), "BNB");
        
        const relicPlatformFee = await relic.platformFee();
        console.log("Relic 平台費:", ethers.formatEther(relicPlatformFee), "BNB");
        
        // 保存配置
        const config = {
            timestamp: new Date().toISOString(),
            version: "V25-FIX",
            contracts: {
                HERO: heroAddress,
                RELIC: relicAddress,
                VRF_MANAGER: ADDRESSES.VRF_MANAGER,
                DUNGEONCORE: ADDRESSES.DUNGEONCORE
            },
            changes: [
                "修復 VRF 費用調用從 getTotalFee() 改為 vrfRequestPrice()",
                "平台費設為 0",
                "VRF Manager 授權設定"
            ]
        };
        
        require('fs').writeFileSync(
            'V25-FIX-DEPLOYMENT.json',
            JSON.stringify(config, null, 2)
        );
        
        console.log("\n✅ 配置已保存至: V25-FIX-DEPLOYMENT.json");
        
    } catch (error) {
        console.error("❌ 部署失敗:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
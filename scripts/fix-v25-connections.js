const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔧 修復 V25 合約互連設定...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("🔑 執行者:", deployer.address);
    console.log("💰 餘額:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");
    
    // V25 合約地址
    const addresses = {
        DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
        HERO: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD",
        RELIC: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4",
        DUNGEONMASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253",
        DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
        ALTAROFASCENSION: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33",
        VRFMANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
    };
    
    // 簡化 ABI
    const heroABI = [
        "function setDungeonCore(address _dungeonCore) external",
        "function setVrfManager(address _vrfManager) external",
        "function setPlatformFee(uint256 _platformFee) external",
        "function dungeonCore() external view returns (address)",
        "function vrfManager() external view returns (address)",
        "function owner() external view returns (address)"
    ];
    
    const dungeonCoreABI = [
        "function setHeroContract(address _heroContract) external",
        "function setRelicContract(address _relicContract) external", 
        "function setDungeonMasterContract(address _dungeonMaster) external",
        "function heroContract() external view returns (address)",
        "function relicContract() external view returns (address)",
        "function owner() external view returns (address)"
    ];
    
    const vrfManagerABI = [
        "function setVrfRequestPrice(uint256 _price) external",
        "function setPlatformFee(uint256 _fee) external",
        "function authorizeContract(address _contract) external",
        "function owner() external view returns (address)"
    ];
    
    try {
        console.log("🔧 開始修復合約連接...\n");
        
        // 1. 設定 HERO 合約的連接
        console.log("1️⃣ 設定 HERO 合約連接:");
        const hero = new ethers.Contract(addresses.HERO, heroABI, deployer);
        
        const heroOwner = await hero.owner();
        console.log("- HERO 擁有者:", heroOwner);
        
        if (heroOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ 無法修改 HERO 合約 - 不是擁有者");
        } else {
            // 設定 VRF Manager (如果需要)
            const currentVrfManager = await hero.vrfManager();
            if (currentVrfManager.toLowerCase() !== addresses.VRFMANAGER.toLowerCase()) {
                console.log("- 更新 VRF Manager...");
                const tx1 = await hero.setVrfManager(addresses.VRFMANAGER, { gasLimit: 100000 });
                await tx1.wait();
                console.log("✅ HERO -> VRF Manager 連接已修復");
            } else {
                console.log("✅ HERO -> VRF Manager 連接正常");
            }
            
            // 設定平台費為 0
            console.log("- 設定平台費為 0...");
            const tx2 = await hero.setPlatformFee(0, { gasLimit: 100000 });
            await tx2.wait();
            console.log("✅ HERO 平台費已設為 0");
        }
        
        // 2. 設定 DungeonCore 連接
        console.log("\n2️⃣ 設定 DungeonCore 連接:");
        const dungeonCore = new ethers.Contract(addresses.DUNGEONCORE, dungeonCoreABI, deployer);
        
        try {
            const dcOwner = await dungeonCore.owner();
            console.log("- DungeonCore 擁有者:", dcOwner);
            
            if (dcOwner.toLowerCase() !== deployer.address.toLowerCase()) {
                console.log("❌ 無法修改 DungeonCore 合約 - 不是擁有者");
            } else {
                // 設定 HERO 合約
                try {
                    const currentHero = await dungeonCore.heroContract();
                    if (currentHero.toLowerCase() !== addresses.HERO.toLowerCase()) {
                        console.log("- 更新 Hero 合約地址...");
                        const tx3 = await dungeonCore.setHeroContract(addresses.HERO, { gasLimit: 100000 });
                        await tx3.wait();
                        console.log("✅ DungeonCore -> HERO 連接已修復");
                    } else {
                        console.log("✅ DungeonCore -> HERO 連接正常");
                    }
                } catch (error) {
                    console.log("⚠️ 無法讀取或設定 Hero 合約:", error.message);
                }
                
                // 設定 RELIC 合約
                try {
                    const currentRelic = await dungeonCore.relicContract();
                    if (currentRelic.toLowerCase() !== addresses.RELIC.toLowerCase()) {
                        console.log("- 更新 Relic 合約地址...");
                        const tx4 = await dungeonCore.setRelicContract(addresses.RELIC, { gasLimit: 100000 });
                        await tx4.wait();
                        console.log("✅ DungeonCore -> RELIC 連接已修復");
                    } else {
                        console.log("✅ DungeonCore -> RELIC 連接正常");
                    }
                } catch (error) {
                    console.log("⚠️ 無法讀取或設定 Relic 合約:", error.message);
                }
            }
        } catch (error) {
            console.log("❌ DungeonCore 連接檢查失敗:", error.message);
            console.log("💡 可能原因: DungeonCore 合約 ABI 不匹配或合約暫停");
        }
        
        // 3. 設定 VRF Manager
        console.log("\n3️⃣ 設定 VRF Manager:");
        const vrfManager = new ethers.Contract(addresses.VRFMANAGER, vrfManagerABI, deployer);
        
        try {
            const vrfOwner = await vrfManager.owner();
            console.log("- VRF Manager 擁有者:", vrfOwner);
            
            if (vrfOwner.toLowerCase() !== deployer.address.toLowerCase()) {
                console.log("❌ 無法修改 VRF Manager 合約 - 不是擁有者");
            } else {
                // 設定合理的 VRF 費用
                console.log("- 設定 VRF 費用為 0.0005 BNB...");
                const vrfFee = ethers.parseEther("0.0005");
                const tx5 = await vrfManager.setVrfRequestPrice(vrfFee, { gasLimit: 100000 });
                await tx5.wait();
                console.log("✅ VRF 請求費用已設為 0.0005 BNB");
                
                // 設定平台費為 0
                console.log("- 設定 VRF 平台費為 0...");
                const tx6 = await vrfManager.setPlatformFee(0, { gasLimit: 100000 });
                await tx6.wait();
                console.log("✅ VRF 平台費已設為 0");
                
                // 授權 HERO 合約
                console.log("- 授權 HERO 合約使用 VRF...");
                const tx7 = await vrfManager.authorizeContract(addresses.HERO, { gasLimit: 100000 });
                await tx7.wait();
                console.log("✅ HERO 合約已授權使用 VRF");
                
                // 授權 RELIC 合約
                console.log("- 授權 RELIC 合約使用 VRF...");
                const tx8 = await vrfManager.authorizeContract(addresses.RELIC, { gasLimit: 100000 });
                await tx8.wait();
                console.log("✅ RELIC 合約已授權使用 VRF");
            }
        } catch (error) {
            console.log("❌ VRF Manager 設定失敗:", error.message);
            console.log("💡 可能原因: VRF Manager 合約函數名稱不匹配");
        }
        
        console.log("\n🎉 V25 合約互連修復完成！");
        console.log("\n💡 接下來的步驟:");
        console.log("1. 運行 check-v25-connections.js 驗證修復結果");
        console.log("2. 測試前端鑄造功能");
        console.log("3. 確認費用計算正確");
        
        // 顯示最終費用設定
        console.log("\n💰 最終費用設定:");
        console.log("- HERO 平台費: 0 BNB");
        console.log("- VRF 請求費用: 0.0005 BNB (~$0.3)");
        console.log("- VRF 平台費: 0 BNB");
        console.log("- 總鑄造費用: 0.0005 BNB (~$0.3)");
        
    } catch (error) {
        console.error("❌ 修復失敗:", error.message);
        
        if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("💡 解決方案: 請使用合約擁有者地址執行此腳本");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 解決方案: 請確保錢包有足夠的 BNB");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
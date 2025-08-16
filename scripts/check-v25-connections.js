const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 檢查 V25 合約互連狀態...\n");
    
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
        "function dungeonCore() external view returns (address)",
        "function vrfManager() external view returns (address)",
        "function platformFee() external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    const dungeonCoreABI = [
        "function heroContract() external view returns (address)",
        "function relicContract() external view returns (address)",
        "function dungeonMasterContract() external view returns (address)",
        "function owner() external view returns (address)"
    ];
    
    const vrfManagerABI = [
        "function getVrfRequestPrice() external view returns (uint256)",
        "function vrfRequestPrice() external view returns (uint256)",
        "function getTotalFee() external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    try {
        console.log("📊 檢查合約連接狀態:\n");
        
        // 檢查 HERO 合約連接
        console.log("🧙‍♂️ HERO 合約檢查:");
        const hero = new ethers.Contract(addresses.HERO, heroABI, ethers.provider);
        
        const heroDungeonCore = await hero.dungeonCore();
        const heroVrfManager = await hero.vrfManager();
        const heroOwner = await hero.owner();
        
        console.log("- DungeonCore 連接:", heroDungeonCore);
        console.log("- 預期 DungeonCore:", addresses.DUNGEONCORE);
        console.log("- VRF Manager 連接:", heroVrfManager);
        console.log("- 預期 VRF Manager:", addresses.VRFMANAGER);
        console.log("- 擁有者:", heroOwner);
        
        // 檢查費用讀取
        try {
            const platformFee = await hero.platformFee();
            console.log("- 平台費:", ethers.formatEther(platformFee), "BNB");
        } catch (error) {
            console.log("- 平台費: 讀取失敗", error.message);
        }
        
        // 檢查 DungeonCore 連接
        console.log("\n🏰 DungeonCore 合約檢查:");
        const dungeonCore = new ethers.Contract(addresses.DUNGEONCORE, dungeonCoreABI, ethers.provider);
        
        const dcHeroContract = await dungeonCore.heroContract();
        const dcRelicContract = await dungeonCore.relicContract();
        const dcDungeonMaster = await dungeonCore.dungeonMasterContract();
        const dcOwner = await dungeonCore.owner();
        
        console.log("- Hero 合約連接:", dcHeroContract);
        console.log("- 預期 Hero:", addresses.HERO);
        console.log("- Relic 合約連接:", dcRelicContract);
        console.log("- 預期 Relic:", addresses.RELIC);
        console.log("- DungeonMaster 連接:", dcDungeonMaster);
        console.log("- 預期 DungeonMaster:", addresses.DUNGEONMASTER);
        console.log("- 擁有者:", dcOwner);
        
        // 檢查 VRF Manager
        console.log("\n🎲 VRF Manager 檢查:");
        const vrfManager = new ethers.Contract(addresses.VRFMANAGER, vrfManagerABI, ethers.provider);
        
        const vrfOwner = await vrfManager.owner();
        console.log("- 擁有者:", vrfOwner);
        
        // 嘗試不同的費用函數名稱
        const feeFunctions = ['getVrfRequestPrice', 'vrfRequestPrice', 'getTotalFee'];
        let vrfFeeFound = false;
        
        for (const funcName of feeFunctions) {
            try {
                const fee = await vrfManager[funcName]();
                console.log(`- ${funcName}:`, ethers.formatEther(fee), "BNB");
                vrfFeeFound = true;
            } catch (error) {
                console.log(`- ${funcName}: 函數不存在或調用失敗`);
            }
        }
        
        // 總結連接問題
        console.log("\n🔧 連接狀態總結:");
        const issues = [];
        
        if (heroDungeonCore.toLowerCase() !== addresses.DUNGEONCORE.toLowerCase()) {
            issues.push("❌ HERO -> DungeonCore 連接錯誤");
        } else {
            console.log("✅ HERO -> DungeonCore 連接正確");
        }
        
        if (heroVrfManager.toLowerCase() !== addresses.VRFMANAGER.toLowerCase()) {
            issues.push("❌ HERO -> VRF Manager 連接錯誤");
        } else {
            console.log("✅ HERO -> VRF Manager 連接正確");
        }
        
        if (dcHeroContract.toLowerCase() !== addresses.HERO.toLowerCase()) {
            issues.push("❌ DungeonCore -> HERO 連接錯誤");
        } else {
            console.log("✅ DungeonCore -> HERO 連接正確");
        }
        
        if (dcRelicContract.toLowerCase() !== addresses.RELIC.toLowerCase()) {
            issues.push("❌ DungeonCore -> RELIC 連接錯誤");
        } else {
            console.log("✅ DungeonCore -> RELIC 連接正確");
        }
        
        if (dcDungeonMaster.toLowerCase() !== addresses.DUNGEONMASTER.toLowerCase()) {
            issues.push("❌ DungeonCore -> DungeonMaster 連接錯誤");
        } else {
            console.log("✅ DungeonCore -> DungeonMaster 連接正確");
        }
        
        if (!vrfFeeFound) {
            issues.push("❌ VRF Manager 費用函數無法讀取");
        } else {
            console.log("✅ VRF Manager 費用可以讀取");
        }
        
        if (issues.length > 0) {
            console.log("\n🚨 發現問題:");
            issues.forEach(issue => console.log(issue));
            console.log("\n💡 建議解決步驟:");
            console.log("1. 運行 fix-v25-connections.js 修復連接");
            console.log("2. 確保所有合約擁有者相同");
            console.log("3. 重新測試前端鑄造功能");
        } else {
            console.log("\n🎉 所有合約連接正常！");
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
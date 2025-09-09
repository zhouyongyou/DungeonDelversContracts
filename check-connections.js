// 檢查合約間連接狀態
const { ethers } = require("hardhat");
require('dotenv').config();

async function checkConnections() {
    console.log("🔍 檢查合約間連接狀態...");
    
    const vipStakingAddr = process.env.VITE_VIPSTAKING_ADDRESS;
    const dungeonCoreAddr = process.env.VITE_DUNGEONCORE_ADDRESS;
    
    console.log(`VIPStaking: ${vipStakingAddr}`);
    console.log(`DungeonCore: ${dungeonCoreAddr}`);
    
    try {
        // 檢查VIPStaking合約
        const vipStaking = await ethers.getContractAt("VIPStaking", vipStakingAddr);
        
        // 檢查VIPStaking中的DungeonCore地址
        const connectedCore = await vipStaking.dungeonCore();
        console.log(`VIPStaking.dungeonCore(): ${connectedCore}`);
        
        if (connectedCore.toLowerCase() === dungeonCoreAddr.toLowerCase()) {
            console.log("✅ VIPStaking → DungeonCore 連接正常");
        } else {
            console.log("❌ VIPStaking → DungeonCore 連接異常");
        }
        
        // 檢查DungeonCore合約
        const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddr);
        
        // 檢查DungeonCore中的VIPStaking地址
        const connectedVip = await dungeonCore.vipStakingAddress();
        console.log(`DungeonCore.vipStakingAddress(): ${connectedVip}`);
        
        if (connectedVip.toLowerCase() === vipStakingAddr.toLowerCase()) {
            console.log("✅ DungeonCore → VIPStaking 連接正常");
        } else {
            console.log("❌ DungeonCore → VIPStaking 連接異常");
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

checkConnections().catch(console.error);
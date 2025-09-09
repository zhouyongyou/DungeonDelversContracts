// 檢查VIPStaking合約實際擁有的函數
const { ethers } = require("hardhat");
require('dotenv').config();

async function checkVipFunctions() {
    console.log("🔍 檢查VIPStaking合約函數...");
    
    const vipStakingAddr = process.env.VITE_VIPSTAKING_ADDRESS;
    console.log(`VIPStaking地址: ${vipStakingAddr}`);
    
    try {
        // 先用基本ERC721檢查合約是否存在
        const provider = ethers.provider;
        const code = await provider.getCode(vipStakingAddr);
        
        if (code === "0x") {
            console.log("❌ 合約地址無效或合約不存在");
            return;
        }
        
        console.log("✅ 合約存在，代碼長度:", code.length);
        
        // 嘗試基本函數調用
        const vipStaking = await ethers.getContractAt("VIPStaking", vipStakingAddr);
        
        try {
            const name = await vipStaking.name();
            console.log(`合約名稱: ${name}`);
        } catch (e) {
            console.log("❌ 無法獲取name():", e.message);
        }
        
        try {
            const owner = await vipStaking.owner();
            console.log(`合約擁有者: ${owner}`);
        } catch (e) {
            console.log("❌ 無法獲取owner():", e.message);
        }
        
        // 檢查是否有getVipLevel函數
        try {
            const testLevel = await vipStaking.getVipLevel(ethers.ZeroAddress);
            console.log(`測試getVipLevel: ${testLevel}`);
        } catch (e) {
            console.log("❌ 無法調用getVipLevel:", e.message);
        }
        
    } catch (error) {
        console.error("❌ 檢查失敗:", error.message);
    }
}

checkVipFunctions().catch(console.error);
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("=== 測試 VRF 修復方案 ===\n");
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    // V25 地址
    const ADDRESSES = {
        HERO: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD",
        RELIC: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4",
        VRF_MANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
    };
    
    // VRF Manager ABI（只測試需要的函數）
    const vrfManagerAbi = [
        "function vrfRequestPrice() external view returns (uint256)",
        "function getTotalFee() external view returns (uint256)"
    ];
    
    console.log("🔍 測試 VRF Manager 函數可用性:");
    console.log("VRF Manager:", ADDRESSES.VRF_MANAGER);
    
    const vrfManager = new ethers.Contract(ADDRESSES.VRF_MANAGER, vrfManagerAbi, provider);
    
    // 測試 vrfRequestPrice
    try {
        const vrfPrice = await vrfManager.vrfRequestPrice();
        console.log("✅ vrfRequestPrice():", ethers.formatEther(vrfPrice), "BNB");
    } catch (error) {
        console.log("❌ vrfRequestPrice() 失敗:", error.message);
    }
    
    // 測試 getTotalFee
    try {
        const totalFee = await vrfManager.getTotalFee();
        console.log("✅ getTotalFee():", ethers.formatEther(totalFee), "BNB");
    } catch (error) {
        console.log("❌ getTotalFee() 失敗:", error.message);
    }
    
    console.log("\n💡 解決方案建議:");
    console.log("1. Hero/Relic 合約應該使用 vrfRequestPrice() 而不是 getTotalFee()");
    console.log("2. 前端也應該使用 vrfRequestPrice() 來顯示費用");
    console.log("3. VRF 費用為 0.0001 BNB，平台費為 0 BNB");
    
    // 計算 50 個 NFT 的實際費用
    console.log("\n📊 費用計算（50 個 NFT）:");
    const vrfPrice = await vrfManager.vrfRequestPrice();
    const platformFee = 0; // 已設為 0
    const quantity = 50;
    
    const totalFee = platformFee + parseFloat(ethers.formatEther(vrfPrice));
    console.log("VRF 費用:", ethers.formatEther(vrfPrice), "BNB");
    console.log("平台費 × 50:", platformFee, "BNB");
    console.log("總費用:", totalFee, "BNB");
    
    console.log("\n🎯 修復策略:");
    console.log("方案 A: 重新部署 Hero/Relic 合約（需要更多 gas）");
    console.log("方案 B: 創建代理合約來處理 VRF 調用");
    console.log("方案 C: 直接讓前端調用正確的函數並傳遞正確費用");
    
    // 檢查當前 Hero 合約是否可以升級
    const heroAbi = [
        "function owner() external view returns (address)",
        "function vrfManager() external view returns (address)",
        "function platformFee() external view returns (uint256)"
    ];
    
    const hero = new ethers.Contract(ADDRESSES.HERO, heroAbi, provider);
    
    console.log("\n📋 當前 Hero 合約狀態:");
    try {
        const owner = await hero.owner();
        console.log("Owner:", owner);
        
        const vrfManagerAddr = await hero.vrfManager();
        console.log("VRF Manager:", vrfManagerAddr);
        console.log("VRF Manager 正確:", vrfManagerAddr.toLowerCase() === ADDRESSES.VRF_MANAGER.toLowerCase());
        
        const platformFeeValue = await hero.platformFee();
        console.log("平台費:", ethers.formatEther(platformFeeValue), "BNB");
    } catch (error) {
        console.log("檢查合約狀態失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
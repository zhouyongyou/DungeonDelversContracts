// simple-vrf-check.js - 簡化的 VRF 檢查
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 簡化 VRF 檢查...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    
    // 合約地址
    const VRFMANAGER = '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD';
    const HERO = '0xD48867dbac5f1c1351421726B6544f847D9486af';

    try {
        // 檢查基本合約存在
        console.log("🔧 檢查合約是否存在...");
        const vrfCode = await provider.getCode(VRFMANAGER);
        const heroCode = await provider.getCode(HERO);
        
        console.log("VRFManager 合約存在:", vrfCode !== '0x');
        console.log("Hero 合約存在:", heroCode !== '0x');

        // 嘗試基本的 view 函數
        console.log("\n🔧 嘗試基本函數調用...");
        
        // VRFManager 基本 ABI
        const vrfBasicABI = [
            'function owner() external view returns (address)',
            'function paused() external view returns (bool)',
            'function s_subscriptionId() external view returns (uint64)'
        ];
        
        const vrfManager = new ethers.Contract(VRFMANAGER, vrfBasicABI, provider);
        
        try {
            const owner = await vrfManager.owner();
            console.log("✅ VRFManager Owner:", owner);
        } catch (e) {
            console.log("❌ 無法獲取 owner:", e.message);
        }

        try {
            const paused = await vrfManager.paused();
            console.log("✅ VRFManager Paused:", paused);
        } catch (e) {
            console.log("❌ 無法獲取 paused 狀態:", e.message);
        }

        try {
            const subId = await vrfManager.s_subscriptionId();
            console.log("✅ Subscription ID:", subId.toString());
            
            if (subId.toString() === '0') {
                console.log("🚨 警告：Subscription ID 為 0，這可能是問題所在！");
            }
        } catch (e) {
            console.log("❌ 無法獲取 subscription ID:", e.message);
        }

        // Hero 合約檢查
        console.log("\n🔧 檢查 Hero 合約...");
        const heroBasicABI = [
            'function vrfManager() external view returns (address)',
            'function paused() external view returns (bool)',
            'function platformFeeRate() external view returns (uint256)'
        ];
        
        const hero = new ethers.Contract(HERO, heroBasicABI, provider);
        
        try {
            const heroVrfManager = await hero.vrfManager();
            console.log("✅ Hero VRFManager:", heroVrfManager);
            console.log("地址匹配:", heroVrfManager.toLowerCase() === VRFMANAGER.toLowerCase());
        } catch (e) {
            console.log("❌ 無法獲取 Hero VRFManager:", e.message);
        }

        try {
            const heroPaused = await hero.paused();
            console.log("✅ Hero Paused:", heroPaused);
        } catch (e) {
            console.log("❌ 無法獲取 Hero paused 狀態:", e.message);
        }

        try {
            const feeRate = await hero.platformFeeRate();
            console.log("✅ Platform Fee Rate:", feeRate.toString());
        } catch (e) {
            console.log("❌ 無法獲取 platform fee rate:", e.message);
        }

    } catch (error) {
        console.error("❌ 檢查過程中發生錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
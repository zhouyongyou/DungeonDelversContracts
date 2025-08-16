const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 分析 mint 交易失敗原因\n");
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    const userAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
    const soulAddress = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    console.log("📊 檢查用戶餘額和合約狀態:");
    
    // 檢查 SOUL 餘額
    const soulAbi = ["function balanceOf(address) external view returns (uint256)"];
    const soul = new ethers.Contract(soulAddress, soulAbi, provider);
    
    try {
        const balance = await soul.balanceOf(userAddress);
        console.log("用戶 SOUL 餘額:", ethers.formatEther(balance), "SOUL");
        
        // 檢查需要多少 SOUL
        const heroAbi = [
            "function getRequiredSoulShardAmount(uint256) external view returns (uint256)",
            "function platformFee() external view returns (uint256)",
            "function paused() external view returns (bool)",
            "function vrfManager() external view returns (address)"
        ];
        const hero = new ethers.Contract(heroAddress, heroAbi, provider);
        
        const required = await hero.getRequiredSoulShardAmount(50);
        console.log("50 個 NFT 需要:", ethers.formatEther(required), "SOUL");
        
        const sufficient = BigInt(balance) >= BigInt(required);
        console.log("SOUL 餘額充足:", sufficient);
        
        // 檢查合約狀態
        const platformFee = await hero.platformFee();
        console.log("平台費:", ethers.formatEther(platformFee), "BNB");
        
        const isPaused = await hero.paused();
        console.log("合約暫停:", isPaused);
        
        const vrfManagerAddr = await hero.vrfManager();
        console.log("VRF Manager:", vrfManagerAddr);
        console.log("VRF Manager 正確:", vrfManagerAddr.toLowerCase() === vrfManagerAddress.toLowerCase());
        
        // 檢查用戶是否有pending mint
        const heroFullAbi = [
            "function userCommitments(address) external view returns (uint256, uint256, uint256, bytes32, bool, uint8, bool)"
        ];
        const heroFull = new ethers.Contract(heroAddress, heroFullAbi, provider);
        
        try {
            const commitment = await heroFull.userCommitments(userAddress);
            console.log("用戶 pending mint 區塊:", commitment[0].toString());
            console.log("是否已完成:", commitment[4]);
            
            if (commitment[0] > 0 && !commitment[4]) {
                console.log("🚨 用戶有未完成的 mint！");
            }
        } catch (error) {
            console.log("檢查用戶 commitment 失敗:", error.message);
        }
        
        console.log("\n💡 分析結果:");
        if (!sufficient) {
            console.log("❌ 失敗原因: SOUL 餘額不足");
        } else if (isPaused) {
            console.log("❌ 失敗原因: 合約被暫停");
        } else {
            console.log("✅ 餘額和基本檢查都正常");
            console.log("🤔 可能原因:");
            console.log("1. 用戶有未完成的 mint");
            console.log("2. VRF Manager 問題");
            console.log("3. 其他合約邏輯錯誤");
            
            // 測試模擬交易
            console.log("\n🧪 模擬交易測試:");
            console.log("如果用戶支付 0 BNB (正確金額) 會如何？");
        }
        
    } catch (error) {
        console.log("❌ 檢查失敗:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
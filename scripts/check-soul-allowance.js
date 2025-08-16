const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 檢查 SOUL 授權狀況\n");
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    const userAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
    const soulAddress = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    
    const soulAbi = [
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address) external view returns (uint256)"
    ];
    
    const soul = new ethers.Contract(soulAddress, soulAbi, provider);
    
    try {
        const allowance = await soul.allowance(userAddress, heroAddress);
        const balance = await soul.balanceOf(userAddress);
        const required = ethers.parseEther("1703649.10090107002407135");
        
        console.log("📊 SOUL 狀況:");
        console.log("用戶餘額:", ethers.formatEther(balance), "SOUL");
        console.log("Hero 授權:", ethers.formatEther(allowance), "SOUL");
        console.log("需要數量:", ethers.formatEther(required), "SOUL");
        
        const balanceSufficient = balance >= required;
        const allowanceSufficient = allowance >= required;
        
        console.log("\n✅ 檢查結果:");
        console.log("餘額充足:", balanceSufficient);
        console.log("授權充足:", allowanceSufficient);
        
        if (!balanceSufficient) {
            console.log("❌ 用戶 SOUL 餘額不足");
        } else if (!allowanceSufficient) {
            console.log("🚨 找到問題！SOUL 授權不足！");
            console.log("💡 解決方案: 用戶需要先 approve SOUL 給 Hero 合約");
            console.log("需要授權金額:", ethers.formatEther(required), "SOUL");
        } else {
            console.log("✅ SOUL 餘額和授權都充足，問題在其他地方");
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
// 修復VIPStaking與DungeonCore的連接
const { ethers } = require("hardhat");
require('dotenv').config();

async function fixVipConnection() {
    console.log("🔧 修復VIPStaking與DungeonCore連接...");
    
    const vipAddr = process.env.VITE_VIPSTAKING_ADDRESS;
    const coreAddr = process.env.VITE_DUNGEONCORE_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    
    console.log(`VIP地址: ${vipAddr}`);
    console.log(`Core地址: ${coreAddr}`);
    
    // 使用管理員錢包
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`管理員地址: ${wallet.address}`);
    
    try {
        // 連接VIPStaking合約
        const vipAbi = [
            "function setDungeonCore(address) external",
            "function dungeonCore() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const vipContract = new ethers.Contract(vipAddr, vipAbi, wallet);
        
        // 檢查當前狀態
        const currentCore = await vipContract.dungeonCore();
        const owner = await vipContract.owner();
        
        console.log(`當前DungeonCore: ${currentCore}`);
        console.log(`合約擁有者: ${owner}`);
        console.log(`是否為擁有者: ${wallet.address.toLowerCase() === owner.toLowerCase()}`);
        
        if (currentCore.toLowerCase() === coreAddr.toLowerCase()) {
            console.log("✅ DungeonCore地址已經正確設定");
            return;
        }
        
        // 設定DungeonCore地址
        console.log("\n🔧 設定DungeonCore地址...");
        
        const gasPrice = ethers.parseUnits("1", "gwei"); // 稍高的gas price
        
        const tx = await vipContract.setDungeonCore(coreAddr, {
            gasPrice: gasPrice,
            gasLimit: 100000
        });
        
        console.log(`交易哈希: ${tx.hash}`);
        console.log("⏳ 等待確認...");
        
        const receipt = await tx.wait();
        console.log(`✅ 交易確認! Gas使用: ${receipt.gasUsed}`);
        
        // 驗證設定
        const newCore = await vipContract.dungeonCore();
        if (newCore.toLowerCase() === coreAddr.toLowerCase()) {
            console.log("✅ DungeonCore地址設定成功!");
        } else {
            console.log("❌ DungeonCore地址設定失敗");
        }
        
    } catch (error) {
        console.error("❌ 修復失敗:", error.message);
        
        if (error.message.includes('Ownable')) {
            console.error("🔒 權限錯誤: 只有合約擁有者可以設定DungeonCore地址");
        }
    }
}

fixVipConnection().catch(console.error);
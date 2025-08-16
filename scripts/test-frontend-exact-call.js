const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 測試前端的確切調用...\n");
    
    // 檢查前端可能調用的所有地址和函數
    const addresses = {
        current: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1", // 當前 VRF Manager
        old: "0xD95d0A29055E810e9f8c64073998832d66538176" // 舊的 VRF Manager
    };
    
    const vrfABI = [
        "function vrfRequestPrice() external view returns (uint256)",
        "function getVrfRequestPrice() external view returns (uint256)",
        "function getTotalFee() external view returns (uint256)"
    ];
    
    console.log("📊 測試不同地址的 VRF 費用:\n");
    
    for (const [name, address] of Object.entries(addresses)) {
        console.log(`🎯 測試 ${name.toUpperCase()} VRF Manager: ${address}`);
        
        try {
            const contract = new ethers.Contract(address, vrfABI, ethers.provider);
            
            // 測試不同的函數
            const functions = ['vrfRequestPrice', 'getVrfRequestPrice', 'getTotalFee'];
            
            for (const funcName of functions) {
                try {
                    const result = await contract[funcName]();
                    const ethValue = ethers.formatEther(result);
                    console.log(`- ${funcName}: ${result.toString()} wei = ${ethValue} BNB`);
                    
                    // 檢查是否是 0.005
                    if (ethValue === "0.005") {
                        console.log(`  🚨 發現！這個函數返回 0.005 BNB`);
                    }
                } catch (error) {
                    console.log(`- ${funcName}: 調用失敗`);
                }
            }
        } catch (error) {
            console.log(`❌ 無法連接到合約: ${error.message}`);
        }
        console.log();
    }
    
    // 檢查 HERO 合約是否指向錯誤的 VRF Manager
    console.log("🧙‍♂️ 檢查 HERO 合約的 VRF Manager 連接:");
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
    const heroABI = [
        "function vrfManager() external view returns (address)"
    ];
    
    try {
        const hero = new ethers.Contract(heroAddress, heroABI, ethers.provider);
        const heroVrfManager = await hero.vrfManager();
        console.log(`- HERO 合約指向的 VRF Manager: ${heroVrfManager}`);
        console.log(`- 是否指向當前地址: ${heroVrfManager.toLowerCase() === addresses.current.toLowerCase()}`);
        console.log(`- 是否指向舊地址: ${heroVrfManager.toLowerCase() === addresses.old.toLowerCase()}`);
        
        if (heroVrfManager.toLowerCase() === addresses.old.toLowerCase()) {
            console.log("🚨 找到問題！HERO 合約仍指向舊的 VRF Manager");
        }
    } catch (error) {
        console.log(`❌ 無法讀取 HERO 合約: ${error.message}`);
    }
    
    // 檢查前端可能使用的其他合約
    console.log("\n🔍 檢查其他可能的 VRF 相關合約:");
    
    // 檢查是否有其他 VRF 合約
    const possibleVrfAddresses = [
        "0xd506138ccE44eaF6BDA0580F606228ff960BA2Ca", // master-config 中的舊地址
        "0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038"  // config.ts 中的舊地址
    ];
    
    for (const addr of possibleVrfAddresses) {
        console.log(`\n🔍 測試地址 ${addr}:`);
        try {
            const contract = new ethers.Contract(addr, vrfABI, ethers.provider);
            const price = await contract.vrfRequestPrice();
            const ethValue = ethers.formatEther(price);
            console.log(`- vrfRequestPrice: ${ethValue} BNB`);
            
            if (ethValue === "0.005") {
                console.log(`🎯 找到 0.005 BNB 的來源！`);
            }
        } catch (error) {
            console.log(`- 無法連接或調用失敗`);
        }
    }
    
    console.log("\n💡 建議檢查項目:");
    console.log("1. 確認前端使用的 VRF Manager 地址");
    console.log("2. 檢查是否有緩存或舊配置");
    console.log("3. 確認 HERO 合約指向正確的 VRF Manager");
    console.log("4. 檢查前端是否調用了不同的函數");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
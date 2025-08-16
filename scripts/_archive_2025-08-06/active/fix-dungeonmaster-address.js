// fix-dungeonmaster-address.js - 修復 DungeonCore 中的 DungeonMaster 地址
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 修復 DungeonCore 中的 DungeonMaster 地址...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address);
    
    // 正確的地址
    const correctAddresses = {
        DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253', // 正確的 DungeonMaster 地址
    };

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 200000 };

        // DungeonCore ABI
        const dungeonCoreABI = [
            'function setDungeonMaster(address _newAddress) external',
            'function dungeonMasterAddress() external view returns (address)'
        ];
        
        const dungeonCore = new ethers.Contract(correctAddresses.DUNGEONCORE, dungeonCoreABI, wallet);

        // 檢查並更新 DungeonMaster 地址
        console.log("🔍 檢查當前 DungeonMaster 地址...");
        const currentDungeonMaster = await dungeonCore.dungeonMasterAddress();
        console.log("當前 DungeonMaster:", currentDungeonMaster);
        console.log("正確 DungeonMaster:", correctAddresses.DUNGEONMASTER);

        if (currentDungeonMaster.toLowerCase() !== correctAddresses.DUNGEONMASTER.toLowerCase()) {
            console.log(`🔄 更新 DungeonMaster: ${currentDungeonMaster} → ${correctAddresses.DUNGEONMASTER}`);
            let tx = await dungeonCore.setDungeonMaster(correctAddresses.DUNGEONMASTER, gasOptions);
            await tx.wait();
            console.log("✅ DungeonMaster 地址已更新");
        } else {
            console.log("✅ DungeonMaster 地址已正確");
        }

        // 驗證設定
        console.log("\n📋 驗證最終設定：");
        const finalDungeonMaster = await dungeonCore.dungeonMasterAddress();
        console.log("DungeonMaster:", finalDungeonMaster);

        console.log("\n🎉 DungeonMaster 地址修復完成！");

    } catch (error) {
        console.error("❌ 修復過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
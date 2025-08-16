// update-dungeoncore.js - 更新 DungeonCore 中的合約地址
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔄 更新 DungeonCore 中的合約地址...\n");

    // 設置提供者和錢包
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address);
    
    // DungeonCore 合約
    const dungeonCoreAddress = '0x8a2D2b1961135127228EdD71Ff98d6B097915a13';
    const dungeonCoreABI = [
        'function setHeroContract(address _newAddress) external',
        'function setRelicContract(address _newAddress) external',
        'function setAltarOfAscension(address _newAddress) external',
        'function setDungeonMaster(address _newAddress) external',
        'function owner() external view returns (address)',
        'function heroContractAddress() external view returns (address)',
        'function relicContractAddress() external view returns (address)',
        'function altarOfAscensionAddress() external view returns (address)',
        'function dungeonMasterAddress() external view returns (address)'
    ];
    
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, wallet);
    
    // 新合約地址
    const newAddresses = {
        HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
        RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
        ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
        DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253'
    };

    try {
        // 檢查當前地址
        console.log("📋 當前地址：");
        const currentHero = await dungeonCore.heroContractAddress();
        const currentRelic = await dungeonCore.relicContractAddress();
        const currentAltar = await dungeonCore.altarOfAscensionAddress();
        const currentDM = await dungeonCore.dungeonMasterAddress();
        
        console.log("Hero:", currentHero);
        console.log("Relic:", currentRelic);
        console.log("AltarOfAscension:", currentAltar);
        console.log("DungeonMaster:", currentDM);

        // 檢查權限
        const owner = await dungeonCore.owner();
        console.log("\nDungeonCore 擁有者:", owner);
        console.log("當前操作者:", wallet.address);
        
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
            throw new Error("權限不足：當前錢包不是 DungeonCore 的擁有者");
        }

        // 獲取 gas 價格
        const feeData = await provider.getFeeData();
        
        // 更新 Hero 地址
        console.log("\n🔄 更新 Hero 地址...");
        let tx = await dungeonCore.setHeroContract(newAddresses.HERO, {
            gasPrice: feeData.gasPrice,
            gasLimit: 100000
        });
        await tx.wait();
        console.log("✅ Hero 地址已更新:", newAddresses.HERO);

        // 更新 Relic 地址
        console.log("🔄 更新 Relic 地址...");
        tx = await dungeonCore.setRelicContract(newAddresses.RELIC, {
            gasPrice: feeData.gasPrice,
            gasLimit: 100000
        });
        await tx.wait();
        console.log("✅ Relic 地址已更新:", newAddresses.RELIC);

        // 更新 AltarOfAscension 地址
        console.log("🔄 更新 AltarOfAscension 地址...");
        tx = await dungeonCore.setAltarOfAscension(newAddresses.ALTAROFASCENSION, {
            gasPrice: feeData.gasPrice,
            gasLimit: 100000
        });
        await tx.wait();
        console.log("✅ AltarOfAscension 地址已更新:", newAddresses.ALTAROFASCENSION);

        // 更新 DungeonMaster 地址
        console.log("🔄 更新 DungeonMaster 地址...");
        tx = await dungeonCore.setDungeonMaster(newAddresses.DUNGEONMASTER, {
            gasPrice: feeData.gasPrice,
            gasLimit: 100000
        });
        await tx.wait();
        console.log("✅ DungeonMaster 地址已更新:", newAddresses.DUNGEONMASTER);

        console.log("\n🎉 所有地址更新完成！");
        
        // 驗證更新
        console.log("\n📋 驗證新地址：");
        const newHero = await dungeonCore.heroContractAddress();
        const newRelic = await dungeonCore.relicContractAddress();
        const newAltar = await dungeonCore.altarOfAscensionAddress();
        const newDM = await dungeonCore.dungeonMasterAddress();
        
        console.log("Hero:", newHero);
        console.log("Relic:", newRelic);
        console.log("AltarOfAscension:", newAltar);
        console.log("DungeonMaster:", newDM);
        
        // 檢查是否正確更新
        const success = 
            newHero.toLowerCase() === newAddresses.HERO.toLowerCase() &&
            newRelic.toLowerCase() === newAddresses.RELIC.toLowerCase() &&
            newAltar.toLowerCase() === newAddresses.ALTAROFASCENSION.toLowerCase() &&
            newDM.toLowerCase() === newAddresses.DUNGEONMASTER.toLowerCase();
            
        if (success) {
            console.log("\n✅ 地址驗證成功！所有地址已正確更新。");
        } else {
            console.log("\n❌ 地址驗證失敗！請檢查更新結果。");
        }

    } catch (error) {
        console.error("\n❌ 更新失敗:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
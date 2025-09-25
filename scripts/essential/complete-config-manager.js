// complete-config-manager.js - 完成剩餘的配置步驟
// 🎯 基於已部署的合約地址，完成剩餘配置

const { ethers } = require("hardhat");

// 🚨 強制 Gas Price 0.11 gwei
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 200000;

// 現有 DungeonCore 地址
const DUNGEONCORE_ADDRESS = "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b";

// 新部署的合約地址 (v1.4.0.3)
const NEW_ADDRESSES = {
    DungeonStorage: "0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791",
    VRFConsumerV2Plus: "0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c", 
    PlayerVault: "0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0",
    Hero: "0xc09b6613c32a505bf05f97ed2f567b4959914396",
    Relic: "0xf4ae79568a34af621bbea06b716e8fb84b5b41b6", 
    Party: "0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129",
    PlayerProfile: "0xea827e472937abd1117f0d4104a76e173724a061",
    VIPStaking: "0x0440634aa6e4028efAFEFe7683B39E3a7BEC0EBC",
    AltarOfAscension: "0x3dfd80271eb96c3be8d1e841643746954ffda11d", 
    DungeonMaster: "0xa573ccf8332a5b1e830ea04a87856a28c99d9b53"
};

async function executeTransaction(description, contractName, contract, methodName, args) {
    console.log(`\\n🔗 ${description}`);
    
    try {
        const tx = await contract[methodName](...args, {
            gasPrice: GAS_PRICE,
            gasLimit: GAS_LIMIT
        });
        
        console.log(`📤 交易發送: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ 交易確認於區塊: ${receipt.blockNumber}`);
        
        return { success: true, receipt };
    } catch (error) {
        console.error(`❌ 交易失敗: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function checkCurrentConfig() {
    console.log("🔍 檢查當前 DungeonCore 配置...");
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
    
    const currentAddresses = {
        dungeonStorage: await dungeonCore.dungeonStorageAddress(),
        vrfManager: await dungeonCore.getVRFManager(), 
        playerVault: await dungeonCore.playerVaultAddress(),
        hero: await dungeonCore.heroContractAddress(),
        relic: await dungeonCore.relicContractAddress(),
        party: await dungeonCore.partyContractAddress(),
        playerProfile: await dungeonCore.playerProfileAddress(),
        vipStaking: await dungeonCore.vipStakingAddress(),
        dungeonMaster: await dungeonCore.dungeonMasterAddress(),
        altarOfAscension: await dungeonCore.altarOfAscensionAddress()
    };
    
    console.log("\\n📋 當前 DungeonCore 配置:");
    Object.entries(currentAddresses).forEach(([name, addr]) => {
        const expected = NEW_ADDRESSES[name.charAt(0).toUpperCase() + name.slice(1)] || NEW_ADDRESSES[name];
        const match = expected && addr.toLowerCase() === expected.toLowerCase();
        console.log(`${name}: ${addr} ${match ? '✅' : '❌'}`);
    });
    
    return currentAddresses;
}

async function completeConfiguration() {
    console.log("\\n🔧 完成剩餘配置步驟...");
    
    // 需要配置的合約 - 只配置可能未完成的
    const reverseConfigs = [
        { name: "PlayerProfile", method: "setDungeonCore" },
        { name: "VIPStaking", method: "setDungeonCore" },
        { name: "AltarOfAscension", method: "setDungeonCore" },
        { name: "DungeonMaster", method: "setDungeonCore" }
    ];
    
    const results = [];
    
    for (const config of reverseConfigs) {
        const contractAddress = NEW_ADDRESSES[config.name];
        if (!contractAddress) {
            console.log(`⚠️ 跳過 ${config.name}: 地址未找到`);
            continue;
        }
        
        try {
            const contract = await ethers.getContractAt(config.name, contractAddress);
            
            // 檢查當前設置
            let currentCore;
            try {
                currentCore = await contract.dungeonCore();
            } catch (error) {
                console.log(`⚠️ ${config.name} 沒有 dungeonCore() 函數`);
                continue;
            }
            
            if (currentCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase()) {
                console.log(`✅ ${config.name} 已正確配置 DungeonCore`);
                results.push({ contract: config.name, status: "already_configured" });
                continue;
            }
            
            const result = await executeTransaction(
                `${config.name} 連接到 DungeonCore`,
                config.name,
                contract,
                config.method,
                [DUNGEONCORE_ADDRESS]
            );
            
            results.push({ 
                contract: config.name, 
                status: result.success ? "success" : "failed",
                error: result.error 
            });
            
            // 等待1秒避免nonce衝突
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ ${config.name} 配置失敗:`, error.message);
            results.push({ contract: config.name, status: "error", error: error.message });
        }
    }
    
    return results;
}

async function main() {
    console.log("🎯 完成 DungeonDelvers v1.4.0.3 配置");
    console.log("=".repeat(50));
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 執行者: ${deployer.address}`);
    
    try {
        // 檢查當前配置
        await checkCurrentConfig();
        
        // 完成剩餘配置
        const results = await completeConfiguration();
        
        // 最終驗證
        console.log("\\n🔍 最終驗證...");
        await checkCurrentConfig();
        
        console.log("\\n📊 配置結果摘要:");
        results.forEach(result => {
            const status = result.status === "success" ? "✅ 成功" :
                          result.status === "already_configured" ? "✅ 已配置" :
                          result.status === "failed" ? "❌ 失敗" : "⚠️ 錯誤";
            console.log(`${result.contract}: ${status}`);
        });
        
        console.log("\\n🎉 v1.4.0.3 配置完成!");
        console.log("\\n📋 新部署的合約地址:");
        Object.entries(NEW_ADDRESSES).forEach(([name, addr]) => {
            console.log(`${name.padEnd(20)}: ${addr}`);
        });
        
        console.log("\\n🔄 後續步驟:");
        console.log("1. 更新 .env 文件中的合約地址");  
        console.log("2. 驗證所有新部署的合約");
        console.log("3. 更新子圖配置");
        console.log("4. 更新前端合約地址");
        console.log("5. 測試探險功能確認獎勵修復");
        
    } catch (error) {
        console.error("💥 配置失敗:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });
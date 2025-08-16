// scripts/check-current-baseuri.ts
// 檢查所有 NFT 合約當前的 baseURI 設定

import { ethers } from "hardhat";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);
const logWarning = (message: string) => console.log(`\x1b[33m${message}\x1b[0m`);

async function main() {
    log("🔍 檢查所有 NFT 合約的當前 BaseURI 設定...");

    const [signer] = await ethers.getSigners();
    logInfo(`查詢錢包: ${signer.address}`);

    // 從環境變數讀取合約地址
    const {
        HERO_ADDRESS,
        RELIC_ADDRESS,
        PARTY_ADDRESS,
        VIPSTAKING_ADDRESS,
        PLAYERPROFILE_ADDRESS,
        // 備用地址（可能在不同的環境變數名稱下）
        VITE_MAINNET_HERO_ADDRESS,
        VITE_MAINNET_RELIC_ADDRESS,
        VITE_MAINNET_PARTY_ADDRESS,
        VITE_MAINNET_VIPSTAKING_ADDRESS,
        VITE_MAINNET_PLAYERPROFILE_ADDRESS,
        METADATA_SERVER_BASE_URL
    } = process.env;

    // 合約配置（使用主要地址或備用地址）
    const contracts = [
        {
            name: "Hero",
            address: HERO_ADDRESS || VITE_MAINNET_HERO_ADDRESS,
            expectedPath: "/api/hero/"
        },
        {
            name: "Relic", 
            address: RELIC_ADDRESS || VITE_MAINNET_RELIC_ADDRESS,
            expectedPath: "/api/relic/"
        },
        {
            name: "Party",
            address: PARTY_ADDRESS || VITE_MAINNET_PARTY_ADDRESS,
            expectedPath: "/api/party/"
        },
        {
            name: "VIPStaking",
            address: VIPSTAKING_ADDRESS || VITE_MAINNET_VIPSTAKING_ADDRESS,
            expectedPath: "/api/vip/"
        },
        {
            name: "PlayerProfile",
            address: PLAYERPROFILE_ADDRESS || VITE_MAINNET_PLAYERPROFILE_ADDRESS,
            expectedPath: "/api/profile/"
        }
    ];

    log("📊 當前 BaseURI 設定狀態:");
    logInfo(`預期的 Metadata Server: ${METADATA_SERVER_BASE_URL || "未設定"}`);
    
    let allCorrect = true;
    
    // 檢查每個合約的 BaseURI
    for (const contract of contracts) {
        if (!contract.address) {
            logError(`❌ ${contract.name} 合約地址未設定`);
            allCorrect = false;
            continue;
        }

        try {
            logInfo(`\n檢查 ${contract.name} 合約...`);
            logInfo(`地址: ${contract.address}`);
            
            // 連接到合約
            const contractInstance = await ethers.getContractAt(contract.name, contract.address);
            
            // 獲取當前 BaseURI
            let currentBaseURI: string;
            try {
                currentBaseURI = await contractInstance.baseURI();
            } catch (e) {
                // 如果沒有 baseURI 函數，嘗試調用 tokenURI 推測
                try {
                    const testTokenURI = await contractInstance.tokenURI(1);
                    currentBaseURI = testTokenURI.replace(/1$/, '');
                    logInfo(`從 tokenURI 推測 baseURI`);
                } catch (e2) {
                    logError(`無法獲取 BaseURI`);
                    allCorrect = false;
                    continue;
                }
            }
            
            logInfo(`當前 BaseURI: ${currentBaseURI}`);
            
            // 分析 BaseURI
            if (currentBaseURI.includes("ipfs://")) {
                logWarning(`⚠️  使用 IPFS: ${currentBaseURI}`);
                allCorrect = false;
            } else if (currentBaseURI.includes("dungeon-delvers-metadata-server")) {
                logSuccess(`✅ 使用 Metadata Server: ${currentBaseURI}`);
                
                // 檢查路徑是否正確
                if (!currentBaseURI.includes(contract.expectedPath)) {
                    logWarning(`⚠️  路徑可能不正確，預期包含: ${contract.expectedPath}`);
                    allCorrect = false;
                }
            } else if (currentBaseURI === "" || currentBaseURI === "/") {
                logError(`❌ BaseURI 為空`);
                allCorrect = false;
            } else {
                logWarning(`⚠️  使用未知來源: ${currentBaseURI}`);
                allCorrect = false;
            }
            
            // 測試 tokenURI
            try {
                const testTokenURI = await contractInstance.tokenURI(1);
                logInfo(`測試 tokenURI(1): ${testTokenURI}`);
            } catch (e) {
                logInfo(`無法測試 tokenURI(1)，可能 token 不存在`);
            }

        } catch (error: any) {
            logError(`❌ 檢查 ${contract.name} 失敗: ${error.message}`);
            allCorrect = false;
        }
    }

    log("\n📋 總結:");
    if (allCorrect) {
        logSuccess("✅ 所有合約的 BaseURI 都正確指向 Metadata Server!");
    } else {
        logWarning("⚠️  部分合約的 BaseURI 需要更新");
        log("\n💡 建議執行以下命令更新 BaseURI:");
        logInfo("npx hardhat run scripts/active/update/update-baseuri-to-api.ts --network bsc");
    }
}

main().catch((error) => {
    console.error("❌ 檢查過程中發生錯誤:", error);
    process.exitCode = 1;
});
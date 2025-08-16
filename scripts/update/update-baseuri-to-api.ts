// scripts/update-baseuri-to-api.ts
// 更新現有合約的 BaseURI 為後端 API 端點

import { ethers } from "hardhat";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

async function main() {
    log("🔄 更新合約 BaseURI 為後端 API 端點...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);

    // 從環境變數讀取配置
    const {
        METADATA_SERVER_BASE_URL,
        VITE_MAINNET_HERO_ADDRESS,
        VITE_MAINNET_RELIC_ADDRESS,
        VITE_MAINNET_PARTY_ADDRESS,
        VITE_MAINNET_VIPSTAKING_ADDRESS,
        VITE_MAINNET_PLAYERPROFILE_ADDRESS
    } = process.env;

    if (!METADATA_SERVER_BASE_URL) {
        throw new Error("❌ 請在 .env 文件中設定 METADATA_SERVER_BASE_URL");
    }

    logInfo(`後端 API 基礎 URL: ${METADATA_SERVER_BASE_URL}`);

    // 合約配置
    const contracts = [
        {
            name: "Hero",
            address: VITE_MAINNET_HERO_ADDRESS,
            baseURI: `${METADATA_SERVER_BASE_URL}/api/hero/`
        },
        {
            name: "Relic", 
            address: VITE_MAINNET_RELIC_ADDRESS,
            baseURI: `${METADATA_SERVER_BASE_URL}/api/relic/`
        },
        {
            name: "Party",
            address: VITE_MAINNET_PARTY_ADDRESS,
            baseURI: `${METADATA_SERVER_BASE_URL}/api/party/`
        },
        {
            name: "VIPStaking",
            address: VITE_MAINNET_VIPSTAKING_ADDRESS,
            baseURI: `${METADATA_SERVER_BASE_URL}/api/vip/`
        },
        {
            name: "PlayerProfile",
            address: VITE_MAINNET_PLAYERPROFILE_ADDRESS,
            baseURI: `${METADATA_SERVER_BASE_URL}/api/profile/`
        }
    ];

    // 更新每個合約的 BaseURI
    for (const contract of contracts) {
        if (!contract.address) {
            logError(`❌ ${contract.name} 合約地址未設定，跳過`);
            continue;
        }

        try {
            logInfo(`正在更新 ${contract.name} 合約的 BaseURI...`);
            
            // 連接到合約
            const contractInstance = await ethers.getContractAt(contract.name, contract.address);
            
            // 檢查當前 BaseURI
            try {
                const currentBaseURI = await contractInstance.baseURI();
                logInfo(`當前 BaseURI: ${currentBaseURI}`);
            } catch (e) {
                logInfo(`無法讀取當前 BaseURI，可能是合約接口問題`);
            }

            // 更新 BaseURI
            logInfo(`設定新的 BaseURI: ${contract.baseURI}`);
            const tx = await contractInstance.setBaseURI(contract.baseURI);
            await tx.wait();
            
            logSuccess(`✅ ${contract.name} BaseURI 更新成功！`);
            logInfo(`交易哈希: ${tx.hash}`);

        } catch (error: any) {
            logError(`❌ 更新 ${contract.name} BaseURI 失敗: ${error.message}`);
        }
    }

    logSuccess("🎉 BaseURI 更新完成！");
}

main().catch((error) => {
    console.error("❌ 更新過程中發生錯誤:", error);
    process.exitCode = 1;
}); 
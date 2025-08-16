// scripts/check-current-baseuri.ts
// 檢查所有合約當前的 BaseURI 設定

import { ethers } from "hardhat";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);
const logWarning = (message: string) => console.log(`\x1b[33m${message}\x1b[0m`);

async function main() {
    log("🔍 檢查所有合約的當前 BaseURI 設定...");

    // 讀取 shared-config.json
    const configPath = path.join(__dirname, "../shared-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const expectedMetadataServer = process.env.METADATA_SERVER_BASE_URL || "https://dungeon-delvers-metadata-server.onrender.com";
    logInfo(`預期的 Metadata Server: ${expectedMetadataServer}`);

    // 合約配置
    const contracts = [
        {
            name: "Hero",
            address: config.contracts.hero,
            expectedURI: `${expectedMetadataServer}/api/hero/`
        },
        {
            name: "Relic", 
            address: config.contracts.relic,
            expectedURI: `${expectedMetadataServer}/api/relic/`
        },
        {
            name: "Party",
            address: config.contracts.party,
            expectedURI: `${expectedMetadataServer}/api/party/`
        },
        {
            name: "VIPStaking",
            address: config.contracts.vipStaking,
            expectedURI: `${expectedMetadataServer}/api/vip/`
        },
        {
            name: "PlayerProfile",
            address: config.contracts.playerProfile,
            expectedURI: `${expectedMetadataServer}/api/profile/`
        }
    ];

    const results: any[] = [];

    // 檢查每個合約
    for (const contract of contracts) {
        try {
            logInfo(`檢查 ${contract.name} (${contract.address})...`);
            
            // 連接到合約
            const contractInstance = await ethers.getContractAt(contract.name, contract.address);
            
            // 讀取當前 BaseURI
            const currentBaseURI = await contractInstance.baseURI();
            
            const isCorrect = currentBaseURI === contract.expectedURI;
            
            results.push({
                name: contract.name,
                address: contract.address,
                currentBaseURI,
                expectedURI: contract.expectedURI,
                isCorrect
            });

            if (isCorrect) {
                logSuccess(`✅ ${contract.name}: BaseURI 設定正確`);
            } else {
                logWarning(`⚠️  ${contract.name}: BaseURI 需要更新`);
                logInfo(`當前: ${currentBaseURI}`);
                logInfo(`預期: ${contract.expectedURI}`);
            }

            // 測試 tokenURI
            try {
                const testTokenId = 1;
                const tokenURI = await contractInstance.tokenURI(testTokenId);
                logInfo(`Token #${testTokenId} URI: ${tokenURI}`);
            } catch (e) {
                logInfo(`無法測試 tokenURI (可能 token 不存在)`);
            }

        } catch (error: any) {
            logError(`❌ 檢查 ${contract.name} 失敗: ${error.message}`);
            results.push({
                name: contract.name,
                address: contract.address,
                error: error.message
            });
        }
    }

    // 總結報告
    log("\n📊 檢查結果總結:");
    log("=====================================");
    
    let needsUpdate = false;
    for (const result of results) {
        if (result.error) {
            logError(`${result.name}: 錯誤 - ${result.error}`);
        } else if (result.isCorrect) {
            logSuccess(`${result.name}: ✅ 正確`);
        } else {
            logWarning(`${result.name}: ⚠️  需要更新`);
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        log("\n💡 建議執行以下命令更新 BaseURI:");
        logInfo("npx hardhat run scripts/update-baseuri-to-api.ts --network bsc_mainnet");
    } else {
        logSuccess("\n🎉 所有合約的 BaseURI 設定都正確！");
    }

    // 檢查 metadata server 是否正常運作
    log("\n🌐 檢查 Metadata Server 狀態...");
    try {
        const fetch = (await import('node-fetch')).default;
        const healthResponse = await fetch(`${expectedMetadataServer}/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            logSuccess("✅ Metadata Server 運作正常");
            logInfo(`版本: ${healthData.version}`);
            logInfo(`合約配置:`);
            Object.entries(healthData.contracts).forEach(([key, value]) => {
                logInfo(`  ${key}: ${value}`);
            });
        } else {
            logWarning(`⚠️  Metadata Server 響應異常: ${healthResponse.status}`);
        }
    } catch (error) {
        logError(`❌ 無法連接到 Metadata Server: ${error.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
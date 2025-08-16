// scripts/deploy-and-update-oracle.ts
// 說明: 這個自動化腳本會完成兩件事：
// 1. 部署一個全新的、已修正的 Oracle 合約。
// 2. 自動將現有的 DungeonCore 合約指向這個新的 Oracle 地址。
// 修正版：移除了會導致錯誤的鏈上驗證步驟。

import { ethers, run, network } from "hardhat";
import "dotenv/config";

// =================================================================
// Section: 輔助函式
// =================================================================

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

// =================================================================
// Section: 主執行函式
// =================================================================

async function main() {
    const [deployer] = await ethers.getSigners();
    log("🚀 開始自動化部署新 Oracle 並更新 DungeonCore...");
    logInfo(`執行錢包: ${deployer.address}`);
    logInfo(`目標網路: ${network.name}`);

    // --- 步驟 1: 從 .env 檔案讀取所有必要的地址 ---
    log("步驟 1: 讀取 .env 檔案中的地址...");

    const {
        VITE_MAINNET_DUNGEONCORE_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS,
        POOL_ADDRESS
    } = process.env;

    if (!VITE_MAINNET_DUNGEONCORE_ADDRESS || !SOUL_SHARD_TOKEN_ADDRESS || !USD_TOKEN_ADDRESS || !POOL_ADDRESS) {
        throw new Error("❌ 錯誤：請務必在 .env 檔案中提供所有必要的地址。");
    }

    logInfo(`目標 DungeonCore 地址: ${VITE_MAINNET_DUNGEONCORE_ADDRESS}`);
    logInfo(`用於部署新 Oracle 的參數:`);
    logInfo(`  - SoulShard: ${SOUL_SHARD_TOKEN_ADDRESS}`);
    logInfo(`  - USD: ${USD_TOKEN_ADDRESS}`);
    logInfo(`  - Pool: ${POOL_ADDRESS}`);

    // --- 步驟 2: 部署新的 Oracle 合約 ---
    log("步驟 2: 正在部署新的 Oracle 合約...");
    const OracleFactory = await ethers.getContractFactory("Oracle");
    const newOracle = await OracleFactory.deploy(POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS);
    await newOracle.waitForDeployment();
    const newOracleAddress = await newOracle.getAddress();
    logSuccess(`✅ 新的 Oracle 已成功部署至: ${newOracleAddress}`);

    // --- 步驟 3: 連接到現有的 DungeonCore 合約並更新 ---
    log("步驟 3: 正在更新 DungeonCore 指向新的 Oracle...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", VITE_MAINNET_DUNGEONCORE_ADDRESS);
    
    const owner = await dungeonCore.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        logError(`❌ 警告：目前的執行錢包 (${deployer.address}) 並非 DungeonCore 的擁有者 (${owner})。`);
    }

    const tx = await dungeonCore.setOracle(newOracleAddress);
    logInfo(`交易已發送，正在等待確認... (Tx Hash: ${tx.hash})`);
    await tx.wait();
    logSuccess("✅ DungeonCore 中的 Oracle 地址已成功更新！");

    // --- 步驟 4: 自動驗證新的 Oracle 合約 ---
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 4: 驗證新的 Oracle 合約...");
        logInfo("等待 30 秒，以確保合約資訊已在區塊鏈瀏覽器上同步...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        try {
            await run("verify:verify", {
                address: newOracleAddress,
                constructorArguments: [POOL_ADDRESS, SOUL_SHARD_TOKEN_ADDRESS, USD_TOKEN_ADDRESS],
            });
            logSuccess(`✅ 新的 Oracle 合約驗證成功！`);
        } catch (e: any) {
            logError(`❌ Oracle 驗證失敗: ${e.message}`);
        }
    }

    // --- 最終報告 ---
    log("🎉🎉🎉 自動化流程執行完畢！ 🎉🎉🎉");
    log("\n🔔【重要】請手動執行以下後續步驟：");
    logInfo("1. 複製以下新的 Oracle 地址:");
    console.log(`   VITE_MAINNET_ORACLE_ADDRESS=${newOracleAddress}`);
    logInfo("2. 將這個新地址更新到您所有專案的 .env 檔案中 (Hardhat, Render, Vercel)。");
    logInfo("3. 重新部署您的前端 (Vercel) 和後端 (Render) 應用。");
    logInfo("4. (可選) 您可以手動前往 BscScan 查看 DungeonCore 的寫入交易，確認新的 Oracle 地址已被設定。");
}

main().catch((error) => {
  console.error("❌ 更新過程中發生致命錯誤:", error);
  process.exitCode = 1;
});

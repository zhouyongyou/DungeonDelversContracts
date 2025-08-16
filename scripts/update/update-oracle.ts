// scripts/update-oracle.ts
// 說明: 這個腳本專門用於更新 DungeonCore 合約中指向的 Oracle 合約地址。

import { ethers, network } from "hardhat";
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
    log("🚀 開始更新 Oracle 地址...");
    logInfo(`執行錢包: ${deployer.address}`);
    logInfo(`目標網路: ${network.name}`);

    // --- 步驟 1: 從 .env 檔案讀取地址 ---
    log("步驟 1: 讀取 .env 檔案中的地址...");

    const {
        VITE_MAINNET_DUNGEONCORE_ADDRESS,
        NEW_ORACLE_ADDRESS // ★ 我們將從這裡讀取新的 Oracle 地址
    } = process.env;

    if (!VITE_MAINNET_DUNGEONCORE_ADDRESS || !NEW_ORACLE_ADDRESS) {
        throw new Error("❌ 錯誤：請務必在 .env 檔案中提供 VITE_MAINNET_DUNGEONCORE_ADDRESS 和 NEW_ORACLE_ADDRESS。");
    }

    if (!ethers.isAddress(VITE_MAINNET_DUNGEONCORE_ADDRESS) || !ethers.isAddress(NEW_ORACLE_ADDRESS)) {
        throw new Error("❌ 錯誤：提供的地址格式不正確。");
    }

    logInfo(`DungeonCore 地址: ${VITE_MAINNET_DUNGEONCORE_ADDRESS}`);
    logInfo(`新的 Oracle 地址: ${NEW_ORACLE_ADDRESS}`);

    // --- 步驟 2: 連接到 DungeonCore 合約 ---
    log("步驟 2: 連接到 DungeonCore 合約...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", VITE_MAINNET_DUNGEONCORE_ADDRESS);
    logSuccess("✅ 成功連接到 DungeonCore！");

    // --- 步驟 3: 呼叫 setOracle 函式 ---
    log("步驟 3: 正在呼叫 setOracle() 函式...");
    
    // 檢查目前的擁有者是否為執行者
    const owner = await dungeonCore.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        logError(`❌ 警告：目前的執行錢包 (${deployer.address}) 並非 DungeonCore 的擁有者 (${owner})。`);
        logError("操作可能會失敗。請確認您使用的是正確的錢包。");
    }

    const tx = await dungeonCore.setOracle(NEW_ORACLE_ADDRESS);
    logInfo(`交易已發送，正在等待確認... (Tx Hash: ${tx.hash})`);
    
    await tx.wait();
    
    logSuccess("🎉 交易已確認！Oracle 地址已成功更新！");

    // --- 步驟 4: 驗證新地址 ---
    log("步驟 4: 驗證更新結果...");
    const updatedOracleAddress = await dungeonCore.oracle();
    
    if (updatedOracleAddress.toLowerCase() === NEW_ORACLE_ADDRESS.toLowerCase()) {
        logSuccess(`✅ 驗證成功！DungeonCore 中的 Oracle 地址現在是: ${updatedOracleAddress}`);
    } else {
        logError(`❌ 驗證失敗！合約中的地址 (${updatedOracleAddress}) 與您提供的新地址不符。`);
    }
}

main().catch((error) => {
  console.error("❌ 更新過程中發生致命錯誤:", error);
  process.exitCode = 1;
});

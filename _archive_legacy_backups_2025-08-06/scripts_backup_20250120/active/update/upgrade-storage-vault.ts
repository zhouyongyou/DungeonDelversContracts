// scripts/upgrade-storage-vault.ts

import { ethers, run, network } from "hardhat";
import { BaseContract } from "ethers";
import "dotenv/config";

// =================================================================
// Section: 輔助函式 (Helper Functions)
// =================================================================

// 為了讓終端機輸出更清晰，我們定義一些帶有顏色的日誌函式
const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

// 異步等待函式，用於在驗證合約前給予區塊鏈瀏覽器同步時間
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// =================================================================
// Section: 主部署函式 (Main Deployment Function)
// =================================================================

async function main() {
    log("🚀 開始執行合約升級腳本 (DungeonStorage & PlayerVault)...");

    const [deployer] = await ethers.getSigners();
    logInfo(`執行者錢包: ${deployer.address}`);
    logInfo(`目標網路: ${network.name}`);

    // --- 步驟 0: 驗證環境變數 ---
    log("步驟 0: 驗證 .env 檔案中的地址...");

    const {
        DUNGEON_CORE_ADDRESS,
        DUNGEON_MASTER_ADDRESS,
        FINAL_OWNER_ADDRESS,
    } = process.env;

    if (!DUNGEON_CORE_ADDRESS || !DUNGEON_MASTER_ADDRESS) {
        throw new Error("❌ 錯誤：請務必在 .env 檔案中提供現有的 DUNGEON_CORE_ADDRESS 和 DUNGEON_MASTER_ADDRESS。");
    }
    
    // 如果沒有設定最終擁有者，則預設為部署者自己
    const finalOwner = FINAL_OWNER_ADDRESS || deployer.address;
    
    logInfo(`現有的 DungeonCore 地址: ${DUNGEON_CORE_ADDRESS}`);
    logInfo(`現有的 DungeonMaster 地址: ${DUNGEON_MASTER_ADDRESS}`);
    logInfo(`最終擁有者地址: ${finalOwner}`);
    
    // --- 步驟 1: 部署新的合約 ---
    log("步驟 1: 部署新版本的 DungeonStorage 和 PlayerVault...");

    // 部署 DungeonStorage
    const dungeonStorageFactory = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = await dungeonStorageFactory.deploy(deployer.address);
    await dungeonStorage.waitForDeployment();
    const newDungeonStorageAddress = await dungeonStorage.getAddress();
    logSuccess(`✅ 新 DungeonStorage 已部署至: ${newDungeonStorageAddress}`);

    // 部署 PlayerVault
    const playerVaultFactory = await ethers.getContractFactory("PlayerVault");
    const playerVault = await playerVaultFactory.deploy(deployer.address);
    await playerVault.waitForDeployment();
    const newPlayerVaultAddress = await playerVault.getAddress();
    logSuccess(`✅ 新 PlayerVault 已部署至: ${newPlayerVaultAddress}`);

    // --- 步驟 2: 關聯新的合約 ---
    log("步驟 2: 將現有合約指向新部署的合約...");

    // 獲取現有合約的實例
    const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEON_CORE_ADDRESS);
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", DUNGEON_MASTER_ADDRESS);

    // 設定 DungeonMaster -> 新的 DungeonStorage
    logInfo(`正在設定 DungeonMaster 的儲存地址...`);
    const setStorageTx = await dungeonMaster.setDungeonStorage(newDungeonStorageAddress);
    await setStorageTx.wait();
    logSuccess("✅ DungeonMaster 已成功指向新的 DungeonStorage！");

    // 設定 DungeonCore -> 新的 PlayerVault
    logInfo(`正在設定 DungeonCore 的金庫地址...`);
    const setVaultTx = await dungeonCore.setPlayerVault(newPlayerVaultAddress);
    await setVaultTx.wait();
    logSuccess("✅ DungeonCore 已成功指向新的 PlayerVault！");
    
    // --- 步驟 3: 設定新合約的權限 ---
    log("步驟 3: 設定新合約的權限...");
    
    // 設定 DungeonStorage 的邏輯合約地址
    logInfo(`正在設定新 DungeonStorage 的邏輯合約地址...`);
    const setLogicTx = await dungeonStorage.setLogicContract(DUNGEON_MASTER_ADDRESS);
    await setLogicTx.wait();
    logSuccess("✅ 新 DungeonStorage 的邏輯合約已設定為 DungeonMaster！");
    
    // 設定 PlayerVault 的核心合約地址
    logInfo(`正在設定新 PlayerVault 的核心合約地址...`);
    const setCoreTx = await playerVault.setDungeonCore(DUNGEON_CORE_ADDRESS);
    await setCoreTx.wait();
    logSuccess("✅ 新 PlayerVault 的核心合約已設定為 DungeonCore！");


    // --- 步驟 4: 驗證新合約 (如果不是本地網路) ---
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 4: 驗證新部署的合約...");
        logInfo("等待 30 秒，確保合約資訊已同步至區塊鏈瀏覽器...");
        await delay(30000);

        try {
            logInfo(`正在驗證 DungeonStorage...`);
            await run("verify:verify", {
                address: newDungeonStorageAddress,
                constructorArguments: [deployer.address],
            });
            logSuccess("✅ DungeonStorage 驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("...DungeonStorage 已驗證。");
            } else {
                logError(`❌ DungeonStorage 驗證失敗: ${e.message}`);
            }
        }

        try {
            logInfo(`正在驗證 PlayerVault...`);
            await run("verify:verify", {
                address: newPlayerVaultAddress,
                constructorArguments: [deployer.address],
            });
            logSuccess("✅ PlayerVault 驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("...PlayerVault 已驗證。");
            } else {
                logError(`❌ PlayerVault 驗證失敗: ${e.message}`);
            }
        }
    }

    // --- 步驟 5: 轉移新合約的所有權 ---
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 5: 轉移新合約的所有權...");

        logInfo(`正在轉移 DungeonStorage 的所有權至 ${finalOwner}...`);
        await (await dungeonStorage.transferOwnership(finalOwner)).wait();
        logSuccess(`✅ DungeonStorage 所有權已轉移。`);

        logInfo(`正在轉移 PlayerVault 的所有權至 ${finalOwner}...`);
        await (await playerVault.transferOwnership(finalOwner)).wait();
        logSuccess(`✅ PlayerVault 所有權已轉移。`);
    }

    // --- 最終報告 ---
    log("🎉🎉🎉 恭喜！合約升級與設定已成功完成！ 🎉🎉🎉");
    log("\n🔔 請將以下新部署的合約地址更新到您的 .env 和前端設定檔中：\n");
    console.log(`DUNGEON_STORAGE_ADDRESS=${newDungeonStorageAddress}`);
    console.log(`PLAYER_VAULT_ADDRESS=${newPlayerVaultAddress}`);
    console.log("\n-----------------------------------------------------\n");
}

main().catch((error) => {
  console.error("❌ 升級過程中發生致命錯誤:", error);
  process.exitCode = 1;
});
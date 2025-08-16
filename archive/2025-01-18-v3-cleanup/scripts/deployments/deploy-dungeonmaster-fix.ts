// scripts/deploy-dungeonmaster-fix.ts
import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);
const logError = (message: string) => console.error(`\x1b[31m${message}\x1b[0m`);

async function main() {
    log("🚀 正在部署修復後的 DungeonMaster 合約...");

    const [deployer] = await ethers.getSigners();
    logInfo(`部署者錢包: ${deployer.address}`);
    logInfo(`網路: ${network.name}`);

    // 獲取相關合約地址
    const dungeonCoreAddress = process.env.VITE_MAINNET_DUNGEONCORE_ADDRESS || "0x70Dce1dE6Eb73B66c26D49279bB6846947282952";
    const dungeonStorageAddress = process.env.VITE_MAINNET_DUNGEONSTORAGE_ADDRESS || "0x92d07801f3AD4152F08528a296992d9A602C2C6F";
    const soulShardAddress = process.env.VITE_MAINNET_SOULSHARD_ADDRESS || "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    
    // 部署新的 DungeonMaster
    log("步驟 1: 部署 DungeonMasterV2 合約...");
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = await DungeonMasterFactory.deploy(deployer.address);
    await dungeonMaster.waitForDeployment();
    const dungeonMasterAddress = await dungeonMaster.getAddress();
    
    logSuccess(`✅ DungeonMasterV2 已部署至: ${dungeonMasterAddress}`);

    // 設定依賴
    log("步驟 2: 設定合約依賴...");
    
    await (await dungeonMaster.setDungeonCore(dungeonCoreAddress)).wait();
    logInfo("✅ DungeonCore 已設定");
    
    await (await dungeonMaster.setDungeonStorage(dungeonStorageAddress)).wait();
    logInfo("✅ DungeonStorage 已設定");
    
    await (await dungeonMaster.setSoulShardToken(soulShardAddress)).wait();
    logInfo("✅ SoulShard Token 已設定");
    
    // 設定參數
    log("步驟 3: 設定遊戲參數...");
    
    // 探索費用設為 0（根據用戶設定）
    await (await dungeonMaster.setExplorationFee(0)).wait();
    logInfo("✅ 探索費用已設為: 0 BNB");
    
    // 設定全局獎勵倍數
    await (await dungeonMaster.setGlobalRewardMultiplier(1000)).wait(); // 100%
    logInfo("✅ 全局獎勵倍數已設為: 100%");
    
    // 更新 DungeonCore
    log("步驟 4: 更新 DungeonCore 的 DungeonMaster 地址...");
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    await (await dungeonCore.setDungeonMaster(dungeonMasterAddress)).wait();
    logSuccess("✅ DungeonCore 已更新 DungeonMaster 地址");
    
    // 更新 DungeonStorage 授權
    log("步驟 5: 授權 DungeonStorage...");
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
    await (await dungeonStorage.setLogicContract(dungeonMasterAddress)).wait();
    logSuccess("✅ DungeonStorage 已授權新的 DungeonMaster");
    
    // 驗證合約
    if (network.config.chainId !== 31337 && process.env.BSCSCAN_API_KEY) {
        log("步驟 6: 驗證合約...");
        logInfo("等待 30 秒，以確保合約資訊已在區塊鏈瀏覽器上同步...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            await run("verify:verify", {
                address: dungeonMasterAddress,
                constructorArguments: [deployer.address],
            });
            logSuccess("✅ DungeonMasterV2 合約驗證成功！");
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                logInfo("DungeonMasterV2 合約已驗證。");
            } else {
                logError(`❌ DungeonMasterV2 合約驗證失敗: ${e.message}`);
            }
        }
    }
    
    // 轉移所有權（如果需要）
    const finalOwner = process.env.FINAL_OWNER_ADDRESS || deployer.address;
    if (finalOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        log("步驟 7: 轉移合約所有權...");
        await (await dungeonMaster.transferOwnership(finalOwner)).wait();
        logSuccess(`✅ DungeonMasterV2 所有權已轉移至: ${finalOwner}`);
    }
    
    log("🎉 DungeonMasterV2 部署完成！");
    log("\n📋 部署總結:");
    logInfo(`DungeonMasterV2 地址: ${dungeonMasterAddress}`);
    logInfo(`BSCScan: https://bscscan.com/address/${dungeonMasterAddress}#code`);
    
    log("\n⚠️  重要：請更新以下配置:");
    logInfo("1. 前端 .env 文件的 VITE_MAINNET_DUNGEONMASTER_ADDRESS");
    logInfo("2. 後端 .env 文件的 dungeonMaster 地址");
    logInfo("3. 子圖 subgraph.yaml 的 DungeonMaster 合約地址");
    logInfo("4. 重新部署前端和子圖");
    
    // 測試修復
    log("\n🧪 測試戰力讀取修復...");
    try {
        const party = await ethers.getContractAt("IParty", await dungeonCore.partyContractAddress());
        const partyData = await party.partyCompositions(1);
        logInfo(`隊伍 #1 實際戰力: ${partyData.totalPower}`);
        logSuccess("✅ 新合約應該能正確讀取戰力！");
    } catch (e) {
        logInfo("無法測試，請手動驗證");
    }
}

main().catch((error) => {
    console.error("❌ 部署過程中發生致命錯誤:", error);
    process.exitCode = 1;
});
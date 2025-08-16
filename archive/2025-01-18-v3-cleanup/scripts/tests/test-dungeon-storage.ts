// scripts/test-dungeon-storage.ts - 測試 DungeonStorage 操作

import { ethers } from "hardhat";

const PARTY_ID = 2n;
const CONTRACTS = {
    DUNGEON_MASTER: "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A",
    DUNGEON_STORAGE: "0xEC6773F9C52446BB2F8318dBBa09f58E72fe91b4"
};

async function main() {
    console.log("🔍 測試 DungeonStorage 操作...\n");
    
    const [signer] = await ethers.getSigners();
    
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", CONTRACTS.DUNGEON_STORAGE);
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.DUNGEON_MASTER);
    
    try {
        // 1. 檢查 DungeonStorage 的基本設置
        console.log("1️⃣ 檢查 DungeonStorage 設置...");
        const logicContract = await dungeonStorage.logicContract();
        const owner = await dungeonStorage.owner();
        console.log(`Owner: ${owner}`);
        console.log(`Logic Contract: ${logicContract}`);
        console.log(`是否正確授權: ${logicContract.toLowerCase() === CONTRACTS.DUNGEON_MASTER.toLowerCase() ? '✅' : '❌'}\n`);
        
        // 2. 嘗試讀取隊伍狀態
        console.log("2️⃣ 讀取隊伍狀態...");
        try {
            const status = await dungeonStorage.getPartyStatus(PARTY_ID);
            console.log("隊伍狀態:");
            console.log(`  provisionsRemaining: ${status.provisionsRemaining}`);
            console.log(`  cooldownEndsAt: ${status.cooldownEndsAt}`);
            console.log(`  fatigueLevel: ${status.fatigueLevel}`);
            console.log(`  unclaimedRewards: ${status.unclaimedRewards}\n`);
        } catch (error: any) {
            console.log(`❌ 讀取隊伍狀態失敗: ${error.message}\n`);
        }
        
        // 3. 測試從 DungeonMaster 呼叫 getPartyStatus
        console.log("3️⃣ 從 DungeonMaster 呼叫 getPartyStatus...");
        try {
            // 直接調用 dungeonStorage 的 getter
            const dungeonStorageAddr = await dungeonMaster.dungeonStorage();
            console.log(`DungeonMaster 中的 DungeonStorage 地址: ${dungeonStorageAddr}`);
            console.log(`地址匹配: ${dungeonStorageAddr.toLowerCase() === CONTRACTS.DUNGEON_STORAGE.toLowerCase() ? '✅' : '❌'}\n`);
        } catch (error: any) {
            console.log(`❌ 從 DungeonMaster 呼叫失敗: ${error.message}\n`);
        }
        
        // 4. 測試 setPartyStatus 權限
        console.log("4️⃣ 測試 setPartyStatus 權限...");
        const testStatus = {
            provisionsRemaining: 1n,
            cooldownEndsAt: 0n,
            fatigueLevel: 0,
            unclaimedRewards: 0n
        };
        
        try {
            // 嘗試直接設置（應該失敗，因為只有 logicContract 可以調用）
            await dungeonStorage.setPartyStatus(PARTY_ID, testStatus);
            console.log("❌ 直接設置成功（不應該發生）");
        } catch (error: any) {
            console.log("✅ 直接設置失敗（正確行為）");
            console.log(`錯誤訊息: ${error.message.includes("Only logic contract") ? "權限檢查正常" : error.message}\n`);
        }
        
        // 5. 檢查其他可能的問題
        console.log("5️⃣ 檢查其他設置...");
        
        // 檢查 NUM_DUNGEONS
        try {
            const numDungeons = await dungeonStorage.NUM_DUNGEONS();
            console.log(`NUM_DUNGEONS: ${numDungeons}`);
        } catch (error: any) {
            console.log(`無法讀取 NUM_DUNGEONS: ${error.message}`);
        }
        
        // 檢查是否有任何地城設置
        try {
            const dungeon1 = await dungeonStorage.getDungeon(1n);
            console.log(`地城 1 是否初始化: ${dungeon1.isInitialized ? '✅' : '❌'}`);
        } catch (error: any) {
            console.log(`無法讀取地城 1: ${error.message}`);
        }
        
    } catch (error: any) {
        console.error("\n❌ 測試過程中發生錯誤:", error);
    }
}

main()
    .then(() => {
        console.log("\n🎉 測試完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 測試失敗:", error);
        process.exit(1);
    });
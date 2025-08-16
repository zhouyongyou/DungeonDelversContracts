// scripts/diagnose-power-issue.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 診斷戰力檢查問題...\n");

    // 合約地址
    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    const dungeonStorageAddress = process.env.VITE_MAINNET_DUNGEONSTORAGE_ADDRESS || "0x92d07801f3AD4152F08528a296992d9A602C2C6F";
    
    // 獲取合約實例
    const party = await ethers.getContractAt("Party", partyAddress);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
    
    // 測試的隊伍 ID（請替換為實際的隊伍 ID）
    const partyId = 1; // 根據需要修改
    const dungeonId = 1; // 第一個地城
    
    try {
        console.log(`檢查隊伍 #${partyId} 和地城 #${dungeonId}...\n`);
        
        // 1. 獲取隊伍戰力
        console.log("1. 隊伍戰力資訊:");
        const [totalPower, totalCapacity] = await party.getPartyComposition(partyId);
        console.log(`   總戰力: ${totalPower}`);
        console.log(`   總容量: ${totalCapacity}`);
        
        // 2. 獲取地城要求
        console.log("\n2. 地城資訊:");
        const dungeon = await dungeonStorage.getDungeon(dungeonId);
        console.log(`   是否初始化: ${dungeon.isInitialized}`);
        console.log(`   所需戰力: ${dungeon.requiredPower}`);
        console.log(`   基礎獎勵: ${dungeon.baseReward ? ethers.formatEther(dungeon.baseReward) : '0'} SHARD`);
        
        // 3. 比較戰力
        console.log("\n3. 戰力檢查:");
        console.log(`   隊伍戰力 (${totalPower}) ${totalPower >= dungeon.requiredPower ? '>=' : '<'} 地城要求 (${dungeon.requiredPower})`);
        
        if (totalPower < dungeon.requiredPower) {
            console.log(`   ❌ 戰力不足！差距: ${dungeon.requiredPower - totalPower}`);
        } else {
            console.log(`   ✅ 戰力足夠！`);
        }
        
        // 4. 獲取隊伍狀態
        console.log("\n4. 隊伍狀態:");
        const partyStatus = await dungeonStorage.getPartyStatus(partyId);
        console.log(`   冷卻結束時間: ${new Date(Number(partyStatus.cooldownEndsAt) * 1000).toLocaleString()}`);
        console.log(`   未領取獎勵: ${ethers.formatEther(partyStatus.unclaimedRewards)} SHARD`);
        
        // 5. 檢查冷卻
        const now = Math.floor(Date.now() / 1000);
        if (now < partyStatus.cooldownEndsAt) {
            console.log(`   ⏰ 隊伍仍在冷卻中，剩餘 ${partyStatus.cooldownEndsAt - now} 秒`);
        } else {
            console.log(`   ✅ 隊伍可以出征`);
        }
        
        // 6. 獲取完整的隊伍組成
        console.log("\n5. 完整隊伍組成:");
        const fullComposition = await party.getFullPartyComposition(partyId);
        console.log(`   英雄 IDs: [${fullComposition.heroIds.join(', ')}]`);
        console.log(`   聖物 IDs: [${fullComposition.relicIds.join(', ')}]`);
        console.log(`   隊伍稀有度: ${fullComposition.partyRarity}`);
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
        if (error.reason) {
            console.error("   原因:", error.reason);
        }
    }
}

main().catch((error) => {
    console.error("❌ 執行過程中發生錯誤:", error);
    process.exitCode = 1;
});
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("檢查地下城初始化狀態...\n");

    // 讀取 contract-config.json
    const configPath = path.join(__dirname, "../contract-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const dungeonStorageAddress = config.contracts.game.dungeonStorage.address;
    console.log(`DungeonStorage 地址: ${dungeonStorageAddress}`);

    // 連接到 DungeonStorage 合約
    const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
    const dungeonStorage = DungeonStorage.attach(dungeonStorageAddress);

    // 檢查所有地下城的初始化狀態
    const NUM_DUNGEONS = await dungeonStorage.NUM_DUNGEONS();
    console.log(`\n總地下城數量: ${NUM_DUNGEONS}`);
    console.log("\n地下城狀態:");
    console.log("=".repeat(80));

    for (let i = 1; i <= NUM_DUNGEONS; i++) {
        try {
            const dungeon = await dungeonStorage.getDungeon(i);
            console.log(`\n地下城 #${i}:`);
            console.log(`  - 是否初始化: ${dungeon.isInitialized}`);
            console.log(`  - 所需戰力: ${dungeon.requiredPower.toString()}`);
            console.log(`  - 獎勵金額 (USD): ${ethers.formatEther(dungeon.rewardAmountUSD)}`);
            console.log(`  - 基礎成功率: ${dungeon.baseSuccessRate}%`);
        } catch (error) {
            console.log(`\n地下城 #${i}: 讀取錯誤 - ${error.message}`);
        }
    }

    // 檢查 DungeonMaster 的配置
    console.log("\n\n檢查 DungeonMaster 配置:");
    console.log("=".repeat(80));
    
    const dungeonMasterAddress = config.contracts.game.dungeonMaster.address;
    console.log(`DungeonMaster 地址: ${dungeonMasterAddress}`);

    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);

    // 檢查 DungeonMaster 是否正確設置了 DungeonStorage
    const dungeonStorageInMaster = await dungeonMaster.dungeonStorage();
    console.log(`\nDungeonMaster 中的 DungeonStorage 地址: ${dungeonStorageInMaster}`);
    console.log(`配置是否正確: ${dungeonStorageInMaster.toLowerCase() === dungeonStorageAddress.toLowerCase() ? "✅ 是" : "❌ 否"}`);

    // 檢查 DungeonCore 是否設置
    const dungeonCore = await dungeonMaster.dungeonCore();
    console.log(`\nDungeonCore 地址: ${dungeonCore}`);
    console.log(`是否已設置: ${dungeonCore !== ethers.ZeroAddress ? "✅ 是" : "❌ 否"}`);

    // 檢查 SoulShard token 是否設置
    const soulShardToken = await dungeonMaster.soulShardToken();
    console.log(`\nSoulShard Token 地址: ${soulShardToken}`);
    console.log(`是否已設置: ${soulShardToken !== ethers.ZeroAddress ? "✅ 是" : "❌ 否"}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
// scripts/initialize-dungeons-v3.ts
// 初始化 V3 地下城數據

import { ethers } from "hardhat";
import { logInfo, logSuccess, logError, logWarning } from "./deploy-utils";

async function main() {
    logInfo("🏰 開始初始化 V3 地下城數據...");
    
    const [deployer] = await ethers.getSigners();
    logInfo(`使用帳號: ${deployer.address}`);
    
    // V3 合約地址
    const DUNGEON_STORAGE_ADDRESS = "0x6FF605478fea3C3270f2eeD550129c58Dea81403";
    const DUNGEON_MASTER_ADDRESS = "0x311730fa5459fa099976B139f7007d98C2F1E7A7";
    
    // 連接合約
    const dungeonStorage = await ethers.getContractAt("DungeonStorageV3", DUNGEON_STORAGE_ADDRESS);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", DUNGEON_MASTER_ADDRESS);
    
    // 地下城配置
    const dungeons = [
        { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: ethers.parseEther("29.3"), baseSuccessRate: 89 },
        { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: ethers.parseEther("62"), baseSuccessRate: 83 },
        { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: ethers.parseEther("97.5"), baseSuccessRate: 78 },
        { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: ethers.parseEther("135"), baseSuccessRate: 74 },
        { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: ethers.parseEther("175.6"), baseSuccessRate: 70 },
        { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: ethers.parseEther("300"), baseSuccessRate: 66 },
        { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: ethers.parseEther("410"), baseSuccessRate: 62 },
        { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: ethers.parseEther("515"), baseSuccessRate: 58 },
        { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: ethers.parseEther("680"), baseSuccessRate: 54 },
        { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: ethers.parseEther("850"), baseSuccessRate: 50 }
    ];
    
    logInfo("檢查當前地下城狀態...");
    
    // 檢查哪些地下城需要初始化
    const uninitialized = [];
    for (const dungeon of dungeons) {
        const data = await dungeonStorage.getDungeon(dungeon.id);
        if (!data.isInitialized) {
            uninitialized.push(dungeon);
            logWarning(`地下城 #${dungeon.id} (${dungeon.name}) 未初始化`);
        } else {
            logSuccess(`地下城 #${dungeon.id} (${dungeon.name}) 已初始化`);
        }
    }
    
    if (uninitialized.length === 0) {
        logSuccess("✅ 所有地下城都已初始化！");
        return;
    }
    
    logInfo(`需要初始化 ${uninitialized.length} 個地下城...`);
    
    // 初始化未初始化的地下城
    for (const dungeon of uninitialized) {
        try {
            logInfo(`初始化地下城 #${dungeon.id}: ${dungeon.name}`);
            const tx = await dungeonStorage.initializeDungeon(
                dungeon.id,
                dungeon.requiredPower,
                dungeon.rewardAmountUSD,
                dungeon.baseSuccessRate
            );
            await tx.wait();
            logSuccess(`✅ 地下城 #${dungeon.id} 初始化成功`);
        } catch (error: any) {
            logError(`❌ 地下城 #${dungeon.id} 初始化失敗: ${error.message}`);
        }
    }
    
    // 設定探索費用
    logInfo("檢查探索費用設定...");
    const currentFee = await dungeonMaster.explorationFee();
    if (currentFee === 0n) {
        logInfo("設定探索費用為 0.0015 BNB...");
        const tx = await dungeonMaster.setExplorationFee(ethers.parseEther("0.0015"));
        await tx.wait();
        logSuccess("✅ 探索費用設定成功");
    } else {
        logSuccess(`✅ 探索費用已設定: ${ethers.formatEther(currentFee)} BNB`);
    }
    
    logSuccess("🎉 地下城初始化完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
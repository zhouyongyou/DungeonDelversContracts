// scripts/initialize-dungeons-v4.ts
// 初始化 V4 地下城數據

import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🏰 開始初始化 V4 地下城數據...");
    
    const [deployer] = await ethers.getSigners();
    console.log(`使用帳號: ${deployer.address}`);
    
    // 從環境變數讀取合約地址
    const DUNGEON_MASTER_ADDRESS = process.env.DUNGEONMASTER_ADDRESS;
    
    if (!DUNGEON_MASTER_ADDRESS) {
        throw new Error("請在 .env 設定 DUNGEONMASTER_ADDRESS");
    }
    
    // 連接合約
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV4", DUNGEON_MASTER_ADDRESS);
    
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
    
    console.log("\n📝 初始化地下城...");
    
    // 使用 adminSetDungeon 函數初始化地下城
    for (const dungeon of dungeons) {
        try {
            console.log(`\n設定地下城 #${dungeon.id}: ${dungeon.name}`);
            console.log(`  - 需求戰力: ${dungeon.requiredPower}`);
            console.log(`  - 獎勵: $${ethers.formatEther(dungeon.rewardAmountUSD)} USD`);
            console.log(`  - 基礎成功率: ${dungeon.baseSuccessRate}%`);
            
            const tx = await dungeonMaster.adminSetDungeon(
                dungeon.id,
                dungeon.requiredPower,
                dungeon.rewardAmountUSD,
                dungeon.baseSuccessRate
            );
            await tx.wait();
            console.log(`✅ 地下城 #${dungeon.id} 設定成功`);
        } catch (error: any) {
            console.error(`❌ 地下城 #${dungeon.id} 設定失敗:`, error.message);
        }
    }
    
    // 設定其他參數
    console.log("\n🔧 設定其他參數...");
    
    // 檢查並設定探索費用
    const currentFee = await dungeonMaster.explorationFee();
    if (currentFee.toString() === "0") {
        console.log("設定探索費用為 0.0015 BNB...");
        const tx = await dungeonMaster.setExplorationFee(ethers.parseEther("0.0015"));
        await tx.wait();
        console.log("✅ 探索費用設定成功");
    } else {
        console.log(`✅ 探索費用已設定: ${ethers.formatEther(currentFee)} BNB`);
    }
    
    // 檢查並設定儲備價格
    const currentProvisionPrice = await dungeonMaster.provisionPriceUSD();
    if (currentProvisionPrice.toString() === "0") {
        console.log("設定儲備價格為 $5 USD...");
        const tx = await dungeonMaster.setProvisionPrice(ethers.parseEther("5"));
        await tx.wait();
        console.log("✅ 儲備價格設定成功");
    } else {
        console.log(`✅ 儲備價格已設定: $${ethers.formatEther(currentProvisionPrice)} USD`);
    }
    
    // 檢查並設定全局獎勵倍數
    const currentMultiplier = await dungeonMaster.globalRewardMultiplier();
    console.log(`當前全局獎勵倍數: ${currentMultiplier.toString()} (${Number(currentMultiplier) / 10}%)`);
    
    console.log("\n🎉 地下城初始化完成！");
    
    // 驗證設定
    console.log("\n🔍 驗證地下城設定...");
    const dungeonStorage = await ethers.getContractAt(
        "DungeonStorage", 
        await dungeonMaster.dungeonStorage()
    );
    
    for (let i = 1; i <= 3; i++) {
        const dungeon = await dungeonStorage.getDungeon(i);
        console.log(`\n地下城 #${i}:`);
        console.log(`  - 已初始化: ${dungeon.isInitialized}`);
        console.log(`  - 需求戰力: ${dungeon.requiredPower}`);
        console.log(`  - 獎勵: $${ethers.formatEther(dungeon.rewardAmountUSD)} USD`);
        console.log(`  - 基礎成功率: ${dungeon.baseSuccessRate}%`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
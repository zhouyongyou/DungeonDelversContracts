// scripts/test-party-creation.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🧪 測試隊伍創建和戰力存儲...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const heroAddress = process.env.VITE_MAINNET_HERO_ADDRESS || "0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65";
    
    const party = await ethers.getContractAt("Party", partyAddress);
    const hero = await ethers.getContractAt("Hero", heroAddress);
    
    const [signer] = await ethers.getSigners();
    console.log("測試錢包:", signer.address);
    
    // 1. 找出用戶擁有的英雄
    console.log("\n1. 查找用戶擁有的英雄...");
    const userHeroes = [];
    let totalExpectedPower = 0n;
    
    for (let i = 1; i <= 100; i++) {
        try {
            const owner = await hero.ownerOf(i);
            if (owner.toLowerCase() === signer.address.toLowerCase()) {
                const [rarity, power] = await hero.getHeroProperties(i);
                userHeroes.push({ id: i, rarity, power });
                totalExpectedPower += power;
                console.log(`  英雄 #${i}: 稀有度=${rarity}, 戰力=${power}`);
                
                if (userHeroes.length >= 5) break; // 最多5個英雄示例
            }
        } catch (e) {
            // 繼續
        }
    }
    
    if (userHeroes.length === 0) {
        console.log("❌ 未找到用戶擁有的英雄");
        return;
    }
    
    console.log(`\n預期總戰力: ${totalExpectedPower}`);
    
    // 2. 模擬創建隊伍的過程
    console.log("\n2. 模擬創建隊伍流程...");
    console.log("如果要創建戰力 1863 的隊伍，需要的英雄組合：");
    
    // 根據英雄戰力範圍計算
    const avgPowerByRarity = {
        1: 31,   // 1星平均戰力
        2: 74,   // 2星平均戰力
        3: 117,  // 3星平均戰力
        4: 187,  // 4星平均戰力
        5: 250   // 5星平均戰力（估計）
    };
    
    // 計算達到 1863 戰力的可能組合
    console.log("\n可能的組合：");
    console.log("- 10個4星英雄: 10 × 187 = 1870");
    console.log("- 16個3星英雄: 16 × 117 = 1872");
    console.log("- 25個2星英雄: 25 × 74 = 1850");
    
    // 3. 檢查隊伍容量限制
    console.log("\n3. 檢查容量問題...");
    console.log("如果隊伍 #1 只有 32 戰力，可能是：");
    console.log("a) 只有 1 個低星英雄（符合 32 戰力）");
    console.log("b) 數據被覆蓋或損壞");
    console.log("c) 創建時使用了不同的英雄");
    
    // 4. 檢查歷史事件
    console.log("\n4. 建議檢查：");
    console.log("- 查看 PartyCreated 事件的實際參數");
    console.log("- 檢查創建交易的輸入數據");
    console.log("- 驗證英雄在創建後是否被轉移");
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
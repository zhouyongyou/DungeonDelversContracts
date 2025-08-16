// scripts/check-hero-power.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 檢查英雄戰力系統...\n");

    const heroAddress = process.env.VITE_MAINNET_HERO_ADDRESS || "0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65";
    const hero = await ethers.getContractAt("Hero", heroAddress);
    
    // 檢查一些英雄的戰力
    console.log("英雄戰力樣本:");
    console.log("ID | 稀有度 | 戰力");
    console.log("-".repeat(30));
    
    let totalSamplePower = 0;
    let sampleCount = 0;
    
    for (let i = 1; i <= 20; i++) {
        try {
            const [rarity, power] = await hero.getHeroProperties(i);
            console.log(`${i.toString().padStart(2)} | ${rarity.toString().padStart(6)} | ${power.toString().padStart(6)}`);
            
            totalSamplePower += Number(power);
            sampleCount++;
            
            // 檢查戰力值是否合理
            if (Number(power) > 1000) {
                console.log(`   ⚠️  英雄 #${i} 戰力異常高！`);
            }
        } catch (e) {
            // 英雄不存在
        }
    }
    
    if (sampleCount > 0) {
        console.log("\n統計信息:");
        console.log(`樣本數量: ${sampleCount}`);
        console.log(`平均戰力: ${(totalSamplePower / sampleCount).toFixed(2)}`);
        console.log(`總戰力: ${totalSamplePower}`);
        
        // 如果平均戰力很低，但前端顯示很高，可能是單位問題
        console.log("\n分析:");
        if (totalSamplePower / sampleCount < 100) {
            console.log("英雄的平均戰力較低（< 100），這是正常的。");
            console.log("如果前端顯示的戰力是實際的 50+ 倍，可能是：");
            console.log("1. 子圖在索引時錯誤地處理了數據");
            console.log("2. 前端錯誤地轉換了單位");
            console.log("3. 某處有錯誤的乘數");
        }
    }
    
    // 檢查戰力計算公式
    console.log("\n檢查不同稀有度的戰力範圍:");
    const rarityPowers: { [key: number]: number[] } = {};
    
    for (let i = 1; i <= 50; i++) {
        try {
            const [rarity, power] = await hero.getHeroProperties(i);
            if (!rarityPowers[rarity]) rarityPowers[rarity] = [];
            rarityPowers[rarity].push(Number(power));
        } catch (e) {
            // 忽略
        }
    }
    
    for (const [rarity, powers] of Object.entries(rarityPowers)) {
        if (powers.length > 0) {
            const min = Math.min(...powers);
            const max = Math.max(...powers);
            const avg = powers.reduce((a, b) => a + b, 0) / powers.length;
            console.log(`稀有度 ${rarity}: 最小=${min}, 最大=${max}, 平均=${avg.toFixed(2)}`);
        }
    }
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
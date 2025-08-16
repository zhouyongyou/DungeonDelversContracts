// scripts/test-price-calculation.ts - 測試價格計算

import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";

const CONTRACTS = {
    DUNGEON_MASTER: "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A",
    DUNGEON_CORE: "0x548A15CaFAE2a5D19f9683CDad6D57e3320E61a7",
    ORACLE: "0xB75BB304AaBfB12B3A428BE77d6a0A9052671925"
};

async function main() {
    console.log("🔍 測試價格計算功能...\n");
    
    const [signer] = await ethers.getSigners();
    
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.DUNGEON_MASTER);
    const dungeonCore = await ethers.getContractAt("DungeonCore", CONTRACTS.DUNGEON_CORE);
    
    try {
        // 1. 檢查 Oracle 設置
        console.log("1️⃣ 檢查 Oracle 設置...");
        const oracleAddress = await dungeonCore.oracleAddress();
        console.log(`Oracle 地址: ${oracleAddress}`);
        console.log(`地址匹配: ${oracleAddress.toLowerCase() === CONTRACTS.ORACLE.toLowerCase() ? '✅' : '❌'}\n`);
        
        if (oracleAddress === ethers.ZeroAddress) {
            console.log("❌ Oracle 未設置！");
            return;
        }
        
        // 2. 檢查價格
        console.log("2️⃣ 檢查儲備價格...");
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        console.log(`單個儲備價格: ${formatEther(provisionPriceUSD)} USD\n`);
        
        // 3. 測試價格計算
        console.log("3️⃣ 測試價格計算...");
        const testAmounts = [1n, 5n, 10n];
        
        for (const amount of testAmounts) {
            const totalCostUSD = provisionPriceUSD * amount;
            console.log(`\n購買 ${amount} 個儲備:`);
            console.log(`總價 USD: ${formatEther(totalCostUSD)}`);
            
            try {
                const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
                console.log(`所需 SoulShard: ${formatEther(requiredSoulShard)}`);
                
                // 檢查價格是否合理（不應該是 0 或太大）
                if (requiredSoulShard === 0n) {
                    console.log("⚠️ 警告：計算結果為 0！");
                } else if (requiredSoulShard > parseEther("1000000")) {
                    console.log("⚠️ 警告：價格異常高！");
                } else {
                    console.log("✅ 價格計算正常");
                }
            } catch (error: any) {
                console.log(`❌ 價格計算失敗: ${error.message}`);
            }
        }
        
        // 4. 檢查 Oracle 合約
        console.log("\n4️⃣ 檢查 Oracle 合約...");
        const oracle = await ethers.getContractAt("Oracle", CONTRACTS.ORACLE);
        
        try {
            // 檢查 TWAP 價格
            const twapPrice = await oracle.getTwapPrice();
            console.log(`TWAP 價格: ${formatEther(twapPrice)} USD/SoulShard`);
            
            // 檢查最新價格
            const latestPrice = await oracle.getLatestPrice();
            console.log(`最新價格: ${formatEther(latestPrice)} USD/SoulShard`);
            
            // 檢查價格是否為 0
            if (twapPrice === 0n || latestPrice === 0n) {
                console.log("⚠️ 警告：Oracle 價格為 0！這可能是問題的根源。");
            }
        } catch (error: any) {
            console.log(`❌ 讀取 Oracle 價格失敗: ${error.message}`);
        }
        
        // 5. 直接測試轉換功能
        console.log("\n5️⃣ 直接測試 USD 到 SoulShard 轉換...");
        const testUSD = parseEther("10"); // 10 USD
        
        try {
            const soulShardAmount = await dungeonCore.getSoulShardAmountForUSD(testUSD);
            console.log(`10 USD = ${formatEther(soulShardAmount)} SoulShard`);
            
            // 反向測試
            const usdAmount = await dungeonCore.getUSDAmountForSoulShard(soulShardAmount);
            console.log(`${formatEther(soulShardAmount)} SoulShard = ${formatEther(usdAmount)} USD`);
            
            // 檢查是否一致
            const difference = testUSD > usdAmount ? testUSD - usdAmount : usdAmount - testUSD;
            const percentDiff = (Number(difference) / Number(testUSD)) * 100;
            console.log(`轉換誤差: ${percentDiff.toFixed(2)}%`);
            
        } catch (error: any) {
            console.log(`❌ 轉換測試失敗: ${error.message}`);
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
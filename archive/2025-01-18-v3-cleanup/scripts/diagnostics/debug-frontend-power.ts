// scripts/debug-frontend-power.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 調試前端戰力顯示問題...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const party = await ethers.getContractAt("Party", partyAddress);
    
    // 檢查前幾個隊伍的戰力
    console.log("隊伍戰力檢查:");
    console.log("ID | 擁有者 | 戰力 | 容量 | 戰力/容量比");
    console.log("-".repeat(80));
    
    for (let i = 1; i <= 10; i++) {
        try {
            const owner = await party.ownerOf(i);
            const [totalPower, totalCapacity] = await party.getPartyComposition(i);
            const ratio = Number(totalCapacity) > 0 ? (Number(totalPower) / Number(totalCapacity)).toFixed(2) : "N/A";
            
            console.log(`${i.toString().padStart(2)} | ${owner.slice(0, 6)}...${owner.slice(-4)} | ${totalPower.toString().padStart(6)} | ${totalCapacity.toString().padStart(6)} | ${ratio}`);
            
            // 如果發現戰力異常高的情況
            if (Number(totalPower) > 1000) {
                console.log(`\n⚠️  隊伍 #${i} 戰力異常高！檢查詳細資訊...`);
                try {
                    const fullComp = await party.getFullPartyComposition(i);
                    console.log(`   英雄數量: ${fullComp.heroIds.length}`);
                    console.log(`   聖物數量: ${fullComp.relicIds.length}`);
                    console.log(`   英雄 IDs: [${fullComp.heroIds.slice(0, 5).map(id => id.toString()).join(', ')}${fullComp.heroIds.length > 5 ? '...' : ''}]`);
                } catch (e) {
                    console.log(`   無法獲取完整組成`);
                }
            }
        } catch (e) {
            // 隊伍不存在
        }
    }
    
    console.log("\n可能的問題：");
    console.log("1. 前端可能顯示了錯誤的隊伍 ID");
    console.log("2. 前端可能緩存了舊數據");
    console.log("3. 子圖可能返回了錯誤的數據");
    console.log("4. 前端可能錯誤地計算了戰力（例如乘以了某個倍數）");
    
    // 檢查隊伍 #1 的實際擁有者是否能看到正確戰力
    console.log("\n特別檢查隊伍 #1:");
    try {
        const owner = await party.ownerOf(1);
        const [totalPower, totalCapacity] = await party.getPartyComposition(1);
        console.log(`擁有者: ${owner}`);
        console.log(`合約返回戰力: ${totalPower}`);
        console.log(`前端顯示戰力: 1863`);
        console.log(`差異倍數: ${(1863 / Number(totalPower)).toFixed(2)}x`);
        
        // 1863 / 32 ≈ 58.22
        // 這可能暗示某處有錯誤的乘數
    } catch (e) {
        console.log("無法讀取隊伍 #1");
    }
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
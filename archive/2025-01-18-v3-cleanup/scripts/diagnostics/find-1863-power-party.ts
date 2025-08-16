// scripts/find-1863-power-party.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 查找戰力約 1863 的隊伍...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const party = await ethers.getContractAt("Party", partyAddress);
    
    console.log("掃描隊伍中...\n");
    
    const targetPower = 1863;
    const tolerance = 50; // 容差範圍
    const foundParties = [];
    
    // 掃描前 100 個隊伍
    for (let i = 1; i <= 100; i++) {
        try {
            const owner = await party.ownerOf(i);
            const [totalPower, totalCapacity] = await party.getPartyComposition(i);
            const power = Number(totalPower);
            
            // 如果戰力在目標範圍內
            if (power >= targetPower - tolerance && power <= targetPower + tolerance) {
                const fullComp = await party.getFullPartyComposition(i);
                foundParties.push({
                    id: i,
                    owner,
                    totalPower: totalPower.toString(),
                    totalCapacity: totalCapacity.toString(),
                    rarity: fullComp.partyRarity,
                    heroIds: fullComp.heroIds.map(id => id.toString()),
                    relicIds: fullComp.relicIds.map(id => id.toString())
                });
                
                console.log(`✅ 找到隊伍 #${i}: 戰力=${totalPower}, 擁有者=${owner}`);
            }
            
            // 每 10 個顯示進度
            if (i % 10 === 0) {
                process.stdout.write(`\r已掃描 ${i} 個隊伍...`);
            }
        } catch (e) {
            // 隊伍不存在，繼續
        }
    }
    
    console.log("\n\n" + "=".repeat(80));
    console.log(`\n找到 ${foundParties.length} 個戰力接近 ${targetPower} 的隊伍:\n`);
    
    for (const p of foundParties) {
        console.log(`\n隊伍 #${p.id}:`);
        console.log(`  擁有者: ${p.owner}`);
        console.log(`  戰力: ${p.totalPower}`);
        console.log(`  容量: ${p.totalCapacity}`);
        console.log(`  稀有度: ${p.rarity}`);
        console.log(`  英雄 IDs: [${p.heroIds.join(', ')}]`);
        console.log(`  聖物 IDs: [${p.relicIds.join(', ')}]`);
    }
    
    if (foundParties.length > 0) {
        console.log("\n💡 請使用上述隊伍的擁有者錢包來執行遠征交易。");
    }
}

main().catch((error) => {
    console.error("\n❌ 錯誤:", error);
    process.exitCode = 1;
});
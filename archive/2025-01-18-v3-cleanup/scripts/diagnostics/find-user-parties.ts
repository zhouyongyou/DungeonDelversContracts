// scripts/find-user-parties.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 查找用戶的隊伍...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const [signer] = await ethers.getSigners();
    
    console.log(`查找錢包 ${signer.address} 的隊伍...\n`);
    
    const party = await ethers.getContractAt("Party", partyAddress);
    
    // 查找前 50 個隊伍
    console.log("隊伍列表:");
    console.log("ID | 擁有者 | 戰力 | 容量 | 稀有度");
    console.log("-".repeat(80));
    
    let foundCount = 0;
    const userParties = [];
    
    for (let i = 1; i <= 50; i++) {
        try {
            const owner = await party.ownerOf(i);
            const [totalPower, totalCapacity] = await party.getPartyComposition(i);
            
            // 獲取完整組成以顯示稀有度
            const fullComp = await party.getFullPartyComposition(i);
            
            const isUserParty = owner.toLowerCase() === signer.address.toLowerCase();
            const marker = isUserParty ? " ⭐" : "";
            
            console.log(`${i.toString().padStart(2)} | ${owner.slice(0, 6)}...${owner.slice(-4)} | ${totalPower.toString().padStart(4)} | ${totalCapacity.toString().padStart(3)} | ${fullComp.partyRarity}${marker}`);
            
            if (isUserParty) {
                foundCount++;
                userParties.push({
                    id: i,
                    totalPower: totalPower.toString(),
                    totalCapacity: totalCapacity.toString(),
                    rarity: fullComp.partyRarity
                });
            }
        } catch (e) {
            // 隊伍不存在，跳過
        }
    }
    
    console.log("\n" + "=".repeat(80));
    console.log(`\n找到 ${foundCount} 個屬於您的隊伍:\n`);
    
    if (userParties.length > 0) {
        console.log("您的隊伍詳情:");
        for (const p of userParties) {
            console.log(`\n隊伍 #${p.id}:`);
            console.log(`  戰力: ${p.totalPower}`);
            console.log(`  容量: ${p.totalCapacity}`);
            console.log(`  稀有度: ${p.rarity}`);
            
            // 檢查是否能挑戰巫妖墓穴（1800戰力）
            if (Number(p.totalPower) >= 1800) {
                console.log(`  ✅ 可以挑戰巫妖墓穴！`);
            } else {
                console.log(`  ❌ 戰力不足以挑戰巫妖墓穴（需要 1800，差 ${1800 - Number(p.totalPower)}）`);
            }
        }
        
        // 找出戰力約 1863 的隊伍
        const targetParty = userParties.find(p => Number(p.totalPower) >= 1850 && Number(p.totalPower) <= 1870);
        if (targetParty) {
            console.log(`\n💡 隊伍 #${targetParty.id} 的戰力為 ${targetParty.totalPower}，可能就是您提到的那個隊伍！`);
        }
    } else {
        console.log("未找到屬於您的隊伍。");
    }
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
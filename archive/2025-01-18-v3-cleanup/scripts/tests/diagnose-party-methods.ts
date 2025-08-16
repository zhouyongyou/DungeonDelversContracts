// scripts/diagnose-party-methods.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 診斷 Party 合約方法差異...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const party = await ethers.getContractAt("Party", partyAddress);
    
    const partyId = 1;
    
    try {
        console.log(`檢查隊伍 #${partyId} 的不同查詢方法:\n`);
        
        // 1. 直接調用 public mapping
        console.log("1. 調用 partyCompositions(1) - public mapping:");
        const composition = await party.partyCompositions(partyId);
        console.log(`   totalPower: ${composition.totalPower}`);
        console.log(`   totalCapacity: ${composition.totalCapacity}`);
        console.log(`   partyRarity: ${composition.partyRarity}`);
        
        // 2. 調用 getPartyComposition
        console.log("\n2. 調用 getPartyComposition(1):");
        const [totalPower, totalCapacity] = await party.getPartyComposition(partyId);
        console.log(`   totalPower: ${totalPower}`);
        console.log(`   totalCapacity: ${totalCapacity}`);
        
        // 3. 調用 getFullPartyComposition
        console.log("\n3. 調用 getFullPartyComposition(1):");
        try {
            const fullComp = await party.getFullPartyComposition(partyId);
            console.log(`   totalPower: ${fullComp.totalPower}`);
            console.log(`   totalCapacity: ${fullComp.totalCapacity}`);
            console.log(`   partyRarity: ${fullComp.partyRarity}`);
            console.log(`   heroIds 數量: ${fullComp.heroIds.length}`);
            console.log(`   relicIds 數量: ${fullComp.relicIds.length}`);
        } catch (e: any) {
            console.log(`   ❌ 錯誤: ${e.message}`);
        }
        
        // 4. 比較結果
        console.log("\n4. 結果分析:");
        if (composition.totalPower.toString() !== totalPower.toString()) {
            console.log(`   ❌ 數據不一致！`);
            console.log(`   partyCompositions: ${composition.totalPower}`);
            console.log(`   getPartyComposition: ${totalPower}`);
            console.log(`   差異: ${Number(composition.totalPower) - Number(totalPower)}`);
        } else {
            console.log(`   ✅ 數據一致`);
        }
        
        // 5. 檢查 ownerOf
        console.log("\n5. 檢查 ownerOf:");
        try {
            const owner = await party.ownerOf(partyId);
            console.log(`   擁有者: ${owner}`);
        } catch (e: any) {
            console.log(`   ❌ ownerOf 錯誤: ${e.message}`);
        }
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
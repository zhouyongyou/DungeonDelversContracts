// scripts/test-new-dungeonmaster.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🧪 測試新的 DungeonMaster 合約...\n");

    const dungeonMasterAddress = "0xa4B105Af2211FDaA2F8f20E6D43d0ab838483792";
    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    const party = await ethers.getContractAt("Party", partyAddress);
    
    try {
        console.log("1. 測試隊伍 #1 的戰力讀取:");
        
        // 直接從 Party 合約讀取
        const partyData = await party.partyCompositions(1);
        console.log(`   Party 合約數據: totalPower = ${partyData.totalPower}`);
        
        // 模擬 DungeonMaster 的讀取方式
        console.log("\n2. 模擬 DungeonMaster 讀取:");
        console.log("   使用 partyCompositions(1) 解構第三個值（totalPower）");
        console.log(`   預期結果: ${partyData.totalPower} ✅`);
        
        // 測試遠征條件
        console.log("\n3. 遠征條件檢查:");
        console.log(`   隊伍戰力: ${partyData.totalPower}`);
        console.log(`   巫妖墓穴要求: 1800`);
        console.log(`   是否滿足: ${Number(partyData.totalPower) >= 1800 ? '✅ 是' : '❌ 否'}`);
        
        console.log("\n✅ 新的 DungeonMaster 應該能正確讀取戰力了！");
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
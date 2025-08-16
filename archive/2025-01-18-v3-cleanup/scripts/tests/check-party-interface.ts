// scripts/check-party-interface.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 檢查 Party 合約接口...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    
    console.log(`Party 合約地址: ${partyAddress}`);
    console.log(`DungeonMaster 合約地址: ${dungeonMasterAddress}`);
    
    // 獲取合約實例
    const party = await ethers.getContractAt("Party", partyAddress);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    
    try {
        // 測試 getPartyComposition 函數
        console.log("\n測試 getPartyComposition 函數...");
        
        // 假設 partyId = 1 存在（需要替換為實際存在的 ID）
        const partyId = 1;
        
        // 直接調用 Party 合約
        console.log("1. 直接調用 Party.getPartyComposition...");
        const result = await party.getPartyComposition(partyId);
        console.log(`   結果: totalPower=${result[0]}, totalCapacity=${result[1]}`);
        
        // 測試 DungeonMaster 是否能正確調用
        console.log("\n2. 測試 DungeonMaster 調用...");
        const dungeonCore = await dungeonMaster.dungeonCore();
        console.log(`   DungeonCore 地址: ${dungeonCore}`);
        
        // 獲取 DungeonCore 合約
        const dungeonCoreContract = await ethers.getContractAt("DungeonCore", dungeonCore);
        const partyContractFromCore = await dungeonCoreContract.partyContractAddress();
        console.log(`   DungeonCore 中的 Party 地址: ${partyContractFromCore}`);
        
        if (partyContractFromCore.toLowerCase() !== partyAddress.toLowerCase()) {
            console.error(`\n❌ 錯誤: DungeonCore 中的 Party 地址不匹配!`);
            console.error(`   預期: ${partyAddress}`);
            console.error(`   實際: ${partyContractFromCore}`);
        } else {
            console.log(`\n✅ Party 地址匹配正確`);
        }
        
        // 檢查函數簽名
        console.log("\n3. 檢查函數簽名...");
        const partyInterface = party.interface;
        const getPartyCompositionFragment = partyInterface.getFunction("getPartyComposition");
        console.log(`   函數簽名: ${getPartyCompositionFragment.format()}`);
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
        if (error.data) {
            console.error("   錯誤數據:", error.data);
        }
    }
}

main().catch((error) => {
    console.error("❌ 執行過程中發生錯誤:", error);
    process.exitCode = 1;
});
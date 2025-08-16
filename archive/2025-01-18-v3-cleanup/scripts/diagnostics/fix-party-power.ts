// scripts/fix-party-power.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔧 修復戰力讀取問題的方案...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    
    console.log("當前合約地址：");
    console.log(`Party: ${partyAddress}`);
    console.log(`DungeonMaster: ${dungeonMasterAddress}`);
    
    console.log("\n問題診斷：");
    console.log("1. Party 合約的 getPartyComposition 返回整個結構體（包含數組）");
    console.log("2. DungeonMaster 期望只接收 (totalPower, totalCapacity)");
    console.log("3. 解析錯誤導致讀取到 heroIds[0] = 44 而不是 totalPower = 1863");
    
    console.log("\n解決方案：");
    console.log("\n方案 1：修改 DungeonMaster 合約（推薦）");
    console.log("```solidity");
    console.log("// 修改 DungeonMaster.sol 第 101 行");
    console.log("// 從：");
    console.log("(uint256 maxPower, ) = partyContract.getPartyComposition(_partyId);");
    console.log("");
    console.log("// 改為直接讀取 public mapping：");
    console.log("(, , uint256 maxPower, , ) = partyContract.partyCompositions(_partyId);");
    console.log("```");
    
    console.log("\n方案 2：部署修復版 Party 合約");
    console.log("- 確保 getPartyComposition 只返回兩個值");
    console.log("- 更新所有相關地址");
    
    console.log("\n方案 3：臨時解決 - 降低地城難度");
    console.log("- 將地城要求降低到 30-50 戰力");
    console.log("- 這樣現有隊伍就可以挑戰");
    
    // 驗證實際數據
    const party = await ethers.getContractAt("Party", partyAddress);
    try {
        const comp = await party.partyCompositions(1);
        console.log("\n驗證隊伍 #1 實際數據：");
        console.log(`totalPower: ${comp.totalPower} ✅`);
        console.log(`totalCapacity: ${comp.totalCapacity}`);
        console.log(`partyRarity: ${comp.partyRarity}`);
        console.log("\n數據是正確的，只是讀取方式有問題！");
    } catch (e) {
        console.log("\n無法驗證數據");
    }
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
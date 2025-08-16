// scripts/quick-fix-power-check.ts
// 快速測試隊伍戰力讀取問題

import { ethers } from "hardhat";

async function main() {
    console.log("🔍 診斷戰力讀取問題...\n");
    
    const PARTY_ADDRESS = "0xddCFa681Cee80D3a0F23834cC07D371792207C85";
    const PARTY_ID = 1n;
    
    const party = await ethers.getContractAt("Party", PARTY_ADDRESS);
    
    // 方法 1: 完整讀取
    console.log("方法 1: 完整讀取 partyCompositions");
    const composition = await party.partyCompositions(PARTY_ID);
    console.log("返回值:", composition);
    console.log("英雄 IDs 長度:", composition[0].length);
    console.log("聖物 IDs 長度:", composition[1].length);
    console.log("總戰力 (totalPower):", composition[2].toString());
    console.log("總容量 (totalCapacity):", composition[3].toString());
    console.log("稀有度 (partyRarity):", composition[4].toString());
    
    // 方法 2: 使用 getPartyComposition（如果存在）
    console.log("\n方法 2: 嘗試 getPartyComposition");
    try {
        const comp = await party.getPartyComposition(PARTY_ID);
        console.log("getPartyComposition 結果:", comp);
    } catch (e) {
        console.log("getPartyComposition 不存在或失敗");
    }
    
    // 顯示問題
    console.log("\n❌ 問題分析:");
    console.log("DungeonMaster 使用: (, , maxPower, , ) = partyCompositions()");
    console.log("實際獲取的是第 4 個值（索引 3）: totalCapacity =", composition[3].toString());
    console.log("應該獲取的是第 3 個值（索引 2）: totalPower =", composition[2].toString());
    
    // 解決方案
    console.log("\n✅ 解決方案:");
    console.log("1. 修改 DungeonMaster 合約，正確讀取 totalPower（索引 2）");
    console.log("2. 或使用 getPartyComposition 函數（如果存在）");
    console.log("3. 或直接調用具體的 getter 函數");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
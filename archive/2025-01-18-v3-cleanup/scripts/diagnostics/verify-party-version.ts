// scripts/verify-party-version.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 驗證 Party 合約版本...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const party = await ethers.getContractAt("Party", partyAddress);
    
    try {
        // 1. 測試函數簽名
        console.log("1. 測試 getPartyComposition 函數簽名:");
        const selector = party.interface.getFunction("getPartyComposition")?.selector;
        console.log(`   函數選擇器: ${selector}`);
        
        // 2. 獲取合約字節碼大小
        const code = await ethers.provider.getCode(partyAddress);
        console.log(`\n2. 合約字節碼大小: ${code.length} 字節`);
        
        // 3. 測試實際調用
        console.log("\n3. 實際調用測試:");
        try {
            const result = await party.getPartyComposition(1);
            console.log(`   返回值類型: ${typeof result}`);
            console.log(`   返回值: ${result}`);
            
            // 如果返回的是數組（struct），會有多個元素
            if (Array.isArray(result)) {
                console.log(`   ❌ 返回了 struct/tuple（${result.length} 個元素）`);
                console.log("   需要重新部署 Party 合約！");
            } else {
                console.log(`   ✅ 返回了兩個獨立的值`);
            }
        } catch (e: any) {
            console.log(`   調用錯誤: ${e.message}`);
        }
        
        // 4. 比較期望的實現
        console.log("\n4. 期望的實現:");
        console.log("   應該返回: (uint256 totalPower, uint256 totalCapacity)");
        console.log("   而不是: PartyComposition struct");
        
        console.log("\n建議：");
        console.log("如果 getPartyComposition 返回 struct，應該：");
        console.log("1. 重新部署 Party 合約");
        console.log("2. 或者修改 DungeonMaster 使用 getFullPartyComposition");
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
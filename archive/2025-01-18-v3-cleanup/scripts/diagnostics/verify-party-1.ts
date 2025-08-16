// scripts/verify-party-1.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 驗證隊伍 #1 的實際組成...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const party = await ethers.getContractAt("Party", partyAddress);
    
    try {
        // 直接讀取存儲槽來獲取隊伍數據
        console.log("嘗試讀取隊伍 #1 的存儲數據...");
        
        // Party 合約的 mapping 存儲槽計算
        // mapping(uint256 => PartyComposition) public partyCompositions;
        // 假設 partyCompositions 在存儲槽 1
        const partyId = 1;
        const mappingSlot = 1; // 需要根據實際合約確定
        
        // 計算存儲位置
        const key = ethers.solidityPackedKeccak256(
            ["uint256", "uint256"],
            [partyId, mappingSlot]
        );
        
        // 讀取 totalPower (在 struct 的第 3 個位置)
        const totalPowerSlot = BigInt(key) + 2n;
        const totalPowerRaw = await ethers.provider.getStorage(
            partyAddress,
            totalPowerSlot
        );
        
        console.log(`\n存儲槽數據:`);
        console.log(`totalPower 原始數據: ${totalPowerRaw}`);
        console.log(`totalPower 解碼值: ${BigInt(totalPowerRaw)}`);
        
        // 正常方式讀取
        const [totalPower, totalCapacity] = await party.getPartyComposition(1);
        console.log(`\n合約查詢結果:`);
        console.log(`totalPower: ${totalPower}`);
        console.log(`totalCapacity: ${totalCapacity}`);
        
        // 結論
        console.log("\n結論:");
        if (Number(totalPower) === 32) {
            console.log("✅ 隊伍 #1 的戰力確實是 32");
            console.log("❌ 前端顯示 1863 是錯誤的");
            console.log("\n可能原因：");
            console.log("1. 子圖索引了錯誤的數據");
            console.log("2. 前端緩存了錯誤的數據");
            console.log("3. 前端計算邏輯有誤");
        }
        
    } catch (error: any) {
        console.error("❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
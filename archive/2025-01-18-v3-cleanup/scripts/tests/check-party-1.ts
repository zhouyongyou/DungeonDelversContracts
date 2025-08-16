// scripts/check-party-1.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 檢查隊伍 #1 的詳細資訊...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    
    const party = await ethers.getContractAt("Party", partyAddress);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    
    try {
        // 1. 基本資訊
        console.log("1. 隊伍基本資訊:");
        const owner = await party.ownerOf(1);
        console.log(`   擁有者: ${owner}`);
        
        // 2. 戰力資訊
        console.log("\n2. 戰力資訊:");
        const [totalPower, totalCapacity] = await party.getPartyComposition(1);
        console.log(`   總戰力: ${totalPower}`);
        console.log(`   總容量: ${totalCapacity}`);
        
        // 3. 完整組成
        console.log("\n3. 完整隊伍組成:");
        const fullComp = await party.getFullPartyComposition(1);
        console.log(`   英雄數量: ${fullComp.heroIds.length}`);
        console.log(`   英雄 IDs: [${fullComp.heroIds.map(id => id.toString()).join(', ')}]`);
        console.log(`   聖物數量: ${fullComp.relicIds.length}`);
        console.log(`   聖物 IDs: [${fullComp.relicIds.map(id => id.toString()).join(', ')}]`);
        console.log(`   隊伍稀有度: ${fullComp.partyRarity}`);
        
        // 4. 檢查數據一致性
        console.log("\n4. 數據一致性檢查:");
        console.log(`   記錄的總戰力 (${fullComp.totalPower}) ${fullComp.totalPower.toString() === totalPower.toString() ? '✅ 匹配' : '❌ 不匹配'} 查詢的總戰力 (${totalPower})`);
        console.log(`   記錄的總容量 (${fullComp.totalCapacity}) ${fullComp.totalCapacity.toString() === totalCapacity.toString() ? '✅ 匹配' : '❌ 不匹配'} 查詢的總容量 (${totalCapacity})`);
        
        // 5. 測試遠征模擬
        console.log("\n5. 測試對巫妖墓穴（地城 #6）的遠征:");
        const dungeonId = 6;
        const requiredPower = 1800;
        
        console.log(`   地城要求戰力: ${requiredPower}`);
        console.log(`   隊伍實際戰力: ${totalPower}`);
        console.log(`   戰力檢查: ${Number(totalPower) >= requiredPower ? '✅ 通過' : '❌ 不足'}`);
        
        // 6. 模擬遠征調用
        console.log("\n6. 模擬遠征調用:");
        console.log(`   調用者: ${owner}`);
        console.log(`   隊伍 ID: 1`);
        console.log(`   地城 ID: ${dungeonId}`);
        console.log(`   發送 ETH: 0`);
        
        // 使用擁有者地址模擬調用
        const impersonatedSigner = await ethers.getImpersonatedSigner(owner);
        const dungeonMasterAsOwner = dungeonMaster.connect(impersonatedSigner);
        
        try {
            await dungeonMasterAsOwner.requestExpedition.staticCall(1, dungeonId, { value: 0 });
            console.log("\n✅ 模擬調用成功！隊伍擁有者應該能夠進行遠征。");
        } catch (error: any) {
            console.log("\n❌ 模擬調用失敗:", error.message);
            if (error.message.includes("Power too low")) {
                console.log("   問題確認：戰力檢查失敗");
                console.log("   這表明合約中的戰力計算可能有問題");
            }
        }
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
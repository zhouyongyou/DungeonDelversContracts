// scripts/diagnose-specific-expedition.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 診斷特定遠征失敗問題...\n");

    // 合約地址
    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    const dungeonStorageAddress = process.env.VITE_MAINNET_DUNGEONSTORAGE_ADDRESS || "0x92d07801f3AD4152F08528a296992d9A602C2C6F";
    const dungeonCoreAddress = process.env.VITE_MAINNET_DUNGEONCORE_ADDRESS || "0x70Dce1dE6Eb73B66c26D49279bB6846947282952";
    
    const [signer] = await ethers.getSigners();
    console.log("使用錢包:", signer.address);
    
    // 獲取合約實例
    const party = await ethers.getContractAt("Party", partyAddress);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    
    // 根據用戶描述
    const dungeonId = 6; // 巫妖墓穴
    const requiredPower = 1800;
    const userPower = 1863;
    
    try {
        console.log("1. 檢查地城 #6 (巫妖墓穴) 資訊:");
        const dungeon = await dungeonStorage.getDungeon(dungeonId);
        console.log(`   是否初始化: ${dungeon.isInitialized}`);
        console.log(`   實際所需戰力: ${dungeon.requiredPower}`);
        console.log(`   預期所需戰力: ${requiredPower}`);
        
        if (!dungeon.isInitialized) {
            console.log("   ❌ 地城未初始化！");
            return;
        }
        
        if (dungeon.requiredPower != requiredPower) {
            console.log(`   ⚠️  警告：實際戰力要求 (${dungeon.requiredPower}) 與顯示不符 (${requiredPower})`);
        }
        
        // 檢查 DungeonCore 中的 Party 合約地址
        console.log("\n2. 檢查合約連接:");
        const partyFromCore = await dungeonCore.partyContractAddress();
        console.log(`   DungeonCore 中的 Party 地址: ${partyFromCore}`);
        console.log(`   實際 Party 地址: ${partyAddress}`);
        console.log(`   地址匹配: ${partyFromCore.toLowerCase() === partyAddress.toLowerCase() ? '✅' : '❌'}`);
        
        // 檢查 explorationFee
        console.log("\n3. 檢查費用設置:");
        const explorationFee = await dungeonMaster.explorationFee();
        console.log(`   探索費用: ${ethers.formatEther(explorationFee)} BNB`);
        
        // 列出所有隊伍供選擇
        console.log("\n4. 查找用戶的隊伍:");
        console.log("   正在查找戰力約 1863 的隊伍...");
        
        // 嘗試查找幾個可能的隊伍 ID
        for (let i = 1; i <= 10; i++) {
            try {
                const owner = await party.ownerOf(i);
                if (owner.toLowerCase() === signer.address.toLowerCase()) {
                    const [power, capacity] = await party.getPartyComposition(i);
                    console.log(`   隊伍 #${i}: 戰力=${power}, 容量=${capacity}`);
                    
                    if (power >= 1800 && power <= 1900) {
                        console.log(`   ✅ 可能是這個隊伍！`);
                        
                        // 檢查隊伍狀態
                        const status = await dungeonStorage.getPartyStatus(i);
                        const now = Math.floor(Date.now() / 1000);
                        console.log(`      冷卻結束: ${new Date(Number(status.cooldownEndsAt) * 1000).toLocaleString()}`);
                        console.log(`      是否冷卻中: ${now < status.cooldownEndsAt ? '是' : '否'}`);
                    }
                }
            } catch (e) {
                // 隊伍不存在，繼續
            }
        }
        
        // 模擬交易
        console.log("\n5. 檢查可能的錯誤原因:");
        console.log("   可能的原因：");
        console.log("   - 合約地址不匹配");
        console.log("   - 隊伍在冷卻中");
        console.log("   - BNB 餘額不足支付費用");
        console.log("   - 前端使用了錯誤的 ABI");
        console.log("   - 合約已暫停");
        
        // 檢查合約是否暫停
        const isPaused = await dungeonMaster.paused();
        console.log(`\n6. 合約狀態:`);
        console.log(`   DungeonMaster 是否暫停: ${isPaused ? '❌ 是' : '✅ 否'}`);
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
        if (error.reason) {
            console.error("   原因:", error.reason);
        }
        if (error.data) {
            console.error("   數據:", error.data);
        }
    }
}

main().catch((error) => {
    console.error("❌ 執行過程中發生錯誤:", error);
    process.exitCode = 1;
});
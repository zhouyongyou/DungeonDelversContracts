// scripts/trace-party-power.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔍 追蹤隊伍戰力計算...\n");

    const partyAddress = process.env.VITE_MAINNET_PARTY_ADDRESS || "0x6f707409821F11CbFC01FC79073264FC02b8Ff3e";
    const heroAddress = process.env.VITE_MAINNET_HERO_ADDRESS || "0x5EEa0b978f6DbE7735125C4C757458B0F5B48A65";
    const relicAddress = process.env.VITE_MAINNET_RELIC_ADDRESS || "0x82A680344C09C10455F5A6397f6F7a38cf3ebe8A";
    
    const party = await ethers.getContractAt("Party", partyAddress);
    const hero = await ethers.getContractAt("Hero", heroAddress);
    const relic = await ethers.getContractAt("Relic", relicAddress);
    
    const partyId = 1;
    
    try {
        console.log(`檢查隊伍 #${partyId} 的戰力組成:\n`);
        
        // 1. 獲取基本信息
        const owner = await party.ownerOf(partyId);
        const [totalPower, totalCapacity] = await party.getPartyComposition(partyId);
        
        console.log(`擁有者: ${owner}`);
        console.log(`記錄的總戰力: ${totalPower}`);
        console.log(`記錄的總容量: ${totalCapacity}`);
        
        // 2. 嘗試獲取完整組成
        console.log("\n嘗試獲取完整組成...");
        
        // 由於 getFullPartyComposition 可能失敗，我們需要其他方法
        // 讓我們通過事件來追蹤
        
        // 3. 查詢 PartyCreated 事件
        console.log("\n查詢 PartyCreated 事件...");
        const filter = party.filters.PartyCreated(partyId);
        
        // 獲取當前區塊號
        const currentBlock = await ethers.provider.getBlockNumber();
        const startBlock = currentBlock - 100000; // 查詢最近 100k 區塊
        
        console.log(`查詢區塊範圍: ${startBlock} - ${currentBlock}`);
        const events = await party.queryFilter(filter, startBlock, currentBlock);
        
        if (events.length > 0) {
            const event = events[0];
            console.log(`\n找到創建事件！`);
            console.log(`區塊: ${event.blockNumber}`);
            console.log(`交易: ${event.transactionHash}`);
            
            const args = event.args;
            if (args) {
                console.log(`\n事件參數:`);
                console.log(`隊伍 ID: ${args.partyId}`);
                console.log(`擁有者: ${args.owner}`);
                console.log(`英雄 IDs: [${args.heroIds.map((id: any) => id.toString()).join(', ')}]`);
                console.log(`聖物 IDs: [${args.relicIds.map((id: any) => id.toString()).join(', ')}]`);
                console.log(`總戰力 (從事件): ${args.totalPower}`);
                console.log(`總容量 (從事件): ${args.totalCapacity}`);
                console.log(`隊伍稀有度: ${args.partyRarity}`);
                
                // 4. 驗證每個英雄的戰力
                console.log("\n驗證英雄戰力:");
                let calculatedPower = 0n;
                for (const heroId of args.heroIds) {
                    try {
                        const [rarity, power] = await hero.getHeroProperties(heroId);
                        console.log(`  英雄 #${heroId}: 稀有度=${rarity}, 戰力=${power}`);
                        calculatedPower += power;
                    } catch (e) {
                        console.log(`  英雄 #${heroId}: 無法讀取屬性`);
                    }
                }
                
                console.log(`\n計算的總戰力: ${calculatedPower}`);
                console.log(`事件記錄的戰力: ${args.totalPower}`);
                console.log(`合約查詢的戰力: ${totalPower}`);
                
                if (calculatedPower.toString() !== totalPower.toString()) {
                    console.log("\n❌ 戰力不匹配！可能的原因：");
                    console.log("1. 英雄在創建隊伍後被升級了");
                    console.log("2. 英雄屬性計算有誤");
                    console.log("3. 合約存儲有問題");
                } else {
                    console.log("\n✅ 戰力計算正確！");
                }
            }
        } else {
            console.log("未找到創建事件");
        }
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
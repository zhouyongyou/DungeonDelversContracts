// scripts/check-expedition-result.ts
// 檢查隊伍的出征結果

import { ethers } from "hardhat";

async function main() {
    console.log("🔍 檢查出征結果...");
    
    const DUNGEON_STORAGE_ADDRESS = "0x6FF605478fea3C3270f2eeD550129c58Dea81403";
    const DUNGEON_MASTER_ADDRESS = "0x84eD128634F9334Bd63a929824066901a74a0E71";
    const PARTY_ID = 1n;
    
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV3", DUNGEON_MASTER_ADDRESS);
    
    // 獲取隊伍狀態
    const partyStatus = await dungeonStorage.getPartyStatus(PARTY_ID);
    
    console.log("\n隊伍 #1 狀態:");
    console.log(`儲備剩餘: ${partyStatus[0]}`);
    console.log(`冷卻結束時間: ${new Date(Number(partyStatus[1]) * 1000).toLocaleString()}`);
    console.log(`未領取獎勵: ${ethers.formatEther(partyStatus[2])} SOUL`);
    console.log(`疲勞度: ${partyStatus[3]}`);
    
    // 檢查是否在冷卻中
    const now = Math.floor(Date.now() / 1000);
    const cooldownEnds = Number(partyStatus[1]);
    if (now < cooldownEnds) {
        console.log(`\n⏰ 隊伍仍在冷卻中，剩餘 ${cooldownEnds - now} 秒`);
    } else {
        console.log("\n✅ 隊伍已準備就緒！");
    }
    
    // 查詢最近的出征事件
    console.log("\n查詢最近的出征事件...");
    const filter = dungeonMaster.filters.ExpeditionFulfilled(null, PARTY_ID);
    const events = await dungeonMaster.queryFilter(filter, -100, 'latest');
    
    if (events.length > 0) {
        console.log(`\n找到 ${events.length} 個出征記錄`);
        const latestEvent = events[events.length - 1];
        const args = latestEvent.args;
        
        console.log("\n最近一次出征:");
        console.log(`請求者: ${args[0]}`);
        console.log(`隊伍 ID: ${args[1]}`);
        console.log(`結果: ${args[2] ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`獎勵: ${ethers.formatEther(args[3])} SOUL`);
        console.log(`經驗: ${args[4]} EXP`);
        console.log(`區塊: ${latestEvent.blockNumber}`);
        console.log(`交易: ${latestEvent.transactionHash}`);
    } else {
        console.log("\n未找到出征記錄");
    }
    
    // 提示領取獎勵
    if (partyStatus[2] > 0n) {
        console.log("\n💰 有未領取的獎勵！");
        console.log("可以調用 claimRewards(1) 來領取獎勵");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
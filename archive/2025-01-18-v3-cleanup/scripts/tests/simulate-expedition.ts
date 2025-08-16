// scripts/simulate-expedition.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🎮 模擬遠征交易...\n");

    const dungeonMasterAddress = process.env.VITE_MAINNET_DUNGEONMASTER_ADDRESS || "0x9c8089a4e39971FD530fefd6B4ad2543C409d58d";
    const [signer] = await ethers.getSigners();
    
    // 獲取合約實例
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    
    // 假設的參數（需要根據實際情況調整）
    const partyId = 3; // 請替換為實際的隊伍 ID
    const dungeonId = 6; // 巫妖墓穴
    
    try {
        console.log("執行參數:");
        console.log(`  發送者: ${signer.address}`);
        console.log(`  隊伍 ID: ${partyId}`);
        console.log(`  地城 ID: ${dungeonId}`);
        console.log(`  發送 ETH: 0 (因為 explorationFee = 0)`);
        
        // 嘗試模擬交易
        console.log("\n模擬 requestExpedition 交易...");
        
        // 使用 staticCall 來模擬交易
        try {
            await dungeonMaster.requestExpedition.staticCall(partyId, dungeonId, { value: 0 });
            console.log("✅ 靜態調用成功！交易應該能夠執行。");
        } catch (error: any) {
            console.error("❌ 靜態調用失敗:", error.message);
            
            // 解析錯誤原因
            if (error.message.includes("Not party owner")) {
                console.log("   原因: 您不是隊伍 #" + partyId + " 的擁有者");
                console.log("   建議: 請使用您擁有的隊伍 ID");
            } else if (error.message.includes("Power too low")) {
                console.log("   原因: 隊伍戰力不足");
                console.log("   建議: 選擇戰力較低的地城或組建更強的隊伍");
            } else if (error.message.includes("Party on cooldown")) {
                console.log("   原因: 隊伍仍在冷卻中");
                console.log("   建議: 等待冷卻結束");
            } else if (error.message.includes("Dungeon DNE")) {
                console.log("   原因: 地城不存在或未初始化");
                console.log("   建議: 選擇其他地城");
            } else if (error.message.includes("BNB fee not met")) {
                console.log("   原因: BNB 費用不足");
                console.log("   建議: 發送正確的 BNB 數量");
            }
            
            // 如果有錯誤數據，顯示它
            if (error.data) {
                console.log("\n錯誤數據:", error.data);
            }
        }
        
        // 檢查其他可能的問題
        console.log("\n檢查其他可能的問題...");
        
        // 1. 檢查 Oracle
        const dungeonCore = await dungeonMaster.dungeonCore();
        const core = await ethers.getContractAt("DungeonCore", dungeonCore);
        const oracleAddress = await core.oracleContractAddress();
        console.log(`\n1. Oracle 地址: ${oracleAddress}`);
        
        if (oracleAddress === ethers.ZeroAddress) {
            console.log("   ❌ Oracle 未設置！");
        } else {
            console.log("   ✅ Oracle 已設置");
        }
        
        // 2. 檢查合約是否暫停
        const isPaused = await dungeonMaster.paused();
        console.log(`\n2. DungeonMaster 是否暫停: ${isPaused ? '❌ 是' : '✅ 否'}`);
        
    } catch (error: any) {
        console.error("\n❌ 執行過程中發生錯誤:", error);
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});
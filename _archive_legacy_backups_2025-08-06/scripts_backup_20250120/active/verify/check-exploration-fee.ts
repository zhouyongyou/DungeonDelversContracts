import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("檢查 DungeonMaster 探索費用設置...\n");

    // 讀取 contract-config.json
    const configPath = path.join(__dirname, "../contract-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const dungeonMasterAddress = config.contracts.game.dungeonMaster.address;
    console.log(`DungeonMaster 地址: ${dungeonMasterAddress}`);

    // 連接到合約
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);

    // 檢查探索費用
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`\n當前探索費用: ${ethers.formatEther(explorationFee)} BNB`);
    console.log(`探索費用 (Wei): ${explorationFee.toString()}`);

    // 檢查預期的探索費用
    const expectedFee = ethers.parseEther("0.0015"); // 從合約代碼中的默認值
    console.log(`\n預期探索費用: ${ethers.formatEther(expectedFee)} BNB`);
    console.log(`預期費用 (Wei): ${expectedFee.toString()}`);

    if (explorationFee === 0n) {
        console.log("\n❌ 警告: 探索費用為 0！");
        console.log("這可能導致前端交易失敗，因為合約中有檢查:");
        console.log('require(msg.value >= explorationFee, "DM: BNB fee not met");');
        
        console.log("\n建議修復方案:");
        console.log("1. 使用以下命令設置探索費用:");
        console.log(`   dungeonMaster.setExplorationFee("${expectedFee.toString()}")`);
        
        // 獲取 owner
        const owner = await dungeonMaster.owner();
        const [signer] = await ethers.getSigners();
        
        console.log(`\n合約 Owner: ${owner}`);
        console.log(`當前帳戶: ${signer.address}`);
        console.log(`是否為 Owner: ${owner.toLowerCase() === signer.address.toLowerCase() ? "✅ 是" : "❌ 否"}`);
        
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("\n正在嘗試設置探索費用...");
            try {
                const tx = await dungeonMaster.setExplorationFee(expectedFee);
                console.log(`交易已發送: ${tx.hash}`);
                await tx.wait();
                console.log("✅ 探索費用已成功設置！");
                
                // 驗證設置
                const newFee = await dungeonMaster.explorationFee();
                console.log(`新的探索費用: ${ethers.formatEther(newFee)} BNB`);
            } catch (error) {
                console.log("❌ 設置失敗:", error.message);
            }
        }
    } else {
        console.log("\n✅ 探索費用已正確設置");
    }

    // 測試一個簡單的地下城請求
    console.log("\n\n測試地下城 1002 是否存在:");
    console.log("=".repeat(60));
    
    try {
        const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = DungeonStorage.attach(await dungeonMaster.dungeonStorage());
        
        const NUM_DUNGEONS = await dungeonStorage.NUM_DUNGEONS();
        console.log(`總地下城數量: ${NUM_DUNGEONS}`);
        console.log(`地下城 ID 1002 是否有效: ${1002 <= NUM_DUNGEONS ? "是" : "否"}`);
        
        if (1002 > NUM_DUNGEONS) {
            console.log("\n❌ 錯誤原因找到！");
            console.log("前端嘗試訪問地下城 #1002，但系統只有 10 個地下城 (ID: 1-10)");
            console.log("\n可能的原因:");
            console.log("1. 前端硬編碼了錯誤的地下城ID");
            console.log("2. 前端數據映射錯誤");
            console.log("3. 子圖返回了錯誤的數據");
        }
        
        // 嘗試讀取地下城 1002
        try {
            const dungeon = await dungeonStorage.getDungeon(1002);
            console.log(`\n地下城 #1002 數據:`, dungeon);
        } catch (error) {
            console.log(`\n嘗試讀取地下城 #1002 時的錯誤:`, error.message);
        }
        
    } catch (error) {
        console.log("錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
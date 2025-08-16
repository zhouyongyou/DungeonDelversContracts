const { ethers } = require("hardhat");

async function main() {
    console.log("=== 診斷合約狀態 ===\n");

    // 獲取部署的合約地址
    const DUNGEON_CORE_ADDRESS = "0xf0d0666B8e2C47e6098E5f1FD97D88ee73D16bb3";
    const EXPECTED_DUNGEON_MASTER = "0xd13250E0F0766006816d7AfE95EaEEc5e215d082";
    
    // 獲取合約實例 - 使用完整路徑
    const DungeonCore = await ethers.getContractFactory("contracts/current/core/DungeonCore.sol:DungeonCore");
    const dungeonCore = DungeonCore.attach(DUNGEON_CORE_ADDRESS);
    
    console.log("1. 檢查 DungeonMaster 地址");
    console.log("===========================");
    try {
        const actualDungeonMaster = await dungeonCore.dungeonMaster();
        console.log("實際 DungeonMaster:", actualDungeonMaster);
        console.log("預期 DungeonMaster:", EXPECTED_DUNGEON_MASTER);
        console.log("地址是否匹配:", actualDungeonMaster.toLowerCase() === EXPECTED_DUNGEON_MASTER.toLowerCase());
        
        // 檢查顯示的地址
        const displayedAddress = "0x14988aCB98B48D288dB65ebDaBce74628867ae64";
        console.log("\n前端顯示的地址:", displayedAddress);
        console.log("與實際地址是否匹配:", actualDungeonMaster.toLowerCase() === displayedAddress.toLowerCase());
    } catch (error) {
        console.error("讀取 dungeonMaster 失敗:", error.message);
    }
    
    console.log("\n2. 檢查地城參數");
    console.log("================");
    try {
        // 檢查是否有 dungeonType 函數
        const dungeonTypeCount = 5; // 假設有5種地城類型
        
        for (let i = 0; i < dungeonTypeCount; i++) {
            console.log(`\n地城類型 ${i}:`);
            try {
                const params = await dungeonCore.dungeonParams(i);
                console.log("- 基礎獎勵:", params.baseReward.toString());
                console.log("- 挑戰成本:", params.challengeCost.toString());
                console.log("- 成功率:", params.successRate.toString());
                console.log("- 冷卻時間:", params.cooldownTime.toString(), "秒");
            } catch (error) {
                console.log("- 錯誤:", error.message);
            }
        }
    } catch (error) {
        console.error("讀取地城參數失敗:", error.message);
    }
    
    console.log("\n3. 檢查挑戰冷卻時間");
    console.log("====================");
    try {
        // 嘗試直接讀取某個地城的冷卻時間
        const params0 = await dungeonCore.dungeonParams(0);
        console.log("地城0的冷卻時間:", params0.cooldownTime.toString(), "秒");
        
        // 檢查全局冷卻設置
        try {
            const globalCooldown = await dungeonCore.globalCooldown();
            console.log("全局冷卻時間:", globalCooldown.toString(), "秒");
        } catch (error) {
            console.log("沒有全局冷卻時間設置或讀取失敗");
        }
    } catch (error) {
        console.error("讀取冷卻時間失敗:", error.message);
    }
    
    console.log("\n4. 檢查合約初始化狀態");
    console.log("======================");
    try {
        // 檢查是否有初始化標記
        const owner = await dungeonCore.owner();
        console.log("合約 Owner:", owner);
        
        // 嘗試讀取一些基本配置
        try {
            const isPaused = await dungeonCore.paused();
            console.log("合約是否暫停:", isPaused);
        } catch (error) {
            console.log("無法讀取暫停狀態");
        }
    } catch (error) {
        console.error("檢查初始化狀態失敗:", error.message);
    }
    
    console.log("\n5. 檢查合約 ABI 和函數");
    console.log("=======================");
    // 列出合約的主要函數
    const functions = [
        "dungeonMaster",
        "dungeonParams",
        "setDungeonParams",
        "owner",
        "transferOwnership"
    ];
    
    for (const func of functions) {
        try {
            const hasFunction = typeof dungeonCore[func] === 'function';
            console.log(`${func}: ${hasFunction ? '✓ 存在' : '✗ 不存在'}`);
        } catch (error) {
            console.log(`${func}: ✗ 檢查失敗`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
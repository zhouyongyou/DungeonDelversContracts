const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 檢查 DungeonStorage 的 logicContract 設定...\n");
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
        dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
    };
    
    try {
        const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.dungeonStorage);
        
        // 檢查 logicContract
        const logicContract = await dungeonStorage.logicContract();
        console.log("DungeonStorage.logicContract:", logicContract);
        console.log("預期的 DungeonMaster 地址:", addresses.dungeonMaster);
        console.log("匹配:", logicContract.toLowerCase() === addresses.dungeonMaster.toLowerCase() ? "✅" : "❌");
        
        if (logicContract === ethers.ZeroAddress) {
            console.log("\n❌ 問題找到了！logicContract 尚未設定！");
            console.log("需要調用 DungeonStorage.setLogicContract() 來設定 DungeonMaster 地址");
        } else if (logicContract.toLowerCase() !== addresses.dungeonMaster.toLowerCase()) {
            console.log("\n❌ 問題找到了！logicContract 設定錯誤！");
            console.log("當前設定的地址不是 DungeonMaster");
        } else {
            console.log("\n✅ logicContract 設定正確");
            
            // 如果設定正確，嘗試模擬 setPartyStatus
            console.log("\n測試 setPartyStatus 調用:");
            const [signer] = await ethers.getSigners();
            
            try {
                // 從 DungeonMaster 調用應該成功
                const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
                
                // 創建一個測試狀態
                const testStatus = {
                    provisionsRemaining: 10,
                    cooldownEndsAt: 0,
                    unclaimedRewards: 0,
                    fatigueLevel: 0
                };
                
                // 直接調用 dungeonStorage 的 setPartyStatus 會失敗
                await dungeonStorage.setPartyStatus(999, testStatus);
                console.log("❌ 不應該到這裡 - 直接調用應該失敗");
            } catch (e) {
                console.log("✅ 預期的錯誤 - 只有 logicContract 可以調用");
            }
        }
        
    } catch (error) {
        console.error("檢查過程中發生錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
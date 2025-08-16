const { ethers } = require("hardhat");

async function main() {
    console.log("🔮 檢查 Oracle 價格設定...\n");
    
    const addresses = {
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",
        oracle: "0xFa2255D806C62a68e8b2F4a7e20f3E8aE9a15c06", // 從 CLAUDE.md
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
        usdToken: "", // 需要從 DungeonCore 獲取
    };
    
    try {
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        
        // 獲取設定的 Oracle 和 USD Token
        const oracleAddress = await dungeonCore.oracleAddress();
        const usdTokenAddress = await dungeonCore.usdTokenAddress();
        
        console.log("DungeonCore 設定:");
        console.log(`  Oracle: ${oracleAddress}`);
        console.log(`  USD Token: ${usdTokenAddress}`);
        console.log(`  SoulShard: ${await dungeonCore.soulShardTokenAddress()}`);
        
        // 檢查 Oracle 是否正確
        console.log(`\nOracle 地址匹配: ${oracleAddress.toLowerCase() === addresses.oracle.toLowerCase() ? '✅' : '❌'}`);
        
        // 測試價格轉換
        const testAmounts = [
            ethers.parseEther("1"),    // 1 USD
            ethers.parseEther("2"),    // 2 USD (儲備價格)
            ethers.parseEther("10"),   // 10 USD
        ];
        
        console.log("\n價格轉換測試:");
        for (const amount of testAmounts) {
            try {
                const soulAmount = await dungeonCore.getSoulShardAmountForUSD(amount);
                console.log(`  ${ethers.formatEther(amount)} USD = ${ethers.formatEther(soulAmount)} SOUL`);
            } catch (e) {
                console.log(`  ${ethers.formatEther(amount)} USD = ❌ 錯誤: ${e.message}`);
            }
        }
        
        // 反向測試
        console.log("\n反向價格測試:");
        const testSoulAmounts = [
            ethers.parseEther("1"),      // 1 SOUL
            ethers.parseEther("100"),    // 100 SOUL
            ethers.parseEther("1000"),   // 1000 SOUL
        ];
        
        for (const amount of testSoulAmounts) {
            try {
                const usdValue = await dungeonCore.getUSDValueForSoulShard(amount);
                console.log(`  ${ethers.formatEther(amount)} SOUL = ${ethers.formatEther(usdValue)} USD`);
            } catch (e) {
                console.log(`  ${ethers.formatEther(amount)} SOUL = ❌ 錯誤: ${e.message}`);
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
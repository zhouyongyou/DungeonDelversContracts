// 調試稅率計算問題的腳本
const { ethers } = require("hardhat");

async function main() {
    // 獲取合約實例
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1"; // V25 PlayerVault
    const playerVault = await ethers.getContractAt("PlayerVault", playerVaultAddress);
    
    // 你的地址
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    console.log("=== 稅率計算調試 ===\n");
    
    // 1. 讀取稅率參數
    const standardInitialRate = await playerVault.standardInitialRate();
    const largeWithdrawInitialRate = await playerVault.largeWithdrawInitialRate();
    const decreaseRatePerPeriod = await playerVault.decreaseRatePerPeriod();
    const periodDuration = await playerVault.periodDuration();
    const smallThreshold = await playerVault.smallWithdrawThresholdUSD();
    const largeThreshold = await playerVault.largeWithdrawThresholdUSD();
    
    console.log("稅率參數:");
    console.log("- 標準初始稅率:", standardInitialRate.toString(), `(${standardInitialRate / 100}%)`);
    console.log("- 大額初始稅率:", largeWithdrawInitialRate.toString(), `(${largeWithdrawInitialRate / 100}%)`);
    console.log("- 每期減少率:", decreaseRatePerPeriod.toString(), `(${decreaseRatePerPeriod / 100}%)`);
    console.log("- 期間長度:", periodDuration.toString(), "秒", `(${periodDuration / 86400} 天)`);
    console.log("- 小額門檻:", ethers.formatEther(smallThreshold), "USD");
    console.log("- 大額門檻:", ethers.formatEther(largeThreshold), "USD");
    
    // 2. 讀取玩家信息
    const playerInfo = await playerVault.playerInfo(playerAddress);
    console.log("\n玩家信息:");
    console.log("- 可提領餘額:", ethers.formatEther(playerInfo[0]), "SOUL");
    console.log("- 上次提領時間戳:", playerInfo[1].toString());
    console.log("- 上次免費提領時間戳:", playerInfo[2].toString());
    
    // 如果 lastWithdrawTimestamp 不是 0，計算時間差
    if (playerInfo[1] > 0) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timePassed = currentTime - Number(playerInfo[1]);
        const daysPassed = Math.floor(timePassed / 86400);
        console.log("- 距離上次提領:", timePassed, "秒", `(${daysPassed} 天)`);
    }
    
    // 3. 獲取 DungeonCore 地址
    const dungeonCoreAddress = await playerVault.dungeonCore();
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    
    // 4. 獲取 VIP 和玩家等級
    const vipStakingAddress = await dungeonCore.vipStakingAddress();
    const playerProfileAddress = await dungeonCore.playerProfileAddress();
    
    if (vipStakingAddress !== ethers.ZeroAddress) {
        const vipStaking = await ethers.getContractAt("IVIPStaking", vipStakingAddress);
        const vipLevel = await vipStaking.getVipLevel(playerAddress);
        console.log("\nVIP 等級:", vipLevel.toString());
        console.log("- VIP 稅率減免:", (vipLevel * 50).toString(), `(${vipLevel * 0.5}%)`);
    }
    
    if (playerProfileAddress !== ethers.ZeroAddress) {
        const playerProfile = await ethers.getContractAt("IPlayerProfile", playerProfileAddress);
        const playerLevel = await playerProfile.getLevel(playerAddress);
        console.log("\n玩家等級:", playerLevel.toString());
        console.log("- 等級稅率減免:", (Math.floor(playerLevel / 10) * 100).toString(), 
            `(${Math.floor(playerLevel / 10)}%)`);
    }
    
    // 5. 模擬稅率計算
    console.log("\n=== 模擬稅率計算 ===");
    
    // 測試不同金額
    const testAmounts = [
        ethers.parseEther("10"),   // ~$0.6 (假設 1 SOUL = $0.06)
        ethers.parseEther("100"),  // ~$6
        ethers.parseEther("1000"), // ~$60
        ethers.parseEther("10000") // ~$600
    ];
    
    for (const amount of testAmounts) {
        try {
            // 獲取 USD 價值
            const usdValue = await dungeonCore.getUSDValueForSoulShard(amount);
            console.log(`\n測試金額: ${ethers.formatEther(amount)} SOUL`);
            console.log(`- USD 價值: $${ethers.formatEther(usdValue)}`);
            
            // 手動計算稅率（模擬合約邏輯）
            const isLarge = usdValue > largeThreshold;
            const initialRate = isLarge ? largeWithdrawInitialRate : standardInitialRate;
            
            const currentTime = Math.floor(Date.now() / 1000);
            const timePassed = currentTime - Number(playerInfo[1]);
            const periodsPassed = Math.floor(timePassed / Number(periodDuration));
            const timeDecay = periodsPassed * Number(decreaseRatePerPeriod);
            
            console.log(`- 初始稅率: ${initialRate} (${Number(initialRate) / 100}%)`);
            console.log(`- 時間衰減: ${timeDecay} (${timeDecay / 100}%)`);
            console.log(`- 是否大額: ${isLarge}`);
            
            // 檢查是否符合小額免稅
            if (usdValue <= smallThreshold) {
                const timeSinceLastFree = currentTime - Number(playerInfo[2]);
                if (timeSinceLastFree >= 86400) {
                    console.log(`- 符合小額免稅條件！`);
                }
            }
        } catch (error) {
            console.error(`- 錯誤: ${error.message}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
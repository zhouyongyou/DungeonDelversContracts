// 簡化版稅率調試腳本 - 使用 ethers 直接連接
const { ethers } = require("ethers");

async function main() {
    // BSC RPC
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    // 合約地址
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const dungeonCoreAddress = "0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E";
    
    // 你的地址
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    // PlayerVault 簡化 ABI
    const playerVaultABI = [
        "function standardInitialRate() view returns (uint256)",
        "function largeWithdrawInitialRate() view returns (uint256)",
        "function decreaseRatePerPeriod() view returns (uint256)",
        "function periodDuration() view returns (uint256)",
        "function smallWithdrawThresholdUSD() view returns (uint256)",
        "function largeWithdrawThresholdUSD() view returns (uint256)",
        "function playerInfo(address) view returns (uint256, uint256, uint256)",
        "function dungeonCore() view returns (address)"
    ];
    
    // DungeonCore 簡化 ABI
    const dungeonCoreABI = [
        "function getUSDValueForSoulShard(uint256) view returns (uint256)",
        "function vipStakingAddress() view returns (address)",
        "function playerProfileAddress() view returns (address)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, provider);
    
    console.log("=== PlayerVault 稅率調試 ===\n");
    
    try {
        // 1. 讀取稅率參數
        const standardRate = await playerVault.standardInitialRate();
        const largeRate = await playerVault.largeWithdrawInitialRate();
        const decreaseRate = await playerVault.decreaseRatePerPeriod();
        const period = await playerVault.periodDuration();
        const smallThreshold = await playerVault.smallWithdrawThresholdUSD();
        const largeThreshold = await playerVault.largeWithdrawThresholdUSD();
        
        console.log("📊 稅率參數:");
        console.log(`- 標準初始稅率: ${standardRate} (${standardRate / 100n}%)`);
        console.log(`- 大額初始稅率: ${largeRate} (${largeRate / 100n}%)`);
        console.log(`- 每期減少率: ${decreaseRate} (${decreaseRate / 100n}%)`);
        console.log(`- 期間長度: ${period} 秒 (${period / 86400n} 天)`);
        console.log(`- 小額門檻: ${ethers.formatEther(smallThreshold)} USD`);
        console.log(`- 大額門檻: ${ethers.formatEther(largeThreshold)} USD`);
        
        // 2. 讀取玩家信息
        const playerInfo = await playerVault.playerInfo(playerAddress);
        console.log("\n👤 玩家信息:");
        console.log(`- 可提領餘額: ${ethers.formatEther(playerInfo[0])} SOUL`);
        console.log(`- 上次提領時間戳: ${playerInfo[1]}`);
        console.log(`- 上次免費提領時間戳: ${playerInfo[2]}`);
        
        // 計算時間差
        const currentTime = Math.floor(Date.now() / 1000);
        const lastWithdraw = Number(playerInfo[1]);
        if (lastWithdraw > 0) {
            const timePassed = currentTime - lastWithdraw;
            const daysPassed = Math.floor(timePassed / 86400);
            const hoursPassed = Math.floor((timePassed % 86400) / 3600);
            console.log(`- 距離上次提領: ${daysPassed} 天 ${hoursPassed} 小時`);
            console.log(`- 時間衰減: ${daysPassed * 5}%`);
        } else {
            console.log(`- 從未提領過（時間戳為 0）`);
            const timeSinceEpoch = currentTime;
            const daysSinceEpoch = Math.floor(timeSinceEpoch / 86400);
            console.log(`- 從 Unix 紀元開始: ${daysSinceEpoch} 天`);
            console.log(`- 理論時間衰減: ${daysSinceEpoch * 5}% (遠超 100%，稅率為 0)`);
        }
        
        // 3. 測試 USD 價值計算
        console.log("\n💰 測試 USD 價值計算:");
        const testAmounts = ["100", "1000", "10000"]; // SOUL 數量
        
        for (const amount of testAmounts) {
            try {
                const soulAmount = ethers.parseEther(amount);
                const usdValue = await dungeonCore.getUSDValueForSoulShard(soulAmount);
                console.log(`- ${amount} SOUL = $${ethers.formatEther(usdValue)} USD`);
                
                // 檢查是否觸發小額免稅
                if (usdValue <= smallThreshold) {
                    console.log(`  ⚠️ 符合小額免稅條件（≤ $20）`);
                }
            } catch (error) {
                console.log(`- ${amount} SOUL 計算失敗: ${error.message}`);
            }
        }
        
        // 4. 獲取 VIP 和玩家等級地址
        console.log("\n🔗 相關合約地址:");
        const vipAddress = await dungeonCore.vipStakingAddress();
        const profileAddress = await dungeonCore.playerProfileAddress();
        console.log(`- VIP Staking: ${vipAddress}`);
        console.log(`- Player Profile: ${profileAddress}`);
        
    } catch (error) {
        console.error("\n❌ 錯誤:", error.message);
    }
}

main().catch(console.error);
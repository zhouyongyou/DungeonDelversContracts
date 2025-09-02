// 模擬合約的稅率計算邏輯
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const dungeonCoreAddress = "0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E";
    const vipStakingAddress = "0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c";
    const playerProfileAddress = "0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    // 完整的 ABI
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)",
        "function standardInitialRate() view returns (uint256)",
        "function largeWithdrawInitialRate() view returns (uint256)",
        "function decreaseRatePerPeriod() view returns (uint256)",
        "function periodDuration() view returns (uint256)",
        "function smallWithdrawThresholdUSD() view returns (uint256)",
        "function largeWithdrawThresholdUSD() view returns (uint256)"
    ];
    
    const vipStakingABI = [
        "function getVipLevel(address) view returns (uint256)"
    ];
    
    const playerProfileABI = [
        "function getLevel(address) view returns (uint256)"
    ];
    
    const dungeonCoreABI = [
        "function getUSDValueForSoulShard(uint256) view returns (uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, provider);
    const vipStaking = new ethers.Contract(vipStakingAddress, vipStakingABI, provider);
    const playerProfile = new ethers.Contract(playerProfileAddress, playerProfileABI, provider);
    
    console.log("=== 完整稅率計算模擬 ===\n");
    
    // 1. 獲取所有參數
    const playerInfo = await playerVault.playerInfo(playerAddress);
    const standardInitialRate = await playerVault.standardInitialRate();
    const largeWithdrawInitialRate = await playerVault.largeWithdrawInitialRate();
    const decreaseRatePerPeriod = await playerVault.decreaseRatePerPeriod();
    const periodDuration = await playerVault.periodDuration();
    const smallThreshold = await playerVault.smallWithdrawThresholdUSD();
    const largeThreshold = await playerVault.largeWithdrawThresholdUSD();
    
    // 2. 獲取 VIP 和玩家等級
    let vipLevel = 0n;
    let playerLevel = 0n;
    
    try {
        vipLevel = await vipStaking.getVipLevel(playerAddress);
        console.log(`✨ VIP 等級: ${vipLevel}`);
    } catch (e) {
        console.log("❌ 無法獲取 VIP 等級:", e.message);
    }
    
    try {
        playerLevel = await playerProfile.getLevel(playerAddress);
        console.log(`🎯 玩家等級: ${playerLevel}`);
    } catch (e) {
        console.log("❌ 無法獲取玩家等級:", e.message);
    }
    
    // 3. 模擬不同金額的稅率計算
    console.log("\n📊 模擬稅率計算:");
    
    const testAmounts = [
        "100000",    // 100k SOUL (~$5.87)
        "340773",    // 剛好 $20
        "500000",    // 500k SOUL (~$29.35)
        "596703",    // 全部餘額 (~$35.02)
        "1703868"    // $100 (如果有足夠餘額)
    ];
    
    for (const amountStr of testAmounts) {
        const amount = ethers.parseEther(amountStr);
        
        // 獲取 USD 價值
        let usdValue;
        try {
            usdValue = await dungeonCore.getUSDValueForSoulShard(amount);
        } catch (e) {
            console.log(`\n❌ 無法計算 ${amountStr} SOUL 的 USD 價值`);
            continue;
        }
        
        console.log(`\n📌 測試金額: ${parseFloat(amountStr).toLocaleString()} SOUL = $${ethers.formatEther(usdValue)}`);
        
        // 檢查小額免稅
        if (usdValue <= smallThreshold) {
            const lastFreeWithdraw = playerInfo[2];
            const currentTime = Math.floor(Date.now() / 1000);
            const timeSinceLastFree = BigInt(currentTime) - lastFreeWithdraw;
            
            console.log(`  小額提領檢查:`);
            console.log(`  - 上次免費提領時間戳: ${lastFreeWithdraw}`);
            console.log(`  - 距離上次免費提領: ${timeSinceLastFree} 秒`);
            
            if (timeSinceLastFree >= 86400n) {
                console.log(`  ✅ 符合小額免稅條件！稅率 = 0%`);
                continue;
            } else {
                console.log(`  ❌ 24小時內已使用過免稅額度`);
            }
        }
        
        // 計算標準稅率
        const isLarge = usdValue > largeThreshold;
        const initialRate = isLarge ? largeWithdrawInitialRate : standardInitialRate;
        
        // 時間衰減
        const lastWithdrawTimestamp = playerInfo[1];
        const currentTime = Math.floor(Date.now() / 1000);
        const timePassed = BigInt(currentTime) - lastWithdrawTimestamp;
        const periodsPassed = timePassed / periodDuration;
        const timeDecay = periodsPassed * decreaseRatePerPeriod;
        
        // VIP 和等級減免
        const vipReduction = vipLevel * 50n;
        const levelReduction = (playerLevel / 10n) * 100n;
        
        // 總減免
        const totalReduction = timeDecay + vipReduction + levelReduction;
        
        console.log(`  稅率計算明細:`);
        console.log(`  - 初始稅率: ${initialRate} (${Number(initialRate) / 100}%)`);
        console.log(`  - 時間衰減: ${timeDecay} (${Number(timeDecay) / 100}%)`);
        console.log(`  - VIP 減免: ${vipReduction} (${Number(vipReduction) / 100}%)`);
        console.log(`  - 等級減免: ${levelReduction} (${Number(levelReduction) / 100}%)`);
        console.log(`  - 總減免: ${totalReduction} (${Number(totalReduction) / 100}%)`);
        
        // 最終稅率
        const finalRate = totalReduction >= initialRate ? 0n : initialRate - totalReduction;
        console.log(`  - 最終稅率: ${finalRate} (${Number(finalRate) / 100}%)`);
        
        if (finalRate === 0n) {
            console.log(`  🎉 免稅！`);
        }
    }
    
    // 4. 檢查可能的問題
    console.log("\n🔍 可能的問題檢查:");
    
    // 檢查時間戳
    const lastWithdraw = Number(playerInfo[1]);
    const now = Math.floor(Date.now() / 1000);
    if (lastWithdraw === 0) {
        console.log("⚠️ lastWithdrawTimestamp = 0，這會導致巨大的時間衰減");
    } else if (lastWithdraw > now) {
        console.log("⚠️ lastWithdrawTimestamp 在未來，這可能導致計算錯誤");
    }
    
    // 檢查參數設置
    if (Number(decreaseRatePerPeriod) >= Number(standardInitialRate)) {
        console.log("⚠️ decreaseRatePerPeriod 過高，一天就能免稅");
    }
    
    // 檢查合約地址
    console.log("\n📍 合約地址確認:");
    console.log(`- PlayerVault: ${playerVaultAddress}`);
    console.log(`- DungeonCore: ${dungeonCoreAddress}`);
    console.log(`- VIPStaking: ${vipStakingAddress}`);
    console.log(`- PlayerProfile: ${playerProfileAddress}`);
}

main().catch(console.error);
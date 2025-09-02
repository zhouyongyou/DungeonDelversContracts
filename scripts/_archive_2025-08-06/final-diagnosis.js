// 最終診斷腳本 - 找出為什麼 $35 USD 免稅
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)",
        "function standardInitialRate() view returns (uint256)",
        "function decreaseRatePerPeriod() view returns (uint256)",
        "function periodDuration() view returns (uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    
    console.log("=== 最終診斷：為什麼 $35 USD 免稅？ ===\n");
    
    // 獲取數據
    const playerInfo = await playerVault.playerInfo(playerAddress);
    const standardRate = await playerVault.standardInitialRate();
    const decreaseRate = await playerVault.decreaseRatePerPeriod();
    const periodDuration = await playerVault.periodDuration();
    
    const lastWithdrawTimestamp = playerInfo[1];
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("📊 關鍵數據:");
    console.log(`- 當前時間: ${currentTime}`);
    console.log(`- 上次提領時間: ${lastWithdrawTimestamp}`);
    console.log(`- 基礎稅率: ${standardRate} (${Number(standardRate) / 100}%)`);
    console.log(`- 每期減少: ${decreaseRate} (${Number(decreaseRate) / 100}%)`);
    console.log(`- 期間長度: ${periodDuration} 秒`);
    
    // 診斷各種可能性
    console.log("\n🔍 診斷結果:\n");
    
    // 1. 檢查 lastWithdrawTimestamp = 0
    if (lastWithdrawTimestamp === 0n) {
        console.log("✅ 問題找到！lastWithdrawTimestamp = 0");
        console.log("   這意味著合約認為你從未提領過");
        console.log("   時間衰減會從 Unix 紀元開始計算，導致免稅");
        
        const timeSinceEpoch = BigInt(currentTime);
        const periodsPassed = timeSinceEpoch / periodDuration;
        const timeDecay = periodsPassed * decreaseRate;
        
        console.log(`   - 從紀元開始的秒數: ${timeSinceEpoch}`);
        console.log(`   - 經過的期數: ${periodsPassed}`);
        console.log(`   - 時間衰減: ${timeDecay} (${Number(timeDecay) / 100}%)`);
        console.log(`   - 遠超過基礎稅率，所以稅率 = 0%`);
        
        console.log("\n   可能的原因:");
        console.log("   1. _processWithdrawal 函數沒有被正確調用");
        console.log("   2. 交易 revert 了但某些狀態已經改變");
        console.log("   3. 合約邏輯有 bug");
        
        return;
    }
    
    // 2. 檢查時間差
    const timeDiff = BigInt(currentTime) - lastWithdrawTimestamp;
    const periodsPassed = timeDiff / periodDuration;
    const timeDecay = periodsPassed * decreaseRate;
    
    console.log("📅 時間衰減分析:");
    console.log(`- 時間差: ${timeDiff} 秒`);
    console.log(`- 經過期數: ${periodsPassed}`);
    console.log(`- 時間衰減: ${timeDecay} (${Number(timeDecay) / 100}%)`);
    
    // 算上 VIP 減免（VIP 2 = 1%）
    const totalReduction = timeDecay + 100n; // 100 = 1% VIP 減免
    
    if (totalReduction >= standardRate) {
        console.log(`\n✅ 時間衰減 + VIP 減免 (${Number(totalReduction) / 100}%) >= 基礎稅率 (${Number(standardRate) / 100}%)`);
        console.log("   所以稅率 = 0%");
    } else {
        const finalRate = standardRate - totalReduction;
        console.log(`\n❌ 理論稅率應該是: ${Number(finalRate) / 100}%`);
        console.log("   但實際卻是免稅，這表示有其他問題");
    }
    
    // 3. 其他可能性
    console.log("\n💡 其他可能的解釋:");
    console.log("1. 合約的 withdraw 函數可能有隱藏邏輯");
    console.log("2. _calculateTaxRate 函數可能有 bug");
    console.log("3. 前端顯示免稅，但實際可能有扣稅（需要查看交易）");
    console.log("4. 合約可能被代理或升級過");
    
    // 4. 建議行動
    console.log("\n🛠️ 建議行動:");
    console.log("1. 查看 BSCScan 上你最近的提領交易");
    console.log("2. 檢查 Withdrawn 事件中的 taxAmount 參數");
    console.log("3. 如果 taxAmount = 0，確實是合約問題");
    console.log("4. 如果 taxAmount > 0，則是前端顯示問題");
}

main().catch(console.error);
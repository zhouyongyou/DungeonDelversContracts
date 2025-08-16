// 模擬完整的提領流程，找出免稅原因
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const dungeonCoreAddress = "0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E";
    const playerAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)",
        "function smallWithdrawThresholdUSD() view returns (uint256)",
        "function getTaxRateForAmount(address, uint256) view returns (uint256)"
    ];
    
    const dungeonCoreABI = [
        "function getUSDValueForSoulShard(uint256) view returns (uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, provider);
    
    console.log("=== 模擬完整提領流程 ===\n");
    
    // 測試金額
    const testAmount = ethers.parseEther("596703"); // 全部餘額
    
    console.log("📊 步驟 1: 獲取玩家信息");
    const playerInfo = await playerVault.playerInfo(playerAddress);
    console.log(`- 餘額: ${ethers.formatEther(playerInfo[0])} SOUL`);
    console.log(`- lastWithdrawTimestamp: ${playerInfo[1]}`);
    console.log(`- lastFreeWithdrawTimestamp: ${playerInfo[2]}`);
    
    console.log("\n📊 步驟 2: 計算 USD 價值");
    const amountUSD = await dungeonCore.getUSDValueForSoulShard(testAmount);
    console.log(`- ${ethers.formatEther(testAmount)} SOUL = $${ethers.formatEther(amountUSD)}`);
    
    console.log("\n📊 步驟 3: 檢查小額免稅條件");
    const smallThreshold = await playerVault.smallWithdrawThresholdUSD();
    console.log(`- 小額閾值: $${ethers.formatEther(smallThreshold)}`);
    console.log(`- 是否小額: ${amountUSD <= smallThreshold ? "是 ✅" : "否 ❌"}`);
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastFree = BigInt(currentTime) - playerInfo[2];
    console.log(`- 距離上次免費提領: ${timeSinceLastFree} 秒`);
    console.log(`- 可以免費提領: ${timeSinceLastFree >= 86400n ? "是 ✅" : "否 ❌"}`);
    
    if (amountUSD <= smallThreshold && timeSinceLastFree >= 86400n) {
        console.log("\n✅ 觸發小額免稅機制！");
        return;
    }
    
    console.log("\n📊 步驟 4: 使用 getTaxRateForAmount 函數");
    try {
        const taxRate = await playerVault.getTaxRateForAmount(playerAddress, testAmount);
        console.log(`- 合約返回的稅率: ${taxRate} (${Number(taxRate) / 100}%)`);
        
        if (taxRate === 0n) {
            console.log("\n🔴 合約確實返回 0% 稅率！");
            console.log("這證明是合約邏輯問題，不是前端問題。");
        }
    } catch (error) {
        console.log("❌ 調用 getTaxRateForAmount 失敗:", error.message);
    }
    
    console.log("\n💡 診斷結論:");
    console.log("1. 如果 getTaxRateForAmount 返回 0，問題在合約邏輯");
    console.log("2. 可能是 _calculateTaxRate 函數的計算錯誤");
    console.log("3. 需要檢查 VIP/等級數據的讀取是否正確");
    
    // 額外測試：不同金額的稅率
    console.log("\n📊 測試不同金額的稅率:");
    const testAmounts = ["100000", "500000", "1000000", "2000000"];
    
    for (const amount of testAmounts) {
        const soulAmount = ethers.parseEther(amount);
        const usdValue = await dungeonCore.getUSDValueForSoulShard(soulAmount);
        
        try {
            const rate = await playerVault.getTaxRateForAmount(playerAddress, soulAmount);
            console.log(`- ${amount} SOUL ($${ethers.formatEther(usdValue)}): 稅率 ${Number(rate) / 100}%`);
        } catch (e) {
            console.log(`- ${amount} SOUL: 查詢失敗`);
        }
    }
}

main().catch(console.error);
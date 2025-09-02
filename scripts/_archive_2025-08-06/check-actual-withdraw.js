// 檢查實際可提領金額
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const dungeonCoreAddress = "0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)"
    ];
    
    const dungeonCoreABI = [
        "function getUSDValueForSoulShard(uint256) view returns (uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, provider);
    
    console.log("=== 實際可提領金額分析 ===\n");
    
    // 獲取餘額
    const playerInfo = await playerVault.playerInfo(playerAddress);
    const balance = playerInfo[0];
    
    console.log(`💰 你的餘額: ${ethers.formatEther(balance)} SOUL`);
    
    // 計算 USD 價值
    const usdValue = await dungeonCore.getUSDValueForSoulShard(balance);
    console.log(`💵 USD 價值: $${ethers.formatEther(usdValue)}`);
    
    // 分析稅率情況
    console.log("\n📊 稅率分析:");
    if (usdValue <= ethers.parseEther("20")) {
        console.log("✅ 你的全部餘額符合小額免稅條件（≤ $20）");
        console.log("🎉 提領全部餘額將享受 0% 稅率！");
    } else {
        console.log("❌ 超過小額免稅門檻");
        console.log("📈 將適用標準稅率");
    }
    
    // 測試不同提領金額
    console.log("\n🧮 不同提領金額的 USD 價值:");
    const testAmounts = [
        "1000",      // 1k SOUL
        "10000",     // 10k SOUL
        "100000",    // 100k SOUL
        "500000",    // 500k SOUL
        ethers.formatEther(balance) // 全部餘額
    ];
    
    for (const amount of testAmounts) {
        const soulAmount = ethers.parseEther(amount);
        if (soulAmount <= balance) {
            const usd = await dungeonCore.getUSDValueForSoulShard(soulAmount);
            const usdFormatted = ethers.formatEther(usd);
            console.log(`- ${parseFloat(amount).toLocaleString()} SOUL = $${parseFloat(usdFormatted).toFixed(4)} USD ${parseFloat(usdFormatted) <= 20 ? '(免稅)' : '(需繳稅)'}`);
        }
    }
    
    // 計算要達到不同 USD 門檻需要多少 SOUL
    console.log("\n💡 USD 門檻對應的 SOUL 數量:");
    const soulPrice = 0.00005869; // 從之前的結果
    const thresholds = [20, 100, 500, 1000];
    
    for (const usd of thresholds) {
        const requiredSoul = usd / soulPrice;
        console.log(`- $${usd} USD = ${requiredSoul.toLocaleString()} SOUL ${requiredSoul > parseFloat(ethers.formatEther(balance)) ? '(餘額不足)' : '(可提領)'}`);
    }
}

main().catch(console.error);
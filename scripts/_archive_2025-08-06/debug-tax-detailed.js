// 更詳細的稅率調試腳本
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const dungeonCoreAddress = "0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)",
        "function smallWithdrawThresholdUSD() view returns (uint256)",
        "event Withdrawn(address indexed player, uint256 amount, uint256 taxAmount)"
    ];
    
    const dungeonCoreABI = [
        "function getUSDValueForSoulShard(uint256) view returns (uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    const dungeonCore = new ethers.Contract(dungeonCoreAddress, dungeonCoreABI, provider);
    
    console.log("=== 詳細稅率分析 ===\n");
    
    // 1. 分析你提到的 $100 USD 提領
    console.log("💵 $100 USD 提領分析:");
    const soulPrice = 0.00005869; // 從前面的結果
    const soulFor100USD = 100 / soulPrice;
    console.log(`- 需要 SOUL 數量: ${soulFor100USD.toFixed(2)} SOUL`);
    console.log(`- 轉換為 Wei: ${ethers.parseEther(soulFor100USD.toString())}`);
    
    // 2. 測試實際的 USD 計算
    const testSoulAmount = ethers.parseEther("1703425"); // 約 $100
    const actualUSD = await dungeonCore.getUSDValueForSoulShard(testSoulAmount);
    console.log(`- 1,703,425 SOUL = $${ethers.formatEther(actualUSD)} USD`);
    
    // 3. 檢查小額門檻
    const smallThreshold = await playerVault.smallWithdrawThresholdUSD();
    console.log(`\n📏 小額免稅門檻: $${ethers.formatEther(smallThreshold)} USD`);
    
    // 4. 分析最近的提領事件
    console.log("\n📜 最近的提領事件:");
    try {
        // 獲取最近的區塊
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = latestBlock - 1000; // 查看最近 1000 個區塊
        
        // 查詢 Withdrawn 事件
        const filter = playerVault.filters.Withdrawn(playerAddress);
        const events = await playerVault.queryFilter(filter, fromBlock, latestBlock);
        
        if (events.length > 0) {
            console.log(`找到 ${events.length} 個提領事件:`);
            for (const event of events.slice(-5)) { // 最近 5 個
                const block = await provider.getBlock(event.blockNumber);
                const date = new Date(block.timestamp * 1000);
                console.log(`\n- 區塊 ${event.blockNumber} (${date.toLocaleString()})`);
                console.log(`  提領金額: ${ethers.formatEther(event.args[1])} SOUL`);
                console.log(`  稅額: ${ethers.formatEther(event.args[2])} SOUL`);
                
                // 計算稅率
                const amount = event.args[1];
                const tax = event.args[2];
                const taxRate = amount > 0n ? (tax * 10000n / amount) : 0n;
                console.log(`  實際稅率: ${taxRate / 100n}.${taxRate % 100n}%`);
                
                // 計算 USD 價值
                const usdValue = await dungeonCore.getUSDValueForSoulShard(amount);
                console.log(`  USD 價值: $${ethers.formatEther(usdValue)}`);
            }
        } else {
            console.log("未找到最近的提領事件");
        }
    } catch (error) {
        console.log("無法查詢事件:", error.message);
    }
    
    // 5. 時間戳問題分析
    const playerInfo = await playerVault.playerInfo(playerAddress);
    const lastWithdrawTimestamp = Number(playerInfo[1]);
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log("\n⏰ 時間戳分析:");
    console.log(`- 當前時間: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`);
    console.log(`- 上次提領: ${lastWithdrawTimestamp} (${new Date(lastWithdrawTimestamp * 1000).toLocaleString()})`);
    
    if (lastWithdrawTimestamp > currentTime) {
        console.log(`- ⚠️ 警告: 上次提領時間在未來！`);
        console.log(`- 可能原因: 合約使用了錯誤的時間戳`);
    }
}

main().catch(console.error);
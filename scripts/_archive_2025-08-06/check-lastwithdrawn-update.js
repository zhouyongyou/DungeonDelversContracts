// 檢查 lastWithdrawTimestamp 是否正確更新
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    const playerVaultABI = [
        "function playerInfo(address) view returns (uint256, uint256, uint256)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    
    console.log("=== 檢查 lastWithdrawTimestamp 問題 ===\n");
    
    // 持續監控 playerInfo
    console.log("開始監控 playerInfo 變化...\n");
    
    let lastKnownTimestamp = 0n;
    let checkCount = 0;
    
    const checkPlayerInfo = async () => {
        const playerInfo = await playerVault.playerInfo(playerAddress);
        const currentTimestamp = playerInfo[1];
        const balance = playerInfo[0];
        
        const now = Math.floor(Date.now() / 1000);
        
        console.log(`[檢查 #${++checkCount}] ${new Date().toLocaleTimeString()}`);
        console.log(`- 餘額: ${ethers.formatEther(balance)} SOUL`);
        console.log(`- lastWithdrawTimestamp: ${currentTimestamp}`);
        console.log(`- 當前時間: ${now}`);
        
        if (currentTimestamp !== lastKnownTimestamp) {
            console.log(`⚠️ timestamp 變化了！從 ${lastKnownTimestamp} 變為 ${currentTimestamp}`);
            lastKnownTimestamp = currentTimestamp;
        }
        
        // 檢查異常情況
        if (currentTimestamp === 0n) {
            console.log("❌ lastWithdrawTimestamp = 0，這會導致免稅！");
        } else if (currentTimestamp > BigInt(now)) {
            console.log("❌ lastWithdrawTimestamp 在未來！");
        } else {
            const timeDiff = BigInt(now) - currentTimestamp;
            const days = timeDiff / 86400n;
            console.log(`- 距離上次提領: ${days} 天`);
            
            // 計算時間衰減
            const timeDecay = days * 500n; // 每天 5%
            console.log(`- 時間衰減: ${timeDecay / 100n}%`);
            
            if (timeDecay >= 2400n) { // 2400 = 24% (25% - 1% VIP減免)
                console.log("✅ 時間衰減足夠，會免稅！");
            }
        }
        
        console.log("---");
    };
    
    // 立即檢查一次
    await checkPlayerInfo();
    
    console.log("\n請在另一個終端執行提領操作，這裡會持續監控...");
    console.log("按 Ctrl+C 結束監控\n");
    
    // 每 5 秒檢查一次
    setInterval(checkPlayerInfo, 5000);
}

main().catch(console.error);
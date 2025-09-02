// 檢查鏈上交易事件，確認實際稅收情況
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const playerAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    
    const playerVaultABI = [
        "event Withdrawn(address indexed player, uint256 amount, uint256 taxAmount)"
    ];
    
    const playerVault = new ethers.Contract(playerVaultAddress, playerVaultABI, provider);
    
    console.log("=== 檢查最近的提領事件 ===");
    console.log(`\n玩家地址: ${playerAddress}`);
    console.log(`合約地址: ${playerVaultAddress}\n`);
    
    // 獲取最近 1 小時的區塊範圍（避免 RPC 限制）
    const currentBlock = await provider.getBlockNumber();
    const blocksPerHour = 1200; // BSC 約 3 秒一個區塊
    const fromBlock = currentBlock - blocksPerHour;
    
    console.log(`搜尋範圍: 區塊 ${fromBlock} 到 ${currentBlock}`);
    console.log("\n📋 提領事件列表:\n");
    
    try {
        // 獲取 Withdrawn 事件
        const filter = playerVault.filters.Withdrawn(playerAddress);
        const events = await playerVault.queryFilter(filter, fromBlock, currentBlock);
        
        if (events.length === 0) {
            console.log("❌ 最近 24 小時內沒有找到提領事件");
            console.log("\n可能的原因:");
            console.log("1. 交易失敗了（revert）");
            console.log("2. 只是前端模擬，沒有實際執行");
            console.log("3. 事件發生在更早的時間");
            return;
        }
        
        // 分析每個事件
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const block = await provider.getBlock(event.blockNumber);
            const timestamp = new Date(block.timestamp * 1000);
            
            const amount = event.args.amount;
            const taxAmount = event.args.taxAmount;
            
            console.log(`事件 #${i + 1}:`);
            console.log(`- 時間: ${timestamp.toLocaleString()}`);
            console.log(`- 區塊: ${event.blockNumber}`);
            console.log(`- 交易哈希: ${event.transactionHash}`);
            console.log(`- 提領金額: ${ethers.formatEther(amount)} SOUL`);
            console.log(`- 稅收金額: ${ethers.formatEther(taxAmount)} SOUL`);
            
            // 計算實際稅率
            const totalAmount = amount + taxAmount;
            const taxRate = totalAmount > 0n ? (taxAmount * 10000n) / totalAmount : 0n;
            console.log(`- 實際稅率: ${Number(taxRate) / 100}%`);
            
            if (taxAmount === 0n) {
                console.log(`✅ 確認免稅！`);
            } else {
                console.log(`❌ 有扣稅，可能是前端顯示問題`);
            }
            
            console.log("---\n");
        }
        
        // 總結
        console.log("📊 總結:");
        const taxFreeCount = events.filter(e => e.args.taxAmount === 0n).length;
        const taxedCount = events.length - taxFreeCount;
        
        console.log(`- 總提領次數: ${events.length}`);
        console.log(`- 免稅次數: ${taxFreeCount}`);
        console.log(`- 扣稅次數: ${taxedCount}`);
        
        if (taxFreeCount === events.length) {
            console.log("\n🔴 所有提領都是免稅的！這確實是合約問題。");
            console.log("\n可能的原因:");
            console.log("1. _calculateTaxRate 函數有 bug");
            console.log("2. lastWithdrawTimestamp 沒有正確初始化（= 0）");
            console.log("3. 合約有特殊邏輯（如 owner 免稅）");
            console.log("4. 時間計算溢出或其他數學錯誤");
        }
        
    } catch (error) {
        console.error("❌ 查詢事件時出錯:", error.message);
    }
    
    // 提供 BSCScan 連結
    console.log("\n🔗 BSCScan 連結:");
    console.log(`https://bscscan.com/address/${playerVaultAddress}#events`);
    console.log(`\n你可以在 BSCScan 上查看更詳細的事件記錄。`);
}

main().catch(console.error);
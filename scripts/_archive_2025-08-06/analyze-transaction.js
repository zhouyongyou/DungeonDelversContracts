// 分析特定交易
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const txHash = "0xe9d47a7bc676c9b8c7a119dd37442be7bddcb41118a2dd253864fa5cb113d836";
    
    console.log("=== 分析交易詳情 ===\n");
    console.log(`交易哈希: ${txHash}\n`);
    
    // 獲取交易詳情
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    console.log("📊 交易基本信息:");
    console.log(`- 狀態: ${receipt.status === 1 ? "✅ 成功" : "❌ 失敗"}`);
    console.log(`- 發送者: ${tx.from}`);
    console.log(`- 合約: ${tx.to}`);
    console.log(`- 區塊: ${receipt.blockNumber}`);
    console.log(`- Gas Used: ${receipt.gasUsed.toString()}`);
    
    // 解析函數調用
    const iface = new ethers.Interface([
        "function withdraw(uint256 amount)"
    ]);
    
    try {
        const decoded = iface.parseTransaction({ data: tx.data });
        console.log(`\n📋 函數調用:`);
        console.log(`- 函數: ${decoded.name}`);
        console.log(`- 提領金額: ${ethers.formatEther(decoded.args[0])} SOUL`);
    } catch (e) {
        console.log("\n❌ 無法解析函數調用");
    }
    
    // 解析事件
    console.log("\n📋 事件日誌:");
    
    const eventInterface = new ethers.Interface([
        "event Withdrawn(address indexed player, uint256 amount, uint256 taxAmount)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    
    let withdrawnEvent = null;
    let transferEvents = [];
    
    for (const log of receipt.logs) {
        try {
            const parsed = eventInterface.parseLog(log);
            
            if (parsed.name === "Withdrawn") {
                withdrawnEvent = parsed;
                console.log(`\n✅ Withdrawn 事件:`);
                console.log(`  - 玩家: ${parsed.args[0]}`);
                console.log(`  - 提領金額: ${ethers.formatEther(parsed.args[1])} SOUL`);
                console.log(`  - 稅收金額: ${ethers.formatEther(parsed.args[2])} SOUL`);
                
                // 計算實際稅率
                const totalAmount = parsed.args[1] + parsed.args[2];
                const taxRate = totalAmount > 0n ? (parsed.args[2] * 10000n) / totalAmount : 0n;
                console.log(`  - 實際稅率: ${Number(taxRate) / 100}%`);
                
                if (parsed.args[2] === 0n) {
                    console.log(`  - 🔴 確認免稅！`);
                }
            } else if (parsed.name === "Transfer") {
                transferEvents.push(parsed);
            }
        } catch (e) {
            // 忽略無法解析的事件
        }
    }
    
    // 分析 Transfer 事件
    if (transferEvents.length > 0) {
        console.log(`\n💰 Transfer 事件 (${transferEvents.length} 個):`);
        for (const event of transferEvents) {
            console.log(`  - 從 ${event.args[0].slice(0, 10)}... 到 ${event.args[1].slice(0, 10)}...`);
            console.log(`    金額: ${ethers.formatEther(event.args[2])} SOUL`);
        }
    }
    
    // 總結
    console.log("\n📊 總結:");
    if (withdrawnEvent) {
        const taxAmount = withdrawnEvent.args[2];
        if (taxAmount === 0n) {
            console.log("🔴 這筆交易確實是免稅的！");
            console.log("問題確認：合約的稅率計算邏輯有 bug。");
        } else {
            console.log("✅ 這筆交易有正常扣稅。");
        }
    } else {
        console.log("⚠️ 沒有找到 Withdrawn 事件，可能交易失敗或合約有問題。");
    }
}

main().catch(console.error);
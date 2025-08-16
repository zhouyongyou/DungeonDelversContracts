// 驗證合約邏輯是否正確
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const playerAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    
    console.log("=== 驗證合約邏輯 ===\n");
    
    // 1. 獲取合約字節碼來確認是否被修改
    const code = await provider.getCode(playerVaultAddress);
    console.log(`合約字節碼長度: ${code.length} 字符`);
    console.log(`合約確實存在: ${code !== '0x' ? '✅' : '❌'}`);
    
    // 2. 測試直接調用 withdraw 函數看會發生什麼
    console.log("\n📋 創建測試調用數據:");
    
    const iface = new ethers.Interface([
        "function withdraw(uint256 amount)"
    ]);
    
    // 測試提領 500,000 SOUL (約 $29.35)
    const testAmount = ethers.parseEther("500000");
    const calldata = iface.encodeFunctionData("withdraw", [testAmount]);
    
    console.log(`- 函數: withdraw`);
    console.log(`- 參數: ${ethers.formatEther(testAmount)} SOUL`);
    console.log(`- Calldata: ${calldata}`);
    
    // 3. 使用 eth_call 模擬交易
    console.log("\n🔮 模擬交易（不會真的執行）:");
    
    try {
        // 嘗試靜態調用
        const result = await provider.call({
            to: playerVaultAddress,
            from: playerAddress,
            data: calldata
        });
        
        console.log("✅ 模擬成功!");
        console.log(`返回數據: ${result}`);
    } catch (error) {
        console.log("❌ 模擬失敗:");
        console.log(`錯誤: ${error.message}`);
        
        // 嘗試解析錯誤
        if (error.data) {
            console.log(`錯誤數據: ${error.data}`);
        }
    }
    
    // 4. 檢查其他可能影響稅率的因素
    console.log("\n🔍 其他可能的問題:");
    
    // 檢查是否有 owner 權限被濫用
    const ownerABI = ["function owner() view returns (address)"];
    const contract = new ethers.Contract(playerVaultAddress, ownerABI, provider);
    
    try {
        const owner = await contract.owner();
        console.log(`- 合約 Owner: ${owner}`);
        
        if (owner.toLowerCase() === playerAddress.toLowerCase()) {
            console.log("⚠️ 你是合約的 Owner！可能有特殊權限");
        }
    } catch (e) {
        console.log("- 無法獲取 Owner 信息");
    }
    
    // 5. 檢查是否有特殊的白名單機制
    console.log("\n💭 可能的原因總結:");
    console.log("1. lastWithdrawTimestamp 沒有正確更新（始終為 0）");
    console.log("2. 合約有隱藏的白名單機制");
    console.log("3. 合約的稅率計算邏輯被修改了");
    console.log("4. VIP 或等級數據讀取有問題");
    console.log("5. 時間計算有 bug（例如溢出）");
    
    // 6. 建議下一步
    console.log("\n📝 建議:");
    console.log("1. 查看 BSCScan 上的合約源碼，確認邏輯是否正確");
    console.log("2. 檢查最近的交易，看 Withdrawn 事件的 taxAmount 參數");
    console.log("3. 嘗試用另一個地址測試，看是否也免稅");
    console.log("4. 檢查合約是否有被升級或修改");
}

main().catch(console.error);
// 檢查部署的合約版本
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    
    console.log("=== 檢查部署的合約版本 ===\n");
    
    // 檢查是否有舊版本的自動轉稅邏輯
    const playerVaultABI = [
        "function _processWithdrawal(address, address, uint256, uint256) private"
    ];
    
    console.log("🔍 測試合約功能...\n");
    
    // 1. 檢查合約代碼大小
    const code = await provider.getCode(playerVaultAddress);
    const codeSize = (code.length - 2) / 2;
    console.log(`合約代碼大小: ${codeSize} 字節`);
    
    // 2. 嘗試調用一個只在舊版本存在的模式
    // 舊版本會有自動轉稅，新版本只有虛擬記帳
    
    // 3. 檢查最近的交易事件模式
    console.log("\n📊 分析交易事件模式:");
    console.log("根據你提供的交易，有兩個關鍵線索:");
    console.log("1. 兩筆 Transfer 事件都轉到同一個地址（你的地址）");
    console.log("2. 第二筆是稅收金額");
    
    console.log("\n💡 結論:");
    console.log("這種行為只有在以下情況下才可能發生:");
    console.log("1. 使用了舊版本的 PlayerVault（有自動轉稅邏輯）");
    console.log("2. 或者有外部腳本/合約在同一個交易中調用了 withdrawTax()");
    
    // 4. 檢查合約源碼版本標識
    console.log("\n🔍 建議驗證方法:");
    console.log("1. 去 BSCScan 查看合約源碼");
    console.log("2. 搜尋是否有 'soulShardToken.safeTransfer(dungeonCore.owner(), taxAmount)'");
    console.log("3. 如果有，說明使用了舊版本");
    console.log("4. 如果沒有，說明有外部自動化在處理稅收");
    
    console.log(`\n🔗 BSCScan 合約驗證連結:`);
    console.log(`https://bscscan.com/address/${playerVaultAddress}#code`);
    
    // 5. 檢查可能的自動化來源
    console.log("\n🤖 可能的自動化來源:");
    console.log("1. 多簽錢包的自動執行規則");
    console.log("2. Keeper 網路（如 Chainlink Automation）");
    console.log("3. 你的後端服務");
    console.log("4. 前端的自動調用邏輯");
    console.log("5. 其他監聽事件的合約");
}

main().catch(console.error);
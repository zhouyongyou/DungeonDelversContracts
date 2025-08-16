// 分析合約可能的 bug
const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
    
    const playerVaultAddress = "0x2746Ce8D6Aa7A885c568530abD9846460cA602f1";
    const playerAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    
    console.log("=== 深入分析合約 Bug ===\n");
    
    // 1. 分析合約代碼邏輯
    console.log("📊 已知信息彙總:");
    console.log("- SOUL 價格: $0.00005869");
    console.log("- 用戶餘額: 596,703 SOUL = $35.02 USD");
    console.log("- VIP 等級: 2 (減免 1%)");
    console.log("- 玩家等級: 0 (無減免)");
    console.log("- lastWithdrawTimestamp: 1754041590 (正確更新)");
    console.log("- 時間差: 約 18 分鐘 (無時間衰減)");
    console.log("- 理論稅率: 24% (25% - 1% VIP)");
    console.log("- 實際稅率: 0% (免稅)");
    
    console.log("\n🔍 可能的 Bug 分析:\n");
    
    console.log("1. **_calculateTaxRate 函數邏輯錯誤**");
    console.log("   合約代碼:");
    console.log("   ```solidity");
    console.log("   uint256 periodsPassed = (block.timestamp - player.lastWithdrawTimestamp) / periodDuration;");
    console.log("   ```");
    console.log("   - 如果 block.timestamp < player.lastWithdrawTimestamp，會發生下溢");
    console.log("   - Solidity 0.8+ 會 revert，但舊版本可能會產生巨大數值");
    console.log("   - 檢查: lastWithdrawTimestamp = 1754041590 < 當前時間，正常");
    
    console.log("\n2. **Owner 特權**");
    console.log("   - 你是合約 Owner: ✅");
    console.log("   - 但合約代碼中沒有 Owner 免稅邏輯");
    console.log("   - 除非合約被修改或使用了代理模式");
    
    console.log("\n3. **小額免稅機制誤判**");
    console.log("   - $35 > $20 閾值，不應該觸發小額免稅");
    console.log("   - 但可能有以下情況:");
    console.log("     a) Oracle 價格計算錯誤");
    console.log("     b) USD_DECIMALS 處理錯誤");
    console.log("     c) 閾值被修改了");
    
    console.log("\n4. **時間戳處理 Bug**");
    console.log("   - 可能的場景:");
    console.log("     a) _processWithdrawal 沒有被調用");
    console.log("     b) 交易 revert 但某些狀態已改變");
    console.log("     c) 重入攻擊導致狀態不一致");
    
    console.log("\n5. **數學運算 Bug**");
    console.log("   - totalReduction >= initialRate 的判斷");
    console.log("   - 可能的溢出或精度問題");
    console.log("   - VIP/等級數據讀取錯誤");
    
    console.log("\n💡 最可能的原因:");
    console.log("1. **Oracle 價格問題**: getUSDValueForSoulShard 返回的值可能不正確");
    console.log("2. **合約升級/代理**: 實際執行的代碼可能與源碼不同");
    console.log("3. **隱藏邏輯**: 可能有未公開的白名單或特殊處理");
    
    console.log("\n🛠️ 建議調試步驟:");
    console.log("1. 在合約中添加事件記錄每一步的計算值");
    console.log("2. 使用 Tenderly 或類似工具追蹤交易執行");
    console.log("3. 部署測試合約驗證邏輯");
    console.log("4. 檢查合約是否使用了代理模式");
    
    // 檢查合約是否是代理
    console.log("\n🔍 檢查是否為代理合約...");
    const code = await provider.getCode(playerVaultAddress);
    const codeSize = (code.length - 2) / 2; // 移除 0x 並轉換為字節
    console.log(`合約代碼大小: ${codeSize} 字節`);
    
    if (codeSize < 1000) {
        console.log("⚠️ 代碼太小，可能是代理合約！");
    } else {
        console.log("✅ 看起來是完整的邏輯合約");
    }
    
    // 檢查是否有實現插槽（EIP-1967）
    const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implAddress = await provider.getStorage(playerVaultAddress, IMPLEMENTATION_SLOT);
    
    if (implAddress !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log(`\n🔴 發現代理實現地址: ${implAddress}`);
        console.log("這是一個可升級代理合約！實際邏輯可能已被修改。");
    }
}

main().catch(console.error);
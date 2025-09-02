// 基於真實交易數據分析批量效率
console.log("🔍 批量鑄造真實效率分析");
console.log("========================");

// 真實交易數據
const SINGLE_NFT_FAILED = 197492;  // 1個NFT失敗交易
const FIVE_NFT_SUCCESS = 343518;   // 5個NFT成功交易

console.log("📊 真實交易對比:");
console.log("================");
console.log("1個 NFT (失敗):", SINGLE_NFT_FAILED.toLocaleString(), "gas");
console.log("5個 NFT (成功):", FIVE_NFT_SUCCESS.toLocaleString(), "gas");

// 效率分析
const avgPerNFTInBatch = FIVE_NFT_SUCCESS / 5;
const linearProjection = SINGLE_NFT_FAILED * 5;
const efficiency = (linearProjection - FIVE_NFT_SUCCESS) / linearProjection * 100;

console.log("\n🧮 效率計算:");
console.log("============");
console.log("如果線性增長 (5×單個):", linearProjection.toLocaleString(), "gas");
console.log("實際批量消耗 (5個):", FIVE_NFT_SUCCESS.toLocaleString(), "gas");
console.log("節省的 gas:", (linearProjection - FIVE_NFT_SUCCESS).toLocaleString(), "gas");
console.log("效率提升:", efficiency.toFixed(1) + "%");
console.log("\n批量中平均每個 NFT:", avgPerNFTInBatch.toLocaleString(), "gas");
console.log("vs 單獨鑄造:", SINGLE_NFT_FAILED.toLocaleString(), "gas");
console.log("單個NFT節省:", ((SINGLE_NFT_FAILED - avgPerNFTInBatch) / SINGLE_NFT_FAILED * 100).toFixed(1) + "%");

console.log("\n🔍 Gas 組成推測:");
console.log("================");

// 基於真實數據反推固定和可變成本
// 設：固定成本 = F, 每個NFT成本 = V
// 1個NFT: F + V = 197,492
// 5個NFT: F + 5V = 343,518
// 解方程組：
const V = (FIVE_NFT_SUCCESS - SINGLE_NFT_FAILED) / 4;  // (343518 - 197492) / 4
const F = SINGLE_NFT_FAILED - V;

console.log("推算固定成本 (F):", Math.round(F).toLocaleString(), "gas");
console.log("推算每個NFT成本 (V):", Math.round(V).toLocaleString(), "gas");

// 驗證
const predicted1NFT = F + V;
const predicted5NFT = F + 5 * V;

console.log("\n✅ 驗證推算:");
console.log("============");
console.log("預測 1個NFT:", Math.round(predicted1NFT).toLocaleString(), "vs 實際", SINGLE_NFT_FAILED.toLocaleString());
console.log("預測 5個NFT:", Math.round(predicted5NFT).toLocaleString(), "vs 實際", FIVE_NFT_SUCCESS.toLocaleString());
console.log("1個NFT誤差:", Math.abs(predicted1NFT - SINGLE_NFT_FAILED).toFixed(0), "gas");
console.log("5個NFT誤差:", Math.abs(predicted5NFT - FIVE_NFT_SUCCESS).toFixed(0), "gas");

console.log("\n📈 基於真實數據的批量預測:");
console.log("=========================");
console.log("數量 | 預測Gas    | 平均/個    | vs單獨節省");
console.log("----|----------|----------|----------");

[1, 2, 3, 5, 10, 15, 20].forEach(qty => {
    const predictedGas = F + qty * V;
    const avgPerNFT = predictedGas / qty;
    const savingsPerNFT = ((SINGLE_NFT_FAILED - avgPerNFT) / SINGLE_NFT_FAILED * 100);
    
    if (predictedGas <= 2500000) {  // 在2.5M限制內
        console.log(`${qty.toString().padStart(2)}   | ${Math.round(predictedGas).toString().padStart(8)} | ${Math.round(avgPerNFT).toString().padStart(8)} | ${savingsPerNFT.toFixed(1).padStart(8)}%`);
    }
});

// 基於真實數據的新公式建議
const safetyMargin = 0.15; // 15%安全餘量
const newBase = Math.ceil(F * (1 + safetyMargin));
const newPerNFT = Math.ceil(V * (1 + safetyMargin));

console.log("\n🔧 基於真實數據的新公式建議:");
console.log("============================");
console.log(`基礎成本: ${Math.round(F).toLocaleString()} gas`);
console.log(`每個NFT: ${Math.round(V).toLocaleString()} gas`);
console.log(`加15%安全餘量後:`);
console.log(`uint32 dynamicGas = uint32(${newBase} + quantity * ${newPerNFT});`);

console.log("\n新公式效果:");
console.log("1個NFT:", (newBase + newPerNFT).toLocaleString(), "gas (vs實際需求", SINGLE_NFT_FAILED.toLocaleString(), ")");
console.log("5個NFT:", (newBase + 5 * newPerNFT).toLocaleString(), "gas (vs實際需求", FIVE_NFT_SUCCESS.toLocaleString(), ")");

// 2.5M限制檢查
const maxNFTs = Math.floor((2500000 - newBase) / newPerNFT);
console.log("\n⚠️ 新公式支援最大NFT數量:", maxNFTs);

console.log("\n💡 關鍵洞察:");
console.log("============");
console.log("🔴 單個鑄造Gas高的原因：需要承擔全部固定成本");
console.log("🟢 批量鑄造效率高的原因：固定成本被攤銷");
console.log("📊 固定成本占比:", ((F/SINGLE_NFT_FAILED)*100).toFixed(1), "%");
console.log("📊 可變成本占比:", ((V/SINGLE_NFT_FAILED)*100).toFixed(1), "%");
console.log("🚀 最佳策略：鼓勵用戶批量鑄造以提高效率！");
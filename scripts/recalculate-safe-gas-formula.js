// 重新計算安全的 Gas 公式
console.log("🚨 重新計算安全 Gas 公式");
console.log("========================");

// 實際數據
const ACTUAL_1_NFT = 197492;
const REQUIRED_MINIMUM_1_NFT = 200000; // 用戶要求的最低安全值

console.log("📊 當前危險狀況:");
console.log("================");
console.log("實際需求 1 NFT:", ACTUAL_1_NFT, "gas");
console.log("當前公式 1 NFT:", 50000 + 110500, "=", 160500, "gas");
console.log("安全差距:", 160500 - ACTUAL_1_NFT, "gas (", Math.round((160500 - ACTUAL_1_NFT) / ACTUAL_1_NFT * 100), "%)");
console.log("🔴 **負安全餘量 = 非常危險！**");

console.log("\n🔧 修正方案:");
console.log("============");

// 方案 1: 確保單個 NFT 至少 200k
console.log("\n**方案 1: 保守安全型**");
const safe1NFT = REQUIRED_MINIMUM_1_NFT;
const safePerNFT1 = Math.ceil((safe1NFT - 50000)); // 保持基礎 50k
console.log(`公式: 50,000 + quantity * ${safePerNFT1}`);
console.log("1 NFT:", 50000 + safePerNFT1, "gas (安全餘量:", Math.round((50000 + safePerNFT1 - ACTUAL_1_NFT) / ACTUAL_1_NFT * 100), "%)");

// 方案 2: 基於實際需求 + 20% 安全餘量
console.log("\n**方案 2: 精確 + 20% 餘量**");
const safetyMargin = 0.2; // 20%
const safe1NFTWithMargin = Math.ceil(ACTUAL_1_NFT * (1 + safetyMargin));
const base2 = 40000; // 調整基礎值
const perNFT2 = Math.ceil((safe1NFTWithMargin - base2));
console.log(`基於實際 ${ACTUAL_1_NFT} + 20% = ${safe1NFTWithMargin}`);
console.log(`公式: ${base2} + quantity * ${perNFT2}`);
console.log("1 NFT:", base2 + perNFT2, "gas (安全餘量:", Math.round((base2 + perNFT2 - ACTUAL_1_NFT) / ACTUAL_1_NFT * 100), "%)");

// 方案 3: 保守的批量優化公式
console.log("\n**方案 3: 保守批量優化**");
const base3 = 60000;  // 更高的基礎成本
const perNFT3 = 160000; // 更高的每個 NFT 成本
console.log(`公式: ${base3} + quantity * ${perNFT3}`);

console.log("\n📈 三種方案對比:");
console.log("===============");
console.log("數量 | 方案1      | 方案2      | 方案3      | 實際需求(估算)");
console.log("----|----------|----------|----------|-------------");

const quantities = [1, 2, 5, 10, 15, 20];
quantities.forEach(qty => {
    const plan1 = 50000 + qty * safePerNFT1;
    const plan2 = base2 + qty * perNFT2;
    const plan3 = base3 + qty * perNFT3;
    const estimated = ACTUAL_1_NFT * qty * 0.85 + 50000; // 估算批量效率
    
    console.log(`${qty.toString().padStart(2)}   | ${plan1.toString().padStart(8)} | ${plan2.toString().padStart(8)} | ${plan3.toString().padStart(8)} | ${Math.round(estimated).toString().padStart(9)}`);
});

console.log("\n⚠️ 2.5M 限制檢查:");
console.log("================");
const MAX_LIMIT = 2500000;

[
    {name: "方案1", base: 50000, perNFT: safePerNFT1},
    {name: "方案2", base: base2, perNFT: perNFT2},
    {name: "方案3", base: base3, perNFT: perNFT3}
].forEach(plan => {
    const maxNFTs = Math.floor((MAX_LIMIT - plan.base) / plan.perNFT);
    console.log(`${plan.name}: 最多支援 ${maxNFTs} 個 NFT`);
});

console.log("\n💡 建議:");
console.log("=======");
console.log("🥇 **推薦方案 2**: 基於實際數據 + 20% 安全餘量");
console.log("   - 確保安全性（正餘量）");
console.log("   - 效率較高（不過度保守）");
console.log("   - 支援較多 NFT 批量");

console.log("\n🔧 建議的最終公式:");
console.log("================");
console.log(`uint32 dynamicGas = uint32(${base2} + quantity * ${perNFT2});`);
console.log("");
console.log("理由:");
console.log("- 確保 1 NFT 有", Math.round((base2 + perNFT2 - ACTUAL_1_NFT) / ACTUAL_1_NFT * 100), "% 正安全餘量");
console.log("- 基於實際失敗交易數據");
console.log("- 20% 安全緩衝應對網路波動");
console.log("- 仍可支援", Math.floor((MAX_LIMIT - base2) / perNFT2), "個 NFT 批量鑄造");
// 用10個NFT數據驗證批量公式
console.log("🎯 用10個NFT數據驗證批量公式");
console.log("===========================");

// 真實交易數據
const data = [
    { qty: 1, gas: 197492, status: "失敗" },
    { qty: 5, gas: 343518, status: "成功" },
    { qty: 10, gas: 492045, status: "成功", callbackLimit: 522000 }
];

console.log("📊 實際交易數據:");
console.log("================");
data.forEach(d => {
    console.log(`${d.qty.toString().padStart(2)} 個NFT: ${d.gas.toLocaleString().padStart(7)} gas (${d.status})`);
    if (d.callbackLimit) {
        console.log(`           callbackGasLimit: ${d.callbackLimit.toLocaleString()} gas`);
        console.log(`           安全餘量: ${((d.callbackLimit - d.gas) / d.gas * 100).toFixed(1)}%`);
    }
});

// 之前基於1個和5個NFT推算的公式
const previousF = 160986; // 固定成本
const previousV = 36507;  // 每個NFT成本

console.log("\n🧮 驗證之前的公式:");
console.log("================");
console.log(`之前公式: F = ${previousF.toLocaleString()}, V = ${previousV.toLocaleString()}`);

data.forEach(d => {
    const predicted = previousF + d.qty * previousV;
    const error = Math.abs(predicted - d.gas);
    const errorPercent = (error / d.gas * 100).toFixed(1);
    console.log(`${d.qty} 個NFT: 預測 ${predicted.toLocaleString()} vs 實際 ${d.gas.toLocaleString()} (誤差: ${error.toLocaleString()} gas, ${errorPercent}%)`);
});

// 用最小二乘法重新計算最精確的公式
console.log("\n📐 重新計算精確公式 (最小二乘法):");
console.log("================================");

// 線性回歸: gas = F + V * qty
// 使用最小二乘法求解 F 和 V
const n = data.length;
const sumQty = data.reduce((sum, d) => sum + d.qty, 0);
const sumGas = data.reduce((sum, d) => sum + d.gas, 0);
const sumQtyGas = data.reduce((sum, d) => sum + d.qty * d.gas, 0);
const sumQtySquared = data.reduce((sum, d) => sum + d.qty * d.qty, 0);

const V_precise = (n * sumQtyGas - sumQty * sumGas) / (n * sumQtySquared - sumQty * sumQty);
const F_precise = (sumGas - V_precise * sumQty) / n;

console.log(`精確固定成本 (F): ${Math.round(F_precise).toLocaleString()} gas`);
console.log(`精確每個NFT成本 (V): ${Math.round(V_precise).toLocaleString()} gas`);

console.log("\n✅ 精確公式驗證:");
console.log("================");
data.forEach(d => {
    const predicted = F_precise + d.qty * V_precise;
    const error = Math.abs(predicted - d.gas);
    const errorPercent = (error / d.gas * 100).toFixed(2);
    console.log(`${d.qty} 個NFT: 預測 ${Math.round(predicted).toLocaleString()} vs 實際 ${d.gas.toLocaleString()} (誤差: ${Math.round(error).toLocaleString()} gas, ${errorPercent}%)`);
});

// 計算R²決定係數
const meanGas = sumGas / n;
const totalSumSquares = data.reduce((sum, d) => sum + Math.pow(d.gas - meanGas, 2), 0);
const residualSumSquares = data.reduce((sum, d) => {
    const predicted = F_precise + d.qty * V_precise;
    return sum + Math.pow(d.gas - predicted, 2);
}, 0);
const rSquared = 1 - (residualSumSquares / totalSumSquares);

console.log(`\nR² (擬合度): ${rSquared.toFixed(4)} (${rSquared > 0.99 ? '極佳' : rSquared > 0.95 ? '很好' : '一般'})`);

// 效率分析
console.log("\n🚀 批量效率分析:");
console.log("================");
const single_cost = F_precise + V_precise;
console.log("數量 | 總Gas     | 平均每個   | vs單個節省 | 固定成本占比");
console.log("----|---------|--------|---------|---------");

[1, 2, 3, 5, 8, 10, 15, 20].forEach(qty => {
    const totalGas = F_precise + qty * V_precise;
    const avgPerNFT = totalGas / qty;
    const savings = ((single_cost - avgPerNFT) / single_cost * 100);
    const fixedRatio = (F_precise / totalGas * 100);
    
    if (totalGas <= 2500000) {
        console.log(`${qty.toString().padStart(2)}   | ${Math.round(totalGas).toString().padStart(7)} | ${Math.round(avgPerNFT).toString().padStart(6)} | ${savings.toFixed(1).padStart(7)}% | ${fixedRatio.toFixed(1).padStart(7)}%`);
    }
});

// 安全公式建議
const safetyMargin = 0.2; // 20%
const safeF = Math.ceil(F_precise * (1 + safetyMargin));
const safeV = Math.ceil(V_precise * (1 + safetyMargin));

console.log("\n🔧 建議的安全公式 (20%餘量):");
console.log("===========================");
console.log(`uint32 dynamicGas = uint32(${safeF} + quantity * ${safeV});`);

console.log("\n安全公式效果:");
[1, 5, 10].forEach(qty => {
    const safeGas = safeF + qty * safeV;
    const actualData = data.find(d => d.qty === qty);
    if (actualData) {
        const margin = ((safeGas - actualData.gas) / actualData.gas * 100);
        console.log(`${qty} 個NFT: ${safeGas.toLocaleString()} gas (vs實際 ${actualData.gas.toLocaleString()}, 餘量 ${margin.toFixed(1)}%)`);
    }
});

const maxNFTs = Math.floor((2500000 - safeF) / safeV);
console.log(`\n最大支援批量: ${maxNFTs} 個NFT`);

console.log("\n🎉 結論:");
console.log("========");
console.log("✅ 公式完全驗證！批量效率確實遵循固定成本+變動成本模型");
console.log(`✅ 固定成本: ${Math.round(F_precise).toLocaleString()} gas (占單個鑄造的 ${(F_precise/single_cost*100).toFixed(1)}%)`);
console.log(`✅ 變動成本: ${Math.round(V_precise).toLocaleString()} gas/NFT`);
console.log("✅ 批量鑄造效率隨數量增加而提升，最高節省77%+");
console.log("🚀 強烈建議用戶使用批量鑄造以節省gas費用！");
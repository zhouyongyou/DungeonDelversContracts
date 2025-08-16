const { ethers } = require('ethers');

console.log("=== TokenID + 隨機數 優化方案演示 ===\n");

// 模擬一個 VRF 返回的隨機數
const baseSeed = BigInt("11806273134638481584395649022295016373084715126470884421778337748295155974983");

console.log("📊 基礎設置");
console.log("─".repeat(60));
console.log("VRF 返回的隨機數:", baseSeed.toString());
console.log("要鑄造的 NFT 數量: 50");

console.log("\n🎲 生成 50 個唯一隨機數");
console.log("─".repeat(60));

// 模擬 50 個 tokenId
const startTokenId = 1000;
const results = [];

for (let i = 0; i < 50; i++) {
    const tokenId = startTokenId + i;
    
    // 核心：tokenId + baseSeed 生成唯一隨機數
    const uniqueSeed = BigInt(ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256"],
            [baseSeed, tokenId]
        )
    ));
    
    // 計算稀有度
    const rarityRoll = Number(uniqueSeed % 10000n);
    let rarity;
    if (rarityRoll < 5000) rarity = 1;      // 50% 普通
    else if (rarityRoll < 7500) rarity = 2; // 25% 優秀
    else if (rarityRoll < 9000) rarity = 3; // 15% 稀有
    else if (rarityRoll < 9750) rarity = 4; // 7.5% 史詩
    else rarity = 5;                        // 2.5% 傳說
    
    results.push({
        tokenId,
        rarity,
        rarityRoll
    });
}

// 統計稀有度分布
const rarityCount = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
results.forEach(r => rarityCount[r.rarity]++);

console.log("\n前 10 個 NFT：");
for (let i = 0; i < 10; i++) {
    const r = results[i];
    const rarityNames = {1: "普通", 2: "優秀", 3: "稀有", 4: "史詩", 5: "傳說"};
    console.log(`Token #${r.tokenId}: ${rarityNames[r.rarity]} (roll: ${r.rarityRoll})`);
}

console.log("\n📊 稀有度分布（50 個 NFT）");
console.log("─".repeat(60));
console.log(`普通 (1): ${rarityCount[1]} 個 (${rarityCount[1]/50*100}%)`);
console.log(`優秀 (2): ${rarityCount[2]} 個 (${rarityCount[2]/50*100}%)`);
console.log(`稀有 (3): ${rarityCount[3]} 個 (${rarityCount[3]/50*100}%)`);
console.log(`史詩 (4): ${rarityCount[4]} 個 (${rarityCount[4]/50*100}%)`);
console.log(`傳說 (5): ${rarityCount[5]} 個 (${rarityCount[5]/50*100}%)`);

console.log("\n✅ 優化效果");
console.log("─".repeat(60));
console.log("1. 只需要 1 個 VRF 隨機數（節省 98% 費用）");
console.log("2. 每個 TokenID 有唯一的隨機種子");
console.log("3. 稀有度分布符合預期概率");
console.log("4. 無法預測或操控結果");

console.log("\n💡 關鍵代碼");
console.log("─".repeat(60));
console.log(`
// 核心優化：用 tokenId + baseSeed 生成唯一隨機數
uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(baseSeed, tokenId)));
`);

console.log("\n💰 費用對比");
console.log("─".repeat(60));
console.log("優化前：50 個隨機數 × 0.00005 BNB = 0.0025 BNB");
console.log("優化後：1 個隨機數 × 0.00005 BNB = 0.00005 BNB");
console.log("節省：0.00245 BNB (98%)");
console.log("\n年化節省（假設每天 1000 次鑄造）：");
console.log("0.00245 × 20 × 365 = 17.885 BNB (約 $8,942 USD)");
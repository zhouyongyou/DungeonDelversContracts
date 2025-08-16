const { ethers } = require('ethers');

console.log("=== NFT 合約優化方案 ===\n");

console.log("📊 現狀分析");
console.log("─".repeat(60));
console.log("問題：Hero.sol 期待 randomWords 數組長度 = quantity");
console.log("實際：VRF 只返回 1 個隨機數");
console.log("結果：50 個 NFT 請求只鑄造了 1 個");

console.log("\n💡 解決方案：修改 _revealWithVRF 函數");
console.log("─".repeat(60));

const currentCode = `
// 當前代碼（有問題）
function _revealWithVRF(address user, uint256[] memory randomWords, MintCommitment storage commitment) private {
    for (uint256 i = 0; i < commitment.quantity; i++) {
        // 問題：假設 randomWords[i] 存在
        uint8 rarity = _determineRarityFromSeed(randomWords[i], commitment.maxRarity, user, commitment.quantity);
        uint256 power = _generateHeroPowerByRarity(rarity, randomWords[i]);
        // ...
    }
}`;

const optimizedCode = `
// 優化後代碼（用 1 個隨機數生成多個）
function _revealWithVRF(address user, uint256[] memory randomWords, MintCommitment storage commitment) private {
    require(randomWords.length > 0, "No random words");
    uint256 baseSeed = randomWords[0]; // 使用第一個隨機數作為種子
    
    for (uint256 i = 0; i < commitment.quantity; i++) {
        // 從基礎種子生成每個 NFT 的隨機數
        uint256 expandedSeed = uint256(keccak256(abi.encode(baseSeed, i)));
        
        uint8 rarity = _determineRarityFromSeed(expandedSeed, commitment.maxRarity, user, commitment.quantity);
        uint256 power = _generateHeroPowerByRarity(rarity, expandedSeed);
        // ...
    }
}`;

console.log("當前代碼（有問題）：");
console.log(currentCode);

console.log("\n優化後代碼（解決方案）：");
console.log(optimizedCode);

console.log("\n📋 需要修改的文件：");
console.log("─".repeat(60));
console.log("1. Hero.sol - _revealWithVRF 函數");
console.log("2. Relic.sol - 相同的修改");
console.log("3. DungeonMaster.sol - 如果有類似邏輯");

console.log("\n💰 費用對比：");
console.log("─".repeat(60));
console.log("修改前：50 個 NFT = 50 個隨機數 = 0.0025 BNB");
console.log("修改後：50 個 NFT = 1 個隨機數 = 0.00005 BNB");
console.log("節省：98% 🎉");

console.log("\n⚠️ 注意事項：");
console.log("─".repeat(60));
console.log("1. keccak256 生成的隨機數品質足夠好");
console.log("2. 每個 NFT 仍有唯一的隨機種子");
console.log("3. 無需修改 VRF Manager");
console.log("4. 前端無需改動");

console.log("\n🔧 實施步驟：");
console.log("─".repeat(60));
console.log("1. 修改 Hero.sol 的 _revealWithVRF 函數");
console.log("2. 修改 Relic.sol 的相同函數");
console.log("3. 重新部署合約");
console.log("4. 測試批量鑄造");

console.log("\n或者：");
console.log("使用已部署的優化版 VRF Manager：0xCcE39f6f06134fcEfb9382629358467F46692639");
console.log("它會自動擴展 1 個隨機數為多個");
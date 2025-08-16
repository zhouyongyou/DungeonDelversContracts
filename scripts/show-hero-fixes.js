console.log("=== Hero.sol 需要的修改 ===\n");

console.log("📊 問題 1：支付邏輯");
console.log("─".repeat(60));
console.log("現狀：");
console.log("- 要求 SOUL 代幣支付 NFT 價格 ✅");
console.log("- 要求 BNB 支付 platformFee（錯誤）");
console.log("- 要求 BNB 支付 VRF 費用 ✅");

console.log("\n修正：platformFee 應該用 SOUL 支付，不是 BNB");

const fixedMintFunction = `
function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
    require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity");
    require(userCommitments[msg.sender].blockNumber == 0 || userCommitments[msg.sender].fulfilled, "Hero: Previous mint pending");
    
    (uint8 maxRarity, ) = getMaxRarityForQuantity(_quantity);
    
    // 1. SOUL 代幣支付（NFT 價格 + 平台費）
    uint256 requiredSoulAmount = getRequiredSoulShardAmount(_quantity);
    uint256 platformFeeSoul = platformFee * _quantity; // 假設 platformFee 也用 SOUL
    uint256 totalSoulRequired = requiredSoulAmount + platformFeeSoul;
    
    // 2. BNB 只用於 VRF 費用
    uint256 vrfFee = 0;
    if (vrfManager != address(0)) {
        vrfFee = IVRFManager(vrfManager).fee() * _quantity; // 每個 NFT 0.0001 BNB
        require(msg.value >= vrfFee, "Hero: Insufficient BNB for VRF");
    }
    
    // 3. 轉移 SOUL 代幣
    soulShardToken.safeTransferFrom(msg.sender, address(this), totalSoulRequired);
    
    // 4. 請求 VRF（只請求 1 個隨機數）
    if (vrfManager != address(0)) {
        IVRFManager(vrfManager).requestRandomForUser{value: vrfFee}(
            msg.sender,
            1,  // ⚠️ 只請求 1 個隨機數，不是 _quantity
            maxRarity,
            commitment
        );
    }
    
    // ... 其餘邏輯
}`;

console.log("\n修正後的 mintFromWallet：");
console.log(fixedMintFunction);

console.log("\n📊 問題 2：隨機數擴展");
console.log("─".repeat(60));

const fixedRevealFunction = `
function _revealWithVRF(
    address user, 
    uint256[] memory randomWords, 
    MintCommitment storage commitment
) private {
    require(randomWords.length > 0, "No random words");
    
    uint256 baseSeed = randomWords[0]; // 只用第一個隨機數
    uint256[] memory tokenIds = userPendingTokens[user];
    
    for (uint256 i = 0; i < commitment.quantity; i++) {
        uint256 tokenId = tokenIds[i];
        
        // ✨ 用 tokenId + baseSeed 生成唯一隨機數
        uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(baseSeed, tokenId)));
        
        uint8 rarity = _determineRarityFromSeed(uniqueSeed, commitment.maxRarity, user, commitment.quantity);
        uint256 power = _generateHeroPowerByRarity(rarity, uniqueSeed);
        
        heroData[tokenId] = HeroData({
            rarity: rarity,
            power: power,
            isRevealed: true
        });
        
        _safeMint(user, tokenId);
        emit HeroMinted(tokenId, user, rarity, power);
    }
    
    emit BatchMintCompleted(user, commitment.quantity, commitment.maxRarity, tokenIds);
    delete userCommitments[user];
    delete userPendingTokens[user];
}`;

console.log("\n修正後的 _revealWithVRF：");
console.log(fixedRevealFunction);

console.log("\n💰 費用總結（50 個 NFT）：");
console.log("─".repeat(60));
console.log("SOUL 代幣：1,703,649.101 SOUL（NFT 價格）");
console.log("BNB：0.005 BNB（VRF 費用：50 × 0.0001）");
console.log("\n但優化後：");
console.log("BNB：0.0001 BNB（只請求 1 個隨機數）");
console.log("節省：0.0049 BNB (98%)");

console.log("\n📋 需要修改的文件：");
console.log("─".repeat(60));
console.log("1. Hero.sol");
console.log("   - mintFromWallet：修正支付邏輯");
console.log("   - _revealWithVRF：用 1 個隨機數生成多個");
console.log("\n2. Relic.sol");
console.log("   - 相同的修改");
console.log("\n3. VRF Manager");
console.log("   - 確保 fee() 返回 0.0001 BNB");
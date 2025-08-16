// Hero_VRF_Patch.sol - 展示 Hero.sol 的最小改動
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Hero.sol 的 VRF 改動指南
 * @notice 只需要改動以下幾個地方
 */

// ========== 1. 添加 VRFManager 引用 ==========
// 在 Hero.sol 的狀態變量區域添加：
/*
    address public vrfManager; // 新增：VRF 管理器地址
*/

// ========== 2. 修改 mintFromWallet 函數 ==========
// 原函數：
/*
function mintFromWallet(uint256 _quantity) external payable whenNotPaused nonReentrant {
    require(_quantity > 0 && _quantity <= 50, "Invalid quantity");
    require(userCommitments[msg.sender].blockNumber == 0, "Pending reveal");
    
    uint8 maxRarity = getMaxRarityForQuantity(_quantity);
    uint256 totalPrice = calculateTotalPrice(_quantity, false);
    require(msg.value >= totalPrice + platformFee, "Insufficient payment");
    
    // 創建承諾
    bytes32 commitment = keccak256(abi.encodePacked(
        msg.sender,
        block.number,
        _quantity,
        block.prevrandao
    ));
    
    userCommitments[msg.sender] = MintCommitment({
        blockNumber: block.number,
        quantity: _quantity,
        payment: msg.value,
        commitment: commitment,
        fulfilled: false,
        maxRarity: maxRarity,
        fromVault: false
    });
    
    // 預鑄造 tokenId
    uint256[] memory tokenIds = new uint256[](_quantity);
    for (uint i = 0; i < _quantity; i++) {
        tokenIds[i] = _nextTokenId++;
        _safeMint(msg.sender, tokenIds[i]);
        userPendingTokens[msg.sender].push(tokenIds[i]);
    }
    
    emit MintCommitted(msg.sender, _quantity, block.number, false);
    emit BatchMintCompleted(msg.sender, _quantity, maxRarity, tokenIds);
}
*/

// 修改後（只添加 VRF 調用）：
function mintFromWallet(uint256 _quantity) external payable whenNotPaused nonReentrant {
    require(_quantity > 0 && _quantity <= 50, "Invalid quantity");
    require(userCommitments[msg.sender].blockNumber == 0, "Pending reveal");
    
    uint8 maxRarity = getMaxRarityForQuantity(_quantity);
    uint256 totalPrice = calculateTotalPrice(_quantity, false);
    
    // ===== VRF 改動開始 =====
    uint256 requiredPayment = totalPrice + platformFee;
    if (vrfManager != address(0)) {
        // 使用 VRF 時需要額外費用
        uint256 vrfFee = IVRFManager(vrfManager).vrfRequestPrice();
        requiredPayment += vrfFee;
    }
    require(msg.value >= requiredPayment, "Insufficient payment");
    // ===== VRF 改動結束 =====
    
    bytes32 commitment = keccak256(abi.encodePacked(
        msg.sender,
        block.number,
        _quantity,
        block.prevrandao
    ));
    
    // ===== VRF 改動開始 =====
    if (vrfManager != address(0)) {
        // 調用 VRF Manager
        uint256 vrfFee = IVRFManager(vrfManager).vrfRequestPrice();
        IVRFManager(vrfManager).requestRandomForUser{value: vrfFee}(
            msg.sender,
            _quantity,
            maxRarity,
            commitment
        );
    }
    // ===== VRF 改動結束 =====
    
    // 保留原有邏輯
    userCommitments[msg.sender] = MintCommitment({
        blockNumber: block.number,
        quantity: _quantity,
        payment: msg.value,
        commitment: commitment,
        fulfilled: false,
        maxRarity: maxRarity,
        fromVault: false
    });
    
    // 預鑄造 tokenId（保持不變）
    uint256[] memory tokenIds = new uint256[](_quantity);
    for (uint i = 0; i < _quantity; i++) {
        tokenIds[i] = _nextTokenId++;
        _safeMint(msg.sender, tokenIds[i]);
        userPendingTokens[msg.sender].push(tokenIds[i]);
    }
    
    emit MintCommitted(msg.sender, _quantity, block.number, false);
    emit BatchMintCompleted(msg.sender, _quantity, maxRarity, tokenIds);
}

// ========== 3. 修改 reveal 函數 ==========
function reveal() external nonReentrant returns (uint256[] memory) {
    MintCommitment storage commitment = userCommitments[msg.sender];
    require(commitment.blockNumber > 0, "No pending mint");
    require(!commitment.fulfilled, "Already revealed");
    
    // ===== VRF 改動開始 =====
    if (vrfManager != address(0)) {
        // 檢查 VRF 是否完成
        (bool vrfFulfilled, uint256[] memory randomWords) = IVRFManager(vrfManager).getRandomForUser(msg.sender);
        if (vrfFulfilled && randomWords.length > 0) {
            // 使用 VRF 隨機數
            return _revealWithVRF(msg.sender, randomWords, commitment);
        }
    }
    // ===== VRF 改動結束 =====
    
    // 原有的區塊延遲檢查
    require(block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY, "Too early to reveal");
    require(block.number <= commitment.blockNumber + MAX_REVEAL_WINDOW, "Reveal window expired");
    
    // 原有的揭示邏輯...
    return _revealHeroes(msg.sender, commitment);
}

// ========== 4. 新增 VRF 揭示函數 ==========
function _revealWithVRF(
    address user,
    uint256[] memory randomWords,
    MintCommitment storage commitment
) internal returns (uint256[] memory) {
    uint256[] memory tokenIds = userPendingTokens[user];
    
    for (uint i = 0; i < randomWords.length && i < tokenIds.length; i++) {
        // 使用 VRF 隨機數生成屬性
        uint8 rarity = _determineRarityFromSeed(randomWords[i], commitment.maxRarity);
        uint256 power = _calculatePower(rarity, randomWords[i]);
        
        heroData[tokenIds[i]] = HeroData({
            rarity: rarity,
            power: power,
            isRevealed: true
        });
        
        emit HeroRevealed(tokenIds[i], user, rarity, power);
    }
    
    commitment.fulfilled = true;
    delete userPendingTokens[user];
    
    return tokenIds;
}

// ========== 5. 添加管理函數 ==========
function setVRFManager(address _vrfManager) external onlyOwner {
    vrfManager = _vrfManager;
    
    // 授權此合約使用 VRF
    if (_vrfManager != address(0)) {
        IVRFManager(_vrfManager).authorizeContract(address(this));
    }
}

// ========== 6. 添加接口定義 ==========
interface IVRFManager {
    function vrfRequestPrice() external view returns (uint256);
    function requestRandomForUser(address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) external payable returns (uint256);
    function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] memory randomWords);
    function authorizeContract(address contract_) external;
}

/**
 * 總結：
 * - 總改動行數：約 30-40 行
 * - 核心邏輯不變
 * - 完全向後兼容
 * - 可隨時開關 VRF
 */
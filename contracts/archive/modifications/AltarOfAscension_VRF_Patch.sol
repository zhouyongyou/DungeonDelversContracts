// AltarOfAscension_VRF_Patch.sol - 展示 AltarOfAscension.sol 的最小改動
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AltarOfAscension.sol 的 VRF 改動指南
 * @notice 升星祭壇使用 VRF 確保公平性
 */

// ========== 1. 添加 VRFManager 引用 ==========
// 在 AltarOfAscension.sol 的狀態變量區域添加：
/*
    address public vrfManager; // 新增：VRF 管理器地址
    mapping(address => uint256) public activeUpgradeRequest; // 用戶 => VRF requestId
*/

// ========== 2. 修改 upgradeHero 函數 ==========
function upgradeHero(
    uint256[] memory tokenIds,
    uint256 materialTokenId
) external nonReentrant whenNotPaused {
    require(tokenIds.length >= 2 && tokenIds.length <= 10, "Invalid token count");
    require(activeUpgradeRequest[msg.sender] == 0, "Pending upgrade exists");
    
    // 驗證所有權和稀有度
    IHero hero = IHero(heroContract);
    uint8 baseRarity = hero.getHeroData(tokenIds[0]).rarity;
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
        require(hero.ownerOf(tokenIds[i]) == msg.sender, "Not owner");
        require(hero.getHeroData(tokenIds[i]).rarity == baseRarity, "Different rarity");
    }
    
    // 計算成功率
    uint256 successRate = calculateSuccessRate(tokenIds.length, baseRarity);
    
    // ===== VRF 改動開始 =====
    if (vrfManager != address(0)) {
        // 使用 VRF 請求隨機數
        uint256 vrfFee = IVRFManager(vrfManager).vrfRequestPrice();
        require(msg.value >= vrfFee, "Insufficient VRF fee");
        
        // 儲存升級數據
        bytes memory upgradeData = abi.encode(
            tokenIds,
            materialTokenId,
            successRate,
            baseRarity
        );
        
        uint256 requestId = IVRFManager(vrfManager).requestRandomness{
            value: vrfFee
        }(
            IVRFManager.RequestType.ALTAR_UPGRADE,
            1, // 只需要一個隨機數
            upgradeData
        );
        
        activeUpgradeRequest[msg.sender] = requestId;
        
        // 暫時鎖定 NFT（可選）
        for (uint256 i = 0; i < tokenIds.length; i++) {
            // 記錄鎖定狀態
            lockedTokens[tokenIds[i]] = true;
        }
        
        emit UpgradeRequested(msg.sender, tokenIds, materialTokenId, requestId);
        return;
    }
    // ===== VRF 改動結束 =====
    
    // 原有的升級邏輯（作為備用）
    _performUpgrade(msg.sender, tokenIds, materialTokenId, successRate, baseRarity);
}

// ========== 3. 新增 VRF 回調處理 ==========
function onVRFFulfilled(
    uint256 requestId,
    uint256[] memory randomWords
) external {
    require(msg.sender == vrfManager, "Only VRF Manager");
    
    // 解碼升級數據
    IVRFManager.RandomRequest memory request = IVRFManager(vrfManager).requests(requestId);
    (
        uint256[] memory tokenIds,
        uint256 materialTokenId,
        uint256 successRate,
        uint8 baseRarity
    ) = abi.decode(request.data, (uint256[], uint256, uint256, uint8));
    
    // 使用 VRF 隨機數判斷成功
    bool success = (randomWords[0] % 10000) < successRate;
    
    address user = _getUserFromRequest(requestId); // 需要追蹤
    
    if (success) {
        _performSuccessfulUpgrade(user, tokenIds, materialTokenId, baseRarity);
    } else {
        _performFailedUpgrade(user, tokenIds, materialTokenId);
    }
    
    // 清理
    delete activeUpgradeRequest[user];
    
    // 解鎖 NFT
    for (uint256 i = 0; i < tokenIds.length; i++) {
        lockedTokens[tokenIds[i]] = false;
    }
}

// ========== 4. 升級邏輯分離 ==========
function _performSuccessfulUpgrade(
    address user,
    uint256[] memory tokenIds,
    uint256 materialTokenId,
    uint8 baseRarity
) internal {
    IHero hero = IHero(heroContract);
    
    // 燒毀犧牲的英雄
    for (uint256 i = 1; i < tokenIds.length; i++) {
        hero.burn(tokenIds[i]);
    }
    
    // 燒毀材料（如果使用）
    if (materialTokenId > 0) {
        IRelic(relicContract).burn(materialTokenId);
    }
    
    // 升級主英雄
    uint8 newRarity = baseRarity + 1;
    hero.upgradeRarity(tokenIds[0], newRarity);
    
    emit UpgradeSuccessful(user, tokenIds[0], baseRarity, newRarity);
}

function _performFailedUpgrade(
    address user,
    uint256[] memory tokenIds,
    uint256 materialTokenId
) internal {
    // 失敗只消耗材料，不消耗英雄
    if (materialTokenId > 0) {
        IRelic(relicContract).burn(materialTokenId);
    }
    
    emit UpgradeFailed(user, tokenIds[0]);
}

// ========== 5. 管理函數 ==========
function setVRFManager(address _vrfManager) external onlyOwner {
    vrfManager = _vrfManager;
    
    if (_vrfManager != address(0)) {
        IVRFManager(_vrfManager).authorizeContract(address(this));
    }
}

// ========== 6. 緊急函數 ==========
function emergencyUnlock(uint256[] memory tokenIds) external onlyOwner {
    // 緊急情況下解鎖 NFT
    for (uint256 i = 0; i < tokenIds.length; i++) {
        lockedTokens[tokenIds[i]] = false;
    }
}

// ========== 7. 添加接口定義 ==========
interface IVRFManager {
    enum RequestType { HERO_MINT, RELIC_MINT, ALTAR_UPGRADE, DUNGEON_EXPLORE }
    
    struct RandomRequest {
        address requester;
        RequestType requestType;
        bytes data;
        bool fulfilled;
        uint256[] randomWords;
    }
    
    function vrfRequestPrice() external view returns (uint256);
    function requestRandomness(RequestType requestType, uint32 numWords, bytes calldata data) 
        external payable returns (uint256);
    function requests(uint256) external view returns (RandomRequest memory);
    function authorizeContract(address contract_) external;
}

/**
 * 總結：
 * - 總改動行數：約 50-60 行
 * - 升級過程變成異步（請求 -> VRF -> 執行）
 * - NFT 在升級期間被鎖定
 * - 完全公平的隨機結果
 * - 保留原有邏輯作為備用
 */
// DungeonMaster_VRF_Patch.sol - 展示 DungeonMaster.sol 的最小改動
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DungeonMaster.sol 的 VRF 改動指南
 * @notice 地城探索使用 VRF 確保戰鬥結果公平
 */

// ========== 1. 添加 VRFManager 引用 ==========
// 在 DungeonMaster.sol 的狀態變量區域添加：
/*
    address public vrfManager; // 新增：VRF 管理器地址
    mapping(uint256 => PendingExploration) public pendingExplorations; // requestId => 探索數據
    mapping(address => uint256) public activeExploration; // 用戶 => requestId
    
    struct PendingExploration {
        address player;
        uint256 partyId;
        uint256[] heroIds;
        uint256 floor;
        uint256 totalPower;
        uint256 timestamp;
        bool fulfilled;
    }
*/

// ========== 2. 修改 explore 函數 ==========
function explore(
    uint256 partyId,
    uint256[] memory heroIds,
    uint256 floor
) external payable nonReentrant whenNotPaused {
    require(activeExploration[msg.sender] == 0, "Pending exploration");
    require(floor > 0 && floor <= 100, "Invalid floor");
    
    // 驗證隊伍和英雄
    require(IParty(partyContract).ownerOf(partyId) == msg.sender, "Not party owner");
    require(heroIds.length >= 3 && heroIds.length <= 5, "Invalid team size");
    
    // 計算總戰力
    uint256 totalPower = 0;
    for (uint256 i = 0; i < heroIds.length; i++) {
        require(IHero(heroContract).ownerOf(heroIds[i]) == msg.sender, "Not hero owner");
        totalPower += IHero(heroContract).getHeroData(heroIds[i]).power;
    }
    
    // 檢查探索費用
    uint256 explorationFee = calculateExplorationFee(floor);
    
    // ===== VRF 改動開始 =====
    if (vrfManager != address(0)) {
        uint256 vrfFee = IVRFManager(vrfManager).vrfRequestPrice();
        require(msg.value >= explorationFee + vrfFee, "Insufficient payment");
        
        // 編碼探索數據
        bytes memory explorationData = abi.encode(
            msg.sender,
            partyId,
            heroIds,
            floor,
            totalPower
        );
        
        // 請求 VRF（需要 3 個隨機數：戰鬥結果、獎勵類型、獎勵數量）
        uint256 requestId = IVRFManager(vrfManager).requestRandomness{
            value: vrfFee
        }(
            IVRFManager.RequestType.DUNGEON_EXPLORE,
            3,
            explorationData
        );
        
        // 記錄探索
        pendingExplorations[requestId] = PendingExploration({
            player: msg.sender,
            partyId: partyId,
            heroIds: heroIds,
            floor: floor,
            totalPower: totalPower,
            timestamp: block.timestamp,
            fulfilled: false
        });
        
        activeExploration[msg.sender] = requestId;
        
        // 鎖定英雄（避免重複使用）
        for (uint256 i = 0; i < heroIds.length; i++) {
            heroInExploration[heroIds[i]] = true;
        }
        
        emit ExplorationStarted(msg.sender, requestId, partyId, floor);
        return;
    }
    // ===== VRF 改動結束 =====
    
    // 原有的探索邏輯（作為備用）
    _performExploration(msg.sender, partyId, heroIds, floor, totalPower);
}

// ========== 3. VRF 回調處理 ==========
function onVRFFulfilled(
    uint256 requestId,
    uint256[] memory randomWords
) external {
    require(msg.sender == vrfManager, "Only VRF Manager");
    
    PendingExploration storage exploration = pendingExplorations[requestId];
    require(!exploration.fulfilled, "Already fulfilled");
    
    // 使用 VRF 隨機數決定結果
    bool success = _calculateBattleResult(
        exploration.totalPower,
        exploration.floor,
        randomWords[0]
    );
    
    if (success) {
        // 生成獎勵
        (uint256 rewardType, uint256 rewardAmount) = _generateRewards(
            exploration.floor,
            randomWords[1],
            randomWords[2]
        );
        
        _distributeRewards(
            exploration.player,
            rewardType,
            rewardAmount
        );
        
        // 記錄成功
        _recordSuccess(exploration.player, exploration.floor);
        
        emit ExplorationSuccessful(
            exploration.player,
            exploration.partyId,
            exploration.floor,
            rewardType,
            rewardAmount
        );
    } else {
        emit ExplorationFailed(
            exploration.player,
            exploration.partyId,
            exploration.floor
        );
    }
    
    // 解鎖英雄
    for (uint256 i = 0; i < exploration.heroIds.length; i++) {
        heroInExploration[exploration.heroIds[i]] = false;
    }
    
    // 清理
    exploration.fulfilled = true;
    delete activeExploration[exploration.player];
}

// ========== 4. 戰鬥計算 ==========
function _calculateBattleResult(
    uint256 totalPower,
    uint256 floor,
    uint256 randomSeed
) internal pure returns (bool) {
    // 樓層越高，難度越大
    uint256 requiredPower = floor * 100;
    uint256 successChance = (totalPower * 100) / requiredPower;
    
    if (successChance > 95) successChance = 95; // 最高 95% 成功率
    if (successChance < 5) successChance = 5;   // 最低 5% 成功率
    
    return (randomSeed % 100) < successChance;
}

// ========== 5. 獎勵生成 ==========
function _generateRewards(
    uint256 floor,
    uint256 typeSeed,
    uint256 amountSeed
) internal pure returns (uint256 rewardType, uint256 rewardAmount) {
    // 獎勵類型：0=SoulShard, 1=經驗, 2=特殊物品
    rewardType = typeSeed % 3;
    
    // 基礎獎勵 = 樓層 * 10
    uint256 baseReward = floor * 10;
    
    // 隨機範圍 50% - 150%
    uint256 variance = 50 + (amountSeed % 101);
    rewardAmount = (baseReward * variance) / 100;
}

// ========== 6. 查詢函數 ==========
function getPendingExploration(address player) external view returns (
    uint256 requestId,
    uint256 floor,
    uint256 timestamp,
    bool isReady
) {
    requestId = activeExploration[player];
    if (requestId == 0) return (0, 0, 0, false);
    
    PendingExploration memory exploration = pendingExplorations[requestId];
    return (
        requestId,
        exploration.floor,
        exploration.timestamp,
        exploration.fulfilled
    );
}

// ========== 7. 管理函數 ==========
function setVRFManager(address _vrfManager) external onlyOwner {
    vrfManager = _vrfManager;
    
    if (_vrfManager != address(0)) {
        IVRFManager(_vrfManager).authorizeContract(address(this));
    }
}

// ========== 8. 緊急函數 ==========
function emergencyCancelExploration(address player) external onlyOwner {
    uint256 requestId = activeExploration[player];
    require(requestId > 0, "No active exploration");
    
    PendingExploration storage exploration = pendingExplorations[requestId];
    
    // 解鎖英雄
    for (uint256 i = 0; i < exploration.heroIds.length; i++) {
        heroInExploration[exploration.heroIds[i]] = false;
    }
    
    // 清理
    exploration.fulfilled = true;
    delete activeExploration[player];
    
    emit ExplorationCancelled(player, requestId);
}

/**
 * 總結：
 * - 總改動行數：約 70-80 行
 * - 探索變成異步過程
 * - 戰鬥結果完全公平
 * - 獎勵隨機但可驗證
 * - 英雄在探索期間被鎖定
 */
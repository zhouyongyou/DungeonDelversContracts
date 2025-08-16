// DungeonMaster_minimal.sol - 最小化改動版本（移除複雜退款機制）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/interfaces.sol";

contract DungeonMaster is Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    
    // --- 狀態變數 ---
    IDungeonCore public dungeonCore;
    IDungeonStorage public dungeonStorage;
    IERC20 public soulShardToken;
    
    // === VRF 相關 ===
    address public vrfManager;
    
    // 遊戲設定
    uint256 public globalRewardMultiplier = 1000; // 1000 = 100%
    uint256 public explorationFee = 0.0015 ether;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    // 定義與 DungeonStorage 匹配的結構
    struct PartyStatus {
        uint256 cooldownEndsAt;
        uint256 unclaimedRewards;
    }

    struct Dungeon {
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
        bool isInitialized;
    }

    struct ExpeditionRequest {
        uint256 partyId;
        uint256 dungeonId;
        address player;
        bool fulfilled;
        uint256 payment;
    }
    
    mapping(address => ExpeditionRequest) public userRequests;

    // --- 事件 ---
    event ExpeditionFulfilled(address indexed player, uint256 indexed partyId, bool success, uint256 reward, uint256 expGained);
    event RewardsBanked(address indexed user, uint256 indexed partyId, uint256 amount);
    event DungeonCoreSet(address indexed newAddress);
    event DungeonStorageSet(address indexed newAddress);
    event SoulShardTokenSet(address indexed newAddress);
    event DungeonSet(uint256 indexed dungeonId, uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate);
    event ExpeditionRequested(address indexed player, uint256 partyId, uint256 dungeonId);
    event ExpeditionRevealed(address indexed player, uint256 partyId, bool success);
    event RevealedByProxy(address indexed user, address indexed proxy);
    // === VRF 事件 ===
    event VRFManagerSet(address indexed vrfManager);
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomWordsCount);

    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    // --- 核心遊戲邏輯 ---

    // === VRF 整合的探索請求函數（最小化版本）===
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) 
        external payable nonReentrant whenNotPaused
    {
        require(userRequests[msg.sender].player == address(0) || userRequests[msg.sender].fulfilled, "DM: Previous expedition pending");
        
        // 檢查是否為隊伍擁有者
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DM: Not party owner");
        
        require(address(dungeonCore) != address(0) && address(dungeonStorage) != address(0), "DM: Core contracts not set");
        
        // 驗證地城和隊伍狀態
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        PartyStatus memory partyStatus = _getPartyStatus(_partyId);

        require(dungeon.isInitialized, "DM: Dungeon DNE");
        require(block.timestamp >= partyStatus.cooldownEndsAt, "DM: Party on cooldown");
        
        // 檢查隊伍戰力
        (uint256 totalPower, ) = partyContract.getPartyComposition(_partyId);
        require(totalPower >= dungeon.requiredPower, "DM: Power too low");

        // 🎯 最小化改動：嚴格費用檢查，無退款邏輯
        require(msg.value == explorationFee, "DM: Exact payment required");

        // 立即設置冷卻（防止重複使用）
        partyStatus.cooldownEndsAt = block.timestamp + COOLDOWN_PERIOD;
        _setPartyStatus(_partyId, partyStatus);
        
        if (vrfManager != address(0)) {
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _partyId, _dungeonId));
            
            // 🎯 VRF 調用無需傳遞 ETH（訂閱模式）
            IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                1, // 只需要一個隨機數用於探索結果
                1, // maxRarity 對探索無意義，設為1
                requestData
            );
            
            userRequests[msg.sender] = ExpeditionRequest({
                partyId: _partyId,
                dungeonId: _dungeonId,
                player: msg.sender,
                fulfilled: false,
                payment: msg.value
            });
            
            // 🎯 無退款邏輯 - 用戶已支付確切金額
            
            emit ExpeditionRequested(msg.sender, _partyId, _dungeonId);
            return;
        }
        // ===== VRF 改動結束 =====
        
        // VRF 不可用時直接失敗
        revert("DM: VRF required for expeditions");
    }
    
    // === VRF 整合的揭示函數 ===
    function revealExpedition() external nonReentrant whenNotPaused {
        _revealExpeditionFor(msg.sender);
    }
    
    function revealExpeditionFor(address user) external nonReentrant whenNotPaused {
        _revealExpeditionFor(user);
        
        // 如果是代理揭示，發出特殊事件
        if (msg.sender != user) {
            emit RevealedByProxy(user, msg.sender);
        }
    }
    
    // 內部揭示邏輯
    function _revealExpeditionFor(address user) private {
        ExpeditionRequest storage request = userRequests[user];
        require(request.player != address(0), "DM: No pending expedition");
        require(!request.fulfilled, "DM: Already revealed");
        
        // VRF-only 模式
        require(vrfManager != address(0), "DM: VRF Manager not set");
        
        // 檢查 VRF 是否完成
        (bool vrfFulfilled, uint256[] memory randomWords) = IVRFManager(vrfManager).getRandomForUser(user);
        require(vrfFulfilled && randomWords.length > 0, "DM: VRF not ready");
        
        // 使用 VRF 隨機數
        _executeRevealWithVRF(user, randomWords[0]);
    }
    
    // === VRF 揭示函數 ===
    function _executeRevealWithVRF(address user, uint256 randomWord) private {
        ExpeditionRequest storage request = userRequests[user];
        request.fulfilled = true;
        
        // 再次驗證隊伍所有權（防止在等待期間轉移）
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(request.partyId) == request.player, "DM: No longer party owner");
        
        // 使用 VRF 隨機數處理探索結果
        _processExpeditionResultWithVRF(
            request.player,
            request.partyId,
            request.dungeonId,
            randomWord
        );
        
        // 清理請求
        delete userRequests[user];
    }

    // === VRF 結果處理 ===
    function _processExpeditionResultWithVRF(address _requester, uint256 _partyId, uint256 _dungeonId, uint256 _randomWord) private {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        uint8 vipBonus = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_requester) returns (uint8 level) { vipBonus = level; } catch {}
        uint256 finalSuccessRate = dungeon.baseSuccessRate + vipBonus;
        if (finalSuccessRate > 100) finalSuccessRate = 100;

        // 使用 VRF 隨機數生成結果
        uint256 randomValue = _randomWord % 100;
        bool success = randomValue < finalSuccessRate;

        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(_requester, _dungeonId, success);
        
        emit ExpeditionFulfilled(_requester, _partyId, success, reward, expGained);
        emit ExpeditionRevealed(_requester, _partyId, success);
    }
    
    
    function _handleExpeditionOutcome(address _player, uint256 _dungeonId, bool _success) private returns (uint256 reward, uint256 expGained) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        if (_success) {
            uint256 soulShardReward = dungeonCore.getSoulShardAmountForUSD(dungeon.rewardAmountUSD);
            soulShardReward = (soulShardReward * globalRewardMultiplier) / 1000;
            
            if (soulShardReward > 0) {
                // 直接記帳到 PlayerVault
                IPlayerVault playerVault = IPlayerVault(dungeonCore.playerVaultAddress());
                playerVault.deposit(_player, soulShardReward);
                reward = soulShardReward;
            }
            
            expGained = dungeon.requiredPower / 10;
        } else {
            expGained = dungeon.requiredPower / 20;
        }
        
        try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_player, expGained) {} catch {}
    }

    // 內部輔助函數
    function _getPartyStatus(uint256 _partyId) private view returns (PartyStatus memory) {
        (uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel) = 
            IDungeonStorage(dungeonStorage).partyStatuses(_partyId);
        
        return PartyStatus({
            cooldownEndsAt: cooldownEndsAt,
            unclaimedRewards: unclaimedRewards
        });
    }

    function _setPartyStatus(uint256 _partyId, PartyStatus memory _status) private {
        (uint256 provisionsRemaining, , , uint8 fatigueLevel) = 
            IDungeonStorage(dungeonStorage).partyStatuses(_partyId);
        
        IDungeonStorage(dungeonStorage).setPartyStatus(_partyId, IDungeonStorage.PartyStatus({
            provisionsRemaining: provisionsRemaining,
            cooldownEndsAt: _status.cooldownEndsAt,
            unclaimedRewards: _status.unclaimedRewards,
            fatigueLevel: fatigueLevel
        }));
    }

    function _getDungeon(uint256 _dungeonId) private view returns (Dungeon memory) {
        (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) = 
            IDungeonStorage(dungeonStorage).dungeons(_dungeonId);
        
        return Dungeon({
            requiredPower: requiredPower,
            rewardAmountUSD: rewardAmountUSD,
            baseSuccessRate: baseSuccessRate,
            isInitialized: isInitialized
        });
    }

    // 獎勵領取函數
    function claimRewards(uint256 _partyId) external view {
        revert("DM: Rewards are automatically deposited to PlayerVault");
    }

    // === 查詢函數 ===
    function getUserRequest(address _user) external view returns (ExpeditionRequest memory) {
        return userRequests[_user];
    }


    // === VRF 管理函數 ===
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = _vrfManager;
        
        // 注意：需要 VRFManager 的 owner 手動授權此合約
        // 不再自動調用 authorizeContract，避免權限錯誤
        
        emit VRFManagerSet(_vrfManager);
    }
    
    // 查詢探索所需的總費用（簡化版本）
    function getExpeditionCost() external view returns (uint256 totalCost, uint256 explorationFeeAmount, uint256 vrfFeeAmount) {
        explorationFeeAmount = explorationFee;
        vrfFeeAmount = 0; // VRF 訂閱模式下費用為 0
        totalCost = explorationFeeAmount; // 總費用就是探索費
    }

    // --- 管理函數 ---
    function setDungeonCore(address _newAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_newAddress);
        emit DungeonCoreSet(_newAddress);
    }

    function setDungeonStorage(address _newAddress) external onlyOwner {
        dungeonStorage = IDungeonStorage(_newAddress);
        emit DungeonStorageSet(_newAddress);
    }

    function setSoulShardToken(address _newAddress) external onlyOwner {
        soulShardToken = IERC20(_newAddress);
        emit SoulShardTokenSet(_newAddress);
    }


    function setGlobalRewardMultiplier(uint256 _newMultiplier) external onlyOwner {
        globalRewardMultiplier = _newMultiplier;
    }

    function setExplorationFee(uint256 _newFee) external onlyOwner {
        explorationFee = _newFee;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // 🎯 簡化的資金提取（無需保護退款資金）
    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "DM: Native withdraw failed");
    }

    function withdrawSoulShard() external onlyOwner {
        require(address(soulShardToken) != address(0), "DM: SoulShard token not set");
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) {
            soulShardToken.safeTransfer(owner(), balance);
        }
    }

    function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external onlyOwner {
        require(_baseSuccessRate <= 100, "DM: Success rate > 100");
        IDungeonStorage.Dungeon memory dungeonData = IDungeonStorage.Dungeon({
            requiredPower: _requiredPower,
            rewardAmountUSD: _rewardAmountUSD,
            baseSuccessRate: _baseSuccessRate,
            isInitialized: true
        });
        dungeonStorage.setDungeon(_dungeonId, dungeonData);
        emit DungeonSet(_dungeonId, _requiredPower, _rewardAmountUSD, _baseSuccessRate);
    }

    // --- 查詢函數 ---
    function getPartyStatus(uint256 _partyId) external view returns (uint256 cooldownEndsAt, uint256 unclaimedRewards) {
        PartyStatus memory status = _getPartyStatus(_partyId);
        return (status.cooldownEndsAt, status.unclaimedRewards);
    }
    
    function getDungeon(uint256 _dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        return (dungeon.requiredPower, dungeon.rewardAmountUSD, dungeon.baseSuccessRate, dungeon.isInitialized);
    }

    // === 🎯 安全的 VRF 回調實現 ===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 🎯 使用 return 而非 require，避免卡死 VRF 系統
        if (msg.sender != vrfManager) return;
        if (randomWords.length == 0) return;
        
        // 註意：DungeonMaster 使用輪詢方式處理 VRF 結果
        // 這個回調主要用於記錄和驗證，實際處理在 revealExpedition 中進行
        // 可以在這裡添加額外的驗證邏輯或事件記錄
        
        // 發出 VRF 完成事件以便前端監聽
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }
}
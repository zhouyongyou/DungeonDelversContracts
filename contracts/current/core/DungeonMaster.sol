// DungeonMaster_fixed.sol - 增強錯誤處理和一致性改進
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
    mapping(uint256 => address) public requestIdToUser; // requestId => user
    
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
    // 🔧 新增：錯誤處理事件
    event ExpeditionProcessingError(address indexed user, uint256 requestId, string reason);

    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    // --- 核心遊戲邏輯 ---

    // === VRF 整合的探索請求函數（標準回調版本）===
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) 
        external payable nonReentrant whenNotPaused
    {
        require(userRequests[msg.sender].player == address(0) || userRequests[msg.sender].fulfilled, "DungeonMaster: Previous expedition request still pending");
        
        // 檢查是否為隊伍擁有者
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DungeonMaster: Caller is not the party owner");
        
        require(address(dungeonCore) != address(0) && address(dungeonStorage) != address(0), "DungeonMaster: Core contracts not properly configured");
        
        // 驗證地城和隊伍狀態
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        PartyStatus memory partyStatus = _getPartyStatus(_partyId);

        require(dungeon.isInitialized, "DungeonMaster: Dungeon does not exist or not initialized");
        require(block.timestamp >= partyStatus.cooldownEndsAt, "DungeonMaster: Party is still on cooldown period");
        
        // 檢查隊伍戰力
        (uint256 totalPower, ) = partyContract.getPartyComposition(_partyId);
        require(totalPower >= dungeon.requiredPower, "DungeonMaster: Party power insufficient for this dungeon");

        // 🎯 嚴格費用檢查，無退款邏輯
        require(msg.value == explorationFee, "DungeonMaster: Exact exploration fee payment required");

        // 立即設置冷卻（防止重複使用）
        partyStatus.cooldownEndsAt = block.timestamp + COOLDOWN_PERIOD;
        _setPartyStatus(_partyId, partyStatus);
        
        if (vrfManager != address(0)) {
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _partyId, _dungeonId));
            
            // 🎯 VRF 調用無需傳遞 ETH（訂閱模式）
            uint256 requestId = IVRFManager(vrfManager).requestRandomForUser{value: 0}(
                msg.sender,
                1, // 只需要一個隨機數用於探索結果
                1, // maxRarity 對探索無意義，設為1
                requestData
            );
            
            // 🎯 記錄 requestId 對應的用戶（標準回調需要）
            requestIdToUser[requestId] = msg.sender;
            
            userRequests[msg.sender] = ExpeditionRequest({
                partyId: _partyId,
                dungeonId: _dungeonId,
                player: msg.sender,
                fulfilled: false,
                payment: msg.value
            });
            
            emit ExpeditionRequested(msg.sender, _partyId, _dungeonId);
            return;
        }
        
        // VRF 不可用時直接失敗
        revert("DungeonMaster: VRF required for expeditions");
    }
    
    // === 🎯 標準 VRF 回調實現（最小修復版本）===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 🎯 安全性改進：使用 return 而非 require，避免卡死 VRF 系統
        if (msg.sender != vrfManager) return;
        if (randomWords.length == 0) return;
        
        // 🎯 標準回調模式：直接在回調中處理業務邏輯
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        ExpeditionRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // 🔧 最小修復：直接處理，移除 try-catch 複雜度
        _processExpeditionWithVRF(user, request, randomWords[0]);
        
        // 🎯 關鍵修復：清理數據始終在處理邏輯之後執行
        delete requestIdToUser[requestId];
        delete userRequests[user];
        
        // 發出 VRF 完成事件以便前端監聽
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }

    // === VRF 結果處理（優化版本）===
    function _processExpeditionWithVRF(
        address user, 
        ExpeditionRequest storage request, 
        uint256 randomWord
    ) private {
        // 🔧 修復：先執行所有處理邏輯，最後才設置 fulfilled
        
        // 驗證隊伍所有權（防止在等待期間轉移） - 使用安全檢查
        address partyOwner = address(0);
        try IParty(dungeonCore.partyContractAddress()).ownerOf(request.partyId) returns (address owner) {
            partyOwner = owner;
        } catch {
            // 如果調用失敗，當作隊伍已轉移處理
            emit ExpeditionFulfilled(request.player, request.partyId, false, 0, 0);
            emit ExpeditionProcessingError(user, 0, "Party contract call failed");
            request.fulfilled = true;
            return;
        }
        
        if (partyOwner != request.player) {
            // 如果隊伍已轉移，探索失敗但不回滾狀態
            emit ExpeditionFulfilled(request.player, request.partyId, false, 0, 0);
            request.fulfilled = true;
            return;
        }
        
        // 使用 VRF 隨機數處理探索結果
        Dungeon memory dungeon = _getDungeon(request.dungeonId);
        
        uint8 vipBonus = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(request.player) returns (uint8 level) { 
            vipBonus = level; 
        } catch {
            // VIP 查詢失敗時使用 0 加成
        }
        
        uint256 finalSuccessRate = dungeon.baseSuccessRate + vipBonus;
        if (finalSuccessRate > 100) finalSuccessRate = 100;

        // 使用 VRF 隨機數生成結果
        uint256 randomValue = randomWord % 100;
        bool success = randomValue < finalSuccessRate;

        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(request.player, request.dungeonId, success);
        
        emit ExpeditionFulfilled(request.player, request.partyId, success, reward, expGained);
        emit ExpeditionRevealed(request.player, request.partyId, success);
        
        // 🔧 關鍵修復：所有處理完成後才設置 fulfilled
        request.fulfilled = true;
    }
    
    function _handleExpeditionOutcome(address _player, uint256 _dungeonId, bool _success) private returns (uint256 reward, uint256 expGained) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        if (_success) {
            // 🔧 增強：依賴調用保護
            uint256 soulShardReward;
            try dungeonCore.getSoulShardAmountForUSD(dungeon.rewardAmountUSD) returns (uint256 baseReward) {
                soulShardReward = (baseReward * globalRewardMultiplier) / 1000;
            } catch {
                // Oracle 失敗時給予固定獎勵
                soulShardReward = 0;
                emit ExpeditionProcessingError(_player, 0, "Oracle price unavailable - no reward given");
            }
            
            if (soulShardReward > 0) {
                // 直接記帳到 PlayerVault - 增強錯誤處理
                try IPlayerVault(dungeonCore.playerVaultAddress()).deposit(_player, soulShardReward) {
                    reward = soulShardReward;
                } catch {
                    // Vault 存款失敗，記錄錯誤
                    reward = 0;
                    emit ExpeditionProcessingError(_player, 0, "Vault deposit failed - reward lost");
                }
            }
            
            expGained = dungeon.requiredPower / 10;
        } else {
            expGained = dungeon.requiredPower / 20;
        }
        
        // 🔧 增強：經驗值添加保護
        try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_player, expGained) {
            // 成功
        } catch {
            // 經驗值添加失敗，記錄但不影響探索結果
            emit ExpeditionProcessingError(_player, 0, "Experience gain failed");
        }
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
        revert("DungeonMaster: Rewards are automatically deposited to PlayerVault");
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

    // 🔧 新增：緊急清理用戶請求
    function emergencyCleanupUser(address user) external onlyOwner {
        ExpeditionRequest storage request = userRequests[user];
        require(request.player != address(0), "DungeonMaster: No pending request");
        
        // 清理數據
        delete userRequests[user];
        
        emit ExpeditionProcessingError(user, 0, "Emergency cleanup by admin");
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
        require(success, "DungeonMaster: Native token withdrawal failed");
    }

    function withdrawSoulShard() external onlyOwner {
        require(address(soulShardToken) != address(0), "DungeonMaster: SoulShard token contract not configured");
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) {
            soulShardToken.safeTransfer(owner(), balance);
        }
    }

    function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external onlyOwner {
        require(_baseSuccessRate <= 100, "DungeonMaster: Success rate cannot exceed 100%");
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
}
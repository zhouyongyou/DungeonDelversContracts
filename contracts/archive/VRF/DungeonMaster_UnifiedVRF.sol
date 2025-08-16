// DungeonMaster_UnifiedVRF.sol - 統一使用 VRF 的地城探索系統
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/interfaces.sol";

// Chainlink VRF v2.5 imports
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract DungeonMaster_UnifiedVRF is 
    Ownable, 
    ReentrancyGuard, 
    Pausable, 
    VRFV2PlusWrapperConsumerBase, 
    ConfirmedOwner 
{
    using SafeERC20 for IERC20;
    
    IDungeonCore public dungeonCore;
    IDungeonStorage public dungeonStorage;
    IERC20 public soulShardToken;
    LinkTokenInterface public LINKTOKEN;
    
    uint256 public dynamicSeed;

    // 遊戲設定
    uint256 public globalRewardMultiplier = 1000; // 1000 = 100%
    uint256 public explorationFee = 0.0015 ether;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    // VRF 配置
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 200000;
    uint32 public numWords = 1;
    bool public useNativePayment = true;

    // 結構定義
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

    // VRF 請求追蹤
    struct PendingExpedition {
        address player;
        uint256 partyId;
        uint256 dungeonId;
        uint256 timestamp;
        bool fulfilled;
        uint256 vrfFee;
        uint8 vipLevel;
        uint256 finalSuccessRate;
    }
    
    mapping(uint256 => PendingExpedition) public pendingExpeditions;
    mapping(uint256 => bool) public requestIdToWaiting;

    // 事件
    event ExpeditionRequested(
        uint256 indexed requestId,
        address indexed player,
        uint256 indexed partyId,
        uint256 dungeonId,
        uint256 vrfFee,
        uint8 vipLevel
    );
    
    event ExpeditionFulfilled(
        uint256 indexed requestId,
        address indexed player, 
        uint256 indexed partyId, 
        bool success, 
        uint256 reward, 
        uint256 expGained
    );
    
    event VRFExpeditionFulfilled(uint256 indexed requestId, uint256 randomness);
    event DynamicSeedUpdated(uint256 newSeed);
    event DungeonCoreSet(address indexed newAddress);
    event DungeonStorageSet(address indexed newAddress);
    event SoulShardTokenSet(address indexed newAddress);
    event DungeonSet(uint256 indexed dungeonId, uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate);
    event VRFConfigUpdated(uint16 confirmations, uint32 gasLimit, bool useNative);

    constructor(
        address _initialOwner,
        address _wrapperAddress,
        address _linkToken
    ) 
        Ownable(_initialOwner) 
        VRFV2PlusWrapperConsumerBase(_wrapperAddress)
        ConfirmedOwner(_initialOwner) 
    {
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        LINKTOKEN = LinkTokenInterface(_linkToken);
    }
    
    // 統一 VRF 探索函數
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) 
        external payable nonReentrant whenNotPaused
    {
        // 基本驗證
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DM: Not party owner");
        require(address(dungeonCore) != address(0) && address(dungeonStorage) != address(0), "DM: Core contracts not set");
        
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        PartyStatus memory partyStatus = _getPartyStatus(_partyId);

        require(dungeon.isInitialized, "DM: Dungeon DNE");
        require(block.timestamp >= partyStatus.cooldownEndsAt, "DM: Party on cooldown");
        
        (uint256 totalPower, ) = partyContract.getPartyComposition(_partyId);
        require(totalPower >= dungeon.requiredPower, "DM: Power too low");

        // 計算總費用 (包含 VRF)
        uint256 vrfFee = getVRFFee();
        uint256 totalCost = explorationFee + vrfFee;
        require(msg.value >= totalCost, "DM: Insufficient payment for VRF");

        // 更新冷卻時間
        partyStatus.cooldownEndsAt = block.timestamp + COOLDOWN_PERIOD;
        _setPartyStatus(_partyId, partyStatus);
        
        _requestVRFExpedition(msg.sender, _partyId, _dungeonId);
    }

    // 請求 VRF 隨機數
    function _requestVRFExpedition(address _player, uint256 _partyId, uint256 _dungeonId) private {
        uint256 requestId;
        uint256 vrfFee;
        
        if (useNativePayment) {
            VRFV2PlusClient.ExtraArgsV1 memory extraArgs = VRFV2PlusClient.ExtraArgsV1({
                nativePayment: true
            });
            
            bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(extraArgs);
            
            (requestId, vrfFee) = requestRandomnessPayInNative(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgsBytes
            );
        } else {
            VRFV2PlusClient.ExtraArgsV1 memory extraArgs = VRFV2PlusClient.ExtraArgsV1({
                nativePayment: false
            });
            
            bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(extraArgs);
            
            (requestId, vrfFee) = requestRandomness(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgsBytes
            );
        }
        
        // 預先計算 VIP 加成
        uint8 vipLevel = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player) returns (uint8 level) { 
            vipLevel = level; 
        } catch {}
        
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        uint256 finalSuccessRate = dungeon.baseSuccessRate + vipLevel;
        if (finalSuccessRate > 100) finalSuccessRate = 100;
        
        requestIdToWaiting[requestId] = true;
        pendingExpeditions[requestId] = PendingExpedition({
            player: _player,
            partyId: _partyId,
            dungeonId: _dungeonId,
            timestamp: block.timestamp,
            fulfilled: false,
            vrfFee: vrfFee,
            vipLevel: vipLevel,
            finalSuccessRate: finalSuccessRate
        });
        
        emit ExpeditionRequested(requestId, _player, _partyId, _dungeonId, vrfFee, vipLevel);
    }

    // VRF 回調函數
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
        internal 
        override 
    {
        require(requestIdToWaiting[requestId], "Request not found or already fulfilled");
        
        uint256 randomness = randomWords[0];
        requestIdToWaiting[requestId] = false;
        pendingExpeditions[requestId].fulfilled = true;
        
        _processVRFExpeditionResult(requestId, randomness);
        
        emit VRFExpeditionFulfilled(requestId, randomness);
    }

    // 處理 VRF 探索結果
    function _processVRFExpeditionResult(uint256 _requestId, uint256 _randomness) private {
        PendingExpedition memory expedition = pendingExpeditions[_requestId];
        
        // 使用 VRF 隨機數判斷成功失敗
        uint256 randomValue = _randomness % 100;
        bool success = randomValue < expedition.finalSuccessRate;

        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(
            expedition.player, 
            expedition.dungeonId, 
            success
        );
        
        emit ExpeditionFulfilled(_requestId, expedition.player, expedition.partyId, success, reward, expGained);
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _randomness)));
        emit DynamicSeedUpdated(dynamicSeed);
    }

    function _handleExpeditionOutcome(address _player, uint256 _dungeonId, bool _success) private returns (uint256 reward, uint256 expGained) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        if (_success) {
            uint256 soulShardReward = dungeonCore.getSoulShardAmountForUSD(dungeon.rewardAmountUSD);
            soulShardReward = (soulShardReward * globalRewardMultiplier) / 1000;
            
            if (soulShardReward > 0) {
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

    // 取消過期的 VRF 請求
    function cancelExpiredVRFRequest(uint256 requestId) external {
        PendingExpedition storage expedition = pendingExpeditions[requestId];
        require(expedition.player == msg.sender, "Not your request");
        require(!expedition.fulfilled, "Already fulfilled");
        require(block.timestamp > expedition.timestamp + 2 hours, "Request not expired");
        
        requestIdToWaiting[requestId] = false;
        expedition.fulfilled = true;
        
        // 重置冷卻時間作為補償
        PartyStatus memory partyStatus = _getPartyStatus(expedition.partyId);
        partyStatus.cooldownEndsAt = block.timestamp;
        _setPartyStatus(expedition.partyId, partyStatus);
        
        // 如果使用 LINK 支付且有剩餘，可以退款
        if (!useNativePayment && expedition.vrfFee > 0) {
            LINKTOKEN.transfer(msg.sender, expedition.vrfFee);
        }
    }

    // 緊急探索 (Owner 專用，不使用 VRF)
    function emergencyExpedition(
        address _player,
        uint256 _partyId,
        uint256 _dungeonId,
        bool _forceSuccess
    ) external onlyOwner {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        require(dungeon.isInitialized, "DM: Dungeon DNE");
        
        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(_player, _dungeonId, _forceSuccess);
        
        emit ExpeditionFulfilled(0, _player, _partyId, _forceSuccess, reward, expGained); // requestId = 0 表示緊急模式
    }

    // 輔助函數
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

    // 查詢函數
    function getVRFFee() public view returns (uint256) {
        return s_wrapper.getFee();
    }

    function getExpeditionCost(uint256 _dungeonId) external view returns (uint256 totalCost) {
        totalCost = explorationFee + getVRFFee();
    }

    function getPendingExpedition(uint256 requestId) external view returns (
        address player,
        uint256 partyId,
        uint256 dungeonId,
        uint256 timestamp,
        bool fulfilled,
        uint256 vrfFee,
        uint8 vipLevel,
        uint256 finalSuccessRate
    ) {
        PendingExpedition memory expedition = pendingExpeditions[requestId];
        return (
            expedition.player,
            expedition.partyId,
            expedition.dungeonId,
            expedition.timestamp,
            expedition.fulfilled,
            expedition.vrfFee,
            expedition.vipLevel,
            expedition.finalSuccessRate
        );
    }

    function previewExpeditionSuccess(address _player, uint256 _dungeonId) external view returns (
        uint8 baseSuccessRate,
        uint8 vipBonus,
        uint8 finalSuccessRate,
        uint256 totalCost,
        uint256 vrfFee
    ) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        baseSuccessRate = dungeon.baseSuccessRate;
        
        // 計算 VIP 加成
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player) returns (uint8 level) { 
            vipBonus = level; 
        } catch {
            vipBonus = 0;
        }
        
        uint256 tempSuccessRate = uint256(baseSuccessRate) + uint256(vipBonus);
        finalSuccessRate = tempSuccessRate > 100 ? 100 : uint8(tempSuccessRate);
        
        vrfFee = getVRFFee();
        totalCost = explorationFee + vrfFee;
    }

    // 管理函數
    function setVRFConfig(
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit,
        bool _useNativePayment
    ) external onlyOwner {
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;
        useNativePayment = _useNativePayment;
        emit VRFConfigUpdated(_requestConfirmations, _callbackGasLimit, _useNativePayment);
    }

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

    function updateDynamicSeed(uint256 _newSeed) external onlyOwner {
        dynamicSeed = _newSeed;
        emit DynamicSeedUpdated(_newSeed);
    }

    function setGlobalRewardMultiplier(uint256 _newMultiplier) external onlyOwner {
        globalRewardMultiplier = _newMultiplier;
    }

    function setExplorationFee(uint256 _newFee) external onlyOwner {
        explorationFee = _newFee;
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

    function withdrawLINK() external onlyOwner {
        uint256 balance = LINKTOKEN.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");
        LINKTOKEN.transfer(owner(), balance);
    }

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

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // 查詢函數
    function getPartyStatus(uint256 _partyId) external view returns (uint256 cooldownEndsAt, uint256 unclaimedRewards) {
        PartyStatus memory status = _getPartyStatus(_partyId);
        return (status.cooldownEndsAt, status.unclaimedRewards);
    }
    
    function getDungeon(uint256 _dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        return (dungeon.requiredPower, dungeon.rewardAmountUSD, dungeon.baseSuccessRate, dungeon.isInitialized);
    }

    receive() external payable {}
}
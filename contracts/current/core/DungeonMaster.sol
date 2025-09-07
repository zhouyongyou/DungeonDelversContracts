// DungeonMaster.sol - Enhanced error handling and consistency improvements
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/interfaces.sol";

contract DungeonMaster is Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    
    IDungeonCore public dungeonCore;
    
    mapping(uint256 => address) public requestIdToUser; // requestId => user
    
    uint256 public globalRewardMultiplier = 1000; // 1000 = 100%
    uint256 public explorationFee = 0.0015 ether;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    struct PartyStatus {
        uint256 cooldownEndsAt;  // Cooldown end time
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
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    mapping(address => ExpeditionRequest) public userRequests;

    event ExpeditionFulfilled(address indexed player, uint256 indexed requestId, uint256 indexed partyId, bool success, uint256 reward, uint256 expGained, uint256 dungeonId);
    event DungeonCoreSet(address indexed newAddress);
    event DungeonSet(uint256 indexed dungeonId, uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate);
    event ExpeditionRequested(address indexed player, uint256 partyId, uint256 dungeonId);
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomWordsCount);
    event ExpeditionProcessingError(address indexed user, uint256 requestId, string reason);
    event EmergencyCleanup(address indexed user, uint256 refundAmount);
    
    // New event for cooldown updates - enables subgraph indexing
    event PartyCooldownUpdated(uint256 indexed partyId, uint256 cooldownEndsAt, address indexed player);

    // Modified: Use msg.sender as owner instead of requiring parameter
    constructor() Ownable(msg.sender) {}
    

    // VRF integrated exploration request function (standard callback version)
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) 
        external payable nonReentrant whenNotPaused
    {
        require(userRequests[msg.sender].player == address(0) || userRequests[msg.sender].fulfilled, "DungeonMaster: Previous expedition request still pending");
        
        // Check if caller is party owner
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DungeonMaster: Caller is not the party owner");
        
        require(address(dungeonCore) != address(0), "DungeonMaster: DungeonCore not configured");
        require(_getDungeonStorage() != address(0), "DungeonMaster: DungeonStorage not configured in DungeonCore");
        
        // Validate dungeon and party status
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        PartyStatus memory partyStatus = _getPartyStatus(_partyId);

        require(dungeon.isInitialized, "DungeonMaster: Dungeon does not exist or not initialized");
        require(block.timestamp >= partyStatus.cooldownEndsAt, "DungeonMaster: Party is still on cooldown period");
        
        // Check party power
        uint256 totalPower = partyContract.getPartyComposition(_partyId);
        require(totalPower >= dungeon.requiredPower, "DungeonMaster: Party power insufficient for this dungeon");

        // Strict fee check, no refund logic
        require(msg.value == explorationFee, "DungeonMaster: Exact exploration fee payment required");

        // Immediately set cooldown (prevent double usage)
        partyStatus.cooldownEndsAt = block.timestamp + COOLDOWN_PERIOD;
        _setPartyStatus(_partyId, partyStatus);
        
        // Emit cooldown event for subgraph indexing
        emit PartyCooldownUpdated(_partyId, partyStatus.cooldownEndsAt, msg.sender);
        
        address vrfManagerAddr = _getVRFManager();
        if (vrfManagerAddr != address(0)) {
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _partyId, _dungeonId));
            
            // VRF call doesn't need ETH transfer (subscription mode)
            uint256 requestId = IVRFManager(vrfManagerAddr).requestRandomForUser{value: 0}(
                msg.sender,
                1, // Only need one random number for exploration result
                1, // maxRarity is meaningless for exploration, set to 1
                requestData
            );
            
            // Record requestId to user mapping (required for standard callback)
            requestIdToUser[requestId] = msg.sender;
            
            userRequests[msg.sender] = ExpeditionRequest({
                partyId: _partyId,
                dungeonId: _dungeonId,
                player: msg.sender,
                fulfilled: false,
                payment: msg.value,
                requestId: requestId,  // Store requestId for later use
                timestamp: block.timestamp  // Record when request was created
            });
            
            emit ExpeditionRequested(msg.sender, _partyId, _dungeonId);
            return;
        }
        
        // Direct failure when VRF is unavailable
        revert("DungeonMaster: VRF required for expeditions");
    }
    
    // Standard VRF callback implementation (minimal fix version)
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // Security improvement: use return instead of require to avoid blocking VRF system
        if (msg.sender != _getVRFManager()) return;
        if (randomWords.length == 0) return;
        
        // Standard callback mode: handle business logic directly in callback
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        ExpeditionRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // Minimal fix: direct processing, remove try-catch complexity
        _processExpeditionWithVRF(user, request, randomWords[0]);
        
        // Key fix: data cleanup always executed after processing logic
        delete requestIdToUser[requestId];
        delete userRequests[user];
        
        // Emit VRF completion event for frontend monitoring
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }

    // VRF result processing (optimized version)
    function _processExpeditionWithVRF(
        address user, 
        ExpeditionRequest storage request, 
        uint256 randomWord
    ) private {
        // Fix: execute all processing logic first, then set fulfilled last
        
        // Verify party ownership (prevent transfer during waiting period) - use safe check
        address partyOwner = address(0);
        try IParty(dungeonCore.partyContractAddress()).ownerOf(request.partyId) returns (address owner) {
            partyOwner = owner;
        } catch {
            // If call fails, treat as party transferred
            emit ExpeditionFulfilled(request.player, request.requestId, request.partyId, false, 0, 0, request.dungeonId);
            emit ExpeditionProcessingError(user, 0, "Party contract call failed");
            request.fulfilled = true;
            return;
        }
        
        if (partyOwner != request.player) {
            // If party transferred, expedition fails but don't rollback state
            emit ExpeditionFulfilled(request.player, request.requestId, request.partyId, false, 0, 0, request.dungeonId);
            request.fulfilled = true;
            return;
        }
        
        // Use VRF random number to process exploration result
        Dungeon memory dungeon = _getDungeon(request.dungeonId);
        
        uint8 vipBonus = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(request.player) returns (uint8 level) { 
            vipBonus = level; 
        } catch {
            // Use 0 bonus when VIP query fails
        }
        
        uint256 finalSuccessRate = dungeon.baseSuccessRate + vipBonus;
        if (finalSuccessRate > 100) finalSuccessRate = 100;

        // Generate result using VRF random number
        uint256 randomValue = randomWord % 100;
        bool success = randomValue < finalSuccessRate;

        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(request.player, request.dungeonId, success);
        
        emit ExpeditionFulfilled(request.player, request.requestId, request.partyId, success, reward, expGained, request.dungeonId);
        
        // Key fix: set fulfilled only after all processing is complete
        request.fulfilled = true;
    }
    
    function _handleExpeditionOutcome(address _player, uint256 _dungeonId, bool _success) private returns (uint256 reward, uint256 expGained) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        
        if (_success) {
            // Enhanced: dependency call protection
            uint256 soulShardReward;
            try dungeonCore.getSoulShardAmountForUSD(dungeon.rewardAmountUSD) returns (uint256 baseReward) {
                soulShardReward = (baseReward * globalRewardMultiplier) / 1000;
            } catch {
                // Give fixed reward when Oracle fails
                soulShardReward = 0;
                emit ExpeditionProcessingError(_player, 0, "Oracle price unavailable - no reward given");
            }
            
            if (soulShardReward > 0) {
                // Direct accounting to PlayerVault - enhanced error handling
                try IPlayerVault(dungeonCore.playerVaultAddress()).deposit(_player, soulShardReward) {
                    reward = soulShardReward;
                } catch {
                    // Vault deposit failed, record error
                    reward = 0;
                    emit ExpeditionProcessingError(_player, 0, "Vault deposit failed - reward lost");
                }
            }
            
            expGained = dungeon.requiredPower / 10;
        } else {
            expGained = dungeon.requiredPower / 20;
        }
        
        // Enhanced: experience point addition protection
        try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_player, expGained) {
            // Success
        } catch {
            // Experience addition failed, record but don't affect exploration result
            emit ExpeditionProcessingError(_player, 0, "Experience gain failed");
        }
    }

    function _getPartyStatus(uint256 _partyId) private view returns (PartyStatus memory) {
        IDungeonStorage.PartyStatus memory storageStatus = IDungeonStorage(_getDungeonStorage()).getPartyStatus(_partyId);
        
        return PartyStatus({
            cooldownEndsAt: storageStatus.cooldownEndsAt
        });
    }

    function _setPartyStatus(uint256 _partyId, PartyStatus memory _status) private {
        IDungeonStorage(_getDungeonStorage()).setPartyStatus(_partyId, IDungeonStorage.PartyStatus({
            cooldownEndsAt: _status.cooldownEndsAt
        }));
    }

    function _getDungeon(uint256 _dungeonId) private view returns (Dungeon memory) {
        (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) = 
            IDungeonStorage(_getDungeonStorage()).dungeons(_dungeonId);
        
        return Dungeon({
            requiredPower: requiredPower,
            rewardAmountUSD: rewardAmountUSD,
            baseSuccessRate: baseSuccessRate,
            isInitialized: isInitialized
        });
    }


    function _getVRFManager() internal view returns (address) {
        return dungeonCore.getVRFManager();
    }
    
    function _getDungeonStorage() internal view returns (address) {
        return dungeonCore.dungeonStorageAddress();
    }
    
    function getUserRequest(address _user) external view returns (ExpeditionRequest memory) {
        return userRequests[_user];
    }

    
    // Query total cost required for exploration (simplified version)
    function getExpeditionCost() external view returns (uint256 totalCost, uint256 explorationFeeAmount, uint256 vrfFeeAmount) {
        explorationFeeAmount = explorationFee;
        vrfFeeAmount = 0; // VRF subscription mode cost is 0
        totalCost = explorationFeeAmount; // Total cost is exploration fee
    }

    /**
     * @notice Emergency cleanup user request with refund
     * @dev Admin function to clear stuck expedition and refund exploration fee
     * @param user Address of the stuck user
     */
    function emergencyCleanupUser(address user) external onlyOwner {
        ExpeditionRequest storage request = userRequests[user];
        require(request.player != address(0), "DungeonMaster: No pending request");
        
        // Store payment amount before deletion
        uint256 refundAmount = request.payment;
        
        // Cleanup data
        delete userRequests[user];
        
        // Refund exploration fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = user.call{value: refundAmount}("");
            require(success, "DungeonMaster: Refund failed");
        }
        
        emit EmergencyCleanup(user, refundAmount);
    }
    
    /**
     * @notice Self emergency reset - user can reset their own stuck expedition request
     * @dev Allows users to reset their own expedition request after timeout, with refund
     */
    function selfEmergencyReset() external nonReentrant {
        ExpeditionRequest storage request = userRequests[msg.sender];
        
        // Check if user has pending request
        require(request.player != address(0) && !request.fulfilled, "DungeonMaster: No pending request to reset");
        
        // Check if enough time has passed (5 minutes = 300 seconds)
        require(
            block.timestamp >= request.timestamp + 300,
            "DungeonMaster: Must wait 5 minutes before emergency reset"
        );
        
        // Store payment amount before deletion
        uint256 refundAmount = request.payment;
        
        // Force reset request
        delete userRequests[msg.sender];
        
        // Refund exploration fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "DungeonMaster: Refund failed");
        }
        
        emit EmergencyCleanup(msg.sender, refundAmount);
    }

    function setDungeonCore(address _newAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_newAddress);
        emit DungeonCoreSet(_newAddress);
    }



    function setGlobalRewardMultiplier(uint256 _newMultiplier) external onlyOwner {
        globalRewardMultiplier = _newMultiplier;
    }

    function setExplorationFee(uint256 _newFee) external onlyOwner {
        explorationFee = _newFee;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // Simplified fund withdrawal (no need to protect refund funds)
    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "DungeonMaster: Native token withdrawal failed");
    }

    function withdrawSoulShard() external onlyOwner {
        address soulShardAddr = dungeonCore.soulShardTokenAddress();
        require(soulShardAddr != address(0), "DungeonMaster: SoulShard token contract not configured");
        IERC20 soulShardToken = IERC20(soulShardAddr);
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
        IDungeonStorage(_getDungeonStorage()).setDungeon(_dungeonId, dungeonData);
        emit DungeonSet(_dungeonId, _requiredPower, _rewardAmountUSD, _baseSuccessRate);
    }

    function getPartyStatus(uint256 _partyId) external view returns (uint256 cooldownEndsAt) {
        PartyStatus memory status = _getPartyStatus(_partyId);
        return status.cooldownEndsAt;
    }
    
    function getDungeon(uint256 _dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized) {
        Dungeon memory dungeon = _getDungeon(_dungeonId);
        return (dungeon.requiredPower, dungeon.rewardAmountUSD, dungeon.baseSuccessRate, dungeon.isInitialized);
    }
    
    // Query whether user can explore
    function canExplore(address user) external view returns (bool) {
        return userRequests[user].player == address(0) || userRequests[user].fulfilled;
    }
}
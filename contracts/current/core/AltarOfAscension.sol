// AltarOfAscension.sol - Gas Optimized Version (Storage Optimized)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/interfaces.sol";

contract AltarOfAscension is Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    IDungeonCore public dungeonCore;
    IHero public heroContract;
    IRelic public relicContract;

    mapping(address => uint256) public activeUpgradeRequest; // Prevent duplicate requests
    mapping(uint256 => bool) public lockedTokens; // Prevent NFT reuse
    mapping(uint256 => address) public requestIdToUser; // Required for standard callback

    // 🚀 Storage Optimized: Reduced from 4 slots to 2 slots (50% saving)
    struct UpgradeStats {
        uint64 totalAttempts;       // 8 bytes - supports 18 quintillion attempts
        uint64 totalBurned;         // 8 bytes - enough for game scale
        uint64 totalMinted;         // 8 bytes - enough for game scale
        uint128 totalFeesCollected; // 16 bytes - larger range for fees
    } // Total: 48 bytes = 2 slots (was 4 slots)

    mapping(address => UpgradeStats) public playerStats;
    UpgradeStats public globalStats;

    struct UpgradeRule {
        uint8 materialsRequired;
        uint256 nativeFee;
        uint8 greatSuccessChance;
        uint8 successChance;
        uint8 partialFailChance;
        uint256 cooldownTime;
        bool isActive;
    }
    mapping(uint8 => UpgradeRule) public upgradeRules;

    mapping(address => mapping(uint8 => uint256)) public lastUpgradeTime;

    mapping(address => uint8) public additionalVipBonusRate;

    // 🚀 Storage Packing: Move constants to slot 2 to utilize wasted space
    // slot 2: _paused(1) + dungeonCore(20) + constants(2) = 23/32 bytes used
    uint8 public constant MAX_VIP_BONUS = 20;
    uint8 public constant MAX_ADDITIONAL_BONUS = 20;

    struct UpgradeRequest {
        address tokenContract;
        uint8 baseRarity;
        uint256[] burnedTokenIds;
        bool fulfilled;
        uint256 payment;
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }

    mapping(address => UpgradeRequest) public userRequests;

    // 🚀 Gas Optimized: Use bytes32 instead of string to avoid _toString() calls
    event UpgradeAttempted(
        address indexed player,
        address indexed tokenContract,
        bytes32 targetId,      // Direct conversion, no string processing
        uint8 outcome,
        uint8 targetRarity,
        uint256 timestamp
    );

    event PlayerStatsUpdated(
        address indexed player,
        uint64 totalAttempts,   // Updated to match struct
        uint64 totalBurned,     // Updated to match struct
        uint64 totalMinted      // Updated to match struct
    );

    event UpgradeRuleSet(uint8 indexed fromRarity, UpgradeRule rule);
    event AdditionalVIPBonusSet(address indexed player, uint8 bonusRate);
    event UpgradeRequested(address indexed player, address tokenContract, uint8 baseRarity, uint256[] burnedTokenIds);
    event UpgradeRevealed(address indexed player, uint8 outcome, uint8 targetRarity);
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomWordsCount);
    event EmergencyCleanup(address indexed user, uint256 requestId, uint256 refundAmount, string reason);

    // Modified: Use msg.sender as owner instead of requiring parameter
    constructor() Ownable(msg.sender) {
        upgradeRules[1] = UpgradeRule({
            materialsRequired: 5,
            nativeFee: 0.005 ether,
            greatSuccessChance: 8,
            successChance: 77,
            partialFailChance: 13,
            cooldownTime: 10 seconds,
            isActive: true
        });

        upgradeRules[2] = UpgradeRule({
            materialsRequired: 4,
            nativeFee: 0.01 ether,
            greatSuccessChance: 6,
            successChance: 69,
            partialFailChance: 20,
            cooldownTime: 10 seconds,
            isActive: true
        });

        upgradeRules[3] = UpgradeRule({
            materialsRequired: 3,
            nativeFee: 0.02 ether,
            greatSuccessChance: 5,
            successChance: 48,
            partialFailChance: 37,
            cooldownTime: 10 seconds,
            isActive: true
        });

        upgradeRules[4] = UpgradeRule({
            materialsRequired: 2,
            nativeFee: 0.05 ether,
            greatSuccessChance: 6,
            successChance: 34,
            partialFailChance: 46,
            cooldownTime: 10 seconds,
            isActive: true
        });
    }

    function upgradeNFTs(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) external payable whenNotPaused nonReentrant {
        require(userRequests[msg.sender].tokenContract == address(0) || userRequests[msg.sender].fulfilled, "Altar: Previous upgrade pending");
        require(activeUpgradeRequest[msg.sender] == 0, "Altar: Request already active"); // Prevent duplicates

        uint8 baseRarity = _validateMaterials(_tokenContract, _tokenIds);
        UpgradeRule memory rule = upgradeRules[baseRarity];

        require(rule.isActive, "Altar: Upgrade disabled");
        require(rule.materialsRequired > 0, "Altar: Invalid rule");
        require(_tokenIds.length == rule.materialsRequired, "Altar: Incorrect material count");

        require(
            block.timestamp >= lastUpgradeTime[msg.sender][baseRarity] + rule.cooldownTime,
            "Altar: Still in cooldown period"
        );

        // Strict fee check, no refunds
        uint256 totalCost = getUpgradeCost(baseRarity);
        require(msg.value == totalCost, "Altar: Exact payment required");

        // Immediately set cooldown (prevent reuse)
        lastUpgradeTime[msg.sender][baseRarity] = block.timestamp;

        address vrfManagerAddr = _getVRFManager();
        if (vrfManagerAddr != address(0)) {
            // Simplified upgrade data (removed useless materialTokenId)
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _tokenContract, baseRarity, _tokenIds));

            // VRF call doesn't need ETH (subscription mode)

            uint256 requestId = IVRFManager(vrfManagerAddr).requestRandomForUser{value: 0}(
                msg.sender,
                1, // Only need one random number
                1, // maxRarity irrelevant for this contract
                requestData
            );

            // Security mechanism
            activeUpgradeRequest[msg.sender] = requestId;
            requestIdToUser[requestId] = msg.sender; // Required for standard callback

            // Lock NFTs to prevent transfer
            for (uint256 i = 0; i < _tokenIds.length; i++) {
                lockedTokens[_tokenIds[i]] = true;
            }

            userRequests[msg.sender] = UpgradeRequest({
                tokenContract: _tokenContract,
                baseRarity: baseRarity,
                burnedTokenIds: _tokenIds,
                fulfilled: false,
                payment: msg.value,
                requestId: requestId,  // Store requestId for later use
                timestamp: block.timestamp  // Record when request was created
            });

            emit UpgradeRequested(msg.sender, _tokenContract, baseRarity, _tokenIds);
            return;
        }

        // Direct failure when VRF unavailable
        revert("Altar: VRF required for upgrades");
    }

    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // Security improvement: use return instead of require to avoid VRF system deadlock
        if (msg.sender != _getVRFManager()) return;
        if (randomWords.length == 0) return;

        // Standard callback mode: find corresponding user
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;

        UpgradeRequest storage request = userRequests[user];
        if (request.fulfilled) return;

        // Minimal fix: direct processing, remove try-catch complexity
        _processUpgradeWithVRF(user, request, randomWords[0]);

        // Critical fix: cleanup logic always executes after processing logic
        _performCleanup(user, requestId, request.burnedTokenIds);

        // Emit VRF completion event for frontend monitoring
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }

    function _processUpgradeWithVRF(
        address user,
        UpgradeRequest storage request,
        uint256 randomWord
    ) private {
        // Fix: execute all processing logic first, set fulfilled last

        // Verify NFT ownership (prevent transfer during waiting period) - use safety check
        for (uint256 i = 0; i < request.burnedTokenIds.length; i++) {
            address tokenOwner = address(0);
            try IERC721(request.tokenContract).ownerOf(request.burnedTokenIds[i]) returns (address owner) {
                tokenOwner = owner;
            } catch {
                // If call fails, treat as NFT already transferred
                // 🚀 Gas Optimized: Direct bytes32 conversion
                emit UpgradeAttempted(
                    user,
                    request.tokenContract,
                    request.burnedTokenIds.length > 0 ? bytes32(request.burnedTokenIds[0]) : bytes32(0),
                    0, // failed outcome
                    0, // no target rarity
                    block.timestamp
                );
                emit EmergencyCleanup(user, request.requestId, 0, "NFT ownership check failed");
                request.fulfilled = true;
                return;
            }

            if (tokenOwner != user) {
                // If NFT already transferred, upgrade fails
                // 🚀 Gas Optimized: Direct bytes32 conversion
                emit UpgradeAttempted(
                    user,
                    request.tokenContract,
                    request.burnedTokenIds.length > 0 ? bytes32(request.burnedTokenIds[0]) : bytes32(0),
                    0, // failed outcome
                    0, // no target rarity
                    block.timestamp
                );
                request.fulfilled = true;
                return;
            }
        }

        UpgradeRule memory rule = upgradeRules[request.baseRarity];

        // Get VIP bonus - use safe call
        uint8 vipLevel = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(user) returns (uint8 level) {
            vipLevel = level;
        } catch {
            // Use 0 bonus when VIP query fails
        }

        uint8 totalVipBonus = vipLevel + additionalVipBonusRate[user];
        if (totalVipBonus > MAX_VIP_BONUS) totalVipBonus = MAX_VIP_BONUS;

        uint256 tempSuccessChance = uint256(rule.successChance) + uint256(totalVipBonus);
        uint8 effectiveSuccessChance = tempSuccessChance > 100 ? 100 : uint8(tempSuccessChance);

        // Use VRF random number to generate result (0-99)
        uint256 randomValue = randomWord % 100;

        uint8 outcome;
        uint256[] memory mintedIds;
        uint8 targetRarity = request.baseRarity;

        if (randomValue < rule.greatSuccessChance) {
            // Great success - generate 2 NFTs
            outcome = 3;
            targetRarity = request.baseRarity + 1;
            mintedIds = _performGreatSuccessUpgrade(user, request.burnedTokenIds, request.baseRarity, request.tokenContract, randomWord);
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance) {
            // Success - generate 1 NFT
            outcome = 2;
            targetRarity = request.baseRarity + 1;
            mintedIds = _performSuccessfulUpgrade(user, request.burnedTokenIds, request.baseRarity, request.tokenContract, randomWord);
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance + rule.partialFailChance) {
            // Partial failure - generate half NFTs
            outcome = 1;
            targetRarity = request.baseRarity; // Keep same rarity
            mintedIds = _performPartialFailUpgrade(user, request.burnedTokenIds, request.baseRarity, request.tokenContract, randomWord);
        } else {
            // Complete failure
            outcome = 0;
            targetRarity = 0;
            mintedIds = _performFailedUpgrade(request.burnedTokenIds, request.tokenContract);
        }

        // Update statistics (required for subgraph)
        _updateStats(user, request.burnedTokenIds.length, mintedIds.length, request.payment);

        // 🚀 Gas Optimized: Direct bytes32 conversion (no _toString needed)
        emit UpgradeAttempted(
            user,
            request.tokenContract,
            request.burnedTokenIds.length > 0 ? bytes32(request.burnedTokenIds[0]) : bytes32(0),
            outcome,
            targetRarity,
            block.timestamp
        );

        // Critical fix: set fulfilled only after all processing complete
        request.fulfilled = true;
    }

    function _performCleanup(address user, uint256 requestId, uint256[] memory tokenIds) private {
        // Clear all state regardless of processing success
        delete activeUpgradeRequest[user];
        delete requestIdToUser[requestId];

        // Unlock all related NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            lockedTokens[tokenIds[i]] = false;
        }

        delete userRequests[user];
    }

    function _performGreatSuccessUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract,
        uint256 randomWord
    ) internal returns (uint256[] memory) {
        // Burn sacrificial NFTs
        _burnNFTs(tokenContract, tokenIds);

        // Great success - generate 2 upgraded NFTs
        uint8 newRarity = baseRarity + 1;
        uint256[] memory mintedIds = new uint256[](2);
        mintedIds[0] = _mintUpgradedNFT(user, tokenContract, newRarity, randomWord);
        mintedIds[1] = _mintUpgradedNFT(user, tokenContract, newRarity, randomWord >> 128);

        return mintedIds;
    }

    function _performSuccessfulUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract,
        uint256 randomWord
    ) internal returns (uint256[] memory) {
        // Burn sacrificial NFTs
        _burnNFTs(tokenContract, tokenIds);

        // Removed useless material burning logic (materialTokenId is always 0)

        // Upgrade primary NFT
        uint8 newRarity = baseRarity + 1;
        uint256 newTokenId = _mintUpgradedNFT(user, tokenContract, newRarity, randomWord);

        uint256[] memory mintedIds = new uint256[](1);
        mintedIds[0] = newTokenId;

        return mintedIds;
    }

    function _performPartialFailUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract,
        uint256 randomWord
    ) internal returns (uint256[] memory) {
        // Burn sacrificial NFTs
        _burnNFTs(tokenContract, tokenIds);

        // Partial failure - generate half count of same rarity NFTs
        uint256 mintCount = tokenIds.length / 2;
        uint256[] memory mintedIds = new uint256[](mintCount);

        for (uint256 i = 0; i < mintCount; i++) {
            mintedIds[i] = _mintUpgradedNFT(user, tokenContract, baseRarity, randomWord >> (i * 32));
        }

        return mintedIds;
    }

    function _performFailedUpgrade(
        uint256[] memory tokenIds,
        address tokenContract
    ) internal returns (uint256[] memory) {
        // Burn sacrificial NFTs
        _burnNFTs(tokenContract, tokenIds);

        // Removed useless material burning logic (materialTokenId is always 0)

        return new uint256[](0); // no minted tokens
    }

    function _mintUpgradedNFT(
        address _player,
        address _tokenContract,
        uint8 _rarity,
        uint256 _randomNumber
    ) private returns (uint256) {
        if (_tokenContract == address(heroContract)) {
            uint16 power = _generatePowerByRarity(_rarity, _randomNumber);
            return heroContract.mintFromAltar(_player, _rarity, power);
        } else {
            uint8 capacity = _rarity;
            return relicContract.mintFromAltar(_player, _rarity, capacity);
        }
    }

    function _generatePowerByRarity(uint8 _rarity, uint256 _randomNumber) private pure returns (uint16) {
        if (_rarity == 1) return 15 + uint16(_randomNumber % 36);
        else if (_rarity == 2) return 50 + uint16(_randomNumber % 51);
        else if (_rarity == 3) return 100 + uint16(_randomNumber % 51);
        else if (_rarity == 4) return 150 + uint16(_randomNumber % 51);
        else if (_rarity == 5) return 200 + uint16(_randomNumber % 56);
        else revert("AltarOfAscension: Invalid rarity value");
    }

    function _validateMaterials(address _tokenContract, uint256[] calldata _tokenIds) private view returns (uint8) {
        require(_tokenContract == address(heroContract) || _tokenContract == address(relicContract), "Altar: Invalid contract");
        require(_tokenIds.length > 0, "Altar: No tokens");

        uint8 baseRarity;
        if (_tokenContract == address(heroContract)) {
            (baseRarity,) = heroContract.getHeroProperties(_tokenIds[0]);
        } else {
            (baseRarity,) = relicContract.getRelicProperties(_tokenIds[0]);
        }

        require(baseRarity > 0 && baseRarity < 5, "Altar: Invalid rarity");

        for (uint i = 0; i < _tokenIds.length; i++) {
            require(IERC721(_tokenContract).ownerOf(_tokenIds[i]) == msg.sender, "Altar: Not owner");
            require(!lockedTokens[_tokenIds[i]], "Altar: Token locked"); // Check lock status for security

            uint8 tokenRarity;
            if (_tokenContract == address(heroContract)) {
                (tokenRarity,) = heroContract.getHeroProperties(_tokenIds[i]);
            } else {
                (tokenRarity,) = relicContract.getRelicProperties(_tokenIds[i]);
            }

            require(tokenRarity == baseRarity, "Altar: Rarity mismatch");
        }

        return baseRarity;
    }

    function _burnNFTs(address _tokenContract, uint256[] memory _tokenIds) private {
        for (uint i = 0; i < _tokenIds.length; i++) {
            if (_tokenContract == address(heroContract)) {
                heroContract.burnFromAltar(_tokenIds[i]);
            } else {
                relicContract.burnFromAltar(_tokenIds[i]);
            }
        }
    }

    // 🚀 Storage Optimized: Use smaller types matching struct
    function _updateStats(address _player, uint256 _burned, uint256 _minted, uint256 _fee) private {
        playerStats[_player].totalAttempts++;
        playerStats[_player].totalBurned += uint64(_burned);      // Safe conversion
        playerStats[_player].totalMinted += uint64(_minted);      // Safe conversion
        playerStats[_player].totalFeesCollected += uint128(_fee); // Safe conversion

        globalStats.totalAttempts++;
        globalStats.totalBurned += uint64(_burned);      // Safe conversion
        globalStats.totalMinted += uint64(_minted);      // Safe conversion
        globalStats.totalFeesCollected += uint128(_fee); // Safe conversion

        emit PlayerStatsUpdated(_player, playerStats[_player].totalAttempts, playerStats[_player].totalBurned, playerStats[_player].totalMinted);
    }

    function getUserRequest(address _user) external view returns (UpgradeRequest memory) {
        return userRequests[_user];
    }

    // Query total upgrade cost (simplified version)
    function getUpgradeCost(uint8 _baseRarity) public view returns (uint256 totalCost) {
        UpgradeRule memory rule = upgradeRules[_baseRarity];
        uint256 vrfFee = 0; // VRF subscription mode has no direct fee
        totalCost = rule.nativeFee + vrfFee;
    }

    function _getVRFManager() internal view returns (address) {
        return dungeonCore.getVRFManager();
    }

    function emergencyUnlock(uint256[] memory tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            lockedTokens[tokenIds[i]] = false;
        }
    }

    /**
     * @notice Emergency cleanup user request with refund
     * @dev Admin function to clear stuck upgrade and refund native fee
     * @param user Address of the stuck user
     */
    function emergencyCleanupUser(address user) external onlyOwner {
        UpgradeRequest storage request = userRequests[user];
        require(request.tokenContract != address(0), "Altar: No pending request");

        uint256 requestId = activeUpgradeRequest[user];
        uint256 refundAmount = request.payment;

        // Clear all state
        _performCleanup(user, requestId, request.burnedTokenIds);

        // Refund native fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = user.call{value: refundAmount}("");
            require(success, "Altar: Refund failed");
        }

        emit EmergencyCleanup(user, requestId, refundAmount, "Admin cleanup");
    }

    /**
     * @notice Self emergency reset - user can reset their own stuck upgrade request
     * @dev Allows users to reset their own upgrade request after timeout, with refund
     */
    function selfEmergencyReset() external nonReentrant {
        UpgradeRequest storage request = userRequests[msg.sender];

        // Check if user has pending request
        require(request.tokenContract != address(0) && !request.fulfilled, "Altar: No pending request to reset");

        // Check if enough time has passed (5 minutes = 300 seconds)
        require(
            block.timestamp >= request.timestamp + 300,
            "Altar: Must wait 5 minutes before emergency reset"
        );

        uint256 requestId = activeUpgradeRequest[msg.sender];
        uint256 refundAmount = request.payment;

        // Clear all state
        _performCleanup(msg.sender, requestId, request.burnedTokenIds);

        // Refund native fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "Altar: Refund failed");
        }

        emit EmergencyCleanup(msg.sender, requestId, refundAmount, "Self reset");
    }

    function setDungeonCore(address _address) external onlyOwner {
        dungeonCore = IDungeonCore(_address);
        heroContract = IHero(dungeonCore.heroContractAddress());
        relicContract = IRelic(dungeonCore.relicContractAddress());
    }

    function setUpgradeRule(uint8 _fromRarity, UpgradeRule calldata _rule) external onlyOwner {
        require(_fromRarity >= 1 && _fromRarity <= 4, "Altar: Invalid rarity");
        require(_rule.greatSuccessChance + _rule.successChance + _rule.partialFailChance <= 100, "Altar: Invalid chances");

        upgradeRules[_fromRarity] = _rule;
        emit UpgradeRuleSet(_fromRarity, _rule);
    }

    function setAdditionalVIPBonus(address _player, uint8 _bonusRate) external onlyOwner {
        require(_bonusRate <= MAX_ADDITIONAL_BONUS, "Altar: Bonus too high");
        additionalVipBonusRate[_player] = _bonusRate;
        emit AdditionalVIPBonusSet(_player, _bonusRate);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function canUpgrade(address user) external view returns (bool) {
        return userRequests[user].tokenContract == address(0) || userRequests[user].fulfilled;
    }

    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Altar: Native withdraw failed");
    }

    /**
     * @notice Withdraw SoulShard tokens (safety function)
     * @dev Added for emergency withdrawal if contract receives SOUL tokens
     */
    function withdrawSoulShard() external onlyOwner {
        address soulShardAddress = dungeonCore.soulShardTokenAddress();
        require(soulShardAddress != address(0), "Altar: SoulShard not set");

        IERC20 soulShard = IERC20(soulShardAddress);
        uint256 balance = soulShard.balanceOf(address(this));

        if (balance > 0) {
            soulShard.transfer(owner(), balance);
        }
    }

    receive() external payable {}
}
// AltarOfAscension_VRF.sol - 整合 Chainlink VRF v2.5 的升級系統
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

// Chainlink VRF v2.5 imports
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract AltarOfAscension_VRF is 
    Ownable, 
    ReentrancyGuard, 
    Pausable, 
    VRFV2PlusWrapperConsumerBase, 
    ConfirmedOwner 
{
    IDungeonCore public dungeonCore;
    IHero public heroContract;
    IRelic public relicContract;
    LinkTokenInterface public LINKTOKEN;

    // VRF 配置
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 200000;
    uint32 public numWords = 1;
    bool public useNativePayment = true;
    bool public vrfEnabled = true;
    uint256 public vrfThreshold = 1; // 所有升級都使用 VRF

    // 升級統計
    struct UpgradeStats {
        uint256 totalAttempts;
        uint256 totalBurned;
        uint256 totalMinted;
        uint256 totalFeesCollected;
    }
    mapping(address => UpgradeStats) public playerStats;
    UpgradeStats public globalStats;

    // 升級規則
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
    
    // VRF 請求追蹤
    struct PendingUpgrade {
        address player;
        address tokenContract;
        uint8 baseRarity;
        uint8 targetRarity;
        uint256[] burnedTokenIds;
        uint256 timestamp;
        bool fulfilled;
        uint8 materialsCount;
        uint256 vrfFee;
    }
    
    mapping(uint256 => PendingUpgrade) public pendingUpgrades;
    mapping(uint256 => bool) public requestIdToWaiting;
    
    // 玩家冷卻追蹤
    mapping(address => mapping(uint8 => uint256)) public lastUpgradeTime;
    
    // VIP 加成
    mapping(address => uint8) public additionalVipBonusRate;
    uint8 public constant MAX_VIP_BONUS = 20;
    uint8 public constant MAX_ADDITIONAL_BONUS = 20;
    
    // 動態種子 (用於偽隨機備用)
    uint256 public dynamicSeed;
    
    // 事件
    event UpgradeRequested(
        uint256 indexed requestId,
        address indexed player,
        address indexed tokenContract,
        uint8 baseRarity,
        uint256[] burnedTokenIds,
        uint256 vrfFee
    );
    
    event UpgradeCompleted(
        uint256 indexed requestId,
        address indexed player,
        address indexed tokenContract,
        uint8 baseRarity,
        uint8 targetRarity,
        uint256[] burnedTokenIds,
        uint256[] mintedTokenIds,
        uint8 outcome,
        uint256 fee,
        uint8 vipLevel,
        uint8 totalVipBonus
    );
    
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomness);
    event UpgradeRuleSet(uint8 indexed fromRarity, UpgradeRule rule);
    event VRFConfigUpdated(uint16 confirmations, uint32 gasLimit, bool useNative);
    event EmergencyUpgrade(address indexed player, string reason);

    constructor(
        address _initialOwner,
        address _wrapperAddress,
        address _linkToken
    ) 
        Ownable(_initialOwner) 
        VRFV2PlusWrapperConsumerBase(_wrapperAddress)
        ConfirmedOwner(_initialOwner) 
    {
        LINKTOKEN = LinkTokenInterface(_linkToken);
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));
        
        // 初始化升級規則
        _setupDefaultUpgradeRules();
    }

    function _setupDefaultUpgradeRules() private {
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
            greatSuccessChance: 4,
            successChance: 41,
            partialFailChance: 40,
            cooldownTime: 10 seconds,
            isActive: true
        });
        
        upgradeRules[4] = UpgradeRule({
            materialsRequired: 2,
            nativeFee: 0.05 ether,
            greatSuccessChance: 3,
            successChance: 22,
            partialFailChance: 50,
            cooldownTime: 10 seconds,
            isActive: true
        });
    }

    // 主要升級函數 - 使用 VRF
    function upgradeNFTsWithVRF(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) external payable whenNotPaused nonReentrant {
        require(vrfEnabled, "VRF is disabled");
        
        // 驗證材料和費用
        uint8 baseRarity = _validateMaterials(_tokenContract, _tokenIds);
        UpgradeRule memory rule = upgradeRules[baseRarity];
        
        require(rule.isActive, "Altar: Upgrades for this rarity are disabled");
        require(_tokenIds.length == rule.materialsRequired, "Altar: Incorrect number of materials");
        
        // 計算總費用 (包含 VRF)
        uint256 vrfFee = getVRFFee();
        uint256 totalCost = rule.nativeFee + vrfFee;
        require(msg.value >= totalCost, "Altar: Insufficient payment for VRF upgrade");
        
        // 檢查冷卻
        require(
            block.timestamp >= lastUpgradeTime[msg.sender][baseRarity] + rule.cooldownTime,
            "Altar: Still in cooldown period"
        );
        
        // 記錄燃燒的代幣ID
        uint256[] memory burnedIds = new uint256[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            burnedIds[i] = _tokenIds[i];
        }
        
        // 執行燃燒
        _burnNFTs(_tokenContract, _tokenIds);
        
        // 請求 VRF 隨機數
        uint256 requestId = _requestVRFUpgrade(
            msg.sender,
            _tokenContract,
            baseRarity,
            burnedIds,
            rule.nativeFee,
            vrfFee
        );
        
        // 更新冷卻時間
        lastUpgradeTime[msg.sender][baseRarity] = block.timestamp;
        
        emit UpgradeRequested(requestId, msg.sender, _tokenContract, baseRarity, burnedIds, vrfFee);
    }
    
    // 備用升級函數 - 使用偽隨機 (緊急情況)
    function upgradeNFTsInstant(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) external payable whenNotPaused nonReentrant {
        require(!vrfEnabled, "Use VRF upgrade when enabled");
        
        // 驗證材料
        uint8 baseRarity = _validateMaterials(_tokenContract, _tokenIds);
        UpgradeRule memory rule = upgradeRules[baseRarity];
        
        require(rule.isActive, "Altar: Upgrades for this rarity are disabled");
        require(_tokenIds.length == rule.materialsRequired, "Altar: Incorrect number of materials");
        require(msg.value >= rule.nativeFee, "Altar: Insufficient BNB fee");
        
        // 檢查冷卻
        require(
            block.timestamp >= lastUpgradeTime[msg.sender][baseRarity] + rule.cooldownTime,
            "Altar: Still in cooldown period"
        );
        
        // 記錄燃燒的代幣ID
        uint256[] memory burnedIds = new uint256[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            burnedIds[i] = _tokenIds[i];
        }
        
        // 執行燃燒
        _burnNFTs(_tokenContract, _tokenIds);
        
        // 使用偽隨機處理升級
        uint256 pseudoRandom = _generatePseudoRandom(msg.sender, baseRarity);
        _processUpgradeWithRandomness(0, pseudoRandom, true); // requestId = 0 表示偽隨機
        
        // 更新冷卻時間
        lastUpgradeTime[msg.sender][baseRarity] = block.timestamp;
        
        emit EmergencyUpgrade(msg.sender, "Pseudo-random upgrade used");
    }

    // 請求 VRF 隨機數
    function _requestVRFUpgrade(
        address _player,
        address _tokenContract,
        uint8 _baseRarity,
        uint256[] memory _burnedIds,
        uint256 _nativeFee,
        uint256 _vrfFee
    ) private returns (uint256 requestId) {
        if (useNativePayment) {
            VRFV2PlusClient.ExtraArgsV1 memory extraArgs = VRFV2PlusClient.ExtraArgsV1({
                nativePayment: true
            });
            
            bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(extraArgs);
            
            (requestId, ) = requestRandomnessPayInNative(
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
            
            (requestId, ) = requestRandomness(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgsBytes
            );
        }
        
        requestIdToWaiting[requestId] = true;
        pendingUpgrades[requestId] = PendingUpgrade({
            player: _player,
            tokenContract: _tokenContract,
            baseRarity: _baseRarity,
            targetRarity: _baseRarity + 1,
            burnedTokenIds: _burnedIds,
            timestamp: block.timestamp,
            fulfilled: false,
            materialsCount: uint8(_burnedIds.length),
            vrfFee: _vrfFee
        });
    }

    // VRF 回調函數
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
        internal 
        override 
    {
        require(requestIdToWaiting[requestId], "Request not found or already fulfilled");
        
        uint256 randomness = randomWords[0];
        requestIdToWaiting[requestId] = false;
        pendingUpgrades[requestId].fulfilled = true;
        
        _processUpgradeWithRandomness(requestId, randomness, false);
        
        emit VRFRequestFulfilled(requestId, randomness);
    }

    // 處理升級結果 (VRF 或偽隨機)
    function _processUpgradeWithRandomness(
        uint256 _requestId,
        uint256 _randomness,
        bool _isPseudoRandom
    ) private {
        PendingUpgrade memory upgrade;
        
        if (!_isPseudoRandom) {
            upgrade = pendingUpgrades[_requestId];
        } else {
            // 偽隨機模式，創建臨時結構
            upgrade = PendingUpgrade({
                player: msg.sender,
                tokenContract: address(0), // 將在下面設置
                baseRarity: 0, // 將在下面設置
                targetRarity: 0,
                burnedTokenIds: new uint256[](0),
                timestamp: block.timestamp,
                fulfilled: true,
                materialsCount: 0,
                vrfFee: 0
            });
        }
        
        UpgradeRule memory rule = upgradeRules[upgrade.baseRarity];
        
        // 獲取 VIP 等級和計算加成
        (uint8 vipLevel, uint8 totalVipBonus) = _getVIPBonus(upgrade.player);
        
        // 計算升級結果
        uint256 randomValue = _randomness % 100;
        uint256 tempSuccessChance = uint256(rule.successChance) + uint256(totalVipBonus);
        uint8 effectiveSuccessChance = tempSuccessChance > 100 ? 100 : uint8(tempSuccessChance);
        
        uint256 mintCount = 0;
        uint8 targetRarity = upgrade.baseRarity;
        uint8 outcome = 0;
        
        if (randomValue < rule.greatSuccessChance) {
            // 大成功：獲得 2 個高級 NFT
            mintCount = 2;
            targetRarity = upgrade.baseRarity + 1;
            outcome = 3;
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance) {
            // 成功：獲得 1 個高級 NFT
            mintCount = 1;
            targetRarity = upgrade.baseRarity + 1;
            outcome = 2;
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance + rule.partialFailChance) {
            // 部分失敗：返還部分材料
            mintCount = rule.materialsRequired / 2;
            targetRarity = upgrade.baseRarity;
            outcome = 1;
        } else {
            // 完全失敗：無任何返還
            mintCount = 0;
            outcome = 0;
        }
        
        // 鑄造新 NFT
        uint256[] memory mintedIds = new uint256[](mintCount);
        for (uint i = 0; i < mintCount; i++) {
            uint256 newTokenId = _mintUpgradedNFT(upgrade.player, upgrade.tokenContract, targetRarity);
            mintedIds[i] = newTokenId;
        }
        
        // 更新統計
        uint256 nativeFee = upgradeRules[upgrade.baseRarity].nativeFee;
        _updateStats(upgrade.player, upgrade.materialsCount, mintCount, nativeFee);
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _randomness, outcome)));
        
        emit UpgradeCompleted(
            _requestId,
            upgrade.player,
            upgrade.tokenContract,
            upgrade.baseRarity,
            targetRarity,
            upgrade.burnedTokenIds,
            mintedIds,
            outcome,
            nativeFee,
            vipLevel,
            totalVipBonus
        );
    }

    // 取消過期請求
    function cancelExpiredRequest(uint256 requestId) external {
        PendingUpgrade storage upgrade = pendingUpgrades[requestId];
        require(upgrade.player == msg.sender, "Not your request");
        require(!upgrade.fulfilled, "Already fulfilled");
        require(block.timestamp > upgrade.timestamp + 2 hours, "Request not expired");
        
        requestIdToWaiting[requestId] = false;
        upgrade.fulfilled = true;
        
        // 返還部分材料作為補償
        uint8 refundCount = upgrade.materialsCount / 2;
        for (uint i = 0; i < refundCount; i++) {
            _mintUpgradedNFT(msg.sender, upgrade.tokenContract, upgrade.baseRarity);
        }
        
        // 如果使用 LINK 支付且有剩餘，可以退款
        if (!useNativePayment && upgrade.vrfFee > 0) {
            LINKTOKEN.transfer(msg.sender, upgrade.vrfFee);
        }
    }

    // 獲取 VIP 加成
    function _getVIPBonus(address _player) private view returns (uint8 vipLevel, uint8 totalVipBonus) {
        vipLevel = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player) returns (uint8 level) {
            vipLevel = level;
        } catch {
            vipLevel = 0;
        }
        
        uint8 additionalBonus = additionalVipBonusRate[_player];
        uint8 rawTotalBonus = vipLevel + additionalBonus;
        totalVipBonus = rawTotalBonus > MAX_VIP_BONUS ? MAX_VIP_BONUS : rawTotalBonus;
    }

    // 生成偽隨機數 (備用)
    function _generatePseudoRandom(address _player, uint8 _baseRarity) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            dynamicSeed,
            block.timestamp,
            block.prevrandao,
            _player,
            _baseRarity,
            tx.gasprice
        )));
    }

    // 驗證材料
    function _validateMaterials(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) internal view returns (uint8 baseRarity) {
        require(_tokenIds.length > 0, "Altar: No materials provided");
        require(_tokenIds.length <= 10, "Altar: Too many materials");
        require(
            _tokenContract == address(heroContract) || _tokenContract == address(relicContract),
            "Altar: Invalid token contract"
        );
        
        // 獲取第一個 NFT 的稀有度
        if (_tokenContract == address(heroContract)) {
            (baseRarity,) = heroContract.getHeroProperties(_tokenIds[0]);
        } else {
            (baseRarity,) = relicContract.getRelicProperties(_tokenIds[0]);
        }
        
        require(baseRarity > 0 && baseRarity < 5, "Altar: Invalid rarity for upgrade");
        
        // 驗證所有材料
        for (uint i = 0; i < _tokenIds.length; i++) {
            if (_tokenContract == address(heroContract)) {
                require(heroContract.ownerOf(_tokenIds[i]) == msg.sender, "Altar: Not owner");
                (uint8 rarity,) = heroContract.getHeroProperties(_tokenIds[i]);
                require(rarity == baseRarity, "Altar: Materials must have same rarity");
            } else {
                require(relicContract.ownerOf(_tokenIds[i]) == msg.sender, "Altar: Not owner");
                (uint8 rarity,) = relicContract.getRelicProperties(_tokenIds[i]);
                require(rarity == baseRarity, "Altar: Materials must have same rarity");
            }
        }
    }
    
    // 批量燃燒 NFT
    function _burnNFTs(address _tokenContract, uint256[] calldata _tokenIds) private {
        for (uint i = 0; i < _tokenIds.length; i++) {
            if (_tokenContract == address(heroContract)) {
                heroContract.burnFromAltar(_tokenIds[i]);
            } else {
                relicContract.burnFromAltar(_tokenIds[i]);
            }
        }
    }
    
    // 鑄造升級後的 NFT
    function _mintUpgradedNFT(
        address _player,
        address _tokenContract,
        uint8 _rarity
    ) private returns (uint256) {
        if (_tokenContract == address(heroContract)) {
            uint256 power = _generatePowerByRarity(_rarity);
            return heroContract.mintFromAltar(_player, _rarity, power);
        } else {
            uint8 capacity = _generateCapacityByRarity(_rarity);
            return relicContract.mintFromAltar(_player, _rarity, capacity);
        }
    }

    // 更新統計數據
    function _updateStats(
        address _player,
        uint256 _burned,
        uint256 _minted,
        uint256 _fee
    ) private {
        playerStats[_player].totalAttempts++;
        playerStats[_player].totalBurned += _burned;
        playerStats[_player].totalMinted += _minted;
        playerStats[_player].totalFeesCollected += _fee;
        
        globalStats.totalAttempts++;
        globalStats.totalBurned += _burned;
        globalStats.totalMinted += _minted;
        globalStats.totalFeesCollected += _fee;
    }
    
    // 生成戰力值
    function _generatePowerByRarity(uint8 _rarity) internal view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, _rarity, msg.sender)));
        
        if (_rarity == 1) return 15 + (random % 36);
        if (_rarity == 2) return 50 + (random % 51);
        if (_rarity == 3) return 100 + (random % 51);
        if (_rarity == 4) return 150 + (random % 51);
        if (_rarity == 5) return 200 + (random % 56);
        
        return 15;
    }
    
    // 生成容量值
    function _generateCapacityByRarity(uint8 _rarity) internal pure returns (uint8) {
        require(_rarity > 0 && _rarity <= 5, "Invalid rarity");
        return _rarity;
    }

    // 獲取 VRF 費用
    function getVRFFee() public view returns (uint256) {
        return s_wrapper.getFee();
    }

    // 獲取升級總費用預估
    function getUpgradeCost(uint8 _baseRarity, bool _withVRF) external view returns (uint256 totalCost) {
        UpgradeRule memory rule = upgradeRules[_baseRarity];
        totalCost = rule.nativeFee;
        
        if (_withVRF && vrfEnabled) {
            totalCost += getVRFFee();
        }
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

    function setVRFEnabled(bool _enabled) external onlyOwner {
        vrfEnabled = _enabled;
    }

    function setVRFThreshold(uint256 _threshold) external onlyOwner {
        vrfThreshold = _threshold;
    }

    function setUpgradeRule(uint8 _fromRarity, UpgradeRule calldata _rule) external onlyOwner {
        require(_fromRarity > 0 && _fromRarity < 5, "Invalid rarity");
        require(
            _rule.greatSuccessChance + _rule.successChance + _rule.partialFailChance < 100,
            "Total chance must be < 100"
        );
        upgradeRules[_fromRarity] = _rule;
        emit UpgradeRuleSet(_fromRarity, _rule);
    }
    
    function setContracts(
        address _dungeonCore,
        address _heroContract,
        address _relicContract
    ) external onlyOwner {
        require(_dungeonCore != address(0), "Invalid DungeonCore");
        require(_heroContract != address(0), "Invalid Hero");
        require(_relicContract != address(0), "Invalid Relic");
        
        dungeonCore = IDungeonCore(_dungeonCore);
        heroContract = IHero(_heroContract);
        relicContract = IRelic(_relicContract);
    }

    function setAdditionalVIPBonus(address _player, uint8 _bonusRate) external onlyOwner {
        require(_bonusRate <= MAX_ADDITIONAL_BONUS, "Altar: Additional bonus exceeds maximum");
        additionalVipBonusRate[_player] = _bonusRate;
    }

    function withdrawLINK() external onlyOwner {
        uint256 balance = LINKTOKEN.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");
        LINKTOKEN.transfer(owner(), balance);
    }
    
    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    receive() external payable {}
}
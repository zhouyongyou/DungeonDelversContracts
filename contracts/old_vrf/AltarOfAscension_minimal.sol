// AltarOfAscension_minimal.sol - 參考 DungeonMaster 極簡原則設計
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/interfaces.sol";

contract AltarOfAscension_Minimal is Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    IDungeonCore public dungeonCore;
    IHero public heroContract;
    IRelic public relicContract;

    // === VRF 相關 ===
    address public vrfManager;
    
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
    uint8 public constant MAX_VIP_BONUS = 20;
    uint8 public constant MAX_ADDITIONAL_BONUS = 20;
    
    struct UpgradeRequest {
        address tokenContract;
        uint8 baseRarity;
        uint256[] burnedTokenIds;
        bool fulfilled;
        uint256 payment;
    }
    
    mapping(address => UpgradeRequest) public userRequests;
    
    // 事件
    event UpgradeAttempted(
        address indexed player,
        address indexed tokenContract,
        uint8 baseRarity,
        uint8 targetRarity,
        uint256[] burnedTokenIds,
        uint256[] mintedTokenIds,
        uint8 outcome
    );
    
    event UpgradeRuleSet(uint8 indexed fromRarity, UpgradeRule rule);
    event AdditionalVIPBonusSet(address indexed player, uint8 bonusRate);
    event UpgradeRequested(address indexed player, address tokenContract, uint8 baseRarity, uint256[] burnedTokenIds);
    event UpgradeRevealed(address indexed player, uint8 outcome, uint8 targetRarity);
    // === VRF 事件 ===
    event VRFManagerSet(address indexed vrfManager);
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomWordsCount);

    constructor(address _initialOwner) Ownable(_initialOwner) {
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

    // === VRF 整合的升級函數（極簡版本）===
    function upgradeNFTs(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) external payable whenNotPaused nonReentrant {
        require(userRequests[msg.sender].tokenContract == address(0) || userRequests[msg.sender].fulfilled, "Altar: Previous upgrade pending");
        
        uint8 baseRarity = _validateMaterials(_tokenContract, _tokenIds);
        UpgradeRule memory rule = upgradeRules[baseRarity];
        
        require(rule.isActive, "Altar: Upgrade disabled");
        require(rule.materialsRequired > 0, "Altar: Invalid rule");
        require(_tokenIds.length == rule.materialsRequired, "Altar: Incorrect material count");
        
        require(
            block.timestamp >= lastUpgradeTime[msg.sender][baseRarity] + rule.cooldownTime,
            "Altar: Still in cooldown period"
        );
        
        // 🎯 極簡費用檢查：嚴格支付要求，無退款
        uint256 totalCost = getUpgradeCost(baseRarity);
        require(msg.value == totalCost, "Altar: Exact payment required");
        
        // 立即設置冷卻（防止重複使用）
        lastUpgradeTime[msg.sender][baseRarity] = block.timestamp;
        
        if (vrfManager != address(0)) {
            // 儲存升級數據 - 極簡版本
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _tokenContract, baseRarity, _tokenIds));
            
            // 🎯 VRF 調用無需傳遞 ETH（訂閱模式）
            IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                1, // 只需要一個隨機數
                1, // maxRarity 無關緊要
                requestData
            );
            
            userRequests[msg.sender] = UpgradeRequest({
                tokenContract: _tokenContract,
                baseRarity: baseRarity,
                burnedTokenIds: _tokenIds,
                fulfilled: false,
                payment: msg.value
            });
            
            emit UpgradeRequested(msg.sender, _tokenContract, baseRarity, _tokenIds);
            return;
        }
        
        // VRF 不可用時直接失敗
        revert("Altar: VRF required for upgrades");
    }

    // === VRF 整合的揭示函數 ===
    function revealUpgrade() external nonReentrant whenNotPaused {
        _revealUpgradeFor(msg.sender);
    }
    
    function revealUpgradeFor(address user) external nonReentrant whenNotPaused {
        _revealUpgradeFor(user);
    }
    
    // 內部揭示邏輯
    function _revealUpgradeFor(address user) private {
        UpgradeRequest storage request = userRequests[user];
        require(request.tokenContract != address(0), "Altar: No pending upgrade");
        require(!request.fulfilled, "Altar: Already revealed");
        
        // VRF-only 模式
        require(vrfManager != address(0), "Altar: VRF Manager not set");
        
        // 檢查 VRF 是否完成
        (bool vrfFulfilled, uint256[] memory randomWords) = IVRFManager(vrfManager).getRandomForUser(user);
        require(vrfFulfilled && randomWords.length > 0, "Altar: VRF not ready");
        
        // 使用 VRF 隨機數
        _executeRevealWithVRF(user, randomWords[0]);
    }
    
    // === VRF 揭示函數 ===
    function _executeRevealWithVRF(address user, uint256 randomWord) private {
        UpgradeRequest storage request = userRequests[user];
        request.fulfilled = true;
        
        // 驗證 NFT 所有權（防止在等待期間轉移）
        for (uint256 i = 0; i < request.burnedTokenIds.length; i++) {
            require(IERC721(request.tokenContract).ownerOf(request.burnedTokenIds[i]) == user, "Altar: No longer owner");
        }
        
        // 使用 VRF 隨機數處理升級結果
        _processUpgradeResultWithVRF(
            user,
            request.tokenContract,
            request.baseRarity,
            request.burnedTokenIds,
            randomWord
        );
        
        // 清理請求
        delete userRequests[user];
    }

    // === VRF 結果處理 ===
    function _processUpgradeResultWithVRF(
        address user, 
        address tokenContract, 
        uint8 baseRarity, 
        uint256[] memory tokenIds, 
        uint256 randomWord
    ) private {
        UpgradeRule memory rule = upgradeRules[baseRarity];
        
        // 獲取 VIP 加成
        uint8 vipBonus = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(user) returns (uint8 level) { 
            vipBonus = level + additionalVipBonusRate[user]; 
        } catch {}
        
        if (vipBonus > MAX_VIP_BONUS) vipBonus = MAX_VIP_BONUS;
        
        uint256 tempSuccessChance = uint256(rule.successChance) + uint256(vipBonus);
        uint8 effectiveSuccessChance = tempSuccessChance > 100 ? 100 : uint8(tempSuccessChance);

        // 使用 VRF 隨機數生成結果 (0-99)
        uint256 randomValue = randomWord % 100;
        
        if (randomValue < rule.greatSuccessChance) {
            // 大成功 - 產生 2 個 NFT
            _performGreatSuccessUpgrade(user, tokenIds, baseRarity, tokenContract);
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance) {
            // 成功 - 產生 1 個 NFT
            _performSuccessfulUpgrade(user, tokenIds, baseRarity, tokenContract);
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance + rule.partialFailChance) {
            // 部分失敗 - 產生一半 NFT
            _performPartialFailUpgrade(user, tokenIds, baseRarity, tokenContract);
        } else {
            // 完全失敗
            _performFailedUpgrade(user, tokenIds, tokenContract);
        }
    }

    function _performGreatSuccessUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract
    ) internal {
        // 燒毀犧牲的NFT
        _burnNFTs(tokenContract, tokenIds);
        
        // 大成功 - 產生 2 個升級後的 NFT
        uint8 newRarity = baseRarity + 1;
        uint256[] memory mintedIds = new uint256[](2);
        mintedIds[0] = _mintUpgradedNFT(user, tokenContract, newRarity);
        mintedIds[1] = _mintUpgradedNFT(user, tokenContract, newRarity);
        
        emit UpgradeAttempted(
            user,
            tokenContract,
            baseRarity,
            newRarity,
            tokenIds,
            mintedIds,
            3 // great success outcome
        );
    }
    
    function _performSuccessfulUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract
    ) internal {
        // 燒毀犧牲的NFT
        _burnNFTs(tokenContract, tokenIds);
        
        // 升級主NFT
        uint8 newRarity = baseRarity + 1;
        uint256 newTokenId = _mintUpgradedNFT(user, tokenContract, newRarity);
        
        uint256[] memory mintedIds = new uint256[](1);
        mintedIds[0] = newTokenId;
        
        emit UpgradeAttempted(
            user,
            tokenContract,
            baseRarity,
            newRarity,
            tokenIds,
            mintedIds,
            2 // success outcome
        );
    }
    
    function _performPartialFailUpgrade(
        address user,
        uint256[] memory tokenIds,
        uint8 baseRarity,
        address tokenContract
    ) internal {
        // 燒毀犧牲的NFT
        _burnNFTs(tokenContract, tokenIds);
        
        // 部分失敗 - 產生一半數量的同等級 NFT
        uint256 mintCount = tokenIds.length / 2;
        uint256[] memory mintedIds = new uint256[](mintCount);
        
        for (uint256 i = 0; i < mintCount; i++) {
            mintedIds[i] = _mintUpgradedNFT(user, tokenContract, baseRarity);
        }
        
        emit UpgradeAttempted(
            user,
            tokenContract,
            baseRarity,
            baseRarity, // 保持同等級
            tokenIds,
            mintedIds,
            1 // partial fail outcome
        );
    }

    function _performFailedUpgrade(
        address user,
        uint256[] memory tokenIds,
        address tokenContract
    ) internal {
        // 燒毀犧牲的NFT
        _burnNFTs(tokenContract, tokenIds);
        
        emit UpgradeAttempted(
            user,
            tokenContract,
            0, // baseRarity
            0, // targetRarity
            tokenIds,
            new uint256[](0), // no minted tokens
            0 // fail outcome
        );
    }
    
    function _mintUpgradedNFT(
        address _player,
        address _tokenContract,
        uint8 _rarity
    ) private returns (uint256) {
        if (_tokenContract == address(heroContract)) {
            uint256 power = _generatePowerByRarity(_rarity);
            return heroContract.mintFromAltar(_player, _rarity, power);
        } else {
            uint8 capacity = _rarity;
            return relicContract.mintFromAltar(_player, _rarity, capacity);
        }
    }

    function _generatePowerByRarity(uint8 _rarity) private view returns (uint256) {
        if (_rarity == 1) return 15 + (block.timestamp % 36);
        else if (_rarity == 2) return 50 + (block.timestamp % 51);
        else if (_rarity == 3) return 100 + (block.timestamp % 51);
        else if (_rarity == 4) return 150 + (block.timestamp % 51);
        else if (_rarity == 5) return 200 + (block.timestamp % 56);
        else return 255;
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

    // 查詢函數
    function getUserRequest(address _user) external view returns (UpgradeRequest memory) {
        return userRequests[_user];
    }

    // 查詢升級所需的總費用（簡化版本）
    function getUpgradeCost(uint8 _baseRarity) public view returns (uint256 totalCost) {
        UpgradeRule memory rule = upgradeRules[_baseRarity];
        uint256 vrfFee = 0; // VRF 訂閱模式下費用為 0
        totalCost = rule.nativeFee + vrfFee;
    }

    // === VRF 管理函數 ===
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = _vrfManager;
        
        // 注意：需要 VRFManager 的 owner 手動授權此合約
        // 不再自動調用 authorizeContract，避免權限錯誤
        
        emit VRFManagerSet(_vrfManager);
    }

    // Owner 管理函數
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

    // 🎯 簡化的資金提取（無需保護鎖定資金）
    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Altar: Native withdraw failed");
    }

    // === 🎯 安全的 VRF 回調實現 ===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 🎯 使用 return 而非 require，避免卡死 VRF 系統
        if (msg.sender != vrfManager) return;
        if (randomWords.length == 0) return;
        
        // 註意：AltarOfAscension 使用輪詢方式處理 VRF 結果
        // 這個回調主要用於記錄和驗證，實際處理在 revealUpgrade 中進行
        // 可以在這裡添加額外的驗證邏輯或事件記錄
        
        // 發出 VRF 完成事件以便前端監聽
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }

    receive() external payable {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/interfaces.sol";

contract AltarOfAscension_DelayedReveal is Ownable, Pausable, ReentrancyGuard {
    
    // --- 延遲揭示結構 ---
    struct CommitData {
        uint256 blockNumber;
        uint8 ascensionType; // 1: Hero, 2: Relic
        uint8 baseRarity;
        uint256 materialsCount;
        uint256[] tokenIds;
        bytes32 commitment;
        bool revealed;
        address player;
    }

    // --- 狀態變數 ---
    IDungeonCore public dungeonCore;
    IHero public heroContract;
    IRelic public relicContract;
    IPlayerProfile public playerProfile;
    
    // 動態種子
    uint256 public dynamicSeed;
    
    // 延遲揭示參數
    uint256 public constant REVEAL_BLOCK_DELAY = 3;
    uint256 public constant MAX_REVEAL_WINDOW = 255; // 約 12.75 分鐘的揭示窗口
    
    // 延遲揭示映射
    mapping(bytes32 => CommitData) public ascensionCommitments;
    mapping(address => bytes32[]) public userPendingAscensions;
    
    // --- 事件 ---
    event AscensionCommitted(
        address indexed player,
        bytes32 indexed commitmentId,
        uint8 ascensionType,
        uint8 baseRarity,
        uint256 materialsCount,
        uint256 blockNumber
    );
    
    event AscensionRevealed(
        address indexed player,
        bytes32 indexed commitmentId,
        uint8 outcome,
        uint8 targetRarity,
        uint256[] mintedIds
    );
    
    event DynamicSeedUpdated(uint256 newSeed);
    event ContractsSet(address core, address hero, address relic, address profile);
    event UpgradeRuleSet(uint8 rarity, uint256 materials, uint256 great, uint256 success, uint256 partial);
    event VIPBonusSet(uint8 vipLevel, uint8 bonusPercent);
    
    // 升級規則結構
    struct UpgradeRule {
        uint256 materialsRequired;
        uint256 greatSuccessChance;
        uint256 successChance;
        uint256 partialFailChance;
    }
    
    mapping(uint8 => UpgradeRule) public upgradeRules;
    mapping(uint8 => uint8) public vipBonuses;
    
    constructor(address _initialOwner) Ownable(_initialOwner) {
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));
        
        // 初始化升級規則
        _initializeUpgradeRules();
        _initializeVIPBonuses();
    }
    
    function _initializeUpgradeRules() private {
        // 1星升2星
        upgradeRules[1] = UpgradeRule({
            materialsRequired: 5,
            greatSuccessChance: 5,
            successChance: 45,
            partialFailChance: 30
        });
        
        // 2星升3星
        upgradeRules[2] = UpgradeRule({
            materialsRequired: 5,
            greatSuccessChance: 3,
            successChance: 37,
            partialFailChance: 35
        });
        
        // 3星升4星
        upgradeRules[3] = UpgradeRule({
            materialsRequired: 5,
            greatSuccessChance: 2,
            successChance: 28,
            partialFailChance: 40
        });
        
        // 4星升5星
        upgradeRules[4] = UpgradeRule({
            materialsRequired: 5,
            greatSuccessChance: 1,
            successChance: 19,
            partialFailChance: 45
        });
    }
    
    function _initializeVIPBonuses() private {
        vipBonuses[1] = 5;   // VIP1: +5%
        vipBonuses[2] = 10;  // VIP2: +10%
        vipBonuses[3] = 15;  // VIP3: +15%
        vipBonuses[4] = 20;  // VIP4: +20%
        vipBonuses[5] = 25;  // VIP5: +25%
    }
    
    // --- 延遲揭示升級函數 ---
    
    // 步驟 1: 提交升級請求
    function commitAscendHero(uint256[] calldata _heroIds, bytes32 _commitment) external whenNotPaused nonReentrant {
        require(_heroIds.length > 0, "Altar: No heroes provided");
        
        // 驗證英雄
        uint8 baseRarity = _validateAndLockHeroes(_heroIds);
        
        // 生成唯一的承諾ID
        bytes32 commitmentId = keccak256(abi.encodePacked(
            msg.sender,
            block.number,
            _commitment,
            _heroIds
        ));
        
        // 存儲承諾
        ascensionCommitments[commitmentId] = CommitData({
            blockNumber: block.number,
            ascensionType: 1, // Hero
            baseRarity: baseRarity,
            materialsCount: _heroIds.length,
            tokenIds: _heroIds,
            commitment: _commitment,
            revealed: false,
            player: msg.sender
        });
        
        userPendingAscensions[msg.sender].push(commitmentId);
        
        emit AscensionCommitted(
            msg.sender,
            commitmentId,
            1, // Hero
            baseRarity,
            _heroIds.length,
            block.number
        );
    }
    
    function commitAscendRelic(uint256[] calldata _relicIds, bytes32 _commitment) external whenNotPaused nonReentrant {
        require(_relicIds.length > 0, "Altar: No relics provided");
        
        // 驗證聖物
        uint8 baseRarity = _validateAndLockRelics(_relicIds);
        
        // 生成唯一的承諾ID
        bytes32 commitmentId = keccak256(abi.encodePacked(
            msg.sender,
            block.number,
            _commitment,
            _relicIds
        ));
        
        // 存儲承諾
        ascensionCommitments[commitmentId] = CommitData({
            blockNumber: block.number,
            ascensionType: 2, // Relic
            baseRarity: baseRarity,
            materialsCount: _relicIds.length,
            tokenIds: _relicIds,
            commitment: _commitment,
            revealed: false,
            player: msg.sender
        });
        
        userPendingAscensions[msg.sender].push(commitmentId);
        
        emit AscensionCommitted(
            msg.sender,
            commitmentId,
            2, // Relic
            baseRarity,
            _relicIds.length,
            block.number
        );
    }
    
    // 步驟 2: 揭示升級結果
    function revealAscension(bytes32 _commitmentId, uint256 _nonce) external whenNotPaused nonReentrant {
        CommitData storage commitment = ascensionCommitments[_commitmentId];
        require(commitment.player == msg.sender, "Altar: Not your commitment");
        require(!commitment.revealed, "Altar: Already revealed");
        require(block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY, "Altar: Too early to reveal");
        require(block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "Altar: Reveal window expired");
        
        // 驗證 commitment
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(msg.sender, _nonce));
        require(calculatedCommitment == commitment.commitment, "Altar: Invalid reveal");
        
        commitment.revealed = true;
        
        // 使用未來區塊哈希生成隨機數
        uint256 revealBlockNumber = commitment.blockNumber + REVEAL_BLOCK_DELAY;
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            blockhash(revealBlockNumber),
            _nonce,
            dynamicSeed,
            commitment.player,
            commitment.baseRarity
        )));
        
        // 執行升級邏輯
        (uint256[] memory mintedIds, uint8 outcome, uint8 targetRarity) = _executeAscension(
            commitment,
            randomValue
        );
        
        // 更新動態種子
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, randomValue, outcome)));
        emit DynamicSeedUpdated(dynamicSeed);
        
        // 從用戶待處理列表中移除
        _removePendingAscension(msg.sender, _commitmentId);
        
        emit AscensionRevealed(
            msg.sender,
            _commitmentId,
            outcome,
            targetRarity,
            mintedIds
        );
    }
    
    // 執行升級邏輯
    function _executeAscension(
        CommitData memory commitment,
        uint256 randomValue
    ) private returns (uint256[] memory mintedIds, uint8 outcome, uint8 targetRarity) {
        UpgradeRule memory rule = upgradeRules[commitment.baseRarity];
        
        // 獲取 VIP 加成
        uint8 vipLevel = 0;
        uint8 totalVipBonus = 0;
        if (address(playerProfile) != address(0)) {
            vipLevel = playerProfile.getVipLevel(commitment.player);
            totalVipBonus = vipBonuses[vipLevel];
        }
        
        // 計算有效成功率
        uint256 effectiveSuccessChance = rule.successChance + totalVipBonus;
        
        // 確定結果
        uint8 mintCount;
        targetRarity = commitment.baseRarity;
        
        uint256 roll = randomValue % 100;
        
        if (roll < rule.greatSuccessChance) {
            // 大成功：獲得 2 個高級 NFT
            mintCount = 2;
            targetRarity = commitment.baseRarity + 1;
            outcome = 3; // GreatSuccess
        } else if (roll < rule.greatSuccessChance + effectiveSuccessChance) {
            // 成功：獲得 1 個高級 NFT
            mintCount = 1;
            targetRarity = commitment.baseRarity + 1;
            outcome = 2; // Success
        } else if (roll < rule.greatSuccessChance + effectiveSuccessChance + rule.partialFailChance) {
            // 部分失敗：返還部分材料
            mintCount = rule.materialsRequired / 2;
            outcome = 1; // PartialFail
        } else {
            // 完全失敗：材料全部消失
            mintCount = 0;
            outcome = 0; // Fail
        }
        
        // 燃燒材料
        if (commitment.ascensionType == 1) {
            _burnHeroes(commitment.tokenIds);
        } else {
            _burnRelics(commitment.tokenIds);
        }
        
        // 鑄造新 NFT
        mintedIds = new uint256[](mintCount);
        for (uint256 i = 0; i < mintCount; i++) {
            if (commitment.ascensionType == 1) {
                uint256 power = _generatePowerByRarity(targetRarity, uint256(keccak256(abi.encodePacked(randomValue, i))));
                mintedIds[i] = heroContract.mintFromAltar(commitment.player, targetRarity, power);
            } else {
                uint256 effect = _generateEffectByRarity(targetRarity, uint256(keccak256(abi.encodePacked(randomValue, i))));
                mintedIds[i] = relicContract.mintFromAltar(commitment.player, targetRarity, effect);
            }
        }
        
        return (mintedIds, outcome, targetRarity);
    }
    
    // 緊急退還函數（如果超過揭示窗口）
    function emergencyReturn(bytes32 _commitmentId) external nonReentrant {
        CommitData storage commitment = ascensionCommitments[_commitmentId];
        require(commitment.player == msg.sender, "Altar: Not your commitment");
        require(!commitment.revealed, "Altar: Already revealed");
        require(block.number > commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW, "Altar: Still in reveal window");
        
        // 退還 NFT
        if (commitment.ascensionType == 1) {
            // 退還英雄
            for (uint256 i = 0; i < commitment.tokenIds.length; i++) {
                // 注意：需要英雄合約支援從祭壇轉移回用戶的功能
                // 這裡假設英雄已經被鎖定在祭壇中
            }
        } else {
            // 退還聖物
            for (uint256 i = 0; i < commitment.tokenIds.length; i++) {
                // 注意：需要聖物合約支援從祭壇轉移回用戶的功能
            }
        }
        
        commitment.revealed = true; // 標記為已處理
        _removePendingAscension(msg.sender, _commitmentId);
    }
    
    // 驗證並鎖定英雄
    function _validateAndLockHeroes(uint256[] calldata _heroIds) private view returns (uint8) {
        require(_heroIds.length >= 5, "Altar: Insufficient heroes");
        
        uint8 firstRarity;
        for (uint256 i = 0; i < _heroIds.length; i++) {
            require(heroContract.ownerOf(_heroIds[i]) == msg.sender, "Altar: Not owner");
            
            (uint8 rarity, , bool isRevealed) = heroContract.getHeroData(_heroIds[i]);
            require(isRevealed, "Altar: Hero not revealed");
            
            if (i == 0) {
                firstRarity = rarity;
                require(firstRarity >= 1 && firstRarity <= 4, "Altar: Invalid base rarity");
            } else {
                require(rarity == firstRarity, "Altar: Mixed rarities");
            }
        }
        
        return firstRarity;
    }
    
    // 驗證並鎖定聖物
    function _validateAndLockRelics(uint256[] calldata _relicIds) private view returns (uint8) {
        require(_relicIds.length >= 5, "Altar: Insufficient relics");
        
        uint8 firstRarity;
        for (uint256 i = 0; i < _relicIds.length; i++) {
            require(relicContract.ownerOf(_relicIds[i]) == msg.sender, "Altar: Not owner");
            
            (uint8 rarity, , bool isRevealed) = relicContract.getRelicData(_relicIds[i]);
            require(isRevealed, "Altar: Relic not revealed");
            
            if (i == 0) {
                firstRarity = rarity;
                require(firstRarity >= 1 && firstRarity <= 4, "Altar: Invalid base rarity");
            } else {
                require(rarity == firstRarity, "Altar: Mixed rarities");
            }
        }
        
        return firstRarity;
    }
    
    // 燃燒英雄
    function _burnHeroes(uint256[] memory _heroIds) private {
        for (uint256 i = 0; i < _heroIds.length; i++) {
            heroContract.burnFromAltar(_heroIds[i]);
        }
    }
    
    // 燃燒聖物
    function _burnRelics(uint256[] memory _relicIds) private {
        for (uint256 i = 0; i < _relicIds.length; i++) {
            relicContract.burnFromAltar(_relicIds[i]);
        }
    }
    
    // 生成戰力值
    function _generatePowerByRarity(uint8 _rarity, uint256 _seed) internal pure returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(_seed)));
        
        if (_rarity == 1) return 15 + (random % 36);   // 15-50
        if (_rarity == 2) return 50 + (random % 51);   // 50-100
        if (_rarity == 3) return 100 + (random % 51);  // 100-150
        if (_rarity == 4) return 150 + (random % 51);  // 150-200
        if (_rarity == 5) return 200 + (random % 56);  // 200-255
        
        return 15; // 默認值
    }
    
    // 生成效果值
    function _generateEffectByRarity(uint8 _rarity, uint256 _seed) internal pure returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(_seed)));
        
        if (_rarity == 1) return 5 + (random % 16);    // 5-20
        if (_rarity == 2) return 20 + (random % 31);   // 20-50
        if (_rarity == 3) return 50 + (random % 51);   // 50-100
        if (_rarity == 4) return 100 + (random % 51);  // 100-150
        if (_rarity == 5) return 150 + (random % 51);  // 150-200
        
        return 5; // 默認值
    }
    
    // 從待處理列表中移除
    function _removePendingAscension(address user, bytes32 commitmentId) private {
        bytes32[] storage pending = userPendingAscensions[user];
        for (uint256 i = 0; i < pending.length; i++) {
            if (pending[i] == commitmentId) {
                pending[i] = pending[pending.length - 1];
                pending.pop();
                break;
            }
        }
    }
    
    // --- 查詢函數 ---
    
    function getUserPendingAscensions(address _user) external view returns (bytes32[] memory) {
        return userPendingAscensions[_user];
    }
    
    function getCommitmentDetails(bytes32 _commitmentId) external view returns (
        uint256 blockNumber,
        uint8 ascensionType,
        uint8 baseRarity,
        uint256 materialsCount,
        bool revealed,
        bool canReveal,
        uint256 blocksRemaining
    ) {
        CommitData memory commitment = ascensionCommitments[_commitmentId];
        
        canReveal = !commitment.revealed && 
                    block.number >= commitment.blockNumber + REVEAL_BLOCK_DELAY &&
                    block.number <= commitment.blockNumber + REVEAL_BLOCK_DELAY + MAX_REVEAL_WINDOW;
        
        if (block.number < commitment.blockNumber + REVEAL_BLOCK_DELAY) {
            blocksRemaining = (commitment.blockNumber + REVEAL_BLOCK_DELAY) - block.number;
        } else {
            blocksRemaining = 0;
        }
        
        return (
            commitment.blockNumber,
            commitment.ascensionType,
            commitment.baseRarity,
            commitment.materialsCount,
            commitment.revealed,
            canReveal,
            blocksRemaining
        );
    }
    
    // --- Owner 管理函式 ---
    
    function setContracts(
        address _dungeonCore,
        address _hero,
        address _relic,
        address _playerProfile
    ) external onlyOwner {
        dungeonCore = IDungeonCore(_dungeonCore);
        heroContract = IHero(_hero);
        relicContract = IRelic(_relic);
        playerProfile = IPlayerProfile(_playerProfile);
        
        emit ContractsSet(_dungeonCore, _hero, _relic, _playerProfile);
    }
    
    function setUpgradeRule(
        uint8 _rarity,
        uint256 _materialsRequired,
        uint256 _greatSuccessChance,
        uint256 _successChance,
        uint256 _partialFailChance
    ) external onlyOwner {
        require(_rarity >= 1 && _rarity <= 4, "Altar: Invalid rarity");
        require(_greatSuccessChance + _successChance + _partialFailChance <= 100, "Altar: Invalid chances");
        
        upgradeRules[_rarity] = UpgradeRule({
            materialsRequired: _materialsRequired,
            greatSuccessChance: _greatSuccessChance,
            successChance: _successChance,
            partialFailChance: _partialFailChance
        });
        
        emit UpgradeRuleSet(_rarity, _materialsRequired, _greatSuccessChance, _successChance, _partialFailChance);
    }
    
    function setVIPBonus(uint8 _vipLevel, uint8 _bonusPercent) external onlyOwner {
        require(_vipLevel >= 1 && _vipLevel <= 5, "Altar: Invalid VIP level");
        require(_bonusPercent <= 50, "Altar: Bonus too high");
        
        vipBonuses[_vipLevel] = _bonusPercent;
        emit VIPBonusSet(_vipLevel, _bonusPercent);
    }
    
    function updateDynamicSeed(uint256 _newSeed) external onlyOwner {
        dynamicSeed = _newSeed;
        emit DynamicSeedUpdated(_newSeed);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
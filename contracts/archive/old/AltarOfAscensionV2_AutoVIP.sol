// AltarOfAscensionV2_AutoVIP.sol - 自動VIP加成版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

contract AltarOfAscensionV2_AutoVIP is Ownable, ReentrancyGuard, Pausable {
    IDungeonCore public dungeonCore;
    IHero public heroContract;
    IRelic public relicContract;

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
        uint8 greatSuccessChance;  // 雙倍成功
        uint8 successChance;        // 普通成功
        uint8 partialFailChance;    // 部分返還
        uint256 cooldownTime;       // 冷卻時間
        bool isActive;              // 是否啟用
    }
    mapping(uint8 => UpgradeRule) public upgradeRules;
    
    // 玩家冷卻追蹤
    mapping(address => mapping(uint8 => uint256)) public lastUpgradeTime;
    
    // ★ 新增：額外VIP加成（由管理員設置，會與自動VIP加成疊加）
    mapping(address => uint8) public additionalVipBonusRate;
    
    // 動態種子
    uint256 public dynamicSeed;
    
    // 事件
    event UpgradeAttempted(
        address indexed player,
        address indexed tokenContract,
        uint8 baseRarity,
        uint8 targetRarity,
        uint256[] burnedTokenIds,
        uint256[] mintedTokenIds,
        uint8 outcome,
        uint256 fee,
        uint8 vipLevel,           // ★ 新增：記錄VIP等級
        uint8 totalVipBonus      // ★ 新增：記錄總VIP加成
    );
    
    event PlayerStatsUpdated(
        address indexed player,
        uint256 totalAttempts,
        uint256 totalBurned,
        uint256 totalMinted
    );

    event DynamicSeedUpdated(uint256 newSeed);
    event UpgradeRuleSet(uint8 indexed fromRarity, UpgradeRule rule);
    event AdditionalVIPBonusSet(address indexed player, uint8 bonusRate);

    constructor(address _initialOwner) Ownable(_initialOwner) {
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));
        
        // 初始化升級規則
        upgradeRules[1] = UpgradeRule({
            materialsRequired: 5,
            nativeFee: 0.005 ether,
            greatSuccessChance: 5,
            successChance: 65,
            partialFailChance: 28,
            cooldownTime: 1 hours,
            isActive: true
        });
        
        upgradeRules[2] = UpgradeRule({
            materialsRequired: 4,
            nativeFee: 0.01 ether,
            greatSuccessChance: 4,
            successChance: 51,
            partialFailChance: 35,
            cooldownTime: 2 hours,
            isActive: true
        });
        
        upgradeRules[3] = UpgradeRule({
            materialsRequired: 3,
            nativeFee: 0.02 ether,
            greatSuccessChance: 3,
            successChance: 32,
            partialFailChance: 45,
            cooldownTime: 4 hours,
            isActive: true
        });
        
        upgradeRules[4] = UpgradeRule({
            materialsRequired: 2,
            nativeFee: 0.05 ether,
            greatSuccessChance: 2,
            successChance: 18,
            partialFailChance: 50,
            cooldownTime: 8 hours,
            isActive: true
        });
    }

    // ★ 主要升級函數（自動VIP加成版）
    function upgradeNFTs(
        address _tokenContract,
        uint256[] calldata _tokenIds
    ) external payable whenNotPaused nonReentrant {
        // 驗證材料
        uint8 baseRarity = _validateMaterials(_tokenContract, _tokenIds);
        UpgradeRule memory rule = upgradeRules[baseRarity];
        
        require(rule.isActive, "Altar: Upgrades for this rarity are disabled");
        require(rule.materialsRequired > 0, "Altar: Upgrades not configured");
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
        
        // 處理升級結果（包含VIP加成）
        (uint256[] memory mintedIds, uint8 outcome, uint8 targetRarity, uint8 vipLevel, uint8 totalVipBonus) = _processUpgradeOutcome(
            msg.sender,
            _tokenContract,
            baseRarity
        );
        
        // 更新統計
        _updateStats(msg.sender, _tokenIds.length, mintedIds.length, msg.value);
        
        // 更新冷卻時間
        lastUpgradeTime[msg.sender][baseRarity] = block.timestamp;
        
        // 發送詳細事件（包含VIP信息）
        emit UpgradeAttempted(
            msg.sender,
            _tokenContract,
            baseRarity,
            targetRarity,
            burnedIds,
            mintedIds,
            outcome,
            msg.value,
            vipLevel,
            totalVipBonus
        );
    }
    
    // ★ 修正：自動獲取VIP等級並計算加成
    function _processUpgradeOutcome(
        address _player,
        address _tokenContract,
        uint8 _baseRarity
    ) private returns (uint256[] memory mintedIds, uint8 outcome, uint8 targetRarity, uint8 vipLevel, uint8 totalVipBonus) {
        // 計算隨機結果
        uint256 randomValue = _generateRandom(_player, _baseRarity);
        UpgradeRule memory rule = upgradeRules[_baseRarity];
        
        // ★ 關鍵改進：自動獲取VIP等級（參考DungeonMaster實現）
        vipLevel = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player) returns (uint8 level) {
            vipLevel = level;
        } catch {
            // 如果獲取失敗，VIP等級為0
        }
        
        // ★ 計算總VIP加成：自動VIP等級 + 額外管理員設置的加成
        totalVipBonus = vipLevel + additionalVipBonusRate[_player];
        
        // 應用VIP加成到成功率
        uint8 effectiveSuccessChance = rule.successChance + totalVipBonus;
        
        // 防止成功率溢出（考慮到大成功率 + 成功率 + 部分失敗率應該合理）
        if (effectiveSuccessChance > 100) {
            effectiveSuccessChance = 100;
        }
        
        uint256 mintCount = 0;
        targetRarity = _baseRarity;
        
        if (randomValue < rule.greatSuccessChance) {
            // 大成功：獲得 2 個高級 NFT
            mintCount = 2;
            targetRarity = _baseRarity + 1;
            outcome = 3;
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance) {
            // 成功：獲得 1 個高級 NFT
            mintCount = 1;
            targetRarity = _baseRarity + 1;
            outcome = 2;
        } else if (randomValue < rule.greatSuccessChance + effectiveSuccessChance + rule.partialFailChance) {
            // 部分失敗：返還部分材料
            mintCount = rule.materialsRequired / 2;
            targetRarity = _baseRarity;
            outcome = 1;
        } else {
            // 完全失敗：無任何返還
            mintCount = 0;
            outcome = 0;
        }
        
        // 鑄造新NFT
        mintedIds = new uint256[](mintCount);
        for (uint i = 0; i < mintCount; i++) {
            uint256 newTokenId = _mintNFT(_tokenContract, _player, targetRarity);
            mintedIds[i] = newTokenId;
        }
    }

    // ★ 新增：查看玩家的VIP加成信息
    function getPlayerVipInfo(address _player) external view returns (
        uint8 currentVipLevel,
        uint8 additionalBonus,
        uint8 totalVipBonus
    ) {
        // 獲取當前VIP等級
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_player) returns (uint8 level) {
            currentVipLevel = level;
        } catch {
            currentVipLevel = 0;
        }
        
        additionalBonus = additionalVipBonusRate[_player];
        totalVipBonus = currentVipLevel + additionalBonus;
    }

    // ★ 新增：管理員設置額外VIP加成（與自動VIP加成疊加）
    function setAdditionalVIPBonus(address _player, uint8 _bonusRate) external onlyOwner {
        require(_bonusRate <= 20, "Altar: Additional bonus too high"); // 最高額外20%加成
        additionalVipBonusRate[_player] = _bonusRate;
        emit AdditionalVIPBonusSet(_player, _bonusRate);
    }

    // ★ 新增：批量設置VIP加成（方便管理員操作）
    function batchSetAdditionalVIPBonus(
        address[] calldata _players, 
        uint8[] calldata _bonusRates
    ) external onlyOwner {
        require(_players.length == _bonusRates.length, "Altar: Arrays length mismatch");
        
        for (uint i = 0; i < _players.length; i++) {
            require(_bonusRates[i] <= 20, "Altar: Additional bonus too high");
            additionalVipBonusRate[_players[i]] = _bonusRates[i];
            emit AdditionalVIPBonusSet(_players[i], _bonusRates[i]);
        }
    }

    // ★ 新增：預覽升級結果（包含VIP加成計算）
    function previewUpgradeSuccess(address _player, uint8 _baseRarity) external view returns (
        uint8 greatSuccessChance,
        uint8 effectiveSuccessChance,
        uint8 partialFailChance,
        uint8 completeFailChance,
        uint8 playerVipLevel,
        uint8 totalVipBonus
    ) {
        UpgradeRule memory rule = upgradeRules[_baseRarity];
        
        // 獲取玩家VIP信息
        (playerVipLevel, , totalVipBonus) = this.getPlayerVipInfo(_player);
        
        // 計算各種成功率
        greatSuccessChance = rule.greatSuccessChance;
        effectiveSuccessChance = rule.successChance + totalVipBonus;
        if (effectiveSuccessChance > 100) effectiveSuccessChance = 100;
        
        partialFailChance = rule.partialFailChance;
        
        // 計算完全失敗率
        uint256 totalSuccess = greatSuccessChance + effectiveSuccessChance + partialFailChance;
        if (totalSuccess >= 100) {
            completeFailChance = 0;
        } else {
            completeFailChance = uint8(100 - totalSuccess);
        }
    }

    // 以下為輔助函數（與原版本相同，此處省略詳細實現）
    function _validateMaterials(address _tokenContract, uint256[] calldata _tokenIds) private view returns (uint8) {
        // 驗證材料邏輯...
        return 1; // 簡化示例
    }

    function _burnNFTs(address _tokenContract, uint256[] calldata _tokenIds) private {
        // 燃燒NFT邏輯...
    }

    function _mintNFT(address _tokenContract, address _to, uint8 _rarity) private returns (uint256) {
        // 鑄造NFT邏輯...
        return 1; // 簡化示例
    }

    function _generateRandom(address _player, uint8 _baseRarity) private returns (uint256) {
        // 隨機數生成邏輯...
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, block.timestamp, _player, _baseRarity)));
        return dynamicSeed % 100;
    }

    function _updateStats(address _player, uint256 _burned, uint256 _minted, uint256 _fee) private {
        // 統計更新邏輯...
    }

    // 管理函數
    function setDungeonCore(address _dungeonCore) external onlyOwner {
        dungeonCore = IDungeonCore(_dungeonCore);
    }

    function setUpgradeRule(uint8 _fromRarity, UpgradeRule calldata _rule) external onlyOwner {
        upgradeRules[_fromRarity] = _rule;
        emit UpgradeRuleSet(_fromRarity, _rule);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawBNB() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
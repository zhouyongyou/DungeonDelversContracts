// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces.sol";

/**
 * @title Party - 最終優化版本
 * @notice 從根本解決戰力讀取問題，提供清晰、高效的數據結構
 * @dev 核心改進：
 * 1. 使用獨立 mapping 儲存關鍵數據
 * 2. 提供標準化的查詢接口
 * 3. 實時更新機制
 * 4. 完整的事件記錄
 */
contract Party is ERC721, ERC721Holder, Ownable, ReentrancyGuard {
    // --- 核心狀態變數 ---
    uint256 private _nextTokenId = 1;
    IDungeonCore public dungeonCore;
    string public baseURI;
    
    // ⭐ 核心設計：分離式數據儲存
    // 基礎數據 - 直接 mapping 存取，gas 效率最高
    mapping(uint256 => uint256) public partyPower;      // 隊伍ID => 總戰力
    mapping(uint256 => uint256) public partyCapacity;   // 隊伍ID => 總容量
    mapping(uint256 => uint8) public partyRarity;       // 隊伍ID => 稀有度
    mapping(uint256 => uint256) public partyMemberCount; // 隊伍ID => 成員數量
    
    // 組成細節 - 用於查詢和管理
    mapping(uint256 => uint256[]) public partyHeroes;   // 隊伍ID => 英雄ID陣列
    mapping(uint256 => uint256[]) public partyRelics;   // 隊伍ID => 聖物ID陣列
    
    // 狀態追踪
    mapping(uint256 => uint256) public lastActionTime;  // 隊伍ID => 最後行動時間
    mapping(uint256 => bool) public isLocked;           // 隊伍ID => 是否鎖定（探險中）
    
    // 英雄反向索引 - 快速查詢英雄所在隊伍
    mapping(uint256 => uint256) public heroToParty;     // 英雄ID => 隊伍ID
    
    // --- 常數 ---
    uint256 public constant MAX_HEROES_PER_PARTY = 5;
    uint256 public constant MAX_RELICS_PER_PARTY = 10;
    uint256 public constant COOLDOWN_DURATION = 1 hours;
    
    // --- 事件 ---
    event PartyCreated(
        uint256 indexed partyId,
        address indexed creator,
        uint256 totalPower,
        uint256 totalCapacity,
        uint8 partyRarity
    );
    
    event PartyUpdated(
        uint256 indexed partyId,
        uint256 oldPower,
        uint256 newPower,
        string reason
    );
    
    event HeroAdded(uint256 indexed partyId, uint256 indexed heroId);
    event HeroRemoved(uint256 indexed partyId, uint256 indexed heroId);
    event RelicEquipped(uint256 indexed partyId, uint256 indexed relicId);
    event RelicUnequipped(uint256 indexed partyId, uint256 indexed relicId);
    event PartyLocked(uint256 indexed partyId, uint256 duration);
    event PartyUnlocked(uint256 indexed partyId);
    
    // --- 構造函數 ---
    constructor(
        address initialOwner,
        string memory initialBaseURI
    ) ERC721("Dungeon Delvers Party V3", "PARTY") Ownable(initialOwner) {
        baseURI = initialBaseURI;
    }
    
    // --- 核心功能：創建隊伍 ---
    function createParty(
        uint256[] calldata _heroIds,
        uint256[] calldata _relicIds
    ) external nonReentrant returns (uint256 partyId) {
        require(address(dungeonCore) != address(0), "Party: Core not set");
        require(_heroIds.length > 0, "Party: Need heroes");
        require(_heroIds.length <= MAX_HEROES_PER_PARTY, "Party: Too many heroes");
        require(_relicIds.length <= MAX_RELICS_PER_PARTY, "Party: Too many relics");
        
        IHero heroContract = IHero(dungeonCore.heroContractAddress());
        IRelic relicContract = IRelic(dungeonCore.relicContractAddress());
        
        // 計算總戰力和容量
        uint256 totalPower = 0;
        uint256 totalCapacity = 0;
        
        // 驗證並計算英雄數據
        for (uint256 i = 0; i < _heroIds.length; i++) {
            uint256 heroId = _heroIds[i];
            require(heroContract.ownerOf(heroId) == msg.sender, "Party: Not hero owner");
            require(heroToParty[heroId] == 0, "Party: Hero in another party");
            
            (uint8 rarity, uint256 power) = heroContract.getHeroProperties(heroId);
            totalPower += power;
            // 假設容量基於稀有度計算
            uint256 capacity = rarity * 2;
            totalCapacity += capacity;
        }
        
        // 驗證聖物
        require(totalCapacity >= _relicIds.length, "Party: Insufficient capacity");
        for (uint256 i = 0; i < _relicIds.length; i++) {
            require(relicContract.ownerOf(_relicIds[i]) == msg.sender, "Party: Not relic owner");
        }
        
        // 鑄造 NFT
        partyId = _nextTokenId++;
        _safeMint(msg.sender, partyId);
        
        // 儲存數據到獨立 mapping
        partyPower[partyId] = totalPower;
        partyCapacity[partyId] = totalCapacity;
        partyRarity[partyId] = _calculateRarity(totalCapacity);
        partyMemberCount[partyId] = _heroIds.length;
        lastActionTime[partyId] = block.timestamp;
        
        // 轉移資產並記錄
        for (uint256 i = 0; i < _heroIds.length; i++) {
            uint256 heroId = _heroIds[i];
            heroContract.safeTransferFrom(msg.sender, address(this), heroId);
            partyHeroes[partyId].push(heroId);
            heroToParty[heroId] = partyId;
            emit HeroAdded(partyId, heroId);
        }
        
        for (uint256 i = 0; i < _relicIds.length; i++) {
            relicContract.safeTransferFrom(msg.sender, address(this), _relicIds[i]);
            partyRelics[partyId].push(_relicIds[i]);
            emit RelicEquipped(partyId, _relicIds[i]);
        }
        
        emit PartyCreated(partyId, msg.sender, totalPower, totalCapacity, partyRarity[partyId]);
    }
    
    // --- 核心查詢接口（為 DungeonMaster 優化）---
    
    /**
     * @dev 最簡單直接的戰力查詢 - DungeonMaster 主要使用這個
     */
    function getPower(uint256 _partyId) external view returns (uint256) {
        require(_ownerOf(_partyId) != address(0), "Party: Invalid party");
        return partyPower[_partyId];
    }
    
    /**
     * @dev 獲取隊伍基礎資訊
     */
    function getPartyInfo(uint256 _partyId) external view returns (
        uint256 power,
        uint256 capacity,
        uint8 rarity,
        uint256 memberCount,
        bool locked
    ) {
        require(_ownerOf(_partyId) != address(0), "Party: Invalid party");
        return (
            partyPower[_partyId],
            partyCapacity[_partyId],
            partyRarity[_partyId],
            partyMemberCount[_partyId],
            isLocked[_partyId]
        );
    }
    
    /**
     * @dev 檢查隊伍是否可以行動
     */
    function canAct(uint256 _partyId) external view returns (bool) {
        if (_ownerOf(_partyId) == address(0)) return false;
        if (isLocked[_partyId]) return false;
        if (block.timestamp < lastActionTime[_partyId] + COOLDOWN_DURATION) return false;
        return true;
    }
    
    /**
     * @dev 獲取隊伍成員
     */
    function getPartyMembers(uint256 _partyId) external view returns (
        uint256[] memory heroes,
        uint256[] memory relics
    ) {
        require(_ownerOf(_partyId) != address(0), "Party: Invalid party");
        return (partyHeroes[_partyId], partyRelics[_partyId]);
    }
    
    // --- 隊伍管理功能 ---
    
    /**
     * @dev 添加英雄到隊伍
     */
    function addHero(uint256 _partyId, uint256 _heroId) external nonReentrant {
        require(ownerOf(_partyId) == msg.sender, "Party: Not party owner");
        require(!isLocked[_partyId], "Party: Party locked");
        require(partyMemberCount[_partyId] < MAX_HEROES_PER_PARTY, "Party: Party full");
        require(heroToParty[_heroId] == 0, "Party: Hero in another party");
        
        IHero heroContract = IHero(dungeonCore.heroContractAddress());
        require(heroContract.ownerOf(_heroId) == msg.sender, "Party: Not hero owner");
        
        // 更新戰力
        (uint8 rarity, uint256 power) = heroContract.getHeroProperties(_heroId);
        uint256 capacity = rarity * 2; // 假設容量基於稀有度計算
        uint256 oldPower = partyPower[_partyId];
        partyPower[_partyId] += power;
        partyCapacity[_partyId] += capacity;
        partyMemberCount[_partyId]++;
        
        // 轉移英雄
        heroContract.safeTransferFrom(msg.sender, address(this), _heroId);
        partyHeroes[_partyId].push(_heroId);
        heroToParty[_heroId] = _partyId;
        
        emit HeroAdded(_partyId, _heroId);
        emit PartyUpdated(_partyId, oldPower, partyPower[_partyId], "Hero added");
    }
    
    /**
     * @dev 更新隊伍戰力（當英雄升級時調用）
     */
    function updatePartyPower(uint256 _partyId) external {
        require(_ownerOf(_partyId) != address(0), "Party: Invalid party");
        
        IHero heroContract = IHero(dungeonCore.heroContractAddress());
        uint256[] memory heroes = partyHeroes[_partyId];
        
        uint256 newPower = 0;
        uint256 newCapacity = 0;
        
        for (uint256 i = 0; i < heroes.length; i++) {
            if (heroes[i] > 0) {
                (uint8 rarity, uint256 power) = heroContract.getHeroProperties(heroes[i]);
                uint256 capacity = rarity * 2; // 假設容量基於稀有度計算
                newPower += power;
                newCapacity += capacity;
            }
        }
        
        uint256 oldPower = partyPower[_partyId];
        partyPower[_partyId] = newPower;
        partyCapacity[_partyId] = newCapacity;
        
        emit PartyUpdated(_partyId, oldPower, newPower, "Power recalculated");
    }
    
    // --- DungeonMaster 專用接口 ---
    
    /**
     * @dev 鎖定隊伍（開始探險時）
     */
    function lockParty(uint256 _partyId, uint256 _duration) external {
        require(msg.sender == dungeonCore.dungeonMasterAddress(), "Party: Only DungeonMaster");
        require(_ownerOf(_partyId) != address(0), "Party: Invalid party");
        
        isLocked[_partyId] = true;
        lastActionTime[_partyId] = block.timestamp;
        
        emit PartyLocked(_partyId, _duration);
    }
    
    /**
     * @dev 解鎖隊伍（探險結束時）
     */
    function unlockParty(uint256 _partyId) external {
        require(msg.sender == dungeonCore.dungeonMasterAddress(), "Party: Only DungeonMaster");
        
        isLocked[_partyId] = false;
        emit PartyUnlocked(_partyId);
    }
    
    // --- 輔助函數 ---
    function _calculateRarity(uint256 _capacity) private pure returns (uint8) {
        if (_capacity >= 25) return 5;
        if (_capacity >= 20) return 4;
        if (_capacity >= 15) return 3;
        if (_capacity >= 10) return 2;
        return 1;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }
    
    function setDungeonCore(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Party: Invalid address");
        dungeonCore = IDungeonCore(_newAddress);
    }
    
    // --- 緊急功能 ---
    function emergencyUnlock(uint256 _partyId) external onlyOwner {
        isLocked[_partyId] = false;
        emit PartyUnlocked(_partyId);
    }
}
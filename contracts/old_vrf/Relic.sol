// Relic_final.sol - 最終版本（安全回調 + 接口匹配）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Relic is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct RelicData {
        uint8 rarity;
        uint8 capacity;
        bool isRevealed;  // 保留但永遠為 true（向後相容）
    }
    mapping(uint256 => RelicData) public relicData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;

    // === VRF 相關 ===
    address public vrfManager;
    mapping(uint256 => address) public requestIdToUser; // 🎯 重要：標準回調需要

    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    
    
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds;
    }
    
    mapping(address => MintRequest) public userRequests;

    // --- 事件 ---
    event RelicMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event AscensionAltarSet(address indexed newAddress);
    event RelicBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event MintRequested(address indexed player, uint256 quantity, bool fromVault);
    event VRFManagerSet(address indexed vrfManager);
    
    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "Relic: Not authorized - only Altar of Ascension can call");
        _;
    }
    
    constructor(
        address initialOwner
    ) ERC721("Dungeon Delvers Relic", "DDR") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    // === VRF 整合的鑄造函數 ===
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity - must be between 1 and 50");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Relic: Previous mint request still pending");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Relic: Insufficient payment provided");
        
        // SoulShard 支付
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        // 預先鑄造 NFT
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            relicData[tokenId] = RelicData({
                rarity: 0,
                capacity: 0,
                isRevealed: false  // 暫時為 false，回調後變 true
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        require(vrfManager != address(0), "VRF not configured");
        
        // 🎯 調用 VRF（注意：接口定義為 payable，但訂閱模式不需要傳 ETH）
        uint256 requestId = IVRFManager(vrfManager).requestRandomForUser{value: 0}(
            msg.sender,
            1,  // 🎯 優化：只請求 1 個隨機數（足夠生成所有 NFT 的種子）
            maxRarity,
            requestData
        );
        
        // 🎯 重要：記錄 requestId 對應關係
        requestIdToUser[requestId] = msg.sender;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: false,
            pendingTokenIds: tokenIds
        });
        
        emit MintRequested(msg.sender, _quantity, false);
    }

    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity - must be between 1 and 50");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Relic: Previous mint request still pending");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Relic: Insufficient value for vault mint");
        
        // 從金庫扣除 SoulShard
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        // 預先鑄造 NFT
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            relicData[tokenId] = RelicData({
                rarity: 0,
                capacity: 0,
                isRevealed: false
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        require(vrfManager != address(0), "VRF not configured");
        
        // 🎯 調用 VRF（明確指定 value: 0）
        uint256 requestId = IVRFManager(vrfManager).requestRandomForUser{value: 0}(
            msg.sender,
            1,  // 🎯 優化：只請求 1 個隨機數（足夠生成所有 NFT 的種子）
            maxRarity,
            requestData
        );
        
        // 🎯 重要：記錄 requestId 對應關係
        requestIdToUser[requestId] = msg.sender;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: true,
            pendingTokenIds: tokenIds
        });
        
        emit MintRequested(msg.sender, _quantity, true);
    }

    // === 🎯 標準 VRF 回調實現（安全模式）===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 🎯 重要：使用 return 而非 require（避免卡死 VRF）
        if (msg.sender != vrfManager) return;
        if (randomWords.length == 0) return;
        
        // 🎯 使用 requestId 映射找到用戶
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        MintRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // 標記為已完成
        request.fulfilled = true;
        
        uint256[] memory tokenIds = request.pendingTokenIds;
        
        // 🎯 使用單一隨機數為所有 NFT 生成種子
        uint256 baseRandomWord = randomWords[0];
        
        // 揭示每個 NFT
        for (uint256 i = 0; i < request.quantity; i++) {
            uint256 tokenId = tokenIds[i];
            
            // 確保 NFT 仍屬於用戶（防護措施）
            if (ownerOf(tokenId) != user) continue;
            
            // 🎯 為每個 NFT 生成唯一的種子（使用 tokenId 和 index 確保唯一性）
            uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(baseRandomWord, tokenId, i)));
            uint8 rarity = _determineRarityFromSeed(uniqueSeed, user, request.quantity);
            uint8 capacity = rarity; // Capacity equals rarity for relics
            
            relicData[tokenId] = RelicData({
                rarity: rarity,
                capacity: capacity,
                isRevealed: true  // 永遠為 true
            });
            
            emit RelicMinted(tokenId, user, rarity, capacity);
        }
        
        emit BatchMintCompleted(user, request.quantity, request.maxRarity, tokenIds);
        
        // 🎯 清理數據
        delete requestIdToUser[requestId];
        delete userRequests[user];
    }


    // === VRF 稀有度計算 ===
    function _determineRarityFromSeed(uint256 randomValue, address user, uint256 quantity) internal pure returns (uint8) {
        uint256 rarityRoll = randomValue % 100;
        uint8 rarity;
        
        if (rarityRoll < 44) rarity = 1;
        else if (rarityRoll < 79) rarity = 2;
        else if (rarityRoll < 94) rarity = 3;
        else if (rarityRoll < 99) rarity = 4;
        else rarity = 5;
        
        return rarity;
    }


    function _mintRelic(address _to, uint8 _rarity, uint8 _capacity) private returns (uint256) {
        uint256 tokenId = _nextTokenId;
        relicData[tokenId] = RelicData({
            rarity: _rarity,
            capacity: _capacity,
            isRevealed: true  // 祭壇鑄造直接為 true
        });
        _safeMint(_to, tokenId);
        _nextTokenId++;
        emit RelicMinted(tokenId, _to, _rarity, _capacity);
        return tokenId;
    }

    function mintFromAltar(address _to, uint8 _rarity, uint8 _capacity) external onlyAltar returns (uint256) {
        return _mintRelic(_to, _rarity, _capacity);
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        RelicData memory data = relicData[_tokenId];
        // 移除 isRevealed 檢查（永遠為 true）
        emit RelicBurned(_tokenId, owner, data.rarity, data.capacity);
        _burn(_tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // 簡化：直接返回 baseURI（移除未揭示檢查）
        require(bytes(baseURI).length > 0, "Relic: Base URI not configured");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "Relic: DungeonCore contract not set");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }

    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity) {
        _requireOwned(tokenId);
        RelicData memory data = relicData[tokenId];
        // 移除 isRevealed 檢查（永遠為 true）
        return (data.rarity, data.capacity);
    }

    function getUserRequest(address _user) external view returns (MintRequest memory) {
        return userRequests[_user];
    }

    // === VRF 管理函數 ===
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = _vrfManager;
        
        // 注意：需要 VRFManager 的 owner 手動授權此合約
        // 不再自動調用 authorizeContract，避免權限錯誤
        
        emit VRFManagerSet(_vrfManager);
    }

    // --- Owner 管理函式 ---
    

    function setDungeonCore(address _address) public onlyOwner {
        dungeonCore = IDungeonCore(_address);
        emit ContractsSet(_address, address(soulShardToken));
    }

    function setSoulShardToken(address _address) public onlyOwner {
        soulShardToken = IERC20(_address);
        emit ContractsSet(address(dungeonCore), _address);
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    function setAscensionAltarAddress(address _address) public onlyOwner {
        ascensionAltarAddress = _address;
        emit AscensionAltarSet(_address);
    }

    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice * 1e18;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawSoulShard() public onlyOwner {
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) soulShardToken.safeTransfer(owner(), balance);
    }

    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Relic: ETH transfer failed");
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }


    receive() external payable {}
}


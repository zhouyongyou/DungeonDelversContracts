// Hero_simplified.sol - 簡化版標準回調（移除不必要功能）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Hero is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct HeroData {
        uint8 rarity;
        uint256 power;
        bool isRevealed;  // 🎯 保留但永遠為 true（向後相容）
    }
    mapping(uint256 => HeroData) public heroData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;

    // === VRF 相關 ===
    address public vrfManager;
    mapping(uint256 => address) public requestIdToUser; // 標準回調需要

    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    
    // 🎯 移除：unrevealedURI（不再需要）
    
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds; // 記錄待處理的 tokenIds
    }
    
    mapping(address => MintRequest) public userRequests;

    // --- 事件（移除 HeroRevealed）---
    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event AscensionAltarSet(address indexed newAddress);
    event HeroBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event MintRequested(address indexed player, uint256 quantity, bool fromVault);
    // 🎯 移除：event HeroRevealed（與 HeroMinted 重複）
    // === VRF 事件 ===
    event VRFManagerSet(address indexed vrfManager);
    
    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "NA");
        _;
    }
    
    constructor(
        address initialOwner
    ) ERC721("Dungeon Delvers Hero", "DDH") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    // === VRF 整合的鑄造函數（保持原邏輯）===
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "IQ");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "PM");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "IP");
        
        // SoulShard 支付
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        // 預先鑄造 NFT（直接設為已揭示，因為會立即獲得屬性）
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            // 🎯 優化：先設置佔位數據，稍後在回調中更新
            heroData[tokenId] = HeroData({
                rarity: 0,
                power: 0,
                isRevealed: false  // 暫時為 false，回調後變 true
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        require(vrfManager != address(0), "VRF not configured");
        
        uint256 requestId = IVRFManager(vrfManager).requestRandomForUser(
            msg.sender,
            _quantity,
            maxRarity,
            requestData
        );
        
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
        require(_quantity > 0 && _quantity <= 50, "IQ");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "PM");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "IV");
        
        // 從金庫扣除 SoulShard
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        // 預先鑄造 NFT
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            heroData[tokenId] = HeroData({
                rarity: 0,
                power: 0,
                isRevealed: false  // 暫時為 false
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        require(vrfManager != address(0), "VRF not configured");
        
        uint256 requestId = IVRFManager(vrfManager).requestRandomForUser(
            msg.sender,
            _quantity,
            maxRarity,
            requestData
        );
        
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

    // === 標準 VRF 回調實現 ===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 使用 return 而非 require（避免卡死 VRF）
        if (msg.sender != vrfManager) return;
        
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        MintRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // 直接在回調中處理
        request.fulfilled = true;
        
        uint256[] memory tokenIds = request.pendingTokenIds;
        
        // 揭示每個 NFT
        for (uint256 i = 0; i < request.quantity && i < randomWords.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // 確保 NFT 仍屬於用戶
            if (ownerOf(tokenId) != user) continue;
            
            // 使用 VRF 隨機數生成屬性
            uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(randomWords[0], tokenId)));
            uint8 rarity = _determineRarityFromSeed(uniqueSeed, user, request.quantity);
            uint256 power = _generateHeroPowerByRarity(rarity, uniqueSeed);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true  // 🎯 永遠為 true
            });
            
            emit HeroMinted(tokenId, user, rarity, power);
            // 🎯 移除：emit HeroRevealed（重複）
        }
        
        emit BatchMintCompleted(user, request.quantity, request.maxRarity, tokenIds);
        
        // 清理數據
        delete requestIdToUser[requestId];
        delete userRequests[user];
    }

    // === VRF 稀有度計算 ===
    function _determineRarityFromSeed(uint256 randomValue, address user, uint256 quantity) internal returns (uint8) {
        uint256 rarityRoll = randomValue % 100;
        uint8 rarity;
        
        if (rarityRoll < 44) rarity = 1;
        else if (rarityRoll < 79) rarity = 2;
        else if (rarityRoll < 94) rarity = 3;
        else if (rarityRoll < 99) rarity = 4;
        else rarity = 5;
        
        return rarity;
    }

    function _mintHero(address _to, uint8 _rarity, uint256 _power) private returns (uint256) {
        uint256 tokenId = _nextTokenId;
        heroData[tokenId] = HeroData({
            rarity: _rarity,
            power: _power,
            isRevealed: true  // 🎯 祭壇鑄造直接為 true
        });
        _safeMint(_to, tokenId);
        _nextTokenId++;
        emit HeroMinted(tokenId, _to, _rarity, _power);
        return tokenId;
    }

    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external onlyAltar returns (uint256) {
        return _mintHero(_to, _rarity, _power);
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        HeroData memory data = heroData[_tokenId];
        // 🎯 移除：require(data.isRevealed, "U"); // 永遠為 true，不需要檢查
        emit HeroBurned(_tokenId, owner, data.rarity, data.power);
        _burn(_tokenId);
    }

    function _generateHeroPowerByRarity(uint8 _rarity, uint256 _randomNumber) private pure returns (uint256 power) {
        if (_rarity == 1) { power = 15 + (_randomNumber % (50 - 15 + 1)); }
        else if (_rarity == 2) { power = 50 + (_randomNumber % (100 - 50 + 1)); }
        else if (_rarity == 3) { power = 100 + (_randomNumber % (150 - 100 + 1)); }
        else if (_rarity == 4) { power = 150 + (_randomNumber % (200 - 150 + 1)); }
        else if (_rarity == 5) { power = 200 + (_randomNumber % (255 - 200 + 1)); }
        else { revert("R"); }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // 🎯 簡化：移除未揭示檢查，直接返回 baseURI
        require(bytes(baseURI).length > 0, "B");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "D");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }

    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power) {
        _requireOwned(tokenId);
        HeroData memory data = heroData[tokenId];
        // 🎯 移除：require(data.isRevealed, "R"); // 永遠為 true，不需要檢查
        return (data.rarity, data.power);
    }

    function getUserRequest(address _user) external view returns (MintRequest memory) {
        return userRequests[_user];
    }
    
    // 🎯 移除：getUserPendingTokens() 函數（不再需要）

    // === VRF 管理函數 ===
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = _vrfManager;
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

    // 🎯 移除：setUnrevealedURI() 函數（不再需要）

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
        require(success, "F");
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }

    receive() external payable {}
}
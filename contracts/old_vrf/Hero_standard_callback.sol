// Hero_standard_callback.sol - 標準 VRF 回調版本（最小化改動）
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Hero_StandardCallback is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct HeroData {
        uint8 rarity;
        uint256 power;
        bool isRevealed; // 🎯 保留但始終為 true（向後相容）
    }
    mapping(uint256 => HeroData) public heroData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;

    // === VRF 相關 ===
    address public vrfManager;
    mapping(uint256 => address) public requestIdToUser; // 🎯 標準回調需要
    
    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    
    // 🎯 簡化的請求結構（移除 reveal 相關）
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] tokenIds; // 🎯 預先分配的 tokenIds
    }
    
    mapping(address => MintRequest) public userRequests;
    
    // --- 事件 ---
    event HeroMinted(address indexed to, uint256 indexed tokenId, uint8 rarity, uint256 power);
    event VRFManagerSet(address indexed vrfManager);
    event VRFRequestFulfilled(uint256 indexed requestId, uint256 randomWordsCount);
    event MintRequested(address indexed user, uint256 quantity, bool fromVault);
    
    constructor(address _initialOwner) ERC721("Dungeon Delvers Hero", "HERO") Ownable(_initialOwner) {
        _nextTokenId = 1;
    }
    
    // === 🎯 標準回調版本的鑄造函數（一筆交易完成）===
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 10, "Hero: Invalid quantity");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Hero: Previous mint pending");
        require(address(dungeonCore) != address(0), "Hero: DungeonCore not set");
        
        uint256 requiredPayment = _calculatePaymentRequired(_quantity, false);
        
        // 🎯 嚴格費用檢查，無退款
        require(msg.value == requiredPayment, "Hero: Exact payment required");
        
        // 🎯 預先分配 tokenIds
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            tokenIds[i] = _nextTokenId++;
            _safeMint(msg.sender, tokenIds[i]);
            // 🎯 先設置為未揭示狀態（可選，為了相容性）
            heroData[tokenIds[i]] = HeroData({
                rarity: 0,
                power: 0,
                isRevealed: false
            });
        }
        
        if (vrfManager != address(0)) {
            // 🎯 VRF 調用無需傳遞 ETH（訂閱模式）
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity, false));
            uint256 requestId = IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                _quantity, // 需要與數量相同的隨機數
                4,         // maxRarity
                requestData
            );
            
            // 🎯 記錄 mapping（標準回調需要）
            requestIdToUser[requestId] = msg.sender;
            
            userRequests[msg.sender] = MintRequest({
                quantity: _quantity,
                payment: msg.value,
                fulfilled: false,
                maxRarity: 4,
                fromVault: false,
                tokenIds: tokenIds
            });
            
            emit MintRequested(msg.sender, _quantity, false);
        } else {
            // VRF 不可用時使用偽隨機
            _processWithPseudoRandom(msg.sender, tokenIds, 4);
        }
    }
    
    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 10, "Hero: Invalid quantity");
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Hero: Previous mint pending");
        require(address(dungeonCore) != address(0), "Hero: DungeonCore not set");
        
        uint256 requiredPayment = _calculatePaymentRequired(_quantity, true);
        
        // 🎯 嚴格費用檢查
        require(msg.value == requiredPayment, "Hero: Exact payment required");
        
        // 檢查和扣除 SoulShard
        uint256 mintCostUSD = mintPriceUSD * _quantity;
        uint256 soulShardCost = dungeonCore.getSoulShardAmountForUSD(mintCostUSD);
        IPlayerVault playerVault = IPlayerVault(dungeonCore.playerVaultAddress());
        playerVault.withdraw(msg.sender, soulShardCost);
        
        // 🎯 預先分配 tokenIds
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            tokenIds[i] = _nextTokenId++;
            _safeMint(msg.sender, tokenIds[i]);
            heroData[tokenIds[i]] = HeroData({
                rarity: 0,
                power: 0,
                isRevealed: false
            });
        }
        
        if (vrfManager != address(0)) {
            bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity, true));
            uint256 requestId = IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                _quantity,
                5,        // maxRarity for vault mint
                requestData
            );
            
            requestIdToUser[requestId] = msg.sender;
            
            userRequests[msg.sender] = MintRequest({
                quantity: _quantity,
                payment: msg.value,
                fulfilled: false,
                maxRarity: 5,
                fromVault: true,
                tokenIds: tokenIds
            });
            
            emit MintRequested(msg.sender, _quantity, true);
        } else {
            _processWithPseudoRandom(msg.sender, tokenIds, 5);
        }
    }
    
    // === 🎯 標準 VRF 回調實現（學習 DungeonMaster/AltarOfAscension）===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // 🎯 安全性改進：使用 return 而非 require
        if (msg.sender != vrfManager) return;
        if (randomWords.length == 0) return;
        
        // 🎯 標準回調模式：直接在回調中處理業務邏輯
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        MintRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // 🎯 立即處理鑄造結果（一筆交易完成）
        _processMintWithVRF(user, request, randomWords);
        
        // 🎯 立即清理數據
        delete requestIdToUser[requestId];
        delete userRequests[user];
        
        emit VRFRequestFulfilled(requestId, randomWords.length);
    }
    
    // === VRF 結果處理 ===
    function _processMintWithVRF(
        address user,
        MintRequest storage request,
        uint256[] memory randomWords
    ) private {
        request.fulfilled = true;
        
        uint256[] memory tokenIds = request.tokenIds;
        uint8 maxRarity = request.maxRarity;
        
        // 🎯 直接賦值屬性（無需 reveal）
        for (uint256 i = 0; i < tokenIds.length && i < randomWords.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // 確保 NFT 仍屬於用戶（防護措施）
            if (ownerOf(tokenId) != user) continue;
            
            // 生成稀有度和力量
            uint8 rarity = _generateRarity(randomWords[i], maxRarity);
            uint256 power = _generatePowerByRarity(rarity);
            
            // 🎯 立即更新數據（標準回調的核心）
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true // 🎯 直接設為已揭示
            });
            
            emit HeroMinted(user, tokenId, rarity, power);
        }
    }
    
    // === 偽隨機處理（VRF 不可用時）===
    function _processWithPseudoRandom(
        address user,
        uint256[] memory tokenIds,
        uint8 maxRarity
    ) private {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 pseudoRandom = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, tokenId, i)));
            
            uint8 rarity = _generateRarity(pseudoRandom, maxRarity);
            uint256 power = _generatePowerByRarity(rarity);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true
            });
            
            emit HeroMinted(user, tokenId, rarity, power);
        }
    }
    
    // === 輔助函數 ===
    function _generateRarity(uint256 _randomValue, uint8 _maxRarity) private pure returns (uint8) {
        uint256 rand = _randomValue % 1000;
        
        if (_maxRarity >= 5 && rand < 1) return 5;      // 0.1% for rarity 5
        if (_maxRarity >= 4 && rand < 10) return 4;     // 0.9% for rarity 4
        if (_maxRarity >= 3 && rand < 50) return 3;     // 4% for rarity 3
        if (_maxRarity >= 2 && rand < 200) return 2;    // 15% for rarity 2
        return 1;                                        // 80% for rarity 1
    }
    
    function _generatePowerByRarity(uint8 _rarity) private view returns (uint256) {
        if (_rarity == 1) return 15 + (block.timestamp % 36);      // 15-50
        else if (_rarity == 2) return 50 + (block.timestamp % 51); // 50-100
        else if (_rarity == 3) return 100 + (block.timestamp % 51);// 100-150
        else if (_rarity == 4) return 150 + (block.timestamp % 51);// 150-200
        else if (_rarity == 5) return 200 + (block.timestamp % 56);// 200-255
        else return 255;
    }
    
    function _calculatePaymentRequired(uint256 _quantity, bool _fromVault) private view returns (uint256) {
        uint256 totalNativeFee = platformFee * _quantity;
        
        if (_fromVault) {
            uint8 vipLevel = 0;
            address vipAddress = dungeonCore.vipStakingAddress();
            if (vipAddress != address(0)) {
                try IVIPStaking(vipAddress).getVipLevel(msg.sender) returns (uint8 level) {
                    vipLevel = level;
                } catch {}
            }
            
            if (vipLevel >= 3) {
                totalNativeFee = totalNativeFee * 50 / 100; // 50% discount
            } else if (vipLevel >= 2) {
                totalNativeFee = totalNativeFee * 70 / 100; // 30% discount
            } else if (vipLevel >= 1) {
                totalNativeFee = totalNativeFee * 90 / 100; // 10% discount
            }
        }
        
        return totalNativeFee;
    }
    
    // === 管理函數 ===
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = _vrfManager;
        emit VRFManagerSet(_vrfManager);
    }
    
    function setDungeonCore(address _address) external onlyOwner {
        dungeonCore = IDungeonCore(_address);
    }
    
    function setSoulShardToken(address _address) external onlyOwner {
        soulShardToken = IERC20(_address);
    }
    
    function setAscensionAltarAddress(address _address) external onlyOwner {
        ascensionAltarAddress = _address;
    }
    
    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice;
    }
    
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }
    
    function setBaseURI(string memory _newURI) external onlyOwner {
        baseURI = _newURI;
    }
    
    function setContractURI(string memory _newURI) external onlyOwner {
        _contractURI = _newURI;
    }
    
    // === 祭壇鑄造（保持不變）===
    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external returns (uint256) {
        require(msg.sender == ascensionAltarAddress, "Hero: Only altar");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(_to, tokenId);
        
        heroData[tokenId] = HeroData({
            rarity: _rarity,
            power: _power,
            isRevealed: true
        });
        
        emit HeroMinted(_to, tokenId, _rarity, _power);
        return tokenId;
    }
    
    function burnFromAltar(uint256 _tokenId) external {
        require(msg.sender == ascensionAltarAddress, "Hero: Only altar");
        _burn(_tokenId);
    }
    
    // === 查詢函數 ===
    function getUserRequest(address _user) external view returns (MintRequest memory) {
        return userRequests[_user];
    }
    
    function getHeroProperties(uint256 _tokenId) external view returns (uint8 rarity, uint256 power) {
        HeroData memory data = heroData[_tokenId];
        return (data.rarity, data.power);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        if (bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, tokenId.toString()));
        }
        
        return "";
    }
    
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }
    
    // === 資金管理 ===
    function withdrawBNB() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Hero: Withdraw failed");
    }
    
    function withdrawSoulShard() external onlyOwner {
        require(address(soulShardToken) != address(0), "Hero: Token not set");
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) {
            soulShardToken.safeTransfer(owner(), balance);
        }
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    receive() external payable {}
}
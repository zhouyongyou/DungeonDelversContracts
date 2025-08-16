// Hero_safe_v2.sol - Pull Payment 安全版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Hero_Safe_V2 is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct HeroData {
        uint8 rarity;
        uint256 power;
        bool isRevealed;
    }
    mapping(uint256 => HeroData) public heroData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;

    // === VRF 相關 ===
    address public vrfManager;
    
    // State machine for mint protection
    enum MintState { Open, Requested, Fulfilled }
    mapping(address => MintState) public userMintState;
    mapping(address => uint256) public requestTimestamp;
    uint256 public constant REQUEST_TIMEOUT = 1 hours;
    
    // Pull Payment implementation
    mapping(address => uint256) public pendingRefunds;
    uint256 public totalPendingRefunds;
    event RefundAvailable(address indexed user, uint256 amount);
    event RefundClaimed(address indexed user, uint256 amount);

    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    

    string public unrevealedURI = "https://dungeon-delvers-metadata-server.onrender.com/api/hero/unrevealed";
    
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
    }
    
    mapping(address => MintRequest) public userRequests;
    mapping(address => uint256[]) public userPendingTokens;
        
    struct RarityLimits {
        uint8 maxFiveStar;
        uint8 maxFourStar;
        uint8 maxThreeStar;
        uint8 maxTwoStar;
    }
    mapping(uint256 => RarityLimits) private quantityLimits;

    // --- 事件 ---
    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event AscensionAltarSet(address indexed newAddress);
    event HeroBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event MintRequested(address indexed player, uint256 quantity, bool fromVault);
    event HeroRevealed(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
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

    // === VRF 整合的鑄造函數 ===
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "IQ");
        require(userMintState[msg.sender] != MintState.Requested, "Request pending");
        
        // Clean up expired request if any
        if (userMintState[msg.sender] == MintState.Requested && 
            block.timestamp > requestTimestamp[msg.sender] + REQUEST_TIMEOUT) {
            userMintState[msg.sender] = MintState.Open;
            delete userRequests[msg.sender];
        }
        
        require(userMintState[msg.sender] == MintState.Open, "Invalid state");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "IP");
        
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        if (vrfManager != address(0)) {
            // 請求 VRF（訂閱模式，無需支付）
            IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                _quantity,
                maxRarity,
                requestData
            );
        }
        
        // Lock state immediately
        userMintState[msg.sender] = MintState.Requested;
        requestTimestamp[msg.sender] = block.timestamp;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: false
        });
        
        emit MintRequested(msg.sender, _quantity, false);
    }

    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "IQ");
        require(userMintState[msg.sender] != MintState.Requested, "Request pending");
        
        // Clean up expired request if any
        if (userMintState[msg.sender] == MintState.Requested && 
            block.timestamp > requestTimestamp[msg.sender] + REQUEST_TIMEOUT) {
            userMintState[msg.sender] = MintState.Open;
            delete userRequests[msg.sender];
        }
        
        require(userMintState[msg.sender] == MintState.Open, "Invalid state");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "IV");
        
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        if (vrfManager != address(0)) {
            // 請求 VRF（訂閱模式，無需支付）
            IVRFManager(vrfManager).requestRandomForUser(
                msg.sender,
                _quantity,
                maxRarity,
                requestData
            );
        }
        
        // Lock state immediately
        userMintState[msg.sender] = MintState.Requested;
        requestTimestamp[msg.sender] = block.timestamp;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: true
        });
        
        emit MintRequested(msg.sender, _quantity, true);
    }

    // === VRF 整合的揭示函數 ===
    function revealMint() external nonReentrant whenNotPaused {
        _revealMintFor(msg.sender);
    }
    
    function revealMintFor(address user) external nonReentrant whenNotPaused {
        _revealMintFor(user);
    }
    
    function _revealMintFor(address user) private {
        MintRequest storage request = userRequests[user];
        require(request.quantity > 0, "NP");
        require(!request.fulfilled, "AR");
        require(userMintState[user] == MintState.Requested, "Invalid state");
        require(vrfManager != address(0), "VRF not configured");
        
        // VRF-only 模式
        (bool vrfFulfilled, uint256[] memory randomWords) = IVRFManager(vrfManager).getRandomForUser(user);
        require(vrfFulfilled && randomWords.length > 0, "VRF not ready");
        
        _revealWithVRF(user, randomWords, request);
    }

    // === VRF 揭示函數 ===
    function _revealWithVRF(
        address user,
        uint256[] memory randomWords,
        MintRequest storage request
    ) internal {
        require(userMintState[user] == MintState.Requested, "Invalid state");
        request.fulfilled = true;
        userMintState[user] = MintState.Fulfilled;
        
        uint256[] memory tokenIds = new uint256[](request.quantity);
        
        // 先鑄造為未揭示狀態，然後立即揭示
        for (uint256 i = 0; i < request.quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            // Enhanced random seed with multiple entropy sources
            uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(
                randomWords[0],
                tokenId,
                user,
                block.timestamp,
                block.number,
                block.prevrandao,  // BSC compatible random source
                i
            )));
            uint8 rarity = _determineRarityFromSeed(uniqueSeed, user, request.quantity);
            uint256 power = _generateHeroPowerByRarity(rarity, uniqueSeed);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true
            });
            
            _safeMint(user, tokenId);
            
            emit HeroMinted(tokenId, user, rarity, power);
            emit HeroRevealed(tokenId, user, rarity, power);
        }
        
        emit BatchMintCompleted(user, request.quantity, request.maxRarity, tokenIds);
        
        // 清理數據
        delete userRequests[user];
        delete userPendingTokens[user];
        userMintState[user] = MintState.Open;
        delete requestTimestamp[user];
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
            isRevealed: true
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
        require(data.isRevealed, "U");
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
        
        if (!heroData[tokenId].isRevealed) {
            return unrevealedURI;
        }
        
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
        require(data.isRevealed, "R");
        return (data.rarity, data.power);
    }

    function getUserRequest(address _user) external view returns (MintRequest memory) {
        return userRequests[_user];
    }
    
    function getUserPendingTokens(address _user) external view returns (uint256[] memory) {
        return userPendingTokens[_user];
    }

    // === Timeout cleanup function ===
    function cleanupExpiredRequest(address user) external onlyOwner {
        require(userMintState[user] == MintState.Requested, "Not pending");
        require(block.timestamp > requestTimestamp[user] + REQUEST_TIMEOUT, "Not expired");
        
        // Reset state
        userMintState[user] = MintState.Open;
        delete requestTimestamp[user];
        
        // Clear request
        MintRequest storage request = userRequests[user];
        if (request.payment > 0) {
            // Pull Payment: record refund instead of direct transfer
            pendingRefunds[user] += request.payment;
            totalPendingRefunds += request.payment;
            emit RefundAvailable(user, request.payment);
        }
        
        delete userRequests[user];
    }
    
    // === Pull Payment: claim refund function ===
    function claimRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");
        
        // Clear before transfer to prevent reentrancy
        pendingRefunds[msg.sender] = 0;
        totalPendingRefunds -= amount;
        
        // Safe transfer
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(msg.sender, amount);
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

    function setUnrevealedURI(string memory _newURI) external onlyOwner {
        unrevealedURI = _newURI;
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
        // Ensure pending refunds are protected
        uint256 availableBalance = address(this).balance - totalPendingRefunds;
        require(availableBalance > 0, "No funds available for withdrawal");
        
        (bool success, ) = owner().call{value: availableBalance}("");
        require(success, "F");
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }

    // === VRF 回調實現 ===
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        require(msg.sender == vrfManager, "VM");
        
        // Check timeout
        address user = IVRFManager(vrfManager).requestIdToUser(requestId);
        if (block.timestamp > requestTimestamp[user] + REQUEST_TIMEOUT) {
            // Handle timeout - reset state
            userMintState[user] = MintState.Open;
            delete requestTimestamp[user];
            return;
        }
        
        // User already retrieved above
        require(user != address(0), "IU");
        
        MintRequest storage request = userRequests[user];
        require(!request.fulfilled, "AF");
        
        // 執行 VRF 揭示
        _revealWithVRF(user, randomWords, request);
    }

    receive() external payable {}
}


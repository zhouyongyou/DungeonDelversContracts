// Hero_unified.sol - 使用統一 VRF 狀態管理的簡化版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

// 引入統一 VRF 的接口
interface IUnifiedVRFManager {
    enum RequestStatus { None, Pending, Fulfilled, Processing, Completed, Expired }
    enum RequestType { HeroMint, RelicMint, Expedition, Upgrade }
    
    function createRequest(
        address user,
        RequestType requestType,
        uint32 numWords,
        bytes calldata businessData
    ) external returns (uint256 requestId);
    
    function requestRandomForMint(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external returns (uint256 requestId);
    
    function getUserRequestStatus(
        address user,
        RequestType requestType
    ) external view returns (
        RequestStatus status,
        uint256 requestId,
        uint256 timestamp,
        bool canReveal
    );
    
    function getRandomWords(uint256 requestId) 
        external view returns (bool ready, uint256[] memory randomWords);
    
    function canMakeRequest(address user, RequestType requestType) 
        external view returns (bool);
    
    function markProcessing(uint256 requestId) external;
    function markCompleted(uint256 requestId) external;
}

/**
 * @title Hero_Unified
 * @notice Hero NFT 合約 - 使用統一 VRF 狀態管理
 * @dev 主要簡化：
 * 1. 移除本地狀態機（MintState），完全依賴 VRF 層
 * 2. 不再管理請求狀態，只查詢和處理業務邏輯
 * 3. 更清晰的職責分離
 */
contract Hero_Unified is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    // ============================================
    // 業務數據（不包含狀態管理）
    // ============================================
    
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
    
    // VRF Manager（統一狀態管理）
    IUnifiedVRFManager public vrfManager;
    
    // Pull Payment for refunds
    mapping(address => uint256) public pendingRefunds;
    uint256 public totalPendingRefunds;
    
    // Mint 相關參數
    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    string public unrevealedURI = "https://dungeon-delvers-metadata-server.onrender.com/api/hero/unrevealed";
    
    // 簡化的請求數據（不包含狀態）
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        uint8 maxRarity;
        bool fromVault;
        uint256 requestId;  // 關聯的 VRF requestId
    }
    mapping(address => MintRequest) public userRequests;
    
    // ============================================
    // 事件
    // ============================================
    
    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event MintRequested(address indexed player, uint256 quantity, bool fromVault, uint256 requestId);
    event RefundAvailable(address indexed user, uint256 amount);
    event RefundClaimed(address indexed user, uint256 amount);
    event VRFManagerSet(address indexed vrfManager);
    
    // ============================================
    // 修飾符
    // ============================================
    
    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "Only altar");
        _;
    }
    
    // ============================================
    // 構造函數
    // ============================================
    
    constructor(
        address initialOwner
    ) ERC721("Dungeon Delvers Hero", "DDH") Ownable(initialOwner) {
        _nextTokenId = 1;
    }
    
    // ============================================
    // Mint 函數（簡化版，不管理狀態）
    // ============================================
    
    /**
     * @notice 從錢包鑄造 Hero
     * @dev 狀態完全由 VRF Manager 管理
     */
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Invalid quantity");
        require(vrfManager != address(0), "VRF Manager not set");
        
        // 檢查是否可以發起請求（查詢 VRF 層）
        require(
            vrfManager.canMakeRequest(msg.sender, IUnifiedVRFManager.RequestType.HeroMint),
            "Cannot make request - pending or processing"
        );
        
        // 清理舊請求（如果有）
        _cleanupOldRequest(msg.sender);
        
        // 收費邏輯
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Insufficient payment");
        
        // 收取 SoulShard
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        // 請求 VRF（狀態由 VRF Manager 管理）
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, _quantity, block.timestamp));
        uint256 requestId = vrfManager.requestRandomForMint(
            msg.sender,
            _quantity,
            5,  // maxRarity
            commitment
        );
        
        // 只存儲業務數據，不管理狀態
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            maxRarity: 5,
            fromVault: false,
            requestId: requestId
        });
        
        emit MintRequested(msg.sender, _quantity, false, requestId);
    }
    
    /**
     * @notice 從金庫鑄造 Hero
     */
    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Invalid quantity");
        require(vrfManager != address(0), "VRF Manager not set");
        
        // 檢查是否可以發起請求
        require(
            vrfManager.canMakeRequest(msg.sender, IUnifiedVRFManager.RequestType.HeroMint),
            "Cannot make request - pending or processing"
        );
        
        // 清理舊請求
        _cleanupOldRequest(msg.sender);
        
        // 收費邏輯
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Insufficient payment");
        
        // 從金庫扣除
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);
        
        // 請求 VRF
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, _quantity, block.timestamp));
        uint256 requestId = vrfManager.requestRandomForMint(
            msg.sender,
            _quantity,
            5,
            commitment
        );
        
        // 存儲業務數據
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            maxRarity: 5,
            fromVault: true,
            requestId: requestId
        });
        
        emit MintRequested(msg.sender, _quantity, true, requestId);
    }
    
    // ============================================
    // Reveal 函數（處理 VRF 結果）
    // ============================================
    
    /**
     * @notice 揭示鑄造的 Hero
     * @dev 從 VRF Manager 獲取隨機數並處理
     */
    function revealMint() external nonReentrant whenNotPaused {
        _revealMintFor(msg.sender);
    }
    
    function revealMintFor(address user) external nonReentrant whenNotPaused {
        _revealMintFor(user);
    }
    
    function _revealMintFor(address user) private {
        MintRequest storage request = userRequests[user];
        require(request.quantity > 0, "No pending mint");
        require(request.requestId != 0, "No VRF request");
        
        // 從 VRF Manager 獲取隨機數
        (bool ready, uint256[] memory randomWords) = vrfManager.getRandomWords(request.requestId);
        require(ready, "VRF not ready");
        require(randomWords.length > 0, "No random words");
        
        // 標記開始處理
        vrfManager.markProcessing(request.requestId);
        
        // 處理鑄造
        uint256[] memory tokenIds = new uint256[](request.quantity);
        for (uint256 i = 0; i < request.quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            
            // 使用隨機數生成屬性
            uint256 uniqueSeed = uint256(keccak256(abi.encodePacked(
                randomWords[0],
                tokenId,
                user,
                block.timestamp,
                i
            )));
            
            uint8 rarity = _determineRarityFromSeed(uniqueSeed % 100);
            uint256 power = _generateHeroPowerByRarity(rarity, uniqueSeed);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power,
                isRevealed: true
            });
            
            _safeMint(user, tokenId);
            emit HeroMinted(tokenId, user, rarity, power);
        }
        
        // 標記完成
        vrfManager.markCompleted(request.requestId);
        
        // 清理請求數據
        delete userRequests[user];
        
        emit BatchMintCompleted(user, request.quantity, request.maxRarity, tokenIds);
    }
    
    // ============================================
    // 超時處理（簡化版）
    // ============================================
    
    /**
     * @notice 處理超時的請求
     * @dev 超時檢查由 VRF Manager 處理，這裡只處理退款
     */
    function handleExpiredRequest(address user) external {
        // 檢查 VRF 層狀態
        (IUnifiedVRFManager.RequestStatus status,,,) = vrfManager.getUserRequestStatus(
            user, 
            IUnifiedVRFManager.RequestType.HeroMint
        );
        
        require(status == IUnifiedVRFManager.RequestStatus.Expired, "Not expired");
        
        MintRequest storage request = userRequests[user];
        require(request.quantity > 0, "No request");
        
        // 記錄退款（Pull Payment）
        if (request.payment > 0) {
            pendingRefunds[user] += request.payment;
            totalPendingRefunds += request.payment;
            emit RefundAvailable(user, request.payment);
        }
        
        // 清理請求
        delete userRequests[user];
    }
    
    /**
     * @notice 清理舊請求
     */
    function _cleanupOldRequest(address user) private {
        MintRequest storage request = userRequests[user];
        if (request.quantity == 0) return;
        
        // 檢查 VRF 狀態
        (IUnifiedVRFManager.RequestStatus status,,,) = vrfManager.getUserRequestStatus(
            user, 
            IUnifiedVRFManager.RequestType.HeroMint
        );
        
        // 如果是完成或過期狀態，清理
        if (status == IUnifiedVRFManager.RequestStatus.Completed || 
            status == IUnifiedVRFManager.RequestStatus.Expired) {
            delete userRequests[user];
        }
    }
    
    // ============================================
    // Pull Payment
    // ============================================
    
    function claimRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");
        
        pendingRefunds[msg.sender] = 0;
        totalPendingRefunds -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(msg.sender, amount);
    }
    
    function getRefundBalance(address user) external view returns (uint256) {
        return pendingRefunds[user];
    }
    
    // ============================================
    // VRF 回調（由 VRF Manager 調用）
    // ============================================
    
    /**
     * @notice VRF 回調函數
     * @dev 統一 VRF Manager 可能會調用此函數通知狀態變化
     */
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        require(msg.sender == address(vrfManager), "Only VRF Manager");
        // 這個版本中，我們不在回調中處理，而是讓用戶主動 reveal
        // 這樣更安全且 gas 效率更高
    }
    
    // ============================================
    // 查詢函數
    // ============================================
    
    /**
     * @notice 檢查用戶是否可以 mint
     */
    function canMint(address user) external view returns (bool) {
        if (address(vrfManager) == address(0)) return false;
        return vrfManager.canMakeRequest(user, IUnifiedVRFManager.RequestType.HeroMint);
    }
    
    /**
     * @notice 獲取用戶 mint 狀態
     */
    function getMintStatus(address user) external view returns (
        string memory status,
        bool canReveal,
        uint256 quantity
    ) {
        MintRequest storage request = userRequests[user];
        quantity = request.quantity;
        
        if (quantity == 0) {
            return ("No request", false, 0);
        }
        
        (IUnifiedVRFManager.RequestStatus vrfStatus,,,bool ready) = vrfManager.getUserRequestStatus(
            user, 
            IUnifiedVRFManager.RequestType.HeroMint
        );
        
        if (vrfStatus == IUnifiedVRFManager.RequestStatus.None) {
            status = "None";
        } else if (vrfStatus == IUnifiedVRFManager.RequestStatus.Pending) {
            status = "Waiting for VRF";
        } else if (vrfStatus == IUnifiedVRFManager.RequestStatus.Fulfilled) {
            status = "Ready to reveal";
            canReveal = true;
        } else if (vrfStatus == IUnifiedVRFManager.RequestStatus.Processing) {
            status = "Processing";
        } else if (vrfStatus == IUnifiedVRFManager.RequestStatus.Completed) {
            status = "Completed";
        } else if (vrfStatus == IUnifiedVRFManager.RequestStatus.Expired) {
            status = "Expired - claim refund";
        }
    }
    
    // ============================================
    // 輔助函數
    // ============================================
    
    function _determineRarityFromSeed(uint256 seed) internal pure returns (uint8) {
        if (seed < 44) return 1;
        else if (seed < 79) return 2;
        else if (seed < 94) return 3;
        else if (seed < 99) return 4;
        else return 5;
    }
    
    function _generateHeroPowerByRarity(uint8 _rarity, uint256 _randomNumber) 
        private pure returns (uint256 power) 
    {
        if (_rarity == 1) power = 15 + (_randomNumber % 36);
        else if (_rarity == 2) power = 50 + (_randomNumber % 51);
        else if (_rarity == 3) power = 100 + (_randomNumber % 51);
        else if (_rarity == 4) power = 150 + (_randomNumber % 51);
        else if (_rarity == 5) power = 200 + (_randomNumber % 56);
        else revert("Invalid rarity");
    }
    
    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "DungeonCore not set");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }
    
    // ============================================
    // 管理函數
    // ============================================
    
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = IUnifiedVRFManager(_vrfManager);
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
    
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }
    
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }
    
    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice * 1e18;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Altar 專用函數
    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external onlyAltar returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        heroData[tokenId] = HeroData({
            rarity: _rarity,
            power: _power,
            isRevealed: true
        });
        _safeMint(_to, tokenId);
        emit HeroMinted(tokenId, _to, _rarity, _power);
        return tokenId;
    }
    
    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        _burn(_tokenId);
    }
    
    // Token URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        if (!heroData[tokenId].isRevealed) {
            return unrevealedURI;
        }
        
        require(bytes(baseURI).length > 0, "Base URI not set");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }
    
    receive() external payable {}
}
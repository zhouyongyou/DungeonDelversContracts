// VRFIntegration.sol - 最小改動的 VRF 整合方案
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VRFManagerV2
 * @notice 作為現有合約和 Chainlink VRF 之間的橋樑
 * @dev 讓現有合約幾乎不需要改動就能使用 VRF
 */
contract VRFManagerV2 is Ownable, ReentrancyGuard {
    
    // Chainlink VRF V2 Direct Funding 接口
    interface IVRFCoordinatorV2Plus {
        function requestRandomWords(
            bytes32 keyHash,
            uint256 subId,
            uint16 minimumRequestConfirmations,
            uint32 callbackGasLimit,
            uint32 numWords,
            bytes calldata extraArgs
        ) external payable returns (uint256 requestId);
    }
    
    IVRFCoordinatorV2Plus public immutable vrfCoordinator;
    
    // BSC Mainnet 配置
    bytes32 public keyHash = 0xba6e730de88d94a5510ae6613898bfb0c3de5d16e609c5b7da808747125506f7;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint256 public vrfRequestPrice = 0.005 ether; // ~$1.5
    
    // 請求追蹤
    struct PendingRequest {
        address requester;      // 請求合約
        address user;          // 最終用戶
        uint256 blockNumber;   // 請求區塊
        bytes32 commitment;    // 原始承諾（兼容舊系統）
        uint256 quantity;      // 數量
        uint8 maxRarity;       // 最大稀有度
        bool fulfilled;        // 是否完成
        uint256[] randomWords; // VRF 結果
    }
    
    mapping(uint256 => PendingRequest) public pendingRequests; // VRF requestId => 請求
    mapping(address => mapping(address => uint256)) public userActiveRequest; // contract => user => requestId
    
    // 授權合約
    mapping(address => bool) public authorizedContracts;
    
    // 事件
    event VRFRequested(
        uint256 indexed requestId,
        address indexed contract_,
        address indexed user,
        uint256 quantity
    );
    
    event VRFFulfilled(
        uint256 indexed requestId,
        address indexed contract_,
        address indexed user,
        uint256[] randomWords
    );
    
    event ContractAuthorized(address indexed contract_, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    constructor(address _vrfCoordinator) Ownable(msg.sender) {
        vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
    }
    
    // ========== 核心功能：為現有合約提供 VRF ==========
    
    /**
     * @notice 替代原有的 commit 函數
     * @dev 現有合約只需調用此函數而不是生成 commitment
     * @param user 最終用戶地址
     * @param quantity 數量
     * @param maxRarity 最大稀有度
     * @param originalCommitment 原始承諾（用於兼容）
     * @return requestId VRF 請求 ID
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 originalCommitment
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        require(msg.value >= vrfRequestPrice, "Insufficient VRF fee");
        require(userActiveRequest[msg.sender][user] == 0, "User has pending request");
        
        // 請求 VRF
        requestId = vrfCoordinator.requestRandomWords{value: vrfRequestPrice}(
            keyHash,
            0, // Direct funding
            requestConfirmations,
            callbackGasLimit,
            uint32(quantity), // 需要的隨機數數量
            ""
        );
        
        // 記錄請求
        pendingRequests[requestId] = PendingRequest({
            requester: msg.sender,
            user: user,
            blockNumber: block.number,
            commitment: originalCommitment,
            quantity: quantity,
            maxRarity: maxRarity,
            fulfilled: false,
            randomWords: new uint256[](0)
        });
        
        userActiveRequest[msg.sender][user] = requestId;
        
        // 退還多餘費用
        if (msg.value > vrfRequestPrice) {
            payable(msg.sender).transfer(msg.value - vrfRequestPrice);
        }
        
        emit VRFRequested(requestId, msg.sender, user, quantity);
        return requestId;
    }
    
    /**
     * @notice 獲取用戶的隨機數（替代原有的 reveal）
     * @dev 現有合約調用此函數獲取 VRF 結果
     * @param user 用戶地址
     * @return fulfilled 是否已完成
     * @return randomWords 隨機數數組
     */
    function getRandomForUser(address user) external view returns (
        bool fulfilled,
        uint256[] memory randomWords
    ) {
        uint256 requestId = userActiveRequest[msg.sender][user];
        if (requestId == 0) {
            return (false, new uint256[](0));
        }
        
        PendingRequest memory request = pendingRequests[requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    /**
     * @notice Chainlink VRF 回調
     * @dev 由 VRF Coordinator 自動調用
     */
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external {
        require(msg.sender == address(vrfCoordinator), "Only VRF Coordinator");
        
        PendingRequest storage request = pendingRequests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        request.fulfilled = true;
        request.randomWords = randomWords;
        
        // 清除活躍請求
        delete userActiveRequest[request.requester][request.user];
        
        // 通知原合約（如果實現了回調）
        try IVRFCallback(request.requester).onVRFFulfilled(
            request.user,
            randomWords
        ) {} catch {}
        
        emit VRFFulfilled(requestId, request.requester, request.user, randomWords);
    }
    
    // ========== 兼容性函數 ==========
    
    /**
     * @notice 模擬原有的 reveal 檢查
     * @dev 讓現有合約的 canReveal 邏輯繼續工作
     */
    function canReveal(address contract_, address user) external view returns (bool) {
        uint256 requestId = userActiveRequest[contract_][user];
        if (requestId == 0) return false;
        
        PendingRequest memory request = pendingRequests[requestId];
        // VRF 通常 3-10 秒完成，但我們模擬 3 個區塊的延遲
        return request.fulfilled || block.number >= request.blockNumber + 3;
    }
    
    /**
     * @notice 緊急備用：使用區塊哈希
     * @dev 如果 VRF 失敗超過 1 小時
     */
    function emergencyFulfill(address user) external onlyAuthorized {
        uint256 requestId = userActiveRequest[msg.sender][user];
        require(requestId > 0, "No pending request");
        
        PendingRequest storage request = pendingRequests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        require(block.number > request.blockNumber + 240, "Wait 1 hour"); // ~1小時
        
        // 使用區塊哈希生成偽隨機數
        uint256[] memory pseudoRandom = new uint256[](request.quantity);
        for (uint i = 0; i < request.quantity; i++) {
            pseudoRandom[i] = uint256(keccak256(abi.encodePacked(
                blockhash(block.number - 1),
                request.commitment,
                i
            )));
        }
        
        request.fulfilled = true;
        request.randomWords = pseudoRandom;
        
        delete userActiveRequest[request.requester][request.user];
        
        emit VRFFulfilled(requestId, request.requester, request.user, pseudoRandom);
    }
    
    // ========== 管理功能 ==========
    
    function authorizeContract(address contract_) external onlyOwner {
        authorizedContracts[contract_] = true;
        emit ContractAuthorized(contract_, true);
    }
    
    function revokeContract(address contract_) external onlyOwner {
        authorizedContracts[contract_] = false;
        emit ContractAuthorized(contract_, false);
    }
    
    function updateVRFConfig(
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint256 _vrfRequestPrice
    ) external onlyOwner {
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        vrfRequestPrice = _vrfRequestPrice;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}

/**
 * @title IVRFCallback
 * @notice 可選的回調接口
 */
interface IVRFCallback {
    function onVRFFulfilled(address user, uint256[] memory randomWords) external;
}

// ========== 現有合約的最小改動示例 ==========

/**
 * @title HeroMinimalVRF
 * @notice 展示如何用最小改動讓 Hero 合約使用 VRF
 */
contract HeroMinimalVRFExample {
    
    VRFManagerV2 public vrfManager;
    
    // 原有的 commitment 結構幾乎不變
    struct MintCommitment {
        uint256 blockNumber;
        uint256 quantity;
        uint256 payment;
        bytes32 commitment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
    }
    
    mapping(address => MintCommitment) public userCommitments;
    
    /**
     * 原有的 mintFromWallet 函數，只需小改
     */
    function mintFromWallet(uint256 _quantity) external payable {
        // ... 原有的驗證邏輯 ...
        
        // 原本的 commitment 生成
        bytes32 commitment = keccak256(abi.encodePacked(
            msg.sender,
            block.number,
            _quantity
        ));
        
        // ===== 唯一的改動：調用 VRF Manager =====
        if (address(vrfManager) != address(0)) {
            // 使用 VRF
            uint256 vrfFee = vrfManager.vrfRequestPrice();
            require(msg.value >= totalPrice + vrfFee, "Insufficient payment");
            
            vrfManager.requestRandomForUser{value: vrfFee}(
                msg.sender,
                _quantity,
                maxRarity,
                commitment
            );
        } else {
            // 保持原有邏輯作為備用
            userCommitments[msg.sender] = MintCommitment({
                blockNumber: block.number,
                quantity: _quantity,
                payment: msg.value,
                commitment: commitment,
                fulfilled: false,
                maxRarity: maxRarity,
                fromVault: false
            });
        }
        // ===== 改動結束 =====
        
        // ... 原有的事件發射等 ...
    }
    
    /**
     * 原有的 reveal 函數，也只需小改
     */
    function reveal() external {
        // ===== 改動：先檢查 VRF =====
        if (address(vrfManager) != address(0)) {
            (bool fulfilled, uint256[] memory randomWords) = vrfManager.getRandomForUser(msg.sender);
            require(fulfilled, "VRF not ready");
            
            // 使用 VRF 隨機數生成屬性
            for (uint i = 0; i < randomWords.length; i++) {
                _mintHeroWithRandom(msg.sender, randomWords[i]);
            }
            
            return;
        }
        // ===== 改動結束 =====
        
        // 原有的 reveal 邏輯作為備用
        MintCommitment memory commitment = userCommitments[msg.sender];
        require(block.number >= commitment.blockNumber + 3, "Too early");
        // ... 原有邏輯 ...
    }
    
    function _mintHeroWithRandom(address to, uint256 randomValue) internal {
        // 使用隨機數生成屬性
        uint8 rarity = uint8((randomValue % 100) < 10 ? 5 : (randomValue % 100) < 30 ? 4 : 3);
        // ... 鑄造邏輯 ...
    }
    
    // 管理函數
    function setVRFManager(address _vrfManager) external onlyOwner {
        vrfManager = VRFManagerV2(_vrfManager);
    }
}
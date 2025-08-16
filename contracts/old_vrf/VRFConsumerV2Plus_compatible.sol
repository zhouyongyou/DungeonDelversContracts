// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @title VRFConsumerV2Plus_Compatible
 * @notice 向後兼容版本 - 支援 payable 調用但使用訂閱模式
 * @dev 主要特點：
 * 1. 保留 payable 修飾符以支持舊合約調用
 * 2. 使用訂閱模式，因此不使用傳入的 ETH
 * 3. 自動退還多餘的 ETH 給調用者
 * 4. 記錄收到但未使用的 ETH 以便監控
 */
contract VRFConsumerV2Plus_Compatible is VRFConsumerBaseV2Plus, ReentrancyGuard {
    
    // ============================================
    // 事件
    // ============================================
    
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event CallbackSuccess(uint256 indexed requestId, address indexed callbackContract);
    event CallbackFailed(uint256 indexed requestId, address indexed callbackContract, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    event CallbackGasLimitUpdated(uint32 oldLimit, uint32 newLimit);
    event RequestTimedOut(uint256 indexed requestId, address indexed requester);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // 向後兼容性相關事件
    event UnusedEthReceived(address indexed sender, uint256 amount, string functionName);
    event EthRefunded(address indexed recipient, uint256 amount);
    
    // ============================================
    // 狀態變量
    // ============================================
    
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
        address requester;      // 調用合約地址
        uint256 timestamp;      // Request timestamp for timeout handling
    }
    
    mapping(uint256 => RequestStatus) public s_requests;
    mapping(address => uint256) public lastRequestIdByAddress;
    
    // 映射關係
    mapping(uint256 => address) public requestIdToUser;        // 請求ID -> 最終用戶
    mapping(uint256 => address) public requestIdToContract;    // 請求ID -> 調用合約
    
    // VRF 配置
    uint256 public s_subscriptionId;
    
    // BSC 主網優化配置
    bytes32 public keyHash = 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4; // BSC 200 gwei
    uint32 public callbackGasLimit = 2500000;  // 2.5M gas，足夠複雜操作
    uint16 public requestConfirmations = 6;     // 6 個確認（18秒），平衡安全與體驗
    uint32 public numWords = 1;
    
    // Gas 限制範圍
    uint32 public constant MIN_CALLBACK_GAS_LIMIT = 100000;
    uint32 public constant MAX_CALLBACK_GAS_LIMIT = 2500000;
    
    // 授權合約
    mapping(address => bool) public authorized;
    
    // Rate limiting 和 timeout
    mapping(address => uint256) public lastRequestTime;
    uint256 public constant COOLDOWN_PERIOD = 30; // 30 秒冷卻
    uint256 public constant REQUEST_TIMEOUT = 30 minutes; // 30 分鐘超時
    
    // 向後兼容性統計
    uint256 public totalUnusedEthReceived;
    mapping(address => uint256) public unusedEthByContract;
    
    // ============================================
    // 構造函數
    // ============================================
    
    constructor(
        uint256 subscriptionId,
        address vrfCoordinator
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        s_subscriptionId = subscriptionId;
    }
    
    // ============================================
    // 修飾符
    // ============================================
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // ============================================
    // 向後兼容的主要函數（添加 payable）
    // ============================================
    
    /**
     * @notice 為用戶請求隨機數（向後兼容版本，支持 payable）
     * @dev 訂閱模式不需要 ETH，但保留 payable 以支持舊合約
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8, // maxRarity - 不使用
        bytes32 // commitment - 不使用
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        
        // 處理向後兼容性：記錄但不使用 ETH
        if (msg.value > 0) {
            _handleUnusedEth(msg.sender, msg.value, "requestRandomForUser");
        }
        
        // Rate limiting check
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // 動態調整 gas limit
        uint32 dynamicGasLimit = callbackGasLimit;
        if (quantity > 10) {
            dynamicGasLimit = uint32(_min(callbackGasLimit + (quantity - 10) * 5000, MAX_CALLBACK_GAS_LIMIT));
        }
        
        // 使用訂閱模式請求（不需要支付）
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: dynamicGasLimit,
                numWords: 1, // 固定請求 1 個隨機數
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // 使用 LINK 支付
                    })
                )
            })
        );
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,
            timestamp: block.timestamp
        });
        
        lastRequestIdByAddress[user] = requestId;
        requestIdToUser[requestId] = user;
        requestIdToContract[requestId] = msg.sender;
        emit RequestSent(requestId, uint32(quantity));
        
        return requestId;
    }
    
    /**
     * @notice 請求隨機數用於其他用途（向後兼容版本，支持 payable）
     */
    function requestRandomness(
        uint8, // requestType - 保留接口兼容性
        uint32 _numWords,
        bytes calldata data
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        
        // 處理向後兼容性：記錄但不使用 ETH
        if (msg.value > 0) {
            _handleUnusedEth(msg.sender, msg.value, "requestRandomness");
        }
        
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // 使用訂閱模式請求
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: _numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // 使用 LINK 支付
                    })
                )
            })
        );
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,
            timestamp: block.timestamp
        });
        
        requestIdToContract[requestId] = msg.sender;
        emit RequestSent(requestId, _numWords);
        
        return requestId;
    }
    
    /**
     * @notice 請求隨機數（基礎版本，向後兼容）
     */
    function requestRandomWords(
        uint32 _numWords
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        
        // 處理向後兼容性：記錄但不使用 ETH
        if (msg.value > 0) {
            _handleUnusedEth(msg.sender, msg.value, "requestRandomWords");
        }
        
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // 使用訂閱模式請求
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: _numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // 使用 LINK 支付
                    })
                )
            })
        );
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,
            timestamp: block.timestamp
        });
        
        lastRequestIdByAddress[msg.sender] = requestId;
        requestIdToContract[requestId] = msg.sender;
        emit RequestSent(requestId, _numWords);
        
        return requestId;
    }
    
    // ============================================
    // 向後兼容性處理函數
    // ============================================
    
    /**
     * @notice 處理收到但不需要的 ETH
     */
    function _handleUnusedEth(address sender, uint256 amount, string memory functionName) private {
        // 記錄統計
        totalUnusedEthReceived += amount;
        unusedEthByContract[sender] += amount;
        
        emit UnusedEthReceived(sender, amount, functionName);
        
        // 立即退還 ETH 給調用者
        _refundEth(sender, amount);
    }
    
    /**
     * @notice 退還 ETH 給指定地址
     */
    function _refundEth(address recipient, uint256 amount) private {
        (bool success, ) = recipient.call{value: amount}("");
        if (success) {
            emit EthRefunded(recipient, amount);
        } else {
            // 如果退還失敗，保留在合約中，管理員稍後處理
            emit CallbackFailed(0, recipient, "ETH refund failed");
        }
    }
    
    /**
     * @notice 手動退還卡住的 ETH（僅管理員）
     */
    function manualRefundEth(address recipient, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        _refundEth(recipient, amount);
    }
    
    // ============================================
    // VRF Coordinator 回調函數
    // ============================================
    
    /**
     * @notice VRF Coordinator 回調函數（移除 nonReentrant 避免衝突）
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        // 不使用 nonReentrant，避免與 Chainlink 的保護衝突
        
        if (!s_requests[_requestId].exists) return;
        if (s_requests[_requestId].fulfilled) return;
        
        // 檢查超時
        if (block.timestamp > s_requests[_requestId].timestamp + REQUEST_TIMEOUT) {
            emit RequestTimedOut(_requestId, s_requests[_requestId].requester);
            return;
        }
        
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        
        // 使用低級 call 回調，更安全可靠
        address callbackContract = requestIdToContract[_requestId];
        if (callbackContract != address(0)) {
            (bool success, bytes memory returnData) = callbackContract.call(
                abi.encodeWithSignature("onVRFFulfilled(uint256,uint256[])", _requestId, _randomWords)
            );
            
            if (success) {
                emit CallbackSuccess(_requestId, callbackContract);
            } else {
                emit CallbackFailed(_requestId, callbackContract, returnData);
            }
        }
        
        emit RequestFulfilled(_requestId, _randomWords);
    }
    
    // ============================================
    // 查詢函數
    // ============================================
    
    /**
     * @notice 獲取請求狀態
     */
    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    /**
     * @notice 獲取用戶的隨機數結果
     */
    function getRandomForUser(address user) external view returns (
        bool fulfilled,
        uint256[] memory randomWords
    ) {
        uint256 requestId = lastRequestIdByAddress[user];
        if (requestId == 0 || !s_requests[requestId].exists) {
            return (false, new uint256[](0));
        }
        
        RequestStatus memory request = s_requests[requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    /**
     * @notice 獲取 VRF 請求價格（訂閱模式返回 0，保持接口兼容性）
     */
    function getVrfRequestPrice() external pure returns (uint256) {
        return 0;  // 訂閱模式無需支付
    }
    
    function vrfRequestPrice() external pure returns (uint256) {
        return 0;  // 訂閱模式無需支付
    }
    
    function getTotalFee() external pure returns (uint256) {
        return 0;  // 訂閱模式無需支付
    }
    
    // ============================================
    // 管理函數
    // ============================================
    
    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        s_subscriptionId = _subscriptionId;
    }
    
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        require(_callbackGasLimit >= MIN_CALLBACK_GAS_LIMIT && 
                _callbackGasLimit <= MAX_CALLBACK_GAS_LIMIT, 
                "Gas limit out of range");
        
        uint32 oldLimit = callbackGasLimit;
        callbackGasLimit = _callbackGasLimit;
        emit CallbackGasLimitUpdated(oldLimit, _callbackGasLimit);
    }
    
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        keyHash = _keyHash;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    function setVRFParams(
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        uint32 _numWords
    ) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        require(_callbackGasLimit >= MIN_CALLBACK_GAS_LIMIT && 
                _callbackGasLimit <= MAX_CALLBACK_GAS_LIMIT, 
                "Gas limit out of range");
        
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        numWords = _numWords;
        
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    function setAuthorizedContract(address addr, bool auth) external onlyOwner {
        authorized[addr] = auth;
        emit AuthorizationChanged(addr, auth);
    }
    
    function authorizeContract(address contract_) external onlyOwner {
        authorized[contract_] = true;
        emit AuthorizationChanged(contract_, true);
    }
    
    // ============================================
    // 緊急函數
    // ============================================
    
    /**
     * @notice 緊急提取誤轉的 ERC20 代幣
     */
    function emergencyWithdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        
        tokenContract.transfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @notice 緊急提取 ETH（如果有卡住的退款）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH withdrawal failed");
        
        emit EmergencyWithdraw(address(0), balance);
    }
    
    // ============================================
    // 內部工具函數
    // ============================================
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    // ============================================
    // 接收 ETH
    // ============================================
    
    receive() external payable {
        // 記錄直接發送的 ETH
        if (msg.value > 0) {
            totalUnusedEthReceived += msg.value;
            emit UnusedEthReceived(msg.sender, msg.value, "receive");
            // 直接發送的 ETH 不自動退還，由管理員處理
        }
    }
}
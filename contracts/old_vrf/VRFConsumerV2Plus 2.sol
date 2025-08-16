// 安全版 VRF Manager

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @title SecureVRFManager
 * @notice 完全符合 Chainlink VRF 安全要求的 Manager
 * @dev 實現 12 點安全清單的所有要求
 */
contract SecureVRFManager is VRFConsumerBaseV2Plus, Ownable, ReentrancyGuard, Pausable {
    
    // ============================================
    // 狀態變量 - 按清單要求設計
    // ============================================
    
    enum RequestStatus { None, Requested, Fulfilled, Expired }
    
    struct VRFRequest {
        RequestStatus status;
        address requester;
        address user;
        uint256 timestamp;
        uint256[] randomWords;
        uint32 callbackGasUsed;
        bool exists;
    }
    
    mapping(uint256 => VRFRequest) public requests;
    mapping(address => uint256) public lastRequestIdByContract;
    mapping(address => uint256) public lastRequestIdByUser;
    mapping(address => bool) public authorizedContracts;
    
    // VRF 配置 - BSC 安全參數
    uint256 public subscriptionId;
    bytes32 public keyHash = 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 15; // ✅ BSC 安全確認數
    uint32 public numWords = 1;
    
    // 安全限制
    uint256 public constant REQUEST_TIMEOUT = 24 hours;
    uint32 public constant MIN_GAS_LIMIT = 100000;
    uint32 public constant MAX_GAS_LIMIT = 2500000;
    uint256 public constant MIN_CONFIRMATIONS = 3;
    uint256 public constant MAX_CONFIRMATIONS = 200;
    
    // Rate limiting
    mapping(address => uint256) public lastRequestTime;
    mapping(address => uint256) public dailyRequestCount;
    mapping(address => uint256) public lastResetDay;
    uint256 public constant COOLDOWN_PERIOD = 30;
    uint256 public constant DAILY_LIMIT = 1000;
    
    // ============================================
    // 事件 - 完整審計日誌
    // ============================================
    
    event VRFRequested(uint256 indexed requestId, address indexed requester, address indexed user);
    event VRFFulfilled(uint256 indexed requestId, uint256[] randomWords, uint32 gasUsed);
    event VRFExpired(uint256 indexed requestId, address indexed requester);
    event CallbackSuccess(uint256 indexed requestId, address indexed contract_);
    event CallbackFailed(uint256 indexed requestId, address indexed contract_, bytes reason);
    event ContractAuthorized(address indexed contract_, bool authorized);
    event VRFParamsUpdated(uint32 gasLimit, uint16 confirmations);
    
    // ============================================
    // 構造函數
    // ============================================
    
    constructor(
        uint256 _subscriptionId,
        address _vrfCoordinator,
        address _owner
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) Ownable(_owner) {
        subscriptionId = _subscriptionId;
    }
    
    // ============================================
    // 修飾符
    // ============================================
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    modifier rateLimited() {
        _checkRateLimit();
        _;
    }
    
    // ============================================
    // 主要函數 - 按清單實施安全措施
    // ============================================
    
    /**
     * @notice 為用戶請求隨機數 - 實施所有安全措施
     * @dev 清單第1,3,5,9點：requestId綁定、輸入鎖定、確認數、權限控制
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8, // 保留兼容性
        bytes32 // 保留兼容性
    ) external onlyAuthorized rateLimited whenNotPaused nonReentrant returns (uint256 requestId) {
        require(user != address(0), "Invalid user");
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        
        // 檢查用戶是否有進行中的請求 - 清單第3點
        uint256 lastReqId = lastRequestIdByUser[user];
        if (lastReqId != 0) {
            VRFRequest storage lastReq = requests[lastReqId];
            require(
                lastReq.status == RequestStatus.Fulfilled || 
                lastReq.status == RequestStatus.Expired ||
                _isRequestExpired(lastReqId), 
                "User has pending request"
            );
        }
        
        // 動態調整 gas limit
        uint32 dynamicGasLimit = _calculateDynamicGasLimit(quantity);
        
        // 發送 VRF 請求 - 清單第6點：使用官方介面
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: dynamicGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        
        // 記錄請求狀態 - 清單第1點：requestId綁定
        requests[requestId] = VRFRequest({
            status: RequestStatus.Requested,
            requester: msg.sender,
            user: user,
            timestamp: block.timestamp,
            randomWords: new uint256[](0),
            callbackGasUsed: 0,
            exists: true
        });
        
        lastRequestIdByContract[msg.sender] = requestId;
        lastRequestIdByUser[user] = requestId;
        
        emit VRFRequested(requestId, msg.sender, user);
        return requestId;
    }
    
    /**
     * @notice VRF 回調函數 - 清單第2,7點：不得revert、單純化邏輯
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override nonReentrant {
        VRFRequest storage request = requests[requestId];
        
        // 清單第2點：回調不得revert - 用return代替require
        if (!request.exists) return;
        if (request.status != RequestStatus.Requested) return;
        if (_isRequestExpired(requestId)) {
            request.status = RequestStatus.Expired;
            emit VRFExpired(requestId, request.requester);
            return;
        }
        
        // 清單第7點：單純化邏輯 - 只做狀態更新
        uint256 gasStart = gasleft();
        request.status = RequestStatus.Fulfilled;
        request.randomWords = randomWords;
        
        emit VRFFulfilled(requestId, randomWords, uint32(gasStart - gasleft()));
        
        // 清單第2點：外部調用分離，避免revert影響VRF狀態
        _safeCallback(requestId, request.requester, randomWords);
    }
    
    /**
     * @notice 安全的回調處理 - 清單第2點
     */
    function _safeCallback(uint256 requestId, address callbackContract, uint256[] memory randomWords) internal {
        if (callbackContract == address(0)) return;
        
        // 使用低級別 call 避免 revert 影響主邏輯
        (bool success, bytes memory returnData) = callbackContract.call(
            abi.encodeWithSignature("onVRFFulfilled(uint256,uint256[])", requestId, randomWords)
        );
        
        if (success) {
            emit CallbackSuccess(requestId, callbackContract);
        } else {
            emit CallbackFailed(requestId, callbackContract, returnData);
        }
        
        // 記錄實際使用的 gas
        VRFRequest storage request = requests[requestId];
        request.callbackGasUsed = uint32(callbackGasLimit - gasleft());
    }
    
    // ============================================
    // 查詢函數
    // ============================================
    
    function getRandomForUser(address user) external view returns (
        bool fulfilled,
        uint256[] memory randomWords
    ) {
        uint256 requestId = lastRequestIdByUser[user];
        if (requestId == 0) return (false, new uint256[](0));
        
        VRFRequest storage request = requests[requestId];
        if (request.status == RequestStatus.Fulfilled) {
            return (true, request.randomWords);
        }
        
        return (false, new uint256[](0));
    }
    
    function getRequestStatus(uint256 requestId) external view returns (
        RequestStatus status,
        bool expired,
        uint256[] memory randomWords
    ) {
        VRFRequest storage request = requests[requestId];
        if (!request.exists) return (RequestStatus.None, false, new uint256[](0));
        
        bool isExpired = _isRequestExpired(requestId);
        return (
            isExpired ? RequestStatus.Expired : request.status,
            isExpired,
            request.randomWords
        );
    }
    
    // ============================================
    // 管理函數 - 清單第9點：治理控制
    // ============================================
    
    function setVRFParams(
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        require(
            _callbackGasLimit >= MIN_GAS_LIMIT && _callbackGasLimit <= MAX_GAS_LIMIT,
            "Invalid gas limit"
        );
        require(
            _requestConfirmations >= MIN_CONFIRMATIONS && _requestConfirmations <= MAX_CONFIRMATIONS,
            "Invalid confirmations"
        );
        
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        
        emit VRFParamsUpdated(_callbackGasLimit, _requestConfirmations);
    }
    
    function setAuthorizedContract(address contract_, bool authorized) external onlyOwner {
        authorizedContracts[contract_] = authorized;
        emit ContractAuthorized(contract_, authorized);
    }
    
    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
    
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        keyHash = _keyHash;
    }
    
    // ============================================
    // 內部輔助函數
    // ============================================
    
    function _isRequestExpired(uint256 requestId) internal view returns (bool) {
        VRFRequest storage request = requests[requestId];
        return block.timestamp > request.timestamp + REQUEST_TIMEOUT;
    }
    
    function _calculateDynamicGasLimit(uint256 quantity) internal view returns (uint32) {
        uint32 baseGas = 200000;
        uint32 perItemGas = 15000;
        uint32 calculated = baseGas + uint32(quantity * perItemGas);
        
        return calculated > MAX_GAS_LIMIT ? MAX_GAS_LIMIT : calculated;
    }
    
    function _checkRateLimit() internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (lastResetDay[msg.sender] < currentDay) {
            dailyRequestCount[msg.sender] = 0;
            lastResetDay[msg.sender] = currentDay;
        }
        
        require(
            block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown active"
        );
        require(dailyRequestCount[msg.sender] < DAILY_LIMIT, "Daily limit exceeded");
        
        lastRequestTime[msg.sender] = block.timestamp;
        dailyRequestCount[msg.sender]++;
    }
    
    // ============================================
    // 緊急函數
    // ============================================
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function cleanupExpiredRequest(uint256 requestId) external {
        require(_isRequestExpired(requestId), "Not expired");
        VRFRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Requested, "Not pending");
        
        request.status = RequestStatus.Expired;
        emit VRFExpired(requestId, request.requester);
    }
}
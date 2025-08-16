// VRFConsumerV2Plus_unified.sol - 統一狀態管理版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @title VRFConsumerV2Plus_Unified
 * @notice 統一狀態管理的 VRF Manager - 解決多層狀態不同步問題
 * @dev 主要改進：
 * 1. 統一的狀態機管理所有請求類型
 * 2. 單一真相來源，避免狀態不同步
 * 3. 支援多種業務類型（Mint/Expedition/Upgrade）
 * 4. 簡化業務層實施，只需查詢不需管理狀態
 */
contract VRFConsumerV2Plus_Unified is VRFConsumerBaseV2Plus, ReentrancyGuard {
    
    // ============================================
    // 統一狀態定義
    // ============================================
    
    // 統一的請求狀態（所有業務共用）
    enum RequestStatus { 
        None,           // 0: 無請求
        Pending,        // 1: 等待 VRF 回應
        Fulfilled,      // 2: VRF 已完成，等待業務處理
        Processing,     // 3: 業務處理中
        Completed,      // 4: 全部完成
        Expired         // 5: 已超時
    }
    
    // 請求類型（區分不同業務）
    enum RequestType {
        HeroMint,       // 0: Hero NFT 鑄造
        RelicMint,      // 1: Relic NFT 鑄造
        Expedition,     // 2: 地城探索
        Upgrade         // 3: 升星
    }
    
    // 統一的請求結構
    struct UnifiedRequest {
        RequestStatus status;        // 當前狀態
        RequestType requestType;     // 請求類型
        address requester;           // 發起合約
        address user;                // 最終用戶
        uint256 timestamp;           // 請求時間
        uint256 payment;             // 支付金額（如果有）
        uint256[] randomWords;       // VRF 隨機數
        bytes businessData;          // 業務特定數據（編碼存儲）
        uint32 numWords;             // 請求的隨機數數量
    }
    
    // ============================================
    // 狀態變量
    // ============================================
    
    // 核心映射
    mapping(uint256 => UnifiedRequest) public requests;                    // requestId => 請求詳情
    mapping(address => mapping(RequestType => uint256)) public userActiveRequests; // user => type => requestId
    mapping(address => uint256) public lastRequestIdByContract;           // 合約 => 最後的 requestId
    
    // VRF 配置
    uint256 public s_subscriptionId;
    bytes32 public keyHash = 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4; // BSC 200 gwei
    uint32 public callbackGasLimit = 2500000;  
    uint16 public requestConfirmations = 6;    // 6 個區塊確認
    
    // 安全參數
    uint256 public constant REQUEST_TIMEOUT = 30 minutes;
    uint256 public constant EMERGENCY_TIMEOUT = 1 hours;  // 緊急超時（任何人可清理）
    uint32 public constant MIN_CALLBACK_GAS_LIMIT = 100000;
    uint32 public constant MAX_CALLBACK_GAS_LIMIT = 2500000;
    
    // 權限管理
    mapping(address => bool) public authorized;
    mapping(address => uint256) public lastRequestTime;
    uint256 public constant COOLDOWN_PERIOD = 30;
    
    // ============================================
    // 事件
    // ============================================
    
    event RequestCreated(
        uint256 indexed requestId,
        RequestType indexed requestType,
        address indexed user,
        address requester,
        uint32 numWords
    );
    
    event RequestFulfilled(
        uint256 indexed requestId,
        uint256[] randomWords
    );
    
    event RequestProcessed(
        uint256 indexed requestId,
        address indexed processor
    );
    
    event RequestCompleted(
        uint256 indexed requestId,
        RequestType requestType,
        address indexed user
    );
    
    event RequestExpired(
        uint256 indexed requestId,
        address indexed cleaner
    );
    
    event CallbackSuccess(uint256 indexed requestId, address indexed contract_);
    event CallbackFailed(uint256 indexed requestId, address indexed contract_, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    
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
    
    modifier rateLimited() {
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        _;
    }
    
    // ============================================
    // 核心請求函數（統一入口）
    // ============================================
    
    /**
     * @notice 創建新的 VRF 請求（統一接口）
     * @param user 最終用戶地址
     * @param requestType 請求類型
     * @param numWords 需要的隨機數數量
     * @param businessData 業務特定數據
     * @return requestId VRF 請求 ID
     */
    function createRequest(
        address user,
        RequestType requestType,
        uint32 numWords,
        bytes calldata businessData
    ) external onlyAuthorized rateLimited nonReentrant returns (uint256 requestId) {
        // 檢查用戶是否有未完成的同類型請求
        uint256 existingRequestId = userActiveRequests[user][requestType];
        if (existingRequestId != 0) {
            UnifiedRequest storage existingRequest = requests[existingRequestId];
            require(
                existingRequest.status == RequestStatus.None || 
                existingRequest.status == RequestStatus.Completed ||
                existingRequest.status == RequestStatus.Expired,
                "Active request exists"
            );
        }
        
        // 動態調整 gas（批量操作需要更多）
        uint32 dynamicGasLimit = _calculateDynamicGasLimit(requestType, numWords);
        
        // 請求 VRF
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: dynamicGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false
                    })
                )
            })
        );
        
        // 存儲請求
        requests[requestId] = UnifiedRequest({
            status: RequestStatus.Pending,
            requestType: requestType,
            requester: msg.sender,
            user: user,
            timestamp: block.timestamp,
            payment: 0,  // 支付在業務層處理
            randomWords: new uint256[](0),
            businessData: businessData,
            numWords: numWords
        });
        
        // 更新映射
        userActiveRequests[user][requestType] = requestId;
        lastRequestIdByContract[msg.sender] = requestId;
        
        emit RequestCreated(requestId, requestType, user, msg.sender, numWords);
        return requestId;
    }
    
    /**
     * @notice 專門給 Hero/Relic Mint 的便捷接口
     */
    function requestRandomForMint(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external onlyAuthorized rateLimited nonReentrant returns (uint256 requestId) {
        RequestType reqType = authorized[msg.sender] ? 
            (keccak256(abi.encodePacked(msg.sender)) == keccak256(abi.encodePacked("Hero")) ? 
                RequestType.HeroMint : RequestType.RelicMint) : 
            RequestType.HeroMint;
        
        bytes memory businessData = abi.encode(quantity, maxRarity, commitment);
        return createRequest(user, reqType, 1, businessData);
    }
    
    /**
     * @notice 專門給 DungeonMaster 的便捷接口
     */
    function requestRandomForExpedition(
        address user,
        uint256 partyId,
        uint256 dungeonId
    ) external onlyAuthorized rateLimited nonReentrant returns (uint256 requestId) {
        bytes memory businessData = abi.encode(partyId, dungeonId);
        return createRequest(user, RequestType.Expedition, 1, businessData);
    }
    
    /**
     * @notice 專門給 AltarOfAscension 的便捷接口
     */
    function requestRandomForUpgrade(
        address user,
        uint256[] calldata heroIds,
        uint256[] calldata relicIds
    ) external onlyAuthorized rateLimited nonReentrant returns (uint256 requestId) {
        bytes memory businessData = abi.encode(heroIds, relicIds);
        return createRequest(user, RequestType.Upgrade, 1, businessData);
    }
    
    // ============================================
    // VRF 回調（Chainlink 調用）
    // ============================================
    
    /**
     * @notice VRF Coordinator 回調函數
     * @dev 不使用 nonReentrant 避免與 Chainlink 衝突
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        UnifiedRequest storage request = requests[requestId];
        
        // 使用 return 而非 revert（防止 VRF 失敗）
        if (request.status != RequestStatus.Pending) return;
        if (block.timestamp > request.timestamp + REQUEST_TIMEOUT) {
            request.status = RequestStatus.Expired;
            emit RequestExpired(requestId, address(0));
            return;
        }
        
        // 更新狀態和隨機數
        request.status = RequestStatus.Fulfilled;
        request.randomWords = randomWords;
        
        emit RequestFulfilled(requestId, randomWords);
        
        // 嘗試回調業務合約
        _safeCallback(requestId, request.requester, randomWords);
    }
    
    /**
     * @notice 安全的回調處理
     */
    function _safeCallback(
        uint256 requestId,
        address callbackContract,
        uint256[] memory randomWords
    ) internal {
        if (callbackContract == address(0)) return;
        
        // 使用低級 call 避免 revert 影響主流程
        (bool success, bytes memory returnData) = callbackContract.call(
            abi.encodeWithSignature("onVRFFulfilled(uint256,uint256[])", requestId, randomWords)
        );
        
        if (success) {
            emit CallbackSuccess(requestId, callbackContract);
        } else {
            emit CallbackFailed(requestId, callbackContract, returnData);
        }
    }
    
    // ============================================
    // 狀態查詢函數（業務層使用）
    // ============================================
    
    /**
     * @notice 獲取用戶特定類型請求的狀態
     */
    function getUserRequestStatus(
        address user,
        RequestType requestType
    ) external view returns (
        RequestStatus status,
        uint256 requestId,
        uint256 timestamp,
        bool canReveal
    ) {
        requestId = userActiveRequests[user][requestType];
        if (requestId == 0) {
            return (RequestStatus.None, 0, 0, false);
        }
        
        UnifiedRequest storage request = requests[requestId];
        status = request.status;
        timestamp = request.timestamp;
        canReveal = (status == RequestStatus.Fulfilled);
        
        // 檢查是否超時
        if (status == RequestStatus.Pending && 
            block.timestamp > timestamp + REQUEST_TIMEOUT) {
            status = RequestStatus.Expired;
        }
    }
    
    /**
     * @notice 獲取隨機數（業務層 reveal 時調用）
     */
    function getRandomWords(uint256 requestId) 
        external view 
        returns (bool ready, uint256[] memory randomWords) 
    {
        UnifiedRequest storage request = requests[requestId];
        ready = (request.status == RequestStatus.Fulfilled);
        randomWords = request.randomWords;
    }
    
    /**
     * @notice 檢查用戶是否可以發起新請求
     */
    function canMakeRequest(address user, RequestType requestType) 
        external view 
        returns (bool) 
    {
        uint256 requestId = userActiveRequests[user][requestType];
        if (requestId == 0) return true;
        
        UnifiedRequest storage request = requests[requestId];
        return (request.status == RequestStatus.None || 
                request.status == RequestStatus.Completed ||
                request.status == RequestStatus.Expired);
    }
    
    // ============================================
    // 狀態更新函數（業務層調用）
    // ============================================
    
    /**
     * @notice 標記請求開始處理（業務層開始 reveal）
     */
    function markProcessing(uint256 requestId) external onlyAuthorized {
        UnifiedRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Fulfilled, "Not ready for processing");
        request.status = RequestStatus.Processing;
        emit RequestProcessed(requestId, msg.sender);
    }
    
    /**
     * @notice 標記請求完成（業務層完成所有處理）
     */
    function markCompleted(uint256 requestId) external onlyAuthorized {
        UnifiedRequest storage request = requests[requestId];
        require(
            request.status == RequestStatus.Fulfilled || 
            request.status == RequestStatus.Processing,
            "Invalid status for completion"
        );
        
        request.status = RequestStatus.Completed;
        
        // 清理活躍請求映射
        address user = request.user;
        RequestType reqType = request.requestType;
        if (userActiveRequests[user][reqType] == requestId) {
            delete userActiveRequests[user][reqType];
        }
        
        emit RequestCompleted(requestId, reqType, user);
    }
    
    // ============================================
    // 超時清理（混合權限）
    // ============================================
    
    /**
     * @notice 清理超時請求
     */
    function cleanupExpiredRequest(uint256 requestId) external {
        UnifiedRequest storage request = requests[requestId];
        require(request.status == RequestStatus.Pending, "Not pending");
        require(block.timestamp > request.timestamp + REQUEST_TIMEOUT, "Not expired");
        
        // 混合權限檢查
        require(
            msg.sender == request.user ||           // 用戶自己
            msg.sender == owner() ||                // Owner
            msg.sender == request.requester ||      // 發起合約
            block.timestamp > request.timestamp + EMERGENCY_TIMEOUT,  // 緊急超時
            "Not authorized to cleanup"
        );
        
        // 標記為過期
        request.status = RequestStatus.Expired;
        
        // 清理活躍請求
        address user = request.user;
        RequestType reqType = request.requestType;
        if (userActiveRequests[user][reqType] == requestId) {
            delete userActiveRequests[user][reqType];
        }
        
        emit RequestExpired(requestId, msg.sender);
        
        // 注意：退款邏輯在業務層處理，這裡只管理狀態
    }
    
    // ============================================
    // 輔助函數
    // ============================================
    
    /**
     * @notice 動態計算 gas limit
     */
    function _calculateDynamicGasLimit(
        RequestType requestType,
        uint32 numWords
    ) internal view returns (uint32) {
        uint32 baseGas = 200000;
        uint32 perWordGas = 20000;
        
        // 根據類型調整
        if (requestType == RequestType.HeroMint || requestType == RequestType.RelicMint) {
            baseGas = 250000;  // Mint 需要更多 gas
        } else if (requestType == RequestType.Upgrade) {
            baseGas = 300000;  // 升級最複雜
        }
        
        uint32 calculated = baseGas + (numWords * perWordGas);
        return calculated > MAX_CALLBACK_GAS_LIMIT ? MAX_CALLBACK_GAS_LIMIT : calculated;
    }
    
    /**
     * @notice 批量獲取請求狀態（方便前端）
     */
    function batchGetRequestStatus(uint256[] calldata requestIds) 
        external view 
        returns (RequestStatus[] memory statuses) 
    {
        statuses = new RequestStatus[](requestIds.length);
        for (uint256 i = 0; i < requestIds.length; i++) {
            statuses[i] = requests[requestIds[i]].status;
        }
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
        callbackGasLimit = _callbackGasLimit;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        require(_confirmations >= 3 && _confirmations <= 200, "Invalid confirmations");
        requestConfirmations = _confirmations;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        keyHash = _keyHash;
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
     * @notice 緊急重置用戶請求（僅 owner）
     */
    function emergencyResetUserRequest(
        address user,
        RequestType requestType
    ) external onlyOwner {
        uint256 requestId = userActiveRequests[user][requestType];
        if (requestId != 0) {
            requests[requestId].status = RequestStatus.Expired;
            delete userActiveRequests[user][requestType];
            emit RequestExpired(requestId, msg.sender);
        }
    }
    
    /**
     * @notice 獲取請求詳情（調試用）
     */
    function getRequestDetails(uint256 requestId) 
        external view 
        returns (UnifiedRequest memory) 
    {
        return requests[requestId];
    }
}

// 簡單的 Math 庫
library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
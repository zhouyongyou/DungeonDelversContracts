// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @title VRFConsumerV2Plus_Final
 * @notice 最終生產版本 - 基於 optimized 版本的最小化改進
 * @dev 核心改進點：
 * 1. ✅ 保持 fulfillRandomWords 無 nonReentrant（避免 Chainlink 衝突）
 * 2. ✅ 使用低級 call 回調（兼容業務層的 nonReentrant）
 * 3. ✅ 30分鐘超時 + 混合權限清理
 * 4. ✅ 簡單狀態管理（不過度設計）
 * 5. ✅ Pull Payment 支援（安全退款）
 */
contract VRFConsumerV2Plus_Final is VRFConsumerBaseV2Plus, ReentrancyGuard {
    
    // ============================================
    // 事件
    // ============================================
    
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event CallbackSuccess(uint256 indexed requestId, address indexed callbackContract);
    event CallbackFailed(uint256 indexed requestId, address indexed callbackContract, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    event RequestTimedOut(uint256 indexed requestId, address indexed requester);
    event RefundAvailable(address indexed user, uint256 amount);
    event RefundClaimed(address indexed user, uint256 amount);
    
    // ============================================
    // 狀態變量
    // ============================================
    
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
        address requester;      // 調用合約地址
        address user;           // 最終用戶地址
        uint256 timestamp;      // 請求時間戳
        uint256 payment;        // 用戶支付金額（如果有）
    }
    
    mapping(uint256 => RequestStatus) public s_requests;
    mapping(address => uint256) public lastRequestIdByAddress;
    
    // 映射關係
    mapping(uint256 => address) public requestIdToUser;        // 請求ID -> 最終用戶
    mapping(uint256 => address) public requestIdToContract;    // 請求ID -> 調用合約
    
    // Pull Payment 實現
    mapping(address => uint256) public pendingRefunds;
    uint256 public totalPendingRefunds;
    
    // VRF 配置
    uint256 public s_subscriptionId;
    
    // 最佳實踐參數（BSC 主網優化）
    bytes32 public keyHash = 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4; // BSC 200 gwei
    uint32 public callbackGasLimit = 2500000;  // 保持充足 gas
    uint16 public requestConfirmations = 6;    // 6 個區塊（18秒）
    uint32 public numWords = 1;
    
    // Gas 限制範圍
    uint32 public constant MIN_CALLBACK_GAS_LIMIT = 100000;
    uint32 public constant MAX_CALLBACK_GAS_LIMIT = 2500000;
    
    // 授權合約
    mapping(address => bool) public authorized;
    
    // Rate limiting
    mapping(address => uint256) public lastRequestTime;
    uint256 public constant COOLDOWN_PERIOD = 30; // 30 秒冷卻
    uint256 public constant REQUEST_TIMEOUT = 30 minutes; // 30 分鐘超時
    uint256 public constant EMERGENCY_TIMEOUT = 60 minutes; // 60 分鐘緊急超時
    
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
    // 主要函數
    // ============================================
    
    /**
     * @notice 請求隨機數（標準接口）
     * @dev 保持與現有合約的兼容性
     */
    function requestRandomWords(
        uint32 _numWords
    ) external onlyAuthorized nonReentrant returns (uint256 requestId) {
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // 使用訂閱模式請求
        requestId = _requestVRF(_numWords, callbackGasLimit);
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,
            user: msg.sender,  // 默認用戶就是調用者
            timestamp: block.timestamp,
            payment: 0
        });
        
        lastRequestIdByAddress[msg.sender] = requestId;
        requestIdToContract[requestId] = msg.sender;
        emit RequestSent(requestId, _numWords);
        
        return requestId;
    }
    
    /**
     * @notice 為用戶請求隨機數（NFT 合約專用）
     * @dev 支持支付處理（用於退款）
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8, // maxRarity - 保留接口兼容性
        bytes32 // commitment - 保留接口兼容性
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        require(quantity > 0 && quantity <= 50, "Invalid quantity");
        
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // 動態調整 gas limit（批量操作需要更多 gas）
        uint32 dynamicGasLimit = _calculateDynamicGasLimit(quantity);
        
        // 請求 VRF
        requestId = _requestVRF(1, dynamicGasLimit);  // 總是請求 1 個隨機數
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,
            user: user,
            timestamp: block.timestamp,
            payment: msg.value  // 記錄支付金額（用於退款）
        });
        
        lastRequestIdByAddress[user] = requestId;
        requestIdToUser[requestId] = user;
        requestIdToContract[requestId] = msg.sender;
        emit RequestSent(requestId, uint32(quantity));
        
        return requestId;
    }
    
    /**
     * @notice 內部 VRF 請求函數
     */
    function _requestVRF(uint32 _numWords, uint32 _gasLimit) internal returns (uint256) {
        return s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: _gasLimit,
                numWords: _numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // 使用 LINK 支付
                    })
                )
            })
        );
    }
    
    /**
     * @notice VRF Coordinator 回調函數
     * @dev 核心安全設計：
     *      - 無 nonReentrant（避免 Chainlink 衝突）
     *      - 使用狀態檢查防止重入
     *      - 使用 return 而非 revert（確保 VRF 狀態正確）
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        // 狀態檢查（代替 nonReentrant）
        if (!s_requests[_requestId].exists) return;
        if (s_requests[_requestId].fulfilled) return;
        
        // 檢查超時
        if (block.timestamp > s_requests[_requestId].timestamp + REQUEST_TIMEOUT) {
            emit RequestTimedOut(_requestId, s_requests[_requestId].requester);
            return;
        }
        
        // 立即更新狀態，防止重入
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        
        emit RequestFulfilled(_requestId, _randomWords);
        
        // 安全回調
        _safeCallback(_requestId, requestIdToContract[_requestId], _randomWords);
    }
    
    /**
     * @notice 安全的回調處理
     * @dev 使用低級 call 確保：
     *      1. 不會因業務層 revert 影響 VRF 狀態
     *      2. 兼容業務層的 nonReentrant
     *      3. 記錄失敗原因便於調試
     */
    function _safeCallback(
        uint256 requestId,
        address callbackContract,
        uint256[] memory randomWords
    ) internal {
        if (callbackContract == address(0)) return;
        
        // 低級 call - 不會被業務層的 nonReentrant 阻擋
        (bool success, bytes memory returnData) = callbackContract.call(
            abi.encodeWithSignature("onVRFFulfilled(uint256,uint256[])", requestId, randomWords)
        );
        
        if (success) {
            emit CallbackSuccess(requestId, callbackContract);
        } else {
            // 記錄失敗但不 revert
            emit CallbackFailed(requestId, callbackContract, returnData);
        }
    }
    
    // ============================================
    // 超時處理（混合權限模式）
    // ============================================
    
    /**
     * @notice 清理超時請求
     * @dev 實現三級權限：
     *      1. 用戶自己（立即）
     *      2. Owner（立即）
     *      3. 任何人（60分鐘後）
     */
    function cleanupExpiredRequest(uint256 requestId) external nonReentrant {
        RequestStatus storage request = s_requests[requestId];
        require(request.exists, "Request not found");
        require(!request.fulfilled, "Already fulfilled");
        require(block.timestamp > request.timestamp + REQUEST_TIMEOUT, "Not expired");
        
        // 混合權限檢查
        require(
            msg.sender == request.user ||      // 用戶自己
            msg.sender == owner() ||           // Owner
            block.timestamp > request.timestamp + EMERGENCY_TIMEOUT,  // 60分鐘後任何人
            "Not authorized to cleanup"
        );
        
        // 標記為已處理
        request.fulfilled = true;
        
        // 如果有支付，記錄退款（Pull Payment）
        if (request.payment > 0) {
            pendingRefunds[request.user] += request.payment;
            totalPendingRefunds += request.payment;
            emit RefundAvailable(request.user, request.payment);
        }
        
        emit RequestTimedOut(requestId, request.requester);
    }
    
    /**
     * @notice 領取退款（Pull Payment）
     */
    function claimRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0, "No refund available");
        
        // 先清零再轉賬（防重入）
        pendingRefunds[msg.sender] = 0;
        totalPendingRefunds -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(msg.sender, amount);
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
        require(s_requests[_requestId].exists, "Request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    /**
     * @notice 檢查請求是否超時
     */
    function isRequestExpired(uint256 _requestId) external view returns (bool) {
        if (!s_requests[_requestId].exists) return false;
        if (s_requests[_requestId].fulfilled) return false;
        return block.timestamp > s_requests[_requestId].timestamp + REQUEST_TIMEOUT;
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
     * @notice 獲取退款餘額
     */
    function getRefundBalance(address user) external view returns (uint256) {
        return pendingRefunds[user];
    }
    
    /**
     * @notice 獲取 VRF 請求價格（訂閱模式返回 0）
     */
    function getVrfRequestPrice() external pure returns (uint256) {
        return 0;  // 訂閱模式無需支付
    }
    
    // ============================================
    // 管理函數
    // ============================================
    
    /**
     * @notice 設置訂閱 ID
     */
    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        s_subscriptionId = _subscriptionId;
    }
    
    /**
     * @notice 設置 callback gas limit
     */
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        require(_callbackGasLimit >= MIN_CALLBACK_GAS_LIMIT && 
                _callbackGasLimit <= MAX_CALLBACK_GAS_LIMIT, 
                "Gas limit out of range");
        
        callbackGasLimit = _callbackGasLimit;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice 設置確認數
     */
    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        require(_confirmations >= 3 && _confirmations <= 200, "Invalid confirmations");
        requestConfirmations = _confirmations;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice 設置 keyHash
     */
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        keyHash = _keyHash;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice 授權合約
     */
    function setAuthorizedContract(address addr, bool auth) external onlyOwner {
        authorized[addr] = auth;
        emit AuthorizationChanged(addr, auth);
    }
    
    /**
     * @notice 授權合約（兼容接口）
     */
    function authorizeContract(address contract_) external onlyOwner {
        authorized[contract_] = true;
        emit AuthorizationChanged(contract_, true);
    }
    
    /**
     * @notice 提取合約餘額（緊急函數）
     * @dev 保護退款池
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 available = address(this).balance - totalPendingRefunds;
        require(available > 0, "No funds available");
        
        (bool success, ) = owner().call{value: available}("");
        require(success, "Withdraw failed");
    }
    
    // ============================================
    // 內部輔助函數
    // ============================================
    
    /**
     * @notice 動態計算 gas limit
     */
    function _calculateDynamicGasLimit(uint256 quantity) internal view returns (uint32) {
        // 基礎 200k + 每個 item 15k
        uint32 baseGas = 200000;
        uint32 perItemGas = 15000;
        uint32 calculated = baseGas + uint32(quantity * perItemGas);
        
        return calculated > MAX_CALLBACK_GAS_LIMIT ? MAX_CALLBACK_GAS_LIMIT : calculated;
    }
    
    // 接收 ETH（用於退款）
    receive() external payable {}
}

// 簡單的 Math 庫
library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
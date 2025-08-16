// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVRFManager_Compatible
 * @notice 向後兼容的 VRF Manager 介面
 * @dev 主要特點：
 * 1. 保留 payable 修飾符以支持舊合約調用
 * 2. 訂閱模式不使用傳入的 ETH，但接受並退還
 * 3. 完全兼容現有的 DungeonMaster 和 AltarOfAscension 調用
 * 4. 添加向後兼容性監控函數
 */
interface IVRFManager {
    // ============================================
    // 枚舉和結構
    // ============================================
    
    enum RequestType { HERO_MINT, RELIC_MINT, ALTAR_UPGRADE, DUNGEON_EXPLORE }
    
    struct RandomRequest {
        address requester;
        RequestType requestType;
        bytes data;
        bool fulfilled;
        uint256[] randomWords;
    }
    
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
        address requester;
        uint256 timestamp;
    }
    
    // ============================================
    // 核心請求函數（保留 payable 以向後兼容）
    // ============================================
    
    /**
     * @notice 請求隨機數（基礎版本）
     * @dev 保留 payable 但在訂閱模式下會退還 ETH
     */
    function requestRandomWords(uint32 _numWords) external payable returns (uint256);
    
    /**
     * @notice 為用戶請求隨機數
     * @dev 保留 payable 以支持 DungeonMaster 等舊合約的 {value: vrfFee} 調用
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable returns (uint256);
    
    /**
     * @notice 請求隨機數用於其他用途
     * @dev 保留 payable 以支持 AltarOfAscension 等舊合約
     */
    function requestRandomness(
        uint8 requestType,
        uint32 numWords,
        bytes calldata data
    ) external payable returns (uint256);
    
    // ============================================
    // 查詢函數
    // ============================================
    
    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWords);
    
    function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] memory randomWords);
    
    /**
     * @notice 獲取 VRF 請求價格（訂閱模式返回 0）
     * @dev 改為 pure 因為訂閱模式總是返回 0
     */
    function getVrfRequestPrice() external pure returns (uint256);
    
    /**
     * @notice 獲取 VRF 請求價格（別名）
     */
    function vrfRequestPrice() external pure returns (uint256);
    
    /**
     * @notice 獲取總費用（訂閱模式返回 0）
     */
    function getTotalFee() external pure returns (uint256);
    
    // ============================================
    // 映射查詢（用於回調）
    // ============================================
    
    function requestIdToUser(uint256 requestId) external view returns (address);
    function requestIdToContract(uint256 requestId) external view returns (address);
    
    // ============================================
    // 管理函數
    // ============================================
    
    function setSubscriptionId(uint256 _subscriptionId) external;
    function setCallbackGasLimit(uint32 _callbackGasLimit) external;
    function setKeyHash(bytes32 _keyHash) external;
    function setVRFParams(bytes32 _keyHash, uint32 _callbackGasLimit, uint16 _requestConfirmations, uint32 _numWords) external;
    
    // 授權管理
    function setAuthorizedContract(address addr, bool auth) external;
    function authorizeContract(address contract_) external;
    function authorized(address contract_) external view returns (bool);
    
    // ============================================
    // 向後兼容性監控函數
    // ============================================
    
    /**
     * @notice 查詢總共收到但未使用的 ETH 量
     */
    function totalUnusedEthReceived() external view returns (uint256);
    
    /**
     * @notice 查詢特定合約發送但未使用的 ETH 量
     */
    function unusedEthByContract(address contractAddr) external view returns (uint256);
    
    /**
     * @notice 手動退還卡住的 ETH（僅管理員）
     */
    function manualRefundEth(address recipient, uint256 amount) external;
    
    // ============================================
    // 緊急函數
    // ============================================
    
    /**
     * @notice 緊急提取誤轉的 ERC20 代幣
     */
    function emergencyWithdrawToken(address token, uint256 amount) external;
    
    /**
     * @notice 緊急提取 ETH
     */
    function emergencyWithdraw() external;
    
    // ============================================
    // 向後兼容性事件
    // ============================================
    
    event UnusedEthReceived(address indexed sender, uint256 amount, string functionName);
    event EthRefunded(address indexed recipient, uint256 amount);
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event CallbackSuccess(uint256 indexed requestId, address indexed callbackContract);
    event CallbackFailed(uint256 indexed requestId, address indexed callbackContract, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    event CallbackGasLimitUpdated(uint32 oldLimit, uint32 newLimit);
    event RequestTimedOut(uint256 indexed requestId, address indexed requester);
    event EmergencyWithdraw(address indexed token, uint256 amount);
}
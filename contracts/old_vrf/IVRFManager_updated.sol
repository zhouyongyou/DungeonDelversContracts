// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVRFManager_Updated
 * @notice 更新後的 VRF Manager 介面，匹配最新實現
 * @dev 主要變更：
 * 1. 移除 payable（訂閱模式不需要支付）
 * 2. 添加緊急提取函數
 * 3. 添加超時和 Rate Limiting 相關查詢
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
    // 核心請求函數（訂閱模式，不需要 payable）
    // ============================================
    
    function requestRandomWords(uint32 _numWords) external returns (uint256);
    
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external returns (uint256);  // 注意：移除了 payable
    
    function requestRandomness(
        uint8 requestType,
        uint32 numWords,
        bytes calldata data
    ) external returns (uint256);  // 注意：移除了 payable
    
    // ============================================
    // 查詢函數
    // ============================================
    
    function getVrfRequestPrice() external pure returns (uint256);
    function vrfRequestPrice() external pure returns (uint256);
    function getTotalFee() external pure returns (uint256);
    
    function getRandomForUser(address user) external view returns (
        bool fulfilled,
        uint256[] memory randomWords
    );
    
    function getRequestStatus(uint256 _requestId) external view returns (
        bool fulfilled,
        uint256[] memory randomWords
    );
    
    function isRequestExpired(uint256 _requestId) external view returns (bool);
    
    // ============================================
    // 映射查詢
    // ============================================
    
    function s_requests(uint256) external view returns (RequestStatus memory);
    function requestIdToUser(uint256 requestId) external view returns (address);
    function requestIdToContract(uint256 requestId) external view returns (address);
    function lastRequestIdByAddress(address) external view returns (uint256);
    
    // Rate Limiting
    function lastRequestTime(address) external view returns (uint256);
    
    // ============================================
    // 管理函數
    // ============================================
    
    function authorizeContract(address contract_) external;
    function setAuthorizedContract(address addr, bool auth) external;
    
    function setSubscriptionId(uint256 _subscriptionId) external;
    function setCallbackGasLimit(uint32 _callbackGasLimit) external;
    function setKeyHash(bytes32 _keyHash) external;
    function setRequestConfirmations(uint16 _confirmations) external;
    
    function setVRFParams(
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        uint32 _numWords
    ) external;
    
    // ============================================
    // 緊急函數
    // ============================================
    
    function cleanupExpiredRequest(uint256 requestId) external;
    function emergencyWithdraw() external;
    function emergencyWithdrawToken(address token) external;
    
    // ============================================
    // 常量
    // ============================================
    
    function COOLDOWN_PERIOD() external view returns (uint256);
    function REQUEST_TIMEOUT() external view returns (uint256);
    function MIN_CALLBACK_GAS_LIMIT() external view returns (uint32);
    function MAX_CALLBACK_GAS_LIMIT() external view returns (uint32);
}
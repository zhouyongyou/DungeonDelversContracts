// VRFManagerWrapper.sol - 使用 VRF Wrapper 的 Direct Funding 版本
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/interfaces.sol";

interface IVRFV2Wrapper {
    function calculateRequestPrice(uint32 _callbackGasLimit) external view returns (uint256);
    function calculateRequestPriceNative(uint32 _callbackGasLimit) external view returns (uint256);
    function requestRandomWordsInNative(
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        uint32 _numWords
    ) external payable returns (uint256 requestId);
}

/**
 * @title VRFManagerWrapper
 * @notice 使用 VRF Wrapper 進行 Direct Funding（支付 BNB）
 * @dev 無需 subscription，直接用 BNB 支付
 */
contract VRFManagerWrapper is Ownable, ReentrancyGuard {
    
    IVRFV2Wrapper public immutable vrfWrapper;
    
    // VRF 配置
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint256 public platformFee = 0.0003 ether; // 平台費用
    
    // 請求類型
    enum RequestType {
        HERO_MINT,
        RELIC_MINT,
        ALTAR_UPGRADE,
        DUNGEON_EXPLORE
    }
    
    struct RandomRequest {
        address requester;
        RequestType requestType;
        bytes data;
        bool fulfilled;
        uint256[] randomWords;
    }
    
    mapping(uint256 => RandomRequest) public requests;
    mapping(address => bool) public authorizedContracts;
    
    // 用戶到請求ID的映射
    mapping(address => uint256) public userToRequestId;
    mapping(address => uint256[]) public userRandomWords;
    
    uint256 private requestCounter;
    
    event RandomRequested(uint256 indexed requestId, address indexed requester, RequestType requestType);
    event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords);
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    constructor(address _vrfWrapper) Ownable(msg.sender) {
        vrfWrapper = IVRFV2Wrapper(_vrfWrapper);
    }
    
    /**
     * @notice 獲取 VRF 請求價格（以 BNB 計價）
     */
    function getRequestPrice() public view returns (uint256) {
        return vrfWrapper.calculateRequestPriceNative(callbackGasLimit);
    }
    
    /**
     * @notice 請求隨機數（由授權合約調用）
     */
    function requestRandomness(
        RequestType requestType,
        uint32 numWords,
        bytes calldata data
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        // 計算實際需要的 VRF 費用
        uint256 vrfFee = getRequestPrice();
        uint256 totalFee = vrfFee + platformFee;
        require(msg.value >= totalFee, "Insufficient fee");
        
        // 通過 Wrapper 請求隨機數
        requestId = vrfWrapper.requestRandomWordsInNative{value: vrfFee}(
            callbackGasLimit,
            requestConfirmations,
            numWords
        );
        
        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: requestType,
            data: data,
            fulfilled: false,
            randomWords: new uint256[](0)
        });
        
        // 退還多餘費用
        if (msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
        
        emit RandomRequested(requestId, msg.sender, requestType);
    }
    
    /**
     * @notice 兼容舊接口的請求函數
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        bytes memory data = abi.encode(user, quantity, maxRarity, commitment);
        
        // 計算實際需要的 VRF 費用
        uint256 vrfFee = getRequestPrice();
        uint256 totalFee = vrfFee + platformFee;
        require(msg.value >= totalFee, "Insufficient fee");
        
        // 通過 Wrapper 請求隨機數
        requestId = vrfWrapper.requestRandomWordsInNative{value: vrfFee}(
            callbackGasLimit,
            requestConfirmations,
            uint32(quantity)
        );
        
        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.HERO_MINT,
            data: data,
            fulfilled: false,
            randomWords: new uint256[](0)
        });
        
        // 退還多餘費用
        if (msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
        
        emit RandomRequested(requestId, msg.sender, RequestType.HERO_MINT);
    }
    
    /**
     * @notice VRF 回調函數（由 Wrapper 調用）
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        require(msg.sender == address(vrfWrapper), "Only wrapper can fulfill");
        RandomRequest storage request = requests[requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        request.fulfilled = true;
        request.randomWords = randomWords;
        
        // 根據請求類型回調對應合約
        if (request.requestType == RequestType.HERO_MINT || 
            request.requestType == RequestType.RELIC_MINT) {
            // 解析數據
            (address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) = 
                abi.decode(request.data, (address, uint256, uint8, bytes32));
            
            // 存儲用戶的隨機數
            userToRequestId[user] = requestId;
            userRandomWords[user] = randomWords;
            
            // 回調請求合約
            try IVRFCallback(request.requester).onVRFFulfilled(
                requestId,
                randomWords
            ) {
                // 成功
            } catch {
                // 記錄失敗但不回滾
            }
        }
        
        emit RandomFulfilled(requestId, randomWords);
    }
    
    /**
     * @notice 獲取用戶的隨機數（兼容舊接口）
     */
    function getUserRandomWords(address user) external view returns (uint256[] memory) {
        return userRandomWords[user];
    }
    
    // 管理函數
    function setAuthorizedContract(address _contract, bool _authorized) external onlyOwner {
        authorizedContracts[_contract] = _authorized;
    }
    
    function setCallbackGasLimit(uint32 _limit) external onlyOwner {
        callbackGasLimit = _limit;
    }
    
    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        requestConfirmations = _confirmations;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        platformFee = _fee;
    }
    
    function withdrawBNB() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Receive function
    receive() external payable {}
}
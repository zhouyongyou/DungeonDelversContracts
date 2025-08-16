// VRFManagerWrapperV2.sol - 遵循 Chainlink 官方 Direct Funding 標準
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFV2WrapperConsumerBase.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/interfaces.sol";

/**
 * @title VRFManagerWrapperV2
 * @notice 基於 Chainlink 官方 Direct Funding 模式的 VRF 管理器
 * @dev 繼承 VRFV2WrapperConsumerBase，支持 BNB 直接支付
 */
contract VRFManagerWrapperV2 is VRFV2WrapperConsumerBase, Ownable, ReentrancyGuard {
    
    // VRF 配置
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1; // 默認請求數量
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
    
    // 用戶到請求ID的映射（兼容舊接口）
    mapping(address => uint256) public userToRequestId;
    mapping(address => uint256[]) public userRandomWords;
    
    event RandomRequested(uint256 indexed requestId, address indexed requester, RequestType requestType);
    event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event AuthorizationUpdated(address indexed contract_, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    /**
     * @dev 構造函數
     * @param _linkAddress BSC Mainnet LINK token: 0x404460C6A5EdE2D891e8297795264fDe62ADBB75
     * @param _wrapperAddress BSC Mainnet VRF Wrapper: 0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94
     */
    constructor(address _linkAddress, address _wrapperAddress) 
        VRFV2WrapperConsumerBase(_linkAddress, _wrapperAddress)
        Ownable(msg.sender)
    {
        // 初始化
    }
    
    /**
     * @notice 請求隨機數（通用接口）
     * @param requestType 請求類型
     * @param _numWords 需要的隨機數數量
     * @param data 額外數據
     * @return requestId VRF 請求 ID
     */
    function requestRandomness(
        RequestType requestType,
        uint32 _numWords,
        bytes calldata data
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        // 使用固定 VRF 費用（BSC 上的 Direct Funding）
        uint256 vrfFee = 0.005 ether; // 固定 0.005 BNB
        uint256 totalFee = vrfFee + platformFee;
        require(msg.value >= totalFee, "Insufficient fee");
        
        // 請求隨機數（使用 BNB 支付）
        requestId = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            _numWords
        );
        
        // 存儲請求信息
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
     * @notice 兼容舊接口的請求函數（Hero 鑄造專用）
     * @param user 用戶地址
     * @param quantity 鑄造數量
     * @param maxRarity 最大稀有度
     * @param commitment 承諾哈希
     * @return requestId VRF 請求 ID
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        bytes memory data = abi.encode(user, quantity, maxRarity, commitment);
        
        // 使用固定 VRF 費用
        uint256 vrfFee = 0.005 ether; // 固定 0.005 BNB
        uint256 totalFee = vrfFee + platformFee;
        require(msg.value >= totalFee, "Insufficient fee");
        
        // 請求隨機數
        requestId = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            uint32(quantity) // 請求與數量相同的隨機數
        );
        
        // 存儲請求信息
        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.HERO_MINT,
            data: data,
            fulfilled: false,
            randomWords: new uint256[](0)
        });
        
        // 存儲用戶映射
        userToRequestId[user] = requestId;
        
        // 退還多餘費用
        if (msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
        
        emit RandomRequested(requestId, msg.sender, RequestType.HERO_MINT);
    }
    
    /**
     * @notice Chainlink VRF 回調函數
     * @dev 由 VRF Coordinator 調用
     * @param _requestId 請求 ID
     * @param _randomWords 隨機數組
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        RandomRequest storage request = requests[_requestId];
        require(!request.fulfilled, "Already fulfilled");
        
        request.fulfilled = true;
        request.randomWords = _randomWords;
        
        // 處理不同類型的請求
        if (request.requestType == RequestType.HERO_MINT || 
            request.requestType == RequestType.RELIC_MINT) {
            
            // 解析數據
            (address user, , , ) = abi.decode(request.data, (address, uint256, uint8, bytes32));
            
            // 存儲用戶的隨機數
            userRandomWords[user] = _randomWords;
            
            // 回調請求合約（使用 IVRFCallback 接口）
            try IVRFCallback(request.requester).onVRFFulfilled(_requestId, _randomWords) {
                // 成功
            } catch {
                // 記錄失敗但不回滾，確保隨機數被存儲
            }
        } else if (request.requestType == RequestType.ALTAR_UPGRADE) {
            // 處理升星請求
            try IVRFCallback(request.requester).onVRFFulfilled(_requestId, _randomWords) {
                // 成功
            } catch {
                // 記錄失敗但不回滾
            }
        } else if (request.requestType == RequestType.DUNGEON_EXPLORE) {
            // 處理地城探索請求
            try IVRFCallback(request.requester).onVRFFulfilled(_requestId, _randomWords) {
                // 成功
            } catch {
                // 記錄失敗但不回滾
            }
        }
        
        emit RandomFulfilled(_requestId, _randomWords);
    }
    
    /**
     * @notice 獲取 VRF 請求價格（以 BNB 計價）
     * @return 請求價格（不包含平台費）
     */
    function getVRFRequestPrice() public pure returns (uint256) {
        return 0.005 ether; // 固定 0.005 BNB
    }
    
    /**
     * @notice 獲取總費用（VRF + 平台費）
     * @return 總費用
     */
    function getTotalFee() public view returns (uint256) {
        return getVRFRequestPrice() + platformFee;
    }
    
    /**
     * @notice 獲取用戶的隨機數（兼容舊接口）
     * @param user 用戶地址
     * @return 隨機數組
     */
    function getUserRandomWords(address user) external view returns (uint256[] memory) {
        return userRandomWords[user];
    }
    
    /**
     * @notice 獲取請求狀態
     * @param requestId 請求 ID
     * @return fulfilled 是否已完成
     * @return randomWords 隨機數組
     */
    function getRequestStatus(uint256 requestId) external view returns (bool fulfilled, uint256[] memory randomWords) {
        RandomRequest memory request = requests[requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    // === 管理函數 ===
    
    /**
     * @notice 設置授權合約
     * @param _contract 合約地址
     * @param _authorized 是否授權
     */
    function setAuthorizedContract(address _contract, bool _authorized) external onlyOwner {
        authorizedContracts[_contract] = _authorized;
        emit AuthorizationUpdated(_contract, _authorized);
    }
    
    /**
     * @notice 設置回調 Gas 限制
     * @param _limit 新的 Gas 限制
     */
    function setCallbackGasLimit(uint32 _limit) external onlyOwner {
        callbackGasLimit = _limit;
    }
    
    /**
     * @notice 設置請求確認數
     * @param _confirmations 新的確認數
     */
    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        requestConfirmations = _confirmations;
    }
    
    /**
     * @notice 設置平台費用
     * @param _fee 新的平台費用
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        platformFee = _fee;
    }
    
    /**
     * @notice 提取 BNB
     */
    function withdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice 提取 LINK（如果有）
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(address(LINK));
        uint256 balance = link.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");
        require(link.transfer(owner(), balance), "LINK transfer failed");
    }
    
    // Receive function
    receive() external payable {}
}
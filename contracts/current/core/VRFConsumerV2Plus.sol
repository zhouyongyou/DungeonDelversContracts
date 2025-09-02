// VRFConsumerV2Plus.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/interfaces.sol";

/**
 * @title VRFConsumerV2Plus
 * @notice Minimal modification: Added adjustable dynamic gas formula
 * @dev Main changes from original:
 * 1. Added adjustable gas formula parameters (baseCost, perNFTCost)
 * 2. Reduced max batch from 50 to 40 NFTs for safety
 * 3. Added setDynamicGasFormula function for post-deployment adjustment
 * 4. Formula optimized for 20 NFT batches (350000 + quantity * 47000)
 */
contract VRFConsumerV2Plus is VRFConsumerBaseV2Plus, ReentrancyGuard {
        
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event CallbackSuccess(uint256 indexed requestId, address indexed callbackContract);
    event CallbackFailed(uint256 indexed requestId, address indexed callbackContract, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    event CallbackGasLimitUpdated(uint32 oldLimit, uint32 newLimit);
    event RequestTimedOut(uint256 indexed requestId, address indexed requester);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // NEW: Event for dynamic gas formula updates
    event DynamicGasFormulaUpdated(uint32 oldBaseCost, uint32 oldPerNFTCost, uint32 newBaseCost, uint32 newPerNFTCost);
    
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
        address requester;      // Calling contract address
        uint256 timestamp;      // Request timestamp for timeout handling
    }
    
    mapping(uint256 => RequestStatus) public s_requests;
    mapping(address => uint256) public lastRequestIdByAddress;
    
    // Mapping relationships
    mapping(uint256 => address) public requestIdToUser;        // Request ID -> End user
    mapping(uint256 => address) public requestIdToContract;    // Request ID -> Calling contract
    
    // VRF Configuration - BSC Mainnet hardcoded values
    uint256 public constant s_subscriptionId = 88422796721004450630713121079263696788635490871993157345476848872165866246915;
    
    // Smart authorization: DungeonCore reference
    IDungeonCore public dungeonCore;
    
    // VRF parameters - hardcoded for BSC Mainnet (simpler and gas-efficient)
    bytes32 public keyHash = 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4; // BSC 200 gwei
    uint32 public callbackGasLimit = 2500000;  // 2.5M gas - sufficient for 40 NFT batch
    uint16 public requestConfirmations = 6;    // 6 blocks (~18 seconds) - balanced
    uint32 public numWords = 1;                // Always 1 random word per request
    
    // Gas limit range (prevent setting incorrect values)
    uint32 public constant MIN_CALLBACK_GAS_LIMIT = 100000;
    uint32 public constant MAX_CALLBACK_GAS_LIMIT = 2500000;
    
    // NEW: Adjustable dynamic gas formula parameters
    uint32 public dynamicGasBaseCost = 310000;     // Base cost (fixed overhead)
    uint32 public dynamicGasPerNFTCost = 54000;    // Cost per NFT
    
    // NEW: Reduced max batch size from 50 to 40 for safety
    uint32 public constant MAX_BATCH_SIZE = 40;    // Changed from 50 to 40
    
    // Authorized contracts
    mapping(address => bool) public authorized;
    
    // Rate limiting
    mapping(address => uint256) public lastRequestTime;
    uint256 public constant COOLDOWN_PERIOD = 10; // 10 seconds cooldown
    uint256 public constant REQUEST_TIMEOUT = 5 minutes; // Optimized: from 30 minutes to 5 minutes for better UX
    
    
    // BSC Mainnet VRF Coordinator V2.5 address
    address private constant VRF_COORDINATOR = 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9;
    
    constructor() VRFConsumerBaseV2Plus(VRF_COORDINATOR) {
        // All VRF parameters are hardcoded for BSC Mainnet
        // Dynamic gas formula initialized with safe defaults
    }
    
    
    modifier onlyAuthorized() {
        require(_isAuthorized(msg.sender), "Not authorized");
        _;
    }
    
    /**
     * @notice Smart authorization check: manual authorization + DungeonCore core contract auto-authorization
     * @param addr Address to check
     * @return Whether authorized
     */
    function _isAuthorized(address addr) internal view returns (bool) {
        // 1. Owner always has permission (most common, check first)
        if (addr == owner()) return true;
        
        // 2. Manually authorized addresses (second most common)
        if (authorized[addr]) return true;
        
        // 3. Smart authorization: Core game contracts registered in DungeonCore
        // Only check when dungeonCore is set and first two don't match
        if (address(dungeonCore) != address(0)) {
            // Short-circuit logic: return immediately once match is found, reduce external calls
            if (addr == dungeonCore.heroContractAddress()) return true;
            if (addr == dungeonCore.relicContractAddress()) return true;
            if (addr == dungeonCore.altarOfAscensionAddress()) return true;
            if (addr == dungeonCore.dungeonMasterAddress()) return true;
        }
        
        return false;
    }
    
    
    /**
     * @notice Dynamic Gas Limit calculation (Now with adjustable parameters)
     * @param requester Requesting contract address
     * @param extraData Extra data (such as quantity)
     * @dev Return optimal gas limit based on actual callback complexity and cross-contract calls
     */
    function calculateDynamicGasLimit(
        address requester,
        uint256 extraData
    ) public view returns (uint32) {
        // Hero & Relic: Use adjustable formula
        if (address(dungeonCore) != address(0)) {
            if (requester == dungeonCore.heroContractAddress() || 
                requester == dungeonCore.relicContractAddress()) {
                uint256 quantity = extraData;
                require(quantity > 0 && quantity <= MAX_BATCH_SIZE, "Invalid quantity"); // Changed to MAX_BATCH_SIZE
                
                // NEW: Use adjustable parameters instead of hardcoded values
                // Formula: baseCost + (quantity * perNFTCost)
                uint32 dynamicGas = dynamicGasBaseCost + uint32(quantity * dynamicGasPerNFTCost);
                
                // Safety cap: never exceed 2.5M limit
                if (dynamicGas > MAX_CALLBACK_GAS_LIMIT) {
                    dynamicGas = MAX_CALLBACK_GAS_LIMIT;
                }
                return dynamicGas;
            }
            
            // DungeonMaster: increased to 500k (was 400k, insufficient for cross-contract calls)
            if (requester == dungeonCore.dungeonMasterAddress()) {
                return 500000;
            }
            
            // Altar: maintain 800k (sufficient for complex upgrade logic)
            if (requester == dungeonCore.altarOfAscensionAddress()) {
                return 800000;
            }
        }
        
        // Default value
        return callbackGasLimit;
    }
    
    /**
     * @notice NEW: Set dynamic gas formula parameters (owner only)
     * @param _baseCost Base gas cost (fixed overhead)
     * @param _perNFTCost Gas cost per NFT
     * @dev Allows post-deployment adjustment of gas calculation formula
     */
    function setDynamicGasFormula(uint32 _baseCost, uint32 _perNFTCost) external onlyOwner {
        // Reasonable bounds to prevent misconfiguration
        require(_baseCost >= 100000 && _baseCost <= 1000000, "Base cost out of range");
        require(_perNFTCost >= 20000 && _perNFTCost <= 100000, "Per-NFT cost out of range");
        
        // Check that formula doesn't exceed limit for max batch
        uint32 maxBatchGas = _baseCost + (MAX_BATCH_SIZE * _perNFTCost);
        require(maxBatchGas <= MAX_CALLBACK_GAS_LIMIT, "Formula exceeds max gas for 40 NFT batch");
        
        uint32 oldBaseCost = dynamicGasBaseCost;
        uint32 oldPerNFTCost = dynamicGasPerNFTCost;
        
        dynamicGasBaseCost = _baseCost;
        dynamicGasPerNFTCost = _perNFTCost;
        
        emit DynamicGasFormulaUpdated(oldBaseCost, oldPerNFTCost, _baseCost, _perNFTCost);
    }
    
    /**
     * @notice Request random numbers (subscription mode, no payment required)
     */
    function requestRandomWords(
        uint32 _numWords
    ) external onlyAuthorized nonReentrant returns (uint256 requestId) {
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // Use subscription mode request
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: _numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // Use LINK payment
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
    
    /**
     * @notice Request random numbers for user (called by NFT contracts)
     * @dev Subscription mode does not require payable
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8, // maxRarity - not used
        bytes32 // commitment - not used
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        require(quantity > 0 && quantity <= MAX_BATCH_SIZE, "Invalid quantity"); // Changed to MAX_BATCH_SIZE
        
        // Rate limiting check
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // Dynamically calculate Gas Limit
        uint32 dynamicGasLimit = calculateDynamicGasLimit(msg.sender, quantity);
        
        // Use subscription mode request
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: dynamicGasLimit,  // Use dynamic gas limit
                numWords: 1, // Fixed request for 1 random word to save LINK costs
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // Use LINK payment
                    })
                )
            })
        );
        
        s_requests[requestId] = RequestStatus({
            fulfilled: false,
            exists: true,
            randomWords: new uint256[](0),
            requester: msg.sender,  // Record calling contract address
            timestamp: block.timestamp  // Record timestamp
        });
        
        lastRequestIdByAddress[user] = requestId;
        requestIdToUser[requestId] = user;  // Record end user
        requestIdToContract[requestId] = msg.sender;  // Record calling contract
        emit RequestSent(requestId, uint32(quantity));
        
        return requestId;
    }
    
    /**
     * @notice Request random numbers for other purposes (DungeonMaster, Altar)
     * @dev Subscription mode does not require payable
     */
    function requestRandomness(
        uint8, // requestType - preserve interface compatibility
        uint32 _numWords,
        bytes calldata data
    ) external payable onlyAuthorized nonReentrant returns (uint256 requestId) {
        // Rate limiting
        require(block.timestamp >= lastRequestTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        lastRequestTime[msg.sender] = block.timestamp;
        
        // Use subscription mode request
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: _numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // Use LINK payment
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
     * @notice VRF Coordinator callback function
     * @dev Important change: Remove nonReentrant to avoid cross-contract conflicts
     *      Use state checks + low-level call to ensure security
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        // Security fix: Use storage pointer to reduce gas and ensure atomicity
        RequestStatus storage request = s_requests[_requestId];
        
        // Use state checks instead of nonReentrant
        // Don't use require/revert, use return to avoid VRF failure
        if (!request.exists) return;
        if (request.fulfilled) return;  // Prevent duplicate processing
        if (_randomWords.length == 0) return; // Added: Check random word validity
        
        // Check timeout (30 minutes)
        if (block.timestamp > request.timestamp + REQUEST_TIMEOUT) {
            emit RequestTimedOut(_requestId, request.requester);
            return;
        }
        
        // Mark as completed immediately to prevent reentrancy
        request.fulfilled = true;
        request.randomWords = _randomWords;
        
        emit RequestFulfilled(_requestId, _randomWords);
        
        // Use V2 version's safe callback approach
        _safeCallback(_requestId, requestIdToContract[_requestId], _randomWords);
    }
    
    /**
     * @notice Safe callback handling - use low-level call to avoid revert impact
     * @dev Best practice adopted from V2 version
     */
    function _safeCallback(
        uint256 requestId,
        address callbackContract,
        uint256[] memory randomWords
    ) internal {
        if (callbackContract == address(0)) return;
        
        // Use low-level call instead of try-catch to avoid ReentrancyGuard conflicts
        // This way it won't fail even if target contract has nonReentrant
        (bool success, bytes memory returnData) = callbackContract.call(
            abi.encodeWithSignature("onVRFFulfilled(uint256,uint256[])", requestId, randomWords)
        );
        
        if (success) {
            emit CallbackSuccess(requestId, callbackContract);
        } else {
            // Log failure but don't revert, ensure VRF state updates correctly
            emit CallbackFailed(requestId, callbackContract, returnData);
        }
    }
    
    
    /**
     * @notice Get request status
     */
    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
    
    /**
     * @notice Check if request is expired
     */
    function isRequestExpired(uint256 _requestId) external view returns (bool) {
        if (!s_requests[_requestId].exists) return false;
        if (s_requests[_requestId].fulfilled) return false;
        return block.timestamp > s_requests[_requestId].timestamp + REQUEST_TIMEOUT;
    }
    
    /**
     * @notice Get user's random number result
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
     * @notice Get VRF request price (returns 0 in subscription mode)
     */
    function getVrfRequestPrice() external pure returns (uint256) {
        return 0;  // No payment needed in subscription mode
    }
    
    function vrfRequestPrice() external pure returns (uint256) {
        return 0;  // No payment needed in subscription mode
    }
    
    function getTotalFee() external pure returns (uint256) {
        return 0;  // No payment needed in subscription mode
    }
    
    
    
    /**
     * @notice Set callback gas limit individually
     * @param _callbackGasLimit New gas limit (must be within reasonable range)
     */
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        require(_callbackGasLimit >= MIN_CALLBACK_GAS_LIMIT && 
                _callbackGasLimit <= MAX_CALLBACK_GAS_LIMIT, 
                "Gas limit out of range");
        
        uint32 oldLimit = callbackGasLimit;
        callbackGasLimit = _callbackGasLimit;
        emit CallbackGasLimitUpdated(oldLimit, _callbackGasLimit);
    }
    
    /**
     * @notice Set keyHash (for switching different gas price tiers)
     * @param _keyHash New keyHash
     */
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        require(_keyHash != bytes32(0), "Invalid keyHash");
        keyHash = _keyHash;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice Set confirmation count
     * @param _confirmations New confirmation count (recommended 6-8)
     */
    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        require(_confirmations >= 3 && _confirmations <= 200, "Invalid confirmations");
        requestConfirmations = _confirmations;
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice Set VRF parameters (complete version)
     */
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
        require(_requestConfirmations >= 3 && _requestConfirmations <= 200, "Invalid confirmations");
        
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        numWords = _numWords;
        
        emit VRFParamsUpdated(keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @notice Estimate request cost (for debugging)
     * @return estimatedCost Estimated LINK cost
     */
    function estimateRequestCost(uint32 _numWords) external view returns (uint256 estimatedCost) {
        // Base cost + (cost per word * quantity) + (gas limit cost)
        // This is a simplified estimate, actual cost depends on network conditions
        uint256 baseCost = 0.001 ether; // 0.001 LINK base fee
        uint256 perWordCost = 0.0005 ether; // 0.0005 LINK per word
        uint256 gasLimitCost = (callbackGasLimit * 0.000000001 ether); // Simplified gas cost estimation
        
        estimatedCost = baseCost + (perWordCost * _numWords) + gasLimitCost;
    }
    
    /**
     * @notice Authorize/deauthorize contracts
     */
    function setAuthorizedContract(address addr, bool auth) external onlyOwner {
        authorized[addr] = auth;
        emit AuthorizationChanged(addr, auth);
    }
    
    /**
     * @notice Authorize contract (compatible with legacy interface)
     */
    function authorizeContract(address contract_) external onlyOwner {
        authorized[contract_] = true;
        emit AuthorizationChanged(contract_, true);
    }
    
    /**
     * @notice Set DungeonCore address to enable smart authorization
     * @param _dungeonCore DungeonCore contract address
     */
    function setDungeonCore(address _dungeonCore) external onlyOwner {
        dungeonCore = IDungeonCore(_dungeonCore);
    }
    
    /**
     * @notice Check if address has VRF usage permission (public query)
     * @param addr Address to check
     * @return Whether authorized
     */
    function isAuthorized(address addr) external view returns (bool) {
        return _isAuthorized(addr);
    }
    
    /**
     * @notice Clean up expired requests (owner only)
     * @dev Allow owner to clean up state after request timeout
     */
    function cleanupExpiredRequest(uint256 requestId) external onlyOwner {
        require(s_requests[requestId].exists, "Request not found");
        require(!s_requests[requestId].fulfilled, "Already fulfilled");
        require(block.timestamp > s_requests[requestId].timestamp + REQUEST_TIMEOUT, "Not expired");
        
        // Mark as processed to prevent subsequent callbacks
        s_requests[requestId].fulfilled = true;
        emit RequestTimedOut(requestId, s_requests[requestId].requester);
    }
    
    /**
     * @notice Emergency withdrawal of mistakenly transferred assets
     * @dev Handle mistakenly transferred BNB
     */
    function withdrawNative() external onlyOwner {
        // Withdraw mistakenly transferred BNB
        uint256 bnbBalance = address(this).balance;
        if (bnbBalance > 0) {
            (bool success, ) = owner().call{value: bnbBalance}("");
            require(success, "BNB transfer failed");
            emit EmergencyWithdraw(address(0), bnbBalance);
        }
    }
    
    /**
     * @notice Emergency withdrawal of any ERC20 tokens
     * @param token Token address
     */
    function emergencyWithdrawToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        if (balance > 0) {
            bool success = tokenContract.transfer(owner(), balance);
            require(success, "Token transfer failed");
            emit EmergencyWithdraw(token, balance);
        }
    }
    
    /**
     * @notice Withdraw SoulShard tokens specifically (safety function)
     * @dev Convenience function for withdrawing SOUL tokens
     */
    function withdrawSoulShard() external onlyOwner {
        address soulShardAddress = dungeonCore.soulShardTokenAddress();
        require(soulShardAddress != address(0), "VRF: SoulShard not set");
        
        IERC20 soulShard = IERC20(soulShardAddress);
        uint256 balance = soulShard.balanceOf(address(this));
        
        if (balance > 0) {
            bool success = soulShard.transfer(owner(), balance);
            require(success, "SoulShard transfer failed");
            emit EmergencyWithdraw(soulShardAddress, balance);
        }
    }


    // Prevent accidental transfers from being locked
    receive() external payable {}
}
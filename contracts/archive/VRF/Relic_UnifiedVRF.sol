// Relic_UnifiedVRF.sol - 統一使用 VRF，統一稀有度機率
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

// Chainlink VRF v2.5 imports
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract Relic_UnifiedVRF is 
    ERC721, 
    Ownable, 
    ReentrancyGuard, 
    Pausable, 
    VRFV2PlusWrapperConsumerBase, 
    ConfirmedOwner 
{
    using SafeERC20 for IERC20;
    using Strings for uint256;
    using VRFV2PlusClient for VRFV2PlusClient.RandomWordsRequest;
    
    string public baseURI;
    string private _contractURI;
    
    struct RelicData {
        uint8 rarity;
        uint8 capacity;
    }
    mapping(uint256 => RelicData) public relicData;
    
    IDungeonCore public dungeonCore;
    IERC20 public soulShardToken;
    address public ascensionAltarAddress;
    LinkTokenInterface public LINKTOKEN;

    uint256 public dynamicSeed;
    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;

    // VRF v2.5 配置
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 200000;
    uint32 public numWords = 1;
    bool public useNativePayment = true; // 預設使用 BNB 支付

    // VRF 請求追蹤
    struct PendingMint {
        address recipient;
        uint256 quantity;
        uint256 timestamp;
        bool fulfilled;
        uint256 vrfFee;
        bool fromVault;
    }
    
    mapping(uint256 => PendingMint) public pendingMints;
    mapping(uint256 => bool) public requestIdToWaiting;

    // 統一稀有度機率 (基於50個的分布)
    struct RarityConfig {
        uint8 rarity1Chance;  // 1星機率
        uint8 rarity2Chance;  // 2星機率  
        uint8 rarity3Chance;  // 3星機率
        uint8 rarity4Chance;  // 4星機率
        uint8 rarity5Chance;  // 5星機率
    }
    
    // 統一稀有度設定 (所有鑄造都使用相同機率)
    RarityConfig public unifiedRarity = RarityConfig({
        rarity1Chance: 44,  // 44%
        rarity2Chance: 35,  // 35% (44+35=79)
        rarity3Chance: 15,  // 15% (79+15=94)  
        rarity4Chance: 5,   // 5%  (94+5=99)
        rarity5Chance: 1    // 1%  (99+1=100)
    });

    // 事件
    event RelicMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event BatchMintCompleted(address indexed player, uint256 quantity, uint256[] tokenIds);
    event BatchMintPending(address indexed player, uint256 indexed requestId, uint256 quantity);
    event VRFMintRequested(uint256 indexed requestId, address indexed sender, uint256 quantity, uint256 vrfFee);
    event VRFMintFulfilled(uint256 indexed requestId, uint256 randomness);
    event DynamicSeedUpdated(uint256 newSeed);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event AscensionAltarSet(address indexed newAddress);
    event RelicBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint8 capacity);
    event VRFConfigUpdated(uint16 confirmations, uint32 gasLimit, bool useNative);
    event RarityConfigUpdated(RarityConfig newConfig);
    
    modifier onlyAltar() {
        require(msg.sender == ascensionAltarAddress, "Relic: Caller is not the Altar");
        _;
    }

    modifier onlyValidRequest(uint256 requestId) {
        require(requestIdToWaiting[requestId], "Request not found or already fulfilled");
        _;
    }
    
    constructor(
        address initialOwner,
        address _wrapperAddress,
        address _linkToken
    ) ERC721("Dungeon Delvers Relic", "DDR") 
      Ownable(initialOwner) 
      VRFV2PlusWrapperConsumerBase(_wrapperAddress)
      ConfirmedOwner(initialOwner) {
        
        _nextTokenId = 1;
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));
        LINKTOKEN = LinkTokenInterface(_linkToken);
    }

    // 統一 VRF 鑄造 - 從錢包
    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity (1-50)");
        
        // 計算總費用 (包含 VRF)
        uint256 totalCost = _calculateTotalCostWithVRF(_quantity);
        require(msg.value >= totalCost, "Relic: Insufficient payment");
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredAmount);

        _requestVRFMint(msg.sender, _quantity, false);
    }

    // 統一 VRF 鑄造 - 從金庫
    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Relic: Invalid quantity (1-50)");
        
        // 計算總費用 (包含 VRF)
        uint256 totalCost = _calculateTotalCostWithVRF(_quantity);
        require(msg.value >= totalCost, "Relic: Insufficient payment");
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(msg.sender, requiredAmount);

        _requestVRFMint(msg.sender, _quantity, true);
    }

    // 計算總費用 (統一包含 VRF)
    function _calculateTotalCostWithVRF(uint256 _quantity) private view returns (uint256) {
        uint256 vrfFee = getVRFFee();
        uint256 gasFee = platformFee * _quantity;
        return vrfFee + gasFee;
    }

    // 請求 VRF 隨機數
    function _requestVRFMint(address recipient, uint256 quantity, bool fromVault) private {
        uint256 requestId;
        uint256 vrfFee;
        
        if (useNativePayment) {
            // 使用 BNB 支付 VRF
            VRFV2PlusClient.ExtraArgsV1 memory extraArgs = VRFV2PlusClient.ExtraArgsV1({
                nativePayment: true
            });
            
            bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(extraArgs);
            
            (requestId, vrfFee) = requestRandomnessPayInNative(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgsBytes
            );
        } else {
            // 使用 LINK 支付 VRF
            VRFV2PlusClient.ExtraArgsV1 memory extraArgs = VRFV2PlusClient.ExtraArgsV1({
                nativePayment: false
            });
            
            bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(extraArgs);
            
            (requestId, vrfFee) = requestRandomness(
                callbackGasLimit,
                requestConfirmations,
                numWords,
                extraArgsBytes
            );
        }
        
        requestIdToWaiting[requestId] = true;
        pendingMints[requestId] = PendingMint({
            recipient: recipient,
            quantity: quantity,
            timestamp: block.timestamp,
            fulfilled: false,
            vrfFee: vrfFee,
            fromVault: fromVault
        });
        
        emit VRFMintRequested(requestId, recipient, quantity, vrfFee);
        emit BatchMintPending(recipient, requestId, quantity);
    }

    // VRF 回調函數
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
        internal 
        override 
        onlyValidRequest(requestId) 
    {
        uint256 randomness = randomWords[0];
        
        requestIdToWaiting[requestId] = false;
        pendingMints[requestId].fulfilled = true;
        
        _executeVRFMint(requestId, randomness);
        
        emit VRFMintFulfilled(requestId, randomness);
    }

    // 執行 VRF 鑄造 (統一稀有度機率)
    function _executeVRFMint(uint256 requestId, uint256 baseRandomness) private {
        PendingMint memory mintData = pendingMints[requestId];
        
        uint256[] memory tokenIds = new uint256[](mintData.quantity);
        
        for (uint256 i = 0; i < mintData.quantity; i++) {
            // 為每個 NFT 生成獨立的隨機數
            uint256 nftRandomness = uint256(keccak256(abi.encode(baseRandomness, i, requestId, mintData.recipient)));
            
            // 使用統一稀有度機率計算屬性
            (uint8 rarity, uint8 capacity) = _calculateAttributesUnified(nftRandomness);
            
            tokenIds[i] = _mintRelic(mintData.recipient, rarity, capacity);
        }
        
        emit BatchMintCompleted(mintData.recipient, mintData.quantity, tokenIds);
    }

    // 統一稀有度計算 (1個和50個都用相同機率)
    function _calculateAttributesUnified(uint256 _randomNumber) private view returns (uint8 rarity, uint8 capacity) {
        uint256 rarityRoll = _randomNumber % 100;
        
        // 根據統一設定的機率分布決定稀有度
        if (rarityRoll < unifiedRarity.rarity1Chance) {
            rarity = 1;
        } else if (rarityRoll < unifiedRarity.rarity1Chance + unifiedRarity.rarity2Chance) {
            rarity = 2;
        } else if (rarityRoll < unifiedRarity.rarity1Chance + unifiedRarity.rarity2Chance + unifiedRarity.rarity3Chance) {
            rarity = 3;
        } else if (rarityRoll < unifiedRarity.rarity1Chance + unifiedRarity.rarity2Chance + unifiedRarity.rarity3Chance + unifiedRarity.rarity4Chance) {
            rarity = 4;
        } else {
            rarity = 5;
        }
        
        // 聖物的容量等於稀有度
        capacity = rarity;
    }

    function _mintRelic(address _to, uint8 _rarity, uint8 _capacity) private returns (uint256) {
        uint256 tokenId = _nextTokenId;
        relicData[tokenId] = RelicData({ rarity: _rarity, capacity: _capacity });
        _safeMint(_to, tokenId);
        _nextTokenId++;
        emit RelicMinted(tokenId, _to, _rarity, _capacity);
        return tokenId;
    }

    // 祭壇專用鑄造 (不走 VRF)
    function mintFromAltar(address _to, uint8 _rarity, uint8 _capacity) external onlyAltar returns (uint256) {
        return _mintRelic(_to, _rarity, _capacity);
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        RelicData memory data = relicData[_tokenId];
        emit RelicBurned(_tokenId, owner, data.rarity, data.capacity);
        _burn(_tokenId);
    }

    // 取消過期的 VRF 請求
    function cancelExpiredRequest(uint256 requestId) external {
        PendingMint storage mintData = pendingMints[requestId];
        require(mintData.recipient == msg.sender, "Not your request");
        require(!mintData.fulfilled, "Already fulfilled");
        require(block.timestamp > mintData.timestamp + 2 hours, "Request not expired");
        
        requestIdToWaiting[requestId] = false;
        mintData.fulfilled = true;
        
        // 退還 Soul Shard
        uint256 refundAmount = mintData.quantity * mintPriceUSD;
        uint256 soulShardAmount = dungeonCore.getSoulShardAmountForUSD(refundAmount);
        
        if (mintData.fromVault) {
            IPlayerVault(dungeonCore.playerVaultAddress()).deposit(msg.sender, soulShardAmount);
        } else {
            soulShardToken.safeTransfer(msg.sender, soulShardAmount);
        }
        
        // 如果是 LINK 支付，可以退款
        if (!useNativePayment && mintData.vrfFee > 0) {
            LINKTOKEN.transfer(msg.sender, mintData.vrfFee);
        }
    }

    // 緊急鑄造 (Owner 專用，不使用 VRF)
    function emergencyMint(
        address recipient,
        uint256 quantity,
        uint8 fixedRarity
    ) external onlyOwner {
        require(fixedRarity >= 1 && fixedRarity <= 5, "Invalid rarity");
        
        uint256[] memory tokenIds = new uint256[](quantity);
        
        for (uint256 i = 0; i < quantity; i++) {
            uint8 capacity = fixedRarity; // 容量等於稀有度
            tokenIds[i] = _mintRelic(recipient, fixedRarity, capacity);
        }
        
        emit BatchMintCompleted(recipient, quantity, tokenIds);
    }

    // 查詢函數
    function getVRFFee() public view returns (uint256) {
        return s_wrapper.getFee();
    }

    function getMintCostInfo(uint256 _quantity) external view returns (
        uint256 soulShardCost,
        uint256 bnbCost,
        uint256 vrfFee,
        uint256 platformCost,
        string memory paymentMethod
    ) {
        soulShardCost = getRequiredSoulShardAmount(_quantity);
        vrfFee = getVRFFee();
        platformCost = platformFee * _quantity;
        bnbCost = vrfFee + platformCost;
        paymentMethod = useNativePayment ? "BNB" : "LINK";
    }

    function getPendingMint(uint256 requestId) external view returns (
        address recipient,
        uint256 quantity,
        uint256 timestamp,
        bool fulfilled,
        uint256 vrfFee,
        bool fromVault
    ) {
        PendingMint memory mintData = pendingMints[requestId];
        return (
            mintData.recipient,
            mintData.quantity,
            mintData.timestamp,
            mintData.fulfilled,
            mintData.vrfFee,
            mintData.fromVault
        );
    }

    function getUnifiedRarityConfig() external view returns (RarityConfig memory) {
        return unifiedRarity;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        require(bytes(baseURI).length > 0, "Relic: baseURI not set");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "DungeonCore address not set");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }

    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity) {
        _requireOwned(tokenId);
        RelicData memory data = relicData[tokenId];
        return (data.rarity, data.capacity);
    }

    // Owner 管理函式
    function setVRFConfig(
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit,
        bool _useNativePayment
    ) external onlyOwner {
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;
        useNativePayment = _useNativePayment;
        emit VRFConfigUpdated(_requestConfirmations, _callbackGasLimit, _useNativePayment);
    }

    function setUnifiedRarityConfig(RarityConfig calldata _newConfig) external onlyOwner {
        require(
            _newConfig.rarity1Chance + _newConfig.rarity2Chance + _newConfig.rarity3Chance + 
            _newConfig.rarity4Chance + _newConfig.rarity5Chance == 100,
            "Total chance must equal 100"
        );
        
        unifiedRarity = _newConfig;
        emit RarityConfigUpdated(_newConfig);
    }

    function setDungeonCore(address _address) public onlyOwner {
        dungeonCore = IDungeonCore(_address);
        emit ContractsSet(_address, address(soulShardToken));
    }

    function setSoulShardToken(address _address) public onlyOwner {
        soulShardToken = IERC20(_address);
        emit ContractsSet(address(dungeonCore), _address);
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    function setAscensionAltarAddress(address _address) public onlyOwner {
        ascensionAltarAddress = _address;
        emit AscensionAltarSet(_address);
    }
    
    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice * 1e18;
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }

    function withdrawLINK() external onlyOwner {
        uint256 balance = LINKTOKEN.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");
        LINKTOKEN.transfer(owner(), balance);
    }

    function withdrawSoulShard() public onlyOwner {
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) soulShardToken.safeTransfer(owner(), balance);
    }

    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Native withdraw failed");
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    receive() external payable {}
}
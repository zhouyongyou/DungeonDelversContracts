// Hero.sol - Fixed fulfilled flag timing and error handling
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract Hero is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    
    string public baseURI;
    string private _contractURI;
    
    struct HeroData {
        uint8 rarity;
        uint256 power;
    }
    mapping(uint256 => HeroData) public heroData;
    
    IDungeonCore public dungeonCore;
    

    mapping(uint256 => address) public requestIdToUser; // Important: Required for standard callback

    uint256 private _nextTokenId;
    uint256 public mintPriceUSD = 2 * 1e18;
    uint256 public platformFee = 0.0003 ether;
    
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds;
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    mapping(address => MintRequest) public userRequests;

    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event BatchMintCompleted(address indexed player, uint256 indexed requestId, uint256 quantity, uint8 maxRarity, uint256[] tokenIds);
    event ContractsSet(address indexed core, address indexed token);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event HeroBurned(uint256 indexed tokenId, address indexed owner, uint8 rarity, uint256 power);
    event MintRequested(address indexed player, uint256 quantity, bool fromVault);
    event EmergencyReset(address indexed user, uint256 refundAmount);
    
    modifier onlyAltar() {
        require(msg.sender == _getAscensionAltar(), "Hero: Not authorized - only Altar of Ascension can call");
        _;
    }
    
    // Enhanced constructor with default metadata URIs
    constructor() ERC721("Dungeon Delvers Hero", "DDH") Ownable(msg.sender) {
        _nextTokenId = 1;
        
        // Set default baseURI for immediate marketplace compatibility
        baseURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/";
        
        // Set default contractURI for collection-level metadata
        _contractURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/collection/hero";
    }

    function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity - must be between 1 and 50");
        // Simple check - only one pending request per user
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Hero: Previous mint request still pending");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Hero: Insufficient payment provided");
        
        // SoulShard payment - using query mode
        IERC20(_getSoulShardToken()).safeTransferFrom(msg.sender, address(this), requiredAmount);
        
        // Pre-mint NFTs
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            heroData[tokenId] = HeroData({
                rarity: 0,
                power: 0
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        address vrfManagerAddr = _getVRFManager();
        require(vrfManagerAddr != address(0), "VRF not configured");
        
        // Call VRF (Note: interface is payable, but subscription mode doesn't need ETH)
        uint256 requestId = IVRFManager(vrfManagerAddr).requestRandomForUser{value: 0}(
            msg.sender,
            _quantity,  // Pass the actual quantity to calculate correct gas limit
            maxRarity,
            requestData
        );
        
        // Important: Record requestId mapping
        requestIdToUser[requestId] = msg.sender;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: false,
            pendingTokenIds: tokenIds,
            requestId: requestId,  // Store requestId for later use
            timestamp: block.timestamp  // Record when request was created
        });
        
        emit MintRequested(msg.sender, _quantity, false);
    }

    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity - must be between 1 and 50");
        // Simple check - only one pending request per user
        require(userRequests[msg.sender].quantity == 0 || userRequests[msg.sender].fulfilled, "Hero: Previous mint request still pending");
        
        uint8 maxRarity = 5;
        
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        uint256 requiredPayment = platformFee * _quantity;
        require(msg.value >= requiredPayment, "Hero: Insufficient value for vault mint");
        
        // Deduct SoulShard from vault - using query mode
        IPlayerVault(_getPlayerVault()).spendForGame(msg.sender, requiredAmount);
        
        // Pre-mint NFTs
        uint256[] memory tokenIds = new uint256[](_quantity);
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
            
            heroData[tokenId] = HeroData({
                rarity: 0,
                power: 0
            });
        }
        
        bytes32 requestData = keccak256(abi.encodePacked(msg.sender, _quantity));
        
        address vrfManagerAddr = _getVRFManager();
        require(vrfManagerAddr != address(0), "VRF not configured");
        
        // Call VRF (explicitly specify value: 0)
        uint256 requestId = IVRFManager(vrfManagerAddr).requestRandomForUser{value: 0}(
            msg.sender,
            _quantity,  // Pass the actual quantity to calculate correct gas limit
            maxRarity,
            requestData
        );
        
        // Important: Record requestId mapping
        requestIdToUser[requestId] = msg.sender;
        
        userRequests[msg.sender] = MintRequest({
            quantity: _quantity,
            payment: msg.value,
            fulfilled: false,
            maxRarity: maxRarity,
            fromVault: true,
            pendingTokenIds: tokenIds,
            requestId: requestId,  // Store requestId for later use
            timestamp: block.timestamp  // Record when request was created
        });
        
        emit MintRequested(msg.sender, _quantity, true);
    }

    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
        // Important: Use return instead of require (avoid VRF deadlock)
        if (msg.sender != _getVRFManager()) return;
        if (randomWords.length == 0) return;
        
        // Use requestId mapping to find user
        address user = requestIdToUser[requestId];
        if (user == address(0)) return;
        
        MintRequest storage request = userRequests[user];
        if (request.fulfilled) return;
        
        // Minimal fix: Process directly, complete all logic before setting fulfilled
        _processHeroMintWithVRF(user, request, randomWords[0]);
        
        // Cleanup data (always executed after processing logic)
        delete requestIdToUser[requestId];
        delete userRequests[user];
    }

    function _processHeroMintWithVRF(
        address user, 
        MintRequest storage request, 
        uint256 baseRandomWord
    ) private {
        uint256[] memory tokenIds = request.pendingTokenIds;
        bool allProcessedSuccessfully = true;
        
        // Use single random number to generate seeds for all NFTs
        // Reveal each NFT
        for (uint256 i = 0; i < request.quantity; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Ensure NFT still belongs to user (safety measure) - using security check
            address tokenOwner = address(0);
            try this.ownerOf(tokenId) returns (address owner) {
                tokenOwner = owner;
            } catch {
                allProcessedSuccessfully = false;
                continue;
            }
            
            if (tokenOwner != user) {
                allProcessedSuccessfully = false;
                continue;
            }
            
            // Generate unique seed for each NFT (hybrid approach: efficiency + security)
            uint256 mixed = baseRandomWord ^ (tokenId << 8) ^ i;
            uint256 uniqueSeed = uint256(keccak256(abi.encode(mixed)));
            
            // Inline rarity determination for gas optimization
            uint256 rarityRoll = uniqueSeed % 100;
            uint8 rarity;
            if (rarityRoll < 44) rarity = 1;
            else if (rarityRoll < 79) rarity = 2;
            else if (rarityRoll < 94) rarity = 3;
            else if (rarityRoll < 99) rarity = 4;
            else rarity = 5;
            
            uint256 power = _generateHeroPowerByRarity(rarity, uniqueSeed);
            
            heroData[tokenId] = HeroData({
                rarity: rarity,
                power: power
            });
            
            emit HeroMinted(tokenId, user, rarity, power);
        }
        
        // Critical fix: Set fulfilled only after all processing is complete
        request.fulfilled = true;
        
        // If processing successful, emit completion event with requestId
        if (allProcessedSuccessfully) {
            emit BatchMintCompleted(user, request.requestId, request.quantity, request.maxRarity, tokenIds);
        }
    }

    function _determineRarityFromSeed(uint256 randomValue) internal pure returns (uint8) {
        uint256 rarityRoll = randomValue % 100;
        uint8 rarity;
        
        if (rarityRoll < 44) rarity = 1;
        else if (rarityRoll < 79) rarity = 2;
        else if (rarityRoll < 94) rarity = 3;
        else if (rarityRoll < 99) rarity = 4;
        else rarity = 5;
        
        return rarity;
    }

    function _mintHero(address _to, uint8 _rarity, uint256 _power) private returns (uint256) {
        uint256 tokenId = _nextTokenId;
        heroData[tokenId] = HeroData({
            rarity: _rarity,
            power: _power
        });
        _safeMint(_to, tokenId);
        _nextTokenId++;
        emit HeroMinted(tokenId, _to, _rarity, _power);
        return tokenId;
    }

    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external onlyAltar returns (uint256) {
        return _mintHero(_to, _rarity, _power);
    }

    function burnFromAltar(uint256 _tokenId) external onlyAltar {
        address owner = ownerOf(_tokenId);
        HeroData memory data = heroData[_tokenId];
        emit HeroBurned(_tokenId, owner, data.rarity, data.power);
        _burn(_tokenId);
    }

    function _generateHeroPowerByRarity(uint8 _rarity, uint256 _randomNumber) private pure returns (uint256 power) {
        if (_rarity == 1) { power = 15 + (_randomNumber % (50 - 15 + 1)); }
        else if (_rarity == 2) { power = 50 + (_randomNumber % (100 - 50 + 1)); }
        else if (_rarity == 3) { power = 100 + (_randomNumber % (150 - 100 + 1)); }
        else if (_rarity == 4) { power = 150 + (_randomNumber % (200 - 150 + 1)); }
        else if (_rarity == 5) { power = 200 + (_randomNumber % (255 - 200 + 1)); }
        else { revert("Hero: Invalid rarity value"); }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // Simplified: directly return baseURI (removed unrevealed check)
        require(bytes(baseURI).length > 0, "Hero: Base URI not configured");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        require(address(dungeonCore) != address(0), "Hero: DungeonCore contract not set");
        if (_quantity == 0) return 0;
        uint256 priceForOne = dungeonCore.getSoulShardAmountForUSD(mintPriceUSD);
        return priceForOne * _quantity;
    }

    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power) {
        _requireOwned(tokenId);
        HeroData memory data = heroData[tokenId];
        return (data.rarity, data.power);
    }

    function getUserRequest(address _user) external view returns (MintRequest memory) {
        return userRequests[_user];
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId > 0 ? _nextTokenId - 1 : 0;
    }

    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }
    
    function _getVRFManager() internal view returns (address) {
        return dungeonCore.getVRFManager();
    }

    function _getAscensionAltar() internal view returns (address) {
        return dungeonCore.altarOfAscensionAddress();
    }
    
    function _getPlayerVault() internal view returns (address) {
        return dungeonCore.playerVaultAddress();
    }
    

    function setDungeonCore(address _address) public onlyOwner {
        require(_address != address(0), "DungeonCore cannot be zero");
        dungeonCore = IDungeonCore(_address);
        emit ContractsSet(_address, _getSoulShardToken());
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }
    
    /// @notice Returns the contract URI for collection-level metadata (OpenSea/OKX compatibility)
    /// @dev This enables NFT marketplaces to read collection logo, description, and other metadata
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setMintPriceUSD(uint256 _newPrice) external onlyOwner {
        mintPriceUSD = _newPrice * 1e18;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdrawSoulShard() public onlyOwner {
        IERC20 token = IERC20(_getSoulShardToken());
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) token.safeTransfer(owner(), balance);
    }

    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Hero: ETH transfer failed");
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
    }
    
    /**
     * @notice Emergency reset user request with refund (Admin only)
     * @dev Admin function to clear stuck VRF requests and refund BNB fees
     * @param user Address of the stuck user
     */
    function emergencyResetUserRequest(address user) external onlyOwner {
        MintRequest storage request = userRequests[user];
        
        // Check if user has pending request
        require(request.quantity > 0 && !request.fulfilled, "Hero: No pending request to reset");
        
        // Store payment amount before deletion
        uint256 refundAmount = request.payment;
        
        // Force reset request
        delete userRequests[user];
        
        // Refund BNB platform fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = user.call{value: refundAmount}("");
            require(success, "Hero: Refund failed");
        }
        
        emit EmergencyReset(user, refundAmount);
    }
    
    /**
     * @notice Self emergency reset - user can reset their own stuck request after timeout
     * @dev Allows users to reset their own request after 5 minutes, with refund
     */
    function selfEmergencyReset() external nonReentrant {
        MintRequest storage request = userRequests[msg.sender];
        
        // Check if user has pending request
        require(request.quantity > 0 && !request.fulfilled, "Hero: No pending request to reset");
        
        // Check if enough time has passed (5 minutes = 300 seconds)
        require(
            block.timestamp >= request.timestamp + 300,
            "Hero: Must wait 5 minutes before emergency reset"
        );
        
        // Store payment amount before deletion
        uint256 refundAmount = request.payment;
        
        // Force reset request
        delete userRequests[msg.sender];
        
        // Refund BNB platform fee if payment was made
        if (refundAmount > 0) {
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "Hero: Refund failed");
        }
        
        emit EmergencyReset(msg.sender, refundAmount);
    }
    
    function canMint(address user) external view returns (bool) {
        return userRequests[user].quantity == 0 || userRequests[user].fulfilled;
    }

    receive() external payable {}
}
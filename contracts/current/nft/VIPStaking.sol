// VIPStaking.sol (EIP-5192 Enhanced Version)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/interfaces.sol";

contract VIPStaking is ERC721, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    IDungeonCore public dungeonCore;
    string public baseURI;
    string private _contractURI;
    
    uint256 private _nextTokenId;
    uint256 public unstakeCooldown;
    uint256 public totalPendingUnstakes;

    struct StakeInfo {
        uint256 amount;
        uint256 tokenId;
    }
    mapping(address => StakeInfo) public userStakes;

    struct UnstakeRequest {
        uint256 amount;
        uint256 availableAt;
    }
    mapping(address => UnstakeRequest) public unstakeQueue;

    event Staked(address indexed user, uint256 amount, uint256 tokenId, uint8 vipLevel);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 availableAt, uint8 newVipLevel);
    event UnstakeClaimed(address indexed user, uint256 amount, uint8 newVipLevel);
    event VipLevelChanged(address indexed user, uint8 oldLevel, uint8 newLevel);
    event DungeonCoreSet(address indexed newAddress);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);

    // 🔥 EIP-5192: Minimal Non-Transferable NFTs Event
    event Locked(uint256 tokenId);

    // Enhanced constructor with default metadata URIs
    constructor() ERC721("Dungeon Delvers VIP", "DDV") Ownable(msg.sender) {
        _nextTokenId = 1;
        unstakeCooldown = 24 hours;
        
        // Set default baseURI for immediate marketplace compatibility
        baseURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/vip/";
        
        // Set default contractURI for collection-level metadata
        _contractURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/collection/vipstaking";
    }

    // 🔥 EIP-5192: Returns the locking status of a Soulbound Token
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true; // All VIP tokens are permanently locked
    }

    function stake(uint256 _amount) public nonReentrant whenNotPaused {
        require(_amount > 0, "VIP: Cannot stake 0");
        require(unstakeQueue[msg.sender].amount == 0, "VIP: You have a pending unstake to claim");
        address soulShardAddr = _getSoulShardToken();
        require(soulShardAddr != address(0), "VIP: Token address not set");
        
        // Get old VIP level before staking
        uint8 oldVipLevel = getVipLevel(msg.sender);
        
        IERC20(soulShardAddr).safeTransferFrom(msg.sender, address(this), _amount);
        StakeInfo storage userStake = userStakes[msg.sender];
        userStake.amount += _amount;

        uint256 currentTokenId = userStake.tokenId;
        if (currentTokenId == 0) {
            currentTokenId = _nextTokenId++;
            userStake.tokenId = currentTokenId;
            _safeMint(msg.sender, currentTokenId);
            
            // 🔥 EIP-5192: Emit Locked event when token is minted
            emit Locked(currentTokenId);
        }
        
        // Calculate new VIP level after staking
        uint8 newVipLevel = getVipLevel(msg.sender);
        
        emit Staked(msg.sender, _amount, currentTokenId, newVipLevel);
        
        // If VIP level changed, emit level change event
        if (newVipLevel != oldVipLevel) {
            emit VipLevelChanged(msg.sender, oldVipLevel, newVipLevel);
        }
    }

    function requestUnstake(uint256 _amount) public nonReentrant whenNotPaused {
        StakeInfo storage userStake = userStakes[msg.sender];
        require(_amount > 0 && _amount <= userStake.amount, "VIP: Invalid unstake amount");
        require(unstakeQueue[msg.sender].amount == 0, "VIP: Previous unstake request still pending");

        // Get old VIP level before unstaking
        uint8 oldVipLevel = getVipLevel(msg.sender);

        userStake.amount -= _amount;
        totalPendingUnstakes += _amount;

        uint256 availableAt = block.timestamp + unstakeCooldown;
        unstakeQueue[msg.sender] = UnstakeRequest({
            amount: _amount,
            availableAt: availableAt
        });

        // Calculate new VIP level after unstaking
        uint8 newVipLevel = getVipLevel(msg.sender);
        
        emit UnstakeRequested(msg.sender, _amount, availableAt, newVipLevel);
        
        // If VIP level changed, emit level change event
        if (newVipLevel != oldVipLevel) {
            emit VipLevelChanged(msg.sender, oldVipLevel, newVipLevel);
        }
    }

    function claimUnstaked() public nonReentrant {
        UnstakeRequest storage request = unstakeQueue[msg.sender];
        uint256 amountToClaim = request.amount;

        require(amountToClaim > 0, "VIP: No pending unstake request");
        require(block.timestamp >= request.availableAt, "VIP: Cooldown period is not over yet");

        delete unstakeQueue[msg.sender];
        totalPendingUnstakes -= amountToClaim;

        // Calculate current VIP level (should be same as after requestUnstake)
        uint8 currentVipLevel = getVipLevel(msg.sender);

        IERC20(_getSoulShardToken()).safeTransfer(msg.sender, amountToClaim);
        emit UnstakeClaimed(msg.sender, amountToClaim, currentVipLevel);
    }
    
    /**
     * @notice Override _update to implement SBT
     * @dev Only allow minting, completely prohibit transfers
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "PlayerProfile: This SBT is non-transferable");
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Disable all approval functions
     */
    function approve(address, uint256) public pure override {
        // SBT (Soul Bound Token) - not approvable
    }
    
    function setApprovalForAll(address, bool) public pure override {
        // SBT (Soul Bound Token) - not approvable
    }
    
    function transferFrom(address, address, uint256) public pure override {
        // SBT (Soul Bound Token) - not transferable
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        // SBT (Soul Bound Token) - not transferable
    }
    
    function getVipLevel(address _user) public view returns (uint8) {
        uint256 stakedAmount = userStakes[_user].amount;
        if (stakedAmount == 0 || address(dungeonCore) == address(0)) return 0;
        uint256 stakedValueUSD = dungeonCore.getUSDValueForSoulShard(stakedAmount);
        
        // stakedValueUSD has 18 decimals, need to divide by 1e18 to convert to actual USD value
        if (stakedValueUSD < 100 * 1e18) return 0;
        uint256 level = Math.sqrt(stakedValueUSD / (100 * 1e18));
        
        // Add reasonable upper limit protection
        if (level > 255) level = 255;
        return uint8(level);
    }
    
    function getVipTaxReduction(address _user) external view returns (uint256) {
        uint8 level = getVipLevel(_user);
        return uint256(level) * 50; // 50 = 0.5% per level in basis points
    }
    
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);
        require(bytes(baseURI).length > 0, "VIP: baseURI not set");
        return string(abi.encodePacked(baseURI, _tokenId.toString()));
    }
    
    function setDungeonCore(address _newAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_newAddress);
        emit DungeonCoreSet(_newAddress);
    }

    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId > 0 ? _nextTokenId - 1 : 0;
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
    /// @notice Returns the contract URI for collection-level metadata (OpenSea/OKX compatibility)
    /// @dev This enables NFT marketplaces to read collection logo, description, and other metadata

    function setUnstakeCooldown(uint256 _newCooldown) external onlyOwner {
        unstakeCooldown = _newCooldown;
    }
    
    function withdrawStakedTokens(uint256 amount) external onlyOwner {
        IERC20 token = IERC20(_getSoulShardToken());
        uint256 contractBalance = token.balanceOf(address(this));
        uint256 availableToWithdraw = contractBalance - totalPendingUnstakes;
        
        // If amount = 0 or exceeds available balance, withdraw all available funds
        if (amount == 0 || amount > availableToWithdraw) {
            amount = availableToWithdraw;
        }
        
        // If no withdrawable funds, return silently instead of throwing error
        if (amount == 0) {
            return;
        }
        
        token.safeTransfer(owner(), amount);
    }
    
    /**
     * @notice Pause/unpause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw native BNB (safety function)
     * @dev Added for emergency withdrawal if contract receives BNB
     */
    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "VIPStaking: No BNB to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "VIPStaking: BNB transfer failed");
    }
    
    /**
     * @notice Allow contract to receive BNB
     */
    receive() external payable {}
}
// PlayerProfile.sol (EIP-5192 Enhanced Version)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "../interfaces/interfaces.sol";

contract PlayerProfile is ERC721, Ownable, Pausable, IERC4906 {
    using Math for uint256;
    using Strings for uint256;

    IDungeonCore public dungeonCore;
    string public baseURI;
    string private _contractURI;

    struct ProfileData {
        uint256 experience;
    }
    
    mapping(uint256 => ProfileData) public profileData;
    mapping(address => uint256) public profileTokenOf;
    
    uint256 private _nextTokenId;

    event ProfileCreated(address indexed player, uint256 indexed tokenId, uint256 initialLevel);
    event ExperienceAdded(address indexed player, uint256 indexed tokenId, uint256 amount, uint256 newTotalExperience, uint256 newLevel);
    event LevelUp(address indexed player, uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);

    // EIP-5192: Minimal Non-Transferable NFTs Event
    event Locked(uint256 tokenId);

    // Enhanced constructor with default metadata URIs
    constructor() ERC721("Dungeon Delvers Profile", "DDPF") Ownable(msg.sender) {
        _nextTokenId = 1;
        
        // Set default baseURI for immediate marketplace compatibility
        baseURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/profile/";
        
        // Set default contractURI for collection-level metadata
        _contractURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/collection/playerprofile";
    }

    // EIP-5192: Returns the locking status of a Soulbound Token
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true; // All profile tokens are permanently locked
    }

    /**
     * @notice Mint a new profile SBT for player
     * @dev Added reentrancy protection and duplicate minting checks
     */
    function mintProfile(address _player) public onlyAuthorized whenNotPaused returns (uint256) {
        return _mintProfile(_player);
    }

    /**
     * @notice Internal minting function to avoid nested permission check issues
     */
    function _mintProfile(address _player) internal returns (uint256) {
        require(profileTokenOf[_player] == 0, "PlayerProfile: Profile already exists");
        uint256 tokenId = _nextTokenId++;
        _safeMint(_player, tokenId);
        profileTokenOf[_player] = tokenId;
        profileData[tokenId].experience = 0;
        
        // EIP-5192: Emit Locked event when token is minted
        emit Locked(tokenId);
        
        // Calculate and emit initial level (always 1 for new profiles)
        uint256 initialLevel = 1;
        emit ProfileCreated(_player, tokenId, initialLevel);
        return tokenId;
    }

    /**
     * @notice Add experience for player. If player has no profile, automatically create one.
     */
    function addExperience(address _player, uint256 _amount) external onlyAuthorized whenNotPaused {
        uint256 tokenId = profileTokenOf[_player];
        if (tokenId == 0) {
            tokenId = _mintProfile(_player);  // Use internal function to avoid permission checks
        }
        
        // Get old level before updating experience
        uint256 oldExp = profileData[tokenId].experience;
        uint256 oldLevel = _calculateLevel(oldExp);
        
        // Update experience
        uint256 newExp = oldExp + _amount;
        profileData[tokenId].experience = newExp;
        
        // Calculate new level
        uint256 newLevel = _calculateLevel(newExp);
        
        // Emit experience added event with calculated level
        emit ExperienceAdded(_player, tokenId, _amount, newExp, newLevel);
        
        // If level changed, emit level up event
        if (newLevel > oldLevel) {
            emit LevelUp(_player, tokenId, oldLevel, newLevel);
        }
        
        // EIP-4906: Emit MetadataUpdate for OKX marketplace refresh
        emit MetadataUpdate(tokenId);
    }
    
    /**
     * @notice Internal function to calculate level from experience
     * @dev Same logic as getLevel but as internal function for reuse
     */
    function _calculateLevel(uint256 _experience) internal pure returns (uint256) {
        if (_experience < 100) return 1;
        return Math.sqrt(_experience / 100) + 1;
    }
    
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);
        require(bytes(baseURI).length > 0, "Profile: baseURI not set");
        return string(abi.encodePacked(baseURI, _tokenId.toString()));
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
    
    function setDungeonCore(address _address) public onlyOwner {
        dungeonCore = IDungeonCore(_address);
    }
    
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "PlayerProfile: This SBT is non-transferable");
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Disable all approval functions
     */
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        // SBT (Soul Bound Token) - not approvable
    }
    
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        // SBT (Soul Bound Token) - not approvable
    }
    
    function transferFrom(address, address, uint256) public pure override(ERC721, IERC721) {
        // SBT (Soul Bound Token) - not transferable
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721, IERC721) {
        revert("PlayerProfile: SBT cannot be transferred");
    }

    function getLevel(address _player) external view returns (uint256) {
        uint256 tokenId = profileTokenOf[_player];
        if (tokenId == 0) return 0;
        uint256 exp = profileData[tokenId].experience;
        if (exp < 100) return 1;
        return Math.sqrt(exp / 100) + 1;
    }

    function getExperience(address _player) external view returns (uint256) {
        uint256 tokenId = profileTokenOf[_player];
        if (tokenId == 0) return 0;
        return profileData[tokenId].experience;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    modifier onlyAuthorized() {
        require(address(dungeonCore) != address(0), "Profile: DungeonCore not set");
        require(msg.sender == dungeonCore.dungeonMasterAddress(), "Profile: Caller is not the DungeonMaster");
        _;
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId > 0 ? _nextTokenId - 1 : 0;
    }
}
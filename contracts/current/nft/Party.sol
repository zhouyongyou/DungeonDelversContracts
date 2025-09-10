// Party.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "../interfaces/interfaces.sol";

contract Party is ERC721, Ownable, ReentrancyGuard, Pausable, ERC721Holder, IERC4906 {
    using Strings for uint256;
    string public baseURI;
    string private _contractURI;

    IDungeonCore public dungeonCoreContract;

    uint256 public platformFee = 0.001 ether;
    struct PartyComposition {
        uint256[] heroIds;
        uint256[] relicIds;
        uint256 totalPower;
        uint8 partyRarity;
    }
    mapping(uint256 => PartyComposition) public partyCompositions;
    uint256 private _nextTokenId;
    
    mapping(uint256 => uint256) public partyPowerDirect;

    event PartyCreated(
        uint256 indexed partyId,
        address indexed owner,
        uint256[] heroIds,
        uint256[] relicIds,
        uint256 totalPower,
        uint8 partyRarity
    );
    event PlatformFeeSet(uint256 newFee);
    event DungeonCoreSet(address indexed newAddress);
    event BaseURISet(string newBaseURI);
    event ContractURIUpdated(string newContractURI);
    event OperatorApprovalSet(address indexed operator, bool approved);

    // Enhanced constructor with default metadata URIs
    constructor() ERC721("Dungeon Delvers Party", "DDP") Ownable(msg.sender) {
        _nextTokenId = 1;
        
        // Set default baseURI for immediate marketplace compatibility
        baseURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/party/";
        
        // Set default contractURI for collection-level metadata
        _contractURI = "https://dungeon-delvers-metadata-server.onrender.com/metadata/collection/party";
    }

    // EIP-4906 support
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }

    receive() external payable {}

    function createParty(uint256[] calldata _heroIds, uint256[] calldata _relicIds) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256 partyId) 
    {
        require(msg.value >= platformFee, "Party: Platform fee not met");
        require(_relicIds.length > 0 && _relicIds.length <= 5, "Party: Invalid relic count");
        require(_heroIds.length <= 25, "Party: Too many heroes");
        IHero heroContract = IHero(_getHeroContract());
        IRelic relicContract = IRelic(_getRelicContract());
        require(address(heroContract) != address(0) && address(relicContract) != address(0), "Party: Contracts not set");

        uint256 totalPower = 0;
        uint256 totalCapacity = 0;
        
        // Verify relic ownership and calculate total capacity
        for (uint i = 0; i < _relicIds.length; i++) {
            require(relicContract.ownerOf(_relicIds[i]) == msg.sender, "Party: You do not own all relics");
            (, uint8 capacity) = relicContract.getRelicProperties(_relicIds[i]);
            totalCapacity += capacity;
        }

        // Capacity check: heroes must not exceed total capacity
        require(_heroIds.length <= totalCapacity, "Party: Too many heroes for capacity");
        
        // Verify heroes and calculate total power
        for (uint i = 0; i < _heroIds.length; i++) {
            require(heroContract.ownerOf(_heroIds[i]) == msg.sender, "Party: You do not own all heroes");
            (, uint16 power) = heroContract.getHeroProperties(_heroIds[i]);
            totalPower += power;
        }

        // Security upgrade: use safeTransferFrom to transfer NFTs to this contract
        for (uint i = 0; i < _relicIds.length; i++) {
            relicContract.safeTransferFrom(msg.sender, address(this), _relicIds[i]);
        }
        for (uint i = 0; i < _heroIds.length; i++) {
            heroContract.safeTransferFrom(msg.sender, address(this), _heroIds[i]);
        }
        
        partyId = _nextTokenId;
        uint8 partyRarity = _calculatePartyRarity(totalPower);
        
        partyCompositions[partyId] = PartyComposition({
            heroIds: _heroIds,
            relicIds: _relicIds,
            totalPower: totalPower,
            partyRarity: partyRarity
        });
        
        // Store power in direct mapping for fast lookup
        partyPowerDirect[partyId] = totalPower;

        _safeMint(msg.sender, partyId);
        _nextTokenId++;
        
        emit PartyCreated(partyId, msg.sender, _heroIds, _relicIds, totalPower, partyRarity);
        
        // EIP-4906: Emit MetadataUpdate for OKX marketplace refresh
        emit MetadataUpdate(partyId);
        
        return partyId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        require(bytes(baseURI).length > 0, "Party: baseURI not set");
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }
    

    function setDungeonCore(address _coreAddress) public onlyOwner {
        dungeonCoreContract = IDungeonCore(_coreAddress);
        emit DungeonCoreSet(_coreAddress);
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

    function setOperatorApproval(address operator, bool approved) external onlyOwner {
        IHero(_getHeroContract()).setApprovalForAll(operator, approved);
        IRelic(_getRelicContract()).setApprovalForAll(operator, approved);
        emit OperatorApprovalSet(operator, approved);
    }

    function pause() public onlyOwner { _pause(); }
    function unpause() public onlyOwner { _unpause(); }

    /**
     * @notice Withdraw platform fees collected in contract (BNB)
     */
    function withdrawNative() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Party: Native withdraw failed");
    }
    
    /**
     * @notice Withdraw SoulShard tokens (safety function)
     * @dev Added for emergency withdrawal if contract receives SOUL tokens
     */
    function withdrawSoulShard() external onlyOwner {
        address soulShardAddress = dungeonCoreContract.soulShardTokenAddress();
        require(soulShardAddress != address(0), "Party: SoulShard not set");
        
        IERC20 soulShard = IERC20(soulShardAddress);
        uint256 balance = soulShard.balanceOf(address(this));
        
        require(balance > 0, "Party: No SOUL to withdraw");
        soulShard.transfer(owner(), balance);
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        platformFee = _newFee;
        emit PlatformFeeSet(_newFee);
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId > 0 ? _nextTokenId - 1 : 0;
    }

    function _requireNotLocked(uint256 _partyId) internal view {
        if (address(dungeonCoreContract) != address(0)) {
            require(!dungeonCoreContract.isPartyLocked(_partyId), "Party: Locked in dungeon");
        }
    }
    
    function getPartyComposition(uint256 _partyId) external view returns (uint256 totalPower) {
        ownerOf(_partyId);
        PartyComposition memory comp = partyCompositions[_partyId];
        return comp.totalPower;
    }
    
    function getFullPartyComposition(uint256 _partyId) external view returns (PartyComposition memory) {
        ownerOf(_partyId);
        return partyCompositions[_partyId];
    }

    function _calculatePartyRarity(uint256 _totalPower) private pure returns (uint8) {
        if (_totalPower >= 2700) return 5;  // UR - Ultra Rare (2700+)
        if (_totalPower >= 2100) return 4;  // SSR - Super Super Rare (2100-2699)
        if (_totalPower >= 1500) return 3;  // SR - Super Rare (1500-2099)
        if (_totalPower >= 900) return 2;   // R - Rare (900-1499)
        return 1;                            // N - Normal (0-899)
    }
    
    function getPartyPowerQuick(uint256 _partyId) external view returns (uint256) {
        ownerOf(_partyId); // Check party exists
        return partyPowerDirect[_partyId];
    }
    

    function _getHeroContract() internal view returns (address) {
        return dungeonCoreContract.heroContractAddress();
    }

    function _getRelicContract() internal view returns (address) {
        return dungeonCoreContract.relicContractAddress();
    }

    /**
     * @notice Manually trigger MetadataUpdate event for debugging
     * @dev Owner-only function to force NFT marketplace refresh
     */
    function forceMetadataRefresh(uint256 tokenId) external onlyOwner {
        _requireOwned(tokenId);
        emit MetadataUpdate(tokenId);
    }

    /**
     * @notice Batch manually trigger MetadataUpdate events for debugging  
     * @dev Owner-only function to force multiple NFT marketplace refresh
     */
    function batchForceMetadataRefresh(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _requireOwned(tokenIds[i]);
            emit MetadataUpdate(tokenIds[i]);
        }
    }
}
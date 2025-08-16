// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DungeonMarketplace
 * @dev P2P NFT marketplace for DungeonDelvers game assets
 * @notice Supports trading of Heroes, Relics, and Parties with SOUL token
 */
contract DungeonMarketplace is ReentrancyGuard, Ownable {

    // =================================================================
    // State Variables
    // =================================================================
    
    IERC20 public immutable soulToken;
    uint256 private _listingIds;
    
    // Platform fees (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant MAX_FEE = 1000; // 10% maximum
    
    address public feeRecipient;
    
    // =================================================================
    // Structs and Enums
    // =================================================================
    
    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }
    
    enum NFTType {
        Hero,
        Relic, 
        Party
    }
    
    struct Listing {
        uint256 id;
        address seller;
        NFTType nftType;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        ListingStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // =================================================================
    // Storage
    // =================================================================
    
    mapping(uint256 => Listing) public listings;
    mapping(address => bool) public approvedNFTContracts;
    mapping(address => uint256[]) public userListings;
    
    // =================================================================
    // Events
    // =================================================================
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        NFTType indexed nftType,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event ListingSold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFeeAmount
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    event ListingPriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event NFTContractApproved(address indexed nftContract, bool approved);
    
    // =================================================================
    // Constructor
    // =================================================================
    
    constructor(
        address _soulToken,
        address _feeRecipient,
        address[] memory _nftContracts
    ) Ownable(msg.sender) {
        require(_soulToken != address(0), "Invalid SOUL token address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        soulToken = IERC20(_soulToken);
        feeRecipient = _feeRecipient;
        
        // Approve initial NFT contracts
        for (uint256 i = 0; i < _nftContracts.length; i++) {
            approvedNFTContracts[_nftContracts[i]] = true;
            emit NFTContractApproved(_nftContracts[i], true);
        }
    }
    
    // =================================================================
    // Core Marketplace Functions
    // =================================================================
    
    /**
     * @dev Create a new NFT listing
     * @param nftType Type of NFT (Hero, Relic, Party)
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Price in SOUL tokens (with 18 decimals)
     */
    function createListing(
        NFTType nftType,
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(approvedNFTContracts[nftContract], "NFT contract not approved");
        require(price > 0, "Price must be greater than 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );
        
        _listingIds++;
        uint256 listingId = _listingIds;
        
        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            nftType: nftType,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            status: ListingStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        userListings[msg.sender].push(listingId);
        
        emit ListingCreated(
            listingId,
            msg.sender,
            nftType,
            nftContract,
            tokenId,
            price
        );
    }
    
    /**
     * @dev Purchase an NFT from a listing
     * @param listingId ID of the listing to purchase
     */
    function purchaseNFT(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy own listing");
        
        IERC721 nft = IERC721(listing.nftContract);
        require(nft.ownerOf(listing.tokenId) == listing.seller, "NFT no longer owned by seller");
        
        uint256 platformFeeAmount = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - platformFeeAmount;
        
        // Transfer SOUL tokens
        require(
            soulToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            "SOUL transfer to seller failed"
        );
        
        if (platformFeeAmount > 0) {
            require(
                soulToken.transferFrom(msg.sender, feeRecipient, platformFeeAmount),
                "SOUL transfer to fee recipient failed"
            );
        }
        
        // Transfer NFT
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        
        // Update listing status
        listing.status = ListingStatus.Sold;
        listing.updatedAt = block.timestamp;
        
        emit ListingSold(
            listingId,
            listing.seller,
            msg.sender,
            listing.price,
            platformFeeAmount
        );
    }
    
    /**
     * @dev Cancel an active listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.status == ListingStatus.Active, "Listing not active");
        
        listing.status = ListingStatus.Cancelled;
        listing.updatedAt = block.timestamp;
        
        emit ListingCancelled(listingId, msg.sender);
    }
    
    /**
     * @dev Update the price of an active listing
     * @param listingId ID of the listing to update
     * @param newPrice New price in SOUL tokens
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        listing.updatedAt = block.timestamp;
        
        emit ListingPriceUpdated(listingId, oldPrice, newPrice);
    }
    
    // =================================================================
    // View Functions
    // =================================================================
    
    /**
     * @dev Get listing details
     * @param listingId ID of the listing
     * @return Listing struct
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get all listing IDs for a user
     * @param user Address of the user
     * @return Array of listing IDs
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
    
    /**
     * @dev Get current listing ID counter
     * @return Current listing ID
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingIds;
    }
    
    /**
     * @dev Check if a listing is active and valid
     * @param listingId ID of the listing
     * @return True if listing is active and NFT is still owned by seller
     */
    function isListingValid(uint256 listingId) external view returns (bool) {
        Listing memory listing = listings[listingId];
        if (listing.status != ListingStatus.Active) {
            return false;
        }
        
        IERC721 nft = IERC721(listing.nftContract);
        return nft.ownerOf(listing.tokenId) == listing.seller;
    }
    
    // =================================================================
    // Admin Functions
    // =================================================================
    
    /**
     * @dev Update platform fee (only owner)
     * @param newFee New fee in basis points
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    /**
     * @dev Approve or disapprove NFT contract for trading (only owner)
     * @param nftContract Address of the NFT contract
     * @param approved Approval status
     */
    function setNFTContractApproval(address nftContract, bool approved) external onlyOwner {
        require(nftContract != address(0), "Invalid contract address");
        approvedNFTContracts[nftContract] = approved;
        emit NFTContractApproved(nftContract, approved);
    }
    
    /**
     * @dev Emergency function to pause/unpause specific listings (only owner)
     * @dev This could be extended to pause the entire contract if needed
     */
    function emergencyCancelListing(uint256 listingId) external onlyOwner {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        
        listing.status = ListingStatus.Cancelled;
        listing.updatedAt = block.timestamp;
        
        emit ListingCancelled(listingId, listing.seller);
    }
}
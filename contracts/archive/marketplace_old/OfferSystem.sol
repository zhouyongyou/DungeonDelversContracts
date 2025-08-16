// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OfferSystem
 * @dev Offer system for DungeonDelvers marketplace
 * @notice Allows users to make offers on NFTs with escrow functionality
 */
contract OfferSystem is ReentrancyGuard, Ownable {

    // =================================================================
    // State Variables
    // =================================================================
    
    IERC20 public immutable soulToken;
    uint256 private _offerIds;
    
    // Platform fees (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant MAX_FEE = 1000; // 10% maximum
    
    address public feeRecipient;
    
    // =================================================================
    // Structs and Enums
    // =================================================================
    
    enum OfferStatus {
        Active,
        Accepted,
        Declined,
        Expired,
        Cancelled
    }
    
    enum NFTType {
        Hero,
        Relic,
        Party
    }
    
    struct Offer {
        uint256 id;
        address buyer;
        address seller;
        NFTType nftType;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 expiresAt;
        OfferStatus status;
        uint256 createdAt;
        string message;
    }
    
    // =================================================================
    // Storage
    // =================================================================
    
    mapping(uint256 => Offer) public offers;
    mapping(address => bool) public approvedNFTContracts;
    mapping(address => uint256[]) public userOffersMade;
    mapping(address => uint256[]) public userOffersReceived;
    mapping(bytes32 => uint256[]) public nftOffers; // keccak256(nftContract, tokenId)
    
    // Escrow for active offers
    mapping(uint256 => bool) public escrowed;
    
    // =================================================================
    // Events
    // =================================================================
    
    event OfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed seller,
        NFTType nftType,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 expiresAt,
        string message
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 platformFeeAmount
    );
    
    event OfferDeclined(
        uint256 indexed offerId,
        address indexed seller
    );
    
    event OfferCancelled(
        uint256 indexed offerId,
        address indexed buyer
    );
    
    event OfferExpired(
        uint256 indexed offerId
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
    // Core Offer Functions
    // =================================================================
    
    /**
     * @dev Make an offer on an NFT
     * @param seller Address of the NFT owner
     * @param nftType Type of NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to make offer on
     * @param amount Offer amount in SOUL tokens
     * @param duration Offer duration in seconds
     * @param message Optional message to seller
     */
    function makeOffer(
        address seller,
        NFTType nftType,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 duration,
        string calldata message
    ) external nonReentrant {
        require(approvedNFTContracts[nftContract], "NFT contract not approved");
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Cannot make offer to yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(duration >= 1 hours, "Duration too short");
        require(duration <= 30 days, "Duration too long");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == seller, "Seller doesn't own the NFT");
        
        // Transfer SOUL tokens to escrow
        require(
            soulToken.transferFrom(msg.sender, address(this), amount),
            "SOUL transfer failed"
        );
        
        _offerIds++;
        uint256 offerId = _offerIds;
        
        uint256 expiresAt = block.timestamp + duration;
        
        offers[offerId] = Offer({
            id: offerId,
            buyer: msg.sender,
            seller: seller,
            nftType: nftType,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            expiresAt: expiresAt,
            status: OfferStatus.Active,
            createdAt: block.timestamp,
            message: message
        });
        
        escrowed[offerId] = true;
        userOffersMade[msg.sender].push(offerId);
        userOffersReceived[seller].push(offerId);
        
        bytes32 nftKey = keccak256(abi.encodePacked(nftContract, tokenId));
        nftOffers[nftKey].push(offerId);
        
        emit OfferCreated(
            offerId,
            msg.sender,
            seller,
            nftType,
            nftContract,
            tokenId,
            amount,
            expiresAt,
            message
        );
    }
    
    /**
     * @dev Accept an offer
     * @param offerId ID of the offer to accept
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.seller == msg.sender, "Not the seller");
        require(offer.status == OfferStatus.Active, "Offer not active");
        require(block.timestamp <= offer.expiresAt, "Offer expired");
        require(escrowed[offerId], "Funds not escrowed");
        
        IERC721 nft = IERC721(offer.nftContract);
        require(nft.ownerOf(offer.tokenId) == msg.sender, "NFT no longer owned");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(offer.tokenId) == address(this),
            "Contract not approved for NFT transfer"
        );
        
        uint256 platformFeeAmount = (offer.amount * platformFee) / 10000;
        uint256 sellerAmount = offer.amount - platformFeeAmount;
        
        // Transfer NFT to buyer
        nft.safeTransferFrom(msg.sender, offer.buyer, offer.tokenId);
        
        // Transfer SOUL tokens from escrow
        require(
            soulToken.transfer(msg.sender, sellerAmount),
            "SOUL transfer to seller failed"
        );
        
        if (platformFeeAmount > 0) {
            require(
                soulToken.transfer(feeRecipient, platformFeeAmount),
                "SOUL transfer to fee recipient failed"
            );
        }
        
        // Update offer status
        offer.status = OfferStatus.Accepted;
        escrowed[offerId] = false;
        
        emit OfferAccepted(
            offerId,
            offer.buyer,
            msg.sender,
            offer.amount,
            platformFeeAmount
        );
    }
    
    /**
     * @dev Decline an offer
     * @param offerId ID of the offer to decline
     */
    function declineOffer(uint256 offerId) external {
        Offer storage offer = offers[offerId];
        require(offer.seller == msg.sender, "Not the seller");
        require(offer.status == OfferStatus.Active, "Offer not active");
        
        // Return escrowed funds to buyer
        if (escrowed[offerId]) {
            require(
                soulToken.transfer(offer.buyer, offer.amount),
                "SOUL refund failed"
            );
            escrowed[offerId] = false;
        }
        
        offer.status = OfferStatus.Declined;
        
        emit OfferDeclined(offerId, msg.sender);
    }
    
    /**
     * @dev Cancel an offer (buyer only)
     * @param offerId ID of the offer to cancel
     */
    function cancelOffer(uint256 offerId) external {
        Offer storage offer = offers[offerId];
        require(offer.buyer == msg.sender, "Not the buyer");
        require(offer.status == OfferStatus.Active, "Offer not active");
        
        // Return escrowed funds to buyer
        if (escrowed[offerId]) {
            require(
                soulToken.transfer(msg.sender, offer.amount),
                "SOUL refund failed"
            );
            escrowed[offerId] = false;
        }
        
        offer.status = OfferStatus.Cancelled;
        
        emit OfferCancelled(offerId, msg.sender);
    }
    
    /**
     * @dev Mark expired offers (can be called by anyone)
     * @param offerIds Array of offer IDs to check for expiration
     */
    function markExpiredOffers(uint256[] calldata offerIds) external {
        for (uint256 i = 0; i < offerIds.length; i++) {
            uint256 offerId = offerIds[i];
            Offer storage offer = offers[offerId];
            
            if (offer.status == OfferStatus.Active && block.timestamp > offer.expiresAt) {
                // Return escrowed funds to buyer
                if (escrowed[offerId]) {
                    require(
                        soulToken.transfer(offer.buyer, offer.amount),
                        "SOUL refund failed"
                    );
                    escrowed[offerId] = false;
                }
                
                offer.status = OfferStatus.Expired;
                emit OfferExpired(offerId);
            }
        }
    }
    
    // =================================================================
    // View Functions
    // =================================================================
    
    /**
     * @dev Get offer details
     * @param offerId ID of the offer
     * @return Offer struct
     */
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }
    
    /**
     * @dev Get all offer IDs made by a user
     * @param user Address of the user
     * @return Array of offer IDs
     */
    function getUserOffersMade(address user) external view returns (uint256[] memory) {
        return userOffersMade[user];
    }
    
    /**
     * @dev Get all offer IDs received by a user
     * @param user Address of the user
     * @return Array of offer IDs
     */
    function getUserOffersReceived(address user) external view returns (uint256[] memory) {
        return userOffersReceived[user];
    }
    
    /**
     * @dev Get all offers for a specific NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID
     * @return Array of offer IDs
     */
    function getNFTOffers(address nftContract, uint256 tokenId) external view returns (uint256[] memory) {
        bytes32 nftKey = keccak256(abi.encodePacked(nftContract, tokenId));
        return nftOffers[nftKey];
    }
    
    /**
     * @dev Get current offer ID counter
     * @return Current offer ID
     */
    function getCurrentOfferId() external view returns (uint256) {
        return _offerIds;
    }
    
    /**
     * @dev Check if an offer is still valid
     * @param offerId ID of the offer
     * @return True if offer is active and not expired
     */
    function isOfferValid(uint256 offerId) external view returns (bool) {
        Offer memory offer = offers[offerId];
        return offer.status == OfferStatus.Active && block.timestamp <= offer.expiresAt;
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
     * @dev Approve or disapprove NFT contract for offers (only owner)
     * @param nftContract Address of the NFT contract
     * @param approved Approval status
     */
    function setNFTContractApproval(address nftContract, bool approved) external onlyOwner {
        require(nftContract != address(0), "Invalid contract address");
        approvedNFTContracts[nftContract] = approved;
        emit NFTContractApproved(nftContract, approved);
    }
    
    /**
     * @dev Emergency function to cancel specific offers (only owner)
     * @param offerId ID of the offer to cancel
     */
    function emergencyCancelOffer(uint256 offerId) external onlyOwner {
        Offer storage offer = offers[offerId];
        require(offer.status == OfferStatus.Active, "Offer not active");
        
        // Return escrowed funds to buyer
        if (escrowed[offerId]) {
            require(
                soulToken.transfer(offer.buyer, offer.amount),
                "SOUL refund failed"
            );
            escrowed[offerId] = false;
        }
        
        offer.status = OfferStatus.Cancelled;
        emit OfferCancelled(offerId, offer.buyer);
    }
}
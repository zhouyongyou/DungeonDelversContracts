// contracts/DungeonCore.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title DungeonCore
 * @notice Central hub for registering and managing all satellite contracts, acting as a bridge for communication between them
 * @dev Security-hardened version with ReentrancyGuard to prevent cross-contract reentrancy attacks
 */
contract DungeonCore is Ownable, ReentrancyGuard, Pausable {

    address public usdTokenAddress;
    address public soulShardTokenAddress;
    address public oracleAddress;
    address public heroContractAddress;
    address public relicContractAddress;
    address public partyContractAddress;
    address public playerVaultAddress;
    address public dungeonMasterAddress;
    address public altarOfAscensionAddress;
    address public playerProfileAddress;
    address public vipStakingAddress;
    
    // Centralized management additions
    address public vrfManager;
    address public dungeonStorageAddress;

    uint8 public usdDecimals;

    event OracleSet(address indexed newAddress);
    event PlayerVaultSet(address indexed newAddress);
    event DungeonMasterSet(address indexed newAddress);
    event AltarOfAscensionSet(address indexed newAddress);
    event HeroContractSet(address indexed newAddress);
    event RelicContractSet(address indexed newAddress);
    event PartyContractSet(address indexed newAddress);
    event PlayerProfileSet(address indexed newAddress);
    event VipStakingSet(address indexed newAddress);
    
    // Unified management events
    event VRFManagerSet(address indexed newAddress);
    event SoulShardTokenSet(address indexed token);
    event UsdTokenSet(address indexed token);
    event DungeonStorageSet(address indexed storage_);
    event BatchAddressesSet(address soulShard, address vrfManager, address oracle, address storage_);

    constructor(
        address _initialOwner,
        address _usdToken,
        address _soulShardToken
    ) Ownable(_initialOwner) {
        require(_usdToken != address(0) && _soulShardToken != address(0), "Token addresses cannot be zero");
        usdTokenAddress = _usdToken;
        soulShardTokenAddress = _soulShardToken;
        usdDecimals = IERC20Metadata(_usdToken).decimals();
    }

    function getSoulShardAmountForUSD(uint256 _amountUSD) external view returns (uint256) {
        require(oracleAddress != address(0), "Oracle not set");
        // _amountUSD is already in proper 18-decimal format from caller contracts
        // USD1 token is 18 decimals, so no scaling needed for Oracle call
        uint256 scaledAmount;
        if (usdDecimals == 18) {
            scaledAmount = _amountUSD;
        } else {
            scaledAmount = (_amountUSD * (10**usdDecimals)) / 1e18;
        }
        return IOracle(oracleAddress).getAmountOut(usdTokenAddress, scaledAmount);
    }

    /**
     * @notice Calculate USD value based on SoulShard amount (needed for VIP functionality)
     * @param _soulShardAmount Amount of SoulShard (18 decimals)
     * @return USD value (18 decimals)
     */
    function getUSDValueForSoulShard(uint256 _soulShardAmount) external view returns (uint256) {
        require(oracleAddress != address(0), "Oracle not set");
        return IOracle(oracleAddress).getAmountOut(soulShardTokenAddress, _soulShardAmount);
    }

    function spendFromVault(address player, uint256 amount) external nonReentrant whenNotPaused {
        require(playerVaultAddress != address(0), "PlayerVault not set");
        require(
            msg.sender == heroContractAddress || 
            msg.sender == relicContractAddress ||
            msg.sender == altarOfAscensionAddress,
            "DungeonCore: Caller not authorized to spend"
        );
        IPlayerVault(playerVaultAddress).spendForGame(player, amount);
    }

    function isPartyLocked(uint256 partyId) external view returns (bool) {
        if (dungeonMasterAddress == address(0)) {
            return false;
        }
        return IDungeonMaster(dungeonMasterAddress).isPartyLocked(partyId);
    }

    
    function setOracle(address _newAddress) external onlyOwner {
        oracleAddress = _newAddress;
        emit OracleSet(_newAddress);
    }

    function setPlayerVault(address _newAddress) external onlyOwner {
        playerVaultAddress = _newAddress;
        emit PlayerVaultSet(_newAddress);
    }

    function setDungeonMaster(address _newAddress) external onlyOwner {
        dungeonMasterAddress = _newAddress;
        emit DungeonMasterSet(_newAddress);
    }

    function setAltarOfAscension(address _newAddress) external onlyOwner {
        altarOfAscensionAddress = _newAddress;
        emit AltarOfAscensionSet(_newAddress);
    }

    function setHeroContract(address _newAddress) external onlyOwner {
        heroContractAddress = _newAddress;
        emit HeroContractSet(_newAddress);
    }

    function setRelicContract(address _newAddress) external onlyOwner {
        relicContractAddress = _newAddress;
        emit RelicContractSet(_newAddress);
    }

    function setPartyContract(address _newAddress) external onlyOwner {
        partyContractAddress = _newAddress;
        emit PartyContractSet(_newAddress);
    }

     function setPlayerProfile(address _newAddress) external onlyOwner {
        playerProfileAddress = _newAddress;
        emit PlayerProfileSet(_newAddress);
    }

    function setVipStaking(address _newAddress) external onlyOwner {
        vipStakingAddress = _newAddress;
        emit VipStakingSet(_newAddress);
    }
    
    
    /**
     * @notice Set VRF Manager address
     * @param _vrfManager VRF Manager contract address
     * @dev Simplified version: only responsible for storing address, other contracts query via getVRFManager()
     */
    function setVRFManager(address _vrfManager) external onlyOwner {
        require(_vrfManager != address(0), "DungeonCore: VRF Manager cannot be zero address");
        vrfManager = _vrfManager;
        emit VRFManagerSet(_vrfManager);
    }
    
    /**
     * @notice Get current VRF Manager address
     */
    function getVRFManager() external view returns (address) {
        return vrfManager;
    }
    
    
    /**
     * @notice Set SoulShard Token address
     * @param _token SoulShard Token contract address
     */
    function setSoulShardToken(address _token) external onlyOwner {
        require(_token != address(0), "DungeonCore: Token cannot be zero address");
        soulShardTokenAddress = _token;
        emit SoulShardTokenSet(_token);
    }
    
    /**
     * @notice Set USD Token address
     * @param _token USD Token contract address
     */
    function setUsdToken(address _token) external onlyOwner {
        require(_token != address(0), "DungeonCore: Token cannot be zero address");
        usdTokenAddress = _token;
        usdDecimals = IERC20Metadata(_token).decimals();
        emit UsdTokenSet(_token);
    }
    
    /**
     * @notice Set DungeonStorage address
     * @param _storage DungeonStorage contract address
     */
    function setDungeonStorage(address _storage) external onlyOwner {
        require(_storage != address(0), "DungeonCore: Storage cannot be zero address");
        dungeonStorageAddress = _storage;
        emit DungeonStorageSet(_storage);
    }
    
    /**
     * @notice Batch set core addresses (used during deployment)
     * @param _soulShard SoulShard Token address
     * @param _vrfManager VRF Manager address
     * @param _oracle Oracle address
     * @param _dungeonStorage DungeonStorage address
     */
    function setBatchAddresses(
        address _soulShard,
        address _vrfManager,
        address _oracle,
        address _dungeonStorage
    ) external onlyOwner {
        if (_soulShard != address(0)) soulShardTokenAddress = _soulShard;
        if (_vrfManager != address(0)) vrfManager = _vrfManager;
        if (_oracle != address(0)) oracleAddress = _oracle;
        if (_dungeonStorage != address(0)) dungeonStorageAddress = _dungeonStorage;
        
        emit BatchAddressesSet(_soulShard, _vrfManager, _oracle, _dungeonStorage);
    }
    
    /**
     * @notice Get all core addresses (batch query to save gas)
     * @return soulShard SoulShard Token address
     * @return vrf VRF Manager address
     * @return oracle Oracle address
     * @return vault PlayerVault address
     * @return storage_ DungeonStorage address
     */
    function getAllCoreAddresses() external view returns (
        address soulShard,
        address vrf,
        address oracle,
        address vault,
        address storage_
    ) {
        return (
            soulShardTokenAddress,
            vrfManager,
            oracleAddress,
            playerVaultAddress,
            dungeonStorageAddress
        );
    }
    
    /**
     * @notice Get all NFT contract addresses
     * @return hero Hero contract address
     * @return relic Relic contract address
     * @return party Party contract address
     * @return profile PlayerProfile contract address
     * @return vipStaking VIPStaking contract address
     */
    function getAllNFTAddresses() external view returns (
        address hero,
        address relic,
        address party,
        address profile,
        address vipStaking
    ) {
        return (
            heroContractAddress,
            relicContractAddress,
            partyContractAddress,
            playerProfileAddress,
            vipStakingAddress
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
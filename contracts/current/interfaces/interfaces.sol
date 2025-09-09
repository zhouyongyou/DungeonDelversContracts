// contracts/interfaces.sol (Final corrected version)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

interface IVRFManager {
    enum RequestType { HERO_MINT, RELIC_MINT, ALTAR_UPGRADE, DUNGEON_EXPLORE }
    
    struct RandomRequest {
        address requester;
        RequestType requestType;
        bytes data;
        bool fulfilled;
        uint256[] randomWords;
    }
    
    function getVrfRequestPrice() external pure returns (uint256);
    function vrfRequestPrice() external pure returns (uint256);
    function getTotalFee() external pure returns (uint256);
    function requestRandomForUser(address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) external payable returns (uint256);
    function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] memory randomWords);
    function requestRandomness(RequestType requestType, uint32 numWords, bytes calldata data) external payable returns (uint256);
    function requests(uint256) external view returns (RandomRequest memory);
    function requestIdToUser(uint256 requestId) external view returns (address);
    function authorizeContract(address contract_) external;
}

interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
}

interface IDungeonCore {
    function owner() external view returns (address);
    function partyContractAddress() external view returns (address);
    function playerVaultAddress() external view returns (address);
    function playerProfileAddress() external view returns (address);
    function vipStakingAddress() external view returns (address);
    function oracleAddress() external view returns (address);
    function usdTokenAddress() external view returns (address);
    function soulShardTokenAddress() external view returns (address);
    function dungeonMasterAddress() external view returns (address);
    function altarOfAscensionAddress() external view returns (address);
    function heroContractAddress() external view returns (address);
    function relicContractAddress() external view returns (address);
    function usdDecimals() external view returns (uint8);

    function getSoulShardAmountForUSD(uint256 _amountUSD) external view returns (uint256);
    function getUSDValueForSoulShard(uint256 _soulShardAmount) external view returns (uint256);
    function isPartyLocked(uint256 partyId) external view returns (bool);
    function spendFromVault(address player, uint256 amount) external;

    function setAltarOfAscension(address _newAddress) external;
    function setDungeonMaster(address _newAddress) external;
    function setHeroContract(address _newAddress) external;
    function setOracle(address _newAddress) external;
    function setPartyContract(address _newAddress) external;
    function setPlayerProfile(address _newAddress) external;
    function setPlayerVault(address _newAddress) external;
    function setRelicContract(address _newAddress) external;
    function setVipStaking(address _newAddress) external;
    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;
    
    function setVRFManager(address _vrfManager) external;
    function getVRFManager() external view returns (address);
    function vrfManager() external view returns (address);
    
    function setSoulShardToken(address _token) external;
    function setDungeonStorage(address _storage) external;
    function setBatchAddresses(address _soulShard, address _vrfManager, address _oracle, address _dungeonStorage) external;
    function getAllCoreAddresses() external view returns (address soulShard, address vrf, address oracle, address vault, address storage_);
    function getAllNFTAddresses() external view returns (address hero, address relic, address party, address profile, address vipStaking);
    function dungeonStorageAddress() external view returns (address);
}

interface IOracle {
    // Only cross-contract functions (called by DungeonCore)
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
}

interface IPlayerVault {
    // Only cross-contract functions
    function spendForGame(address _player, uint256 _amount) external;
    function deposit(address _player, uint256 _amount) external;
}

interface IDungeonMaster {
    struct ExpeditionRequest {
        uint256 partyId;
        uint256 dungeonId;
        address player;
        bool fulfilled;
        uint256 payment;
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    // Only cross-contract functions
    function isPartyLocked(uint256 partyId) external view returns (bool);
    function getUserRequest(address user) external view returns (ExpeditionRequest memory);
}

interface IDungeonStorage {
    struct Dungeon {
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
        bool isInitialized;
    }

    struct PartyStatus {
        uint256 cooldownEndsAt;  // Cooldown end time
    }
    
    // Cross-contract functions (called by DungeonMaster)
    function dungeons(uint256 id) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized);
    function getPartyStatus(uint256 partyId) external view returns (PartyStatus memory);
    function setPartyStatus(uint256 partyId, PartyStatus calldata data) external;
    function setDungeon(uint256 id, Dungeon calldata data) external;
}

interface IAltarOfAscension {
    struct UpgradeRequest {
        address tokenContract;
        uint8 baseRarity;
        uint256[] burnedTokenIds;
        bool fulfilled;
        uint256 payment;
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    function upgradeNFTs(address tokenContract, uint256[] calldata tokenIds) external payable;
    function setVRFManager(address _vrfManager) external;
    function getUserRequest(address _user) external view returns (UpgradeRequest memory);
}

interface IHero {
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds;  // Added: required for VRF callback mode
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    // Cross-contract functions
    function ownerOf(uint256 tokenId) external view returns (address);
    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint16 power);
    function mintFromAltar(address to, uint8 rarity, uint16 power) external returns (uint256);
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    
    // Internal system functions
    function setVRFManager(address _vrfManager) external;
    function getUserRequest(address user) external view returns (MintRequest memory);
}

interface IRelic {
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds;  // Added: required for VRF callback mode
        uint256 requestId;  // Store VRF requestId for event emission
        uint256 timestamp;  // When the request was created
    }
    
    // Cross-contract functions
    function ownerOf(uint256 tokenId) external view returns (address);
    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity);
    function mintFromAltar(address to, uint8 rarity, uint8 capacity) external returns (uint256);
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    
    // Internal system functions
    function setVRFManager(address _vrfManager) external;
    function getUserRequest(address user) external view returns (MintRequest memory);
}

interface IParty {
    // Only cross-contract functions
    function ownerOf(uint256 tokenId) external view returns (address);
    function getPartyComposition(uint256 partyId) external view returns (uint256 totalPower);
}

interface IPlayerProfile {
    // Only cross-contract functions
    function addExperience(address _player, uint256 amount) external;
    function getLevel(address _player) external view returns (uint256);
}

interface IVIPStaking {
    // Only cross-contract functions
    function getVipLevel(address _user) external view returns (uint8);
}

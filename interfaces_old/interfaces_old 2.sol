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
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
    function getLatestPrice() external view returns (uint256);
    function getSoulShardPriceInUSD() external view returns (uint256 price);
    function getRequiredSoulShardAmount(uint256 usdAmount) external view returns (uint256 soulAmount);
    function getPriceAdaptive() external view returns (uint256 price, uint32 usedPeriod);
    
    function pool() external view returns (address);
    function poolAddress() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function soulShardToken() external view returns (address);
    function soulToken() external view returns (address);
    function usdToken() external view returns (address);
    
    function twapPeriod() external view returns (uint32);
    function setTwapPeriod(uint32 _newTwapPeriod) external;
    function adaptivePeriods(uint256) external view returns (uint32);
    function getAdaptivePeriods() external view returns (uint32[] memory);
    function setAdaptivePeriods(uint32[] memory _periods) external;
    
    function testAllPeriods() external view returns (bool[] memory available, uint256[] memory prices);
    
    function owner() external view returns (address);
    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;
}

interface IPlayerVault {
    function spendForGame(address _player, uint256 _amount) external;
    function deposit(address _player, uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    
    function playerInfo(address) external view returns (uint256 withdrawableBalance, uint256 lastWithdrawTimestamp, uint256 lastFreeWithdrawTimestamp);
    function getInitializedPlayerInfo(address _user) external view returns (uint256 withdrawableBalance, uint256 lastWithdrawTimestamp, uint256 lastFreeWithdrawTimestamp, bool isReady, address tokenAddress, address coreAddress);
    
    function getTotalCommissionPaid(address _user) external view returns (uint256);
    function getCommissionBalance(address _user) external view returns (uint256);
    function withdrawCommission() external;
    function setReferrer(address _referrer) external;
    function referrers(address) external view returns (address);
    function commissionRate() external view returns (uint256);
    function setCommissionRate(uint256 _newRate) external;
    function totalCommissionPaid(address) external view returns (uint256);
    function virtualCommissionBalance(address) external view returns (uint256);
    
    function getTaxRateForAmount(address _user, uint256 _amount) external view returns (uint256);
    function getTaxBalance() external view returns (uint256);
    function withdrawTax() external;
    function virtualTaxBalance() external view returns (uint256);
    function setTaxParameters(uint256 _standardRate, uint256 _largeRate, uint256 _decreaseRate, uint256 _period) external;
    function standardInitialRate() external view returns (uint256);
    function largeWithdrawInitialRate() external view returns (uint256);
    function decreaseRatePerPeriod() external view returns (uint256);
    function periodDuration() external view returns (uint256);
    function smallWithdrawThresholdUSD() external view returns (uint256);
    function largeWithdrawThresholdUSD() external view returns (uint256);
    function setWithdrawThresholds(uint256 _smallUSD, uint256 _largeUSD) external;
    
    function PERCENT_DIVISOR() external view returns (uint256);
    function USD_DECIMALS() external view returns (uint256);
    
    function owner() external view returns (address);
    function dungeonCore() external view returns (address);
    function soulShardToken() external view returns (address);
    function setDungeonCore(address _newAddress) external;
    function setSoulShardToken(address _newAddress) external;
    function withdrawGameRevenue(uint256 amount) external;
    function emergencyWithdrawSoulShard(uint256 _amount) external;
    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;
    
    // Username system functions (V2)
    function registerUsername(string memory username) external payable;
    function setReferrerByUsername(string memory referrerInput) external;
    function resolveUsername(string memory username) external view returns (address);
    function getUserUsername(address user) external view returns (string memory);
    function isUsernameAvailable(string memory username) external view returns (bool);
    function usernameToAddress(string memory) external view returns (address);
    function addressToUsername(address) external view returns (string memory);
    function usernameExists(string memory) external view returns (bool);
    function usernameRegistrationFee() external view returns (uint256);
    function setUsernameRegistrationFee(uint256 newFee) external;
    function withdrawBNB() external;
}

interface IDungeonMaster {
    struct ExpeditionRequest {
        uint256 partyId;
        uint256 dungeonId;
        address player;
        bool fulfilled;
        uint256 payment;
        uint256 requestId;  // Added for VRF tracking
    }
    
    function isPartyLocked(uint256 partyId) external view returns (bool);
    function getPartyPower(uint256 _partyId) external view returns (uint256 capacity);
    
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable;
    function getExpeditionCost() external view returns (uint256 totalCost, uint256 explorationFeeAmount, uint256 vrfFeeAmount);
    function getUserRequest(address _user) external view returns (ExpeditionRequest memory);
    function canExplore(address user) external view returns (bool);
    
    function explorationFee() external view returns (uint256);
    function globalRewardMultiplier() external view returns (uint256);
    
    function dungeonCore() external view returns (address);
    
    function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external;
    function getDungeon(uint256 _dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized);
    function getPartyStatus(uint256 _partyId) external view returns (uint256 cooldownEndsAt);
    
    function setDungeonCore(address _newAddress) external;
    function setGlobalRewardMultiplier(uint256 _newMultiplier) external;
    function setExplorationFee(uint256 _newFee) external;
    
    function pause() external;
    function unpause() external;
    function paused() external view returns (bool);
    
    function owner() external view returns (address);
    function renounceOwnership() external;
    function transferOwnership(address newOwner) external;
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
    
    // Struct getter functions (auto-generated by Solidity for public mappings)
    function dungeons(uint256 id) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized);
    function partyStatuses(uint256 id) external view returns (uint256 cooldownEndsAt);
    
    // Convenience getter functions
    function getDungeon(uint256 dungeonId) external view returns (Dungeon memory);
    function getPartyStatus(uint256 partyId) external view returns (PartyStatus memory);
    
    // Setter functions
    function setDungeon(uint256 id, Dungeon calldata data) external;
    function setPartyStatus(uint256 partyId, PartyStatus calldata data) external;
}

interface IAltarOfAscension {
    struct UpgradeRequest {
        address tokenContract;
        uint8 baseRarity;
        uint256[] burnedTokenIds;
        bool fulfilled;
        uint256 payment;
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
    }
    
    function ownerOf(uint256 tokenId) external view returns (address);
    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power);
    function mintFromAltar(address to, uint8 rarity, uint256 power) external returns (uint256);
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function totalSupply() external view returns (uint256);  // Added for BSCscan display
    
    function setVRFManager(address _vrfManager) external;
    // Removed: revealMint() and revealMintFor() - new version uses automatic callback
    
    // === Query Functions ===
    function getUserRequest(address user) external view returns (MintRequest memory);
    // Removed: getUserPendingTokens() - use MintRequest.pendingTokenIds instead
}

interface IRelic {
    struct MintRequest {
        uint256 quantity;
        uint256 payment;
        bool fulfilled;
        uint8 maxRarity;
        bool fromVault;
        uint256[] pendingTokenIds;  // Added: required for VRF callback mode
    }
    
    function ownerOf(uint256 tokenId) external view returns (address);
    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity);
    function mintFromAltar(address to, uint8 rarity, uint8 capacity) external returns (uint256);
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function totalSupply() external view returns (uint256);  // Added for BSCscan display
    
    function setVRFManager(address _vrfManager) external;
    // Removed: revealMint() and revealMintFor() - new version uses automatic callback
    
    // === Query Functions ===
    function getUserRequest(address user) external view returns (MintRequest memory);
    // Removed: getUserPendingTokens() - use MintRequest.pendingTokenIds instead
}

interface IParty {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    
    function getPartyComposition(uint256 partyId) external view returns (uint256 totalPower);
    function getFullPartyComposition(uint256 _partyId) external view returns (uint256[] memory heroIds, uint256[] memory relicIds, uint256 totalPower, uint8 partyRarity);
    function partyCompositions(uint256 partyId) external view returns (uint256[] memory heroIds, uint256[] memory relicIds, uint256 totalPower, uint8 partyRarity);
    
    function getPartyPowerQuick(uint256 partyId) external view returns (uint256);
    function getPartyCapacityQuick(uint256 partyId) external view returns (uint256);
    function totalSupply() external view returns (uint256);  // Added for BSCscan display
    
    function baseURI() external view returns (string memory);
    function contractURI() external view returns (string memory);
    
    function dungeonCoreContract() external view returns (address);
}


interface IPlayerProfile {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function totalSupply() external view returns (uint256);  // Added for BSCscan display
    
    function mintProfile(address _player) external returns (uint256);
    function addExperience(address _player, uint256 amount) external;
    function getLevel(address _player) external view returns (uint256);
    function getExperience(address _player) external view returns (uint256);
    
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function baseURI() external view returns (string memory);
    function contractURI() external view returns (string memory);
    
    function dungeonCore() external view returns (address);
    function owner() external view returns (address);
}

interface IVIPStaking {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function totalSupply() external view returns (uint256);  // Added for BSCscan display
    
    function getVipLevel(address _user) external view returns (uint8);
    function getVipTaxReduction(address _user) external view returns (uint256);
    function claimUnstaked() external;
    
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function baseURI() external view returns (string memory);
    function contractURI() external view returns (string memory);
    
    function dungeonCore() external view returns (address);
    function owner() external view returns (address);
}

// contracts/interfaces.sol (統一後的最終版本)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// =================================================================
// Section: VRF 相關介面（統一兼容版本）
// =================================================================

interface IVRFCallback {
    function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external;
}

/**
 * @title IVRFManager - 統一兼容版本
 * @notice 向後兼容的 VRF Manager 介面
 * @dev 整合了所有版本的優點：
 * 1. 保留 payable 修飾符以支持舊合約調用
 * 2. 訂閱模式不使用傳入的 ETH，但接受並退還
 * 3. 完全兼容現有的 DungeonMaster 和 AltarOfAscension 調用
 * 4. 統一所有 VRF 相關功能
 */
interface IVRFManager {
    // ============================================
    // 枚舉和結構
    // ============================================
    
    enum RequestType { HERO_MINT, RELIC_MINT, ALTAR_UPGRADE, DUNGEON_EXPLORE }
    
    struct RandomRequest {
        address requester;
        RequestType requestType;
        bytes data;
        bool fulfilled;
        uint256[] randomWords;
    }
    
    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
        address requester;
        uint256 timestamp;
    }
    
    // ============================================
    // 核心請求函數（向後兼容，保留 payable）
    // ============================================
    
    /**
     * @notice 請求隨機數（基礎版本）
     * @dev 保留 payable 但在訂閱模式下會退還 ETH
     */
    function requestRandomWords(uint32 _numWords) external payable returns (uint256);
    
    /**
     * @notice 為用戶請求隨機數（主要接口）
     * @dev 保留 payable 以支持 DungeonMaster 等舊合約的 {value: vrfFee} 調用
     */
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable returns (uint256);
    
    /**
     * @notice 請求隨機數用於其他用途
     * @dev 保留 payable 以支持 AltarOfAscension 等舊合約
     */
    function requestRandomness(
        uint8 requestType,
        uint32 numWords,
        bytes calldata data
    ) external payable returns (uint256);
    
    // ============================================
    // 舊版本兼容接口（保持簽名一致）
    // ============================================
    
    /**
     * @notice 舊版本的 requestRandomness 接口
     */
    function requestRandomness(
        RequestType requestType,
        uint32 numWords,
        bytes calldata data
    ) external payable returns (uint256);
    
    // ============================================
    // 查詢函數
    // ============================================
    
    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWords);
    
    function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] memory randomWords);
    
    /**
     * @notice 獲取 VRF 請求價格（訂閱模式返回 0）
     * @dev 改為 pure 因為訂閱模式總是返回 0
     */
    function getVrfRequestPrice() external pure returns (uint256);
    
    /**
     * @notice 獲取 VRF 請求價格（別名）
     */
    function vrfRequestPrice() external pure returns (uint256);
    
    /**
     * @notice 獲取總費用（訂閱模式返回 0）
     */
    function getTotalFee() external pure returns (uint256);
    
    // ============================================
    // 舊版本查詢接口（保持兼容性）
    // ============================================
    
    function requests(uint256) external view returns (RandomRequest memory);
    function requestIdToUser(uint256 requestId) external view returns (address);
    function requestIdToContract(uint256 requestId) external view returns (address);
    
    // ============================================
    // 管理函數
    // ============================================
    
    function setSubscriptionId(uint256 _subscriptionId) external;
    function setCallbackGasLimit(uint32 _callbackGasLimit) external;
    function setKeyHash(bytes32 _keyHash) external;
    function setVRFParams(bytes32 _keyHash, uint32 _callbackGasLimit, uint16 _requestConfirmations, uint32 _numWords) external;
    
    // 授權管理（兩種簽名都支持）
    function setAuthorizedContract(address addr, bool auth) external;
    function authorizeContract(address contract_) external;
    function authorized(address contract_) external view returns (bool);
    
    // ============================================
    // 向後兼容性監控函數
    // ============================================
    
    /**
     * @notice 查詢總共收到但未使用的 ETH 量
     */
    function totalUnusedEthReceived() external view returns (uint256);
    
    /**
     * @notice 查詢特定合約發送但未使用的 ETH 量
     */
    function unusedEthByContract(address contractAddr) external view returns (uint256);
    
    /**
     * @notice 手動退還卡住的 ETH（僅管理員）
     */
    function manualRefundEth(address recipient, uint256 amount) external;
    
    // ============================================
    // 緊急函數
    // ============================================
    
    /**
     * @notice 緊急提取誤轉的 ERC20 代幣
     */
    function emergencyWithdrawToken(address token, uint256 amount) external;
    
    /**
     * @notice 緊急提取 ETH
     */
    function emergencyWithdraw() external;
    
    // ============================================
    // 事件定義
    // ============================================
    
    event UnusedEthReceived(address indexed sender, uint256 amount, string functionName);
    event EthRefunded(address indexed recipient, uint256 amount);
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event CallbackSuccess(uint256 indexed requestId, address indexed callbackContract);
    event CallbackFailed(uint256 indexed requestId, address indexed callbackContract, bytes reason);
    event AuthorizationChanged(address indexed contractAddress, bool authorized);
    event VRFParamsUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations);
    event CallbackGasLimitUpdated(uint32 oldLimit, uint32 newLimit);
    event RequestTimedOut(uint256 indexed requestId, address indexed requester);
    event EmergencyWithdraw(address indexed token, uint256 amount);
}

// =================================================================
// Section: 外部介面 (例如 Uniswap)
// =================================================================
interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
}


// =================================================================
// Section: 系統核心介面
// =================================================================

interface IDungeonCore {
    // --- Getter Functions ---
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

    // --- Core Logic Functions ---
    function getSoulShardAmountForUSD(uint256 _amountUSD) external view returns (uint256);
    function getUSDValueForSoulShard(uint256 _soulShardAmount) external view returns (uint256);
    function isPartyLocked(uint256 partyId) external view returns (bool);
    function spendFromVault(address player, uint256 amount) external;

    // --- Management Functions ---
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
}

interface IOracle {
    // --- Core Price Functions ---
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
    function getLatestPrice() external view returns (uint256);
    function getSoulShardPriceInUSD() external view returns (uint256 price);
    function getRequiredSoulShardAmount(uint256 usdAmount) external view returns (uint256 soulAmount);
    function getPriceAdaptive() external view returns (uint256 price, uint32 usedPeriod);
    
    // --- Pool Information ---
    function pool() external view returns (address);
    function poolAddress() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function soulShardToken() external view returns (address);
    function usdToken() external view returns (address);
    function decimalsAdjustment() external view returns (uint256);
    
    // --- Management Functions ---
    function setPoolAddress(address _newPoolAddress) external;
    function setTokenAddresses(address _soulShardToken, address _usdToken) external;
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;
}

// =================================================================
// Section: 遊戲邏輯介面
// =================================================================

interface IPlayerVault {
    // --- Core Functions ---
    function deposit(address _user, uint256 _amount) external;
    function spendForGame(address _user, uint256 _amount) external;
    function balanceOf(address _user) external view returns (uint256);
    
    // --- View Functions ---
    function getUserBalance(address _user) external view returns (uint256);
    function isApprovedSpender(address _spender) external view returns (bool);
    
    // --- Admin Functions ---
    function approveSpender(address _spender) external;
    function removeSpender(address _spender) external;
    function emergencyWithdraw(address _user, uint256 _amount) external;
    function pause() external;
    function unpause() external;
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;
}

interface IPlayerProfile {
    // --- Core Functions ---
    function getUserProfile(address _user) external view returns (
        uint256 experience,
        uint256 level,
        uint256 referralRewards,
        address referrer,
        uint256 totalReferrals
    );
    
    function addExperience(address _user, uint256 _exp) external;
    function setReferrer(address _user, address _referrer) external;
    function calculateLevel(uint256 _experience) external pure returns (uint256);
    
    // --- Referral Functions ---
    function getReferralInfo(address _user) external view returns (
        address referrer,
        uint256 totalReferrals,
        uint256 referralRewards
    );
    
    function addReferralReward(address _user, uint256 _reward) external;
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setApprovedCaller(address _caller, bool _approved) external;
}

// =================================================================
// Section: NFT 合約介面
// =================================================================

interface IHero {
    // --- Core NFT Functions ---
    function mint(address _to, uint8 _rarity, uint256 _power) external returns (uint256);
    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external returns (uint256);
    function burnFromAltar(uint256 _tokenId) external;
    function burn(uint256 _tokenId) external;
    
    // --- Hero Data ---
    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power);
    function heroData(uint256 tokenId) external view returns (uint8 rarity, uint256 power, bool isRevealed);
    
    // --- Minting Functions ---
    function mintFromWallet(uint256 _quantity) external payable;
    function mintFromVault(uint256 _quantity) external payable;
    function revealMint() external;
    function revealMintFor(address user) external;
    
    // --- Query Functions ---
    function getRequiredSoulShardAmount(uint256 _quantity) external view returns (uint256);
    function getUserRequest(address _user) external view returns (
        uint256 quantity,
        uint256 payment,
        bool fulfilled,
        uint8 maxRarity,
        bool fromVault
    );
    
    // --- Standard ERC721 ---
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setBaseURI(string memory _newBaseURI) external;
    function pause() external;
    function unpause() external;
}

interface IRelic {
    // --- Core NFT Functions ---
    function mint(address _to, uint8 _rarity, uint256 _power) external returns (uint256);
    function mintFromAltar(address _to, uint8 _rarity, uint256 _power) external returns (uint256);
    function burnFromAltar(uint256 _tokenId) external;
    function burn(uint256 _tokenId) external;
    
    // --- Relic Data ---
    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power);
    function relicData(uint256 tokenId) external view returns (uint8 rarity, uint256 power, bool isRevealed);
    
    // --- Minting Functions ---
    function mintFromWallet(uint256 _quantity) external payable;
    function mintFromVault(uint256 _quantity) external payable;
    function revealMint() external;
    function revealMintFor(address user) external;
    
    // --- Query Functions ---
    function getRequiredSoulShardAmount(uint256 _quantity) external view returns (uint256);
    function getUserRequest(address _user) external view returns (
        uint256 quantity,
        uint256 payment,
        bool fulfilled,
        uint8 maxRarity,
        bool fromVault
    );
    
    // --- Standard ERC721 ---
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setBaseURI(string memory _newBaseURI) external;
    function pause() external;
    function unpause() external;
}

interface IParty {
    // --- Core Party Functions ---
    function createParty(
        address owner,
        uint256[] memory heroIds,
        uint256[] memory relicIds
    ) external returns (uint256 partyId);
    
    function addHeroToParty(uint256 partyId, uint256 heroId) external;
    function removeHeroFromParty(uint256 partyId, uint256 heroId) external;
    function addRelicToParty(uint256 partyId, uint256 relicId) external;
    function removeRelicFromParty(uint256 partyId, uint256 relicId) external;
    
    // --- Query Functions ---
    function getPartyComposition(uint256 partyId) external view returns (uint256 totalPower, uint256 memberCount);
    function getPartyHeroes(uint256 partyId) external view returns (uint256[] memory);
    function getPartyRelics(uint256 partyId) external view returns (uint256[] memory);
    function isHeroInParty(uint256 heroId) external view returns (bool);
    function isRelicInParty(uint256 relicId) external view returns (bool);
    
    // --- Standard ERC721 ---
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function pause() external;
    function unpause() external;
}

// =================================================================
// Section: 遊戲機制介面
// =================================================================

interface IDungeonMaster {
    // --- Core Expedition Functions ---
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable;
    function revealExpedition() external;
    function revealExpeditionFor(address user) external;
    
    // --- Query Functions ---
    function getPartyStatus(uint256 _partyId) external view returns (uint256 cooldownEndsAt, uint256 unclaimedRewards);
    function getDungeon(uint256 _dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized);
    function getExpeditionCost() external view returns (uint256 totalCost, uint256 explorationFeeAmount, uint256 vrfFeeAmount);
    function getUserRequest(address _user) external view returns (
        uint256 partyId,
        uint256 dungeonId,
        address player,
        bool fulfilled,
        uint256 payment
    );
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setDungeon(uint256 _dungeonId, uint256 _requiredPower, uint256 _rewardAmountUSD, uint8 _baseSuccessRate) external;
    function pause() external;
    function unpause() external;
}

interface IAltarOfAscension {
    // --- Core Upgrade Functions ---
    function upgradeNFTs(address tokenContract, uint256[] memory tokenIds) external payable;
    function revealUpgrade() external;
    function revealUpgradeFor(address user) external;
    
    // --- Query Functions ---
    function getUpgradeCost(uint8 currentRarity) external view returns (uint256 soulShardCost, uint256 platformFee);
    function getUpgradeChances(uint8 currentRarity) external view returns (uint8 successRate, uint8 greatSuccessRate);
    function getUserUpgradeRequest(address user) external view returns (
        address tokenContract,
        uint256[] memory tokenIds,
        uint256 baseRarity,
        bool fulfilled,
        uint256 payment
    );
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setUpgradeParameters(uint8 rarity, uint256 soulShardCost, uint256 platformFee, uint8 successRate, uint8 greatSuccessRate) external;
    function pause() external;
    function unpause() external;
}

interface IVIPStaking {
    // --- Core Staking Functions ---
    function stakeVIP(uint256 tokenId) external;
    function unstakeVIP(uint256 tokenId) external;
    function claimRewards() external;
    
    // --- Query Functions ---
    function getVipLevel(address user) external view returns (uint8);
    function getStakedTokens(address user) external view returns (uint256[] memory);
    function getPendingRewards(address user) external view returns (uint256);
    function getVIPMultiplier(address user) external view returns (uint256);
    
    // --- VIP NFT Functions ---
    function mint(address to) external returns (uint256);
    function burn(uint256 tokenId) external;
    
    // --- Standard ERC721 ---
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function setRewardRate(uint256 _rewardRate) external;
    function pause() external;
    function unpause() external;
}

// =================================================================
// Section: 儲存介面
// =================================================================

interface IDungeonStorage {
    // --- Structs ---
    struct Dungeon {
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
        bool isInitialized;
    }
    
    struct PartyStatus {
        uint256 provisionsRemaining;
        uint256 cooldownEndsAt;
        uint256 unclaimedRewards;
        uint8 fatigueLevel;
    }
    
    // --- Core Functions ---
    function setDungeon(uint256 dungeonId, Dungeon memory dungeon) external;
    function setPartyStatus(uint256 partyId, PartyStatus memory status) external;
    
    // --- Query Functions ---
    function dungeons(uint256 dungeonId) external view returns (uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate, bool isInitialized);
    function partyStatuses(uint256 partyId) external view returns (uint256 provisionsRemaining, uint256 cooldownEndsAt, uint256 unclaimedRewards, uint8 fatigueLevel);
    
    // --- Management ---
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
}
// Sources flattened with hardhat v2.25.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File contracts/interfaces/interfaces.sol

// contracts/interfaces.sol (最終修正版)
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

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
    // 注意：以下是公開變數，不是函數
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
}

interface IOracle {
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256);
}

interface IPlayerVault {
    function spendForGame(address _player, uint256 _amount) external;
    function deposit(address _player, uint256 _amount) external;
    function getTotalCommissionPaid(address _user) external view returns (uint256);
}

interface IDungeonMaster {
    function isPartyLocked(uint256 partyId) external view returns (bool);
}

interface IDungeonStorage {
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

    struct ExpeditionRequest {
        address requester;
        uint256 partyId;
        uint256 dungeonId;
    }
    
    function NUM_DUNGEONS() external view returns (uint256);
    function getDungeon(uint256 dungeonId) external view returns (Dungeon memory);
    function getPartyStatus(uint256 partyId) external view returns (PartyStatus memory);
    function setDungeon(uint256 id, Dungeon calldata data) external;
    function setPartyStatus(uint256 partyId, PartyStatus calldata data) external;
    function setExpeditionRequest(uint256 requestId, ExpeditionRequest calldata data) external;
    function getExpeditionRequest(uint256 requestId) external view returns (ExpeditionRequest memory);
    function deleteExpeditionRequest(uint256 requestId) external;
}

interface IAltarOfAscension {
    // 此處為空，因為祭壇是被動呼叫的，其他合約暫時不需要呼叫它的函式
}

// =================================================================
// Section: NFT 資產介面
// =================================================================

interface IHero {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getHeroProperties(uint256 tokenId) external view returns (uint8 rarity, uint256 power);
    function mintFromAltar(address to, uint8 rarity, uint256 power) external;
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
}

interface IRelic {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getRelicProperties(uint256 tokenId) external view returns (uint8 rarity, uint8 capacity);
    function mintFromAltar(address to, uint8 rarity, uint8 capacity) external;
    function burnFromAltar(uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
}

interface IParty {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getPartyComposition(uint256 partyId) external view returns (uint256 totalPower, uint256 totalCapacity);
    function partyCompositions(uint256 partyId) external view returns (uint256[] memory heroIds, uint256[] memory relicIds, uint256 totalPower, uint256 totalCapacity, uint8 partyRarity);
    function setApprovalForAll(address operator, bool approved) external;
    
    // V3 新增的快速查詢方法
    function getPartyPowerQuick(uint256 partyId) external view returns (uint256);
    function getPartyCapacityQuick(uint256 partyId) external view returns (uint256);
}

// =================================================================
// Section: 玩家檔案與質押介面
// =================================================================

interface IPlayerProfile {
    function addExperience(address player, uint256 amount) external;
    function getLevel(address _player) external view returns (uint256);
}

interface IVIPStaking {
    function getVipLevel(address user) external view returns (uint8);
    function getVipTaxReduction(address user) external view returns (uint256);
}


// File contracts/core/DungeonCore.sol

// contracts/DungeonCore.sol (最終修正版)
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;



/**
 * @title DungeonCore (架構核心版)
 * @notice 系統的中心樞紐，負責註冊和管理所有衛星合約，並作為它們之間溝通的橋樑。
 * @dev 此版本修正了對 Oracle 和 PlayerVault 合約的呼叫方式，確保參數匹配。
 */
contract DungeonCore is Ownable {

    // --- 狀態變數 ---
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

    uint8 public usdDecimals;

    // --- 事件 ---
    event OracleSet(address indexed newAddress);
    event PlayerVaultSet(address indexed newAddress);
    event DungeonMasterSet(address indexed newAddress);
    event AltarOfAscensionSet(address indexed newAddress);
    event HeroContractSet(address indexed newAddress);
    event RelicContractSet(address indexed newAddress);
    event PartyContractSet(address indexed newAddress);
    event PlayerProfileSet(address indexed newAddress);
    event VipStakingSet(address indexed newAddress);

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
        uint256 scaledAmount = (_amountUSD * (10**usdDecimals)) / 1e18;
        return IOracle(oracleAddress).getAmountOut(usdTokenAddress, scaledAmount);
    }

    /**
     * @notice 根據 SoulShard 數量計算其 USD 價值 (VIP功能需要)
     * @param _soulShardAmount SoulShard 的數量 (18位小數)
     * @return USD 價值 (18位小數)
     */
    function getUSDValueForSoulShard(uint256 _soulShardAmount) external view returns (uint256) {
        require(oracleAddress != address(0), "Oracle not set");
        return IOracle(oracleAddress).getAmountOut(soulShardTokenAddress, _soulShardAmount);
    }

    function spendFromVault(address player, uint256 amount) external {
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

    // --- Owner 管理函式 (保持不變) ---
    
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
}

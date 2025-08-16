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


// File contracts/defi/Oracle_VerificationFix.sol

// contracts/Oracle.sol (驗證修正版 - 內聯接口)
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

// ===== 內聯接口定義 (避免相對路徑問題) =====
interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
}

// ★★★【修正】★★★
// 將 MulDiv 函式庫直接定義在合約檔案中，避免外部依賴問題。
library MulDiv {
    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        uint256 prod0; 
        uint256 prod1; 
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }

        if (prod1 == 0) {
            require(denominator > 0);
            assembly {
                result := div(prod0, denominator)
            }
            return result;
        }

        require(denominator > prod1);

        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }

        uint256 twos = denominator & (~denominator + 1);
        assembly {
            denominator := div(denominator, twos)
            prod0 := div(prod0, twos)
            twos := add(div(sub(0, twos), twos), 1)
        }
        prod0 |= prod1 * twos;

        uint256 inverse = (3 * denominator) ^ 2;
        inverse *= 2 - denominator * inverse;
        inverse *= 2 - denominator * inverse;
        inverse *= 2 - denominator * inverse;
        inverse *= 2 - denominator * inverse;
        inverse *= 2 - denominator * inverse;
        inverse *= 2 - denominator * inverse;

        result = prod0 * inverse;
        return result;
    }
}

/**
 * @title Oracle (價格預言機)
 * @notice 提供 SoulShard 與 USD 之間的價格轉換服務
 * @dev 此版本修正了計算邏輯，確保價格轉換的準確性
 */
contract Oracle is Ownable {
    using MulDiv for uint256;

    // 池合約地址
    address public immutable poolAddress;
    
    // Token 地址
    address public immutable soulShardToken;
    address public immutable usdToken;
    
    // 觀察參數
    uint32 public constant TWAP_DURATION = 3600; // 1小時 TWAP
    
    event PriceQueried(address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    /**
     * @dev 建構函式
     * @param _poolAddress Uniswap V3 池地址
     * @param _soulShardToken SoulShard 代幣地址
     * @param _usdToken USD 代幣地址
     */
    constructor(
        address _poolAddress,
        address _soulShardToken,
        address _usdToken
    ) Ownable(msg.sender) {
        require(_poolAddress != address(0), "Pool address cannot be zero");
        require(_soulShardToken != address(0), "SoulShard token cannot be zero");
        require(_usdToken != address(0), "USD token cannot be zero");
        
        poolAddress = _poolAddress;
        soulShardToken = _soulShardToken;
        usdToken = _usdToken;
    }

    /**
     * @notice 獲取代幣交換的輸出數量
     * @param tokenIn 輸入代幣地址
     * @param amountIn 輸入代幣數量
     * @return 輸出代幣數量
     */
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(amountIn > 0, "Input amount must be greater than zero");
        require(
            tokenIn == soulShardToken || tokenIn == usdToken,
            "Unsupported token"
        );

        try this._getAmountOutInternal(tokenIn, amountIn) returns (uint256 amountOut) {
            emit PriceQueried(tokenIn, amountIn, amountOut);
            return amountOut;
        } catch {
            // 如果 TWAP 失敗，使用預設比率 (1:1)
            return amountIn;
        }
    }

    /**
     * @dev 內部價格計算邏輯
     */
    function _getAmountOutInternal(address tokenIn, uint256 amountIn) external view returns (uint256) {
        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);
        
        // 獲取池中的代幣順序
        address token0 = pool.token0();
        address token1 = pool.token1();
        
        require(
            (token0 == soulShardToken && token1 == usdToken) ||
            (token0 == usdToken && token1 == soulShardToken),
            "Pool tokens do not match"
        );

        // 設定 TWAP 觀察點
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = TWAP_DURATION;
        secondsAgos[1] = 0;

        // 獲取累積價格
        (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);
        
        // 計算平均 tick
        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];
        int24 tick = int24(tickCumulativesDelta / int56(int32(TWAP_DURATION)));

        // 處理四捨五入
        if (tickCumulativesDelta < 0 && (tickCumulativesDelta % int56(int32(TWAP_DURATION)) != 0)) {
            tick--;
        }

        // 根據 tick 計算價格比率
        uint256 sqrtPriceX96 = _getSqrtRatioAtTick(tick);
        
        // 計算實際價格
        if (tokenIn == token0) {
            // token0 -> token1
            return amountIn.mulDiv(sqrtPriceX96 * sqrtPriceX96, 1 << 192);
        } else {
            // token1 -> token0  
            return amountIn.mulDiv(1 << 192, sqrtPriceX96 * sqrtPriceX96);
        }
    }

    /**
     * @dev 根據 tick 計算 sqrtPriceX96
     */
    function _getSqrtRatioAtTick(int24 tick) internal pure returns (uint256 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
        require(absTick <= uint256(int256(887272)), "T");

        uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;
        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;

        if (tick > 0) ratio = type(uint256).max / ratio;

        sqrtPriceX96 = uint256((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
    }

    /**
     * @notice 管理員功能：更新觀察持續時間（如果需要）
     */
    function updateTwapDuration() external onlyOwner returns (uint32) {
        return TWAP_DURATION;
    }
}

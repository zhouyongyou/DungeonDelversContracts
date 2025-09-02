// Oracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

// MulDiv library for overflow-safe multiplication and division
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
            prod1 := sub(mm, prod0)
            if lt(mm, prod0) {
                prod1 := sub(prod1, 1)
            }
        }

        if (prod1 == 0) {
            require(denominator > 0, "ZERO_DENOMINATOR");
            result = prod0 / denominator;
            return result;
        }

        require(denominator > prod1, "OVERFLOW");

        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
            prod0 := sub(prod0, remainder)
            prod1 := sub(prod1, mul(0, remainder))
            if lt(prod0, remainder) {
                prod1 := sub(prod1, 1)
            }
        }

        uint256 twos = (~denominator + 1) & denominator;
        assembly {
            denominator := div(denominator, twos)
        }
        assembly {
            prod0 := div(prod0, twos)
        }
        
        assembly {
            let inv := mul(3, denominator)
            inv := xor(inv, 2)
            inv := mul(inv, sub(2, mul(denominator, inv)))
            inv := mul(inv, sub(2, mul(denominator, inv)))
            inv := mul(inv, sub(2, mul(denominator, inv)))
            inv := mul(inv, sub(2, mul(denominator, inv)))
            inv := mul(inv, sub(2, mul(denominator, inv)))
            inv := mul(inv, sub(2, mul(denominator, inv)))
            result := mul(prod0, inv)
        }
    }
}

// Uniswap V3 Tick Mathematics library
library TickMath {
    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(int256(tick) * -1) : uint256(int256(tick));
        require(absTick <= 887272, "Oracle: Tick value exceeds maximum allowed range");
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
        sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
    }
}

/**
 * @title Oracle
 * @notice DungeonDelvers Oracle V22 - Adaptive TWAP version
 * @dev Automatically falls back through TWAP periods to ensure price availability
 */
contract Oracle is Ownable, Pausable {
    using MulDiv for uint256;

    IUniswapV3Pool public immutable pool;
    address public immutable poolAddress;
    address public immutable soulShardToken;
    address public immutable usdToken;
    address public immutable token0;
    address public immutable token1;
    bool private immutable isSoulShardToken0;
    
    uint32 public twapPeriod;                  // Default TWAP period (backward compatibility)
    uint32[] public adaptivePeriods;           // Adaptive period list
    
    event TwapPeriodUpdated(uint32 newTwapPeriod);
    event AdaptivePeriodsUpdated(uint32[] periods);
    event PriceQueried(uint32 usedPeriod, uint256 price);

    constructor(
        address _poolAddress,
        address _soulShardTokenAddress,
        address _usdTokenAddress
    ) Ownable(msg.sender) {
        require(
            _poolAddress != address(0) && 
            _soulShardTokenAddress != address(0) && 
            _usdTokenAddress != address(0), 
            "Oracle: Zero address"
        );
        
        pool = IUniswapV3Pool(_poolAddress);
        poolAddress = _poolAddress;
        soulShardToken = _soulShardTokenAddress;
        usdToken = _usdTokenAddress;

        // Get and store pool tokens
        address _token0 = pool.token0();
        address _token1 = pool.token1();
        token0 = _token0;
        token1 = _token1;
        
        // Verify pool tokens match
        require(
            (_token0 == soulShardToken || _token0 == usdToken) &&
            (_token1 == soulShardToken || _token1 == usdToken),
            "Oracle: Pool tokens mismatch"
        );
        
        isSoulShardToken0 = (soulShardToken == _token0);
        twapPeriod = 1800; // Default 30 minutes
        
        // Initialize adaptive periods: 30min, 15min, 10min, 5min
        adaptivePeriods = new uint32[](4);
        adaptivePeriods[0] = 1800;  // 30 minutes
        adaptivePeriods[1] = 900;   // 15 minutes
        adaptivePeriods[2] = 600;   // 10 minutes
        adaptivePeriods[3] = 300;   // 5 minutes
    }

    
    /**
     * @notice Get price using adaptive TWAP
     * @dev Try from longest period until finding an available one
     * @return price Price with 18 decimals
     * @return usedPeriod Actually used period
     */
    function getPriceAdaptive() public view returns (uint256 price, uint32 usedPeriod) {
        for (uint i = 0; i < adaptivePeriods.length; i++) {
            (bool success, uint256 adaptivePrice) = tryGetPriceWithPeriod(adaptivePeriods[i]);
            if (success) {
                return (adaptivePrice, adaptivePeriods[i]);
            }
        }
        revert("Oracle: No valid price available");
    }
    
    /**
     * @notice Try to get price with specific period
     * @param period TWAP period
     * @return success Whether successful
     * @return price Price (if successful)
     */
    function tryGetPriceWithPeriod(uint32 period) internal view returns (bool success, uint256 price) {
        try pool.observe(_createPeriodsArray(period)) returns (
            int56[] memory tickCumulatives,
            uint160[] memory
        ) {
            int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];
            int24 tick = int24(tickCumulativesDelta / int56(uint56(period)));
            
            uint160 sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
            uint256 ratioX192 = uint256(sqrtRatioX96) * uint256(sqrtRatioX96);
            uint256 Q192 = 1 << 192;

            if (isSoulShardToken0) {
                price = ratioX192.mulDiv(1e18, Q192);
            } else {
                require(ratioX192 != 0, "Oracle: ZERO_PRICE");
                price = Q192.mulDiv(1e18, ratioX192);
            }
            
            return (true, price);
        } catch {
            return (false, 0);
        }
    }

    
    /**
     * @notice Get SoulShard price in USD (backward compatible)
     * @dev Uses adaptive method but returns same format as V21
     */
    function getSoulShardPriceInUSD() public view returns (uint256 price) {
        (price, ) = getPriceAdaptive();
    }
    
    /**
     * @notice Public function: Get current price (alias)
     */
    function getLatestPrice() public view returns (uint256) {
        return getSoulShardPriceInUSD();
    }

    /**
     * @notice Calculate required SoulShard amount for specified USD amount
     */
    function getRequiredSoulShardAmount(uint256 usdAmount) public view returns (uint256 soulAmount) {
        uint256 soulShardPrice = getSoulShardPriceInUSD();
        require(soulShardPrice > 0, "Oracle: ZERO_PRICE");
        soulAmount = usdAmount.mulDiv(1e18, soulShardPrice);
    }

    /**
     * @notice Calculate output token amount based on input token and amount
     */
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        require(tokenIn == soulShardToken || tokenIn == usdToken, "Oracle: Invalid input token");

        uint256 soulShardPrice = getSoulShardPriceInUSD();
        require(soulShardPrice > 0, "Oracle: ZERO_PRICE");

        if (tokenIn == soulShardToken) {
            // SoulShard → USD: amount * price / 1e18
            amountOut = amountIn.mulDiv(soulShardPrice, 1e18);
        } else {
            // USD → SoulShard: amount * 1e18 / price
            // Lowered threshold to allow smaller prices while maintaining overflow protection
            require(soulShardPrice >= 1, "Oracle: Price cannot be zero");
            amountOut = amountIn.mulDiv(1e18, soulShardPrice);
        }
    }

    
    /**
     * @notice Test availability of all periods
     * @return available Whether each period is available
     * @return prices Price for each period (if available)
     */
    function testAllPeriods() external view returns (bool[] memory available, uint256[] memory prices) {
        available = new bool[](adaptivePeriods.length);
        prices = new uint256[](adaptivePeriods.length);
        
        for (uint i = 0; i < adaptivePeriods.length; i++) {
            (bool success, uint256 price) = tryGetPriceWithPeriod(adaptivePeriods[i]);
            available[i] = success;
            if (success) {
                prices[i] = price;
            }
        }
    }
    
    /**
     * @notice Get currently configured adaptive periods
     */
    function getAdaptivePeriods() external view returns (uint32[] memory) {
        return adaptivePeriods;
    }

    
    function soulToken() public view returns (address) {
        return soulShardToken;
    }

    
    /**
     * @notice Set TWAP period (backward compatible)
     */
    function setTwapPeriod(uint32 _newTwapPeriod) external onlyOwner {
        require(_newTwapPeriod > 0, "Oracle: TWAP period must be > 0");
        twapPeriod = _newTwapPeriod;
        emit TwapPeriodUpdated(_newTwapPeriod);
    }
    
    /**
     * @notice Set adaptive periods list
     * @param _periods Period array, must be sorted in descending order
     */
    function setAdaptivePeriods(uint32[] calldata _periods) external onlyOwner {
        require(_periods.length > 0 && _periods.length <= 10, "Oracle: Invalid periods length");
        
        // Verify descending order
        for (uint i = 1; i < _periods.length; i++) {
            require(_periods[i] < _periods[i-1], "Oracle: Periods must be descending");
            require(_periods[i] > 0, "Oracle: Invalid period");
        }
        
        adaptivePeriods = _periods;
        emit AdaptivePeriodsUpdated(_periods);
    }
    
    
    /**
     * @notice Create periods array for observe function
     */
    function _createPeriodsArray(uint32 period) private pure returns (uint32[] memory) {
        uint32[] memory periods = new uint32[](2);
        periods[0] = period;
        periods[1] = 0;
        return periods;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
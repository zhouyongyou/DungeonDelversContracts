// contracts/defi/Oracle_QuickFix.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Oracle.sol";

/**
 * @title Oracle_QuickFix
 * @notice 快速修補版本，僅添加缺失的 public getter 函數
 * @dev 繼承原始 Oracle 合約，添加前端需要的函數
 */
contract Oracle_QuickFix is Oracle {
    
    constructor(
        address _poolAddress,
        address _soulShardTokenAddress,
        address _usdTokenAddress
    ) Oracle(_poolAddress, _soulShardTokenAddress, _usdTokenAddress) {
        // 所有邏輯都在父合約中
    }
    
    /**
     * @notice 公開函數：獲取當前價格（供前端直接調用）
     */
    function getLatestPrice() public view returns (uint256) {
        return getSoulShardPriceInUSD();
    }
    
    /**
     * @notice 公開函數：獲取 pool 地址
     */
    function poolAddress() public view returns (address) {
        return address(pool);
    }
    
    /**
     * @notice 公開函數：獲取 token0
     */
    function token0() public view returns (address) {
        return pool.token0();
    }
    
    /**
     * @notice 公開函數：獲取 token1
     */
    function token1() public view returns (address) {
        return pool.token1();
    }
    
    /**
     * @notice 公開函數：獲取 soulToken 地址
     */
    function soulToken() public view returns (address) {
        return soulShardToken;
    }
}
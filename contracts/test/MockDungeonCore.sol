// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDungeonCore {
    address private _soulShardToken;
    address private _dungeonMaster;
    address private _vipStaking;
    address private _playerProfile;

    constructor(address soulShardToken) {
        _soulShardToken = soulShardToken;
    }

    function setSoulShardToken(address token) external {
        _soulShardToken = token;
    }

    function setDungeonMaster(address dungeonMaster) external {
        _dungeonMaster = dungeonMaster;
    }

    function setVipStaking(address vipStaking) external {
        _vipStaking = vipStaking;
    }

    function setPlayerProfile(address profile) external {
        _playerProfile = profile;
    }

    function soulShardTokenAddress() external view returns (address) {
        return _soulShardToken;
    }

    function dungeonMasterAddress() external view returns (address) {
        return _dungeonMaster;
    }

    function vipStakingAddress() external view returns (address) {
        return _vipStaking;
    }

    function playerProfileAddress() external view returns (address) {
        return _playerProfile;
    }

    function getUSDValueForSoulShard(uint256 amount) external pure returns (uint256) {
        return amount;
    }

    function getSoulShardAmountForUSD(uint256 amount) external pure returns (uint256) {
        return amount;
    }
}

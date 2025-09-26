// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPlayerProfile {
    uint256 private _level;

    function setLevel(uint256 level_) external {
        _level = level_;
    }

    function getLevel(address) external view returns (uint256) {
        return _level;
    }
}

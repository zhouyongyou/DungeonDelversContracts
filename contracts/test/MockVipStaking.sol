// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockVipStaking {
    uint8 private _level;

    function setLevel(uint8 level_) external {
        _level = level_;
    }

    function getVipLevel(address) external view returns (uint8) {
        return _level;
    }
}

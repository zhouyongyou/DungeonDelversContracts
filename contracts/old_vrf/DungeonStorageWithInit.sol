// DungeonStorageWithInit.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DungeonStorage.sol";

/**
 * @title DungeonStorageWithInit
 * @notice DungeonStorage with initialization in constructor
 * @dev Extends DungeonStorage to support immediate dungeon initialization on deployment
 */
contract DungeonStorageWithInit is DungeonStorage {
    
    struct DungeonInit {
        uint256 id;
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
    }
    
    /**
     * @notice Constructor that initializes dungeons on deployment
     * @param initialOwner The initial owner of the contract
     * @param _logicContract The DungeonMaster contract address
     * @param _dungeons Array of dungeon initialization data
     */
    constructor(
        address initialOwner,
        address _logicContract,
        DungeonInit[] memory _dungeons
    ) DungeonStorage(initialOwner) {
        // Set logic contract immediately
        if (_logicContract != address(0)) {
            logicContract = _logicContract;
            emit LogicContractSet(_logicContract);
        }
        
        // Initialize all dungeons
        for (uint256 i = 0; i < _dungeons.length; i++) {
            dungeons[_dungeons[i].id] = Dungeon({
                requiredPower: _dungeons[i].requiredPower,
                rewardAmountUSD: _dungeons[i].rewardAmountUSD,
                baseSuccessRate: _dungeons[i].baseSuccessRate,
                isInitialized: true
            });
        }
    }
    
    /**
     * @notice Get initialization status of all dungeons
     * @return initialized Array of booleans indicating if each dungeon is initialized
     */
    function getAllDungeonStatus() external view returns (bool[] memory initialized) {
        initialized = new bool[](NUM_DUNGEONS);
        for (uint256 i = 1; i <= NUM_DUNGEONS; i++) {
            initialized[i - 1] = dungeons[i].isInitialized;
        }
    }
    
    /**
     * @notice Batch update multiple dungeons at once
     * @param _dungeons Array of dungeon data to update
     */
    function batchSetDungeons(DungeonInit[] calldata _dungeons) external onlyLogicContract whenNotPaused {
        for (uint256 i = 0; i < _dungeons.length; i++) {
            dungeons[_dungeons[i].id] = Dungeon({
                requiredPower: _dungeons[i].requiredPower,
                rewardAmountUSD: _dungeons[i].rewardAmountUSD,
                baseSuccessRate: _dungeons[i].baseSuccessRate,
                isInitialized: true
            });
        }
    }
}

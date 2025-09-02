// DungeonStorage.sol (Fixed)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

/**
 * @title DungeonStorage
 * @notice Dedicated storage contract for DungeonMaster to solve main contract size limit issue.
 * @dev Only stores state variables and restricts data modification to authorized DungeonMaster contract only.
 */
contract DungeonStorage is Ownable, Pausable {
    IDungeonCore public dungeonCore;

    struct Dungeon {
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
        bool isInitialized;
    }
    mapping(uint256 => Dungeon) public dungeons;

    struct PartyStatus {
        uint256 cooldownEndsAt;  // Cooldown end time
    }
    mapping(uint256 => PartyStatus) public partyStatuses;

    modifier onlyLogicContract() {
        address authorizedLogic = _getDungeonMaster();
        require(msg.sender == authorizedLogic, "Storage: Caller is not authorized");
        _;
    }

    function _getDungeonMaster() internal view returns (address) {
        require(address(dungeonCore) != address(0), "Storage: DungeonCore not set");
        return dungeonCore.dungeonMasterAddress();
    }

    // Modified: Use msg.sender as owner instead of requiring parameter
    // Initialize all dungeons with default values on deployment
    constructor() Ownable(msg.sender) {
        _initializeDungeons();
    }
    
    function _initializeDungeons() private {
        // Dungeon 1: 新手礦洞
        dungeons[1] = Dungeon({
            requiredPower: 300,
            rewardAmountUSD: 6,  // $6
            baseSuccessRate: 89,
            isInitialized: true
        });
        
        // Dungeon 2: 哥布林洞穴
        dungeons[2] = Dungeon({
            requiredPower: 600,
            rewardAmountUSD: 12,  // $12
            baseSuccessRate: 84,
            isInitialized: true
        });
        
        // Dungeon 3: 食人魔山谷
        dungeons[3] = Dungeon({
            requiredPower: 900,
            rewardAmountUSD: 20,  // $20
            baseSuccessRate: 79,
            isInitialized: true
        });
        
        // Dungeon 4: 蜘蛛巢穴
        dungeons[4] = Dungeon({
            requiredPower: 1200,
            rewardAmountUSD: 33,  // $33
            baseSuccessRate: 74,
            isInitialized: true
        });
        
        // Dungeon 5: 石化蜥蜴沼澤
        dungeons[5] = Dungeon({
            requiredPower: 1500,
            rewardAmountUSD: 52,  // $52
            baseSuccessRate: 69,
            isInitialized: true
        });
        
        // Dungeon 6: 巫妖墓穴
        dungeons[6] = Dungeon({
            requiredPower: 1800,
            rewardAmountUSD: 78,  // $78
            baseSuccessRate: 64,
            isInitialized: true
        });
        
        // Dungeon 7: 奇美拉之巢
        dungeons[7] = Dungeon({
            requiredPower: 2100,
            rewardAmountUSD: 113,  // $113
            baseSuccessRate: 59,
            isInitialized: true
        });
        
        // Dungeon 8: 惡魔前哨站
        dungeons[8] = Dungeon({
            requiredPower: 2400,
            rewardAmountUSD: 156,  // $156
            baseSuccessRate: 54,
            isInitialized: true
        });
        
        // Dungeon 9: 巨龍之巔
        dungeons[9] = Dungeon({
            requiredPower: 2700,
            rewardAmountUSD: 209,  // $209
            baseSuccessRate: 49,
            isInitialized: true
        });
        
        // Dungeon 10: 混沌深淵
        dungeons[10] = Dungeon({
            requiredPower: 3000,
            rewardAmountUSD: 225,  // $225
            baseSuccessRate: 44,
            isInitialized: true
        });
        
        // Dungeon 11: 冥界之門
        dungeons[11] = Dungeon({
            requiredPower: 3300,
            rewardAmountUSD: 320,  // $320
            baseSuccessRate: 39,
            isInitialized: true
        });
        
        // Dungeon 12: 虛空裂隙
        dungeons[12] = Dungeon({
            requiredPower: 3600,
            rewardAmountUSD: 450,  // $450
            baseSuccessRate: 34,
            isInitialized: true
        });
    }

    function setDungeonCore(address _coreAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_coreAddress);
    }

    function getDungeon(uint256 _dungeonId) external view returns (Dungeon memory) {
        return dungeons[_dungeonId];
    }

    function getPartyStatus(uint256 _partyId) external view returns (PartyStatus memory) {
        return partyStatuses[_partyId];
    }

    function setDungeon(uint256 id, Dungeon calldata data) external onlyLogicContract whenNotPaused {
        dungeons[id] = data;
    }

    function setPartyStatus(uint256 id, PartyStatus calldata data) external onlyLogicContract whenNotPaused {
        partyStatuses[id] = data;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
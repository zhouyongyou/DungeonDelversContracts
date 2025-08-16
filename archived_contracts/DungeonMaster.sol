// contracts/DungeonMasterV2.sol (移除隊伍擁有權檢查版本)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces.sol";

contract DungeonMasterV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // --- 狀態變數 ---
    IDungeonCore public dungeonCore;
    IDungeonStorage public dungeonStorage;
    IERC20 public soulShardToken;
    
    uint256 public dynamicSeed;

    // 遊戲設定
    uint256 public provisionPriceUSD = 2 * 1e18;
    uint256 public globalRewardMultiplier = 1000; // 1000 = 100%
    uint256 public explorationFee = 0.0015 ether;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    uint256 public restCostPowerDivisor = 200;

    // --- 事件 ---
    event ProvisionsBought(uint256 indexed partyId, uint256 amount, uint256 cost, address indexed buyer);
    event ExpeditionFulfilled(address indexed player, uint256 indexed partyId, bool success, uint256 reward, uint256 expGained);
    event RewardsBanked(address indexed user, uint256 indexed partyId, uint256 amount);
    // 移除疲勞度系統 - 註釋掉 PartyRested 事件
    // event PartyRested(uint256 indexed partyId, uint256 costInSoulShard, address indexed payer);
    event DynamicSeedUpdated(uint256 newSeed);
    event DungeonCoreSet(address indexed newAddress);
    event DungeonStorageSet(address indexed newAddress);
    event SoulShardTokenSet(address indexed newAddress);
    // 移除疲勞度系統 - 註釋掉 RestCostDivisorSet 事件
    // event RestCostDivisorSet(uint256 newDivisor);
    event DungeonSet(uint256 indexed dungeonId, uint256 requiredPower, uint256 rewardAmountUSD, uint8 baseSuccessRate);

    // 修改：移除隊伍擁有權檢查的修飾符
    // modifier onlyPartyOwner(uint256 _partyId) {
    //     require(IParty(dungeonCore.partyContract()).ownerOf(_partyId) == msg.sender, "DM: Not party owner");
    //     _;
    // }

    constructor(address _initialOwner) Ownable(_initialOwner) {
        dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }
    
    // --- 核心遊戲邏輯 ---

    // 修改：移除 onlyPartyOwner 修飾符，允許任何人為任何隊伍購買儲備
    function buyProvisions(uint256 _partyId, uint256 _amount) 
        external nonReentrant whenNotPaused
    {
        require(_amount > 0, "DM: Amount must be > 0");
        require(address(dungeonCore) != address(0), "DM: DungeonCore not set");
        require(address(soulShardToken) != address(0), "DM: SoulShard token not set");

        // 檢查隊伍是否存在（基本檢查）
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        try partyContract.ownerOf(_partyId) returns (address) {
            // 隊伍存在，繼續執行
        } catch {
            revert("DM: Party does not exist");
        }

        uint256 totalCostUSD = provisionPriceUSD * _amount;
        uint256 requiredSoulShard = dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
        
        // 從呼叫者錢包扣款
        soulShardToken.safeTransferFrom(msg.sender, address(this), requiredSoulShard);
        
        IDungeonStorage.PartyStatus memory status = dungeonStorage.getPartyStatus(_partyId);
        status.provisionsRemaining += _amount;
        dungeonStorage.setPartyStatus(_partyId, status);

        emit ProvisionsBought(_partyId, _amount, requiredSoulShard, msg.sender);
    }

    // 修改：requestExpedition 仍需要隊伍擁有者權限（這是合理的）
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) 
        external payable nonReentrant whenNotPaused
    {
        // 檢查是否為隊伍擁有者
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DM: Not party owner");
        
        require(msg.value >= explorationFee, "DM: BNB fee not met");
        require(address(dungeonCore) != address(0) && address(dungeonStorage) != address(0), "DM: Core contracts not set");
        
        IDungeonStorage.Dungeon memory dungeon = dungeonStorage.getDungeon(_dungeonId);
        IDungeonStorage.PartyStatus memory partyStatus = dungeonStorage.getPartyStatus(_partyId);

        require(dungeon.isInitialized, "DM: Dungeon DNE");
        // 移除儲備檢查 - 出征時已付費，不需要預先購買儲備
        require(block.timestamp >= partyStatus.cooldownEndsAt, "DM: Party on cooldown");
        
        // 簡化：使用標準的 getter 函數讀取隊伍戰力
        (uint256 totalPower, ) = partyContract.getPartyComposition(_partyId);
        require(totalPower >= dungeon.requiredPower, "DM: Power too low");

        // 移除儲備消耗 - 改為直接付費模式
        partyStatus.cooldownEndsAt = block.timestamp + COOLDOWN_PERIOD;
        
        _processExpeditionResult(msg.sender, _partyId, _dungeonId, partyStatus);
    }
    
    function _processExpeditionResult(address _requester, uint256 _partyId, uint256 _dungeonId, IDungeonStorage.PartyStatus memory _partyStatus) private {
        IDungeonStorage.Dungeon memory dungeon = dungeonStorage.getDungeon(_dungeonId);
        
        uint8 vipBonus = 0;
        try IVIPStaking(dungeonCore.vipStakingAddress()).getVipLevel(_requester) returns (uint8 level) { vipBonus = level; } catch {}
        uint256 finalSuccessRate = dungeon.baseSuccessRate + vipBonus;
        if (finalSuccessRate > 100) finalSuccessRate = 100;

        uint256 randomValue = uint256(keccak256(abi.encodePacked(dynamicSeed, block.timestamp, _requester, _partyId, _dungeonId))) % 100;
        bool success = randomValue < finalSuccessRate;

        (uint256 reward, uint256 expGained) = _handleExpeditionOutcome(_requester, _dungeonId, success);

        if (reward > 0) {
            _partyStatus.unclaimedRewards += reward;
        }
        
        // 移除疲勞度系統 - 不再增加疲勞度
        // if (_partyStatus.fatigueLevel < 45) {
        //     _partyStatus.fatigueLevel++;
        // }
        
        dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, randomValue, success ? 1 : 0)));
        dungeonStorage.setPartyStatus(_partyId, _partyStatus);

        emit ExpeditionFulfilled(_requester, _partyId, success, reward, expGained);
    }

    function _handleExpeditionOutcome(address _requester, uint256 _dungeonId, bool _success) internal returns (uint256 reward, uint256 expGained) {
        if (_success) {
            IDungeonStorage.Dungeon memory dungeon = dungeonStorage.getDungeon(_dungeonId);
            uint256 finalRewardUSD = (dungeon.rewardAmountUSD * globalRewardMultiplier) / 1000;
            reward = dungeonCore.getSoulShardAmountForUSD(finalRewardUSD);
        } else {
            reward = 0;
        }

        expGained = calculateExperience(_dungeonId, _success);
        if (expGained > 0) {
            try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_requester, expGained) {} catch {}
        }
    }

    // 修改：claimRewards 仍需要隊伍擁有者權限（這是合理的）
    function claimRewards(uint256 _partyId) external nonReentrant whenNotPaused {
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        require(partyContract.ownerOf(_partyId) == msg.sender, "DM: Not party owner");
        
        IDungeonStorage.PartyStatus memory status = dungeonStorage.getPartyStatus(_partyId);
        require(status.unclaimedRewards > 0, "DM: No rewards to claim");
        
        uint256 rewardsToClaim = status.unclaimedRewards;
        status.unclaimedRewards = 0;
        dungeonStorage.setPartyStatus(_partyId, status);
        
        IPlayerVault(dungeonCore.playerVaultAddress()).deposit(msg.sender, rewardsToClaim);
        emit RewardsBanked(msg.sender, _partyId, rewardsToClaim);
    }

    // 移除疲勞度系統 - 註釋掉 restParty 功能
    // function restParty(uint256 _partyId) external nonReentrant whenNotPaused {
    //     // 檢查隊伍是否存在
    //     IParty partyContract = IParty(dungeonCore.partyContractAddress());
    //     try partyContract.ownerOf(_partyId) returns (address) {
    //         // 隊伍存在，繼續執行
    //     } catch {
    //         revert("DM: Party does not exist");
    //     }
    //     
    //     IDungeonStorage.PartyStatus memory status = dungeonStorage.getPartyStatus(_partyId);
    //     require(status.fatigueLevel > 0, "DM: Party is not fatigued");

    //     (, , uint256 maxPower, , ) = partyContract.partyCompositions(_partyId);
    //     
    //     uint256 costInUSD = (maxPower * 1e18) / restCostPowerDivisor;
    //     require(costInUSD > 0, "DM: Rest cost is zero");

    //     uint256 costInSoulShard = dungeonCore.getSoulShardAmountForUSD(costInUSD);
    //     
    //     require(address(soulShardToken) != address(0), "DM: SoulShard token not set");
    //     soulShardToken.safeTransferFrom(msg.sender, address(this), costInSoulShard);
    //     
    //     status.fatigueLevel = 0;
    //     dungeonStorage.setPartyStatus(_partyId, status);
    //     emit PartyRested(_partyId, costInSoulShard, msg.sender);
    // }

    function calculateExperience(uint256 dungeonId, bool success) internal pure returns (uint256) {
        uint256 baseExp = dungeonId * 5 + 20;
        return success ? baseExp : baseExp / 4;
    }

    function isPartyLocked(uint256 _partyId) public view returns (bool) {
        if (address(dungeonStorage) == address(0)) return false;
        IDungeonStorage.PartyStatus memory status = dungeonStorage.getPartyStatus(_partyId);
        return block.timestamp < status.cooldownEndsAt;
    }

    // --- Owner 管理函式 ---
    function adminSetDungeon(
        uint256 _dungeonId,
        uint256 _requiredPower,
        uint256 _rewardAmountUSD,
        uint8 _baseSuccessRate
    ) external onlyOwner {
        require(address(dungeonStorage) != address(0), "DM: DungeonStorage not set");
        require(_dungeonId > 0 && _dungeonId <= dungeonStorage.NUM_DUNGEONS(), "DM: Invalid dungeon ID");

        dungeonStorage.setDungeon(_dungeonId, IDungeonStorage.Dungeon({
            requiredPower: _requiredPower,
            rewardAmountUSD: _rewardAmountUSD,
            baseSuccessRate: _baseSuccessRate,
            isInitialized: true
        }));
        
        emit DungeonSet(_dungeonId, _requiredPower, _rewardAmountUSD, _baseSuccessRate);
    }

    function setDungeonCore(address _newAddress) external onlyOwner {
        dungeonCore = IDungeonCore(_newAddress);
        emit DungeonCoreSet(_newAddress);
    }

    function setDungeonStorage(address _newAddress) external onlyOwner {
        dungeonStorage = IDungeonStorage(_newAddress);
        emit DungeonStorageSet(_newAddress);
    }

    function setSoulShardToken(address _newAddress) external onlyOwner {
        soulShardToken = IERC20(_newAddress);
        emit SoulShardTokenSet(_newAddress);
    }

    function updateDynamicSeed(uint256 _newSeed) external onlyOwner {
        dynamicSeed = _newSeed;
        emit DynamicSeedUpdated(_newSeed);
    }

    function setGlobalRewardMultiplier(uint256 _newMultiplier) external onlyOwner {
        globalRewardMultiplier = _newMultiplier;
    }

    function setProvisionPriceUSD(uint256 _newPrice) external onlyOwner {
        provisionPriceUSD = _newPrice * 1e18;
    }

    function setExplorationFee(uint256 _newFee) external onlyOwner {
        explorationFee = _newFee;
    }
    
    // 移除疲勞度系統 - 註釋掉 setRestCostPowerDivisor 功能
    // function setRestCostPowerDivisor(uint256 _newDivisor) external onlyOwner {
    //     require(_newDivisor > 0, "DM: Divisor must be > 0");
    //     restCostPowerDivisor = _newDivisor;
    //     emit RestCostDivisorSet(_newDivisor);
    // }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    function withdrawNativeFunding() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "DM: Native withdraw failed");
    }

    function withdrawSoulShard() external onlyOwner {
        require(address(soulShardToken) != address(0), "DM: SoulShard token not set");
        uint256 balance = soulShardToken.balanceOf(address(this));
        if (balance > 0) {
            soulShardToken.safeTransfer(owner(), balance);
        }
    }
}
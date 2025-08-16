// contracts/DungeonCore_Secured.sol (安全加固版)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/interfaces.sol";

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title DungeonCore_Secured (安全加固版)
 * @notice 系統的中心樞紐，負責註冊和管理所有衛星合約，並作為它們之間溝通的橋樑。
 * @dev 安全加固版本：添加了 ReentrancyGuard 防止跨合約重入攻擊
 */
contract DungeonCore is Ownable, ReentrancyGuard, Pausable {

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
    
    // === 🎯 集中管理新增 ===
    address public vrfManager;

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
    
    // === 🎯 集中管理事件 ===
    event VRFManagerSet(address indexed newAddress);
    event GlobalVRFManagerUpdated(address indexed vrfManager, uint256 contractsUpdated);

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
        // _amountUSD is already in proper 18-decimal format from caller contracts
        // USD1 token is 18 decimals, so no scaling needed for Oracle call
        uint256 scaledAmount;
        if (usdDecimals == 18) {
            scaledAmount = _amountUSD;
        } else {
            scaledAmount = (_amountUSD * (10**usdDecimals)) / 1e18;
        }
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

    function spendFromVault(address player, uint256 amount) external nonReentrant whenNotPaused {
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

    // --- Owner 管理函式 ---
    
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
    
    // === 🎯 VRF Manager 集中管理 ===
    
    /**
     * @notice 設置 VRF Manager 並自動更新所有使用 VRF 的合約
     * @param _vrfManager VRF Manager 合約地址
     */
    function setGlobalVRFManager(address _vrfManager) external onlyOwner {
        require(_vrfManager != address(0), "DungeonCore: VRF Manager cannot be zero address");
        
        vrfManager = _vrfManager;
        uint256 contractsUpdated = 0;
        
        // 自動更新所有使用 VRF 的合約
        if (heroContractAddress != address(0)) {
            try IHero(heroContractAddress).setVRFManager(_vrfManager) {
                contractsUpdated++;
            } catch {}
        }
        
        if (relicContractAddress != address(0)) {
            try IRelic(relicContractAddress).setVRFManager(_vrfManager) {
                contractsUpdated++;
            } catch {}
        }
        
        if (dungeonMasterAddress != address(0)) {
            try IDungeonMaster(dungeonMasterAddress).setVRFManager(_vrfManager) {
                contractsUpdated++;
            } catch {}
        }
        
        if (altarOfAscensionAddress != address(0)) {
            try IAltarOfAscension(altarOfAscensionAddress).setVRFManager(_vrfManager) {
                contractsUpdated++;
            } catch {}
        }
        
        emit VRFManagerSet(_vrfManager);
        emit GlobalVRFManagerUpdated(_vrfManager, contractsUpdated);
    }
    
    /**
     * @notice 獲取當前 VRF Manager 地址
     */
    function getVRFManager() external view returns (address) {
        return vrfManager;
    }

    // --- 暫停功能 ---
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
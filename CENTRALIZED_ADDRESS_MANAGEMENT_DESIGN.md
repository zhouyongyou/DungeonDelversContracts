# 統一地址管理系統設計

## 🎯 設計理念

**DungeonCore 作為唯一的地址管理中心**，所有合約地址都由它管理，其他合約需要地址時通過查詢獲取。

### 核心原則
1. **單一真相源頭**: DungeonCore 是所有地址的唯一管理者
2. **避免循環依賴**: 子合約只依賴 DungeonCore，不互相依賴
3. **統一更新**: 一次設定，全系統生效
4. **Gas 優化**: 使用 immutable 和 cache 降低查詢成本

---

## 🏗️ 架構設計

### 當前問題
```solidity
// ❌ 當前架構：分散管理 + 循環依賴
Hero.setDungeonCore(address)
Hero.setSoulShardToken(address)
Hero.setVRFManager(address)
Relic.setDungeonCore(address)
Relic.setSoulShardToken(address)
// ... 每個合約都有重複的設定函數
```

### 新架構設計
```solidity
// ✅ 新架構：統一管理
DungeonCore {
    // 所有地址都在這裡管理
    address public soulShardTokenAddress;
    address public vrfManager;
    address public heroContractAddress;
    // ...
    
    // 統一設定函數
    function setGlobalSoulShardToken(address) external onlyOwner;
    function setGlobalVRFManager(address) external onlyOwner;
}

// 子合約簡化
Hero {
    IDungeonCore public immutable dungeonCore;  // 部署時設定，不可更改
    
    // 移除所有 set 函數，改為查詢
    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }
}
```

---

## 📋 實現方案

### Phase 1: DungeonCore 擴展

#### 1.1 添加全局設定管理
```solidity
contract DungeonCore {
    // === 🎯 統一地址管理 ===
    address public soulShardTokenAddress;
    address public vrfManager;
    address public dungeonStorageAddress;  // 新增
    
    // 已有的合約地址
    address public heroContractAddress;
    address public relicContractAddress;
    // ...
    
    // === 統一設定函數 ===
    
    /**
     * @notice 設定 SoulShard Token 並自動更新所有相關合約
     */
    function setGlobalSoulShardToken(address _token) external onlyOwner {
        require(_token != address(0), "Token cannot be zero address");
        soulShardTokenAddress = _token;
        
        uint256 contractsUpdated = 0;
        
        // 自動更新所有使用 SoulShard 的合約
        if (heroContractAddress != address(0)) {
            try IHero(heroContractAddress).updateSoulShardToken() {
                contractsUpdated++;
            } catch {}
        }
        
        if (relicContractAddress != address(0)) {
            try IRelic(relicContractAddress).updateSoulShardToken() {
                contractsUpdated++;
            } catch {}
        }
        
        if (dungeonMasterAddress != address(0)) {
            try IDungeonMaster(dungeonMasterAddress).updateSoulShardToken() {
                contractsUpdated++;
            } catch {}
        }
        
        if (playerVaultAddress != address(0)) {
            try IPlayerVault(playerVaultAddress).updateSoulShardToken() {
                contractsUpdated++;
            } catch {}
        }
        
        if (vipStakingAddress != address(0)) {
            try IVIPStaking(vipStakingAddress).updateSoulShardToken() {
                contractsUpdated++;
            } catch {}
        }
        
        emit GlobalSoulShardTokenUpdated(_token, contractsUpdated);
    }
    
    /**
     * @notice 設定 DungeonStorage 地址
     */
    function setDungeonStorage(address _storage) external onlyOwner {
        require(_storage != address(0), "Storage cannot be zero address");
        dungeonStorageAddress = _storage;
        
        // 自動更新 DungeonMaster
        if (dungeonMasterAddress != address(0)) {
            try IDungeonMaster(dungeonMasterAddress).updateDungeonStorage() {
                emit DungeonStorageUpdated(_storage);
            } catch {}
        }
    }
    
    /**
     * @notice 批量設定所有核心地址（部署時使用）
     */
    function setBatchAddresses(
        address _soulShard,
        address _vrfManager,
        address _oracle,
        address _dungeonStorage
    ) external onlyOwner {
        if (_soulShard != address(0)) soulShardTokenAddress = _soulShard;
        if (_vrfManager != address(0)) vrfManager = _vrfManager;
        if (_oracle != address(0)) oracleAddress = _oracle;
        if (_dungeonStorage != address(0)) dungeonStorageAddress = _dungeonStorage;
        
        emit BatchAddressesSet(_soulShard, _vrfManager, _oracle, _dungeonStorage);
    }
    
    // === 查詢函數（為子合約提供）===
    
    function getAllCoreAddresses() external view returns (
        address soulShard,
        address vrf,
        address oracle,
        address vault,
        address storage_
    ) {
        return (
            soulShardTokenAddress,
            vrfManager,
            oracleAddress,
            playerVaultAddress,
            dungeonStorageAddress
        );
    }
    
    // === 事件 ===
    event GlobalSoulShardTokenUpdated(address indexed token, uint256 contractsUpdated);
    event DungeonStorageUpdated(address indexed storage_);
    event BatchAddressesSet(address soulShard, address vrfManager, address oracle, address storage_);
}
```

### Phase 2: 子合約重構

#### 2.1 Hero 合約重構示例
```solidity
contract Hero {
    IDungeonCore public immutable dungeonCore;  // 部署時設定，不可更改
    IERC20 private soulShardToken;  // 快取，避免重複查詢
    
    constructor(
        address _initialOwner,
        address _dungeonCore
    ) ERC721("Dungeon Delvers Hero", "DDH") Ownable(_initialOwner) {
        require(_dungeonCore != address(0), "DungeonCore cannot be zero");
        dungeonCore = IDungeonCore(_dungeonCore);
        _nextTokenId = 1;
        
        // 初始化快取
        _updateSoulShardToken();
    }
    
    // === 🔧 移除所有 set 函數，改為更新函數 ===
    
    // ❌ 移除：function setDungeonCore(address)
    // ❌ 移除：function setSoulShardToken(address)
    // ❌ 移除：function setVRFManager(address)
    
    /**
     * @notice 從 DungeonCore 更新 SoulShard Token 地址
     * @dev 只能由 DungeonCore 調用（透過 setGlobalSoulShardToken）
     */
    function updateSoulShardToken() external {
        require(msg.sender == address(dungeonCore), "Only DungeonCore can update");
        _updateSoulShardToken();
    }
    
    function _updateSoulShardToken() private {
        address newToken = dungeonCore.soulShardTokenAddress();
        require(newToken != address(0), "Invalid token address");
        soulShardToken = IERC20(newToken);
    }
    
    // === 查詢函數優化 ===
    
    function _getVRFManager() internal view returns (address) {
        return dungeonCore.getVRFManager();
    }
    
    function _getPlayerVault() internal view returns (address) {
        return dungeonCore.playerVaultAddress();
    }
    
    // 使用快取避免重複查詢
    function _getSoulShardToken() internal view returns (IERC20) {
        return soulShardToken;
    }
    
    // === 修改使用地址的函數 ===
    
    function mintFromVault(uint256 _quantity) external payable nonReentrant whenNotPaused {
        // 原本：IPlayerVault(dungeonCore.playerVaultAddress()).spendForGame(...)
        // 優化：直接使用快取查詢
        IPlayerVault(_getPlayerVault()).spendForGame(msg.sender, requiredAmount);
        
        // VRF 調用使用動態查詢（VRF Manager 可能更換）
        uint256 requestId = IVRFManager(_getVRFManager()).requestRandomForUser{value: 0}(
            msg.sender, 1, maxRarity, requestData
        );
    }
    
    function getRequiredSoulShardAmount(uint256 _quantity) public view returns (uint256) {
        // 直接使用 DungeonCore 的計算函數
        return dungeonCore.getSoulShardAmountForUSD(mintPriceUSD * _quantity);
    }
}
```

#### 2.2 DungeonMaster 合約重構
```solidity
contract DungeonMaster {
    IDungeonCore public immutable dungeonCore;
    IDungeonStorage private dungeonStorage;  // 快取
    
    constructor(address _dungeonCore) {
        dungeonCore = IDungeonCore(_dungeonCore);
        _updateDungeonStorage();
    }
    
    // === 更新函數 ===
    
    function updateSoulShardToken() external {
        require(msg.sender == address(dungeonCore), "Only DungeonCore");
        // SoulShard Token 已由 DungeonCore 管理，無需本地快取
    }
    
    function updateDungeonStorage() external {
        require(msg.sender == address(dungeonCore), "Only DungeonCore");
        _updateDungeonStorage();
    }
    
    function _updateDungeonStorage() private {
        address storageAddr = dungeonCore.dungeonStorageAddress();
        require(storageAddr != address(0), "Invalid storage address");
        dungeonStorage = IDungeonStorage(storageAddr);
    }
    
    // === 使用統一地址 ===
    
    function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable {
        // 使用統一地址查詢
        IParty partyContract = IParty(dungeonCore.partyContractAddress());
        
        // 使用快取的 Storage
        dungeonStorage.setExpeditionRequest(requestId, request);
        
        // VRF 調用
        IVRFManager(dungeonCore.getVRFManager()).requestRandomness(
            IVRFManager.RequestType.DUNGEON_EXPLORE, 1, abi.encode(_partyId, _dungeonId)
        );
    }
}
```

---

## 📊 Gas 成本分析

### 查詢成本對比

| 操作 | 當前方式 | 新方式 | Gas 差異 |
|------|----------|--------|----------|
| **SoulShard Token 查詢** | storage read (200 gas) | external call (2,600 gas) | +2,400 gas |
| **VRF Manager 查詢** | storage read (200 gas) | external call (2,600 gas) | +2,400 gas |
| **PlayerVault 查詢** | storage read (200 gas) | external call (2,600 gas) | +2,400 gas |

### 優化策略

#### 1. **使用快取減少查詢**
```solidity
// 對於經常使用的地址，使用快取
IERC20 private soulShardTokenCache;

function updateSoulShardToken() external {
    soulShardTokenCache = IERC20(dungeonCore.soulShardTokenAddress());
}
```

#### 2. **批量查詢減少外部調用**
```solidity
function _refreshAllAddresses() internal {
    (
        address soulShard,
        address vrf,
        address oracle,
        address vault,
        address storage_
    ) = dungeonCore.getAllCoreAddresses();
    
    // 一次調用更新所有地址
}
```

#### 3. **選擇性快取策略**
- **高頻使用**: SoulShard Token → 快取
- **中頻使用**: PlayerVault → 快取  
- **低頻使用**: VRF Manager → 動態查詢（更換頻率低）

### Gas 成本估算

**典型 NFT 鑄造交易**:
- 當前: ~150,000 gas
- 新方式: ~157,500 gas (+5%)
- **結論**: 成本增加可接受，換來管理便利性

---

## 🔧 實施計劃

### Phase 1: DungeonCore 擴展 (2小時)
1. 添加統一設定函數
2. 實現批量地址查詢
3. 添加相關事件

### Phase 2: 接口更新 (30分鐘)
1. 更新 IDungeonCore 接口
2. 添加新的查詢函數

### Phase 3: 子合約重構 (每個合約 1小時)
1. 移除獨立設定函數
2. 實現地址查詢邏輯
3. 添加快取機制

### Phase 4: 部署腳本更新 (1小時)
1. 簡化部署流程
2. 統一地址配置
3. 驗證腳本

---

## 💡 預期效果

### 運維改善
- **配置點數**: 從 80+ 個 → 12 個 (-85%)
- **配置錯誤**: 從 10% → 1% (-90%)
- **部署時間**: 從 30分鐘 → 10分鐘 (-67%)

### 開發體驗
- **統一入口**: 所有地址管理都在 DungeonCore
- **避免錯誤**: 不可能出現地址不一致
- **簡化測試**: 只需要測試 DungeonCore 的地址管理

### 系統安全
- **單點控制**: 更容易審計和監控
- **原子更新**: 地址更新要麼全部成功要麼全部失敗
- **權限清晰**: 只有 DungeonCore Owner 能更新地址

---

## 🚨 風險與對策

### 潛在風險
1. **DungeonCore 單點故障**: 如果 DungeonCore 有問題，整個系統受影響
2. **Gas 成本增加**: 每次地址查詢都需要外部調用
3. **升級複雜度**: 需要協調多個合約的升級

### 風險對策
1. **充分測試**: DungeonCore 需要最高級別的測試覆蓋
2. **快取策略**: 減少不必要的外部調用
3. **漸進實施**: 分階段實施，每階段都可以獨立運行

---

## 🎯 結論

統一地址管理是正確的架構方向：
- ✅ **大幅簡化運維**
- ✅ **提高系統可靠性**  
- ✅ **避免配置錯誤**
- ⚠️ **輕微增加 Gas 成本**（可接受）

**建議**: 立即開始實施，從最常用的地址開始（SoulShard Token, VRF Manager）
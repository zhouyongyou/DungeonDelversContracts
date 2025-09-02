# 簡化的統一地址管理設計

## 🎯 設計理念

**核心原則**: DungeonCore 作為純粹的地址註冊表，子合約需要時主動查詢

### 架構對比

#### ❌ 複雜方式（推送模式）
```solidity
// DungeonCore 主動推送給所有合約
function setGlobalSoulShardToken(address _token) external onlyOwner {
    soulShardTokenAddress = _token;
    
    // 複雜的推送邏輯
    if (heroContractAddress != address(0)) {
        try IHero(heroContractAddress).updateSoulShardToken() {} catch {}
    }
    // ... 更多推送邏輯
}

// 子合約需要更新函數
contract Hero {
    function updateSoulShardToken() external {
        // 複雜的更新邏輯
    }
}
```

#### ✅ 簡潔方式（查詢模式）
```solidity
// DungeonCore 只管理地址
function setSoulShardToken(address _token) external onlyOwner {
    soulShardTokenAddress = _token;
    emit SoulShardTokenSet(_token);
}

// 子合約主動查詢
contract Hero {
    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }
    
    function mintFromWallet(uint256 _quantity) external {
        // 直接查詢使用
        IERC20(_getSoulShardToken()).transferFrom(msg.sender, address(this), amount);
    }
}
```

---

## 🏗️ 實現方案

### DungeonCore 設計
```solidity
contract DungeonCore {
    // === 地址管理（只存儲，不推送）===
    address public soulShardTokenAddress;
    address public vrfManager;
    address public dungeonStorageAddress;
    
    // 現有的合約地址
    address public heroContractAddress;
    address public relicContractAddress;
    // ...
    
    // === 簡潔的設定函數 ===
    function setSoulShardToken(address _token) external onlyOwner {
        soulShardTokenAddress = _token;
        emit SoulShardTokenSet(_token);
    }
    
    function setDungeonStorage(address _storage) external onlyOwner {
        dungeonStorageAddress = _storage;
        emit DungeonStorageSet(_storage);
    }
    
    // === 批量查詢（節省 Gas）===
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
}
```

### 子合約設計模式
```solidity
contract Hero {
    IDungeonCore public immutable dungeonCore;
    
    // === 可選：快取常用地址（節省 Gas）===
    IERC20 private soulShardTokenCache;
    bool private cacheInitialized;
    
    constructor(address _dungeonCore) {
        dungeonCore = IDungeonCore(_dungeonCore);
    }
    
    // === 地址查詢函數 ===
    function _getSoulShardToken() internal view returns (address) {
        return dungeonCore.soulShardTokenAddress();
    }
    
    function _getVRFManager() internal view returns (address) {
        return dungeonCore.getVRFManager();
    }
    
    function _getPlayerVault() internal view returns (address) {
        return dungeonCore.playerVaultAddress();
    }
    
    // === 可選：使用快取優化 ===
    function _getSoulShardTokenCached() internal returns (IERC20) {
        if (!cacheInitialized) {
            soulShardTokenCache = IERC20(_getSoulShardToken());
            cacheInitialized = true;
        }
        return soulShardTokenCache;
    }
    
    // === 使用示例 ===
    function mintFromWallet(uint256 _quantity) external payable {
        uint256 requiredAmount = getRequiredSoulShardAmount(_quantity);
        
        // 方式1：每次查詢（簡單但多花 Gas）
        IERC20(_getSoulShardToken()).transferFrom(msg.sender, address(this), requiredAmount);
        
        // 方式2：使用快取（複雜但省 Gas）
        // _getSoulShardTokenCached().transferFrom(msg.sender, address(this), requiredAmount);
        
        // VRF 調用
        IVRFManager(_getVRFManager()).requestRandomForUser{value: 0}(
            msg.sender, 1, maxRarity, requestData
        );
    }
    
    function mintFromVault(uint256 _quantity) external payable {
        // 金庫操作
        IPlayerVault(_getPlayerVault()).spendForGame(msg.sender, requiredAmount);
    }
}
```

---

## 📊 優勢分析

### 🎯 簡潔性
| 方面 | 複雜方式 | 簡潔方式 | 改善 |
|------|----------|----------|------|
| DungeonCore 函數數量 | 15+ | 8 | -50% |
| 子合約更新函數 | 每個合約 3-5 個 | 0 | -100% |
| try/catch 邏輯 | 大量 | 無 | -100% |
| 代碼複雜度 | 高 | 低 | ✅ |

### ⚡ Gas 成本
| 操作 | 複雜方式 | 簡潔方式 |
|------|----------|----------|
| 設定地址 | ~50,000 gas | ~25,000 gas |
| 查詢地址 | storage read (200 gas) | external call (2,600 gas) |
| 部署成本 | 高（更多函數） | 低（函數少） |

### 🔧 維護性
- ✅ **職責清晰**: DungeonCore 只管地址，子合約只查詢
- ✅ **無狀態同步**: 不需要維護地址一致性
- ✅ **更少 Bug**: 沒有複雜的推送邏輯
- ✅ **易於測試**: 單純的查詢邏輯

---

## 🚀 實施建議

### Phase 1: DungeonCore 簡化 (30分鐘)
```solidity
// 只保留簡潔的設定函數
function setSoulShardToken(address) external onlyOwner;
function setDungeonStorage(address) external onlyOwner;
function setBatchAddresses(...) external onlyOwner;  // 部署用
```

### Phase 2: 子合約適配模式 (每個合約 30分鐘)
```solidity
// 移除所有 set 函數，改為查詢
function _getSoulShardToken() internal view returns (address);
function _getVRFManager() internal view returns (address);
```

### Phase 3: 可選 Gas 優化 (需要時)
```solidity
// 對高頻查詢地址使用快取
IERC20 private soulShardTokenCache;
```

---

## 💡 使用建議

### 推薦模式
```solidity
// ✅ 簡潔查詢
function doSomething() external {
    IERC20(dungeonCore.soulShardTokenAddress()).transfer(...);
    IVRFManager(dungeonCore.getVRFManager()).request(...);
}
```

### Gas 優化（可選）
```solidity
// 🔧 批量查詢節省 Gas
function doMultipleThings() external {
    (address soulShard, address vrf, , , ) = dungeonCore.getAllCoreAddresses();
    
    IERC20(soulShard).transfer(...);
    IVRFManager(vrf).request(...);
}
```

### 快取機制（高頻場景）
```solidity
// ⚡ 快取常用地址
contract Hero {
    IERC20 private soulShardToken;
    
    function refreshCache() external {
        soulShardToken = IERC20(dungeonCore.soulShardTokenAddress());
    }
}
```

---

## 🎯 結論

**簡潔方式的核心優勢**:
1. **代碼更少**: 減少 50% 的管理函數
2. **邏輯更清**: 單純的查詢，沒有複雜狀態同步
3. **Bug 更少**: 消除推送邏輯的潛在錯誤
4. **易於理解**: 開發者一看就懂的查詢模式

**小幅 Gas 增加是值得的**，換來的是：
- 極大簡化的代碼維護
- 更高的系統可靠性
- 更清晰的架構設計

**建議**: 採用簡潔的查詢模式，必要時使用快取優化 Gas
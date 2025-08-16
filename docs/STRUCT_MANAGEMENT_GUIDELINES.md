# 結構管理指南 (Struct Management Guidelines)

## 概述

本文檔旨在預防類似 V22 DungeonMaster 結構不匹配的問題，確保合約間的結構定義保持一致。

## 核心問題 (V22 案例分析)

### 問題描述
V22 版本中，`DungeonStorage.PartyStatus` 有 4 個字段：
```solidity
struct PartyStatus {
    uint256 provisionsRemaining;
    uint256 cooldownEndsAt;
    uint256 unclaimedRewards;
    uint8 fatigueLevel; // ← 新增字段
}
```

但 `DungeonMaster` 期望的是 3 個字段的結構，導致 ABI 解碼失敗，產生 `execution reverted #1002` 錯誤。

### 根本原因
1. **結構定義不同步**: 不同合約中相同結構的定義不一致
2. **缺乏驗證機制**: 部署時沒有檢查結構相容性
3. **沒有共享接口**: 沒有統一的結構定義來源

## 解決方案

### 1. 共享結構定義

所有結構必須在 `interfaces.sol` 中統一定義：

```solidity
// contracts/current/interfaces/interfaces.sol
interface IDungeonStorage {
    struct PartyStatus {
        uint256 provisionsRemaining;
        uint256 cooldownEndsAt;
        uint256 unclaimedRewards;
        uint8 fatigueLevel; // 必須包含所有字段
    }
    
    struct Dungeon {
        uint256 requiredPower;
        uint256 rewardAmountUSD;
        uint8 baseSuccessRate;
        bool isInitialized;
    }
    
    // 原始 mapping getter 函數
    function dungeons(uint256 id) external view returns (
        uint256 requiredPower, 
        uint256 rewardAmountUSD, 
        uint8 baseSuccessRate, 
        bool isInitialized
    );
    
    function partyStatuses(uint256 id) external view returns (
        uint256 provisionsRemaining, 
        uint256 cooldownEndsAt, 
        uint256 unclaimedRewards, 
        uint8 fatigueLevel
    );
}
```

### 2. 結構相容性驗證

#### 部署前驗證
```bash
# 編譯前檢查
node scripts/active/test-struct-compatibility.js
```

#### 部署時驗證
在 `setup-v23-complete.js` 中自動執行：
```javascript
// 在 setupV23Contracts() 開始時
await validateStructCompatibility(v23Config, provider);
```

#### 驗證測試腳本
`scripts/active/test-struct-compatibility.js` 包含：
- 結構字段數量檢查
- 數據類型相容性測試
- 模擬合約調用測試

### 3. 最佳實踐

#### DO ✅

1. **統一結構定義**
   ```solidity
   // 在 interfaces.sol 中定義
   // 在實際合約中引用
   import "../interfaces/interfaces.sol";
   ```

2. **保持向後兼容**
   ```solidity
   // 只在結構末尾添加新字段
   struct PartyStatus {
       uint256 provisionsRemaining;
       uint256 cooldownEndsAt;
       uint256 unclaimedRewards;
       uint8 fatigueLevel; // 新字段放在末尾
   }
   ```

3. **使用內部轉換函數**
   ```solidity
   // DungeonMaster 內部
   function _getPartyStatus(uint256 _partyId) private view returns (PartyStatus memory) {
       (uint256 p, uint256 c, uint256 u, uint8 f) = IDungeonStorage(dungeonStorage).partyStatuses(_partyId);
       return PartyStatus(p, c, u, f);
   }
   ```

4. **部署前測試**
   ```bash
   # 編譯測試
   npx hardhat compile
   
   # 結構驗證
   node scripts/active/test-struct-compatibility.js
   
   # 完整測試
   npx hardhat test
   ```

#### DON'T ❌

1. **不要修改現有字段**
   ```solidity
   // ❌ 錯誤：改變字段順序或類型
   struct PartyStatus {
       uint8 fatigueLevel;     // 移動位置
       uint256 provisionsRemaining;
       uint256 cooldownEndsAt;
       uint256 unclaimedRewards;
   }
   ```

2. **不要在中間插入字段**
   ```solidity
   // ❌ 錯誤：在中間插入新字段
   struct PartyStatus {
       uint256 provisionsRemaining;
       uint8 newField;         // 插入在中間
       uint256 cooldownEndsAt;
       uint256 unclaimedRewards;
       uint8 fatigueLevel;
   }
   ```

3. **不要跳過驗證**
   ```bash
   # ❌ 錯誤：直接部署而不測試
   npx hardhat run scripts/deploy.js --network bsc
   ```

## 工具和腳本

### 1. 結構驗證腳本
- **位置**: `scripts/active/test-struct-compatibility.js`
- **功能**: 檢查合約間結構相容性
- **使用**: `node scripts/active/test-struct-compatibility.js`

### 2. 部署設置腳本
- **位置**: `scripts/active/setup-v23-complete.js`
- **功能**: 自動驗證 + 完整設置
- **特點**: 包含結構驗證步驟

### 3. 接口定義文件
- **位置**: `contracts/current/interfaces/interfaces.sol`
- **功能**: 統一的結構和接口定義
- **重要性**: 所有合約必須引用此文件

## 版本升級檢查清單

### 部署新版本前

- [ ] 檢查所有結構定義是否在 `interfaces.sol` 中
- [ ] 確認新字段只添加在結構末尾
- [ ] 運行 `test-struct-compatibility.js`
- [ ] 執行完整的 Hardhat 測試
- [ ] 確認所有合約引用相同的接口文件

### 部署後

- [ ] 執行結構相容性驗證
- [ ] 測試關鍵功能（如地城探索）
- [ ] 監控錯誤日誌
- [ ] 確認前端顯示正常

## 故障排除

### 常見錯誤

1. **`execution reverted #1002`**
   - 原因：結構字段數量不匹配
   - 解決：檢查並修復結構定義

2. **`DeclarationError: Identifier already declared`**
   - 原因：重複的接口定義
   - 解決：移除重複定義，使用統一接口

3. **ABI 解碼失敗**
   - 原因：字段類型或順序不匹配
   - 解決：檢查結構字段定義

### 調試步驟

1. **檢查合約編譯**
   ```bash
   npx hardhat compile
   ```

2. **驗證結構相容性**
   ```bash
   node scripts/active/test-struct-compatibility.js
   ```

3. **檢查部署日誌**
   ```bash
   # 查看最近的部署記錄
   ls -la deployments/
   ```

## 未來改進

### 自動化工具
- 開發 CI/CD 鉤子，自動檢查結構相容性
- 創建 Hardhat 插件進行結構驗證
- 實現結構變更的自動遷移腳本

### 監控系統
- 部署結構不匹配檢測
- 實時錯誤監控和告警
- 合約調用成功率追蹤

## 總結

結構管理的核心原則：
1. **統一定義** - 所有結構在 interfaces.sol 中定義
2. **向後兼容** - 只在末尾添加新字段
3. **充分測試** - 部署前執行相容性驗證
4. **持續監控** - 部署後監控系統健康

遵循這些原則可以有效避免類似 V22 的結構不匹配問題，確保系統穩定運行。
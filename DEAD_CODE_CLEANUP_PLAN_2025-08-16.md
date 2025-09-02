# 🧹 死代碼清理執行計劃
生成時間：2025-08-16

## 📊 清理範圍總覽

### 立即可清理（低風險）
| 項目 | 位置 | 操作 | 影響 |
|------|------|------|------|
| VirtualGameSpending 事件 | PlayerVault.sol | 移除定義和使用 | 子圖需更新 |
| 未使用的 GameSpending 事件 | PlayerVault.sol | 確認用途或移除 | 無 |
| isRevealed 邏輯 | Hero/Relic | 簡化為常量 | 前端可能需調整 |
| claimRewards 函數 | DungeonMaster | 完全移除 | 檢查外部調用 |
| 未使用參數 | 多個合約 | 添加註釋標記 | 無 |

### 需要謹慎處理（中風險）
| 項目 | 位置 | 操作 | 影響 |
|------|------|------|------|
| fatigueLevel | DungeonStorage | 保留結構，優化讀取 | Gas 優化 |
| provisionsRemaining | DungeonStorage | 保留結構，優化讀取 | Gas 優化 |
| unclaimedRewards | DungeonStorage | 保留結構，返回0 | Gas 優化 |

---

## 🔧 執行步驟

### 步驟 1：修復 PlayerVault 事件問題

#### 1.1 分析當前狀況
```solidity
// 當前 PlayerVault.sol 中：
event GameSpending(...);           // 定義但未使用
event VirtualGameSpending(...);    // 定義且使用，但 ABI 中不存在

function spendForGame(...) {
    emit VirtualGameSpending(...); // 第 149 行
}
```

#### 1.2 建議修復方案

**方案 A：統一使用 GameSpending（推薦）**
```solidity
// 移除 VirtualGameSpending 事件定義
// event VirtualGameSpending(...); // 刪除第 53 行

// 修改 spendForGame 函數
function spendForGame(address _player, uint256 _amount) external onlyAuthorizedGameContracts {
    // ... 邏輯不變 ...
    
    // 改為發出 GameSpending 事件
    emit GameSpending(_player, msg.sender, _amount);  // 原第 149 行
}
```

**方案 B：完全移除事件（如果不需要鏈上記錄）**
```solidity
// 移除兩個事件定義
// 移除 emit 語句
```

---

### 步驟 2：清理 NFT 揭示機制

#### 2.1 Hero.sol 和 Relic.sol
```solidity
// 當前：每個 NFT 存儲 isRevealed 布爾值
struct HeroData {
    uint8 rarity;
    uint256 power;
    bool isRevealed;  // 永遠為 true
}

// 建議修改為：
struct HeroData {
    uint8 rarity;
    uint256 power;
    // bool isRevealed; // 移除
}

// 添加兼容函數
function isRevealed(uint256) external pure returns (bool) {
    return true;  // 向後兼容
}
```

---

### 步驟 3：清理 DungeonMaster 死代碼

#### 3.1 移除 claimRewards
```solidity
// 刪除這個函數
// function claimRewards(uint256 _partyId) external view {
//     revert("DungeonMaster: Rewards are automatically deposited to PlayerVault");
// }
```

#### 3.2 處理未使用參數
```solidity
// 修改前：
function endDungeon(
    uint256 _partyId,
    uint256 _dungeonId,
    bool _success,
    uint256 _seed
) external onlyDungeonStorage {
    // _partyId 未使用
}

// 修改後：
function endDungeon(
    uint256 /* _partyId */,  // 標記未使用
    uint256 _dungeonId,
    bool _success,
    uint256 _seed
) external onlyDungeonStorage {
    // 邏輯不變
}
```

---

### 步驟 4：優化 DungeonStorage 遺留字段

#### 4.1 保留數據結構但優化讀取
```solidity
// 保持 struct 不變（避免破壞存儲佈局）
struct PartyStatus {
    uint256 provisionsRemaining;  // 遺留
    uint256 cooldownEndsAt;       // 使用中
    uint256 unclaimedRewards;     // 遺留
    uint8 fatigueLevel;           // 遺留
}

// 但在讀取函數中優化
function getPartyStatus(uint256 _partyId) external view returns (
    uint256 cooldownEndsAt,
    bool isInDungeon
) {
    PartyStatus storage status = partyStatuses[_partyId];
    return (status.cooldownEndsAt, status.isInDungeon);
    // 不返回遺留字段，節省 gas
}
```

---

### 步驟 5：清理編譯警告

#### 5.1 AltarOfAscension.sol
```bash
# 自動添加參數註釋
sed -i '' 's/address user,/address \/* user *\/,/g' contracts/current/core/AltarOfAscension.sol
sed -i '' 's/uint256 quantity/uint256 \/* quantity *\//g' contracts/current/core/AltarOfAscension.sol
```

---

## 📝 前端和子圖更新

### 前端更新清單
```typescript
// 1. 移除 isRevealed 檢查
// 舊代碼：
if (hero.isRevealed) {
    showStats();
}

// 新代碼：
showStats();  // 始終顯示

// 2. 移除疲勞度顯示
// 刪除相關 UI 組件

// 3. 移除 claimRewards 調用
// 刪除相關按鈕和邏輯
```

### 子圖更新清單
```yaml
# 1. 移除 VirtualGameSpending 處理
# 從 subgraph.yaml 移除：
# - event: VirtualGameSpending(...)
#   handler: handleVirtualGameSpending

# 2. 更新 schema.graphql
# 移除遺留字段：
type Party @entity {
  # provisionsRemaining: BigInt  # 移除
  # fatigueLevel: Int            # 移除
}

type Hero @entity {
  # isRevealed: Boolean          # 移除
}
```

---

## ⚠️ 風險評估與測試計劃

### 測試檢查清單
- [ ] 編譯所有合約，確保無錯誤
- [ ] 運行單元測試套件
- [ ] 部署到測試網驗證
- [ ] 前端功能測試
- [ ] 子圖重新索引測試

### 回滾計劃
1. Git 分支策略：在 `feature/dead-code-cleanup` 分支工作
2. 逐步部署：先測試網，後主網
3. 保留舊版本 ABI 備份

---

## 🚀 執行時間表

### 第一階段（立即）
- 修復 PlayerVault 事件不一致
- 清理編譯警告
- 創建 Git 分支

### 第二階段（1-2 天）
- 清理合約死代碼
- 更新前端
- 更新子圖

### 第三階段（測試）
- 測試網部署
- 完整功能測試
- 性能基準測試

### 第四階段（部署）
- 主網部署
- 監控和驗證

---

## 💡 預期收益

### 技術收益
- **Gas 優化**：減少 3-5% gas 消耗
- **合約大小**：減少 5-10% 字節碼大小
- **編譯時間**：提升 10-15%

### 維護收益
- **代碼清晰度**：提高 30%
- **開發效率**：減少混淆和錯誤
- **文檔準確性**：100% 匹配實際代碼

---

## 📋 執行命令參考

```bash
# 1. 創建分支
git checkout -b feature/dead-code-cleanup

# 2. 執行清理
# 合約清理
cd /Users/sotadic/Documents/DungeonDelversContracts
# 執行修改...

# 3. 編譯測試
npx hardhat compile
npx hardhat test

# 4. 更新前端
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
npm run type-check
npm run lint

# 5. 更新子圖
cd DDgraphql/dungeon-delvers
npm run codegen
npm run build

# 6. 提交變更
git add .
git commit -m "feat: clean up dead code and optimize contracts"
```

---

## 🔍 後續優化建議

1. **建立代碼質量監控**
   - 自動檢測未使用代碼
   - 定期審查和清理

2. **版本化策略**
   - V2 合約完全重構
   - 清除所有歷史包袱

3. **文檔同步**
   - 自動生成文檔
   - 確保代碼與文檔一致
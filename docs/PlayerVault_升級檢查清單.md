# PlayerVault 升級檢查清單

## 📋 合約修改影響分析

### 🔄 需要更新 ABI 的項目

#### 1. 前端 (/Users/sotadic/Documents/GitHub/DungeonDelvers/)
```bash
# 更新 ABI 文件
src/abis/PlayerVault.json

# 受影響的組件
- src/pages/ProfilePage.tsx (金庫餘額顯示)
- src/pages/MintPage.tsx (使用金庫支付)
- src/components/PlayerVaultSection.tsx (金庫管理)
- src/hooks/usePlayerVault.ts (如果有)
```

#### 2. 後端 (/Users/sotadic/Documents/dungeon-delvers-metadata-server/)
```bash
# 可能需要更新的文件
- contracts/PlayerVault.json (如果後端有 ABI)
- 任何監聽 PlayerVault 事件的服務
```

#### 3. 子圖 (/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/)
```bash
# 需要更新的文件
- abis/PlayerVault.json
- schema.graphql (如果有新字段)
- src/mappings/playerVault.ts (事件處理)
```

## 🆕 新增功能需要前端支援

### 1. 推薦人佣金功能
```typescript
// 新增查詢
- getCommissionBalance(address) // 查詢佣金餘額
- withdrawCommission() // 提取佣金

// UI 更新
- 顯示推薦人佣金餘額
- 添加佣金提取按鈕
- 顯示佣金歷史記錄
```

### 2. 管理員功能
```typescript
// 新增管理功能
- withdrawTax() // 提取稅收
- getTaxBalance() // 查詢稅收餘額
- setCommissionRate() // 設置佣金率
- withdrawGameRevenue() // 提取遊戲收入
```

### 3. 事件變更
```typescript
// 舊事件（保留）
- GameSpending(player, spender, amount)

// 新事件
- VirtualGameSpending(player, spender, amount)
- VirtualCommissionAdded(referrer, amount)
- VirtualTaxCollected(amount)
```

## 🔍 前端需要調整的邏輯

### 1. 提款計算顯示
```typescript
// 原本
const afterTax = amount * (1 - taxRate/10000);

// 現在（有推薦人）
const afterTax = amount * (1 - taxRate/10000);
const commission = afterTax * 0.05;
const finalAmount = afterTax - commission;
```

### 2. 金庫支付邏輯
```typescript
// spendForGame 不再實際轉帳
// 前端不需要特別處理，但要注意事件變化
```

## ⚠️ 後端影響評估

### 最小影響（如果後端只是讀取數據）
- 不需要修改代碼
- 只需更新 ABI（如果有緩存）

### 可能需要調整
1. **事件監聽器**
   - 如果監聽 `GameSpending` 事件，考慮改為 `VirtualGameSpending`
   - 新增監聽 `VirtualCommissionAdded` 和 `VirtualTaxCollected`

2. **API 端點**
   - 如果有提供佣金相關 API，需要調用新的查詢函數
   - 稅收統計可能需要新的端點

## 📊 數據遷移考量

### 不需要遷移的數據
- `withdrawableBalance` - 結構沒變
- `referrers` - 結構沒變
- `totalCommissionPaid` - 結構沒變

### 新增的數據（自動初始化為 0）
- `virtualCommissionBalance` - 推薦人佣金餘額
- `virtualTaxBalance` - 稅收餘額

## 🚀 部署步驟建議

1. **編譯新合約**
   ```bash
   npx hardhat compile
   ```

2. **生成新 ABI**
   ```bash
   # 複製 ABI 到各個項目
   cp artifacts/contracts/defi/PlayerVault.sol/PlayerVault.json ../GitHub/DungeonDelvers/src/abis/
   ```

3. **預充值 SoulShard**
   ```javascript
   // 部署腳本中添加
   const amount = ethers.utils.parseEther("10000000");
   await soulShard.transfer(playerVault.address, amount);
   ```

4. **驗證功能**
   - 測試虛擬扣款（spendForGame）
   - 測試提款流程（有/無推薦人）
   - 測試佣金累積和提取
   - 測試稅收提取

## 💡 前端 UI 建議

### 1. 金庫頁面新增區塊
```
┌─────────────────────────┐
│ 💰 推薦佣金            │
├─────────────────────────┤
│ 可提取佣金: 1,234 SOUL │
│ 累計獲得: 5,678 SOUL   │
│ [提取佣金]             │
└─────────────────────────┘
```

### 2. 提款預覽改進
```
提款金額: 1000 SOUL
├── 稅率: 25% (-250 SOUL)
├── 推薦佣金: 5% (-37.5 SOUL)
└── 實際到帳: 712.5 SOUL ✓
```

## 🔧 測試重點

1. **合約功能測試**
   - [ ] 虛擬記帳正確性
   - [ ] 佣金計算準確
   - [ ] 稅收累積正常
   - [ ] 提取功能正常

2. **前端整合測試**
   - [ ] ABI 更新正確
   - [ ] 新功能可用
   - [ ] 事件監聽正常
   - [ ] 數值顯示準確

3. **端到端測試**
   - [ ] 完整的遊戲流程
   - [ ] 提款流程
   - [ ] 推薦人流程
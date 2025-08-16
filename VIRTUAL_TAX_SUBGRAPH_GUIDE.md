# VirtualTaxCollected 事件子圖處理指南

**版本**: V25  
**事件**: `VirtualTaxCollected(uint256 amount)`  
**合約**: PlayerVault (`0x8c3A73E27C518f082150330e5666e765B52297AF`)

## 🎯 核心變更說明

V25 PlayerVault 引入虛擬稅收系統，稅款不再直接轉移給 Owner，而是記錄在 `virtualTaxBalance` 中。

### 新增事件
```solidity
event VirtualTaxCollected(uint256 amount);
event VirtualCommissionAdded(address indexed referrer, uint256 amount);
```

## 📊 子圖處理方案

### 方案 A：最小化更新（推薦）
**適用情況**: 現有統計邏輯完整，只需要添加新事件追蹤

```typescript
// schema.graphql 新增實體
type VirtualTaxRecord @entity {
  id: ID!
  amount: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type TaxStatistics @entity {
  id: ID! # "global"
  totalVirtualTaxCollected: BigInt!
  totalTaxRecords: BigInt!
  lastUpdated: BigInt!
}
```

```typescript
// PlayerVault mapping 新增
export function handleVirtualTaxCollected(event: VirtualTaxCollected): void {
  // 創建個別記錄
  let record = new VirtualTaxRecord(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  record.amount = event.params.amount;
  record.timestamp = event.block.timestamp;
  record.blockNumber = event.block.number;
  record.transactionHash = event.transaction.hash;
  record.save();
  
  // 更新全域統計
  let stats = TaxStatistics.load("global");
  if (!stats) {
    stats = new TaxStatistics("global");
    stats.totalVirtualTaxCollected = BigInt.fromI32(0);
    stats.totalTaxRecords = BigInt.fromI32(0);
  }
  
  stats.totalVirtualTaxCollected = stats.totalVirtualTaxCollected.plus(event.params.amount);
  stats.totalTaxRecords = stats.totalTaxRecords.plus(BigInt.fromI32(1));
  stats.lastUpdated = event.block.timestamp;
  stats.save();
}
```

### 方案 B：完整整合
**適用情況**: 需要將虛擬稅收與現有提領統計整合

```typescript
// 擴展現有的 WithdrawEvent 實體
type WithdrawEvent @entity {
  id: ID!
  player: Player!
  amount: BigInt!
  taxAmount: BigInt! # 新增
  isVirtualTax: Boolean! # 新增：區分虛擬稅收
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}
```

## 🔧 具體實施步驟

### 1. 更新 subgraph.yaml
在 PlayerVault 資料源中新增事件處理：

```yaml
- event: VirtualTaxCollected(uint256)
  handler: handleVirtualTaxCollected
- event: VirtualCommissionAdded(indexed address,uint256)
  handler: handleVirtualCommissionAdded
```

### 2. 不需要複雜邏輯
由於 VirtualTaxCollected 事件**不依賴其他複雜邏輯**，處理非常簡單：
- ✅ 只需要記錄 amount 和時間戳
- ✅ 不需要查詢用戶信息
- ✅ 不需要計算稅率
- ✅ 不需要關聯其他實體

### 3. 查詢範例
```graphql
# 查詢虛擬稅收記錄
query GetVirtualTaxRecords($first: Int!, $skip: Int!) {
  virtualTaxRecords(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    amount
    timestamp
    blockNumber
    transactionHash
  }
}

# 查詢稅收統計
query GetTaxStatistics {
  taxStatistics(id: "global") {
    totalVirtualTaxCollected
    totalTaxRecords
    lastUpdated
  }
}
```

## ⚠️ 重要注意事項

### 1. **向下相容性**
- 舊的提領事件處理邏輯**不需要修改**
- VirtualTaxCollected 是**獨立事件**，不會影響現有功能

### 2. **時間戳一致性**
- 使用 `event.block.timestamp` 確保與鏈上數據一致
- 前端可以用同樣的時間戳匹配提領和稅收事件

### 3. **數據精度**
- 所有 amount 使用 `BigInt` 類型
- 前端顯示時需要適當的單位轉換

### 4. **效能考量**
- VirtualTaxCollected 頻率不會很高（僅在有稅收的提領時觸發）
- 建議添加適當的索引以優化查詢效能

## 🚀 部署檢查清單

- [ ] **schema.graphql**: 新增 VirtualTaxRecord 和 TaxStatistics 實體
- [ ] **subgraph.yaml**: 新增事件處理器映射
- [ ] **PlayerVault.ts**: 實作 handleVirtualTaxCollected 函數
- [ ] **測試**: 驗證事件捕獲和資料存儲
- [ ] **前端**: 更新查詢以包含虛擬稅收數據

## 🔄 升級路徑

1. **第一階段**: 部署基礎事件追蹤（方案 A）
2. **第二階段**（可選）: 整合到現有統計系統（方案 B）
3. **第三階段**（可選）: 添加高級分析功能

---

**總結**: VirtualTaxCollected 事件處理相對簡單，主要是添加新的實體和統計功能，不會影響現有的子圖功能。建議先採用方案 A 快速部署，後續可以根據需求擴展。
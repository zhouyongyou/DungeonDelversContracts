# 📊 V25 子圖簡化更新指南

## 問題分析

你是對的！V25 已經**不使用傳統的兩步驟 Commit-Reveal**，而是**直接使用 VRF 一步完成**。因此子圖更新相對簡單。

## 實際的 V25 流程

### ✅ **實際鑄造流程**
1. 用戶調用 `mintFromWallet(quantity)`
2. 合約立即請求 VRF 隨機數
3. VRF 回調後自動完成鑄造
4. **無需用戶二次操作，無時間限制**

### 🔮 **VRF 優化重點**
- **tokenId + 單一隨機數**：用一個隨機數生成所有 NFT
- **98% 費用節省**：從 50 × VRF 費用 → 1 × VRF 費用
- **訂閱模式**：使用 VRF V2.5 訂閱而非 Direct Funding

---

## 🔧 子圖需要的實際更新

### 1. **更新合約地址** (最重要)

```yaml
# subgraph.yaml
dataSources:
  - name: Hero
    source:
      address: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD"  # 新地址
      startBlock: 56688770  # 新起始區塊
      
  - name: Relic  
    source:
      address: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4"  # 新地址
      startBlock: 56688770
      
  # 新增 VRF Manager (可選)
  - name: VRFManager
    source:
      address: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
      startBlock: 56688770
```

### 2. **新增 VRF 相關實體** (可選，用於統計)

```graphql
# schema.graphql - 新增部分
type VRFOptimization @entity {
  id: ID!                      # "v25-optimization"
  totalRequests: BigInt!       # VRF 請求總數
  totalSavings: BigInt!        # 節省的費用 (BNB)
  optimizedMints: BigInt!      # 優化版鑄造數量
}

# 更新 Token 實體 (如果需要追蹤優化)
type Token @entity {
  id: ID!
  # ... 現有欄位
  
  # 新增 V25 優化標記
  isOptimized: Boolean!        # 是否使用 V25 優化
  vrfCost: BigInt              # 實際 VRF 成本
}
```

### 3. **事件處理更新** (如果子圖原本就有鑄造處理)

```typescript
// mappings/hero.ts
export function handleHeroMinted(event: HeroMinted): void {
  let token = new Token(event.params.tokenId.toString())
  
  // ... 現有邏輯
  
  // V25 新增：標記為優化版
  token.isOptimized = true
  token.vrfCost = BigInt.fromI32(50000) // 0.00005 BNB (單次 VRF)
  
  token.save()
  
  // 更新優化統計
  updateVRFOptimizationStats()
}

function updateVRFOptimizationStats(): void {
  let stats = VRFOptimization.load("v25-optimization")
  if (!stats) {
    stats = new VRFOptimization("v25-optimization")
    stats.totalRequests = BigInt.fromI32(0)
    stats.totalSavings = BigInt.fromI32(0)
    stats.optimizedMints = BigInt.fromI32(0)
  }
  
  stats.optimizedMints = stats.optimizedMints.plus(BigInt.fromI32(1))
  // 假設每次節省 49 × 0.00005 = 0.00245 BNB (98% 節省)
  stats.totalSavings = stats.totalSavings.plus(BigInt.fromI32(2450000000000000)) // 0.00245 BNB in wei
  
  stats.save()
}
```

---

## 🎯 **最小化更新建議**

如果子圖已經正常工作，你只需要：

### ✅ **必須更新**
1. **Hero 地址**：`0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD`
2. **Relic 地址**：`0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4`
3. **起始區塊**：`56688770`
4. **版本號**：`v3.7.0`

### 🔮 **可選新增**
1. **VRF Manager** 索引（如果想追蹤 VRF 統計）
2. **優化效果統計**（展示費用節省）
3. **新事件處理**（如果有新的事件）

### ❌ **不需要的複雜更新**
- ~~Commit-Reveal 狀態追蹤~~
- ~~時間敏感的過期處理~~
- ~~兩階段操作邏輯~~
- ~~複雜的狀態機~~

---

## 📊 **檢查現有子圖是否需要更新**

執行以下查詢確認子圖當前狀態：

```graphql
# 檢查當前索引的合約
query CurrentContracts {
  tokens(first: 5, orderBy: createdAt, orderDirection: desc) {
    id
    tokenId
    tokenType
    owner
    createdAt
    transaction {
      blockNumber
    }
  }
}
```

如果最新的 tokens 來自舊的合約地址且區塊號小於 `56688770`，就需要更新。

---

## 🚀 **部署步驟**

1. **更新 subgraph.yaml**：新地址和起始區塊
2. **編譯並部署**：`npm run deploy`
3. **驗證索引**：確認從新區塊開始索引
4. **測試查詢**：確保新鑄造的 NFT 能被正確索引

---

## 💡 **V25 優化的子圖價值**

雖然邏輯簡化了，但子圖可以展示：

1. **費用節省統計**：用戶看到實際節省了多少 VRF 費用
2. **優化效果**：對比 V24 vs V25 的成本差異
3. **VRF 性能**：統計 VRF 響應時間和成功率

**總結：V25 子圖更新比預期簡單得多，主要是地址更新 + 可選的優化統計！**
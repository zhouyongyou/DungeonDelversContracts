# 📊 子圖配置更新指南

**更新日期**: 2025-08-07  
**版本**: V25 修復版  

## 🎯 更新摘要

由於重新部署了 Hero、Relic 和 AltarOfAscension 三個合約，子圖需要更新合約地址並移除批次等級相關的功能。

## 🆕 新合約地址

```yaml
# 需要更新的合約地址
Hero: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d"      # 舊: 0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0
Relic: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316"     # 舊: 0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366  
AltarOfAscension: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1" # 舊: 0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3
```

## 📝 subgraph.yaml 更新

### 1. 更新數據源地址
```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  # Hero 合約
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d"  # 🆕 新地址
      abi: Hero
      startBlock: 56949320  # 🆕 新部署區塊號
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Hero
        - HeroMinted
        - MintCommitment
      abis:
        - name: Hero
          file: ./abis/Hero.json
      eventHandlers:
        - event: HeroMinted(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroMinted
        - event: MintCommitted(indexed address,uint256,uint256,bool)  
          handler: handleMintCommitted
        # ❌ 移除 BatchTierSet 等批次相關事件
      file: ./src/hero.ts

  # Relic 合約  
  - kind: ethereum/contract
    name: Relic
    network: bsc
    source:
      address: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316"  # 🆕 新地址
      abi: Relic
      startBlock: 56949323  # 🆕 新部署區塊號
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Relic
        - RelicMinted
        - MintCommitment
      abis:
        - name: Relic
          file: ./abis/Relic.json
      eventHandlers:
        - event: RelicMinted(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicMinted
        - event: MintCommitted(indexed address,uint256,uint256,bool)
          handler: handleMintCommitted
        # ❌ 移除 BatchTierSet 等批次相關事件
      file: ./src/relic.ts

  # AltarOfAscension 合約
  - kind: ethereum/contract
    name: AltarOfAscension
    network: bsc
    source:
      address: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1"  # 🆕 新地址
      abi: AltarOfAscension
      startBlock: 56949326  # 🆕 新部署區塊號
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - UpgradeAttempt
        - UpgradeCommitment
      abis:
        - name: AltarOfAscension
          file: ./abis/AltarOfAscension.json
      eventHandlers:
        - event: UpgradeAttempted(indexed address,indexed address,uint8,uint8,uint256[],uint256[],uint8,uint256,uint8,uint8)
          handler: handleUpgradeAttempted
        - event: UpgradeCommitted(indexed address,address,uint8,uint256,uint256[])
          handler: handleUpgradeCommitted
      file: ./src/altar.ts
```

## 🗑️ 需要移除的批次等級功能

### 1. Schema 清理 (schema.graphql)
```graphql
# ❌ 移除這些實體和字段
# type BatchTier @entity {
#   id: ID!
#   tier: BigInt!
#   maxFiveStar: Int!
#   maxFourStar: Int! 
#   maxThreeStar: Int!
#   maxTwoStar: Int!
#   createdAt: BigInt!
# }

type Hero @entity {
  id: ID!
  tokenId: BigInt!
  owner: Bytes!
  rarity: Int!
  power: BigInt!
  # ❌ 移除 batchTier: BatchTier
  isRevealed: Boolean!
  createdAt: BigInt!
}

type Relic @entity {
  id: ID!
  tokenId: BigInt!
  owner: Bytes!
  rarity: Int!
  capacity: Int!
  # ❌ 移除 batchTier: BatchTier
  isRevealed: Boolean!
  createdAt: BigInt!
}

# ✅ 保留但簡化 MintCommitment
type MintCommitment @entity {
  id: ID!
  user: Bytes!
  quantity: BigInt!
  # ❌ 移除 maxRarity: Int (VRF 使所有稀有度相同)
  blockNumber: BigInt!
  fulfilled: Boolean!
  createdAt: BigInt!
}
```

### 2. Mapping 函數清理

#### src/hero.ts
```typescript
import { Hero, MintCommitment } from "../generated/schema";
import { 
  HeroMinted,
  MintCommitted,
  // ❌ 移除 BatchTierSet 
} from "../generated/Hero/Hero";

// ❌ 移除這個函數
// export function handleBatchTierSet(event: BatchTierSet): void { ... }

export function handleHeroMinted(event: HeroMinted): void {
  let hero = new Hero(event.params.tokenId.toString());
  hero.tokenId = event.params.tokenId;
  hero.owner = event.params.owner;
  hero.rarity = event.params.rarity;
  hero.power = event.params.power;
  // ❌ 移除 hero.batchTier = ...
  hero.isRevealed = true;
  hero.createdAt = event.block.timestamp;
  hero.save();
}

export function handleMintCommitted(event: MintCommitted): void {
  let commitment = new MintCommitment(
    event.params.player.toHex() + "-" + event.block.number.toString()
  );
  commitment.user = event.params.player;
  commitment.quantity = event.params.quantity;
  // ❌ 移除 commitment.maxRarity = ...
  commitment.blockNumber = event.params.blockNumber;
  commitment.fulfilled = false;
  commitment.createdAt = event.block.timestamp;
  commitment.save();
}
```

#### src/relic.ts
```typescript  
// 類似 hero.ts 的清理，移除所有批次等級相關代碼
```

### 3. ABI 檔案更新

從 BSCScan 下載新的 ABI 檔案：

```bash
# 下載新的 ABI 檔案
curl "https://api.bscscan.com/api?module=contract&action=getabi&address=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d" \
  | jq -r '.result' > abis/Hero.json

curl "https://api.bscscan.com/api?module=contract&action=getabi&address=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316" \
  | jq -r '.result' > abis/Relic.json

curl "https://api.bscscan.com/api?module=contract&action=getabi&address=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1" \
  | jq -r '.result' > abis/AltarOfAscension.json
```

## 🚀 部署步驟

### 1. 準備工作
```bash
# 確保安裝了 Graph CLI
npm install -g @graphprotocol/graph-cli

# 進入子圖目錄
cd path/to/your/subgraph
```

### 2. 代碼生成
```bash
# 清理舊的生成檔案
rm -rf generated/

# 重新生成代碼
graph codegen

# 構建子圖
graph build
```

### 3. 部署到 The Graph
```bash
# 部署到 Hosted Service (如果使用)
graph deploy --product hosted-service your-username/dungeon-delvers

# 或部署到 Subgraph Studio
graph deploy --studio dungeon-delvers
```

### 4. 驗證部署
- 檢查子圖同步狀態
- 測試重要查詢
- 確認新合約事件被正確索引

## 📋 重要查詢更新

### 需要移除的查詢
```graphql
# ❌ 這些查詢將不再有效
query GetBatchTiers {
  batchTiers {
    id
    tier
    maxFiveStar
    maxFourStar
    maxThreeStar
    maxTwoStar
  }
}

query GetHeroesWithBatchTier {
  heroes {
    id
    tokenId
    batchTier {
      tier
    }
  }
}
```

### 更新後的查詢
```graphql
# ✅ 簡化的查詢
query GetHeroes {
  heroes {
    id
    tokenId
    owner
    rarity
    power
    isRevealed
    createdAt
  }
}

query GetRelics {
  relics {
    id
    tokenId  
    owner
    rarity
    capacity
    isRevealed
    createdAt
  }
}

query GetMintCommitments {
  mintCommitments {
    id
    user
    quantity
    blockNumber
    fulfilled
    createdAt
  }
}
```

## ⚠️ 注意事項

### 數據遷移
1. **歷史數據處理**: 舊合約的數據仍然存在，需要決定是否保留
2. **起始區塊**: 新合約從指定區塊開始索引，之前的數據不會被包含
3. **實體 ID**: 確保新舊數據的 ID 不會衝突

### 測試檢查表
- [ ] 子圖成功部署
- [ ] 新合約事件被正確索引
- [ ] GraphQL 查詢返回正確數據
- [ ] 前端查詢無錯誤
- [ ] 批次等級相關查詢已移除

## 🔄 回滾計劃

如果需要回滾：

1. 保留舊版 `subgraph.yaml` 和 schema 檔案
2. 可以快速切換回舊配置
3. 考慮使用不同的子圖名稱進行測試部署

---

**⚡ 立即行動項目:**
1. 🎯 更新所有合約地址和起始區塊
2. 🗑️ 移除所有批次等級相關代碼  
3. 📥 更新 ABI 檔案
4. 🚀 重新部署子圖
5. 🧪 完整功能測試

*子圖更新完成後，將能正確索引最新的優化合約事件！* 📊
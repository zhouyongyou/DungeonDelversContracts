# 🎯 V25 子圖更新指南

## 📊 重大變化分析

V25 版本引入了**VRF 優化**和**完整的 Commit-Reveal 機制**，對子圖產生重大影響：

### 🔮 **VRF 相關變化**
1. **新增 VRF Manager 合約**：`0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1`
2. **VRF 事件**：`RequestSent`、`RequestFulfilled`
3. **優化實現**：tokenId + 單一隨機數（98% 費用節省）

### 🎲 **Commit-Reveal 機制**
1. **兩階段鑄造**：Commit → Wait → Reveal
2. **時間敏感**：255 區塊揭示窗口（約 12.75 分鐘）
3. **新事件流**：`MintCommitted` → `HeroRevealed`/`RelicRevealed`

---

## 🏗️ **Schema 更新 (schema.graphql)**

### 1. 新增 VRF 相關實體

```graphql
# VRF Manager 相關
type VRFRequest @entity {
  id: ID!                          # requestId
  requester: Bytes!                # 請求者地址
  requestType: String!             # "HERO_MINT", "RELIC_MINT", "ALTAR_UPGRADE", "DUNGEON_EXPLORE"
  numWords: Int!                   # 請求的隨機數數量
  blockNumber: BigInt!             # 請求區塊
  fulfilled: Boolean!              # 是否已完成
  randomWords: [BigInt!]           # 隨機數結果
  fulfillmentBlock: BigInt         # 完成區塊
  createdAt: BigInt!
  fulfilledAt: BigInt
  transaction: Transaction!
}

type VRFManager @entity {
  id: ID!                          # 合約地址
  subscriptionId: BigInt!
  totalRequests: BigInt!
  totalFulfilled: BigInt!
  requestPrice: BigInt!
  lastUpdated: BigInt!
}
```

### 2. Commit-Reveal 實體

```graphql
# 鑄造承諾
type MintCommitment @entity {
  id: ID!                          # commitment hash
  player: Player!                  # 玩家
  type: MintType!                  # HERO 或 RELIC
  blockNumber: BigInt!             # 提交區塊
  quantity: BigInt!                # 數量
  maxRarity: Int!                  # 最大稀有度
  payment: BigInt!                 # 支付金額
  fromVault: Boolean!              # 是否從金庫支付
  commitment: Bytes!               # commitment hash
  fulfilled: Boolean!              # 是否已揭示
  expired: Boolean!                # 是否已過期
  vrfRequest: VRFRequest           # 關聯的 VRF 請求
  mintedTokens: [Token!]           # 鑄造的代幣
  createdAt: BigInt!
  revealedAt: BigInt
  expiredAt: BigInt
  transaction: Transaction!
}

enum MintType {
  HERO
  RELIC
}

# 升級承諾
type UpgradeCommitment @entity {
  id: ID!                          # commitment hash
  player: Player!
  tokenContract: Bytes!            # Hero 或 Relic 合約
  baseRarity: Int!                 # 基礎稀有度
  blockNumber: BigInt!
  materialTokenIds: [BigInt!]!     # 材料 NFT IDs
  materialCount: Int!              # 材料數量
  payment: BigInt!
  fulfilled: Boolean!
  expired: Boolean!
  result: UpgradeResult
  vrfRequest: VRFRequest
  createdAt: BigInt!
  revealedAt: BigInt
  transaction: Transaction!
}

type UpgradeResult @entity {
  id: ID!
  commitment: UpgradeCommitment!
  outcome: UpgradeOutcome!
  targetRarity: Int!
  resultTokenId: BigInt
  createdAt: BigInt!
}

enum UpgradeOutcome {
  FAIL
  PARTIAL_FAIL
  SUCCESS
  GREAT_SUCCESS
}

# 探索承諾
type ExpeditionCommitment @entity {
  id: ID!
  player: Player!
  party: Party!
  dungeon: Dungeon!
  blockNumber: BigInt!
  fulfilled: Boolean!
  expired: Boolean!
  success: Boolean
  rewards: [ExpeditionReward!]
  vrfRequest: VRFRequest
  createdAt: BigInt!
  revealedAt: BigInt
  transaction: Transaction!
}
```

### 3. 更新現有實體

```graphql
# 更新 Player 實體
type Player @entity {
  id: ID!
  # ... 現有欄位
  
  # 新增 Commit-Reveal 相關
  pendingMints: [MintCommitment!]! @derivedFrom(field: "player")
  pendingUpgrades: [UpgradeCommitment!]! @derivedFrom(field: "player")
  pendingExpeditions: [ExpeditionCommitment!]! @derivedFrom(field: "player")
  
  # VRF 統計
  totalVrfRequests: BigInt!
  totalVrfFulfilled: BigInt!
  vrfExpiredCount: BigInt!        # 過期次數
  
  # Commit-Reveal 統計
  totalCommits: BigInt!
  totalReveals: BigInt!
  totalExpired: BigInt!
  
  lastMintCommit: BigInt          # 最後鑄造提交時間
  lastUpgradeCommit: BigInt       # 最後升級提交時間
}

# 更新 Token 實體
type Token @entity {
  id: ID!
  # ... 現有欄位
  
  # 新增 VRF 相關
  mintCommitment: MintCommitment   # 關聯的鑄造承諾
  vrfRequest: VRFRequest           # 使用的 VRF 請求
  randomSeed: BigInt               # 用於生成的隨機種子
  
  # 優化標記
  optimizedVrf: Boolean!           # 是否使用 V25 優化版 VRF
  generationMethod: String         # "LEGACY" 或 "TOKENID_PLUS_RANDOM"
}
```

---

## 📝 **Mapping 更新**

### 1. VRF Manager 事件處理

```typescript
// src/mappings/vrf.ts
import { RequestSent, RequestFulfilled } from '../generated/VRFConsumerV2Plus/VRFConsumerV2Plus'
import { VRFRequest, VRFManager } from '../generated/schema'

export function handleRequestSent(event: RequestSent): void {
  let request = new VRFRequest(event.params.requestId.toString())
  request.requester = event.transaction.from
  request.requestType = determineRequestType(event.address, event.transaction.input)
  request.numWords = event.params.numWords
  request.blockNumber = event.block.number
  request.fulfilled = false
  request.createdAt = event.block.timestamp
  request.transaction = event.transaction.hash.toHex()
  request.randomWords = []
  
  request.save()
  
  // 更新 VRF Manager 統計
  let manager = VRFManager.load(event.address.toHex())
  if (!manager) {
    manager = new VRFManager(event.address.toHex())
    manager.totalRequests = BigInt.fromI32(0)
    manager.totalFulfilled = BigInt.fromI32(0)
  }
  manager.totalRequests = manager.totalRequests.plus(BigInt.fromI32(1))
  manager.lastUpdated = event.block.timestamp
  manager.save()
}

export function handleRequestFulfilled(event: RequestFulfilled): void {
  let request = VRFRequest.load(event.params.requestId.toString())
  if (!request) return
  
  request.fulfilled = true
  request.randomWords = event.params.randomWords
  request.fulfillmentBlock = event.block.number
  request.fulfilledAt = event.block.timestamp
  request.save()
  
  // 更新統計
  let manager = VRFManager.load(event.address.toHex())
  if (manager) {
    manager.totalFulfilled = manager.totalFulfilled.plus(BigInt.fromI32(1))
    manager.save()
  }
}

function determineRequestType(contractAddress: Address, input: Bytes): string {
  // 根據調用的合約和方法確定類型
  // 這需要根據實際的合約調用來判斷
  return "HERO_MINT" // 預設值，需要實際實現邏輯
}
```

### 2. Hero/Relic Commit-Reveal 處理

```typescript
// src/mappings/hero.ts
import { MintCommitted, HeroRevealed, HeroMinted } from '../generated/Hero/Hero'
import { MintCommitment, Player, Token } from '../generated/schema'

export function handleMintCommitted(event: MintCommitted): void {
  // 生成 commitment ID
  let commitmentId = event.params.player.toHex() + "-" + event.params.blockNumber.toString()
  let commitment = new MintCommitment(commitmentId)
  
  commitment.player = event.params.player.toHex()
  commitment.type = "HERO"
  commitment.blockNumber = event.params.blockNumber
  commitment.quantity = event.params.quantity
  commitment.fromVault = event.params.fromVault
  commitment.fulfilled = false
  commitment.expired = false
  commitment.createdAt = event.block.timestamp
  commitment.transaction = event.transaction.hash.toHex()
  
  // 從合約讀取詳細信息
  let contract = Hero.bind(event.address)
  let commitmentData = contract.getUserCommitment(event.params.player)
  commitment.maxRarity = commitmentData.maxRarity
  commitment.payment = commitmentData.payment
  commitment.commitment = commitmentData.commitment
  
  commitment.save()
  
  // 更新玩家統計
  updatePlayerCommitStats(event.params.player.toHex())
}

export function handleHeroRevealed(event: HeroRevealed): void {
  // 找到對應的 commitment
  let commitmentId = findMintCommitment(event.params.owner, event.block.number)
  if (!commitmentId) return
  
  let commitment = MintCommitment.load(commitmentId)
  if (!commitment) return
  
  commitment.fulfilled = true
  commitment.revealedAt = event.block.timestamp
  commitment.save()
  
  // 更新 Token 關聯
  let token = Token.load(event.params.tokenId.toString())
  if (token) {
    token.mintCommitment = commitmentId
    token.optimizedVrf = true  // V25 優化版
    token.generationMethod = "TOKENID_PLUS_RANDOM"
    token.save()
  }
}

export function handleHeroMinted(event: HeroMinted): void {
  let token = new Token(event.params.tokenId.toString())
  token.tokenId = event.params.tokenId
  token.owner = event.params.owner.toHex()
  token.tokenType = "HERO"
  token.rarity = event.params.rarity
  token.power = event.params.power
  token.createdAt = event.block.timestamp
  token.optimizedVrf = true  // V25 版本預設為優化版
  token.save()
}

function findMintCommitment(player: Address, blockNumber: BigInt): string | null {
  // 在實際實現中，需要根據時間窗口查找 commitment
  // 這裡簡化為固定格式
  return player.toHex() + "-" + blockNumber.toString()
}

function updatePlayerCommitStats(playerId: string): void {
  let player = Player.load(playerId)
  if (!player) {
    player = new Player(playerId)
    player.totalCommits = BigInt.fromI32(0)
    player.totalReveals = BigInt.fromI32(0)
    player.totalExpired = BigInt.fromI32(0)
  }
  
  player.totalCommits = player.totalCommits.plus(BigInt.fromI32(1))
  player.lastMintCommit = event.block.timestamp
  player.save()
}
```

### 3. 過期處理機制

```typescript
// src/utils/expiration.ts
import { MintCommitment, UpgradeCommitment } from '../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'

export function checkAndMarkExpired(blockNumber: BigInt): void {
  // 檢查並標記過期的 commitments
  let expirationBlock = blockNumber.minus(BigInt.fromI32(258)) // 255 + 3 區塊
  
  // 這需要在每個區塊處理時調用
  // 實際實現需要查詢所有未完成的 commitments
}

export function isCommitmentExpired(commitmentBlock: BigInt, currentBlock: BigInt): boolean {
  return currentBlock.gt(commitmentBlock.plus(BigInt.fromI32(258)))
}

export function canReveal(commitmentBlock: BigInt, currentBlock: BigInt): boolean {
  return currentBlock.ge(commitmentBlock.plus(BigInt.fromI32(3))) && 
         currentBlock.le(commitmentBlock.plus(BigInt.fromI32(258)))
}
```

---

## 🔧 **子圖配置更新 (subgraph.yaml)**

```yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  # 新增 VRF Manager
  - kind: ethereum/contract
    name: VRFConsumerV2Plus
    network: bsc
    source:
      address: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
      abi: VRFConsumerV2Plus
      startBlock: 56688770  # V25 起始區塊
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      file: ./src/mappings/vrf.ts
      entities:
        - VRFRequest
        - VRFManager
      abis:
        - name: VRFConsumerV2Plus
          file: ./abis/VRFConsumerV2Plus.json
      eventHandlers:
        - event: RequestSent(uint256,uint32)
          handler: handleRequestSent
        - event: RequestFulfilled(uint256,uint256[])
          handler: handleRequestFulfilled

  # 更新 Hero 合約
  - kind: ethereum/contract
    name: Hero
    source:
      address: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD"  # 新地址
      abi: Hero
      startBlock: 56688770
    mapping:
      eventHandlers:
        - event: MintCommitted(address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: HeroRevealed(uint256,address,uint8,uint256)
          handler: handleHeroRevealed
        - event: HeroMinted(uint256,address,uint8,uint256)
          handler: handleHeroMinted
        - event: ForcedRevealExecuted(address,address,uint256)
          handler: handleForcedRevealExecuted
        - event: VRFManagerSet(address)
          handler: handleVRFManagerSet

  # 更新 Relic 合約
  - kind: ethereum/contract
    name: Relic
    source:
      address: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4"  # 新地址
      abi: Relic
      startBlock: 56688770
    mapping:
      eventHandlers:
        - event: MintCommitted(address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: RelicRevealed(uint256,address,uint8,uint8)
          handler: handleRelicRevealed
        - event: RelicMinted(uint256,address,uint8,uint8)
          handler: handleRelicMinted
```

---

## 📊 **新增 GraphQL 查詢**

### 1. 玩家待處理操作

```graphql
query PlayerPendingOperations($player: String!, $currentBlock: BigInt!) {
  player(id: $player) {
    pendingMints(where: { fulfilled: false }) {
      id
      type
      blockNumber
      quantity
      maxRarity
      createdAt
      canReveal: blockNumber_lte: $currentBlock_minus_3
      isExpired: blockNumber_lt: $currentBlock_minus_258
      timeRemaining
    }
    pendingUpgrades(where: { fulfilled: false }) {
      id
      baseRarity
      materialCount
      blockNumber
      createdAt
    }
  }
}
```

### 2. VRF 統計

```graphql
query VRFStats {
  vrfManager(id: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1") {
    totalRequests
    totalFulfilled
    requestPrice
    lastUpdated
  }
  
  vrfRequests(
    first: 10
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    requester
    requestType
    fulfilled
    createdAt
    fulfilledAt
  }
}
```

---

## ⚠️ **重要提醒**

### 🔴 **關鍵變更**
1. **起始區塊**：必須設為 `56688770`
2. **合約地址**：Hero 和 Relic 使用新的優化版地址
3. **VRF Manager**：新增 VRF 合約索引
4. **時間敏感**：255 區塊揭示窗口需要準確追蹤

### 🎯 **優化重點**
1. **費用節省**：新版本 VRF 費用節省 98%
2. **隨機數生成**：tokenId + 單一隨機數的新機制
3. **用戶體驗**：需要準確顯示 commit-reveal 狀態

### 📋 **部署檢查清單**
- [ ] Schema 更新完成
- [ ] Mapping 新增 VRF 處理
- [ ] 合約地址更新為 V25 版本
- [ ] 起始區塊設為 56688770
- [ ] 測試 commit-reveal 流程
- [ ] 驗證過期處理機制
- [ ] 確認 VRF 統計正確

**V25 子圖更新完成後，將能完整支援新的 VRF 優化和 Commit-Reveal 機制！**
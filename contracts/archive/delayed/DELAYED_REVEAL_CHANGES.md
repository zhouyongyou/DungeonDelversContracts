# 🔄 延遲揭示系統改動記錄

## 📋 總覽

本次更新在原有合約基礎上添加了 Commit-Reveal 機制，保持原有函數結構和順序，僅修改必要部分以支援延遲揭示。

### 核心改動原則：
1. 保留原有合約結構和函數順序
2. 將原本的單步驟操作拆分為 commit 和 reveal 兩步
3. 添加必要的狀態存儲和查詢函數
4. 保持與其他合約的接口兼容性

---

## 1️⃣ Hero_DelayedReveal.sol 改動

### 新增結構體：
```solidity
// 在原有 HeroData 之前添加
struct CommitData {
    uint256 blockNumber;
    uint256 quantity;
    uint256 payment;
    bytes32 commitment;
    bool revealed;
    uint8 maxRarity;
}

// 修改 HeroData 結構
struct HeroData {
    uint8 rarity;
    uint256 power;
    bool isRevealed;  // 新增字段
}
```

### 新增狀態變量：
```solidity
// 在原有映射之後添加
mapping(address => CommitData) public userCommitments;
mapping(address => uint256[]) public userUnrevealedTokens;
string public unrevealedURI = "ipfs://QmUnrevealedHero/";
uint256 public constant REVEAL_BLOCK_DELAY = 3;
uint256 public constant MAX_REVEAL_WINDOW = 255;
```

### 函數改動：

1. **原 `mintFromWallet` → 拆分為兩個函數：**
```solidity
// 第一步：提交
function commitMintFromWallet(uint256 _quantity, bytes32 _commitment) external payable
// 第二步：揭示
function revealMint(uint256 _nonce) external
```

2. **原 `mintFromVault` → 改為：**
```solidity
function commitMintFromVault(uint256 _quantity, bytes32 _commitment) external payable
// 共用 revealMint 進行揭示
```

3. **修改 `tokenURI` 函數：**
```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    _requireOwned(tokenId);
    
    // 新增：檢查是否已揭示
    if (!heroData[tokenId].isRevealed) {
        return string(abi.encodePacked(unrevealedURI, Strings.toString(tokenId)));
    }
    
    // 原有邏輯
    require(bytes(baseURI).length > 0, "Hero: baseURI not set");
    return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
}
```

4. **新增查詢函數：**
```solidity
function getUserCommitment(address _user) external view returns (CommitData memory)
function getUserUnrevealedTokens(address _user) external view returns (uint256[] memory)
function canReveal(address _user) external view returns (bool)
function getRevealBlocksRemaining(address _user) external view returns (uint256)
```

5. **新增緊急退款：**
```solidity
function emergencyRefund() external nonReentrant
```

### 保持不變的函數：
- `mintFromAltar` - 祭壇鑄造仍然是即時的
- `burnFromAltar` - 燃燒邏輯不變
- 所有 owner 管理函數
- 所有查詢函數（除了新增的）

---

## 2️⃣ Relic_DelayedReveal.sol 改動

### 結構與 Hero 相同的改動：
- 添加 `CommitData` 結構
- 修改 `RelicData` 添加 `isRevealed` 字段
- 相同的延遲揭示常量和映射

### 函數改動（與 Hero 平行）：
1. `mintFromWallet` → `commitMintFromWallet` + `revealMint`
2. `mintFromVault` → `commitMintFromVault` + `revealMint`
3. 修改 `tokenURI` 支援未揭示狀態
4. 添加相同的查詢函數

### 特有改動：
- `_generateRelicEffectByRarity` 保持原有邏輯
- `getRelicData` 返回值包含 `isRevealed`

---

## 3️⃣ AltarOfAscension_DelayedReveal.sol 改動

### 新增結構體：
```solidity
struct CommitData {
    uint256 blockNumber;
    uint8 ascensionType;  // 1: Hero, 2: Relic
    uint8 baseRarity;
    uint256 materialsCount;
    uint256[] tokenIds;   // 存儲材料 NFT ID
    bytes32 commitment;
    bool revealed;
    address player;
}
```

### 新增映射：
```solidity
mapping(bytes32 => CommitData) public ascensionCommitments;
mapping(address => bytes32[]) public userPendingAscensions;
```

### 函數改動：

1. **原 `ascendHero` → 拆分為：**
```solidity
function commitAscendHero(uint256[] calldata _heroIds, bytes32 _commitment) external
function revealAscension(bytes32 _commitmentId, uint256 _nonce) external
```

2. **原 `ascendRelic` → 拆分為：**
```solidity
function commitAscendRelic(uint256[] calldata _relicIds, bytes32 _commitment) external
// 共用 revealAscension
```

### 防重複使用機制：
- **已實現**：材料 NFT 在 commit 時就被驗證所有權
- **保護措施**：
  1. 生成唯一 commitmentId 防止重放
  2. revealed 標記防止重複揭示
  3. 區塊號檢查確保時序正確

### 新增函數：
```solidity
function emergencyReturn(bytes32 _commitmentId) external  // 超時退還材料
function getUserPendingAscensions(address _user) external view
function getCommitmentDetails(bytes32 _commitmentId) external view
```

---

## 4️⃣ DungeonMaster_DelayedReveal.sol 改動

### 新增結構體：
```solidity
struct ExpeditionCommit {
    uint256 blockNumber;
    uint256 partyId;
    uint256 dungeonId;
    bytes32 commitment;
    bool revealed;
    address player;
}
```

### 函數改動：

1. **原 `requestExpedition` → 改為：**
```solidity
function commitExpedition(uint256 _partyId, uint256 _dungeonId, bytes32 _commitment) external
```

2. **原 `fulfillExpedition` → 改為：**
```solidity
function revealExpedition(bytes32 _commitmentId, uint256 _nonce) external
```

### 防重複使用機制：
- **立即生效**：`dungeonStorage.setPartyCooldown(_partyId)` 在 commit 時就執行
- **保護措施**：隊伍立即進入冷卻，防止同一隊伍被重複使用

### 新增函數：
```solidity
function emergencyCancel(bytes32 _commitmentId) external
function getUserPendingExpeditions(address _user) external view
function getCommitmentDetails(bytes32 _commitmentId) external view
```

---

## 🔑 關鍵安全特性

### 1. 時間窗口保護：
- 必須等待 3 個區塊才能揭示（約 15 秒）
- 最多 255 個區塊內必須揭示（約 12.75 分鐘）
- 超時可申請退款/退還

### 2. 防重放攻擊：
- 每個 commitment 使用唯一 ID
- revealed 標記防止重複使用
- nonce 驗證確保用戶身份

### 3. 隨機數生成：
```solidity
uint256 randomValue = uint256(keccak256(abi.encodePacked(
    blockhash(revealBlockNumber),  // 未來區塊哈希
    _nonce,                        // 用戶密鑰
    dynamicSeed,                   // 動態種子
    // ... 其他參數
)));
```

### 4. 資產保護：
- 所有合約都有 emergencyRefund/Return 機制
- 超時自動解鎖資產
- 完整的事件日誌便於追蹤

---

## 📊 對比總結

| 功能 | 原版 | 延遲揭示版 |
|------|------|------------|
| 鑄造 Hero/Relic | 1 筆交易，立即獲得屬性 | 2 筆交易，延遲揭示屬性 |
| 升星祭壇 | 立即知道結果 | 提交材料後延遲揭示結果 |
| 地城探索 | 請求後等待 Oracle 回調 | Commit-Reveal 自主揭示 |
| 防礦工操控 | 依賴區塊變量 | 完全防護（未來區塊哈希） |
| Gas 成本 | 較低（1筆交易） | 較高（2筆交易） |
| 用戶體驗 | 即時反饋 | 需等待 15 秒 |
| 安全性 | 中等 | 極高 |

---

## 🚀 部署建議

1. **部署順序：**
   - 先部署 NFT 合約（Hero, Relic）
   - 再部署遊戲邏輯合約（Altar, DungeonMaster）
   - 最後連接所有合約

2. **測試重點：**
   - Commit 後立即嘗試 reveal（應該失敗）
   - 等待 3 個區塊後 reveal（應該成功）
   - 測試 emergencyRefund 各種邊界情況
   - 驗證隨機性分布

3. **前端整合：**
   - 實現 nonce 生成和本地儲存
   - 添加區塊倒計時顯示
   - 自動檢測可揭示的 commitments
   - 批量揭示功能優化 Gas

4. **監控指標：**
   - 平均揭示等待時間
   - 超時退款比例
   - 用戶完成率
   - Gas 成本統計
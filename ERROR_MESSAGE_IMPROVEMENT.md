# 📝 錯誤訊息改進計畫

## 🚨 問題概述

當前合約中存在大量極度簡陋的錯誤訊息（單字母、2-3字母縮寫），嚴重影響調試效率和用戶體驗。

## 📊 掃描結果統計

- **總計發現問題**：24 個
- **極嚴重（單字母）**：8 個
- **高嚴重（2-3字母）**：9 個  
- **中等嚴重（模糊縮寫）**：7 個

---

## 🔴 極嚴重 - 單字母錯誤訊息

### Hero.sol
```solidity
// 當前問題
require(rarity > 0 && rarity <= 5, "R");  // 行 277
require(bytes(baseURI).length > 0, "B");  // 行 284
require(address(dungeonCoreContract) != address(0), "D");  // 行 289
(bool success, ) = to.call{value: amount}("");
require(success, "F");  // 行 356

// 建議改進
require(rarity > 0 && rarity <= 5, "Hero: Invalid rarity value");
require(bytes(baseURI).length > 0, "Hero: Base URI not configured");
require(address(dungeonCoreContract) != address(0), "Hero: DungeonCore not set");
require(success, "Hero: ETH transfer failed");
```

### Relic.sol
```solidity
// 當前問題
require(bytes(baseURI).length > 0, "B");  // 行 278
require(address(dungeonCoreContract) != address(0), "D");  // 行 283
require(success, "F");  // 行 356

// 建議改進
require(bytes(baseURI).length > 0, "Relic: Base URI not configured");
require(address(dungeonCoreContract) != address(0), "Relic: DungeonCore not set");
require(success, "Relic: ETH transfer failed");
```

### Oracle.sol
```solidity
// 當前問題
require(tick < 887272 && tick > -887272, "T");  // 行 71

// 建議改進
require(tick < 887272 && tick > -887272, "Oracle: Tick out of range");
```

---

## 🟠 高嚴重性 - 2-3字母縮寫

### Hero.sol
```solidity
// 當前問題
require(msg.sender == dungeonCoreContract.altarOfAscensionAddress(), "NA");  // 行 62
require(quantity > 0 && quantity <= 50, "IQ");  // 行 74, 129
require(!userRequests[msg.sender].pending, "PM");  // 行 75, 130
require(msg.value >= totalCost, "IP");  // 行 82
require(userRequests[msg.sender].payment >= totalCost, "IV");  // 行 137

// 建議改進
require(msg.sender == dungeonCoreContract.altarOfAscensionAddress(), 
        "Hero: Not authorized - Altar only");
require(quantity > 0 && quantity <= 50, 
        "Hero: Invalid quantity 1-50");
require(!userRequests[msg.sender].pending, 
        "Hero: Previous mint pending");
require(msg.value >= totalCost, 
        "Hero: Insufficient payment");
require(userRequests[msg.sender].payment >= totalCost, 
        "Hero: Insufficient vault balance");
```

### Relic.sol（相同模式）
```solidity
// 與 Hero.sol 類似的改進
"NA" → "Relic: Not authorized - Altar only"
"IQ" → "Relic: Invalid quantity 1-50"
"PM" → "Relic: Previous mint pending"
"IP" → "Relic: Insufficient payment"
"IV" → "Relic: Insufficient vault balance"
```

---

## 🟡 中等嚴重性 - DM 系列

### DungeonMaster.sol
```solidity
// 當前問題
require(!userExpeditionRequests[msg.sender].pending, 
        "DM: Previous expedition pending");  // 行 73
require(partyOwner == msg.sender, 
        "DM: Not party owner");  // 行 77
require(address(partyContract) != address(0) && 
        address(dungeonStorageContract) != address(0), 
        "DM: Core contracts not set");  // 行 79
require(capacity > 0, 
        "DM: Dungeon DNE");  // 行 85
require(block.timestamp >= partyCooldowns[_partyId] + cooldownPeriod, 
        "DM: Party on cooldown");  // 行 86
require(partyPower >= capacity * 7 / 10, 
        "DM: Power too low");  // 行 90
require(msg.value == totalCost, 
        "DM: Exact payment required");  // 行 93

// 建議改進
"DM: Previous expedition pending" 
    → "DungeonMaster: Expedition already pending"
"DM: Not party owner" 
    → "DungeonMaster: Caller not party owner"
"DM: Core contracts not set" 
    → "DungeonMaster: Contracts not configured"
"DM: Dungeon DNE" 
    → "DungeonMaster: Dungeon does not exist"
"DM: Party on cooldown" 
    → "DungeonMaster: Party still on cooldown"
"DM: Power too low" 
    → "DungeonMaster: Insufficient party power"
"DM: Exact payment required" 
    → "DungeonMaster: Exact fee required"
```

---

## 💡 現代化解決方案

### 方案 A：使用自定義錯誤（推薦）

```solidity
// 定義自定義錯誤
error InvalidQuantity(uint256 provided, uint256 min, uint256 max);
error InsufficientPayment(uint256 required, uint256 provided);
error PreviousRequestPending();
error NotAuthorized(address caller, address expected);

// 使用範例
if (quantity == 0 || quantity > 50) {
    revert InvalidQuantity(quantity, 1, 50);
}
if (msg.value < totalCost) {
    revert InsufficientPayment(totalCost, msg.value);
}
```

**優點**：
- ✅ Gas 效率高（比字符串便宜）
- ✅ 可攜帶動態數據
- ✅ 前端可解析成用戶友好訊息

### 方案 B：統一錯誤碼系統

```solidity
// 錯誤碼定義
library ErrorCodes {
    string constant E001 = "Invalid quantity";
    string constant E002 = "Insufficient payment";
    string constant E003 = "Request pending";
    string constant E004 = "Not authorized";
}

// 使用
require(quantity > 0 && quantity <= 50, ErrorCodes.E001);
```

### 方案 C：完整錯誤訊息（簡單直接）

直接將所有縮寫改為完整描述性訊息。

**優點**：
- ✅ 最容易理解和調試
- ✅ 無需額外文檔

**缺點**：
- ❌ 部署 Gas 較高（約增加 20-30%）

---

## 📋 執行計畫

### Phase 1：評估（Day 1）
- [ ] 計算改進後的 Gas 成本差異
- [ ] 選擇解決方案（自定義錯誤 vs 完整訊息）
- [ ] 制定錯誤訊息規範

### Phase 2：實施（Day 2-3）
- [ ] 更新 Hero.sol（8 個錯誤）
- [ ] 更新 Relic.sol（8 個錯誤）
- [ ] 更新 DungeonMaster.sol（7 個錯誤）
- [ ] 更新 Oracle.sol（1 個錯誤）

### Phase 3：測試（Day 4）
- [ ] 編譯測試
- [ ] Gas 成本對比
- [ ] 錯誤觸發測試

### Phase 4：文檔（Day 5）
- [ ] 創建錯誤碼對照表
- [ ] 更新前端錯誤處理
- [ ] 更新開發文檔

---

## 🎯 錯誤訊息規範

### 格式標準
```
{ContractName}: {ErrorDescription}
```

### 範例
- ✅ 好：`"Hero: Invalid quantity must be 1-50"`
- ✅ 好：`"DungeonMaster: Party still on cooldown"`
- ❌ 差：`"IQ"`
- ❌ 差：`"Error"`

### 長度建議
- 最短：10 個字符
- 理想：20-40 個字符
- 最長：50 個字符

---

## 📊 預期效益

1. **調試效率提升 80%**
   - 開發者可立即理解錯誤原因

2. **用戶體驗改善**
   - 前端可顯示有意義的錯誤提示

3. **維護成本降低**
   - 減少因錯誤訊息不清導致的支援工單

4. **Gas 成本影響**
   - 自定義錯誤：幾乎無影響
   - 完整訊息：部署成本增加約 20-30%
   - 執行成本：無影響（錯誤訊息不消耗執行 Gas）

---

## 🚨 風險評估

- **低風險**：不影響合約邏輯
- **中風險**：需要重新部署合約
- **可逆性**：可隨時回滾到舊版本

---

**最後更新**：2025-01-16
**優先級**：中高
**預計工時**：5 天
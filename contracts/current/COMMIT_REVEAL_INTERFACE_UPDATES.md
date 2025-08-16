# 🔄 Commit-Reveal 介面更新摘要

## 📅 更新日期：2025-08-03

---

## ✅ 兼容性檢查結果

### 1. **Hero/Relic 與 AltarOfAscension**
- **狀態**：✅ 完全兼容
- **原因**：
  - `mintFromAltar()` 和 `burnFromAltar()` 函數簽名保持不變
  - 新增的 `isRevealed` 檢查不影響祭壇操作（祭壇只燒毀已揭示的 NFT）
  - 祭壇立即燃燒材料的機制與新合約邏輯一致

### 2. **DungeonMaster 與其他合約**
- **狀態**：✅ 完全兼容
- **原因**：
  - 保留了所有原有功能
  - 新增的 Commit-Reveal 函數不影響現有交互

---

## 🆕 介面更新內容

### IHero 介面新增：
```solidity
// === Commit-Reveal Functions ===
function revealMint() external;
function revealMintFor(address user) external;
function forceRevealExpired(address user) external;
function canReveal(address user) external view returns (bool);
function canForceReveal(address user) external view returns (bool);
function getRevealBlocksRemaining(address user) external view returns (uint256);
```

### IRelic 介面新增：
```solidity
// === Commit-Reveal Functions ===
function revealMint() external;
function revealMintFor(address user) external;
function forceRevealExpired(address user) external;
function canReveal(address user) external view returns (bool);
function canForceReveal(address user) external view returns (bool);
function getRevealBlocksRemaining(address user) external view returns (uint256);
```

### IAltarOfAscension 介面新增：
```solidity
// === Commit-Reveal Functions ===
function revealUpgrade() external;
function revealUpgradeFor(address user) external;
function forceRevealExpired(address user) external;
function canReveal(address user) external view returns (bool);
function canForceReveal(address user) external view returns (bool);
function getRevealBlocksRemaining(address user) external view returns (uint256);
```

### IDungeonMaster 介面新增：
```solidity
// === Commit-Reveal Functions ===
function requestExpedition(uint256 _partyId, uint256 _dungeonId) external payable;
function revealExpedition() external;
function revealExpeditionFor(address user) external;
function forceRevealExpired(address user) external;
function canReveal(address user) external view returns (bool);
function canForceReveal(address user) external view returns (bool);
function getRevealBlocksRemaining(address user) external view returns (uint256);
```

---

## 📋 需要更新的地方

### 1. **前端調用**
- 原本的單步驟調用需要改為兩步驟：
  1. 調用 mint/upgrade/request 函數
  2. 等待 3 個區塊後調用 reveal 函數

### 2. **事件監聽**
需要新增監聽的事件：
- `MintCommitted` / `UpgradeCommitted` / `ExpeditionCommitted`
- `HeroRevealed` / `RelicRevealed` / `ExpeditionRevealed`
- `ForcedRevealExecuted`
- `RevealedByProxy`

### 3. **狀態查詢**
前端需要使用新的查詢函數：
- `canReveal()` - 檢查是否可以揭示
- `canForceReveal()` - 檢查是否可以強制揭示
- `getRevealBlocksRemaining()` - 獲取剩餘區塊數

---

## ⚠️ 注意事項

1. **時間窗口**：
   - 等待期：3 個區塊（約 2.25 秒）
   - 揭示窗口：255 個區塊（約 3.19 分鐘）
   - 過期後任何人都可以強制揭示

2. **無法燒毀未揭示的 NFT**：
   - Hero 和 Relic 都有 `require(data.isRevealed)` 檢查
   - 確保升級或其他操作前已完成揭示

3. **自動揭示服務**：
   - 建議部署自動揭示服務保護用戶
   - 服務會在最後 30 秒自動觸發揭示

---

## 🔗 相關文件

- [強制揭示實施文檔](./commitReveal/FORCED_REVEAL_FINAL_IMPLEMENTATION.md)
- [自動揭示服務設置](../scripts/auto-reveal-setup.md)
- [部署指南](../scripts/deploy-auto-reveal-service.md)

---

*最後更新：2025-08-03*
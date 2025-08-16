# 📋 ABI 更新檢查清單

## 🚨 重要提醒
當合約代碼更新後，需要重新生成 ABI 並同步到前端和子圖。

## 📅 更新日期：2025-01-16

### 🔄 需要更新 ABI 的合約

#### 1. **Hero.sol** ⚠️ 
- **狀態**：待更新
- **變更內容**：
  - 從雙步驟 mint + reveal 改為單步驟 VRF 回調模式
  - 移除 `revealMint()`, `revealMintFor()`, `getUserPendingTokens()` 函數
  - 新增 `pendingTokenIds` 到 `MintRequest` struct
  - 新增 `requestIdToUser` mapping
- **影響範圍**：
  - 前端：需要移除 reveal 相關邏輯
  - 子圖：移除 `HeroRevealed` 事件處理
- **檔案位置**：
  - 源碼：`contracts/current/nft/Hero.sol` (從 Hero_final_v2.sol 複製)
  - 舊版：`contracts/current/nft/old_Hero.sol`

#### 2. **AltarOfAscension.sol** ✅
- **狀態**：代碼已優化，ABI 待更新
- **變更內容**：
  - 標準化 VRF 回調模式
  - 新增 `getUpgradeCost()` 函數
  - 新增 `emergencyUnlock()` 函數
- **影響範圍**：
  - 前端：可選用新的費用查詢函數
  - 子圖：無影響（事件結構未變）
- **檔案位置**：
  - 源碼：`contracts/current/core/AltarOfAscension.sol`
  - 舊版：`contracts/current/core/old_AltarOfAscension.sol`

#### 3. **Relic.sol** ⚠️
- **狀態**：待更新
- **變更內容**：
  - 與 Hero 相同的架構變更：雙步驟改為單步驟
  - 移除 `revealMint()`, `revealMintFor()`, `getUserPendingTokens()` 函數
  - 移除 `RelicRevealed` 事件
  - 新增 `requestIdToUser` mapping
  - 新增 `pendingTokenIds` 到 `MintRequest` struct
- **影響範圍**：
  - 前端：需要移除 reveal 相關邏輯
  - 子圖：移除 `RelicRevealed` 事件處理
- **檔案位置**：
  - 源碼：`contracts/current/nft/Relic_final.sol` (新版)
  - 當前：`contracts/current/nft/Relic.sol`

#### 4. **DungeonMaster.sol** ⚠️
- **狀態**：待更新
- **變更內容**：
  - 標準化 VRF 回調模式
  - 新增 `requestIdToUser` mapping
  - 移除手動 reveal 相關函數
  - 直接在 `onVRFFulfilled` 中處理探索邏輯
- **影響範圍**：
  - 前端：簡化探索流程
  - 子圖：可能需要調整事件處理
- **檔案位置**：`contracts/current/core/DungeonMaster.sol`

#### 5. **VRFConsumerV2Plus.sol** 🆕
- **狀態**：全新合約
- **變更內容**：
  - 全新的 VRF 管理層
  - 標準回調模式實現
  - 統一的隨機數請求接口
  - 安全的回調機制（防止 revert 影響）
- **影響範圍**：
  - 前端：需要了解新的 VRF 管理模式
  - 子圖：可能需要監聽新的事件
- **檔案位置**：`contracts/current/core/VRFConsumerV2Plus.sol`

### 📍 ABI 文件位置

#### 前端 ABI 位置
```
/Users/sotadic/Documents/GitHub/DungeonDelvers/src/contracts/abi/
├── Hero.json
├── Relic.json
├── AltarOfAscension.json
├── DungeonMaster.json
└── ...
```

#### 子圖 ABI 位置
```
/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/
├── Hero.json
├── Relic.json
├── AltarOfAscension.json
├── DungeonMaster.json
└── ...
```

### 🛠️ 更新流程

1. **編譯合約**
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
npx hardhat compile --force
```

2. **提取 ABI**
```bash
# 以 Hero 為例
cat artifacts/contracts/current/nft/Hero.sol/Hero.json | jq '.abi' > temp_abi.json
```

3. **複製到前端**
```bash
cp temp_abi.json /Users/sotadic/Documents/GitHub/DungeonDelvers/src/contracts/abi/Hero.json
```

4. **複製到子圖**
```bash
cp temp_abi.json /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/Hero.json
```

5. **重新部署子圖**
```bash
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run codegen
npm run build
graph deploy ...
```

### ⚠️ 注意事項

1. **接口文件已更新**
   - `interfaces.sol` 中的 `IHero` 接口已更新
   - 移除了過時的函數定義

2. **破壞性變更**
   - Hero 合約的 reveal 機制完全改變
   - 前端需要相應調整調用邏輯

3. **版本控制**
   - 建議在更新 ABI 前備份舊版本
   - 可以使用 git 追蹤 ABI 變更歷史

### 🚨 架構升級總結

**核心變更：從「雙步驟 VRF」升級到「單步驟 VRF 回調」模式**

1. **影響的合約**：
   - Hero ⚠️
   - Relic ⚠️
   - DungeonMaster ⚠️
   - AltarOfAscension ✅（已優化）
   - VRFConsumerV2Plus 🆕（新增）

2. **統一的變更模式**：
   - 移除所有 `reveal*` 函數
   - 移除 `*Revealed` 事件
   - 新增 `requestIdToUser` mapping
   - 直接在 VRF 回調中完成業務邏輯

3. **優勢**：
   - 用戶體驗：一筆交易完成（原需兩筆）
   - Gas 成本：減少約 50%
   - 代碼複雜度：大幅降低

### 📝 TODO

- [ ] 編譯所有更新的合約
  - [ ] Hero_final_v2.sol → Hero.sol
  - [ ] Relic_final.sol → Relic.sol
  - [ ] 其他合約確認版本
- [ ] 生成新的 ABI 文件（5個合約）
- [ ] 更新前端
  - [ ] 替換 ABI 文件
  - [ ] 移除 reveal 相關邏輯
  - [ ] 更新交互流程
- [ ] 更新子圖
  - [ ] 替換 ABI 文件
  - [ ] 移除 Revealed 事件處理
  - [ ] 重新部署
- [ ] 測試完整流程
- [ ] 驗證數據索引正確性

### 🔍 相關文件

- 接口定義：`/Users/sotadic/Documents/DungeonDelversContracts/contracts/current/interfaces/interfaces.sol`
- 前端配置：`/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contractsWithABI.ts`
- 子圖配置：`/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml`

---

**最後更新時間**：2025-01-16
**更新者**：Claude Assistant
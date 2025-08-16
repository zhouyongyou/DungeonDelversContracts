# 📋 VRF 架構升級 TODO 計畫

## 🎯 升級目標
將系統從「雙步驟 VRF」升級到「單步驟 VRF 回調」模式，提升用戶體驗並降低 Gas 成本。

## 📅 執行時間表
預計總時程：1-2 週
- 第 1 週：準備和實施
- 第 2 週：部署和監控

---

## 📝 Phase 1: 準備階段（優先級：高）

### 1.1 合約準備 ⏱️ Day 1
- [ ] **備份當前合約**
  - [ ] 創建 `contracts/backup/v24/` 目錄
  - [ ] 複製所有當前運行的合約到備份目錄
  - [ ] Git commit 備份點：`git tag v24-backup`

- [ ] **確認新版合約**
  - [ ] Hero_final_v2.sol → Hero.sol
  - [ ] Relic_final.sol → Relic.sol
  - [ ] 確認 DungeonMaster.sol 版本
  - [ ] 確認 AltarOfAscension.sol 版本
  - [ ] 確認 VRFConsumerV2Plus.sol 完整性

### 1.2 編譯和 ABI 生成 ⏱️ Day 1-2
- [ ] **編譯所有新版合約**
  ```bash
  npx hardhat clean
  npx hardhat compile --force
  ```

- [ ] **生成 ABI 文件**
  - [ ] Hero ABI
  - [ ] Relic ABI
  - [ ] DungeonMaster ABI
  - [ ] AltarOfAscension ABI
  - [ ] VRFConsumerV2Plus ABI

- [ ] **創建 ABI 版本對照表**
  - [ ] 記錄每個合約的版本號
  - [ ] 記錄主要變更點

---

## 📝 Phase 2: 前端更新（優先級：高）

### 2.1 代碼更新 ⏱️ Day 2-3
- [ ] **更新 ABI 文件**
  ```bash
  # 複製新 ABI 到前端
  cp artifacts/.../Hero.json src/contracts/abi/
  cp artifacts/.../Relic.json src/contracts/abi/
  # ... 其他 ABI
  ```

- [ ] **移除過時邏輯**
  - [ ] 搜索並移除所有 `revealMint` 調用
  - [ ] 搜索並移除所有 `revealMintFor` 調用
  - [ ] 移除 pending reveal 狀態管理
  - [ ] 移除 "等待揭示" UI 組件

- [ ] **更新交互流程**
  - [ ] 簡化 Hero 鑄造流程
  - [ ] 簡化 Relic 鑄造流程
  - [ ] 更新探索流程
  - [ ] 更新升級流程

### 2.2 UI/UX 調整 ⏱️ Day 3-4
- [ ] **更新提示文案**
  - [ ] 移除 "等待揭示" 相關文案
  - [ ] 更新交易確認提示
  - [ ] 添加新的成功提示

- [ ] **優化加載狀態**
  - [ ] 調整鑄造中的動畫
  - [ ] 優化成功後的展示

---

## 📝 Phase 3: 子圖更新（優先級：中）

### 3.1 Schema 更新 ⏱️ Day 4-5
- [ ] **更新 GraphQL Schema**
  - [ ] 移除 `isRevealed` 字段
  - [ ] 移除 `pendingTokens` 相關
  - [ ] 更新事件結構

### 3.2 Mapping 更新 ⏱️ Day 5
- [ ] **更新事件處理**
  - [ ] 移除 `HeroRevealed` handler
  - [ ] 移除 `RelicRevealed` handler
  - [ ] 更新 `BatchMintCompleted` 處理邏輯

- [ ] **重新部署子圖**
  ```bash
  npm run codegen
  npm run build
  graph deploy --studio ...
  ```

---

## 📝 Phase 4: 主網部署（優先級：關鍵）

### 4.1 部署前檢查 ⏱️ Day 5-6
- [ ] **安全審計**
  - [ ] 內部代碼審查
  - [ ] 權限設置檢查
  - [ ] VRF 配置驗證

- [ ] **準備回滾方案**
  - [ ] 保存當前合約地址
  - [ ] 準備緊急暫停機制
  - [ ] 文檔化回滾步驟

### 4.2 執行部署 ⏱️ Day 6-7
- [ ] **主網部署**
  - [ ] 部署新合約
  - [ ] 配置合約連接
  - [ ] 設置 VRF 訂閱

- [ ] **部署順序**
  1. VRFConsumerV2Plus
  2. NFT 合約（Hero, Relic）
  3. 遊戲合約（DungeonMaster, AltarOfAscension）

### 4.3 切換和驗證 ⏱️ Day 7
- [ ] **前端切換**
  - [ ] 更新合約地址
  - [ ] 部署新版前端
  - [ ] 監控錯誤日誌

- [ ] **子圖切換**
  - [ ] 部署新版子圖
  - [ ] 驗證數據同步

---

## 📝 Phase 5: 監控和優化（優先級：中）

### 5.1 監控 ⏱️ Day 8-14
- [ ] **性能監控**
  - [ ] VRF 回調成功率
  - [ ] 交易成功率
  - [ ] Gas 使用統計

- [ ] **用戶反饋**
  - [ ] 收集用戶體驗反饋
  - [ ] 記錄問題報告

### 5.2 優化 ⏱️ 持續
- [ ] **迭代優化**
  - [ ] 根據數據優化 Gas
  - [ ] 改進錯誤處理
  - [ ] 更新文檔

---

## 🚨 風險管理

### 高風險項目
1. **VRF 服務中斷**
   - 緩解：實現備用隨機數方案
   - 負責人：合約團隊

2. **前端更新錯誤**
   - 緩解：灰度發布
   - 負責人：前端團隊

3. **子圖同步延遲**
   - 緩解：保留舊版子圖並行運行
   - 負責人：後端團隊

### 中風險項目
1. **Gas 費用超預期**
   - 緩解：本地測試和計算
   - 監控：實時 Gas 監控

2. **用戶教育**
   - 緩解：準備教程和公告
   - 執行：社區管理團隊

---

## 📊 成功指標

### 技術指標
- [ ] VRF 回調成功率 > 99%
- [ ] 交易成功率 > 95%
- [ ] Gas 成本降低 > 40%

### 業務指標
- [ ] 用戶滿意度提升
- [ ] 鑄造完成率提升
- [ ] 支持工單減少

---

## 👥 責任分配

| 任務類別 | 主要負責人 | 支援團隊 |
|---------|-----------|---------|
| 合約部署 | 合約開發 | DevOps |
| 前端更新 | 前端團隊 | UI/UX |
| 子圖更新 | 後端團隊 | 數據團隊 |
| 測試驗證 | QA 團隊 | 全體 |
| 監控優化 | DevOps | 全體 |

---

## 📝 檢查點

### Checkpoint 1: ABI 準備完成（Day 2）
- [ ] 所有合約編譯成功
- [ ] ABI 文件生成完整
- [ ] 決定是否繼續

### Checkpoint 2: 前端準備完成（Day 4）
- [ ] 前端代碼更新完成
- [ ] 本地驗證通過
- [ ] 決定部署時間

### Checkpoint 3: 主網部署前（Day 6）
- [ ] 最終安全檢查
- [ ] 回滾方案確認
- [ ] Go/No-Go 決定

---

## 📚 相關文檔

- [ABI 更新檢查清單](./ABI_UPDATE_CHECKLIST.md)
- [接口定義](./contracts/current/interfaces/interfaces.sol)
- [VRF 集成指南](./docs/VRF_INTEGRATION_GUIDE.md)

---

**最後更新**：2025-01-16
**版本**：v1.0
**狀態**：計畫階段
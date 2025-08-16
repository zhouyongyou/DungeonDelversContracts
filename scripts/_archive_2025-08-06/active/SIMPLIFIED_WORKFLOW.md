# 🎯 簡化工作流程指南

## 📊 腳本功能對比

### 原始理解 vs 實際功能

| 腳本名稱 | 原始理解 | 實際功能 | 是否必要 |
|---------|---------|---------|----------|
| `v25-deploy-complete-sequential.js` | 只部署合約 | ✅ 部署 + ✅ 設置 + ✅ 初始化 | **必要** |
| `v25-fix-module-setup.js` | 設置連接 | 修復連接問題 | **備用**（部署已包含） |
| `v25-setup-remaining-dungeons.js` | 初始化地城 | 補充設置地城 | **備用**（部署已包含） |
| `v25-sync-all.js` | 同步配置 | 同步配置（舊版） | **已替換** |
| `sync-system/index.js` | 同步配置 | 同步配置（新版） | **必要** |
| `v25-check-deployment-status.js` | 檢查狀態 | 驗證部署結果 | **建議** |
| `v25-verify-contracts.js` | BSCScan驗證 | 驗證合約代碼 | **可選** |

---

## 🚀 最簡化流程

### 方案 A：超簡單版（推薦）

只需要**兩個步驟**：

```bash
# 1️⃣ 部署 + 設置 + 初始化（全包）
node scripts/active/v25-deploy-complete-sequential.js

# 2️⃣ 同步配置到前端/後端/子圖
cd scripts/active/sync-system
node index.js v3.6.1
```

**完成！** 🎉

### 方案 B：一鍵腳本版

使用整合的 Shell 腳本：

```bash
# 舊版（使用舊同步系統）
bash scripts/active/v25-full-deploy.sh

# 新版（使用新同步系統）
bash scripts/active/v25-full-deploy-new.sh
```

**優點**：
- 自動化所有步驟
- 包含環境檢查
- 有日誌記錄
- 可選擇性跳過步驟

---

## 📝 詳細說明

### `v25-deploy-complete-sequential.js` 包含的功能

這個腳本其實是**三合一**的完整腳本：

1. **部署階段** (`deployContracts()`)
   - Oracle → SoulShard → NFTs → Core → Storage → Master → Vault → Profile → VIP → Altar

2. **設置階段** (`setupConnections()`)
   - `setupDungeonCore()` - 註冊所有模組到 DungeonCore
   - `setupModules()` - 每個模組設置 setDungeonCore
   - `setupSpecialConnections()` - 特殊連接（如 DungeonMaster ↔ DungeonStorage）

3. **初始化階段** (`setupDungeonParameters()`)
   - `setBaseURIs()` - 設置 NFT 的 BaseURI
   - `initializeDungeons()` - 初始化 30 個地城
   - `setOtherParameters()` - 其他參數設置

### 為什麼有額外的修復腳本？

- **`v25-fix-module-setup.js`** - 當部署後發現連接有問題時使用
- **`v25-setup-remaining-dungeons.js`** - 當需要補充設置更多地城時使用
- **`v25-check-deployment-status.js`** - 驗證所有設置是否正確

這些都是**補救措施**，正常情況下不需要！

---

## 🎯 實際使用建議

### 日常工作流程

99% 的時候你只需要：

```bash
# 如果需要部署新版本
node scripts/active/v25-deploy-complete-sequential.js

# 每次更新後同步配置（最常用）
cd scripts/active/sync-system && node index.js v3.6.1
```

### 完整部署流程（新項目）

```bash
# 1. 設置環境變數
cp .env.example .env
# 編輯 .env 填入 PRIVATE_KEY 和 BSCSCAN_API_KEY

# 2. 執行一鍵部署腳本
bash scripts/active/v25-full-deploy-new.sh v3.6.1

# 完成！腳本會自動：
# - 檢查環境
# - 編譯合約
# - 部署所有合約
# - 設置所有連接
# - 初始化地城
# - 同步配置
# - 驗證合約（可選）
# - 部署子圖（可選）
```

---

## 🔧 故障排除

### 如果部署中斷

```bash
# 檢查部署狀態
node scripts/active/v25-check-deployment-status.js

# 如果連接有問題
node scripts/active/v25-fix-module-setup.js

# 如果地城沒初始化
node scripts/active/v25-setup-remaining-dungeons.js

# 重新同步配置
cd scripts/active/sync-system && node index.js v3.6.1
```

### 如果只想更新配置

```bash
# 這是你最常用的命令
cd scripts/active/sync-system && node index.js v3.6.1
```

---

## 📊 總結

### 核心腳本（只需記住這兩個）

1. **`v25-deploy-complete-sequential.js`** - 完整部署（包含一切）
2. **`sync-system/index.js`** - 配置同步（日常最常用）

### 一鍵腳本（懶人版）

- **`v25-full-deploy-new.sh`** - 全自動部署 + 同步

### 輔助腳本（備用）

- `v25-check-deployment-status.js` - 檢查狀態
- `v25-fix-module-setup.js` - 修復連接
- `v25-setup-remaining-dungeons.js` - 補充地城
- `verify-all-v25.js` - BSCScan 驗證

---

## 🎉 結論

你之前的理解是對的！**`v25-deploy-complete-sequential.js` 確實是一個全能腳本**，包含了：
- ✅ 部署
- ✅ 設置
- ✅ 初始化

所以最簡單的流程就是：
1. 執行 `v25-deploy-complete-sequential.js`（部署時）
2. 執行 `sync-system/index.js`（同步配置）

其他腳本都是輔助或備用的！

---

*最後更新：2025-08-06*
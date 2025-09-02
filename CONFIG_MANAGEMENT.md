# 🏗️ DungeonDelvers 統一配置管理系統

> **目標**：消除硬編碼，建立單一真相來源，實現自動化配置同步

## 📊 配置現況分析

### 🔴 硬編碼熱點（需立即修復）

#### 1. 前端 (DungeonDelvers)
```typescript
// ❌ 高風險硬編碼位置
src/config/contractsWithABI.ts:42-91     // 15個核心合約地址
src/config/marketplace.ts:9-42           // 7個市場合約地址
src/config/env-contracts.ts:53           // DUNGEONMASTERWALLET
src/api/metadata-with-graph.ts:55-58     // 舊版合約映射
```

#### 2. 後端 (dungeon-delvers-metadata-server)
```javascript
// ❌ 高風險硬編碼位置
config/contracts.js:10-32                // 12個核心合約地址
update-to-v19.js:8-29                   // V19 遷移腳本
```

#### 3. 子圖 (DDgraphql/dungeon-delvers)
```yaml
# ❌ 高風險硬編碼位置
subgraph.yaml:11,38,65,88,115,140,164,193,216  // 9個合約地址
networks.json:4-16                       // 合約地址配置
```

#### 4. 合約腳本 (DungeonDelversContracts)
```javascript
// ❌ 高風險硬編碼位置
scripts/v25-final-verification.js:7-29  // 17個合約地址 + VRF
config/master-config.json:12-26,30-32   // 主配置文件
```

## 🎯 統一配置標準

### 環境變數命名規範
```bash
# 核心合約地址 (前端使用 VITE_ 前綴)
VITE_HERO_ADDRESS=0xe90d442458931690C057D5ad819EBF94A4eD7c8c
VITE_RELIC_ADDRESS=0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B
VITE_PARTY_ADDRESS=0x629B386D8CfdD13F27164a01fCaE83CB07628FB9
VITE_DUNGEONMASTER_ADDRESS=0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0
VITE_DUNGEONSTORAGE_ADDRESS=0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542
VITE_ALTAROFASCENSION_ADDRESS=0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1

# 重複使用的合約
VITE_DUNGEONCORE_ADDRESS=0x26BDBCB8Fd349F313c74B691B878f10585c7813E
VITE_PLAYERVAULT_ADDRESS=0xb2AfF26dc59ef41A22963D037C29550ed113b060
VITE_PLAYERPROFILE_ADDRESS=0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1
VITE_VIPSTAKING_ADDRESS=0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28
VITE_ORACLE_ADDRESS=0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8

# 代幣合約
VITE_SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
VITE_USD_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VITE_UNISWAP_POOL_ADDRESS=0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82

# VRF 配置
VITE_VRF_MANAGER_ADDRESS=0xdd14eD07598BA1001cf2888077FE0721941d06A8
VITE_VRF_COORDINATOR=0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
VITE_VRF_KEY_HASH=0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4
VITE_VRF_SUBSCRIPTION_ID=88422796721004450630713121079263696788635490871993157345476848872165866246915

# 部署配置
VITE_DEPLOYMENT_BLOCK=57914301
VITE_DEPLOYMENT_VERSION=V25
VITE_DEPLOYMENT_DATE=2025-08-17T20:00:00.000Z

# 服務端點
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.0
VITE_SUBGRAPH_DECENTRALIZED_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# 錢包地址
VITE_DUNGEONMASTER_WALLET=0x10925A7138649C7E1794CE646182eeb5BF8ba647
```

## 🚀 配置同步系統架構

### 主配置文件（單一真相來源）
```
/Users/sotadic/Documents/DungeonDelversContracts/.env.v25
```

### 自動生成的配置文件
```
├── DungeonDelvers/
│   ├── .env.local                    # 前端環境變數
│   └── src/config/generated.ts       # 自動生成的配置
├── dungeon-delvers-metadata-server/
│   ├── .env.production              # 後端環境變數
│   └── config/generated.json        # 自動生成的配置
├── DDgraphql/dungeon-delvers/
│   ├── networks.generated.json      # 自動生成的網路配置
│   └── subgraph.generated.yaml      # 自動生成的子圖配置
```

## 🔧 實施計劃

### Phase 1: 建立配置驗證機制
1. ✅ 創建環境變數驗證腳本
2. ✅ 建立配置完整性檢查
3. ✅ 實施啟動時驗證

### Phase 2: 遷移高風險硬編碼
1. 🔄 前端 contractsWithABI.ts 改用環境變數
2. 🔄 後端 contracts.js 改用環境變數
3. 🔄 子圖配置模板化

### Phase 3: 自動化同步系統
1. ⏳ 建立配置生成腳本
2. ⏳ 實施 CI/CD 整合
3. ⏳ 建立配置變更通知

## 📋 硬編碼位置清單

### 🔴 立即修復（HIGH Priority）
```typescript
// Frontend
src/config/contractsWithABI.ts          // 核心合約配置
src/config/marketplace.ts                // 市場配置

// Backend  
config/contracts.js                      // 後端合約配置

// Subgraph
subgraph.yaml                           // 子圖合約地址
networks.json                           // 網路配置
```

### 🟡 逐步遷移（MEDIUM Priority）
```typescript
// Frontend
src/api/metadata-with-graph.ts          // 舊版合約映射
src/config/env-contracts.ts              // 部分硬編碼

// Contract Scripts
scripts/v25-final-verification.js       // 驗證腳本
config/master-config.json               // 主配置
```

### 🟢 可保留硬編碼（LOW Priority）
```typescript
// 已知穩定地址（可選擇保留硬編碼）
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // BSC BUSD
```

## ⚠️ 重要配置資訊

### VRF 詳細配置
```yaml
VRF_CONFIGURATION:
  Manager: "0xdd14eD07598BA1001cf2888077FE0721941d06A8"
  Coordinator: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9"
  KeyHash: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"  # 200 gwei
  SubscriptionID: "88422796721004450630713121079263696788635490871993157345476848872165866246915"
  CallbackGasLimit: 200000
  RequestConfirmations: 3
```

### 子圖版本管理
```yaml
SUBGRAPH_INFO:
  Current: "v3.9.0"
  Studio: "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.0"
  Decentralized: "https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs"
  StartBlock: 57914301
```

## 🚨 配置管理規則

### DO's ✅
1. **統一使用環境變數** - 所有可變配置都應通過環境變數管理
2. **主配置文件優先** - 以 `.env.v25` 為單一真相來源
3. **驗證配置完整性** - 啟動時檢查所有必要變數
4. **版本化配置** - 保留歷史版本配置以便回滾
5. **文檔同步更新** - 每次配置變更都更新此文檔

### DON'Ts ❌
1. **避免多處硬編碼** - 不要在多個地方重複相同地址
2. **不要忽略驗證** - 不要跳過配置驗證步驟
3. **不要混用格式** - 統一地址格式（lowercase/checksum）
4. **不要直接編輯生成文件** - 只編輯主配置，讓腳本生成其他文件
5. **不要遺漏同步** - 配置變更後必須同步所有項目

## 🚀 統一配置管理系統 ✨

### 🎯 主配置同步腳本：`scripts/master-config-sync.js`

現在已實施**統一配置管理系統**，大幅簡化配置維護工作：

```bash
# ⭐ 一鍵同步所有項目配置
node scripts/master-config-sync.js sync

# 🔍 驗證配置一致性
node scripts/master-config-sync.js validate

# 📊 查看當前配置狀態
node scripts/master-config-sync.js status

# 🎯 分項同步（按需使用）
node scripts/master-config-sync.js frontend   # 僅同步前端
node scripts/master-config-sync.js backend    # 僅同步後端
node scripts/master-config-sync.js subgraph   # 僅同步子圖
```

### 📁 自動生成的配置文件

1. **前端配置**：`/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local`
   - 所有 VITE_ 前綴的環境變數
   - 自動從主配置同步合約地址、網路配置、服務端點

2. **後端配置**：`/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json`
   - 完整的合約地址和網路配置 (JSON 格式)
   - 包含 VRF、子圖、部署信息

3. **子圖配置**：自動更新 `networks.json` 和 `subgraph.yaml`
   - 使用環境變數動態生成配置
   - 確保起始區塊和地址正確

### ✨ 系統優勢

- **🎯 單一真相來源**：只需維護 `scripts/master-config-sync.js` 中的 `V25_CONFIG`
- **⚡ 自動同步**：一個命令更新所有項目
- **🔍 自動驗證**：確保配置一致性
- **🛡️ 錯誤檢測**：地址格式、項目路徑驗證
- **📝 清晰輸出**：詳細的操作反饋和下一步指引

## 🔄 配置更新流程

### ✅ 新流程（推薦）

```bash
# 1. 編輯主配置（修改合約地址）
vim scripts/master-config-sync.js   # 修改 V25_CONFIG 對象

# 2. 一鍵同步到所有項目
node scripts/master-config-sync.js sync

# 3. 驗證同步結果
node scripts/master-config-sync.js validate

# 4. 重啟相關服務
# 前端：cd frontend && npm run dev
# 後端：cd backend && npm run dev  
# 子圖：cd subgraph && npm run codegen && npm run build
```

### ❌ 舊流程（已棄用）

```bash
# 不再需要手動編輯多個配置文件
# vim /Users/sotadic/Documents/DungeonDelversContracts/.env.v25
# node scripts/ultimate-config-system.js sync
# node scripts/ultimate-config-system.js validate
```

---

**最後更新：** 2025-08-17T20:00:00.000Z  
**版本：** V25  
**維護者：** DungeonDelvers Team
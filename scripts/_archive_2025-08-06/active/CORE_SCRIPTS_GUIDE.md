# 🚀 DungeonDelvers 核心腳本使用指南

## 📋 目錄
1. [核心腳本總覽](#核心腳本總覽)
2. [完整工作流程](#完整工作流程)
3. [詳細使用說明](#詳細使用說明)
4. [常見問題處理](#常見問題處理)

---

## 🎯 核心腳本總覽

### 必備腳本清單

| 用途 | 腳本路徑 | 說明 |
|------|---------|------|
| **📦 部署合約** | `v25-deploy-complete-sequential.js` | V25 完整部署腳本 |
| **⚙️ 設置連接** | `v25-fix-module-setup.js` | 修復/設置合約間連接 |
| **🔄 配置同步** | `sync-system/index.js` | 新模組化同步系統 |
| **✅ 驗證部署** | `v25-check-deployment-status.js` | 檢查部署狀態 |
| **🏷️ 驗證合約** | `../verify/verify-all-v25.js` | BSCScan 驗證 |
| **🎲 初始化地城** | `v25-setup-remaining-dungeons.js` | 設置地城資料 |

### 輔助腳本

| 用途 | 腳本路徑 | 說明 |
|------|---------|------|
| **快速檢查** | `v25-quick-check.js` | 快速驗證合約狀態 |
| **修復前端** | `v25-fix-frontend-env.js` | 修復前端環境變數 |
| **API 修復** | `fix-contract-api-usage.js` | 修復合約 API 使用 |
| **地址檢查** | `marketplace-address-audit.js` | 審計合約地址（已棄用） |

---

## 🔧 完整工作流程

### 第一次部署流程

```bash
# 1️⃣ 部署所有合約
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/active/v25-deploy-complete-sequential.js

# 2️⃣ 設置合約連接
node scripts/active/v25-fix-module-setup.js

# 3️⃣ 初始化地城資料
node scripts/active/v25-setup-remaining-dungeons.js

# 4️⃣ 驗證部署狀態
node scripts/active/v25-check-deployment-status.js

# 5️⃣ 同步配置到所有項目
cd scripts/active/sync-system
node index.js v3.6.1

# 6️⃣ 驗證合約（BSCScan）
cd ../..
node scripts/verify/verify-all-v25.js
```

### 更新合約流程

```bash
# 1️⃣ 部署新版合約
node scripts/active/v25-deploy-complete-sequential.js

# 2️⃣ 更新 master-config.json
# 手動編輯或使用腳本更新地址

# 3️⃣ 同步新配置
cd scripts/active/sync-system
node index.js v3.6.2  # 使用新版本號

# 4️⃣ 驗證同步結果
node index.js --validate-only
```

### 日常維護流程

```bash
# 檢查合約狀態
node scripts/active/v25-quick-check.js

# 驗證配置一致性
cd scripts/active/sync-system
node index.js --validate-only

# 修復配置問題
node index.js v3.6.1
```

---

## 📖 詳細使用說明

### 1. 部署腳本 (`v25-deploy-complete-sequential.js`)

**功能**：部署所有 V25 合約到 BSC 主網

```bash
node scripts/active/v25-deploy-complete-sequential.js
```

**部署順序**：
1. Oracle (價格預言機)
2. SoulShard (遊戲代幣)
3. Hero/Relic/Party (NFT 合約)
4. DungeonCore (核心控制器)
5. DungeonStorage (資料存儲)
6. DungeonMaster (遊戲邏輯)
7. PlayerVault (玩家金庫)
8. PlayerProfile (玩家檔案)
9. VIPStaking (VIP 質押)
10. AltarOfAscension (升星祭壇)

**輸出**：
- 部署地址會顯示在控制台
- 自動保存到 `deployments/` 目錄

### 2. 設置腳本 (`v25-fix-module-setup.js`)

**功能**：設置合約間的連接和權限

```bash
node scripts/active/v25-fix-module-setup.js
```

**設置內容**：
- DungeonCore 註冊所有模組
- 各模組設置 DungeonCore 地址
- DungeonMaster 設置 DungeonStorage
- 設置必要的權限和角色

### 3. 同步系統 (`sync-system/index.js`)

**功能**：同步配置到前端、後端、子圖

```bash
cd scripts/active/sync-system
node index.js v3.6.1
```

**同步內容**：
- ✅ ABI 文件同步
- ✅ 前端配置更新
- ✅ 後端配置更新
- ✅ 子圖配置更新
- ✅ 環境變數更新

**其他命令**：
```bash
# 僅驗證
node index.js --validate-only

# 回滾
node index.js --rollback
```

### 4. 驗證腳本 (`v25-check-deployment-status.js`)

**功能**：檢查部署和設置狀態

```bash
node scripts/active/v25-check-deployment-status.js
```

**檢查項目**：
- 合約是否部署
- 合約連接是否正確
- 權限設置是否完成
- 初始化狀態

### 5. BSCScan 驗證 (`verify-all-v25.js`)

**功能**：在 BSCScan 上驗證合約源碼

```bash
node scripts/verify/verify-all-v25.js
```

**前置要求**：
- 設置 `BSCSCAN_API_KEY` 環境變數
- 合約已部署到主網

---

## 🗂️ 目錄結構說明

```
scripts/
├── active/                    # 當前使用的腳本
│   ├── sync-system/          # 🌟 新模組化同步系統
│   │   ├── index.js          # 主入口
│   │   ├── USAGE_GUIDE.md    # 使用指南
│   │   └── ...modules        # 各功能模組
│   ├── v25-deploy-*.js       # V25 部署相關
│   ├── v25-setup-*.js        # V25 設置相關
│   ├── v25-fix-*.js          # V25 修復相關
│   ├── v25-check-*.js        # V25 檢查相關
│   ├── v25-old/              # 舊版 V25 腳本（備份）
│   └── old/                  # 更早版本腳本（V22-V24）
├── deployments/              # 部署記錄和報告
├── verify/                   # 合約驗證腳本
└── deploy/                   # 基礎部署腳本

```

---

## 🔄 配置文件位置

### 主配置文件
```
config/
├── master-config.json        # 🌟 主配置（真實來源）
├── config-reader.js          # 配置讀取器
└── v25-config.js            # V25 配置定義
```

### 項目配置
```
# 前端
/GitHub/DungeonDelvers/
├── src/config/contracts.ts   # 合約地址
├── .env                      # 環境變數
└── public/config/v25.json   # CDN 配置

# 後端
/dungeon-delvers-metadata-server/
├── config/contracts.js       # 合約配置
└── .env                      # 環境變數

# 子圖
/DDgraphql/dungeon-delvers/
├── networks.json            # 網絡配置
├── subgraph.yaml           # 子圖定義
└── src/config.ts           # TypeScript 配置
```

---

## ⚠️ 常見問題處理

### Q1: 部署失敗
```bash
# 檢查 Gas 價格
# 確保錢包有足夠 BNB
# 使用續傳版本
node scripts/active/v25-deploy-with-timeout-continue.js
```

### Q2: 配置不同步
```bash
# 使用新同步系統
cd scripts/active/sync-system
node index.js v3.6.1

# 驗證結果
node index.js --validate-only
```

### Q3: 合約連接錯誤
```bash
# 重新設置連接
node scripts/active/v25-fix-module-setup.js

# 檢查狀態
node scripts/active/v25-quick-check.js
```

### Q4: 找不到 ABI
```bash
# 重新編譯合約
npx hardhat compile

# 重新同步
cd scripts/active/sync-system
node index.js v3.6.1
```

---

## 📝 最佳實踐

### 1. 部署檢查清單
- [ ] 環境變數設置正確（.env）
- [ ] 錢包有足夠 BNB
- [ ] 網絡設置為 BSC 主網
- [ ] 備份現有配置

### 2. 版本管理
```bash
# 使用語義化版本
v3.6.0 → v3.6.1  # 修復
v3.6.0 → v3.7.0  # 新功能
v3.6.0 → v4.0.0  # 重大變更
```

### 3. 備份策略
```bash
# 每次部署前備份
cp config/master-config.json config/master-config.backup.json

# 同步系統自動備份
# 查看備份
ls scripts/deployments/restore-*.sh
```

### 4. 測試流程
```bash
# 1. 先在測試網部署
# 2. 完整測試功能
# 3. 再部署到主網
# 4. 立即驗證和同步
```

---

## 🚨 緊急操作

### 回滾配置
```bash
# 方法 1：使用同步系統回滾
cd scripts/active/sync-system
node index.js --rollback

# 方法 2：使用備份腳本
bash ../deployments/restore-[timestamp].sh

# 方法 3：手動恢復
cp config/master-config.backup.json config/master-config.json
```

### 緊急修復
```bash
# 修復所有已知問題
node scripts/active/v25-fix-module-setup.js
node scripts/active/v25-fix-frontend-env.js
node scripts/active/fix-contract-api-usage.js
```

---

## 📞 支援資訊

- **主要腳本目錄**：`/scripts/active/`
- **新同步系統**：`/scripts/active/sync-system/`
- **部署記錄**：`/scripts/deployments/`
- **配置文件**：`/config/`

---

*最後更新：2025-08-06*
*版本：V25*
*狀態：生產環境使用中*
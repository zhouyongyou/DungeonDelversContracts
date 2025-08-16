# 🧹 Scripts 目錄清理計畫

> 執行日期：2025-08-06  
> 當前狀態：300+ 個腳本混亂堆積  
> 目標狀態：10 個核心腳本 + 歸檔

## 📌 核心原則

### 1. 單一配置來源
- **已建立**：`src/config/master-config.ts` (V25 配置)
- **原則**：所有腳本從此檔案讀取配置，不再硬編碼地址

### 2. 版本收斂
- **當前版本**：V26 (VRF 版本)
- **保留策略**：只保留最終工作版本，刪除所有中間嘗試

### 3. 功能去重
- **VRF 部署變體**：15+ 個 → 保留 1 個最終版
- **同步腳本變體**：8+ 個 → 保留 1 個通用版
- **驗證腳本變體**：10+ 個 → 保留 1 個標準版

## 🗂️ 新目錄結構

```
scripts/
├── current/                          # 當前使用（< 10 個檔案）
│   ├── deploy.js                    # 主部署腳本 (from v26-deploy-complete-sequential-vrf.js)
│   ├── verify.js                    # 合約驗證 (from v26-verify-contracts-vrf.js)
│   ├── sync-config.js               # 配置同步 (from v26-sync-all-vrf.js)
│   ├── maintenance.js               # 自動維護 (from auto-maintenance-v3.js)
│   └── README.md                    # 使用說明
│
├── utils/                           # 保留的工具腳本
│   └── config-loader.js            # 載入 master-config.ts
│
├── docs/                           # 保留的文檔
│   ├── DEPLOYMENT_GUIDE.md
│   └── MIGRATION_LOG.md
│
└── _archive_2025-08-06/           # 完整歸檔
    ├── active/                    # 原 active 目錄 (90+ 檔案)
    ├── archive/                   # 原 archive 目錄 (180+ 檔案)
    ├── deploy/                    # 原 deploy 目錄
    └── [其他所有舊腳本]

```

## 📝 保留清單（最終版本對照）

| 功能類別 | 原檔案 | 新檔案 | 說明 |
|---------|--------|--------|------|
| **部署** | v26-deploy-complete-sequential-vrf.js | current/deploy.js | V26 最終部署版本 |
| **驗證** | v26-verify-contracts-vrf.js | current/verify.js | 標準驗證流程 |
| **同步** | v26-sync-all-vrf.js | current/sync-config.js | 配置同步工具 |
| **維護** | auto-maintenance-v3.js | current/maintenance.js | 自動維護服務 |

## 🗑️ 刪除清單（大量重複變體）

### VRF 部署變體（全部歸檔）
- deploy-vrf-fix-contracts-v6.js
- deploy-vrf-fix-contracts.js
- deploy-vrf-pure-ethers.js
- deploy-vrf-pure.js
- deploy-vrf-v2plus.js
- deploy-vrf-wrapper-v2.js
- deploy-vrf-wrapper.js
- deploy-vrfmanager-only.js
- deploy-vrfmanager-simple.js
- redeploy-vrf-contracts.js
- ... (15+ 個變體)

### V25 腳本（全部歸檔）
- v25-complete-fix.js
- v25-complete-remaining-deployment.js
- v25-complete-sync.js
- v25-complete-update.js
- v25-deploy-complete-sequential-fixed.js
- v25-deploy-complete-sequential-improved.js
- ... (50+ 個 v25-*.js)

### 測試與診斷腳本（歸檔）
- test-mint-with-correct-data.js
- test-simple-mint.js
- test-vrf-mint-correct.js
- diagnose-hero-contract.js
- debug-vrf-failure.js
- ... (20+ 個測試腳本)

## 🔄 腳本更新要點

### 1. 配置引入方式改變

**舊方式**（硬編碼）：
```javascript
const HERO_ADDRESS = "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0";
const DUNGEONCORE_ADDRESS = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
```

**新方式**（從 master-config 讀取）：
```javascript
import { MASTER_CONFIG } from '../src/config/master-config.js';
const { HERO_ADDRESS, DUNGEONCORE_ADDRESS } = MASTER_CONFIG.contracts;
```

### 2. 版本無關化

**舊方式**：
```javascript
// v25-deploy-xxx.js
// v26-deploy-xxx.js
```

**新方式**：
```javascript
// deploy.js (版本從 MASTER_CONFIG.version 讀取)
const version = MASTER_CONFIG.version; // "V26"
```

## 📊 清理效益

| 指標 | 清理前 | 清理後 | 改善 |
|------|--------|--------|------|
| **腳本總數** | 300+ | < 10 (+ 歸檔) | -97% |
| **active/ 檔案數** | 90+ | 5 | -94% |
| **重複功能腳本** | ~40% | 0% | -100% |
| **配置來源** | 分散各處 | 單一來源 | 統一 |
| **維護複雜度** | 高 | 低 | ⬇️ |
| **新人上手時間** | 數小時 | 數分鐘 | -90% |

## 🚀 執行步驟

### Step 1: 備份現有結構
```bash
# 建立完整備份
tar -czf scripts-backup-$(date +%Y%m%d-%H%M%S).tar.gz scripts/
```

### Step 2: 建立新結構
```bash
# 建立新目錄
mkdir -p scripts/{current,utils,_archive_2025-08-06}
```

### Step 3: 複製核心腳本
```bash
# 複製並重命名核心腳本
cp scripts/active/v26-deploy-complete-sequential-vrf.js scripts/current/deploy.js
cp scripts/active/v26-verify-contracts-vrf.js scripts/current/verify.js
cp scripts/active/v26-sync-all-vrf.js scripts/current/sync-config.js
cp scripts/active/auto-maintenance-v3.js scripts/current/maintenance.js
```

### Step 4: 更新腳本配置引入
```bash
# 修改腳本使用 master-config.ts
# 需要手動編輯每個保留的腳本
```

### Step 5: 歸檔舊腳本
```bash
# 移動所有舊腳本到歸檔目錄
mv scripts/active scripts/_archive_2025-08-06/
mv scripts/archive scripts/_archive_2025-08-06/
mv scripts/deploy scripts/_archive_2025-08-06/
```

### Step 6: 建立使用文檔
```bash
# 在 current/ 建立 README.md
echo "# 核心腳本使用指南" > scripts/current/README.md
```

## ⚠️ 注意事項

1. **依賴檢查**：確認前端或其他服務沒有直接引用被歸檔的腳本
2. **Git 歷史**：使用 `git mv` 保留重要腳本的歷史記錄
3. **團隊溝通**：通知團隊成員新的腳本位置
4. **過渡期**：可考慮保留 symbolic links 作為過渡

## 📅 後續維護

### 每月檢查
- 檢視 current/ 是否有新增不必要的腳本
- 確認所有腳本都使用 master-config.ts

### 每季清理
- 歸檔超過 90 天未使用的腳本
- 更新 master-config.ts 版本資訊

### 新腳本規範
1. 必須放在 current/ 目錄
2. 必須從 master-config.ts 讀取配置
3. 命名簡潔明確，不含版本號
4. 包含清楚的 JSDoc 註解

---

*清理計畫制定：2025-08-06*  
*預計執行時間：1-2 小時*  
*負責人：開發團隊*
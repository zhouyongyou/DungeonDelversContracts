# 🚀 部署工作流程文檔

## 概述

本文檔說明 DungeonDelvers V25 的完整部署和同步流程。

## 📁 專案路徑

```bash
# 智能合約（當前）
/Users/sotadic/Documents/DungeonDelversContracts/

# 前端
/Users/sotadic/Documents/GitHub/DungeonDelvers/

# 後端
/Users/sotadic/Documents/dungeon-delvers-metadata-server/

# 子圖
/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/
```

## 🔄 自動化部署流程

### 1. 一鍵部署（推薦）

```bash
# 執行完整部署腳本
npx hardhat run scripts/active/v25-deploy-complete-sequential.js --network bsc
```

這個腳本會自動：
1. ✅ 部署所有合約
2. ✅ 設置合約連接（包含 DungeonMaster.setDungeonCore）
3. ✅ 初始化遊戲參數
4. ✅ 生成 v25-config.js
5. ✅ **自動執行同步腳本**（新增功能）

### 2. 手動同步（如需要）

如果自動同步失敗，可以手動執行：

```bash
# 執行統一同步腳本
node scripts/active/v25-unified-sync.js
```

## 📋 同步腳本功能對比

| 腳本名稱 | 用途 | 建議使用 |
|---------|------|---------|
| `v25-unified-sync.js` | 統一同步腳本，包含所有功能 | ✅ 推薦 |
| `v25-sync-all.js` | 舊版同步腳本 | ❌ 已棄用 |
| `sync-config-v2.js` | 只同步配置，不同步 ABI | ❌ 功能不完整 |

## 🔧 配置系統架構

```
config/
├── v25-config.js          # 源頭配置（部署自動生成）
├── config-reader.js       # 統一配置讀取器（自動偵測最新版本）
└── master-config.json     # 已棄用（改用 config-reader.js）
```

### 使用配置

```javascript
// 在任何腳本中
const config = require('./config/config-reader');

// 取得地址
config.getAddress('HERO')  // 返回 Hero 合約地址

// 取得所有地址（master-config 格式）
config.getAllAddresses()   // 返回 {HERO_ADDRESS: '0x...', ...}

// 取得遊戲參數
config.getGameParam('mintPriceUSD')  // 返回 2
```

## ✅ 同步內容清單

`v25-unified-sync.js` 會同步：

1. **前端** (`/src/config/contracts.ts`)
   - 合約地址
   - 網路配置
   - 服務端點

2. **後端** (`/config/contracts.js`)
   - NFT 合約地址
   - 網路配置
   - 版本資訊

3. **子圖**
   - `networks.json` - 合約地址映射
   - `subgraph.yaml` - 地址和起始區塊
   - ABI 文件同步

4. **CDN 配置**
   - `public/configs/v25.json`
   - `public/configs/latest.json`

5. **ABI 文件**
   - 從 artifacts 複製到前端/子圖

## 🚨 常見問題

### Q: 配置文件顯示「未設置」
A: 這是正常的，配置現在從 `config-reader.js` 讀取，不依賴 `master-config.json`

### Q: ABI 同步警告
A: 如果看到 ABI 找不到的警告，可能需要先編譯：
```bash
npx hardhat compile
```

### Q: 後端配置路徑
A: 後端配置在 `/config/contracts.js`（不是根目錄）

## 📝 檢查清單

部署後確認：
- [ ] 前端 `contracts.ts` 已更新
- [ ] 後端 `contracts.js` 已更新
- [ ] 子圖配置已更新
- [ ] CDN 配置已生成
- [ ] 所有 ABI 已同步

## 🔄 版本升級流程

當部署新版本（如 V26）時：

1. 部署腳本會自動生成 `v26-config.js`
2. `config-reader.js` 會自動偵測並使用最新版本
3. 執行同步腳本即可更新所有專案

無需手動修改任何配置文件！
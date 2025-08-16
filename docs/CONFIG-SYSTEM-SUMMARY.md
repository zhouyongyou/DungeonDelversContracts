# DungeonDelvers 統一配置管理系統總結

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                    master-config.json                       │
│              (單一真相來源 - Single Source of Truth)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ sync-config.js │
              │   同步腳本      │
              └───────┬───────┘
                      │
        ┌─────────────┴─────────────┬────────────────┬────────────────┐
        ▼                           ▼                ▼                ▼
┌───────────────┐         ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    前端        │         │    後端        │  │    子圖        │  │   CDN 配置     │
│ (.env/contracts.ts)│    │    (.env)      │  │(subgraph.yaml)│  │(v15.json)     │
└───────────────┘         └───────────────┘  └───────────────┘  └───────────────┘
        │                           │                │                │
        │                           │                │                │
        ▼                           ▼                ▼                ▼
   Vercel 部署                 Render 部署      Graph Studio    自動載入配置
```

## 📋 核心組件

### 1. 主配置文件 (`master-config.json`)
- **位置**: `/DungeonDelversContracts/config/master-config.json`
- **內容**: 所有合約地址、網路配置、版本信息
- **格式**:
```json
{
  "version": "V15",
  "lastUpdated": "2025-07-23",
  "contracts": {
    "mainnet": {
      "HERO_ADDRESS": "0x...",
      "RELIC_ADDRESS": "0x...",
      // ... 其他合約
    }
  },
  "network": { ... },
  "subgraph": { ... }
}
```

### 2. 同步腳本
- **sync-config.js**: 基本同步功能
- **sync-config-v2.js**: 增強版（含備份、版本檢查、子圖同步）
- **update-subgraph-deployment.js**: 子圖專用同步

### 3. 配置載入器
- **前端**: `configLoader.ts` - 從 CDN 載入配置
- **後端**: `configLoader.js` - 動態載入配置（5分鐘緩存）

## 🚀 使用流程

### 日常操作
```bash
# 1. 修改主配置
vi config/master-config.json

# 2. 執行同步
npm run sync:config

# 3. 完成！所有專案自動更新
```

### 配置載入優先級

#### 前端
1. CDN 配置 (`/public/config/v15.json`)
2. 環境變數 (VITE_*)
3. 默認值（硬編碼）

#### 後端
1. CDN 配置 (`https://dungeondelvers.xyz/config/v15.json`)
2. 環境變數 (*_ADDRESS)
3. 內建默認值

## 📊 環境變數簡化成果

| 項目 | 之前 | 現在 | 減少 |
|------|------|------|------|
| Vercel | 20+ | 1 | 95% |
| Render | 35+ | 3-4 | 90% |
| 總計 | 55+ | 4-5 | 92% |

### Vercel（前端）
```
VITE_WALLETCONNECT_PROJECT_ID=xxxxx  # 唯一必要
```

### Render（後端）
```
NODE_ENV=production
CORS_ORIGIN=https://dungeondelvers.xyz
FRONTEND_DOMAIN=https://dungeondelvers.xyz
# CONFIG_URL=... (可選)
```

## 🔄 自動更新機制

### 前端
- **立即生效**: 每次頁面載入時從 CDN 獲取最新配置
- **緩存**: 瀏覽器緩存 5 分鐘

### 後端
- **5分鐘更新**: 自動檢查並載入新配置
- **手動刷新**: `POST /api/config/refresh`
- **健康檢查**: `GET /health` 顯示當前配置版本

### 子圖
- **需要重新部署**: 執行 `npm run deploy:v15`
- **startBlock 自動更新**: 從主配置讀取

## 🛠️ 故障排除

### 問題：前端配置未更新
1. 清除瀏覽器緩存
2. 檢查 CDN 文件: `https://dungeondelvers.xyz/config/v15.json`
3. 查看控制台是否有錯誤

### 問題：後端使用舊配置
1. 調用刷新 API: `curl -X POST .../api/config/refresh`
2. 檢查 health 端點: `curl .../health`
3. 確認 CONFIG_URL 環境變數

### 問題：子圖未同步
1. 檢查 startBlock 是否正確（55018576）
2. 確認合約地址是否更新
3. 重新部署子圖

## 📈 優勢總結

1. **單一真相來源**: 避免配置不一致
2. **簡化部署**: 環境變數減少 90%+
3. **動態更新**: 無需重新部署即可更新配置
4. **版本追蹤**: 清楚知道當前使用的配置版本
5. **備份機制**: 可以快速回滾到之前的配置
6. **自動化**: 一個命令同步所有專案

## 🔮 未來改進方向

1. **配置驗證**: 添加 JSON Schema 驗證
2. **變更通知**: 配置更新時發送通知
3. **A/B 測試**: 支援多版本配置並存
4. **審計日誌**: 記錄所有配置變更
5. **Web UI**: 配置管理界面

## 📚 相關文檔

- [環境變數清單](ENVIRONMENT-VARIABLES.md)
- [配置遷移指南](MIGRATION-GUIDE.md)
- [部署驗證清單](DEPLOYMENT-VERIFICATION.md)
- [子圖同步問題](SUBGRAPH-SYNC-ISSUE.md)
- [部署腳本更新](DEPLOYMENT-SCRIPTS-UPDATE.md)
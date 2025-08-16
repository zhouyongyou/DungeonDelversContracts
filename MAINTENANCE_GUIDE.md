# 🛠️ DungeonDelvers V25 運維指南

## 📋 系統概覽

### 核心組件
- **智能合約**：V25 版本部署於 BSC 主網（區塊 56771885）
- **前端應用**：React + Vite，部署於 Vercel
- **後端 API**：Node.js，部署於 Render
- **子圖索引**：The Graph v3.8.2

### 關鍵地址
| 合約 | 地址 |
|------|------|
| Hero NFT | `0x671d937b171e2ba2c4dc23c133b07e4449f283ef` |
| Relic NFT | `0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da` |
| Party NFT | `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3` |
| DungeonMaster | `0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a` |
| PlayerVault | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` |

## 🚀 核心運維任務

### 1. 配置管理（最高優先級）

#### 統一配置系統
所有配置變更**必須**透過統一配置系統：
```bash
# 1. 編輯主配置
vim /Users/sotadic/Documents/DungeonDelversContracts/.env.v25

# 2. 執行同步
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/sync-all-config.js

# 3. 驗證結果
node scripts/validate-config-consistency.js  # 如存在
```

#### 配置文件位置
- **主配置**：`/Users/sotadic/Documents/DungeonDelversContracts/.env.v25`
- **前端配置**：`/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local`
- **後端配置**：`/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json`
- **子圖配置**：`/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/networks.json`

### 2. 子圖維護

#### 當前狀態
- **版本**：v3.8.2
- **端點**：https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.2
- **起始區塊**：56771885

#### 部署流程
```bash
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers

# 1. 代碼生成
npm run codegen

# 2. 構建
npm run build

# 3. 部署
graph deploy dungeon-delvers---bsc subgraph.yaml
# 輸入版本號，如：v3.8.3
```

#### 監控指標
- 同步狀態：檢查是否跟上最新區塊
- 錯誤日誌：查看 The Graph Studio 控制台
- 查詢性能：測試常用查詢回應時間

### 3. 後端 API 維護

#### 服務狀態檢查
```bash
# 健康檢查
curl https://dungeon-delvers-metadata-server.onrender.com/health

# 配置狀態
curl https://dungeon-delvers-metadata-server.onrender.com/api/config/status
```

#### 服務重啟（Render）
1. 登入 Render 控制台
2. 找到 `dungeon-delvers-metadata-server` 服務
3. 點擊 "Manual Deploy" 觸發重新部署

#### 本地測試
```bash
cd /Users/sotadic/Documents/dungeon-delvers-metadata-server
npm start

# 測試端點
curl http://localhost:3001/health
curl http://localhost:3001/api/hero/1
```

### 4. ABI 管理

#### 自動同步
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/cleanup-and-sync-abis.js
```

#### 手動驗證
檢查以下位置的 ABI 檔案是否一致：
- 合約項目：`/Users/sotadic/Documents/DungeonDelversContracts/artifacts/`
- 前端項目：`/Users/sotadic/Documents/GitHub/DungeonDelvers/src/abis/`
- 子圖項目：`/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/`

## 🚨 故障排除指南

### 問題 1：配置不同步
**症狀**：前端顯示錯誤合約地址，交易失敗
**解決**：
```bash
# 1. 檢查主配置
cat /Users/sotadic/Documents/DungeonDelversContracts/.env.v25

# 2. 重新同步
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/sync-all-config.js

# 3. 重啟前端開發服務器
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
npm run dev
```

### 問題 2：子圖同步緩慢
**症狀**：前端數據過時，交易不反映
**診斷**：
```bash
# 檢查子圖同步狀態
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{_meta{block{number}}}"}' \
  https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.2
```
**解決**：
1. 檢查 The Graph Studio 錯誤日誌
2. 確認起始區塊設定正確
3. 如需要，重新部署子圖

### 問題 3：ABI 版本混淆
**症狀**：前端合約調用失敗，類型錯誤
**解決**：
```bash
# 清理並重新同步 ABI
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/cleanup-and-sync-abis.js

# 重新構建前端
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
npm run build
```

### 問題 4：後端 API 錯誤
**症狀**：NFT Metadata 載入失敗
**檢查清單**：
1. RPC 端點是否正常
2. 合約地址是否正確
3. 服務器內存/CPU 使用情況

**解決**：
```bash
# 檢查 RPC 連接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://bsc-dataseed1.binance.org/

# 重啟後端服務器（Render 控制台操作）
```

## 📊 監控檢查清單

### 每日檢查
- [ ] 前端應用是否正常載入
- [ ] 後端 API 健康狀態
- [ ] 子圖同步狀態
- [ ] 重要合約 event 是否正常索引

### 每週檢查
- [ ] 系統配置一致性
- [ ] ABI 檔案版本一致性
- [ ] 服務器資源使用情況
- [ ] 錯誤日誌回顧

### 每月檢查
- [ ] 依賴套件更新
- [ ] 安全性掃描
- [ ] 效能基準測試
- [ ] 備份策略驗證

## 🔄 部署檢查清單

### 合約升級（謹慎）
1. [ ] 在測試網充分測試
2. [ ] 更新 ABI 檔案
3. [ ] 更新所有配置文件
4. [ ] 重新部署子圖
5. [ ] 更新前端和後端
6. [ ] 全面功能測試

### 前端部署
1. [ ] 執行 `npm run build`
2. [ ] 檢查 build 輸出無錯誤
3. [ ] 驗證環境變數
4. [ ] 部署到 Vercel
5. [ ] 功能煙霧測試

### 後端部署
1. [ ] 更新配置文件
2. [ ] 本地測試通過
3. [ ] 部署到 Render
4. [ ] 健康檢查通過
5. [ ] API 端點測試

### 子圖部署
1. [ ] 更新 startBlock
2. [ ] 更新 ABI 引用
3. [ ] 執行 `npm run build`
4. [ ] 部署到 The Graph
5. [ ] 同步狀態監控

## 🆘 緊急聯絡

### 關鍵服務商
- **BSC RPC**：Binance API / Alchemy
- **前端託管**：Vercel
- **後端託管**：Render
- **子圖託管**：The Graph Network

### 快速修復腳本位置
- 配置同步：`/Users/sotadic/Documents/DungeonDelversContracts/scripts/sync-all-config.js`
- ABI 清理：`/Users/sotadic/Documents/DungeonDelversContracts/scripts/cleanup-and-sync-abis.js`
- 服務重啟：各平台控制台

## 📝 更新日誌模板

```markdown
## [版本號] - YYYY-MM-DD

### 新增
- 功能描述

### 修改
- 變更描述

### 修復
- 問題描述

### 部署清單
- [ ] 合約更新
- [ ] 前端部署
- [ ] 後端部署
- [ ] 子圖更新
- [ ] 配置同步
- [ ] 功能測試
```

---

**維護者**：開發團隊  
**最後更新**：2025-08-07  
**版本**：V25.1
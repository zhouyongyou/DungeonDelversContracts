# DungeonDelvers 市場系統 - 獨立部署指南

## 🚀 快速開始（完全獨立架構）

### 第一步：部署市場合約

```bash
# 1. 確保在專案根目錄
cd /Users/sotadic/Documents/DungeonDelversContracts

# 2. 部署市場合約到 BSC 主網
npm run marketplace:deploy

# 或部署到測試網
npm run marketplace:deploy:testnet
```

**部署後會生成：**
- `marketplace/marketplace-config.json` - 包含合約地址
- `marketplace/.env.marketplace` - 環境變數
- `marketplace/abis/` - ABI 文件

### 第二步：部署市場子圖

```bash
# 1. 進入市場子圖目錄
cd marketplace/subgraph

# 2. 安裝依賴
npm install

# 3. 更新合約地址（自動從 marketplace-config.json 讀取）
npm run update:addresses

# 4. 生成代碼
npm run codegen

# 5. 構建子圖
npm run build

# 6. 部署到 The Graph Studio
npm run deploy:studio
# 或部署到 Hosted Service
npm run deploy:hosted
```

### 第三步：前端集成

```typescript
// 1. 複製 marketplace-config.json 到前端
cp marketplace/marketplace-config.json ../GitHub/DungeonDelvers/src/config/

// 2. 在前端代碼中使用
import marketConfig from '@/config/marketplace-config.json';

const MARKETPLACE_ADDRESS = marketConfig.contracts.DungeonMarketplace;
const OFFER_SYSTEM_ADDRESS = marketConfig.contracts.OfferSystem;

// 3. 配置市場子圖查詢
const MARKET_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/.../dungeondelvers-marketplace/...";
```

## 📁 目錄結構說明

```
/marketplace/              # 所有市場相關文件都在這裡
├── deploy-standalone.js   # 👈 主要部署腳本
├── marketplace-config.json # 👈 部署後生成的配置
└── subgraph/              # 👈 獨立的市場子圖
    ├── subgraph.yaml      # 子圖配置
    ├── schema.graphql     # 數據模型
    └── scripts/
        └── update-addresses.js # 👈 更新地址腳本
```

## ❌ 不需要使用的文件

由於選擇了完全獨立架構，以下文件**不需要使用**：

```
/scripts/active/
├── v25-marketplace-module.js      # ❌ 用於整合部署
└── update-subgraph-marketplace.js # ❌ 用於更新主子圖
```

## 🔧 常用命令

### 合約相關
```bash
# 部署
npm run marketplace:deploy

# 驗證合約
npm run marketplace:verify
```

### 子圖相關
```bash
cd marketplace/subgraph

# 更新地址
npm run update:addresses

# 開發流程
npm run codegen
npm run build
npm run deploy:studio
```

## 🐛 故障排除

### 問題：找不到 marketplace-config.json
**解決**：先執行 `npm run marketplace:deploy` 部署合約

### 問題：子圖部署失敗
**解決**：
1. 確認已經執行 `npm run update:addresses`
2. 確認 ABI 文件存在於 `marketplace/subgraph/abis/`
3. 檢查 The Graph Studio 的 API key

### 問題：前端無法連接
**解決**：
1. 確認 `marketplace-config.json` 已複製到前端
2. 確認網絡配置正確（主網/測試網）
3. 確認錢包連接到正確的網絡

## 📊 驗證部署

### 1. 檢查合約
```bash
# 查看部署配置
cat marketplace/marketplace-config.json

# 在 BSCScan 查看
# https://bscscan.com/address/[MARKETPLACE_ADDRESS]
```

### 2. 測試子圖
```graphql
# 在 The Graph Playground 測試
{
  marketStats(id: "market") {
    totalListings
    activeListings
    totalVolume
  }
}
```

### 3. 測試交易
- 創建測試掛單
- 進行測試購買
- 檢查子圖數據更新

## 🔄 更新流程

當需要更新市場系統時：

1. **更新合約**
   ```bash
   # 部署新版本
   npm run marketplace:deploy
   ```

2. **更新子圖**
   ```bash
   cd marketplace/subgraph
   npm run update:addresses
   npm run codegen
   npm run build
   npm run deploy:studio
   ```

3. **更新前端**
   - 複製新的 `marketplace-config.json`
   - 更新合約 ABI（如有變更）

## 📝 注意事項

1. **完全獨立**：市場系統與主遊戲完全分離
2. **配置分離**：使用 `marketplace-config.json`，不依賴 `master-config.json`
3. **子圖獨立**：市場有自己的子圖，不影響主遊戲子圖
4. **部署順序**：先部署合約，再部署子圖，最後更新前端

---

💡 **提示**：這是完全獨立架構的部署指南。如果需要整合部署，請參考其他文檔。
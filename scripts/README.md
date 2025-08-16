# 📁 Scripts 目錄結構說明

## 🗂️ 目錄結構

```
scripts/
├── deploy/         # 部署腳本
├── initialize/     # 初始化腳本
├── update/         # 更新維護腳本
├── verify/         # 驗證檢查腳本
├── utils/          # 工具腳本
├── docs/           # 文檔
└── archive/        # 歸檔的舊版本和測試腳本
```

## 🚀 主要腳本

### Deploy (部署)
- **`deploy/deploy-complete.js`** - 完整系統部署（V10 Final）
  ```bash
  npx hardhat run scripts/deploy/deploy-complete.js --network bsc
  ```

### Initialize (初始化)
- **`initialize/initialize-dungeons.ts`** - 初始化地城數據
- **`initialize/initialize-game-params.ts`** - 設定遊戲參數

### Update (更新)
- **`update/update-baseuri.ts`** - 更新 NFT baseURI
- **`update/fix-party-baseuri.ts`** - 修復 Party 合約 baseURI
- **`update/sync-environments.ts`** - 同步環境變數到各平台

### Verify (驗證)
- **`verify/verify-contracts.js`** - 驗證已部署的合約
- **`verify/check-current-baseuri.ts`** - 檢查 baseURI 設定

## 📚 使用指南

### 1. 部署新系統
```bash
# 編譯合約
npx hardhat compile

# 執行完整部署
npx hardhat run scripts/deploy/deploy-complete.js --network bsc

# 驗證合約
npx hardhat run scripts/verify/verify-contracts.js --network bsc
```

### 2. 更新現有系統
```bash
# 檢查 baseURI
npx hardhat run scripts/verify/check-current-baseuri.ts --network bsc

# 更新 baseURI
npx hardhat run scripts/update/update-baseuri.ts --network bsc
```

## 📋 注意事項

1. **主要版本**：使用 `deploy/deploy-complete.js`（V10）作為標準部署腳本
2. **舊版本**：V3-V9 已歸檔至 `archive/v3-v9/`
3. **環境變數**：確保 `.env` 文件包含所有必要的配置

## 🔗 相關文檔

- [部署指南](docs/DEPLOYMENT_GUIDE.md)
- [遷移日誌](docs/MIGRATION_LOG.md)
- [主專案 README](../README.md)
EOF < /dev/null
# DungeonDelvers 部署腳本目錄

## 目錄結構

```
scripts/
├── active/              # 當前使用的腳本
│   ├── deploy/         # 部署腳本
│   ├── initialize/     # 初始化腳本
│   ├── update/         # 更新和設定腳本
│   └── verify/         # 驗證腳本
└── archive/            # 封存的腳本
    ├── debug/          # 調試腳本
    ├── old-versions/   # 舊版本腳本
    └── test-scripts/   # 測試腳本
```

## 主要腳本說明

### 🚀 部署腳本 (active/deploy/)

#### deploy-dungeonmaster-v4.ts
最新的 DungeonMaster V4 部署腳本，包含事件優化。

```bash
npx hardhat run scripts/active/deploy/deploy-dungeonmaster-v4.ts --network bsc
```

#### deploy-v3-complete.ts
完整的 V3 系統部署腳本（如需重新部署整個系統）。

### 🎯 初始化腳本 (active/initialize/)

#### initialize-dungeons-v3.ts
初始化所有地下城配置。

```bash
npx hardhat run scripts/active/initialize/initialize-dungeons-v3.ts --network bsc
```

### 🔧 更新腳本 (active/update/)

#### update-all-abis.ts
更新所有合約的 ABI 檔案。

#### set-ipfs-baseuri.ts
設定 NFT 的 IPFS baseURI。

#### update-oracle.ts
更新 Oracle 價格資料。

### ✅ 驗證腳本 (active/verify/)

#### verify-dungeonmaster-v3.ts
驗證 DungeonMaster 合約。

### 📦 封存腳本 (archive/)

- **debug/**: 包含各種調試腳本（buyProvisions、checkAllowance 等）
- **old-versions/**: V2、V3 的舊版本部署腳本
- **test-scripts/**: 測試用腳本

## 標準部署流程

1. **部署新合約**
   ```bash
   npx hardhat run scripts/active/deploy/deploy-dungeonmaster-v4.ts --network bsc
   ```

2. **初始化配置**
   ```bash
   npx hardhat run scripts/active/initialize/initialize-dungeons-v3.ts --network bsc
   ```

3. **驗證合約**
   ```bash
   npx hardhat run scripts/active/verify/verify-dungeonmaster-v3.ts --network bsc
   ```

4. **更新 ABI**
   ```bash
   npx hardhat run scripts/active/update/update-all-abis.ts --network bsc
   ```

## 注意事項

- 部署前確保 `.env` 檔案配置正確
- 確保錢包有足夠的 BNB 支付 gas
- 部署後記得更新前端、後端、子圖的配置
- 重要部署請在 `DEPLOYMENT_RECORDS/` 目錄記錄

## 環境變數需求

```env
PRIVATE_KEY=你的私鑰
BSCSCAN_API_KEY=BSCScan API 金鑰
DUNGEONCORE_ADDRESS=DungeonCore 合約地址
DUNGEONSTORAGE_ADDRESS=DungeonStorage 合約地址
SOULSHARD_ADDRESS=SoulShard 代幣地址
```
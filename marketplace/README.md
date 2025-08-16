# DungeonDelvers Marketplace

獨立的 P2P NFT 市場系統，支持英雄、聖物和隊伍的交易。

## 架構設計

### 完全獨立部署
- **合約獨立**：市場合約與遊戲核心合約完全分離
- **子圖獨立**：擁有獨立的 The Graph 子圖，不影響主遊戲查詢
- **配置獨立**：使用 `marketplace-config.json` 管理配置

### 微服務架構優勢
- ✅ 降低風險：市場問題不影響遊戲運行
- ✅ 獨立升級：可單獨迭代市場功能
- ✅ 靈活部署：可選擇性部署市場功能
- ✅ 易於維護：代碼和配置完全隔離

## 快速開始

### 1. 部署合約
```bash
# 部署到 BSC 主網
npx hardhat run marketplace/deploy-standalone.js --network bsc

# 部署到測試網
npx hardhat run marketplace/deploy-standalone.js --network bscTestnet
```

### 2. 部署子圖
```bash
cd marketplace/subgraph

# 安裝依賴
npm install

# 更新合約地址
npm run update:addresses

# 生成代碼
npm run codegen

# 構建子圖
npm run build

# 部署到 The Graph Studio
npm run deploy:studio
```

### 3. 前端集成
```typescript
// 在前端配置中添加市場合約地址
import marketplaceConfig from '@/marketplace-config.json';

const MARKETPLACE_ADDRESS = marketplaceConfig.contracts.DungeonMarketplace;
const OFFERSYSTEM_ADDRESS = marketplaceConfig.contracts.OfferSystem;
```

## 目錄結構

```
marketplace/
├── deploy-standalone.js      # 獨立部署腳本
├── marketplace-config.json   # 部署後生成的配置文件
├── .env.marketplace          # 環境變數文件
├── abis/                     # 合約 ABI 文件
│   ├── DungeonMarketplace.json
│   └── OfferSystem.json
└── subgraph/                 # 獨立子圖
    ├── subgraph.yaml         # 子圖配置
    ├── schema.graphql        # GraphQL schema
    ├── package.json          # 子圖依賴
    ├── src/                  # Mapping 代碼
    │   ├── marketplace.ts
    │   └── offer-system.ts
    └── scripts/
        └── update-addresses.js  # 更新地址腳本
```

## 合約功能

### DungeonMarketplace
- 創建掛單（支持英雄、聖物、隊伍）
- 購買 NFT
- 取消掛單
- 更新價格
- 平台費用管理（默認 2.5%）

### OfferSystem
- 發起出價（含 SOUL 代幣託管）
- 接受/拒絕/取消出價
- 自動過期處理
- 出價留言功能

## 配置說明

### marketplace-config.json
部署後自動生成，包含：
- 合約地址
- 部署區塊
- 網絡信息
- 依賴合約地址

### 環境變數
`.env.marketplace` 包含：
- `DUNGEONMARKETPLACE_ADDRESS`
- `OFFERSYSTEM_ADDRESS`
- `DEPLOYMENT_BLOCK`

## 子圖查詢

### 查詢端點
```
Studio: https://api.studio.thegraph.com/query/YOUR_ID/dungeondelvers-marketplace/VERSION
```

### 示例查詢
```graphql
# 獲取活躍掛單
query ActiveListings {
  marketListings(where: { status: 0 }) {
    id
    seller
    nftType
    tokenId
    price
    createdAt
  }
}

# 獲取用戶統計
query UserStats($user: String!) {
  userMarketStats(id: $user) {
    totalSales
    totalSalesVolume
    totalPurchases
    activeListings
  }
}
```

## 升級流程

### 1. 部署新合約
```bash
npx hardhat run marketplace/deploy-standalone.js --network bsc
```

### 2. 遷移數據（如需要）
```bash
npm run migrate:marketplace
```

### 3. 更新子圖
```bash
cd marketplace/subgraph
npm run update:addresses
npm run codegen
npm run build
npm run deploy:studio
```

## 安全考量

### 合約安全
- ✅ ReentrancyGuard 防重入保護
- ✅ 合約白名單機制
- ✅ 所有權和授權檢查
- ✅ 緊急暫停功能

### 運營安全
- 費用接收方多簽錢包
- 平台費用上限 10%
- 合約驗證和審計

## 監控和維護

### 監控指標
- 每日交易量
- 活躍用戶數
- 平台手續費收入
- Gas 使用情況

### 維護任務
- 定期檢查合約狀態
- 監控異常交易
- 更新 NFT 白名單
- 優化子圖查詢

## FAQ

**Q: 為什麼要獨立部署？**
A: 降低風險，便於迭代，不影響核心遊戲功能。

**Q: 如何添加新的 NFT 類型？**
A: 在合約中調用 `setNFTContractApproval` 添加新合約到白名單。

**Q: 如何修改平台費用？**
A: Owner 調用 `setPlatformFee` 函數，最高不超過 10%。

**Q: 子圖同步慢怎麼辦？**
A: 檢查起始區塊設置，可能需要等待歷史數據同步。

## 技術支持

遇到問題請查看：
1. 合約代碼：`contracts/current/marketplace/`
2. 部署日誌：`marketplace/logs/`
3. 子圖狀態：The Graph Studio Dashboard

## License

MIT
# DungeonDelvers Marketplace Architecture

## 🏗️ 系統架構總覽

### 獨立部署架構
```
DungeonDelvers 生態系統
├── 核心遊戲系統
│   ├── 遊戲合約 (Hero, Relic, Party, etc.)
│   ├── 主子圖 (遊戲數據索引)
│   └── 遊戲前端
│
└── 市場系統（完全獨立）
    ├── 市場合約 (Marketplace, OfferSystem)
    ├── 市場子圖 (交易數據索引)
    └── 市場前端模塊
```

## 📍 文件位置對照

### 主遊戲系統
```
/Users/sotadic/Documents/DungeonDelversContracts/
├── contracts/current/          # 核心遊戲合約
├── scripts/active/             # 主部署腳本
└── config/master-config.json   # 主配置文件

/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/
├── subgraph.yaml              # 主子圖配置（不含市場）
└── schema.graphql             # 主 schema（不含市場）
```

### 市場系統
```
/Users/sotadic/Documents/DungeonDelversContracts/
├── contracts/current/marketplace/  # 市場合約源碼
│   ├── DungeonMarketplace.sol
│   └── OfferSystem.sol
│
└── marketplace/                    # 獨立部署系統
    ├── deploy-standalone.js        # 獨立部署腳本
    ├── marketplace-config.json     # 獨立配置
    ├── abis/                       # 合約 ABI
    └── subgraph/                   # 獨立子圖
        ├── subgraph.yaml
        ├── schema.graphql
        └── src/
```

## 🔄 部署流程對比

### 選項 1：完全獨立部署（推薦）
```bash
# 1. 部署市場合約
npm run marketplace:deploy

# 2. 部署市場子圖
cd marketplace/subgraph
npm run update:addresses
npm run deploy:studio

# 3. 前端集成
import marketConfig from '@/marketplace-config.json';
```

### 選項 2：整合到 V25 部署（可選）
```javascript
// 在 v25-deploy-complete-sequential.js 中
deployMarketplace: true
```

## 🎯 設計決策

### 為什麼選擇獨立架構？

1. **風險隔離**
   - 市場問題不影響遊戲運行
   - 合約漏洞影響範圍有限
   - 可獨立暫停市場功能

2. **開發效率**
   - 獨立團隊可並行開發
   - 部署週期互不影響
   - 測試和調試更簡單

3. **升級靈活性**
   - 可單獨升級市場功能
   - 不需要重新部署整個系統
   - 支持 A/B 測試新功能

4. **性能優化**
   - 子圖查詢更快速
   - 索引數據更精簡
   - 可獨立擴展

## 📊 數據流架構

```
用戶操作
   ↓
前端界面
   ↓
   ├─→ 遊戲合約 ←→ 主子圖 → 遊戲數據查詢
   │
   └─→ 市場合約 ←→ 市場子圖 → 市場數據查詢
```

## 🔐 安全考量

### 合約層面
- 獨立的權限管理
- 獨立的緊急暫停機制
- 最小化跨合約調用

### 運營層面
- 獨立的監控系統
- 獨立的審計流程
- 獨立的升級策略

## 📈 擴展性

### 未來可能的擴展
1. **多鏈部署**
   - 市場可獨立部署到其他鏈
   - 不影響主遊戲邏輯

2. **功能模塊化**
   - 拍賣系統
   - 租賃系統
   - 跨鏈橋接

3. **性能優化**
   - Layer 2 部署
   - 狀態通道
   - 批量交易

## 🛠️ 維護指南

### 日常維護
- 主遊戲和市場分別維護
- 獨立的監控 Dashboard
- 獨立的日誌系統

### 緊急響應
- 可單獨暫停市場
- 不影響遊戲核心功能
- 快速回滾機制

## 📝 最佳實踐

1. **配置管理**
   - 主遊戲：`master-config.json`
   - 市場：`marketplace-config.json`
   - 保持配置分離

2. **版本控制**
   - 獨立的版本號
   - 獨立的更新日誌
   - 清晰的依賴關係

3. **測試策略**
   - 獨立的測試套件
   - 獨立的測試環境
   - 整合測試分離

## 🚀 快速命令參考

### 市場系統命令
```bash
# 部署
npm run marketplace:deploy
npm run marketplace:deploy:testnet

# 驗證
npm run marketplace:verify

# 子圖
cd marketplace/subgraph
npm run update:addresses
npm run codegen
npm run build
npm run deploy:studio
```

### 清理主子圖
```bash
# 移除主子圖中的市場相關配置
node scripts/active/cleanup-main-subgraph.js
```

## 📚 相關文檔

- [市場合約 README](./README.md)
- [部署指南](./contracts/current/marketplace/README.md)
- [子圖文檔](./marketplace/subgraph/README.md)
- [前端集成指南](../src/hooks/useMarketplaceContract.ts)
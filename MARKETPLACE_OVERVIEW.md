# 🛒 DungeonDelvers Marketplace 完整概覽

## 📊 當前狀態總覽

### 🔴 關鍵發現
1. **Marketplace V2 已部署** - 2025-07-29
2. **NFT 地址不匹配** - Marketplace 使用舊版 NFT 地址
3. **子圖已存在** - 獨立的 Marketplace V2 子圖
4. **主子圖不包含** - 主 DungeonDelvers 子圖完全不包含 Marketplace

## 🏗️ 合約架構

### 1. 已部署的 Marketplace V2 合約
```json
{
  "DungeonMarketplaceV2": "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8",
  "OfferSystemV2": "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF",
  "部署區塊": 55723777,
  "部署日期": "2025-07-29"
}
```

### 2. 支援的穩定幣
- **USDT**: `0x55d398326f99059fF775485246999027B3197955`
- **BUSD**: `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56`
- **USD1**: `0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d`

### 3. NFT 合約地址對比

| NFT 類型 | Marketplace V2 使用 (舊) | V25 主合約 (新) | 狀態 |
|---------|------------------------|----------------|------|
| HERO | `0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22` | `0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797` | ❌ 不匹配 |
| RELIC | `0xe66036839c7E5F8372ADC36da8f0357429a96A34` | `0xaa7434e77343cd4AaE7dDea2f19Cb86232727D0d` | ❌ 不匹配 |
| PARTY | `0x22Ac9b248716FA64eD97025c77112c4c3e0169ab` | `0x2890F2bFe5ff4655d3096eC5521be58Eba6fAE50` | ❌ 不匹配 |

## 📁 代碼路徑結構

### 1. 合約源代碼
```
/Users/sotadic/Documents/DungeonDelversContracts/contracts/current/marketplace/
├── DungeonMarketplace.sol      # V1 版本（舊）
├── DungeonMarketplaceV2.sol    # V2 版本（當前）
├── OfferSystem.sol             # V1 報價系統（舊）
├── OfferSystemV2.sol           # V2 報價系統（當前）
└── README.md
```

### 2. Marketplace 專案目錄
```
/Users/sotadic/Documents/DungeonDelversContracts/marketplace/
├── marketplace-v2-config.json   # V2 配置文件
├── deploy-v2-standalone.js      # V2 部署腳本
├── abis/                        # ABI 文件
│   ├── DungeonMarketplaceV2.json
│   └── OfferSystemV2.json
└── subgraph-v2/                 # Marketplace V2 子圖
    ├── subgraph.yaml
    ├── schema.graphql
    ├── src/
    │   ├── marketplace-v2.ts
    │   └── offer-system-v2.ts
    └── package.json
```

### 3. 前端整合
```
/Users/sotadic/Documents/GitHub/DungeonDelvers/src/
├── hooks/useMarketplaceV2Contract.ts  # Marketplace V2 Hook
├── config/marketplace.ts              # Marketplace 配置
└── abis/                              # 共享 ABI
```

## 📈 子圖狀態

### 1. Marketplace V2 子圖
- **位置**: `/marketplace/subgraph-v2/`
- **狀態**: 獨立子圖，需要單獨部署
- **版本**: 1.0.0
- **網路**: BSC
- **起始區塊**: 55700000

### 2. 主 DungeonDelvers 子圖
- **包含 Marketplace**: ❌ 否
- **版本**: v3.3.7
- **結論**: Marketplace 完全獨立於主子圖

### 3. 子圖部署命令
```bash
# 在 marketplace/subgraph-v2/ 目錄下
npm run codegen    # 生成 TypeScript 代碼
npm run build      # 構建子圖
# npm run deploy   # 由您手動執行部署
```

## 🔧 配置管理

### 1. 需要同步的配置文件
- `marketplace/marketplace-v2-config.json` - Marketplace 主配置
- `前端/src/config/marketplace.ts` - 前端 Marketplace 配置
- `前端/src/hooks/useMarketplaceV2Contract.ts` - 合約地址

### 2. 同步工具
- `scripts/active/marketplace-sync.js` - 配置同步腳本
- `scripts/active/marketplace-address-audit.js` - 地址審計腳本

## 🚨 需要注意的問題

### 1. NFT 地址不一致
- **問題**: Marketplace 使用舊版 NFT 地址
- **影響**: 新鑄造的 NFT 無法在 Marketplace 交易
- **解決**: 執行 `marketplace-sync.js` 更新配置

### 2. 合約白名單
- **需要操作**: 在 Marketplace 合約上批准新的 NFT 地址
- **執行者**: 合約 Owner（需要私鑰）
- **命令**: 
  ```solidity
  marketplace.approveNFTContract("新NFT地址");
  offerSystem.approveNFTContract("新NFT地址");
  ```

### 3. 子圖獨立性
- **現狀**: Marketplace 子圖完全獨立
- **部署**: 需要單獨部署和維護
- **查詢端點**: 與主子圖不同的 GraphQL 端點

## 🎯 建議操作流程

### 1. 立即執行
```bash
# 檢查配置差異
node scripts/active/marketplace-sync.js --check-only

# 審計鏈上狀態
node scripts/active/marketplace-address-audit.js
```

### 2. 配置同步（如需要）
```bash
# 同步 V25 NFT 地址到 Marketplace
node scripts/active/marketplace-sync.js
```

### 3. 子圖準備（如需要）
```bash
cd marketplace/subgraph-v2
npm run codegen
npm run build
# 等待您手動部署
```

### 4. 合約操作（需要 Owner 權限）
- 批准新的 NFT 合約地址
- 更新平台費用（如需要）
- 添加/移除支援的代幣

## 📋 檢查清單

- [ ] NFT 地址是否已同步？
- [ ] 前端配置是否更新？
- [ ] 合約白名單是否包含新地址？
- [ ] 子圖是否需要重新部署？
- [ ] 測試交易是否正常？

## 🔗 相關文檔

- [MARKETPLACE_INTEGRATION.md](./MARKETPLACE_INTEGRATION.md) - 整合指南
- [marketplace/README.md](./marketplace/README.md) - Marketplace 詳細文檔
- [marketplace/DEPLOYMENT_GUIDE.md](./marketplace/DEPLOYMENT_GUIDE.md) - 部署指南

---

**總結**: Marketplace V2 是一個完全獨立的系統，有自己的合約、配置和子圖。當前最大的問題是 NFT 地址不匹配，需要通過配置同步和合約操作來解決。
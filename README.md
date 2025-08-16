# DungeonDelvers 智能合約 V22

Web3 遊戲智能合約系統，包含 NFT、地城探索、升星系統和 VIP 質押等功能。

## 🚨 重要提醒
**當前生產環境使用 V22 版本，所有合約都在 `/contracts/current/` 目錄下！**

## 🗂️ 專案資料夾位置
```bash
# 智能合約（當前資料夾）
/Users/sotadic/Documents/DungeonDelversContracts/

# 前端
/Users/sotadic/Documents/GitHub/DungeonDelvers/

# 子圖
/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/

# 後端元數據服務器
/Users/sotadic/Documents/dungeon-delvers-metadata-server/
```

## 📁 專案結構

```
DungeonDelversContracts/
├── contracts/             # 智能合約
│   ├── current/          ✅ V22 生產版本（當前使用）
│   │   ├── core/         # DungeonCore、DungeonMaster、DungeonStorage
│   │   ├── nft/          # Hero、Relic、Party、VIPStaking、PlayerProfile
│   │   ├── defi/         # Oracle、PlayerVault
│   │   └── interfaces/   # 接口定義
│   ├── next/             🚧 V23 開發版本
│   └── archive/          📦 歷史版本歸檔
│       ├── v21/          # V21 版本
│       ├── v20/          # V20 版本
│       └── old-versions/ # 更早版本
├── scripts/              # 部署和管理腳本
│   ├── active/           # V22 當前版本腳本
│   ├── utils/            # 通用工具腳本
│   └── archive/          # 歷史腳本歸檔
├── config/               # 配置文件
│   ├── v22-config.js     # V22 生產配置 ⭐
│   ├── v21-config.js     # V21 配置（已棄用）
│   └── master-config.json # 主配置文件
├── deployments/          # 部署記錄
├── test/                 # 測試文件
└── docs/                 # 文檔
```

## 🚀 V22 版本信息

### 網路資訊
- **網路**: BSC Mainnet
- **版本**: V22
- **部署日期**: 2025-07-25
- **區塊高度**: 11650000+
- **配置文件**: `/config/v22-config.js`

### 主要合約地址
```
SOULSHARD: 0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
DUNGEONCORE: 0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9
HERO: 0x141F081922D4015b3157cdA6eE970dff34bb8AAb
RELIC: 0xB1eb505426e852B8Dca4BF41454a7A22D2B6F3D3
PARTY: 0x0B97726acd5a8Fe73c73dC6D473A51321a2e62ee
VIPSTAKING: 0xc59B9944a9CbB947F4067F941EbFB0a5A2564eb9
```
完整地址列表請查看 `/config/v22-config.js`

### 元數據服務器
- **URL**: https://dungeon-delvers-metadata-server.onrender.com
- **API**: `/api/{type}/{tokenId}`

## 🛠 快速開始

### 1. 環境設置
```bash
# 安裝依賴
npm install

# 複製環境變數
cp .env.example .env

# 編輯 .env 設定私鑰和 API 金鑰
```

### 2. 編譯合約
```bash
npx hardhat compile
```

### 3. 部署合約
```bash
# 部署到 BSC 主網
npx hardhat run scripts/active/deploy-v22-complete.js --network bsc

# 設置合約依賴
npx hardhat run scripts/active/complete-v22-setup.js --network bsc
```

### 4. 驗證合約
```bash
npx hardhat run scripts/active/verify-v22-deployment.js --network bsc
```

## 📋 合約架構

### 核心系統
- **DungeonCore** - 模組管理總機，註冊和管理所有合約
- **DungeonMaster** - 地城探索邏輯，處理戰鬥和獎勵
- **DungeonStorage** - 地城數據存儲，保存地城配置

### NFT 系統
- **Hero** - 英雄 NFT，具有戰力屬性
- **Relic** - 聖物 NFT，提供容量加成
- **Party** - 隊伍 NFT，組合英雄和聖物
- **VIPStaking** - VIP 質押系統，提供稅率減免
- **PlayerProfile** - 玩家檔案，Soulbound NFT

### DeFi 系統
- **Oracle** - Uniswap V3 價格預言機
- **PlayerVault** - 玩家金庫，管理代幣存取
- **AltarOfAscension** - 升星祭壇，NFT 升級系統

## 🔧 開發指南

### 合約開發流程
1. 在 `/contracts/next/` 開發新功能
2. 編寫測試並確保通過
3. 在測試網部署和測試
4. 準備主網部署
5. 更新配置和文檔

### 使用正確的合約路徑
```javascript
// ✅ 正確 - 使用 current 目錄
const hero = await ethers.getContractAt(
    "contracts/current/nft/Hero.sol:Hero", 
    heroAddress
);

// ❌ 錯誤 - 不要使用舊路徑
const hero = await ethers.getContractAt(
    "contracts/nft/Hero.sol:Hero", 
    heroAddress
);
```

### 合約部署和設置順序
1. 部署基礎代幣（SoulShard）
2. 部署核心系統（Oracle、DungeonCore）
3. 部署 NFT 合約
4. 部署遊戲機制合約
5. 設置合約間依賴關係
6. 設置 baseURI 和費用參數
7. 驗證所有設置

## 📊 費用參數

| 項目 | 數值 | 說明 |
|------|------|------|
| Hero 鑄造價格 | 2 USD | 鑄造一個英雄的成本 |
| Relic 鑄造價格 | 0.8 USD | 鑄造一個聖物的成本 |
| 平台費率 | 5% | 交易手續費 |
| 探索費率 | 10% | 地城探索抽成 |
| 準備費用 | 0.05 USD | 地城準備成本 |
| VIP 冷卻期 | 15 秒（測試）| 生產環境建議 7 天 |

## 🧪 測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npx hardhat test test/Hero.test.js

# 測試覆蓋率
npm run coverage
```

## 🔐 安全考量
1. 所有合約實現 `Pausable` 緊急暫停機制
2. 使用 `ReentrancyGuard` 防止重入攻擊
3. 關鍵函數使用 `onlyOwner` 權限控制
4. VIP NFT 實現 Soulbound（不可轉移）
5. 合約已通過內部安全審查

## 📝 常用腳本

```bash
# 檢查合約狀態
npx hardhat run scripts/active/check-nft-complete-status.js --network bsc

# 修復合約設置
npx hardhat run scripts/active/fix-v22-contracts.js --network bsc

# 同步配置到其他專案
npm run sync:config

# 檢查配置一致性
npm run sync:check
```

## 🚀 版本歷史
- **V22** (2025-07-25) - 當前版本，修復所有已知問題
- **V21** (2025-07-24) - 初始部署，發現設置問題
- **V20** (2025-01-25) - 早期版本
- **V19** (2025-01-17) - 早期版本

## 📞 支援
- GitHub Issues: [提交問題](https://github.com/DungeonDelvers/contracts/issues)
- 團隊錢包: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- 元數據服務器: https://dungeon-delvers-metadata-server.onrender.com

---

**重要**: 修改合約前請確保了解整體架構和依賴關係。所有新開發應在 `/contracts/next/` 進行。
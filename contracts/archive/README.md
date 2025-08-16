# DungeonDelvers Contracts V22

## 🚨 重要說明
**當前生產環境使用的合約都在 `/current` 目錄下！**

## 📁 目錄結構

```
contracts/
├── current/          ✅ 【V22 生產版本 - 當前使用】
│   ├── core/         # 核心合約（DungeonCore、DungeonMaster、DungeonStorage）
│   ├── nft/          # NFT 合約（Hero、Relic、Party、VIPStaking、PlayerProfile）
│   ├── defi/         # DeFi 合約（Oracle、PlayerVault）
│   └── interfaces/   # 合約接口定義
├── next/             🚧 【V23 開發版本】
├── archive/          📦 【歷史版本歸檔】
│   ├── flattened/    # 用於驗證的扁平化版本
│   ├── old_versions/ # 歷史版本
│   ├── minimal/      # 簡化版本
│   └── examples/     # 範例代碼
├── core/             ⚠️  【舊版 - 請勿使用】
├── nft/              ⚠️  【舊版 - 請勿使用】
├── defi/             ⚠️  【舊版 - 請勿使用】
└── AltarOfAscension.sol  # 升星祭壇（獨立合約）
```

## 合約清單（V22）

### 核心合約 (/current/core)
- `DungeonCore.sol` - 總機合約，管理所有模組
- `DungeonMaster.sol` - 地城探索邏輯
- `DungeonStorage.sol` - 地城數據存儲

### NFT 合約 (/current/nft)
- `Hero.sol` - 英雄 NFT (ERC721)
- `Relic.sol` - 聖物 NFT (ERC721)
- `Party.sol` - 隊伍 NFT (ERC721)
- `VIPStaking.sol` - VIP 質押系統
- `PlayerProfile.sol` - 玩家檔案系統

### DeFi 合約 (/current/defi)
- `Oracle.sol` - 價格預言機（Uniswap V3）
- `PlayerVault.sol` - 玩家金庫

### 其他
- `AltarOfAscension.sol` - 升星祭壇
- `/interfaces` - 合約介面定義
- `/events` - 事件定義

## 部署版本歷史
- V22 (2025-07-25) - 當前版本 ✅
- V21 (2025-07-24) - 已棄用
- V20 (2025-01-25) - 已棄用
- V19 (2025-01-17) - 已棄用

## 開發指南

### 使用正確的合約路徑
```javascript
// ✅ 正確
const hero = await ethers.getContractAt("contracts/current/nft/Hero.sol:Hero", heroAddress);

// ❌ 錯誤（舊版路徑）
const hero = await ethers.getContractAt("contracts/nft/Hero.sol:Hero", heroAddress);
```

### 新功能開發
1. 所有新開發應在 `/contracts/next/` 目錄進行
2. 不要直接修改 `/contracts/current/` 中的文件
3. 測試完成後，將 next 版本移至 current

### 部署新版本時
1. 更新版本號（如 V22 → V23）
2. 將當前 current 移至 archive
3. 將測試完成的 next 移至 current
4. 更新所有相關配置和文檔

## 合約依賴關係

### 必須設置的合約地址關係
- **DungeonCore** 需要註冊所有其他合約模組
- **Party** 需要設置 Hero、Relic、DungeonCore
- **Hero/Relic** 需要設置 DungeonCore、SoulShardToken、AltarOfAscension
- **PlayerVault** 需要設置 DungeonCore、SoulShardToken
- **VIPStaking** 需要設置 DungeonCore、SoulShardToken
- **DungeonMaster** 需要設置 DungeonCore、DungeonStorage、SoulShardToken、DungeonMasterWallet
- **DungeonStorage** 需要設置 LogicContract (DungeonMaster)
- **AltarOfAscension** 需要設置 Hero、Relic、SoulShardToken、DungeonCore

### 必須設置的 BaseURI
所有 NFT 合約都需要設置 baseURI：
- Hero: `https://dungeon-delvers-metadata-server.onrender.com/api/hero/`
- Relic: `https://dungeon-delvers-metadata-server.onrender.com/api/relic/`
- Party: `https://dungeon-delvers-metadata-server.onrender.com/api/party/`
- VIPStaking: `https://dungeon-delvers-metadata-server.onrender.com/api/vip/`
- PlayerProfile: `https://dungeon-delvers-metadata-server.onrender.com/api/profile/`

## 相關文件
- 部署記錄：`/deployments/`
- 配置文件：`/config/v22-config.js`
- 部署腳本：`/scripts/active/`
- 測試文件：`/test/`
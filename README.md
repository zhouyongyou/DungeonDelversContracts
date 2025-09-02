# DungeonDelvers 智能合約 V25

全新改版的 Web3 遊戲智能合約系統，採用 Chainlink VRF 純隨機機制，提供公平、透明的遊戲體驗。

## 🚨 重要提醒
**當前生產環境使用 V25 版本，所有合約都在 `/contracts/current/` 目錄下！**

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

## 🌟 V25 版本重大更新

### 🎲 純 VRF 隨機機制
- **移除複雜的兩步揭示機制**：不再需要 commit-reveal 流程
- **Chainlink VRF V2+ 集成**：使用行業標準的可驗證隨機數
- **即時結果**：鑄造後立即獲得隨機屬性
- **完全公平**：無法預測或操縱結果

### ⚡ 系統優化
- **統一函數命名**：所有提取原生代幣函數標準化為 `withdrawNative()`
- **Gas 優化**：簡化邏輯，大幅降低交易成本
- **智能授權系統**：VRF Manager 自動識別核心遊戲合約
- **統一配置管理**：一鍵同步所有項目配置

### 🛡️ 安全增強  
- **防重入保護**：所有關鍵函數使用 ReentrancyGuard
- **NFT 鎖定機制**：升級過程中防止重複使用
- **緊急清理功能**：管理員可處理異常狀態
- **訂閱模式 VRF**：無需為每次隨機數請求付費

## 📁 專案結構

```
DungeonDelversContracts/
├── contracts/             # 智能合約
│   ├── current/          ✅ V25 生產版本（當前使用）
│   │   ├── core/         # DungeonCore、DungeonMaster、VRFConsumerV2Plus
│   │   ├── nft/          # Hero、Relic、Party、VIPStaking、PlayerProfile
│   │   ├── defi/         # Oracle、PlayerVault
│   │   └── interfaces/   # 接口定義
│   └── archive/          📦 歷史版本歸檔
├── scripts/              # 部署和管理腳本
│   ├── ultimate-config-system.js  # 🆕 統一配置管理
│   ├── active/           # V25 當前版本腳本
│   └── utils/            # 通用工具腳本
├── .env.v25              # 🆕 V25 主配置文件
└── deployments/          # 部署記錄
```

## 🚀 V25 版本信息

### 網路資訊
- **網路**: BSC Mainnet (Chain ID: 56)
- **版本**: V25
- **部署日期**: 2025-08-17 20:00 UTC
- **起始區塊**: 57,914,301
- **主配置文件**: `/.env.v25`

### 核心合約地址 (V25)
```bash
# 核心系統
DUNGEONCORE=0x26BDBCB8Fd349F313c74B691B878f10585c7813E
VRFMANAGER=0xdd14eD07598BA1001cf2888077FE0721941d06A8
ORACLE=0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8

# NFT 合約
HERO=0xe90d442458931690C057D5ad819EBF94A4eD7c8c
RELIC=0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B
PARTY=0x629B386D8CfdD13F27164a01fCaE83CB07628FB9
VIPSTAKING=0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28
PLAYERPROFILE=0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1

# 遊戲機制
DUNGEONMASTER=0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0
DUNGEONSTORAGE=0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542
ALTAROFASCENSION=0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1
PLAYERVAULT=0xb2AfF26dc59ef41A22963D037C29550ed113b060

# 代幣
SOULSHARD=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
```

### 服務端點
- **子圖**: https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.0
- **元數據服務器**: https://dungeon-delvers-metadata-server.onrender.com
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

### 3. 統一配置管理 🆕
```bash
# 查看系統狀態
node scripts/ultimate-config-system.js status

# 完整同步配置到所有項目
node scripts/ultimate-config-system.js sync

# 驗證配置一致性
node scripts/ultimate-config-system.js validate

# 只同步 ABI 文件
node scripts/ultimate-config-system.js abi
```

### 4. 部署合約（參考用）
```bash
# V25 部署腳本（已部署，僅供參考）
npx hardhat run scripts/deploy-v25-complete.js --network bsc

# 設置合約依賴
npx hardhat run scripts/setup-v25-contracts.js --network bsc
```

## 📋 合約架構

### 核心系統
- **DungeonCore** - 統一地址管理，所有模組的中央註冊表
- **VRFConsumerV2Plus** - 🆕 Chainlink VRF V2+ 集成，提供可驗證隨機數
- **DungeonMaster** - 地城探索邏輯，使用 VRF 決定戰鬥結果
- **DungeonStorage** - 地城數據存儲，保存地城配置

### NFT 系統
- **Hero** - 英雄 NFT，戰力屬性由 VRF 生成（15-255）
- **Relic** - 聖物 NFT，容量等於稀有度（1-5）
- **Party** - 隊伍 NFT，組合英雄和聖物
- **VIPStaking** - VIP 質押系統，Soulbound NFT
- **PlayerProfile** - 玩家檔案，邀請系統

### DeFi 系統
- **Oracle** - Uniswap V3 價格預言機，實時匯率
- **PlayerVault** - 玩家金庫，虛擬記帳系統
- **AltarOfAscension** - 升星祭壇，VRF 驅動的升級系統

## 💰 經濟模型 (V25)

### 鑄造價格
| NFT 類型 | 價格 (USD) | 平台費 (BNB) | 總成本 |
|----------|------------|---------------|---------|
| Hero     | $2.00      | 0.0003 BNB    | ~$2.18  |
| Relic    | $2.00      | 0.0003 BNB    | ~$2.18  |

### 升級費用 (升星祭壇)
| 稀有度等級 | 材料需求 | 原生費用 (BNB) | 成功率 |
|------------|----------|----------------|---------|
| 1 → 2      | 5 個 R1  | 0.005 BNB      | 85%     |
| 2 → 3      | 4 個 R2  | 0.01 BNB       | 75%     |
| 3 → 4      | 3 個 R3  | 0.02 BNB       | 45%     |
| 4 → 5      | 2 個 R4  | 0.05 BNB       | 25%     |

### 地城探索
- **探索費用**: 0.0015 BNB
- **冷卻時間**: 24 小時
- **VRF 費用**: 免費（訂閱模式）

### 稀有度分布（VRF 驅動）
| 稀有度 | 機率  | 英雄戰力範圍 | 聖物容量 |
|--------|-------|--------------|----------|
| R1     | 44%   | 15-64        | 1        |
| R2     | 35%   | 50-100       | 2        |
| R3     | 15%   | 100-150      | 3        |
| R4     | 5%    | 150-200      | 4        |
| R5     | 1%    | 200-255      | 5        |

## 🔧 開發指南

### 統一配置管理 🆕
V25 引入全新的配置管理系統，確保所有項目保持同步：

```bash
# 主配置文件（唯一需要手動維護）
.env.v25

# 自動同步到的項目
├── 前端: /DungeonDelvers/.env.local
├── 後端: /dungeon-delvers-metadata-server/config/contracts.json
├── 子圖: /DDgraphql/dungeon-delvers/networks.json
└── ABI: 自動同步到前端和子圖
```

### 函數命名標準化 🆕
V25 統一了所有提取原生代幣的函數命名：

```solidity
// ✅ V25 標準化函數名
function withdrawNative() external onlyOwner;

// ❌ 舊版本不一致命名
// withdrawBNB(), withdrawNativeFunding(), emergencyWithdraw()
```

### VRF 集成最佳實踐
```solidity
// 標準 VRF 回調實現
function onVRFFulfilled(uint256 requestId, uint256[] memory randomWords) external override {
    if (msg.sender != vrfManager) return;  // 使用 return，避免卡死 VRF
    // 處理隨機數邏輯...
}
```

### 合約部署流程
1. 部署基礎代幣和核心系統
2. 部署 VRF Manager
3. 部署 NFT 合約（Hero、Relic、Party）
4. 部署遊戲機制合約
5. 使用 DungeonCore 統一設置地址
6. 配置 VRF 訂閱和授權
7. 同步配置到所有項目

## 🧪 測試和驗證

```bash
# 運行所有測試
npm test

# 運行特定測試
npx hardhat test test/VRFIntegration.test.js

# 檢查合約狀態
node scripts/verify-v25-system.js

# 測試配置同步
node scripts/ultimate-config-system.js validate
```

## 🔐 安全特性

### V25 新增安全機制
1. **VRF 防卡死保護** - 回調函數使用 `return` 而非 `require`
2. **NFT 鎖定系統** - 升級過程中防止重複使用
3. **智能授權檢查** - VRF Manager 自動識別授權合約
4. **緊急清理功能** - 管理員可處理異常請求

### 既有安全措施
1. 所有合約實現 `Pausable` 緊急暫停
2. 使用 `ReentrancyGuard` 防止重入攻擊
3. 關鍵函數使用 `onlyOwner` 權限控制
4. VIP NFT 實現 Soulbound（不可轉移）
5. 合約已通過多輪內部安全審查

## 📝 常用腳本

```bash
# V25 系統管理
node scripts/ultimate-config-system.js status      # 查看系統狀態
node scripts/ultimate-config-system.js sync        # 完整同步
node scripts/ultimate-config-system.js validate    # 驗證一致性

# 合約管理
npx hardhat run scripts/verify-v25-system.js --network bsc
npx hardhat run scripts/check-vrf-authorization.js --network bsc

# 配置檢查
npx hardhat run scripts/check-all-connections.js --network bsc
```

## 🔄 版本演進

### V25 (2025-08-17) - 當前版本 ✅
- ✅ 完全移除兩步揭示機制
- ✅ 集成 Chainlink VRF V2+ 
- ✅ 統一函數命名標準化
- ✅ 引入統一配置管理系統
- ✅ Gas 優化和安全增強

### V22-V24 (2025-07-25 ~ 2025-08-07) - 歷史版本
- 逐步簡化和優化
- 部分 VRF 集成測試
- 修復各種部署問題

### V21 及更早版本
- 初始版本
- 傳統的 commit-reveal 機制
- 已完全棄用

## 📊 系統監控

### 子圖指標
- **當前版本**: v3.9.0
- **索引狀態**: 實時同步
- **支援查詢**: Hero, Relic, Party, VIP, Expedition, Upgrade

### 性能指標
- **VRF 回應時間**: ~18 秒（6 個確認區塊）
- **Gas 使用優化**: 相比 V22 節省 ~30%
- **鑄造成功率**: 99.9%+

## 📞 支援和資源

- **團隊錢包**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **GitHub**: [DungeonDelvers 組織](https://github.com/DungeonDelvers)
- **技術文檔**: 本 README 及 `/docs/` 目錄
- **元數據服務**: https://dungeon-delvers-metadata-server.onrender.com

## ⚠️ 重要注意事項

1. **配置管理**: 永遠只編輯 `.env.v25`，其他配置文件由腳本自動同步
2. **函數命名**: 使用標準化的 `withdrawNative()` 函數
3. **VRF 依賴**: 所有隨機性都依賴 Chainlink VRF，確保訂閱餘額充足
4. **合約升級**: V25 是重大架構升級，無法從舊版本直接升級

---

**重要**: V25 是完全重新設計的版本，採用現代化的 VRF 隨機機制。所有開發和部署都應基於 `/contracts/current/` 目錄。
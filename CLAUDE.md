# 🏗️ DungeonDelvers 智能合約 - 專案指南

> 📖 **請先閱讀**: `~/MASTER-CLAUDE.md` 了解整體架構，此文檔專注於合約開發細節

## 專案概述
DungeonDelvers 是一個 Web3 遊戲項目，包含 NFT（英雄、聖物、隊伍）、地城探索、升星系統和 VIP 質押等功能。

## 合約架構

### 核心合約
1. **DungeonCore.sol** - 總機合約，管理所有模組的地址和權限
2. **Oracle.sol** - 價格預言機，提供 USD 價值計算
3. **SoulShard.sol** - 遊戲代幣 (ERC20)

### NFT 合約
1. **Hero.sol** - 英雄 NFT (ERC721)
2. **Relic.sol** - 聖物 NFT (ERC721)
3. **Party.sol** - 隊伍 NFT (ERC721)

### 遊戲機制合約
1. **DungeonMaster.sol** - 地城探索邏輯
2. **DungeonStorage.sol** - 地城數據存儲
3. **AltarOfAscension.sol** - 升星祭壇
4. **PlayerVault.sol** - 玩家金庫（代幣存取）
5. **PlayerProfile.sol** - 玩家檔案（邀請系統）
6. **VIPStaking.sol** - VIP 質押系統

## 部署流程

### 1. 環境設置
```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 設定
PRIVATE_KEY=你的私鑰
BSCSCAN_API_KEY=你的API金鑰
```

### 2. 編譯合約
```bash
npx hardhat compile
```

### 3. 部署到 BSC 主網
```bash
npx hardhat run scripts/deploy.js --network bsc
```

### 4. 驗證合約
```bash
npx hardhat run scripts/verify.js --network bsc
```

## 重要地址

⚠️ **注意**：合約地址請參考 `deployments/` 目錄下的最新配置文件，避免版本混淆。

當前版本配置檔案位置：
- 最新部署配置：`deployments/v25-final-config-*.json`
- 部署記錄：`deployments/` 目錄下的 `.md` 文件

部署者錢包地址：`0x10925A7138649C7E1794CE646182eeb5BF8ba647`

## 合約交互指南

### 設定合約連接（部署後必須執行）
1. 在 DungeonCore 設定各模組地址
2. 在各模組設定 DungeonCore 地址
3. 在 DungeonMaster 設定 DungeonStorage 地址

### 常用管理功能
- 暫停/恢復合約：`pause()` / `unpause()`
- 設定價格：`setMintPriceUSD(uint256)`
- 設定費用：`setPlatformFee(uint256)`
- 提取資金：`withdrawBNB()` / `withdrawSoulShard()`

### VIP 質押特殊說明
- 預設冷卻期：15 秒（測試用）
- 正式環境建議：7-14 天
- 設定函數：`setUnstakeCooldown(uint256 seconds)`

## 安全考量
1. 所有合約都實現了 Pausable，可緊急暫停
2. 使用 ReentrancyGuard 防止重入攻擊
3. 關鍵函數都有 onlyOwner 修飾符
4. NFT 轉移有特殊限制（如 VIP NFT 不可轉移）

## 測試指令
```bash
# 運行所有測試
npx hardhat test

# 運行特定測試
npx hardhat test test/Hero.test.js

# 查看測試覆蓋率
npx hardhat coverage
```

## 常見問題
1. **合約地址不一致**：確保 .env 文件中的地址與實際部署地址匹配
2. **權限錯誤**：檢查是否已正確設定合約間的連接
3. **交易失敗**：確認 BNB 餘額充足，gas 設定合理

## 開發提示
- 修改合約後記得更新前端和子圖的 ABI
- 部署新版本時記錄在 DEPLOYMENT_RECORD_YYYY-MM-DD.md
- 重要變更請更新此文件
- **合約地址管理**：參考 CONTRACT_ADDRESSES.md 文件了解所有需要更新地址的位置

## 🔄 統一配置管理系統

### 🎯 核心理念
合約項目是配置的**唯一源頭**，所有其他項目（前端、後端、子圖）從此同步。

### 📍 主配置文件（唯一需要手動維護）
```bash
/Users/sotadic/Documents/DungeonDelversContracts/.env.v25
```

### 🚀 標準操作流程

#### 1. 更新合約地址
```bash
# 編輯主配置文件
vim /Users/sotadic/Documents/DungeonDelversContracts/.env.v25

# 或使用 VS Code
code /Users/sotadic/Documents/DungeonDelversContracts/.env.v25
```

#### 2. 一鍵同步到所有項目
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/ultimate-config-system.js sync
```

#### 3. 驗證同步結果
```bash
# 查看系統狀態
node scripts/ultimate-config-system.js status

# 驗證配置一致性
node scripts/ultimate-config-system.js validate
```

### 🎛️ 可用命令
```bash
# 完整同步（推薦）
node scripts/ultimate-config-system.js sync

# 分項同步
node scripts/ultimate-config-system.js frontend   # 只同步前端
node scripts/ultimate-config-system.js backend    # 只同步後端
node scripts/ultimate-config-system.js subgraph   # 只同步子圖
node scripts/ultimate-config-system.js abi        # 只同步 ABI

# 系統管理
node scripts/ultimate-config-system.js status     # 顯示系統狀態
node scripts/ultimate-config-system.js validate   # 驗證所有配置
```

### 📋 自動管理內容
- ✅ **前端配置**：`/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local`
- ✅ **後端配置**：`/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json`
- ✅ **子圖配置**：`/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/networks.json`
- ✅ **ABI 文件**：自動提取並分發到前端和子圖

### ⚡ 關鍵 ABI 管理
系統自動管理以下 7 個核心合約的 ABI：
1. **Hero** - 英雄 NFT
2. **Relic** - 聖物 NFT
3. **Party** (Party) - 隊伍 NFT
4. **DungeonMaster** - 地城邏輯
5. **DungeonStorage** - 地城存儲
6. **AltarOfAscension** - 升星祭壇
7. **VRFConsumerV2Plus** - VRF 消費者

### 🛡️ 安全特性
- **原子性同步**：要麼全部成功，要麼全部回滾
- **自動備份**：變更前自動備份原始配置
- **完整驗證**：同步後自動驗證地址一致性
- **錯誤追蹤**：詳細的錯誤報告和修復建議

### 🚨 重要提醒
1. **永遠不要**直接編輯其他項目的配置文件
2. **只維護**主配置文件 `.env.v25`
3. **同步後**重啟各項目的開發服務器
4. **部署前**執行 `validate` 確保配置正確

### 🔧 部署專用配置
```bash
# 部署環境變數 (.env) - 與配置同步無關
PRIVATE_KEY=0x...
BSCSCAN_API_KEY=...
```
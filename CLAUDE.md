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
# 創建 .env 文件，添加必要的部署變數
cat > .env << EOF
# 部署私鑰（請使用你自己的安全私鑰）
PRIVATE_KEY=0x...

# BSC Scan API Key（用於合約驗證）
BSCSCAN_API_KEY=...

# 其他配置會從統一配置管理系統自動載入
EOF
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

部署者錢包地址：`0xEbCF4A36Ad1485A9737025e9d72186b604487274`

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

## ⚡ BSC Gas 優化設定 (重要！)

### 🚨 Gas Price 標準
**BSC 網路必須使用低 gas price 以降低成本：**
- **標準設定**: 0.11 gwei (永遠不要超過 0.2 gwei)
- **緊急情況**: 最多 0.5 gwei
- **絕對禁止**: 1 gwei 以上的設定

### 📝 所有腳本必須遵循
```javascript
// ✅ 正確設定
GAS_PRICE: ethers.parseUnits("0.11", "gwei")

// ❌ 錯誤設定 - 會造成 27 倍成本浪費
GAS_PRICE: ethers.parseUnits("3", "gwei")
```

### 🛡️ 成本影響
- 0.11 gwei: ~$0.001 per transaction (理想)
- 3 gwei: ~$0.027 per transaction (浪費)
- **差異**: 2600% 成本增加

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

## 📝 合約地址管理標準作業程序 (SOP)

### 🎯 核心原則
**當用戶要求「管理地址」或「更新合約配置」時，使用統一配置管理工具箱**

### 🛠️ 完整配置管理工具箱

#### 1. 🏆 核心同步工具 - `scripts/ultimate-config-system.js`
```bash
# 🎯 主要工具：最完整的配置同步系統

# 查看當前狀態
node scripts/ultimate-config-system.js status

# 一鍵同步所有項目（最常用）
node scripts/ultimate-config-system.js sync

# 驗證所有配置一致性
node scripts/ultimate-config-system.js validate
```

#### 2. 🔍 硬編碼審計工具 - `scripts/hardcoded-audit.js`
```bash
# 掃描所有硬編碼地址，識別過時地址
node scripts/hardcoded-audit.js audit

# 生成詳細報告
node scripts/hardcoded-audit.js report
```

#### 3. 🔍 配置驗證工具 - `scripts/config-validator.js`
```bash
# 驗證配置一致性
node scripts/config-validator.js validate

# 實時監控模式
node scripts/config-validator.js watch

# 快速檢查
node scripts/config-validator.js quick
```

#### 4. 🎛️ 監控系統 - `scripts/config-monitor.js`
```bash
# 啟動全自動監控（推薦開發時運行）
node scripts/config-monitor.js start

# 手動觸發同步
node scripts/config-monitor.js sync

# 手動觸發驗證
node scripts/config-monitor.js validate
```

### 📋 標準操作步驟

#### 1. 了解用戶需求
```bash
# 常見請求類型：
# - "更新合約地址"
# - "同步最新配置" 
# - "檢查配置一致性"
# - "修復前端/後端/子圖配置錯誤"
# - "掃描硬編碼問題"
# - "清理過時地址"
```

#### 2. 選擇合適的工具
```bash
# 🚀 日常配置更新（推薦）
node scripts/ultimate-config-system.js sync

# 🔍 問題診斷
node scripts/config-validator.js validate
node scripts/hardcoded-audit.js audit

# 🎛️ 開發環境（自動化）
node scripts/config-monitor.js start
```

#### 3. 配置修改流程
```bash
# 修改地址：編輯唯一的主配置文件
vim .env.v25

# 自動同步（如果運行監控系統）
# 或手動同步
node scripts/ultimate-config-system.js sync

# 驗證結果
node scripts/config-validator.js validate
```

### 🗂️ 自動管理的文件清單

#### ✅ 前端項目 (DungeonDelvers)
```bash
# 自動生成/更新：
/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local
/Users/sotadic/Documents/GitHub/DungeonDelvers/public/config/latest.json
/Users/sotadic/Documents/GitHub/DungeonDelvers/src/contracts/abi/*.json

# 內容包含：
# - VITE_HERO_ADDRESS, VITE_RELIC_ADDRESS 等所有合約地址
# - VITE_CHAIN_ID, VITE_NETWORK 等網路配置  
# - VITE_SUBGRAPH_URL, VITE_BACKEND_URL 等服務端點
# - VITE_VRF_* 等 VRF 配置
```

#### ✅ 後端項目 (dungeon-delvers-metadata-server)
```bash
# 自動生成/更新：
/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json

# 內容包含：
# - contracts: { hero, relic, party, ... } 所有合約地址
# - vrf: { subscriptionId, coordinator, keyHash } VRF 配置
# - subgraph: { url, version } 子圖信息
# - deployment: { version, date, startBlock } 部署信息
```

#### ✅ 子圖項目 (DDgraphql/dungeon-delvers)
```bash
# 自動生成/更新：
/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/networks.json
/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/*.json

# 自動同步地址和起始區塊，以及 ABI 文件
```

### 🚨 重要提醒

#### ❌ 絕對不要做的事情
1. **不要直接編輯**前端的 `.env.local` 或 `public/config/latest.json` 文件
2. **不要直接編輯**後端的 `config/contracts.json` 文件  
3. **不要直接編輯**子圖的 `networks.json` 文件
4. **不要手動複製貼上**地址到多個文件
5. **不要手動複製 ABI 文件**

#### ✅ 正確的做法
1. **只編輯** `.env.v25` 主配置文件
2. **執行同步命令**讓系統自動更新所有項目
3. **用驗證命令**確保配置一致性
4. **重啟相關服務**使配置生效

### 🔄 完整工作流程範例

```bash
# 用戶說："幫我更新合約地址到最新的部署"

# 1. 先檢查當前狀態
node scripts/ultimate-config-system.js status

# 2. 如果地址不對，修改主配置
vim .env.v25  # 更新合約地址

# 3. 同步到所有項目
node scripts/ultimate-config-system.js sync

# 4. 驗證結果
node scripts/config-validator.js validate

# 5. 可選：掃描硬編碼問題
node scripts/hardcoded-audit.js audit

# 6. 提醒用戶重啟服務
echo "請重啟前端、後端、子圖服務使配置生效"
```

### 📊 故障排除

#### 配置不一致錯誤
```bash
# 如果 validate 失敗，重新同步
node scripts/ultimate-config-system.js sync
node scripts/config-validator.js validate
```

#### 過時地址問題
```bash
# 掃描並修復過時地址
node scripts/hardcoded-audit.js audit
node scripts/ultimate-config-system.js sync
```

#### 監控系統故障
```bash
# 重啟監控系統
pkill -f config-monitor
node scripts/config-monitor.js start
```

### 🎯 快速命令參考

```bash
# 🏆 最常用的命令：
node scripts/ultimate-config-system.js sync      # 同步所有配置
node scripts/config-validator.js validate        # 驗證配置一致性  
node scripts/ultimate-config-system.js status    # 查看系統狀態

# 🔍 問題診斷：
node scripts/hardcoded-audit.js audit           # 掃描硬編碼問題
node scripts/config-validator.js quick          # 快速配置檢查

# 🎛️ 自動化：
node scripts/config-monitor.js start            # 啟動監控系統

# 記住：這套系統已解決了 4000+ 硬編碼地址問題，讓配置管理從 "手動更新 N 個文件" 變成 "只需要 1 個命令"
```

### 📈 系統效果統計（截至 2025-08-17）

```bash
# 🎉 V25 部署完成統計：
# ✅ 合約地址: 13個核心合約全面升級 (Hero, Relic, DungeonMaster 等)
# ✅ VRF 系統: 從兩步式 → 一步式回調機制完全重構
# ✅ 錯誤訊息: 27個縮寫 → 完整描述 (提升調試體驗)
# ✅ 前端項目: 1,300個硬編碼地址 → 統一管理
# ✅ 後端項目: 567個硬編碼地址 → 統一管理  
# ✅ 子圖項目: 721個硬編碼地址 → 統一管理
# ✅ 過時地址: 318個 → 0個 (已全部修復)

# ⚡ 效率提升：
# 配置更新時間: 30分鐘 → 2分鐘 (93%↓)
# 配置驗證時間: 15分鐘 → 10秒 (98%↓)
# 維護文件數量: N個 → 1個 (.env.v25)
# 錯誤調試時間: 大幅減少 (標準化錯誤訊息)
```
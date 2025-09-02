# 🏰 DungeonDelvers Smart Contracts V1

## 📋 概述

DungeonDelvers 是一款完全去中心化的 NFT 遊戲，運行在 BSC 主網上。這個智能合約庫包含了第一代遊戲的核心邏輯，包括 Hero NFT 鑄造、Relic 系統、探險機制和獎勵分配。

### 🎯 V1 主要特色
- **第一代遊戲體驗**: 奠定 DungeonDelvers 宇宙的基礎架構
- **完全去中心化**: 所有遊戲邏輯都在智能合約中
- **NFT 驅動**: Hero 和 Relic 作為遊戲的核心資產
- **探險系統**: 玩家可以派遣 Hero 進行地下城探險
- **獎勵機制**: 基於成功率的動態獎勵系統
- **VRF 隨機性**: 使用 Chainlink VRF 確保公平性

## 🔧 合約架構

### 核心合約
- **DungeonCore**: 系統的中心合約，管理所有其他合約的交互
- **Oracle**: 價格預言機，提供 BNB/USD 價格數據
- **DungeonStorage**: 地下城配置和數據存儲

### NFT 合約
- **Hero**: Hero NFT 合約，包含屬性和等級系統
- **Relic**: Relic NFT 合約，提供戰力加成
- **Party**: 隊伍系統，允許多個 Hero 組隊

### 遊戲邏輯
- **DungeonMaster**: 探險邏輯和獎勵分配
- **AltarOfAscension**: Hero 升階系統

### 支援系統
- **PlayerProfile**: 玩家檔案和統計
- **PlayerVault**: 玩家資金管理
- **VIPStaking**: VIP 質押系統
- **VRFConsumerV2Plus**: Chainlink VRF 集成

## 🚀 部署指南

### 環境準備
```bash
# 安裝依賴
npm install

# 確保 .env 文件包含必要的配置
# PRIVATE_KEY=你的部署私鑰
# BSCSCAN_API_KEY=你的BSCScan API密鑰
```

### 編譯合約
```bash
# 編譯所有合約
npm run compile

# 清理編譯緩存
npm run clean
```

### 部署到 BSC
```bash
# 部署到 BSC 主網
npm run deploy

# 部署到 BSC 測試網
npm run deploy:testnet

# 完整部署流程 (部署 + 驗證 + 設置 + ABI提取)
npm run deploy-all
```

### 合約驗證
```bash
# 驗證主網合約
npm run verify

# 驗證測試網合約
npm run verify:testnet
```

### 合約設置
```bash
# 配置合約連接和權限
npm run setup

# 測試網設置
npm run setup:testnet
```

### ABI 提取
```bash
# 提取 ABI 到前端項目
npm run extract-abi
```

## 📊 V1 合約地址 (BSC 主網)

### 核心合約
```
DungeonCore: 0x5b64a5939735ff762493d9b9666b3e13118c5722
Oracle: 0xee322eff70320759487f67875113c062ac1f4cfb
DungeonStorage: 0x474ee307d9cd81670a4773e4e9a124853fa51db0
```

### NFT 合約
```
Hero: 0x3052ab6c5b307478d943beba63efcdd97aecb526
Relic: 0x5b967d67c7cbbcba140820757c670c99c61ee530
Party: 0x3cfed1ac185f66830342a9a796cb5bb4ef611fe6
```

### 遊戲邏輯
```
DungeonMaster: 0x0256aecec4d93ef13e14237ab5c63d2dd3eee2be
AltarOfAscension: 0x3146e1026c134f098caf15c4e3c2b751a357d77c
```

### 支援系統
```
PlayerProfile: 0xc869e2dcc64f76149e8392a0735b76bcfe79669a
PlayerVault: 0x6a3fb49538c58cbeb537daf12c276cbc97c6e8ec
VIPStaking: 0xacce5647880211c07d17eeae49364bb7db36aa3c
VRFConsumerV2Plus: 0x934c8cd6c4f39673ca44c9e88a54cbe2f71782b9
```

### 代幣
```
TSOUL (Soul Shard): 0xb73fe158689eab3396b64794b573d4bec7113412
TUSD1 (Test USD): 0x9dc0b768533222fddbe6a9bd71ead96a7c612c61
```

## ⚡ BSC Gas 優化

第一代智能合約採用極致的 BSC 優化策略：
- **0.11 gwei gas price**: 比標準 3 gwei 節省 **96%** 部署成本
- **viaIR 編譯**: 解決複雜合約的 Stack too deep 問題
- **精簡架構**: 4 個核心部署腳本，自動化完整流程

## 🔒 V1 安全特性

- **模塊化設計**: 各合約職責分離，降低風險
- **權限控制**: 分層的管理員和操作員權限
- **VRF 隨機性**: 使用 Chainlink VRF 確保隨機數公平性
- **Oracle 保護**: 防止價格操縱攻擊
- **緊急暫停**: 關鍵功能的安全開關

## 🧪 測試

```bash
# 運行測試套件
npm test

# 編譯測試
npm run compile
```

## 🏗️ 項目結構

```
DungeonDelversContracts/
├── contracts/          # 15 個智能合約
│   ├── current/core/   # 核心系統合約
│   ├── current/nft/    # NFT 相關合約
│   ├── current/defi/   # DeFi 功能合約
│   └── current/interfaces/ # 合約接口
├── scripts/essential/  # 4 個核心部署腳本
├── abis/              # 自動生成的 ABI 文件
└── .env               # 環境配置文件
```

## 🎮 V1 遊戲機制

### Hero 系統
- **鑄造機制**: 使用 BNB 鑄造 Hero NFT
- **屬性系統**: 每個 Hero 擁有獨特的戰力值
- **升階系統**: 通過 Altar of Ascension 提升 Hero 等級

### 探險系統
- **地下城設計**: 3 個初始地下城，不同難度和獎勵
- **隊伍機制**: 最多 3 個 Hero 組成探險隊
- **成功率計算**: 基於隊伍總戰力和地下城難度

### 獎勵系統
- **TSOUL 代幣**: 探險成功獲得的主要獎勵
- **動態調整**: 獎勵根據成功率和地下城難度調整
- **VIP 加成**: VIP 質押者享有額外獎勵

## 🔗 相關連結

- **前端應用**: SoulboundSaga (React + Viem + Wagmi)
- **後端 API**: dungeon-delvers-metadata-server
- **子圖索引**: The Graph Protocol 集成
- **白皮書**: 詳細的遊戲機制和經濟模型

## 📄 授權

這個項目使用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

---

*🏰 DungeonDelvers V1 - 去中心化冒險遊戲的開端*
# V25 完整合約地址清單

**部署日期**: 2025-08-01  
**網路**: BSC Mainnet (Chain ID: 56)  
**部署區塊**: 55808316+  

## 🎯 核心變更摘要

本次 V25 部署主要解決 PlayerVault 稅收機制問題：
- **從**: 自動轉移稅款給 Owner
- **到**: 虛擬記帳制度 (`virtualTaxBalance`)

## 📋 完整合約地址列表

### 核心系統合約
```env
# 🏛️ 核心治理
DUNGEONCORE_ADDRESS=0x398F362ec79064159FFbb1079C9cA683896B758b
ORACLE_ADDRESS=0x1d13750861ABE5aec2b4166F8a41edE084693f51

# 💰 代幣系統  
SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
PLAYERVAULT_ADDRESS=0x8c3A73E27C518f082150330e5666e765B52297AF
```

### NFT 合約
```env
# 🦸 角色與裝備
HERO_ADDRESS=0x20E0db8EFCC7608fCFFBbF2f95A86824b034D1e7
RELIC_ADDRESS=0x3c8F1b4172a076D31f0F8fa981E166aDA92C2B79
PARTY_ADDRESS=0x1f21fE51c039321246b219B9F659eaCA9a53176F
```

### 遊戲系統合約
```env
# 🏰 地城系統
DUNGEONMASTER_ADDRESS=0x913E5c5c6d844630fd01CbDed82F029f356f1809
DUNGEONSTORAGE_ADDRESS=0xB5eFB972f67cA8488EDdd19bDf4e86D30dE779c1

# ⭐ 升級系統
ALTAROFASCENSION_ADDRESS=0x167F42bcC21a5ab5319b787F8C2e045f9Aeaa4dD
```

### 社交與 VIP 系統
```env
# 👥 社交系統
PLAYERPROFILE_ADDRESS=0xB203a1e73500E40A1eeb1D6A51cDDbf2fEb227a2
VIPSTAKING_ADDRESS=0xa55fee3ba652e6Ff42ac12C8598C5fDfC26EE4Bf
```

### 工具地址
```env
# 🔧 系統工具
DUNGEONMASTERWALLET_ADDRESS=0x10925A7138649C7E1794CE646182eeb5BF8ba647
UNISWAP_POOL_ADDRESS=0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82
TESTUSD_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
```

## 🔗 區塊鏈驗證連結

| 合約 | BSCScan 連結 | 狀態 |
|------|-------------|------|
| DungeonCore | [0x398F...758b](https://bscscan.com/address/0x398F362ec79064159FFbb1079C9cA683896B758b) | ✅ 已驗證 |
| Oracle | [0x1d13...3f51](https://bscscan.com/address/0x1d13750861ABE5aec2b4166F8a41edE084693f51) | ✅ 已驗證 |
| PlayerVault | [0x8c3A...7AF](https://bscscan.com/address/0x8c3A73E27C518f082150330e5666e765B52297AF) | ✅ 已驗證 |
| Hero | [0x20E0...1e7](https://bscscan.com/address/0x20E0db8EFCC7608fCFFBbF2f95A86824b034D1e7) | ✅ 已驗證 |
| Relic | [0x3c8F...B79](https://bscscan.com/address/0x3c8F1b4172a076D31f0F8fa981E166aDA92C2B79) | ✅ 已驗證 |
| Party | [0x1f21...76F](https://bscscan.com/address/0x1f21fE51c039321246b219B9F659eaCA9a53176F) | ✅ 已驗證 |
| DungeonMaster | [0x913E...809](https://bscscan.com/address/0x913E5c5c6d844630fd01CbDed82F029f356f1809) | ✅ 已驗證 |
| DungeonStorage | [0xB5eF...9c1](https://bscscan.com/address/0xB5eFB972f67cA8488EDdd19bDf4e86D30dE779c1) | ✅ 已驗證 |
| AltarOfAscension | [0x167F...4dD](https://bscscan.com/address/0x167F42bcC21a5ab5319b787F8C2e045f9Aeaa4dD) | ✅ 已驗證 |
| PlayerProfile | [0xB203...7a2](https://bscscan.com/address/0xB203a1e73500E40A1eeb1D6A51cDDbf2fEb227a2) | ✅ 已驗證 |
| VIPStaking | [0xa55f...de4](https://bscscan.com/address/0xa55fee3ba652e6Ff42ac12C8598C5fDfC26EE4Bf) | ✅ 已驗證 |

## 📊 專案更新檢查清單

### 🎯 必須執行的同步任務

#### 1. **前端專案** `/Users/sotadic/Documents/GitHub/DungeonDelvers/`
- [ ] 執行: `node ../DungeonDelversContracts/scripts/active/v25-sync-all.js`
- [ ] 更新 `.env` 和 `.env.local` 文件
- [ ] 重新生成 TypeScript 類型
- [ ] 測試所有合約交互功能

#### 2. **子圖專案** `/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/`
- [ ] 更新 `networks.json` 中的合約地址
- [ ] 更新 `subgraph.yaml` 中的起始區塊
- [ ] 新增 `VirtualTaxCollected` 事件處理
- [ ] 執行: `npm run codegen && npm run build`
- [ ] 部署新版本到 The Graph

#### 3. **後端專案** `/Users/sotadic/Documents/dungeon-delvers-metadata-server/`
- [ ] 更新合約地址配置
- [ ] 更新 ABI 文件
- [ ] 重啟服務並測試

### 🔄 一鍵同步指令

```bash
# 在合約專案根目錄執行
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/active/v25-sync-all.js

# 這將自動同步：
# ✅ 前端所有配置文件
# ✅ 後端合約地址
# ✅ 子圖配置文件
# ✅ ABI 文件
# ✅ 環境變數文件
```

## 🆕 PlayerVault 關鍵變更

### 新增功能
- `virtualTaxBalance`: 虛擬稅收餘額追蹤
- `getVirtualTaxBalance()`: 查詢累積稅收
- `withdrawTax()`: Owner 提取稅收
- `VirtualTaxCollected` 事件: 稅收記錄追蹤

### 影響範圍
- **前端**: 可選加入稅收累積狀態顯示 (僅 Owner 可見)
- **子圖**: 必須新增 `VirtualTaxCollected` 事件監聽
- **後端**: 無需特別修改，相容現有 API

## ⚠️ 重要提醒

1. **所有合約地址都已變更** - 必須更新所有專案配置
2. **起始區塊已更新** - 子圖需要使用新的 startBlock
3. **ABI 已變更** - PlayerVault 新增了虛擬稅收相關函數
4. **稅收機制變更** - 從自動轉移改為虛擬記帳

## 🚀 下一步行動

1. 執行 `v25-sync-all.js` 同步所有配置
2. 重新部署子圖到 The Graph
3. 前端整合測試確認功能正常
4. 監控新稅收機制運作狀況

---

**部署完成**: ✅ 2025-08-01 19:10 UTC  
**驗證狀態**: ✅ 所有合約已在 BSCScan 驗證  
**同步狀態**: ⏳ 等待執行同步腳本
# 🎮 DungeonDelvers 合約部署配置分析

## 📊 **新部署合約地址總覽**

### **核心系統 (Core System)**
```yaml
DUNGEONCORE:        0x6c900a1cf182aa5960493bf4646c9efc8eaed16b  # 中央控制合約 🎯
DUNGEONMASTER:      0xa573ccf8332a5b1e830ea04a87856a28c99d9b53  # 遊戲邏輯控制器
DUNGEONSTORAGE:     0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791  # 數據存儲合約
ALTAROFASCENSION:   0x3dfd80271eb96c3be8d1e841643746954ffda11d  # NFT 升級系統
VRF_MANAGER_V2PLUS: 0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c  # 隨機數管理器
```

### **NFT 系統 (NFT System)**
```yaml
HERO:               0xc09b6613c32a505bf05f97ed2f567b4959914396  # 英雄 NFT
RELIC:              0xf4ae79568a34af621bbea06b716e8fb84b5b41b6  # 聖物 NFT
PARTY:              0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129  # 隊伍 NFT
```

### **玩家系統 (Player System)**
```yaml
PLAYERPROFILE:      0xea827e472937abd1117f0d4104a76e173724a061  # 玩家檔案 SBT
VIPSTAKING:         0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d  # VIP 質押系統
PLAYERVAULT:        0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0  # 玩家金庫
```

### **重複使用的合約 (Reused Contracts)**
```yaml
ORACLE:             0x21928de992cb31ede864b62bc94002fb449c2738  # 價格預言機 ✅
SOULSHARD:          0x1a98769b8034d400745cc658dc204cd079de36fa  # 遊戲代幣 ✅
USD1:               0x916a2a1eb605e88561139c56af0698de241169f2  # 測試美元幣 ✅
UNISWAP_POOL:       0x2733f7e7e95d22e7691e5aa5abb6210cf81ebdba  # 流動性池 ✅
```

---

## 🔧 **合約間關係與配置需求**

### **1. DungeonCore (中央樞紐) - 需要設置 10 個地址**

DungeonCore 是整個系統的中央控制器，需要註冊所有衛星合約：

```javascript
// 在 DungeonCore 中需要設置的地址：
await dungeonCore.setHeroContract("0xc09b6613c32a505bf05f97ed2f567b4959914396");
await dungeonCore.setRelicContract("0xf4ae79568a34af621bbea06b716e8fb84b5b41b6");
await dungeonCore.setPartyContract("0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129");
await dungeonCore.setPlayerProfile("0xea827e472937abd1117f0d4104a76e173724a061");
await dungeonCore.setVipStaking("0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d");
await dungeonCore.setPlayerVault("0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0");
await dungeonCore.setDungeonMaster("0xa573ccf8332a5b1e830ea04a87856a28c99d9b53");
await dungeonCore.setAltarOfAscension("0x3dfd80271eb96c3be8d1e841643746954ffda11d");
await dungeonCore.setVRFManager("0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c");
await dungeonCore.setDungeonStorage("0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791");

// 已設置的地址 (繼續使用)：
// Oracle: 0x21928de992cb31ede864b62bc94002fb449c2738
// SoulShard: 0x1a98769b8034d400745cc658dc204cd079de36fa
// USD Token: 0x916a2a1eb605e88561139c56af0698de241169f2
```

### **2. 所有衛星合約 - 需要設置 DungeonCore 地址**

每個衛星合約都需要知道 DungeonCore 的地址以進行跨合約通信：

```javascript
const DUNGEON_CORE = "0x6c900a1cf182aa5960493bf4646c9efc8eaed16b";

// NFT 系統
await heroContract.setDungeonCore(DUNGEON_CORE);
await relicContract.setDungeonCore(DUNGEON_CORE);
await partyContract.setDungeonCore(DUNGEON_CORE);

// 玩家系統
await playerProfile.setDungeonCore(DUNGEON_CORE);
await vipStaking.setDungeonCore(DUNGEON_CORE);
await playerVault.setDungeonCore(DUNGEON_CORE);

// 遊戲系統
await dungeonMaster.setDungeonCore(DUNGEON_CORE);
await altarOfAscension.setDungeonCore(DUNGEON_CORE);
await vrfManager.setDungeonCore(DUNGEON_CORE);
```

### **3. VRF Manager - 需要授權合約**

VRF Manager 需要授權哪些合約可以請求隨機數：

```javascript
// 授權需要隨機數的合約
await vrfManager.setAuthorizedContract("0xa573ccf8332a5b1e830ea04a87856a28c99d9b53", true); // DungeonMaster
await vrfManager.setAuthorizedContract("0x3dfd80271eb96c3be8d1e841643746954ffda11d", true); // AltarOfAscension
```

---

## ⚠️ **關鍵配置風險點**

### **🔴 高優先級 - 立即設置**
1. **DungeonCore 設置不完整** → 系統功能失效
2. **VRF 授權缺失** → 隨機數請求失敗 → 戰鬥/升級無法進行
3. **衛星合約未連接 Core** → 跨合約調用失敗

### **🟡 中優先級 - 功能測試前設置**
1. **Oracle 連接驗證** → 價格查詢功能測試
2. **Token 餘額檢查** → 遊戲經濟系統驗證

### **🟢 低優先級 - 上線前優化**
1. **Gas 參數調整** → VRF 回調 Gas 限制
2. **URI 設置** → NFT 元數據路徑

---

## 📝 **配置檢查清單**

### **階段 1: 核心連接 (必須完成)**
- [ ] DungeonCore 設置所有 10 個衛星合約地址
- [ ] 所有 8 個衛星合約設置 DungeonCore 地址
- [ ] VRF Manager 授權 DungeonMaster 和 AltarOfAscension

### **階段 2: 功能驗證 (測試前完成)**
- [ ] Oracle 價格查詢測試
- [ ] SoulShard 代幣餘額檢查
- [ ] VRF 隨機數生成測試

### **階段 3: 系統整合 (上線前完成)**
- [ ] 跨合約調用流程測試
- [ ] 經濟系統完整性驗證
- [ ] Gas 優化和參數調整

---

## 🚀 **快速部署腳本建議**

建議建立分階段部署腳本：

1. **`setup-core-connections.js`** - 建立核心連接
2. **`setup-authorizations.js`** - 設置權限和授權
3. **`verify-integrations.js`** - 驗證系統整合
4. **`production-optimization.js`** - 生產環境優化

---

## 📊 **子圖配置更新需求**

根據新地址，子圖也需要更新：

### **需要更新的合約地址**
```yaml
# subgraph.yaml 中需要更新：
Hero:               0xc09b6613c32a505bf05f97ed2f567b4959914396  # ✅ 已更新
Relic:              0xf4ae79568a34af621bbea06b716e8fb84b5b41b6  # ✅ 已更新
Party:              0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129  # ✅ 已更新
DungeonMaster:      0xa573ccf8332a5b1e830ea04a87856a28c99d9b53  # ✅ 已更新
AltarOfAscension:   0x3dfd80271eb96c3be8d1e841643746954ffda11d  # ✅ 已更新
VIPStaking:         0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d  # ✅ 已更新
PlayerProfile:      0xea827e472937abd1117f0d4104a76e173724a061  # ✅ 已更新
PlayerVault:        0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0  # ✅ 已更新
```

### **起始區塊設置**
所有合約都設置為統一的起始區塊：`62385903`

---

*文檔生成時間: 2025-09-20*
*子圖版本: v1.4.0.3*
*合約架構: Diamond Proxy + Satellite Pattern*
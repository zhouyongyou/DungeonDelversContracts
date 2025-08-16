# 📋 V25 部署記錄 - 2025-08-06 PM 5

## 🎯 部署概覽

**版本**: V25  
**日期**: 2025-08-06 下午 5:00  
**子圖版本**: v3.6.7  
**起始區塊**: 56664525  

## 🏗️ 合約地址更新

### ✅ 新部署的合約
- **DUNGEONSTORAGE**: `0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468`
- **DUNGEONMASTER**: `0xE391261741Fad5FCC2D298d00e8c684767021253`
- **ALTAROFASCENSION**: `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33`
- **PARTY**: `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3`

### 🔄 復用現有合約（但需重新設置連接）
- **DUNGEONCORE**: `0x8a2D2b1961135127228EdD71Ff98d6B097915a13`
- **PLAYERVAULT**: `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787`
- **PLAYERPROFILE**: `0x0f5932e89908400a5AfDC306899A2987b67a3155`
- **VIPSTAKING**: `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C`
- **ORACLE**: `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a`

### 🔒 長期固定使用合約
- **HERO**: `0x575e7407C06ADeb47067AD19663af50DdAe460CF` (來自修復版本)
- **RELIC**: `0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739` (來自修復版本)
- **VRF_MANAGER_V2PLUS**: `0xD95d0A29055E810e9f8c64073998832d66538176`

### 📌 不變的外部合約
- **SOULSHARD**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`
- **UNISWAP_POOL**: `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82`
- **USD**: `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE`

## 📦 同步更新狀態

### ✅ 前端項目同步完成
**路徑**: `/Users/sotadic/Documents/GitHub/DungeonDelvers/`

**已更新文件**:
- ✅ `src/config/contracts.ts` - V25 合約地址更新
- ✅ `src/lib/abis/DungeonMaster.json` - 新 ABI
- ✅ `src/lib/abis/DungeonStorage.json` - 新 ABI
- ✅ `src/lib/abis/AltarOfAscension.json` - 新 ABI (AltarOfAscension)
- ✅ `src/lib/abis/Party.json` - 新 ABI (Party)

### ✅ 子圖項目同步完成
**路徑**: `/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/`

**已更新文件**:
- ✅ `networks.json` - 所有地址和起始區塊更新為 56664525
- ✅ `abis/DungeonMaster.json` - 新 ABI
- ✅ `abis/DungeonStorage.json` - 新 ABI  
- ✅ `abis/AltarOfAscension.json` - 新 ABI (AltarOfAscension)
- ✅ `abis/Party.json` - 新 ABI (Party)

## 🔧 技術詳情

### 起始區塊設定
- **統一起始區塊**: `56664525`
- **適用於所有合約**: 確保子圖從正確區塊開始索引

### ABI 文件來源
```bash
# 來源路徑
/Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts/current/

# 複製的 ABI 文件
- core/DungeonMaster.sol/DungeonMaster.json
- core/DungeonStorage.sol/DungeonStorage.json  
- core/AltarOfAscension.sol/AltarOfAscension.json
- nft/Party.sol/Party.json
```

### 合約版本說明
- **DungeonMaster**: 最新核心邏輯
- **DungeonStorage**: 最新數據存儲
- **AltarOfAscension**: VRF 版本 (AltarOfAscension)
- **Party**: V3 版本 (Party)

## ⚠️ 重要提醒

### 需要執行的後續工作
1. **合約互連設置**: 新部署的合約需要與現有系統建立連接
2. **子圖重新部署**: 更新版本至 v3.6.7
3. **前端部署**: 推送新配置到生產環境
4. **測試驗證**: 確保所有功能正常運作

### 用戶端影響
- **用戶無需重新授權**: HERO 和 RELIC 地址未變
- **新功能可用**: Party V3 和 AltarOfAscension VRF 的新特性

## 📋 檢查清單

- [x] **合約地址確認**: 所有地址已確認並填入
- [x] **前端配置更新**: contracts.ts 和 ABI 文件已更新
- [x] **子圖配置更新**: networks.json 和 ABI 文件已更新
- [x] **起始區塊設定**: 統一設為 56664525
- [x] **版本記錄**: V25 部署記錄已創建
- [ ] **合約互連設置**: 需要執行合約間連接設定
- [ ] **子圖部署**: 需要重新部署到 v3.6.7
- [ ] **前端部署**: 需要部署到生產環境
- [ ] **測試驗證**: 需要進行完整功能測試

## 🎉 部署完成

**V25 版本同步更新已完成！** 

所有配置文件和 ABI 已更新到最新版本，系統已準備好進行下一階段的部署和測試。
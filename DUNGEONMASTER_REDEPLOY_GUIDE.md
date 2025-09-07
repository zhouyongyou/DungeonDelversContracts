# 🏰 DungeonMaster 重新部署指南

## 概述
此指南將幫助您重新部署 DungeonMaster 合約並與 DungeonCore 建立完整的互連。

## ⚠️ 重要安全提醒
- **Gas Price 固定為 0.11 gwei** - 絕對不可修改
- 確保錢包有足夠的 BNB 餘額
- 在主網部署前建議先在測試網測試

## 📋 前置要求

### 1. 環境檢查
```bash
# 確認 .env 文件包含必要的合約地址
cat .env | grep -E "(DUNGEONCORE_ADDRESS|ORACLE_ADDRESS|VRF_MANAGER)"
```

### 2. 餘額檢查
```bash
# 確保部署錢包有足夠餘額 (建議至少 0.1 BNB)
```

## 🚀 部署流程

### 步驟 1: 重新部署 DungeonMaster
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/essential/redeploy-dungeonmaster.js
```

**此腳本將執行：**
- ✅ 部署新的 DungeonMaster 合約
- ✅ 設置 DungeonCore 連接
- ✅ 更新 .env 文件中的地址
- ✅ 更新 ABI 文件
- ✅ 建立雙向互連

### 步驟 2: 驗證部署結果
```bash
node scripts/essential/verify-dungeonmaster-setup.js
```

**驗證項目：**
- 🔗 DungeonMaster ↔ DungeonCore 連接
- ⚙️ 合約基本配置
- 🧪 功能狀態檢查

### 步驟 3: (可選) 手動設置連接
如果自動設置失敗，可以手動執行：
```bash
node scripts/essential/setup-dungeonmaster-connections.js
```

## 📊 部署輸出說明

### 成功部署輸出示例：
```
⚔️ Redeploying DungeonMaster with CORE Integration
============================================================
Deploying with account: 0x84cd...
Account balance: 1.2345 BNB
Gas price: 0.11 gwei

🚀 Phase 1: Deploying DungeonMaster...
✅ DungeonMaster deployed at: 0x1234...

🔗 Phase 2: Setting DungeonCore connection...
✅ DungeonCore address set in DungeonMaster

📝 Phase 3: Updating .env file...
✅ Updated .env with new DungeonMaster address

📋 Phase 4: Updating ABI file...
✅ Updated DungeonMaster ABI file

🔄 Phase 5: Setting up CORE interconnection...
✅ DungeonMaster address set in DungeonCore

🔍 Phase 6: Verifying configuration...
✅ DungeonCore connection verified

🎯 Deployment Summary:
========================================
DungeonMaster: 0x1234...
DungeonCore: 0x5678...
Gas Used: 0.11 gwei
```

## 🔧 故障排除

### 常見問題與解決方案

#### 1. Gas 費用不足
```
❌ Error: insufficient funds for gas
```
**解決方案：** 向部署錢包轉入更多 BNB

#### 2. 連接設置失敗
```
⚠️ Failed to set DungeonCore in DungeonMaster
```
**解決方案：** 執行手動連接設置腳本
```bash
node scripts/essential/setup-dungeonmaster-connections.js
```

#### 3. 合約地址未找到
```
❌ DUNGEONCORE_ADDRESS not found in .env
```
**解決方案：** 檢查並更新 .env 文件中的必要地址

### 手動緊急命令
如果腳本完全失敗，可以使用以下 Hardhat console 命令：
```bash
npx hardhat console --network bsc
```

```javascript
// 在 console 中執行
const [deployer] = await ethers.getSigners();
const DungeonCore = await ethers.getContractFactory("DungeonCore");
const DungeonMaster = await ethers.getContractFactory("DungeonMaster");

const core = DungeonCore.attach("YOUR_CORE_ADDRESS");
const master = DungeonMaster.attach("YOUR_MASTER_ADDRESS");

// 設置連接
await master.setDungeonCore("YOUR_CORE_ADDRESS", { gasPrice: ethers.parseUnits("0.11", "gwei") });
await core.setDungeonMaster("YOUR_MASTER_ADDRESS", { gasPrice: ethers.parseUnits("0.11", "gwei") });
```

## 📋 部署後檢查清單

- [ ] 驗證腳本顯示 100% 健康評分
- [ ] DungeonMaster ↔ DungeonCore 雙向連接正常
- [ ] .env 文件已更新新地址
- [ ] ABI 文件已更新
- [ ] 合約未處於暫停狀態
- [ ] 前端配置已同步 (`node scripts/ultimate-config-system.js sync`)
- [ ] 子圖配置已更新新地址

## 🔄 後續步驟

### 1. 同步前端配置
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/ultimate-config-system.js sync
```

### 2. 更新子圖配置
- 更新子圖配置文件中的 DungeonMaster 地址
- 重新部署子圖到 The Graph Studio

### 3. 測試功能
- 測試探險功能是否正常
- 驗證事件觸發和獎勵分發
- 檢查冷卻機制

## ⚡ 性能配置

所有腳本都確保使用 **0.11 gwei** 的 Gas Price，這是經過優化的成本效益設置。

## 🛡️ 安全注意事項

1. **私鑰安全**：確保 .env 文件中的私鑰安全
2. **地址驗證**：部署後務必驗證所有地址正確
3. **權限管理**：確認合約 owner 設置正確
4. **暫停機制**：了解如何暫停合約以應對緊急情況

## 📞 支持

如遇到問題：
1. 檢查部署日誌中的詳細錯誤信息
2. 運行驗證腳本獲取系統健康狀態
3. 查看此指南的故障排除章節
4. 使用手動設置腳本作為備選方案

---
**⚠️ 重要提醒：部署到主網前，建議先在測試網進行完整測試！**
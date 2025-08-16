# 🚀 DungeonDelvers V10 Final 部署指南

## 📋 版本概述

V10 Final 是 DungeonDelvers 專案最完整的部署腳本版本，整合了所有先前版本的優點並修復了已知問題。此版本經過詳細分析 V3、V6、V7、V8、V9 等版本後，確保沒有遺漏任何關鍵功能。

## 🎯 主要特點

### 1. **完整的合約部署**
- ✅ 所有 11 個核心合約
- ✅ 包含經常被遺漏的 Oracle 合約
- ✅ 支援測試代幣或使用現有代幣
- ✅ 正確的合約命名處理（如 Party_V3.sol）

### 2. **Metadata Server 整合**
- ✅ 所有 5 個 NFT 合約自動設定 baseURI
- ✅ 統一指向 metadata server API
- ✅ 支援環境變數配置
- ✅ 確保 NFT 市場能正確讀取元數據

### 3. **完整的合約連接**
- ✅ DungeonCore 的 11 個模組全部設定
- ✅ 所有合約反向連接到 DungeonCore
- ✅ Party V3 連接 Hero 和 Relic
- ✅ DungeonMaster 連接 DungeonStorage 和 SoulShard
- ✅ DungeonStorage 授權 DungeonMaster 為操作員

### 4. **遊戲參數初始化**
- ✅ 探索費用：0.0015 BNB
- ✅ 儲備價格：$5 USD
- ✅ 全局獎勵倍數：1x
- ✅ VIP 解質押冷卻期：15 秒（測試用）
- ✅ 5 個地城完整配置（戰力、獎勵、成功率）

### 5. **部署管理功能**
- ✅ 記錄當前區塊號（用於子圖）
- ✅ 生成多種格式的部署記錄
- ✅ 自動導出所有合約 ABI
- ✅ 錯誤處理與回滾機制

### 6. **開發者友好**
- ✅ 彩色控制台輸出
- ✅ 清晰的階段劃分
- ✅ 詳細的部署進度
- ✅ 完整的錯誤追蹤

## 📦 部署的合約清單

### 基礎設施合約
1. **Oracle** - 價格預言機，處理 USD/SoulShard 轉換
2. **DungeonStorage** - 地城數據存儲

### NFT 合約
3. **Hero** - 英雄 NFT (ERC721)
4. **Relic** - 聖物 NFT (ERC721)
5. **Party** - 隊伍 NFT (ERC721)
6. **VIPStaking** - VIP 質押 NFT
7. **PlayerProfile** - 玩家檔案 NFT

### 遊戲機制合約
8. **PlayerVault** - 玩家金庫（代幣存取）
9. **AltarOfAscension** - 升星祭壇
10. **DungeonCore** - 核心合約，管理所有模組
11. **DungeonMasterV7** - 地城探索主邏輯

## 🔧 整合的功能

### 從 V3 整合
- 完整的合約連接邏輯
- 地城數據初始化
- DungeonStorage 操作員授權
- 生成 .env 格式文件

### 從 V6 整合
- Party 部署邏輯
- 雙向合約連接設定

### 從 V7 整合
- DungeonMasterV7 最新版本
- 簡化的部署流程

### 從 V8 整合
- 完整的 baseURI 設定
- 所有 NFT 合約配置

### 從 V9 整合
- 模組化的部署結構
- 彩色輸出系統

### V10 獨有新增
- Oracle 部署與完整配置
- 遊戲參數初始化（費用、價格、倍數）
- 區塊號記錄（子圖需要）
- 子圖更新指南自動生成
- ABI 批量導出功能
- 配套的驗證腳本

## 📁 生成的文件

部署完成後，會在 `deployments/` 目錄生成以下文件：

1. **`{network}_all_addresses.json`**
   - 所有合約地址
   - 部署時間戳
   - 區塊號

2. **`{network}_addresses.env`**
   - .env 格式的地址文件
   - 可直接複製到專案使用

3. **`{network}_subgraph_update.md`**
   - 子圖更新指南
   - 包含所有需要的地址和區塊號

4. **`abis/` 目錄**
   - 所有合約的 ABI 文件
   - JSON 格式，可直接使用

5. **錯誤日誌**（如果部署失敗）
   - 詳細的錯誤信息
   - 部署進度快照

## 🚀 使用方法

### 1. 環境準備
```bash
# 確保 .env 文件包含必要的變數
PRIVATE_KEY=你的私鑰
METADATA_SERVER_BASE_URL=https://dungeon-delvers-metadata-server.onrender.com
BSCSCAN_API_KEY=你的API金鑰

# 可選：部署測試代幣
DEPLOY_TEST_TOKEN=true  # 預設為 false
```

### 2. 執行部署
```bash
# 編譯合約
npx hardhat compile

# 部署到 BSC 主網
npx hardhat run scripts/deploy-v10-final.js --network bsc

# 或部署到測試網
npx hardhat run scripts/deploy-v10-final.js --network bscTestnet
```

### 3. 驗證合約
```bash
# 使用配套的驗證腳本
npx hardhat run scripts/verify-v10-contracts.js --network bsc
```

### 4. 後續步驟
1. 複製 `deployments/{network}_addresses.env` 到專案根目錄
2. 更新前端 `contracts.ts` 文件
3. 更新後端配置
4. 使用生成的指南更新 The Graph 子圖
5. 同步到 Vercel 和 Render（如有相關腳本）

## ⚠️ 注意事項

1. **資金需求**
   - 確保部署錢包有足夠的 BNB
   - BSC 主網部署預計需要 0.5-1 BNB

2. **VIP 冷卻期**
   - 預設為 15 秒（測試用）
   - 正式環境建議設定為 7-14 天

3. **所有權管理**
   - 部署完成後考慮轉移到多簽錢包
   - 使用專門的所有權轉移腳本

4. **測試建議**
   - 先在測試網完整測試
   - 驗證所有功能正常運作
   - 檢查 NFT 市場能否正確顯示

## 🔍 驗證檢查清單

部署後請確認：
- [ ] 所有合約都已成功部署
- [ ] NFT 的 tokenURI 返回正確的 metadata server URL
- [ ] DungeonCore 可以正確調用所有模組
- [ ] 地城探索功能正常
- [ ] VIP 質押和解質押正常
- [ ] Oracle 價格轉換正確

## 🐛 故障排除

### 常見問題

1. **合約不存在錯誤**
   ```
   Artifact for contract "Party" not found
   ```
   解決：確保使用正確的合約名稱 "Party"

2. **Gas 估算失敗**
   - 檢查錢包餘額
   - 確認網路 RPC 正常
   - 嘗試手動設定 gas

3. **驗證失敗**
   - 確保 BSCScan API key 正確
   - 等待幾分鐘後重試
   - 檢查建構參數是否正確

## 📚 相關文件

- [合約架構說明](../README.md)
- [前端整合指南](../../GitHub/DungeonDelvers/README.md)
- [後端配置說明](../../dungeon-delvers-metadata-server/README.md)

## 🤝 貢獻指南

如發現部署腳本有任何問題或需要新功能，請：
1. 在 GitHub 開 issue
2. 提供詳細的錯誤日誌
3. 說明期望的行為

---

**最後更新**: 2025-01-20
**版本**: V10 Final
**維護者**: DungeonDelvers Team
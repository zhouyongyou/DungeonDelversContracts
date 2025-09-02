# NFT 合約重新部署指南 (V25.1.5)

本指南將幫助您完整重新部署 5 個 NFT 合約並正確設置所有連接。

## 📋 準備工作

### 1. 確認環境設置
```bash
# 確保在合約項目目錄
cd /Users/sotadic/Documents/DungeonDelversContracts

# 檢查 .env 文件是否包含必要配置
cat .env | grep -E "(PRIVATE_KEY|BSCSCAN_API_KEY|VITE_DUNGEONCORE_ADDRESS)"
```

### 2. 確認錢包餘額
- 確保部署錢包有足夠的 BNB (建議至少 0.1 BNB)
- 檢查 BSCScan API key 有效性

## 🚀 執行方式

### 方式一：完整自動化流程 (推薦)
```bash
# 一鍵執行完整流程：部署 → 驗證 → 互連 → 同步
npx hardhat run scripts/complete-nft-redeploy.js --network bsc
```

### 方式二：分步執行 (調試用)
```bash
# Step 1: 部署合約
npx hardhat run scripts/redeploy-nft-contracts.js --network bsc

# Step 2: 手動更新 .env 文件中的地址

# Step 3: 驗證合約
BSCSCAN_API_KEY=your_key npx hardhat run scripts/verify-nft-contracts.js --network bsc

# Step 4: 設置互連
npx hardhat run scripts/setup-nft-connections.js --network bsc

# Step 5: 同步地址到其他項目
node scripts/ultimate-config-system.js sync
```

## 📊 涉及的合約

| 合約名稱 | 當前地址 (V25.1.4) | 新地址 (V25.1.5) |
|----------|-------------------|-------------------|
| Hero | 0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662 | 🔄 將更新 |
| Relic | 0x9A682D761ef20377e46136a45f10C3B2a8A76CeF | 🔄 將更新 |
| Party | 0xd5A1dd4Da7F0609042EeBAE3b1a5eceb0A996e25 | 🔄 將更新 |
| PlayerProfile | 0x7DEBfb8334c0aF31f6241f7aB2f78a9907823400 | 🔄 將更新 |
| VIPStaking | 0xa4f98938ECfc8DBD586F7eE1d51B3c1FaDDDd5da | 🔄 將更新 |

**注意**: DungeonCore 地址保持不變: `0x5B64A5939735Ff762493D9B9666b3e13118c5722`

## 🔗 互連設置詳情

### NFT 合約 → DungeonCore 連接
```solidity
// 每個 NFT 合約都需要設置
contract.setDungeonCore(0x5B64A5939735Ff762493D9B9666b3e13118c5722)
```

### DungeonCore → NFT 合約連接
```solidity
// DungeonCore 需要設置每個 NFT 合約地址
dungeonCore.setHeroContract(newHeroAddress)
dungeonCore.setRelicContract(newRelicAddress)
dungeonCore.setPartyContract(newPartyAddress)
dungeonCore.setPlayerProfile(newPlayerProfileAddress)
dungeonCore.setVipStaking(newVipStakingAddress)
```

## 📝 地址更新範圍

### 自動更新的文件
1. **合約項目**: `.env` 文件
2. **前端項目**: `.env.local` 和 `public/config/latest.json`
3. **後端項目**: `config/contracts.json`
4. **子圖項目**: `networks.json` 和相關 ABI 文件

### 需要手動操作的步驟
1. 重啟前端開發服務器
2. 重啟後端服務器
3. 重新部署子圖到 Graph Protocol

## ⚠️ 重要注意事項

### 部署前檢查
- [ ] 確認 DungeonCore 地址正確
- [ ] 檢查所有 SET 函數名稱無誤
- [ ] 備份當前 .env 文件
- [ ] 確保網絡連接穩定

### 部署後驗證
- [ ] 檢查 BSCScan 上合約是否驗證成功
- [ ] 確認所有互連設置無誤
- [ ] 測試前端是否能正常讀取新合約
- [ ] 驗證 NFT 鑄造功能正常

### 故障排除
如果某個步驟失敗：
1. 檢查錯誤日誌
2. 手動執行失敗的步驟
3. 驗證網絡和配置設置
4. 如需要，回滾到備份狀態

## 🎯 預期結果

完成後您應該看到：
- ✅ 5 個新的合約地址
- ✅ BSCScan 上驗證通過
- ✅ 所有合約正確互連
- ✅ 前端、後端、子圖地址已同步
- ✅ 系統功能正常運行

## 📞 支持

如果遇到問題：
1. 檢查本文檔的故障排除部分
2. 查看腳本執行日誌中的詳細錯誤信息
3. 確認所有前置條件都已滿足
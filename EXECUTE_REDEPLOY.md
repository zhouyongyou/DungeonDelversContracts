# 🚀 V25.1.5 NFT 合約重新部署執行指令

## 📋 快速執行（推薦）

```bash
# 前往合約項目目錄
cd /Users/sotadic/Documents/DungeonDelversContracts

# 一鍵執行完整流程：部署 → 驗證 → 互連 → 同步
npm run redeploy:nft
```

## 🔧 分步執行（調試用）

### Step 1: 部署 NFT 合約
```bash
npm run deploy:nft
```

### Step 2: 驗證合約開源
```bash
npm run verify:nft
```

### Step 3: 設置合約互連
```bash
npm run setup:nft
```

### Step 4: 同步地址到所有項目
```bash
npm run sync:all
```

## 📊 完整的函數映射表

### NFT 合約的 SET 函數（已確認）
- ✅ **Hero.sol**: `setDungeonCore(address)`
- ✅ **Relic.sol**: `setDungeonCore(address)` 
- ✅ **Party.sol**: `setDungeonCore(address)`
- ✅ **PlayerProfile.sol**: `setDungeonCore(address)`
- ✅ **VIPStaking.sol**: `setDungeonCore(address)`

### DungeonCore 的 SET 函數（已確認）
- ✅ **DungeonCore.sol**: `setHeroContract(address)`
- ✅ **DungeonCore.sol**: `setRelicContract(address)`
- ✅ **DungeonCore.sol**: `setPartyContract(address)`
- ✅ **DungeonCore.sol**: `setPlayerProfile(address)`
- ✅ **DungeonCore.sol**: `setVipStaking(address)`

## 🎯 部署的合約清單

| 合約 | 當前地址 | 狀態 |
|------|----------|------|
| Hero | 0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662 | 🔄 將重新部署 |
| Relic | 0x9A682D761ef20377e46136a45f10C3B2a8A76CeF | 🔄 將重新部署 |
| Party | 0xd5A1dd4Da7F0609042EeBAE3b1a5eceb0A996e25 | 🔄 將重新部署 |
| PlayerProfile | 0x7DEBfb8334c0aF31f6241f7aB2f78a9907823400 | 🔄 將重新部署 |
| VIPStaking | 0xa4f98938ECfc8DBD586F7eE1d51B3c1FaDDDd5da | 🔄 將重新部署 |

**保持不變**: DungeonCore (0x5B64A5939735Ff762493D9B9666b3e13118c5722)

## 🔄 地址更新範圍

### 自動更新的項目
1. **✅ 合約項目**: `.env` 文件
2. **✅ 前端項目**: `.env.local` + `public/config/latest.json`
3. **✅ 後端項目**: `config/contracts.json`
4. **✅ 子圖項目**: `networks.json` + ABI 文件

### 後續手動操作
1. **前端**: 重啟 `npm run dev`
2. **後端**: 重啟服務器
3. **子圖**: 重新部署子圖

## ⚡ 執行前檢查清單

- [ ] 確認在正確目錄: `/Users/sotadic/Documents/DungeonDelversContracts`
- [ ] 檢查 `.env` 文件包含 `PRIVATE_KEY` 和 `BSCSCAN_API_KEY`
- [ ] 確認錢包有足夠 BNB (建議 0.1+ BNB)
- [ ] 確認 DungeonCore 地址: `0x5B64A5939735Ff762493D9B9666b3e13118c5722`
- [ ] 備份當前 `.env` 文件

## 🎉 成功標誌

完成後您會看到：
```
🎉 V25.1.5 NFT 合約重新部署完成!
📊 新合約地址總結:
Hero:         0x[新地址]
Relic:        0x[新地址]
Party:        0x[新地址]
PlayerProfile: 0x[新地址]
VIPStaking:   0x[新地址]

🔗 BSCScan 驗證鏈接:
[各合約的 BSCScan 鏈接]
```

## 🆘 故障排除

### 如果部署失敗
```bash
# 檢查錯誤日誌並重新執行特定步驟
npm run deploy:nft  # 只重新部署
```

### 如果驗證失敗
```bash
# 手動驗證，設置 API key
BSCSCAN_API_KEY=your_key npm run verify:nft
```

### 如果互連設置失敗
```bash
# 重新設置互連
npm run setup:nft
```

### 如果同步失敗
```bash
# 手動同步地址
npm run sync:all
```

## 📞 緊急回滾

如果需要回滾到之前的地址：
1. 恢復備份的 `.env` 文件
2. 重新執行 `npm run sync:all`
3. 重啟所有服務
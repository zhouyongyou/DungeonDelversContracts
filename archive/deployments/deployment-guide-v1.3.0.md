# 🚀 DungeonDelvers 全新部署指南

## ✅ 部署前檢查清單

### 1. 環境配置
- [x] **私鑰設置**: 已在 .env 中配置
- [x] **最終擁有者地址**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- [x] **Metadata Server URL**: https://dungeon-delvers-metadata-server.onrender.com
- [x] **前端 URL**: https://dungeondelvers.xyz
- [x] **BSCScan API Key**: 已配置

### 2. 代幣地址（已存在）
- **SoulShard Token**: 0xc88dAD283Ac209D77Bfe452807d378615AB8B94a
- **USD Token**: 0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
- **Pool Address**: 0x737c5b0430d5aeb104680460179aaa38608b6169

### 3. 錢包餘額檢查
請確保部署錢包有足夠的 BNB（建議至少 0.5 BNB）

## 🎯 執行部署

### 步驟 1: 執行部署腳本
```bash
npx hardhat run scripts/deploy-and-sync-all.ts --network bsc
```

### 步驟 2: 等待部署完成
部署過程會：
1. 部署所有遊戲合約
2. 設置合約之間的關聯
3. 配置 BaseURI 指向 metadata server
4. 初始化遊戲參數和地城配置
5. 自動驗證合約（如果有 BSCScan API key）
6. 轉移所有權到最終擁有者

### 步驟 3: 保存部署結果
部署完成後會顯示所有合約地址，請務必保存！

## 📋 部署後步驟

### 1. 更新 The Graph 子圖
```bash
cd ../../GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
node update-subgraph-addresses.js
# 手動更新 startBlock 為實際部署區塊
npm run codegen
npm run build
npm run deploy
```

### 2. 更新 Metadata Server
```bash
cd ../../dungeon-delvers-metadata-server
git add -A
git commit -m "Update to new contract addresses"
git push
```

### 3. 更新前端
- 將生成的 .env.production 複製到前端目錄
- 填寫 Alchemy 和 WalletConnect 的 API keys
- 部署前端

### 4. 驗證部署
- 在 BSCScan 上查看合約
- 測試 metadata API 端點
- 檢查前端功能

## ⚠️ 重要提醒

1. **保存所有合約地址** - 部署後會顯示所有地址
2. **記錄部署區塊號** - 用於更新子圖
3. **等待索引完成** - The Graph 需要 10-30 分鐘
4. **測試所有功能** - 確保系統正常運作

## 🆘 如果出現問題

1. **Gas 不足**: 確保錢包有足夠 BNB
2. **合約驗證失敗**: 可以稍後手動驗證
3. **部署中斷**: 檢查 .env 中已部署的地址，腳本會自動附加

準備好了嗎？執行：
```bash
npx hardhat run scripts/deploy-and-sync-all.ts --network bsc
```
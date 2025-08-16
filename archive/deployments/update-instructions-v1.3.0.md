# 🔄 DungeonDelvers 生態系統更新指令 v1.3.0

**更新原因**: VIP Oracle 修復 - 所有核心合約重新部署  
**版本**: v1.3.0  
**日期**: 2024-07-13  
**起始區塊**: 53863343

---

## 📋 更新優先級和順序

### 🔴 第一優先級 (立即執行)
1. **The Graph 子圖更新**
2. **後端 API 服務器更新**

### 🟡 第二優先級 (2小時內)
3. **前端應用更新**

### 🟢 第三優先級 (4小時內)
4. **測試和驗證**

---

## 1. 🔗 The Graph 子圖更新

### 步驟
```bash
# 1. 克隆或進入子圖倉庫
cd dungeon-delvers-subgraph

# 2. 更新 subgraph.yaml (使用提供的範例)
# 複製 subgraph-update-example.yaml 的內容

# 3. 更新 package.json 版本
npm version 1.3.0

# 4. 部署新版本
graph auth --product hosted-service <ACCESS_TOKEN>
graph deploy --product hosted-service dungeondelvers/dungeon-delvers-v1-3-0

# 5. 等待同步完成 (通常需要 15-30 分鐘)
```

### 關鍵配置更新
- **所有合約地址**: 更新為新部署的地址
- **startBlock**: `53863343`
- **版本**: `1.3.0`
- **描述**: "DungeonDelvers v1.3.0 - VIP Oracle Fix"

### 驗證
```bash
# 測試子圖端點
curl "https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-3-0" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}'
```

---

## 2. 🖥️ 後端 API 服務器更新

### Render 部署步驟
```bash
# 1. 進入後端倉庫
cd dungeon-delvers-metadata-server

# 2. 更新環境變數 (.env)
# 複製 backend-config-update.js 中的配置

# 3. 更新合約地址配置文件
# 例如: config/contracts.js, src/config.ts

# 4. 更新子圖端點
SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-3-0

# 5. 更新版本號
API_VERSION=1.3.0

# 6. 提交並推送到主分支 (會自動部署到 Render)
git add .
git commit -m "Update to v1.3.0 - VIP Oracle Fix contract addresses"
git push origin main

# 7. 在 Render 控制台確認部署成功
```

### 環境變數更新清單
```bash
# 核心合約地址
DUNGEON_CORE_ADDRESS=0x5f840dE828b4349f2391aF35721564a248C077Fc
VIP_STAKING_ADDRESS=0xE9Cb85E3671486054133eC4EfcB19cF7fbF99706
HERO_CONTRACT_ADDRESS=0x648FcDf1f59a2598e9f68aB3210a25A877fAD353
RELIC_CONTRACT_ADDRESS=0x6704d55c8736e373B001d54Ba00a80dbb0EC793b
PARTY_CONTRACT_ADDRESS=0x66EA7C0b2BAA497EAf18bE9f3D4459Ffc20ba491
PLAYER_PROFILE_ADDRESS=0x5f041FE4f313AF8aB010319BA85b701b33De13B0
DUNGEON_MASTER_ADDRESS=0xbD35485ccfc0aDF28582E2Acf2b2D22cD0F92529
PLAYER_VAULT_ADDRESS=0xbaD08C748596fD72D776B2F6aa5F26100334BD4B
ORACLE_ADDRESS=0xe72eDD302C51DAb2a2Fc599a8e2CF74247dc563B
DUNGEON_STORAGE_ADDRESS=0xa1C0566d2a5271B21B15b534604595e4Ce216c91
ALTAR_OF_ASCENSION_ADDRESS=0xE29Bb0F3C613CCb56c4188026a7C60898Ad068C4

# 子圖端點
SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-3-0

# 版本
API_VERSION=1.3.0
```

### 驗證
```bash
# 測試 API 健康檢查
curl https://dungeon-delvers-metadata-server.onrender.com/health

# 測試 VIP 元數據 (新功能)
curl https://dungeon-delvers-metadata-server.onrender.com/api/vip/1
```

---

## 3. 🌐 前端應用更新

### 配置文件更新
```typescript
// 1. 更新合約地址 (frontend-config-update.ts)
export const CONTRACT_ADDRESSES = {
  bsc: {
    DUNGEON_CORE: "0x5f840dE828b4349f2391aF35721564a248C077Fc",
    VIP_STAKING: "0xE9Cb85E3671486054133eC4EfcB19cF7fbF99706",
    // ... 其他地址
  }
};

// 2. 更新子圖端點
export const SUBGRAPH_CONFIG = {
  endpoints: {
    bsc: "https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-3-0"
  }
};
```

### 環境變數更新 (.env.local)
```bash
NEXT_PUBLIC_DUNGEON_CORE_ADDRESS=0x5f840dE828b4349f2391aF35721564a248C077Fc
NEXT_PUBLIC_VIP_STAKING_ADDRESS=0xE9Cb85E3671486054133eC4EfcB19cF7fbF99706
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-3-0
NEXT_PUBLIC_APP_VERSION=1.3.0
```

### 部署步驟
```bash
# 1. 更新配置文件
# 2. 測試本地開發環境
npm run dev

# 3. 建構生產版本
npm run build

# 4. 部署到 Vercel/Netlify 等
npm run deploy
# 或
vercel --prod
```

---

## 4. ✅ 測試和驗證清單

### 🔗 子圖驗證
- [ ] 子圖同步狀態正常
- [ ] 能夠查詢 VIP 數據
- [ ] 能夠查詢 Hero/Relic/Party 數據
- [ ] 區塊號更新至最新

### 🖥️ 後端驗證
- [ ] API 健康檢查返回 v1.3.0
- [ ] VIP NFT 元數據 API 正常
- [ ] Hero NFT 元數據 API 正常
- [ ] 子圖查詢正常工作
- [ ] 日誌無錯誤信息

### 🌐 前端驗證
- [ ] 錢包連接正常
- [ ] VIP 頁面顯示正確等級
- [ ] VIP 稅收減免顯示正確
- [ ] NFT 元數據載入正常
- [ ] 所有遊戲功能正常
- [ ] 控制台無錯誤

### 🎮 端到端測試
- [ ] VIP 質押功能測試
- [ ] Hero 鑄造功能測試
- [ ] 地城探險功能測試
- [ ] 獎勵提取功能測試

---

## 🚨 緊急回滾計劃

如果發現重大問題，可以暫時回滾：

### 子圖回滾
```bash
# 使用舊版本子圖端點
https://api.thegraph.com/subgraphs/name/dungeondelvers/dungeon-delvers-v1-2-x
```

### 後端回滾
```bash
# 在 Render 控制台回滾到前一個部署版本
# 或者重新設定舊的合約地址
```

### 前端回滾
```bash
# 部署前一個版本
git revert HEAD
npm run deploy
```

---

## 📞 團隊協調

### 通知清單
- [ ] 前端開發團隊
- [ ] 後端開發團隊  
- [ ] DevOps 團隊
- [ ] QA 測試團隊
- [ ] 營運團隊
- [ ] 社群管理員

### 用戶通知
```markdown
🔧 系統維護通知

親愛的 DungeonDelvers 玩家：

我們正在進行系統升級到 v1.3.0，修復 VIP 功能的顯示問題。
預計維護時間：2-4 小時
主要改進：
- ✅ 修復 VIP 等級顯示問題
- ✅ 改善稅收減免計算
- ✅ 提升系統穩定性

感謝您的耐心等待！

- DungeonDelvers 團隊
```

---

## 📊 監控重點

### 關鍵指標
- 子圖同步延遲
- API 響應時間
- 前端錯誤率
- 用戶活躍度
- VIP 功能使用率

### 監控工具
- BSCScan (合約交互)
- The Graph Explorer (子圖狀態)
- Render Dashboard (後端狀態)
- Frontend Analytics (用戶行為)

---

**預計總更新時間**: 4-6 小時  
**關鍵成功標準**: VIP 功能正常顯示等級和稅收減免

祝更新順利！🚀
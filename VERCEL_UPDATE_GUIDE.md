# 📝 Vercel 環境變數更新指南

## 🚨 重要更新：新 VRF Manager 地址

### 更新時間
2025-08-07 PM11

### 需要更新的變數
```bash
VITE_VRFMANAGER_ADDRESS=0x84b1ffc7b0839906ba1ecf510ed3a74481b8438e
```
（舊地址：0x980d224ec4d198d94f34a8af76a19c00dabe2436）

## 📋 更新步驟

### 1. 登入 Vercel Dashboard
https://vercel.com/dashboard

### 2. 選擇專案
選擇 `dungeon-delvers` 或你的前端專案

### 3. 進入環境變數設定
Settings → Environment Variables

### 4. 更新 VRF Manager 地址
找到 `VITE_VRFMANAGER_ADDRESS` 並更新為：
```
0x84b1ffc7b0839906ba1ecf510ed3a74481b8438e
```

### 5. 重新部署
點擊 "Redeploy" 按鈕觸發重新部署

## ✅ 完整的環境變數列表

以下是所有需要在 Vercel 設定的環境變數：

```bash
# ==================== 合約地址 ====================
VITE_HERO_ADDRESS=0x671d937b171e2ba2c4dc23c133b07e4449f283ef
VITE_RELIC_ADDRESS=0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da
VITE_PARTY_ADDRESS=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3
VITE_DUNGEONMASTER_ADDRESS=0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a
VITE_DUNGEONSTORAGE_ADDRESS=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
VITE_ALTAROFASCENSION_ADDRESS=0xa86749237d4631ad92ba859d0b0df4770f6147ba
VITE_PLAYERVAULT_ADDRESS=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
VITE_PLAYERPROFILE_ADDRESS=0x0f5932e89908400a5AfDC306899A2987b67a3155
VITE_VIPSTAKING_ADDRESS=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C
VITE_VRFMANAGER_ADDRESS=0x84b1ffc7b0839906ba1ecf510ed3a74481b8438e  # ⚠️ 新地址

# 復用的合約 (不用更新)
VITE_DUNGEONCORE_ADDRESS=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
VITE_ORACLE_ADDRESS=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a
VITE_SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
VITE_USD_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VITE_UNISWAP_POOL_ADDRESS=0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82

# ==================== 服務端點 ====================
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.2
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=V25
VITE_START_BLOCK=56757876
VITE_DEPLOYMENT_DATE=2025-08-07T18:00:00Z
VITE_NETWORK=BSC Mainnet
VITE_CHAIN_ID=56

# ==================== VRF 配置 ====================
VITE_VRF_ENABLED=true
VITE_VRF_PRICE=0.0001
VITE_PLATFORM_FEE=0
```

## 🔍 驗證部署

部署完成後，訪問你的網站並檢查：
1. 開啟瀏覽器開發者工具
2. 在 Console 中輸入：
```javascript
console.log(import.meta.env.VITE_VRFMANAGER_ADDRESS)
```
3. 應該顯示：`0x84b1ffc7b0839906ba1ecf510ed3a74481b8438e`

## 📊 VRF Manager 更新詳情

### 新功能
- ✅ 支援 25 個 NFT 批量鑄造
- ✅ Gas Limit: 2,500,000
- ✅ 動態調整功能
- ✅ 成本估算功能

### 改進
- 從 500k gas limit 提升到 2.5M
- 支援批量鑄造最多 25 個（原本 5 個）
- 每批次成本約 0.015 LINK

## 🚨 注意事項

1. **Chainlink VRF 訂閱**
   - 新合約已添加為消費者
   - 訂閱 ID: 114131353280130458891383141995968474440293173552039681622016393393251650814328
   - 確保有足夠 LINK 餘額（建議 100+ LINK）

2. **測試建議**
   - 部署後測試鑄造功能
   - 嘗試不同數量的批量鑄造

## 📞 支援

如有問題，請聯繫開發團隊。

---

最後更新：2025-08-07 PM11
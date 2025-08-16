# 前端更新檢查清單 - V25

## 🔴 緊急：需要立即更新的地址

### 錯誤的地址（從截圖看到）
- ❌ 英雄合約: `0x5ede...fd6d` → ✅ 應該是 `0x671d937b171e2ba2c4dc23c133b07e4449f283ef`
- ❌ 聖物合約: `0x7a94...6316` → ✅ 應該是 `0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da`

## 📋 前端需要更新的所有位置

### 1. 合約地址配置文件
通常在以下位置：
- `src/config/contracts.js` 或 `.ts`
- `src/constants/addresses.js` 或 `.ts`
- `.env` 或 `.env.production`

### 2. 需要更新的地址
```javascript
// ===== NFT 合約（主要更新）=====
HERO: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef"  // ⚠️ 必須更新
RELIC: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da"  // ⚠️ 必須更新
PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3"  // ⚠️ 必須更新
ALTAROFASCENSION: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"  // ⚠️ 必須更新

// ===== 存儲合約 =====
DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468"  // ⚠️ 必須更新
DUNGEONMASTER: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a"  // ⚠️ 必須更新

// ===== 輔助合約（如果有變更）=====
PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787"
PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155"
VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C"
ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a"
```

### 3. 子圖端點更新
```javascript
SUBGRAPH_URL: "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0"
```

### 4. ABI 文件更新
確保 ABI 文件是最新的，特別是：
- Hero.json
- Relic.json
- Party.json
- DungeonMaster.json
- AltarOfAscension.json

### 5. 頁面顯示更新
需要更新的頁面：
- ✅ 鑄造工坊 - 招募英雄頁面
- ✅ 鑄造工坊 - 招募聖物頁面
- ✅ 隊伍管理頁面
- ✅ 地城探索頁面
- ✅ 升星祭壇頁面

## 🔍 驗證步驟

1. **檢查網頁 Console**
   - 打開瀏覽器開發者工具
   - 查看是否有合約地址相關錯誤

2. **測試交易**
   - 嘗試鑄造 1 個英雄
   - 檢查交易是否發送到正確地址

3. **BSCScan 驗證**
   - 點擊合約地址連結
   - 確認跳轉到正確的合約頁面

## 📝 快速修復指南

### 如果使用環境變數：
```bash
# .env.production
REACT_APP_HERO_CONTRACT=0x671d937b171e2ba2c4dc23c133b07e4449f283ef
REACT_APP_RELIC_CONTRACT=0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da
REACT_APP_PARTY_CONTRACT=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3
# ... 其他合約
```

### 如果使用配置文件：
```javascript
export const contractAddresses = {
  hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
  relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
  party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  // ... 其他合約
}
```

## ⚠️ 重要提醒

1. **立即更新** Hero 和 Relic 地址，這是最緊急的
2. **測試所有功能** 確保沒有遺漏的地方
3. **清除瀏覽器快取** 確保用戶獲得最新版本
4. **通知用戶** 如果有快取問題，可能需要強制刷新

---
配置文件位置: `deployments/frontend-config-v25.json`
生成時間: 2025-08-07
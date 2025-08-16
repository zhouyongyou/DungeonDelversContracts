# 🎨 前端配置更新指南

**更新日期**: 2025-08-07  
**版本**: V25 修復版  

## 🚨 必須更新的合約地址

```javascript
// 🆕 新地址 (2025-08-07)
const NEW_ADDRESSES = {
  HERO_ADDRESS: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
  RELIC_ADDRESS: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316", 
  ALTAROFASCENSION_ADDRESS: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1"
};

// ❌ 舊地址 (需要替換)
const OLD_ADDRESSES = {
  HERO_ADDRESS: "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0",
  RELIC_ADDRESS: "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366",
  ALTAROFASCENSION_ADDRESS: "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3"
};
```

## 📁 需要更新的檔案清單

### 1. 主配置檔案
```bash
# 配置檔案路徑 (需要確認實際路徑)
src/
├── config/
│   ├── contracts.js          # 主要合約地址配置
│   ├── addresses.js          # 地址常數
│   └── constants.js          # 可能包含地址
├── constants/
│   ├── contracts.ts/.js      # TypeScript/JavaScript 合約配置
│   └── addresses.ts/.js      # 地址配置
├── utils/
│   ├── contracts.js          # 合約工具函數
│   └── web3.js              # Web3 配置
└── .env.production          # 生產環境變數
```

### 2. 環境變數檔案
```bash
# .env.production
REACT_APP_HERO_ADDRESS=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d
REACT_APP_RELIC_ADDRESS=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316
REACT_APP_ALTAR_ADDRESS=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1

# .env.local (如果存在)
NEXT_PUBLIC_HERO_ADDRESS=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d
NEXT_PUBLIC_RELIC_ADDRESS=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316
NEXT_PUBLIC_ALTAR_ADDRESS=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1
```

## 🔍 搜尋和替換指令

### 使用 grep 搜尋需要更新的檔案
```bash
# 搜尋包含舊 Hero 地址的檔案
grep -r "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0" src/

# 搜尋包含舊 Relic 地址的檔案  
grep -r "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366" src/

# 搜尋包含舊 Altar 地址的檔案
grep -r "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3" src/
```

### 使用 sed 批次替換 (小心使用)
```bash
# 替換 Hero 地址
find src/ -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
xargs sed -i '' 's/0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0/0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d/g'

# 替換 Relic 地址
find src/ -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
xargs sed -i '' 's/0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366/0x7a9469587ffd28a69d4420d8893e7a0e92ef6316/g'

# 替換 Altar 地址  
find src/ -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
xargs sed -i '' 's/0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3/0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1/g'
```

## ⚠️ 移除的功能 (批次等級系統)

### 🚫 需要移除的函數調用
```javascript
// ❌ 這些函數已被移除，需要從代碼中刪除
contract.setBatchTier(...)           // 設定批次等級
contract.getBatchTier(...)           // 獲取批次等級  
contract.getBatchTierLimits(...)     // 獲取批次限制

// ❌ 相關的事件監聽也需要移除
contract.on('BatchTierSet', ...)
contract.on('BatchTierUpdated', ...)
```

### 🔄 需要修改的 UI 組件
搜尋並移除以下內容：
- 批次等級選擇器
- 批次稀有度顯示
- 批次等級相關的狀態管理
- 批次等級相關的計算邏輯

## 📋 ABI 檔案更新

### 需要更新 ABI 的合約
```bash
# 從 BSCScan 下載新的 ABI 檔案
# Hero ABI: https://bscscan.com/address/0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d#code
# Relic ABI: https://bscscan.com/address/0x7a9469587ffd28a69d4420d8893e7a0e92ef6316#code  
# Altar ABI: https://bscscan.com/address/0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1#code

# ABI 檔案通常位於
src/
├── abi/
│   ├── Hero.json
│   ├── Relic.json
│   └── AltarOfAscension.json
├── contracts/
│   └── abi/
└── assets/
    └── contracts/
```

## 🧪 測試檢查表

### 功能測試
- [ ] **Hero NFT 鑄造**
  - [ ] 從錢包鑄造
  - [ ] 從金庫鑄造
  - [ ] VRF 隨機屬性生成
  - [ ] NFT 顯示正常

- [ ] **Relic NFT 鑄造**  
  - [ ] 從錢包鑄造
  - [ ] 從金庫鑄造
  - [ ] VRF 隨機屬性生成
  - [ ] NFT 顯示正常

- [ ] **升星系統**
  - [ ] 升星介面正常
  - [ ] VRF 隨機結果正確
  - [ ] 成功/失敗處理正確

### UI 測試
- [ ] **移除的功能**
  - [ ] 批次等級選擇器已移除
  - [ ] 批次稀有度顯示已移除  
  - [ ] 相關錯誤訊息已清理

- [ ] **地址更新**
  - [ ] 所有合約調用使用新地址
  - [ ] 區塊鏈瀏覽器連結正確
  - [ ] 交易記錄查詢正常

## 🚀 部署步驟

### 1. 開發環境測試
```bash
# 更新依賴
npm install

# 本地測試
npm run dev
# 或
npm run start
```

### 2. 構建和部署
```bash
# 構建生產版本
npm run build

# 部署到生產環境
npm run deploy
# 或根據你的部署流程
```

### 3. 驗證部署
- [ ] 檢查所有頁面載入正常
- [ ] 測試合約互動功能
- [ ] 確認沒有 console 錯誤
- [ ] 測試移動端兼容性

## 📞 支援

如果在更新過程中遇到問題：

1. **檢查 console 錯誤** - 查看瀏覽器開發者工具
2. **確認地址更新** - 使用上述搜尋指令驗證
3. **測試合約調用** - 確保使用正確的 ABI 和地址
4. **回滾準備** - 保留舊版本配置以便快速回滾

---

**⚡ 立即行動項目:**
1. 🎯 更新所有合約地址  
2. 🗑️ 移除批次等級相關代碼
3. 📥 更新 ABI 檔案
4. 🧪 完整功能測試

*更新完成後，DungeonDelvers 前端將支援最新的優化合約版本！* 🎉
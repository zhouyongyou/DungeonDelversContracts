# V25 部署指南 - 正式上線版本

## 🚀 概述

V25 是整合了 V23/V24 所有經驗的完整部署系統，提供一鍵部署、自動驗證、配置同步等功能。

## 📋 前置要求

1. **環境變數設置**
```bash
# 必需
export PRIVATE_KEY="你的部署私鑰"
export BSCSCAN_API_KEY="你的BSCScan API Key"

# 可選（使用默認值即可）
export BSC_RPC_URL="https://bsc-dataseed.binance.org/"
```

2. **錢包餘額**
- 至少 0.5 BNB 用於部署
- 建議準備 1 BNB 以確保充足

## 🎯 一鍵部署

### 完整部署（推薦）
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
bash scripts/active/v25-full-deploy.sh
```

### 部署選項
```bash
# 跳過子圖部署
bash scripts/active/v25-full-deploy.sh --skip-subgraph

# 測試模式（不實際部署）
bash scripts/active/v25-full-deploy.sh --test-mode
```

## 📝 分步部署

如果需要更細緻的控制，可以分步執行：

### 1. 部署合約
```bash
npx hardhat run scripts/active/v25-deploy-complete.js --network bsc
```

### 2. 驗證合約
```bash
# 驗證所有合約
node scripts/active/v25-verify-contracts.js

# 只驗證特定合約
node scripts/active/v25-verify-contracts.js --only HERO,RELIC
```

### 3. 同步配置
```bash
# 同步到所有項目
node scripts/active/v25-sync-all.js

# 回滾配置（如果需要）
node scripts/active/v25-sync-all.js --rollback
```

### 4. 部署子圖
```bash
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run codegen
npm run build
npm run deploy
```

## 🔧 配置說明

### 部署配置 (v25-deploy-complete.js)

```javascript
const DEPLOYMENT_CONFIG = {
  // 是否部署新的 Token 合約
  deployNewTokens: false,  // 生產環境設為 false
  
  // 現有合約地址（如果不部署新的）
  existingContracts: {
    SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    ORACLE: '0xde3bA7f6F75AC667416a07b624b7eFA4E8892BA8',
  },
  
  // 部署選項
  options: {
    autoVerify: true,        // 自動驗證合約
    setupConnections: true,  // 自動設置合約連接
    initializeParams: true,  // 自動初始化參數
    generateDocs: true,      // 生成部署文檔
  }
};
```

### 遊戲參數配置

```javascript
const GAME_PARAMS = {
  // NFT 鑄造價格
  mintPriceUSD: 2,
  
  // VIP 解鎖冷卻期
  vipUnstakeCooldown: 604800,  // 7 天（生產環境）
  // vipUnstakeCooldown: 15,    // 15 秒（測試環境）
  
  // Party 創建費用
  partyCreationFee: '0.001',   // BNB
};
```

## 📊 部署結果

部署完成後，會生成以下文件：

1. **配置文件**
   - `config/v25-config.js` - 主配置文件
   - `scripts/deployments/v25-verification-*.json` - 驗證數據
   - `scripts/deployments/v25-deployment-report-*.md` - 部署報告

2. **日誌文件**
   - `scripts/deployments/v25-deployment-*.log` - 部署日誌
   - `scripts/deployments/v25-error-report-*.json` - 錯誤報告（如果有）

## 🔍 驗證部署

### 檢查合約地址
```bash
node -e "const c=require('./config/v25-config.js'); Object.entries(c.contracts).forEach(([k,v])=>console.log(k+':', v.address))"
```

### 查看關鍵合約
```bash
node -e "const c=require('./config/v25-config.js'); console.log('DungeonCore:', c.contracts.DUNGEONCORE.address); console.log('Hero:', c.contracts.HERO.address); console.log('Relic:', c.contracts.RELIC.address)"
```

## 🐛 故障排除

### 1. 合約編譯失敗
```bash
# 清理並重新編譯
npx hardhat clean
npx hardhat compile --force
```

### 2. 部署失敗
- 檢查錢包餘額
- 確認網路連接
- 查看錯誤日誌

### 3. 驗證失敗
- 確認 BSCSCAN_API_KEY 正確
- 等待更長時間（60秒）再驗證
- 使用 --only 參數重試特定合約

### 4. 配置同步失敗
- 檢查項目路徑是否正確
- 確認有寫入權限
- 使用 --rollback 回滾

## 📈 性能優化

V25 相比 V24 的改進：

1. **並行處理** - 合約設置使用 Promise.all 並行執行
2. **智能重試** - 自動處理已驗證的合約
3. **錯誤恢復** - 記錄所有錯誤並提供恢復建議
4. **自動備份** - 配置同步時自動備份原文件

## 🔄 更新流程

如果需要更新已部署的合約：

1. 修改合約代碼
2. 更新版本號到 V26
3. 調整部署配置
4. 執行新版本部署

## 📞 支援

如遇到問題：

1. 查看部署日誌
2. 檢查錯誤報告
3. 參考 V23/V24 的經驗
4. 聯繫開發團隊

---

**注意**：正式部署前請確保：
- ✅ 所有測試通過
- ✅ 審計報告完成
- ✅ 多重簽名錢包準備就緒
- ✅ 監控系統配置完成
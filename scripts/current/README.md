# 🎯 DungeonDelvers 核心腳本

> **執行日期**：2025-08-06  
> **版本**：V25 (統一版本)  
> **狀態**：已完成大規模整理，從 300+ 腳本精簡到 4 個核心腳本

## 📁 核心腳本清單

| 腳本 | 功能 | 使用場景 | 執行命令 |
|------|------|----------|----------|
| **deploy.js** | V26 VRF 完整部署 | 新環境部署 | `npx hardhat run scripts/current/deploy.js --network bsc` |
| **verify.js** | 合約驗證 | 部署後驗證 | `npx hardhat run scripts/current/verify.js --network bsc` |
| **sync-config.js** | 配置同步 | 更新前端/子圖配置 | `node scripts/current/sync-config.js` |
| **maintenance.js** | 自動維護 | 20分鐘循環維護 | `node scripts/current/maintenance.js` |

## 🚀 標準部署流程

### 1. 完整新部署
```bash
# 編譯合約
npx hardhat compile

# 執行部署
npx hardhat run scripts/current/deploy.js --network bsc

# 驗證合約
npx hardhat run scripts/current/verify.js --network bsc

# 同步配置到其他項目
node scripts/current/sync-config.js
```

### 2. 配置更新
```bash
# 同步最新配置
node scripts/current/sync-config.js

# 檢查同步狀態
node scripts/current/sync-config.js --verify
```

### 3. 啟動自動維護
```bash
# 啟動維護服務（背景運行）
nohup node scripts/current/maintenance.js &

# 查看維護日誌
tail -f maintenance.log
```

## ⚠️ 重要注意事項

### 版本一致性
- **所有腳本已統一為 V25 版本**
- 配置從 `src/config/master-config.ts` 讀取
- **不要直接修改腳本內的地址**，請更新 master-config.ts

### 配置來源
```javascript
// ✅ 正確方式
import { MASTER_CONFIG } from '../src/config/master-config.js';
const { HERO_ADDRESS } = MASTER_CONFIG.contracts;

// ❌ 錯誤方式 
const HERO_ADDRESS = "0x5d71..."; // 硬編碼
```

### Gas 設定
- 部署腳本預設 Gas Price: 5 Gwei
- 緊急情況可調整至 10-20 Gwei
- 維護腳本使用較低 Gas (0.1 Gwei)

## 🗃️ 封存腳本

所有舊版本和實驗性腳本已移至：
```
scripts/_archive_2025-08-06/
├── active/           # 原 active 目錄 (90+ V25/V26 腳本)
├── archive/          # 原 archive 目錄 (180+ 舊腳本)
├── deploy/           # 原 deploy 目錄
└── [其他腳本]        # 根目錄下的散落腳本
```

### 封存內容包含
- **VRF 部署變體**：15+ 個實驗版本
- **V25 腳本**：50+ 個中間版本
- **測試腳本**：20+ 個診斷工具
- **維護腳本**：多個版本的自動化工具

### 何時參考封存腳本
1. **部署失敗**：參考相同錯誤的歷史解決方案
2. **特殊需求**：需要特定功能的歷史實作
3. **回滾需求**：需要還原到特定版本狀態
4. **學習研究**：了解功能演進過程

## 🔧 故障排除

### 部署失敗
1. 檢查 `.env` 文件配置
2. 確認 BNB 餘額充足
3. 參考封存腳本中的相似錯誤解決方案

### 驗證失敗
1. 等待 1-2 分鐘後重試
2. 檢查 BSCScan API 金鑰
3. 使用 `--force` 參數強制重新驗證

### 配置同步問題
1. 檢查 master-config.ts 版本號
2. 確認所有項目路徑正確
3. 手動備份重要配置文件

## 📚 相關文檔

- [主專案配置](../src/config/master-config.ts) - 單一配置來源
- [部署指南](../docs/DEPLOYMENT_GUIDE.md) - 詳細部署說明
- [清理計畫](../SCRIPTS_CLEANUP_PLAN.md) - 整理過程記錄
- [組織分析](../SCRIPTS_ORGANIZATION_ANALYSIS.md) - 問題分析報告

## 📞 支援

如遇到問題：
1. 先查看封存腳本中的相似案例
2. 檢查 Git 歷史記錄
3. 參考相關文檔和日誌文件

---

*整理完成時間：2025-08-06*  
*維護者：開發團隊*  
*腳本精簡率：98.7% (300+ → 4)*
# 📖 V25 同步系統使用指南

## 🚀 快速開始

### 基本用法

```bash
# 進入同步系統目錄
cd /Users/sotadic/Documents/DungeonDelversContracts/scripts/active/sync-system

# 執行完整同步（指定子圖版本）
node index.js v3.6.1

# 或者互動式輸入版本
node index.js
# 提示：請輸入子圖版本 (如 v3.6.1) 或按 Enter 使用默認版本: v3.6.1
```

## 📋 功能列表

### 1. 完整同步（最常用）
將所有配置同步到前端、後端、子圖項目。

```bash
node index.js v3.6.1
```

**同步內容**：
- ✅ 智能合約 ABI 文件
- ✅ 前端配置（contracts.ts、環境變數、CDN 配置）
- ✅ 後端配置（contracts.js、.env、shared-config.json）
- ✅ 子圖配置（networks.json、subgraph.yaml、package.json）

**執行流程**：
1. 載入並驗證主配置
2. 編譯合約並同步 ABI
3. 更新前端所有配置文件
4. 更新後端配置和環境變數
5. 同步子圖配置文件
6. 執行最終驗證
7. 生成同步報告和回滾腳本

### 2. 僅驗證配置
檢查所有項目的配置一致性，不做任何修改。

```bash
node index.js --validate-only
```

**驗證項目**：
- 地址唯一性檢查
- 前端配置一致性
- 後端配置一致性
- 子圖配置一致性
- 代碼中的配置使用檢查

**輸出範例**：
```
驗證結果: ✅ 通過
問題數量: 0
```

### 3. 回滾操作
恢復到上次同步前的狀態。

```bash
node index.js --rollback
```

**注意事項**：
- 只能回滾當前會話的修改
- 重啟後需要使用生成的回滾腳本

### 4. 使用生成的回滾腳本
每次同步都會生成專用回滾腳本。

```bash
# 查看回滾腳本
ls ../deployments/restore-*.sh

# 執行回滾
bash ../deployments/restore-1754417549493.sh
```

## 🎯 常見使用場景

### 場景 1：部署新合約後同步
```bash
# 1. 部署合約（在合約項目）
npx hardhat run scripts/deploy.js --network bsc

# 2. 更新 master-config.json 中的地址

# 3. 執行同步
node index.js v3.6.2  # 使用新版本號

# 4. 驗證同步結果
node index.js --validate-only
```

### 場景 2：更新子圖版本
```bash
# 只更新子圖版本號，不改變合約地址
node index.js v3.6.3

# 系統會自動：
# - 更新所有子圖 URL
# - 更新 package.json 版本
# - 同步到前端和後端
```

### 場景 3：修復配置不一致
```bash
# 1. 先驗證找出問題
node index.js --validate-only

# 2. 如果有問題，執行完整同步
node index.js v3.6.1

# 3. 確認問題已解決
node index.js --validate-only
```

### 場景 4：緊急回滾
```bash
# 方法 1：立即回滾（同一會話）
node index.js --rollback

# 方法 2：使用回滾腳本（任何時候）
bash ../deployments/restore-1754417549493.sh
```

## 📊 輸出說明

### 成功同步輸出
```
🚀 開始完整同步...
📖 載入配置...
✅ 已載入主配置: 14 個合約
🔄 同步 ABI 文件...
✅ ABI 同步完成: 12/12
🎯 更新前端配置...
✅ 前端更新完成: 5/5
🎯 更新後端配置...
✅ 後端更新完成: 3/3
📊 同步子圖配置...
✅ 子圖同步完成: 4/4
✅ 最終驗證...
✅ 所有驗證通過
🎉 同步完成！耗時: 1.79s
```

### 生成的文件

每次同步會生成以下文件：

1. **同步報告**
   ```
   deployments/sync-report-[timestamp].json
   ```
   包含詳細的同步結果和修改記錄。

2. **回滾腳本**
   ```
   deployments/restore-[timestamp].sh
   ```
   可執行的 shell 腳本，用於回滾所有修改。

3. **驗證報告**（僅 --validate-only）
   ```
   deployments/validation-report-[timestamp].json
   ```
   包含所有驗證問題的詳細信息。

## ⚠️ 注意事項

### 必要條件
1. **Node.js 版本**：需要 Node.js 14+
2. **依賴安裝**：不需要額外安裝，使用內建模組
3. **權限要求**：需要對所有項目目錄的讀寫權限

### 路徑配置
如果項目路徑改變，需要更新：
```javascript
// config/project-paths.js
const PROJECT_PATHS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};
```

### 常見問題

**Q: ABI 同步失敗？**
```bash
# 確保合約已編譯
cd /Users/sotadic/Documents/DungeonDelversContracts
npx hardhat compile

# 重新執行同步
cd scripts/active/sync-system
node index.js v3.6.1
```

**Q: 找不到配置文件？**
```bash
# 檢查 master-config.json 是否存在
ls /Users/sotadic/Documents/DungeonDelversContracts/config/master-config.json

# 如果不存在，從 v25-config.js 生成
node ../v25-config-to-master.js
```

**Q: 驗證顯示地址不一致？**
```bash
# 執行完整同步來修復
node index.js v3.6.1

# 再次驗證
node index.js --validate-only
```

## 🔧 進階用法

### 自定義同步
如果只想同步特定部分，可以修改 `index.js`：

```javascript
// 只同步 ABI
const abiResults = await this.abiSyncer.syncAll();

// 只更新前端
const frontendResults = await this.frontendUpdater.updateAll(config, version);

// 只更新後端
const backendResults = await this.backendUpdater.updateAll(config, version);

// 只同步子圖
const subgraphResults = await this.subgraphSyncer.syncAll(config, version);
```

### 添加新合約
1. 更新 `config/project-paths.js` 的 `ABI_SYNC_CONFIG`
2. 更新 `master-config.json` 添加新地址
3. 執行同步

### 調試模式
查看詳細日誌：
```bash
node index.js v3.6.1 --verbose
```

## 📁 系統架構

```
sync-system/
├── index.js              # 主入口
├── USAGE_GUIDE.md        # 本文檔
├── README.md             # 架構說明
├── core/                 # 核心服務
│   ├── Logger.js         # 日誌系統
│   ├── BackupManager.js  # 備份管理
│   ├── ConfigLoader.js   # 配置載入
│   └── ValidationEngine.js # 驗證引擎
├── sync/                 # 同步器
│   ├── ABISyncer.js      # ABI 同步
│   └── SubgraphSyncer.js # 子圖同步
├── updaters/             # 更新器
│   ├── FrontendUpdater.js # 前端更新
│   └── BackendUpdater.js  # 後端更新
├── utils/                # 工具
│   └── FileOperations.js # 文件操作
└── config/               # 配置
    └── project-paths.js  # 路徑配置
```

## 🆚 與舊系統對比

| 功能 | 新系統 | 舊系統 (v25-sync-all.js) |
|------|--------|-------------------------|
| 檔案大小 | 13K + 模組 | 79K 單檔 |
| 執行速度 | ~2秒 | ~30秒 |
| 模組化 | ✅ 10個模組 | ❌ 單一檔案 |
| 可測試性 | ✅ 易於測試 | ❌ 困難 |
| 可維護性 | ✅ 極佳 | ❌ 困難 |
| 市場功能 | ❌ 已移除 | ❌ 已清理 |
| 回滾功能 | ✅ 完整 | ✅ 基本 |
| 驗證功能 | ✅ 深度 | ✅ 基本 |

## 💡 最佳實踐

1. **每次部署後立即同步**
   - 避免配置不一致導致的錯誤

2. **使用語義化版本號**
   - 主版本：重大變更
   - 次版本：新功能
   - 修訂版：錯誤修復

3. **定期驗證配置**
   ```bash
   # 每週執行一次
   node index.js --validate-only
   ```

4. **保留同步報告**
   - 用於追蹤配置變更歷史

5. **測試環境先行**
   - 在測試網同步並驗證後，再到主網

## 📞 需要幫助？

如果遇到問題：
1. 查看同步報告了解詳情
2. 使用 `--validate-only` 診斷問題
3. 查看 `deployments/` 目錄下的日誌
4. 必要時使用回滾腳本恢復

---

*最後更新：2025-08-06*
*版本：v2.0*
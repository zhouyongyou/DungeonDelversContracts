# 部署腳本更新說明

## 🔄 子圖自動同步功能（2025-07-23）

### 新增功能

1. **自動子圖配置同步**
   - `sync-config-v2.js` 現在會自動更新子圖配置
   - 包括 `subgraph.yaml` 中的合約地址和 startBlock
   - 自動生成部署腳本 `deploy-v15-auto.sh`

2. **子圖部署腳本生成**
   - 執行 `update-subgraph-deployment.js` 自動生成部署腳本
   - 更新 package.json 添加 `deploy:v15` 命令
   - 更新子圖 CLAUDE.md 文檔

### 使用方式

#### 一鍵同步所有配置（推薦）
```bash
# 這會同步前端、後端、合約和子圖的所有配置
npm run sync:config
```

#### 單獨更新子圖
```bash
# 只更新子圖配置
node scripts/update-subgraph-deployment.js
```

### 自動更新內容

1. **subgraph.yaml**
   - 合約地址更新為 V15 版本
   - startBlock 更新為 55018576
   - 保持 YAML 格式不變

2. **deploy-v15-auto.sh**
   - 自動生成的部署腳本
   - 包含版本信息和時間戳
   - 添加清理舊構建文件步驟

3. **package.json**
   - 添加 `deploy:v15` 命令
   - 添加 `deploy:current` 命令（別名）

### 子圖部署流程

```bash
# 1. 更新配置（如果需要）
cd /Users/sotadic/Documents/DungeonDelversContracts
npm run sync:config

# 2. 部署子圖
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run deploy:v15
```

### 重要提示

⚠️ **startBlock 已修正**
- 從 45036500（錯誤）更新到 55018576（正確）
- 這解決了子圖同步進度顯示問題

⚠️ **新合約可能無數據**
- V15 合約剛部署，可能還沒有鏈上活動
- 子圖同步完成後，查詢結果可能為空
- 等待實際交易發生後才會有數據

### 配置檢查

確認子圖配置正確：
```bash
# 檢查 subgraph.yaml 中的地址
grep "address:" /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml

# 檢查 startBlock
grep "startBlock:" /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml
```

### 回滾功能

如果需要回滾子圖配置：
```bash
# 查看可用備份
ls -la backups/

# 回滾到特定備份
npm run sync:rollback backups/config-backup-2025-07-23T12-00-00-000Z
```

備份包含：
- subgraph.yaml
- deploy-v15-auto.sh
- 所有其他專案的配置文件
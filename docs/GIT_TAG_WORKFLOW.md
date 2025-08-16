# 🏷️ Git Tag 版本管理流程

## 📋 概述

使用 Git tag 來追踪每個部署版本，確保可以準確回溯任何版本的代碼狀態。

## 🔖 Tag 命名規範

### 格式
```
v[版本號]-[環境]-[日期]
```

### 範例
- `v20-mainnet-20250125` - V20 主網部署
- `v21-mainnet-20250125` - V21 主網部署
- `v21-testnet-20250120` - V21 測試網部署

## 📝 建立 Tag 的步驟

### 1. 確認所有變更已提交
```bash
git status
git add .
git commit -m "Deploy V[版本號]: [簡短描述]"
```

### 2. 創建帶註釋的 Tag
```bash
git tag -a v[版本號]-mainnet-[YYYYMMDD] -m "V[版本號] 主網部署

部署內容：
- [主要變更1]
- [主要變更2]

合約地址：
- Oracle: 0x...
- Hero: 0x...
[其他合約地址]

部署者：[部署者地址]
區塊高度：[部署時的區塊高度]"
```

### 3. 推送 Tag 到遠端
```bash
git push origin v[版本號]-mainnet-[YYYYMMDD]
```

## 🔍 Tag 管理命令

### 查看所有 Tags
```bash
git tag -l
```

### 查看特定版本的 Tags
```bash
git tag -l "v20-*"
```

### 查看 Tag 詳情
```bash
git show v20-mainnet-20250125
```

### 刪除本地 Tag
```bash
git tag -d v20-mainnet-20250125
```

### 刪除遠端 Tag
```bash
git push origin --delete v20-mainnet-20250125
```

## 🔄 切換到特定 Tag

### 查看特定版本的代碼
```bash
git checkout v20-mainnet-20250125
```

### 基於 Tag 創建新分支
```bash
git checkout -b fix-v20 v20-mainnet-20250125
```

## 📌 實際範例

### V20 部署 Tag
```bash
git tag -a v20-mainnet-20250125 -m "V20 主網部署 - Oracle 修復

部署內容：
- 修復 Oracle public getter 函數問題
- 部署 Oracle_Final 合約

合約地址：
- Oracle: 0x570ab1b068FB8ca51c995e78d2D62189B6201284

部署者：0x10925A7138649C7E1794CE646182eeb5BF8ba647
區塊高度：約 55200000"

git push origin v20-mainnet-20250125
```

### V21 系統升級 Tag
```bash
git tag -a v21-system-20250125 -m "V21 版本管理系統升級

部署內容：
- 實施統一配置管理系統
- 目錄結構重組 (current/next/archive)
- 自動化同步工具

變更：
- 創建 config/v21-config.js
- 創建同步工具 scripts/v21-sync-config.js
- 創建檢查工具 scripts/v21-check-config.js

注意：此版本僅為系統升級，無新合約部署"

git push origin v21-system-20250125
```

## 🚀 部署後的 Tag 流程

1. **完成部署後立即創建 Tag**
   - 確保所有配置已更新
   - 確保所有測試通過

2. **Tag 訊息必須包含**
   - 版本號和日期
   - 主要變更列表
   - 新部署的合約地址
   - 部署者地址
   - 大致的區塊高度

3. **推送到遠端儲存庫**
   - 確保團隊成員可以訪問
   - 在部署文檔中記錄 Tag 名稱

## 📊 版本歷史查詢

### 生成版本變更日誌
```bash
git log --pretty=format:"%h - %s (%cr) <%an>" --abbrev-commit v19-mainnet-20250120..v20-mainnet-20250125
```

### 查看兩個版本間的文件變化
```bash
git diff v19-mainnet-20250120 v20-mainnet-20250125 --name-status
```

## ⚠️ 注意事項

1. **永不修改已推送的 Tags**
   - 如需修正，創建新的 Tag

2. **保持 Tag 訊息的一致性**
   - 使用標準格式
   - 包含所有關鍵信息

3. **定期清理過時的測試網 Tags**
   - 保留主網 Tags
   - 清理超過 3 個月的測試網 Tags

4. **備份重要的 Tag 信息**
   - 在部署文檔中記錄
   - 在 V21 配置系統中更新

---

**最後更新**: 2025-01-25
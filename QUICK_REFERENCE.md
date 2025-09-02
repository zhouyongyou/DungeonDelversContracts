# 🚀 DungeonDelvers 配置管理 - 快速參考

## 🎯 用戶請求地址管理時，請按以下步驟操作

### ⚡ 最常用命令（90%的情況）

```bash
# 1. 檢查現狀
node scripts/ultimate-config-system.js status

# 2. 同步配置（解決大部分問題）
node scripts/ultimate-config-system.js sync

# 3. 驗證結果
node scripts/config-validator.js validate
```

### 🔧 需要修改地址時

```bash
# 1. 編輯唯一的主配置文件
vim .env.v25

# 2. 同步到所有項目
node scripts/ultimate-config-system.js sync

# 3. 驗證結果
node scripts/config-validator.js validate
```

### 🔍 問題診斷

```bash
# 掃描硬編碼問題
node scripts/hardcoded-audit.js audit

# 快速檢查配置
node scripts/config-validator.js quick

# 詳細配置報告
node scripts/ultimate-config-system.js status
```

### 🎛️ 自動化（開發環境推薦）

```bash
# 啟動監控系統（自動檢測變更並同步）
node scripts/config-monitor.js start
```

## 📋 工具箱總覽

| 工具 | 用途 | 最常用命令 |
|------|------|-----------|
| 🏆 `ultimate-config-system.js` | 核心同步工具 | `sync`, `status` |
| 🔍 `config-validator.js` | 配置驗證 | `validate`, `quick` |
| 🔍 `hardcoded-audit.js` | 硬編碼審計 | `audit` |
| 🎛️ `config-monitor.js` | 自動監控 | `start` |

## 🚨 重要提醒

### ✅ 正確做法
- 只編輯 `.env.v25` 主配置文件
- 使用工具同步到所有項目
- 同步後重啟開發服務器

### ❌ 避免做法
- 不要直接編輯前端/後端/子圖的配置文件
- 不要手動複製貼上地址
- 不要忽略驗證步驟

## 🎉 系統成效

- **解決了 4000+ 硬編碼地址問題**
- **配置更新時間：30分鐘 → 2分鐘**
- **維護文件：N個 → 1個 (.env.v25)**
- **零配置漂移風險**
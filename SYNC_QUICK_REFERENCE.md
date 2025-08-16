# 🚀 DungeonDelvers 同步系統 - 快速參考

## 🎯 最簡單的方法（推薦）

```bash
npm run sm
```
這會開啟互動式同步管理器，引導您完成所有步驟。

## 📋 標準部署流程

### 部署新版本時（如 V26）：

```bash
# 方法一：使用同步管理器（推薦）
npm run sm
# 選擇 6 - 完整流程

# 方法二：手動步驟
1. vi config/master-config.json   # 更新版本、區塊、地址
2. npm run sync-safe              # 自動同步、驗證、修復
```

## 🛠 可用命令

| 命令 | 用途 | 何時使用 |
|------|------|----------|
| `npm run sm` | 🎯 互動式管理器 | **首選！任何時候** |
| `npm run sync-safe` | 🛡️ 安全同步 | 自動化部署 |
| `npm run sync-full` | 🚀 快速同步 | 日常同步 |
| `npm run verify-sync` | 🔍 驗證 | 檢查配置 |
| `npm run fix-sync` | 🔧 修復 | 有問題時 |

## 📝 master-config.json 關鍵欄位

```json
{
  "version": "V26",              // 版本號
  "deployment": {
    "startBlock": 56664525       // 起始區塊（重要！）
  },
  "contracts": {
    "mainnet": {
      "HERO_ADDRESS": "0x...",   // 合約地址
      "VRFMANAGER_ADDRESS": "0x..." // VRF Manager（常出錯）
    }
  },
  "subgraph": {
    "studio": {
      "version": "v3.6.8"        // 子圖版本
    }
  }
}
```

## ⚠️ 常見問題

| 問題 | 解決方法 |
|------|----------|
| 起始區塊錯誤 | `npm run fix-sync` |
| 地址不一致 | `npm run fix-sync` |
| 不確定配置是否正確 | `npm run verify-sync` |
| 想要最安全的同步 | `npm run sync-safe` |

## 🎉 記住

> **最簡單 = 最好**
> 
> 使用 `npm run sm`，讓管理器引導您！

---

💡 提示：`sm` 是 `sync-manager` 的縮寫，更容易記住和輸入。
# 📚 DungeonDelvers 配置同步完整指南

> 最後更新：2025-08-06 | V25 VRF 版本

## 🎯 快速開始

### 標準同步流程（推薦）
```bash
# 1. 執行同步並自動驗證
npm run sync-full

# 如果出現問題，執行修復
npm run fix-sync
```

### 手動同步流程
```bash
# 1. 執行同步
cd scripts/active/sync-system
node index.js

# 2. 驗證結果
npm run verify-sync

# 3. 如有問題，自動修復
npm run fix-sync

# 4. 再次驗證確保成功
npm run verify-sync
```

## 📋 同步前準備

### 1. 更新主配置文件
編輯 `/Users/sotadic/Documents/DungeonDelversContracts/config/master-config.json`：

```json
{
  "version": "V25",  // 版本號
  "deployment": {
    "startBlock": 56664525,  // 起始區塊（重要！）
    "blockNumber": 56664525
  },
  "contracts": {
    "mainnet": {
      // 所有合約地址
    }
  },
  "subgraph": {
    "studio": {
      "url": "...",
      "version": "v3.6.7"  // 子圖版本
    }
  }
}
```

### 2. 確認合約地址正確
特別注意這些經常出錯的地址：
- **ALTAROFASCENSION_ADDRESS**: 不要用 PlayerVault 的地址
- **VRFMANAGER_ADDRESS**: 確保是 VRF Manager 的地址

## 🔄 執行同步

### 方法一：全自動同步（推薦）
```bash
npm run sync-full
```
這個命令會：
1. 執行配置同步
2. 自動驗證結果
3. 顯示是否有問題

### 方法二：互動式同步
```bash
cd scripts/active/sync-system
node index.js
```
系統會提示：
```
請輸入子圖版本 (如 v3.6.1) 或按 Enter 使用默認版本: v3.6.7
```

## ✅ 驗證同步結果

### 自動驗證
```bash
npm run verify-sync
```

驗證項目包括：
- ✅ 子圖起始區塊是否一致
- ✅ 所有合約地址是否正確
- ✅ specVersion 是否為 0.0.4
- ✅ 前端環境變數是否更新
- ✅ 後端配置是否同步

### 成功輸出示例
```
🎉 所有配置驗證通過！
```

### 失敗輸出示例
```
發現問題:
  ❌ 子圖 specVersion:
   期望: 0.0.4
   實際: 3.6.5
  ❌ 子圖起始區塊不一致

💡 建議: 運行 npm run fix-sync 自動修復這些問題
```

## 🔧 修復常見問題

### 自動修復
```bash
npm run fix-sync
```

這個命令會自動修復：
- ✅ 錯誤的起始區塊
- ✅ 錯誤的 specVersion
- ✅ 錯誤的合約地址映射
- ✅ 環境變數不一致

### 手動修復特定問題

#### 問題 1：起始區塊錯誤
**症狀**：子圖使用舊的起始區塊 56184733
**修復**：
```bash
npm run fix-sync
# 或手動編輯 subgraph.yaml，將所有 startBlock 改為正確值
```

#### 問題 2：AltarOfAscension 地址錯誤
**症狀**：使用了 PlayerVault 的地址
**修復**：
```bash
npm run fix-sync
# 會自動修正為正確的 AltarOfAscension 地址
```

#### 問題 3：specVersion 錯誤
**症狀**：顯示為 3.6.5 而非 0.0.4
**修復**：
```bash
npm run fix-sync
# 會自動修正為 0.0.4
```

## 📁 同步影響的文件

### 前端項目
- `/Users/sotadic/Documents/GitHub/DungeonDelvers/`
  - `.env` - 環境變數
  - `.env.local` - 本地環境變數
  - `src/config/contracts.ts` - 合約地址配置
  - `src/config/contractsWithABI.ts` - 帶 ABI 的合約配置
  - `public/config/v25.json` - CDN 配置
  - `src/abis/*.json` - ABI 文件

### 後端項目
- `/Users/sotadic/Documents/dungeon-delvers-metadata-server/`
  - `.env` - 環境變數
  - `config/contracts.js` - 合約配置
  - `config/shared-config.json` - 共享配置

### 子圖項目
- `/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/`
  - `subgraph.yaml` - 子圖配置
  - `networks.json` - 網絡配置
  - `src/config.ts` - TypeScript 配置
  - `package.json` - 版本信息
  - `abis/*.json` - ABI 文件

## 🚨 重要注意事項

### 1. 永遠先備份
同步工具會自動備份，但建議重要更新前手動備份：
```bash
cp config/master-config.json config/master-config.backup.json
```

### 2. 檢查關鍵配置
每次同步前確認：
- 起始區塊號是否正確
- 子圖版本號是否正確
- VRF Manager 地址是否正確

### 3. 同步後必須驗證
```bash
npm run verify-sync
```
不要跳過驗證步驟！

## 🛠 可用命令總覽

| 命令 | 說明 | 使用時機 |
|------|------|---------|
| `npm run sync` | 執行配置同步 | 需要同步配置時 |
| `npm run verify-sync` | 驗證同步結果 | 同步後立即執行 |
| `npm run fix-sync` | 自動修復問題 | 驗證發現問題時 |
| `npm run sync-full` | 同步+驗證 | 標準流程（推薦） |

## 📝 同步檢查清單

同步完成後，確認以下項目：

- [ ] master-config.json 版本和區塊號正確
- [ ] 執行了 `npm run verify-sync`
- [ ] 所有驗證項目顯示 ✅
- [ ] 前端 .env 文件更新
- [ ] 後端 .env 文件更新
- [ ] subgraph.yaml 起始區塊正確
- [ ] subgraph.yaml specVersion 為 0.0.4
- [ ] AltarOfAscension 和 VRFManager 地址正確

## 💡 最佳實踐

1. **定期驗證**：即使沒有更新，定期運行 `npm run verify-sync` 確保配置一致
2. **版本控制**：同步後提交 git，記錄配置變更
3. **文檔更新**：重大變更後更新此文檔
4. **團隊溝通**：同步前後通知團隊成員

## 🆘 故障排除

### 如果同步完全失敗
1. 檢查 master-config.json 格式是否正確
2. 確認所有項目路徑存在
3. 查看錯誤日誌

### 如果修復腳本無效
1. 手動檢查文件權限
2. 確認備份文件沒有損壞
3. 嘗試從備份恢復

### 恢復到之前的配置
同步工具會創建備份文件（.backup-時間戳），可以手動恢復：
```bash
# 查看備份
ls *.backup-*

# 恢復特定文件
cp subgraph.yaml.backup-1234567890 subgraph.yaml
```

---

## 📞 需要幫助？

如果遇到問題：
1. 先運行 `npm run verify-sync` 查看具體問題
2. 嘗試 `npm run fix-sync` 自動修復
3. 查看備份文件是否可以恢復
4. 檢查 master-config.json 是否正確

記住：**永遠不要跳過驗證步驟！**
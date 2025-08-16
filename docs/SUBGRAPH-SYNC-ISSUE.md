# 子圖同步問題說明

## 🔍 問題診斷

### 發現的問題
1. **startBlock 設置錯誤**
   - 當前設置：45036500（2025年1月19日）
   - V15 實際部署：約 55018576（2025年7月23日）
   - 結果：子圖停留在舊區塊，無法索引新合約

2. **為什麼顯示同步進度不是 100%？**
   - 子圖認為需要從區塊 45036500 同步到當前區塊（55036285+）
   - 但實際上卡在 45901610，因為沒有更多相關事件
   - 這造成了「永遠無法達到 100%」的假象

## 🛠️ 解決方案

### 方案 A：立即修復（如果需要使用子圖）
```bash
# 1. 執行修復腳本
node scripts/fix-subgraph-startblock.js

# 2. 重新生成和部署
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run codegen
npm run build
graph deploy --studio dungeon-delvers
```

### 方案 B：暫時不處理（推薦）
**原因：**
- V15 合約剛部署，還沒有任何鏈上活動
- 即使修復 startBlock，子圖也不會有數據
- 可以等第一筆交易發生後再更新

## 📊 影響評估

### 目前的影響
- ❌ 子圖顯示同步進度異常（約 83%）
- ❌ 無法查詢 V15 合約的數據
- ✅ 不影響合約功能
- ✅ 不影響前端基本功能

### 修復後
- ✅ 同步進度正常（接近 100%）
- ✅ 可以查詢 V15 合約數據（如果有的話）
- ⚠️ 但如果沒有鏈上活動，查詢結果仍為空

## 🎯 建議行動

1. **短期**：暫不處理，等待實際使用
2. **中期**：當開始有用戶交易時，執行修復腳本
3. **長期**：將 startBlock 管理納入部署流程

## 📝 預防措施

未來部署新版本時：
1. 記錄部署區塊號
2. 更新 master-config.json 時包含 startBlock
3. 同步腳本自動更新 subgraph.yaml 的 startBlock

## 🔗 相關文件

- 修復腳本：`/scripts/fix-subgraph-startblock.js`
- 同步檢查：`/scripts/check-subgraph-sync-current.js`
- 子圖配置：`/DDgraphql/dungeon-delvers/subgraph.yaml`
# Marketplace V2 整合到 V25 部署流程

## 🎯 整合概述

已成功將 Marketplace V2 同步機制整合到 V25 主要部署流程中，實現自動化的 NFT 地址管理。

## 🔄 修改的文件

### 1. `scripts/active/v25-full-deploy.sh`
**新增功能：**
- 在主配置同步後自動執行 Marketplace 配置檢查
- 提供互動式 Marketplace 配置同步選項
- 在完成提示中建議執行鏈上狀態審計

**執行流程：**
```bash
# 6. 同步主要配置
v25-sync-all.js

# 6.5. 檢查 Marketplace 配置
marketplace-sync.js --check-only

# 6.6. 可選：執行 Marketplace 配置同步
# 用戶確認後執行 marketplace-sync.js

# 7. 繼續子圖部署...
```

### 2. `scripts/active/v25-sync-all.js`
**修改內容：**
- 將子圖部署提示改為編譯準備
- 明確說明部署由主部署腳本處理

## 🚀 新的部署工作流程

### 完整部署命令
```bash
# 標準部署（包含子圖）
bash scripts/active/v25-full-deploy.sh

# 跳過子圖部署
bash scripts/active/v25-full-deploy.sh --skip-subgraph

# 測試模式（不實際部署）
bash scripts/active/v25-full-deploy.sh --test-mode
```

### 步驟詳解

1. **環境檢查** - Node.js、私鑰、網路連接
2. **編譯合約** - `npx hardhat compile --force`
3. **部署合約** - V25 完整合約部署
4. **同步主配置** - `v25-sync-all.js` 更新所有項目
5. **🆕 Marketplace 檢查** - `marketplace-sync.js --check-only`
6. **🆕 Marketplace 同步** - 可選的配置更新
7. **子圖處理** - codegen、build、deploy（可選）
8. **生成總結** - 部署報告和下一步指引

## 🛡️ 雙重檢查機制

### 階段一：配置同步
- **工具**：`marketplace-sync.js`
- **功能**：比對 master-config.json 與 Marketplace 配置
- **操作**：自動更新配置文件，保持一致性
- **安全**：自動備份所有修改的文件

### 階段二：鏈上狀態審計（部署後建議執行）
- **工具**：`marketplace-address-audit.js`
- **功能**：檢查合約實際白名單狀態和活躍掛單
- **輸出**：詳細審計報告和操作建議
- **價值**：確保配置與鏈上狀態一致

## 🎛️ 用戶交互設計

### 自動化與選擇權平衡
- **自動執行**：配置檢查（--check-only）
- **用戶確認**：實際配置修改
- **建議提示**：鏈上狀態審計

### 互動示例
```bash
[INFO] 同步 Marketplace V2 配置...
✅ Marketplace 配置檢查完成

是否要同步 Marketplace V2 配置？(y/N): y

[INFO] 執行 Marketplace 配置同步...
✅ Marketplace 配置同步成功
```

## 📋 完成後的建議操作

部署完成後，腳本會自動提示：

```bash
3. Marketplace 鏈上狀態審計（建議執行）：
   node scripts/active/marketplace-address-audit.js
   # 檢查白名單狀態和活躍掛單，確保配置正確
```

## 🔍 審計報告內容

執行 `marketplace-address-audit.js` 會生成：

1. **白名單狀態表格** - V25 vs 舊地址的批准狀態
2. **活躍掛單分析** - 現有交易使用的合約地址
3. **管理建議** - 需要添加/移除的地址操作
4. **詳細 JSON 報告** - 完整的審計數據

## ⚙️ 配置文件更新

### 自動更新的文件
- `marketplace/marketplace-v2-config.json`
- `前端/src/config/marketplace.ts`
- 相關備份文件（自動生成）

### 地址同步邏輯
- **來源**：`config/master-config.json`
- **目標**：Marketplace 相關配置文件
- **檢查**：V25 地址 vs Marketplace 白名單

## 🎉 整合優勢

1. **無縫整合** - 部署流程一氣呵成
2. **安全機制** - 檢查 → 確認 → 執行 → 審計
3. **防呆設計** - 自動備份、用戶確認、錯誤處理
4. **靈活控制** - 可選執行、測試模式、跳過選項
5. **完整追蹤** - 詳細日誌、審計報告、操作建議

## 🚨 注意事項

- **測試模式**：使用 `--test-mode` 進行模擬部署
- **備份恢復**：所有配置修改都有自動備份
- **權限確認**：Marketplace 白名單修改需要合約 owner 權限
- **地址驗證**：鏈上審計會檢查實際合約狀態

---

**總結**：此整合提供了完整的 V25 + Marketplace 部署解決方案，確保 NFT 地址在所有系統中保持一致，並提供充分的檢查機制來驗證部署結果。
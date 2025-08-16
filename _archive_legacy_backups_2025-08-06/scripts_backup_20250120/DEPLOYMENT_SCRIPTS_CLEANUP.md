# 部署腳本清理建議

## 現有部署腳本分析

### 🗑️ 可以刪除的舊腳本：
1. **deploy_player_vault.ts** - 單一合約部署，已被整合腳本取代
2. **deploy-player-profile.js** - 單一合約部署，已被整合腳本取代  
3. **deploy-token.ts** - 測試代幣部署，已完成
4. **deploy.ts** - 最早期的部署腳本
5. **deploy-main.ts** - 被 deploy-final.ts 取代
6. **deploy-new.ts** - 過渡版本
7. **deploy-and-update-oracle.ts** - 單一功能腳本

### ✅ 應該保留的腳本：
1. **deploy-0711.ts** - 最新的完整部署腳本（剛才使用的）
2. **deploy-final.ts** - 備用完整部署腳本
3. **deploy-and-sync-all.ts** - 自動同步所有系統的腳本

## 建議整合方案

### 1. 創建主部署腳本 `deploy-main.ts`：
```typescript
// 整合最佳實踐
- 從環境變量讀取配置
- 支援增量部署（跳過已部署的合約）
- 自動驗證合約
- 自動更新所有相關 .env 文件
```

### 2. 創建同步腳本 `sync-all-systems.ts`：
```typescript
// 部署後同步所有系統
- 更新前端 .env
- 更新後端 .env  
- 更新 subgraph.yaml
- 提交 Git（可選）
- 觸發 CI/CD（可選）
```

### 3. 創建工具腳本目錄 `scripts/tools/`：
- `update-contract-addresses.ts` - 更新特定合約地址
- `verify-contracts.ts` - 驗證所有合約
- `check-deployment.ts` - 檢查部署狀態

## 清理步驟

```bash
# 1. 備份舊腳本
mkdir scripts/archive
mv scripts/deploy_player_vault.ts scripts/archive/
mv scripts/deploy-player-profile.js scripts/archive/
mv scripts/deploy-token.ts scripts/archive/
mv scripts/deploy.ts scripts/archive/
mv scripts/deploy-main.ts scripts/archive/
mv scripts/deploy-new.ts scripts/archive/
mv scripts/deploy-and-update-oracle.ts scripts/archive/

# 2. 重命名主要腳本
mv scripts/deploy-0711.ts scripts/deploy.ts
mv scripts/deploy-and-sync-all.ts scripts/deploy-and-sync.ts

# 3. 刪除 deploy-final.ts（如果與 deploy-0711.ts 功能相同）
```

## 環境變量統一建議

### 前端/後端統一使用：
- `VITE_MAINNET_` 前綴（Vite 需要）
- 這樣前端和後端可以共用相同的環境變量名稱

### 合約專案使用：
- 無前綴版本（Hardhat 不需要 VITE_）
- 或改為也使用 `VITE_` 前綴，在腳本中去除前綴

### 建議的環境變量管理：
1. 創建 `.env.example` 文件包含所有需要的變量
2. 使用單一來源管理（如 1Password 或 AWS Secrets Manager）
3. 創建腳本自動同步到各個專案
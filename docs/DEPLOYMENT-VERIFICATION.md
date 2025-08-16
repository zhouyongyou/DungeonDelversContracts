# 部署驗證檢查清單

## 🚀 Vercel 部署驗證（前端）

### 環境變數設置
✅ **只需要一個環境變數！**
```
VITE_WALLETCONNECT_PROJECT_ID=d02f4199d4862ab0a12a3d0424fb567b
```

### 驗證步驟

1. **檢查環境變數**
   ```bash
   # 在 Vercel Dashboard
   Settings > Environment Variables
   # 確認只有 VITE_WALLETCONNECT_PROJECT_ID
   ```

2. **驗證 CDN 配置載入**
   - 訪問: https://dungeondelvers.xyz/config/v15.json
   - 應該看到完整的配置文件

3. **檢查前端控制台**
   - 打開瀏覽器開發者工具
   - 應該看到: `Configuration loaded: Version V15`

4. **測試合約交互**
   - 連接錢包
   - 嘗試查看 NFT
   - 確認合約地址正確

### 故障排除
- 如果配置未載入，檢查 CDN 文件是否可訪問
- 如果合約地址錯誤，清除瀏覽器緩存並刷新

## 🌐 Render 部署驗證（後端）

### 環境變數設置
✅ **簡化到 3-4 個環境變數！**
```
NODE_ENV=production
CORS_ORIGIN=https://dungeondelvers.xyz,https://www.dungeondelvers.xyz
FRONTEND_DOMAIN=https://dungeondelvers.xyz

# 可選（通常不需要）
CONFIG_URL=https://dungeondelvers.xyz/config/v15.json
```

### 驗證步驟

1. **運行測試腳本**
   ```bash
   # 本地測試
   node test-backend-config.js production
   ```

2. **檢查健康端點**
   ```bash
   curl https://dungeon-delvers-metadata-server.onrender.com/health
   ```
   應該返回:
   ```json
   {
     "status": "healthy",
     "configVersion": "V15",
     "configSource": "remote"
   }
   ```

3. **測試配置刷新**
   ```bash
   curl -X POST https://dungeon-delvers-metadata-server.onrender.com/api/config/refresh
   ```

4. **驗證 NFT API**
   ```bash
   curl https://dungeon-delvers-metadata-server.onrender.com/api/hero/1
   ```

### 監控配置狀態

```bash
# 查看當前配置
curl https://dungeon-delvers-metadata-server.onrender.com/ | jq '.features'

# 輸出應該包含：
{
  "dynamicConfig": true,
  "configSource": "remote",
  "autoRefresh": true
}
```

## 📊 The Graph 子圖驗證

### 部署後檢查
1. **訪問 Studio Dashboard**
   - https://thegraph.com/studio/
   - 查看同步進度

2. **測試查詢**
   ```graphql
   {
     heros(first: 5) {
       id
       owner
       power
     }
   }
   ```

3. **驗證 startBlock**
   - 應該是 55018576（V15 部署區塊）
   - 不是 45036500（舊的錯誤值）

## ✅ 完整檢查清單

### Vercel（前端）
- [ ] 環境變數只有 `VITE_WALLETCONNECT_PROJECT_ID`
- [ ] CDN 配置文件可訪問
- [ ] 瀏覽器控制台顯示配置載入成功
- [ ] NFT 顯示正常
- [ ] 合約交互正常

### Render（後端）
- [ ] 環境變數只有 3-4 個基本設置
- [ ] Health 端點顯示 configVersion: V15
- [ ] 配置來源顯示為 "remote"
- [ ] NFT metadata API 正常
- [ ] 配置刷新功能正常

### 子圖
- [ ] 同步進度正常
- [ ] startBlock 正確（55018576）
- [ ] 查詢返回數據

## 🔄 配置更新流程

當需要更新合約地址時：

1. **更新主配置**
   ```bash
   cd /Users/sotadic/Documents/DungeonDelversContracts
   vi config/master-config.json
   ```

2. **執行同步**
   ```bash
   npm run sync:config
   ```

3. **自動生效**
   - 前端：立即從 CDN 載入新配置
   - 後端：5 分鐘內自動更新
   - 無需重新部署！

## 🚨 緊急回滾

如果配置出現問題：

1. **使用備份**
   ```bash
   npm run sync:rollback backups/config-backup-TIMESTAMP
   ```

2. **手動設置環境變數**
   - 在 Vercel/Render 設置合約地址作為臨時措施
   - 環境變數會覆蓋 CDN 配置

3. **強制刷新後端**
   ```bash
   curl -X POST https://dungeon-delvers-metadata-server.onrender.com/api/config/refresh
   ```
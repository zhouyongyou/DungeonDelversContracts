# 🤖 自動揭示服務部署指南

## 📋 部署前檢查清單

### 1. 環境準備
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts/scripts
npm install ethers dotenv
npm install -g pm2
```

### 2. 創建 .env 文件
```bash
cat > .env << 'EOF'
# BSC 主網 RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org/

# 服務錢包私鑰（需要有 BNB 支付 gas）
AUTO_REVEAL_PRIVATE_KEY=0x...

# 合約地址 (V25)
HERO_CONTRACT_ADDRESS=0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0
RELIC_CONTRACT_ADDRESS=0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366
EOF
```

### 3. 錢包準備
- 建議充值 **0.1-0.2 BNB**（每次揭示約 0.0003-0.0005 BNB）
- 確保私鑰對應的地址有足夠餘額

## 🚀 部署步驟

### 1. 測試運行
```bash
# 檢查配置
node -e "require('dotenv').config(); console.log('Wallet:', require('ethers').Wallet(process.env.AUTO_REVEAL_PRIVATE_KEY).address)"

# 測試模式運行（不實際發送交易）
sed -i 's/DRY_RUN: false/DRY_RUN: true/' auto-reveal-service.js
node auto-reveal-service.js
```

### 2. 正式部署
```bash
# 恢復正式模式
sed -i 's/DRY_RUN: true/DRY_RUN: false/' auto-reveal-service.js

# 使用 PM2 啟動
pm2 start auto-reveal-service.js \
  --name "auto-reveal" \
  --log-date-format "YYYY-MM-DD HH:mm:ss" \
  --merge-logs \
  --restart-delay 5000 \
  --max-restarts 10

# 保存 PM2 配置
pm2 save

# 設置開機自啟動
pm2 startup
# 按照提示執行命令
```

## 📊 監控管理

### 實時監控
```bash
# 查看實時日誌
pm2 logs auto-reveal --lines 50

# 查看服務狀態
pm2 status auto-reveal

# 查看詳細信息
pm2 show auto-reveal
```

### 日誌管理
```bash
# 日誌位置
~/.pm2/logs/auto-reveal-out.log  # 標準輸出
~/.pm2/logs/auto-reveal-error.log # 錯誤輸出

# 清理舊日誌
pm2 flush auto-reveal
```

### 服務管理
```bash
# 重啟服務
pm2 restart auto-reveal

# 停止服務
pm2 stop auto-reveal

# 刪除服務
pm2 delete auto-reveal
```

## ⚠️ 重要提醒

### Gas 優化
1. 服務已包含 `canReveal()` 檢查，避免重複揭示
2. 監聽 `RevealedByProxy` 事件自動清理
3. 設置了最高 gas price 限制（10 gwei）

### 監控要點
```bash
# 定期檢查錢包餘額
pm2 logs auto-reveal | grep "Gas Price"

# 檢查待揭示數量
pm2 logs auto-reveal | grep "待揭示數量"

# 檢查錯誤
pm2 logs auto-reveal | grep "❌"
```

### 緊急處理
```bash
# 如果 gas 費用過高，暫停服務
pm2 stop auto-reveal

# 修改 gas 上限
nano auto-reveal-service.js
# 修改 MAX_GAS_PRICE: '10' 為更高值

# 重啟服務
pm2 restart auto-reveal
```

## 🔍 故障排除

### 常見問題

1. **"無法揭示（可能已完成）"**
   - 正常情況，表示用戶已自行揭示
   - 服務會自動清理記錄

2. **"Gas price 過高"**
   - 檢查當前網路 gas 價格
   - 考慮調整 MAX_GAS_PRICE

3. **"Already revealed" 錯誤**
   - 正常情況，服務會自動處理
   - 不會浪費 gas（交易會被 revert）

### 性能優化建議
- 考慮將 CHECK_INTERVAL 調整為 30 秒（減少 RPC 請求）
- 在網路擁堵時暫時停止服務
- 定期清理過期記錄（已自動實現）

## 📈 成本預估

| 項目 | 數值 |
|-----|------|
| 每次揭示 gas | ~150,000 |
| gas price (平均) | 3 gwei |
| 每次揭示成本 | ~0.00045 BNB |
| 每日揭示次數（預估） | 50-200 |
| 每日成本 | 0.0225-0.09 BNB |
| 每月成本 | 0.675-2.7 BNB |

## 🎯 最佳實踐

1. **定期檢查**：每天檢查一次服務狀態和錢包餘額
2. **日誌輪轉**：每週清理一次日誌（`pm2 flush`）
3. **餘額警報**：當餘額低於 0.05 BNB 時充值
4. **備份私鑰**：確保私鑰安全備份
5. **監控告警**：設置餘額不足或服務停止的告警

---

*最後更新：2025-08-03*
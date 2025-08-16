# 🤖 自動揭示服務設置指南

## 📋 總覽

自動揭示服務是一個後端 Node.js 程序，會：
1. **監聽**區塊鏈上的 `MintCommitted` 事件
2. **追蹤**所有待揭示的 NFT 
3. **自動執行**在最後 30 秒內幫用戶揭示

## 🔧 設置步驟

### 1. 環境準備

```bash
# 創建專用資料夾
mkdir auto-reveal-service
cd auto-reveal-service

# 初始化 npm
npm init -y

# 安裝依賴
npm install ethers dotenv
npm install -g pm2  # 進程管理工具
```

### 2. 環境變數配置

創建 `.env` 文件：
```env
# BSC 主網 RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org/

# 服務錢包私鑰（需要有 BNB 支付 gas）
AUTO_REVEAL_PRIVATE_KEY=0x...

# 合約地址
HERO_CONTRACT_ADDRESS=0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0
RELIC_CONTRACT_ADDRESS=0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366
```

### 3. 錢包準備

```javascript
// 查看錢包地址和餘額
const ethers = require('ethers');
const wallet = new ethers.Wallet(process.env.AUTO_REVEAL_PRIVATE_KEY);
console.log('錢包地址:', wallet.address);
console.log('請確保有足夠 BNB 支付 gas 費用');
```

**建議**：
- 準備 0.1-0.5 BNB 作為 gas 費用
- 每次自動揭示約消耗 0.0003-0.0005 BNB

### 4. 部署服務

```bash
# 複製服務腳本
cp /path/to/auto-reveal-service.js ./

# 測試運行
node auto-reveal-service.js

# 使用 PM2 管理（生產環境）
pm2 start auto-reveal-service.js --name "auto-reveal"
pm2 save
pm2 startup  # 設置開機自啟動
```

## 📊 運作原理詳解

### 監聽機制

```javascript
// 1. 監聽新的鑄造承諾
heroContract.on('MintCommitted', (player, quantity, blockNumber) => {
    // 記錄到待處理列表
    pendingReveals.set(player, {
        contract: 'hero',
        blockNumber: blockNumber,
        deadline: blockNumber + 258  // 3 + 255 區塊
    });
});
```

### 定時檢查

```javascript
// 2. 每 15 秒檢查一次
setInterval(async () => {
    const currentBlock = await provider.getBlockNumber();
    
    for (const [user, data] of pendingReveals) {
        const blocksRemaining = data.deadline - currentBlock;
        
        // 最後 40 個區塊（30秒）內觸發
        if (blocksRemaining <= 40 && blocksRemaining > 0) {
            // 執行揭示
            await contract.revealMintFor(user);
        }
    }
}, 15000);
```

### 清理機制

```javascript
// 3. 監聽揭示完成事件，清理記錄
contract.on('RevealedByProxy', (user, proxy) => {
    pendingReveals.delete(user);
});
```

## 🎮 前端整合

### 顯示自動揭示狀態

```typescript
// 前端組件
function AutoRevealStatus({ commitment }) {
    return (
        <div className="auto-reveal-notice">
            <Icon type="robot" />
            <span>自動揭示服務已啟用</span>
            <Tooltip>
                如果您忘記揭示，系統將在最後 30 秒自動幫您完成
            </Tooltip>
        </div>
    );
}
```

### 倒計時警告

```typescript
function RevealCountdown({ deadline }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [urgency, setUrgency] = useState('normal');
    
    useEffect(() => {
        const timer = setInterval(() => {
            const seconds = (deadline - currentBlock) * 0.75;
            setTimeLeft(seconds);
            
            if (seconds < 60) {
                setUrgency('critical');
                // 瀏覽器通知
                new Notification('緊急提醒', {
                    body: '您的 NFT 即將過期，請立即揭示！',
                    icon: '/alert.png'
                });
            } else if (seconds < 120) {
                setUrgency('warning');
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [deadline]);
    
    return (
        <div className={`countdown ${urgency}`}>
            <ClockIcon />
            {formatTime(timeLeft)}
            {urgency === 'critical' && <span>自動揭示即將觸發</span>}
        </div>
    );
}
```

## 🔍 監控與維護

### PM2 監控命令

```bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs auto-reveal

# 查看詳細信息
pm2 show auto-reveal

# 重啟服務
pm2 restart auto-reveal

# 停止服務
pm2 stop auto-reveal
```

### 日誌範例

```
🤖 自動揭示服務啟動
📍 錢包地址: 0x1234...5678
⏰ 檢查間隔: 15 秒
🎯 觸發時機: 最後 40 區塊

🔍 掃描現有待揭示承諾...
📊 找到 3 個待揭示承諾

🎯 新的 Hero 承諾: 0xabc...def
📝 記錄待揭示: 0xabc...def (hero), 截止區塊: 32456789

⏰ 即將到期: 0xabc...def, 剩餘 35 區塊
🚀 執行自動揭示: 0xabc...def
📤 交易已發送: 0x123...789
✅ 交易確認: 0x123...789
```

## ⚠️ 注意事項

### 1. **Gas 費用管理**
- 設置最高 gas price 限制
- 在網絡擁堵時暫停服務
- 定期檢查錢包餘額

### 2. **錯誤處理**
- 自動重試失敗的交易
- 記錄所有錯誤到日誌
- 設置告警通知

### 3. **安全考量**
- 私鑰安全存儲
- 限制服務權限
- 定期審計日誌

## 📈 性能優化

### 批量處理（未來優化）

```solidity
// 合約端支援批量揭示
function batchRevealFor(address[] calldata users) external {
    for (uint i = 0; i < users.length; i++) {
        _revealMintFor(users[i]);
    }
}
```

### 資料庫持久化（可選）

```javascript
// 使用 Redis 或 MongoDB 持久化待揭示列表
const redis = require('redis');
const client = redis.createClient();

// 存儲
await client.hSet('pending_reveals', user, JSON.stringify(data));

// 讀取
const pending = await client.hGetAll('pending_reveals');
```

## 🎯 總結

這個自動揭示服務能夠：
1. **保護用戶權益** - 防止因忘記揭示而損失
2. **提升體驗** - 用戶不必擔心錯過時間
3. **維護公平** - 確保所有 NFT 都會被揭示

配合前端提醒 + 合約代理揭示 + 後端自動服務，形成完整的保護機制！
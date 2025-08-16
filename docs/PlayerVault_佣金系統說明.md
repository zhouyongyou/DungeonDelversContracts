# PlayerVault 佣金系統說明

## 💰 佣金計算邏輯

### 原始金額分配流程
```
玩家提款 1000 SOUL
├── 稅收 (假設 25%)：250 SOUL → 虛擬記帳給 owner
└── 稅後金額：750 SOUL
    ├── 佣金 (5%)：37.5 SOUL → 虛擬記帳給推薦人
    └── 最終給玩家：712.5 SOUL → 實際轉出
```

### 關鍵點
1. **佣金從稅後金額計算**：不是額外的稅，而是從玩家的稅後收入中分配
2. **對玩家的影響**：有推薦人時，玩家實際收到的金額會減少 5%
3. **總成本**：稅率 + (100% - 稅率) × 5%

### 舉例說明
- 提款：1000 SOUL
- 稅率：25%
- 無推薦人：收到 750 SOUL (75%)
- 有推薦人：收到 712.5 SOUL (71.25%)
- 推薦人獲得：37.5 SOUL (3.75%)

## 🔄 v2 版本改進

### 1. 簡化的虛擬記帳
```solidity
// 推薦人佣金 - 虛擬記帳
virtualCommissionBalance[referrer] += commissionAmount;

// 稅收 - 虛擬記帳  
virtualTaxBalance += taxAmount;

// 只有玩家部分實際轉出
soulShardToken.safeTransfer(_withdrawer, finalAmountToPlayer);
```

### 2. 獨立的提取功能
- **玩家**：`withdraw()` - 提取遊戲收益
- **推薦人**：`withdrawCommission()` - 提取佣金
- **Owner**：`withdrawTax()` - 提取稅收

### 3. 移除不必要的追蹤
- ❌ virtualSpentBalance（虛擬支出餘額）
- ❌ gameContractBalances（遊戲合約餘額）
- ❌ 鑄造功能

### 4. 保留有用的功能
- ✅ emergencyWithdrawSoulShard - 支援全部提取
- ✅ 基本查詢功能
- ✅ 佣金餘額查詢

## 📊 資金流向

### 存入（虛擬）
```
地下城獎勵 → deposit() → playerInfo[player].withdrawableBalance += amount
```

### 遊戲消費（虛擬）
```
鑄造NFT → spendForGame() → playerInfo[player].withdrawableBalance -= amount
```

### 提款（混合）
```
玩家提款 → withdraw() 
├── 虛擬：稅收記入 virtualTaxBalance
├── 虛擬：佣金記入 virtualCommissionBalance[referrer]
└── 實際：轉出 SOUL 給玩家
```

## 🚀 部署準備

### 1. 合約需要預充值
```javascript
// 部署後立即充值
await soulShard.transfer(playerVault.address, ethers.utils.parseEther("10000000"));
```

### 2. 前端更新
- 顯示推薦人佣金餘額
- 添加佣金提取按鈕
- 更新稅後實收金額計算

### 3. 測試重點
- 有/無推薦人的提款差異
- 佣金累積和提取
- 稅收累積和提取
- 緊急提取功能

## ⚠️ 注意事項

1. **佣金影響**：玩家需要知道有推薦人會減少 5% 收入
2. **資金安全**：確保合約始終有足夠的 SoulShard 餘額
3. **權限管理**：只有 owner 能提取稅收和緊急提取
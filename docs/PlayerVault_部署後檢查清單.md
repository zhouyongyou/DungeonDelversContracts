# PlayerVault 部署後檢查清單

## 🔄 基於 v25-sync-all.js 的自動化更新

### 1. 編譯合約生成新 ABI
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
npx hardhat compile
```

### 2. 運行同步腳本更新所有項目
```bash
# 同步所有配置（會自動更新 PlayerVault ABI）
node scripts/active/v25-sync-all.js

# 或者指定子圖版本一起更新
node scripts/active/v25-sync-all.js v3.3.7
```

## ✅ 自動更新的項目

### 前端項目 (`/Users/sotadic/Documents/GitHub/DungeonDelvers/`)
- `src/abis/PlayerVault.json` ✅ 自動同步
- `src/config/contracts.ts` ✅ 自動更新地址
- `src/config/contractsWithABI.ts` ✅ 自動更新ABI引用

### 後端項目 (`/Users/sotadic/Documents/dungeon-delvers-metadata-server/`)
- `config/contracts.js` ✅ 自動更新（如果存在）
- 無需其他修改（後端主要是讀取數據）

### 子圖項目 (`/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/`)
- `abis/PlayerVault.json` ✅ 自動同步
- `networks.json` ✅ 自動更新地址
- `subgraph.yaml` ✅ 自動更新配置

## 🆕 新功能前端集成

根據 v25-sync-all.js 的配置，以下組件需要手動更新：

### 1. PlayerVault 相關頁面
需要添加的新功能：

#### 金庫管理頁面
```typescript
// 新增佣金顯示
const { data: commissionBalance } = useReadContract({
  address: getContractWithABI('PLAYERVAULT').address,
  abi: getContractWithABI('PLAYERVAULT').abi,
  functionName: 'getCommissionBalance',
  args: [address]
});

// 新增佣金提取功能
const { writeContract } = useWriteContract();
const withdrawCommission = () => {
  writeContract({
    address: getContractWithABI('PLAYERVAULT').address,
    abi: getContractWithABI('PLAYERVAULT').abi,
    functionName: 'withdrawCommission'
  });
};
```

#### 管理員頁面
```typescript
// 稅收餘額查詢
const { data: taxBalance } = useReadContract({
  address: getContractWithABI('PLAYERVAULT').address,
  abi: getContractWithABI('PLAYERVAULT').abi,
  functionName: 'getTaxBalance'
});

// 稅收提取
const withdrawTax = () => {
  writeContract({
    address: getContractWithABI('PLAYERVAULT').address,
    abi: getContractWithABI('PLAYERVAULT').abi,
    functionName: 'withdrawTax'
  });
};
```

### 2. 事件監聽更新
```typescript
// 新增虛擬事件監聽
import { useWatchContractEvent } from 'wagmi';

useWatchContractEvent({
  address: getContractWithABI('PLAYERVAULT').address,
  abi: getContractWithABI('PLAYERVAULT').abi,
  eventName: 'VirtualGameSpending',
  onLogs: (logs) => {
    console.log('虛擬遊戲消費:', logs);
  }
});

useWatchContractEvent({
  address: getContractWithABI('PLAYERVAULT').address,
  abi: getContractWithABI('PLAYERVAULT').abi,
  eventName: 'VirtualCommissionAdded',
  onLogs: (logs) => {
    console.log('虛擬佣金添加:', logs);
  }
});
```

## 🔍 驗證步驟

### 1. 檢查配置同步
```bash
# 檢查配置一致性
node scripts/active/v25-sync-all.js --check-config

# 深度檢查代碼配置
node scripts/active/v25-sync-all.js --check-code
```

### 2. 前端驗證
```bash
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
npm run build  # 檢查是否有 TypeScript 錯誤
npm run dev     # 測試功能
```

### 3. 合約功能測試
- 測試虛擬記帳（spendForGame）
- 測試提款流程（有/無推薦人）
- 測試佣金累積和提取
- 測試稅收累積和提取

## ⚠️ 特別注意事項

### `isInitialized` 函數的重要性
```solidity
function isInitialized() external view returns (bool isReady, address tokenAddress, address coreAddress) {
    tokenAddress = address(soulShardToken);
    coreAddress = address(dungeonCore);
    isReady = tokenAddress != address(0) && coreAddress != address(0);
}
```

**實際作用：**
1. **部署驗證**：確認合約是否正確初始化
2. **前端檢查**：前端可以調用此函數確認合約狀態
3. **調試工具**：快速診斷合約配置問題
4. **自動化測試**：CI/CD 流程中的健康檢查

### 後端影響最小
根據您的項目結構，後端主要用於：
- NFT 元數據服務
- 不直接調用 PlayerVault 合約
- **結論：不需要修改後端代碼**

## 📋 完整部署流程

1. **編譯合約** → `npx hardhat compile`
2. **運行同步** → `node scripts/active/v25-sync-all.js`
3. **預充值** → 給 PlayerVault 轉入足夠的 SoulShard
4. **前端測試** → 測試新功能
5. **監控事件** → 確保虛擬記帳正常工作

這個流程確保所有相關文件都會自動更新，大大減少了手動錯誤的可能性！
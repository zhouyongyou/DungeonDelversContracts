# 🚀 Chainlink VRF 遷移指南

## 📊 遷移策略

### 最小改動原則
1. **保留所有原有接口** - 確保向後兼容
2. **VRF 作為主路徑** - 傳統方式作為備用
3. **漸進式遷移** - 可選擇性啟用

## 📝 合約改動總結

### HeroVRF.sol
```solidity
// 新增主要函數
mintWithVRF(quantity) // VRF 鑄造
fulfillRandomWords()  // 自動回調
emergencyReveal()     // 緊急備用

// 保留原有函數
mintFromWallet()      // 重定向到 VRF
reveal()             // 作為備用
forceReveal()        // 作為備用
```

### RelicVRF.sol, AltarVRF.sol, DungeonMasterVRF.sol
- 相同模式實現
- 最小化改動

## 🔧 部署腳本更新

```bash
# v25-full-deploy-vrf.sh
#!/bin/bash

# VRF 配置
VRF_COORDINATOR="0xDA3b641406dC4436D054c5399eF5609a7F5115Bf" # BSC Mainnet

# 編譯 VRF 版本
npx hardhat compile

# 部署 VRF 合約
node scripts/active/v25-deploy-vrf.js

# 設置 VRF 參數
node scripts/active/v25-setup-vrf.js
```

## 📱 前端影響評估

### ✅ 無需改動的部分
1. **NFT 顯示** - tokenId 和屬性結構不變
2. **查詢接口** - 所有 view 函數保持兼容
3. **事件監聽** - 保留原有事件

### ⚠️ 需要小幅調整
```typescript
// hooks/useCommitReveal.ts
function useMintHero() {
    // 檢測合約版本
    const isVRF = await contract.vrfRequestPrice() > 0;
    
    if (isVRF) {
        // 使用 VRF 路徑
        return contract.mintWithVRF(quantity, {
            value: totalPrice + vrfFee
        });
    } else {
        // 使用傳統路徑
        return contract.mintFromWallet(quantity, {
            value: totalPrice
        });
    }
}

// 新增狀態查詢
function useVRFStatus(address) {
    const { data } = useContractRead({
        functionName: 'getUserMintStatus',
        args: [address]
    });
    
    return {
        hasPending: data?.hasPendingRequest,
        isRevealed: data?.isRevealed,
        tokenIds: data?.tokenIds
    };
}
```

## 📊 子圖影響評估

### ✅ 無需改動
- 所有實體定義保持不變
- Transfer 事件處理不變

### ⚠️ 新增事件處理
```yaml
# subgraph.yaml 新增
- event: VRFRequested(indexed address,uint256,uint256)
  handler: handleVRFRequested
- event: VRFFulfilled(uint256,indexed address,uint256)
  handler: handleVRFFulfilled
```

```typescript
// mapping.ts 新增
export function handleVRFRequested(event: VRFRequested): void {
    let user = User.load(event.params.user);
    if (user) {
        user.pendingVRFRequest = event.params.requestId;
        user.save();
    }
}
```

## 💰 成本分析

### Direct Funding 模式
```javascript
// 每次鑄造成本
const costs = {
    traditional: {
        commit: 0.001,  // BNB (~$0.3)
        reveal: 0.001,  // BNB (~$0.3)
        total: 0.6      // USD
    },
    vrf: {
        mint: 0.001,    // BNB (~$0.3)
        vrfFee: 0.005,  // BNB (~$1.5) Direct funding
        total: 1.8      // USD
    }
};

// 批量優化
const batchCosts = {
    single: 1.8,     // USD
    batch10: 2.5,    // USD (共享 VRF 成本)
    perNFT: 0.25     // USD
};
```

## 🚦 部署步驟

### 1. 測試網部署
```bash
# BSC Testnet
export NETWORK=bscTestnet
export VRF_COORDINATOR=0x6A2AAd07396B36Fe02a22b33cf443582f682c82f

npm run deploy:vrf:test
```

### 2. 主網部署
```bash
# BSC Mainnet
export NETWORK=bsc
export VRF_COORDINATOR=0xDA3b641406dC4436D054c5399eF5609a7F5115Bf

npm run deploy:vrf:mainnet
```

### 3. 驗證合約
```bash
npx hardhat verify --network bsc \
    0x... "Hero" "HERO" "0xDA3b641406dC4436D054c5399eF5609a7F5115Bf"
```

## 🔄 回滾計劃

如果 VRF 出現問題：
1. **立即**：啟用緊急揭示功能
2. **短期**：切換回傳統模式
3. **長期**：部署修復版本

```solidity
// 緊急開關
function disableVRF() external onlyOwner {
    vrfRequestPrice = 0; // 設為 0 禁用 VRF
}
```

## 📈 監控指標

```javascript
// 監控 VRF 性能
const metrics = {
    avgFulfillTime: 5,    // 秒
    successRate: 99.9,    // %
    gasUsed: 150000,      // per fulfillment
    linkCost: 0.2         // LINK per request
};
```

## ✅ 檢查清單

- [ ] 部署 VRF 版本合約
- [ ] 設置 VRF 參數
- [ ] 為合約充值（Direct Funding）
- [ ] 更新前端檢測邏輯
- [ ] 更新子圖事件處理
- [ ] 測試完整流程
- [ ] 準備回滾方案
- [ ] 監控首批交易

## 🎯 結論

**影響程度：低到中等**
- 前端：5% 代碼需要調整
- 子圖：10% 新增處理邏輯
- 用戶體驗：大幅提升
- 成本：略有增加但可接受

**建議**：先在測試網運行 1 週，收集數據後主網部署。
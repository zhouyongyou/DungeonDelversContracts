# 🔧 後端配置更新指南

**更新日期**: 2025-08-07  
**版本**: V25 修復版  

## 🎯 更新摘要

後端系統需要更新合約地址、ABI 檔案，並移除批次等級相關的 API 端點和功能。

## 🆕 新合約地址配置

### 1. 環境變數更新
```bash
# .env.production
HERO_CONTRACT_ADDRESS=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d
RELIC_CONTRACT_ADDRESS=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316
ALTAR_OF_ASCENSION_ADDRESS=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1

# 舊地址 (需要替換)
# HERO_CONTRACT_ADDRESS=0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0
# RELIC_CONTRACT_ADDRESS=0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366  
# ALTAR_OF_ASCENSION_ADDRESS=0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3

# 新部署區塊號 (用於事件監聽)
HERO_START_BLOCK=56949320
RELIC_START_BLOCK=56949323
ALTAR_START_BLOCK=56949326
```

### 2. 配置檔案更新
```javascript
// config/contracts.js
module.exports = {
  bsc: {
    addresses: {
      hero: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
      relic: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316", 
      altarOfAscension: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
      // 其他合約地址保持不變...
      dungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
      playerVault: "0x39523e8eeB6c54fCe65D62ec696cA5ad888eF25c",
      // ...
    },
    startBlocks: {
      hero: 56949320,
      relic: 56949323, 
      altar: 56949326,
    }
  }
};
```

```typescript
// config/contracts.ts (如果使用 TypeScript)
export interface ContractAddresses {
  hero: string;
  relic: string;
  altarOfAscension: string;
  // ...
}

export const CONTRACT_ADDRESSES: ContractAddresses = {
  hero: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
  relic: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316",
  altarOfAscension: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
  // ...
};
```

## 📁 需要更新的檔案類型

### 1. 配置檔案
```
├── config/
│   ├── contracts.js/.ts          # 主要合約配置
│   ├── addresses.js/.ts          # 地址常數
│   ├── constants.js/.ts          # 常數配置
│   └── blockchain.js/.ts         # 區塊鏈配置
├── .env.production               # 生產環境變數
├── .env.staging                  # 測試環境變數
└── docker-compose.yml            # Docker 環境變數
```

### 2. ABI 檔案
```
├── abi/
│   ├── Hero.json                 # 需要更新
│   ├── Relic.json                # 需要更新
│   └── AltarOfAscension.json     # 需要更新
├── contracts/
│   └── abi/
└── src/
    └── contracts/
        └── abi/
```

### 3. 服務和工具檔案
```
├── services/
│   ├── contractService.js/.ts   # 合約互動服務
│   ├── web3Service.js/.ts       # Web3 服務
│   └── eventListener.js/.ts     # 事件監聽器
├── utils/
│   ├── contract.js/.ts          # 合約工具
│   └── blockchain.js/.ts        # 區塊鏈工具
└── scripts/
    ├── deploy.js/.ts            # 部署腳本
    └── migrate.js/.ts           # 遷移腳本
```

## 🔍 搜尋和替換指令

### 批次搜尋需要更新的檔案
```bash
# 搜尋包含舊合約地址的檔案
grep -r "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0" . --include="*.js" --include="*.ts" --include="*.json"
grep -r "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366" . --include="*.js" --include="*.ts" --include="*.json"
grep -r "0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3" . --include="*.js" --include="*.ts" --include="*.json"

# 搜尋批次等級相關代碼
grep -r "BatchTier\|batchTier\|setBatchTier\|getBatchTier" . --include="*.js" --include="*.ts"
```

### 批次替換 (謹慎使用)
```bash
# 替換 Hero 地址
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" \) \
  -exec sed -i '' 's/0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0/0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d/g' {} +

# 替換 Relic 地址  
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" \) \
  -exec sed -i '' 's/0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366/0x7a9469587ffd28a69d4420d8893e7a0e92ef6316/g' {} +

# 替換 Altar 地址
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.json" \) \
  -exec sed -i '' 's/0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3/0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1/g' {} +
```

## 🗑️ 移除批次等級功能

### 1. API 端點移除
```javascript
// ❌ 需要移除這些 API 端點
// routes/batchTier.js
app.get('/api/batch-tiers', ...)           // 獲取批次等級
app.post('/api/batch-tiers', ...)          // 設置批次等級
app.get('/api/batch-tier/:tier', ...)      // 獲取特定批次等級
app.delete('/api/batch-tier/:tier', ...)   // 刪除批次等級

// ❌ 移除相關的控制器
// controllers/batchTierController.js 整個檔案可能需要刪除

// ❌ 移除相關的模型
// models/BatchTier.js 如果存在的話
```

### 2. 資料庫清理
```sql
-- ❌ 如果有批次等級相關的資料表，考慮移除或標記為廢棄
-- DROP TABLE IF EXISTS batch_tiers;
-- ALTER TABLE heroes DROP COLUMN batch_tier_id;
-- ALTER TABLE relics DROP COLUMN batch_tier_id;

-- ✅ 或者添加遷移腳本
-- migrations/remove_batch_tier_functionality.sql
```

### 3. 服務層清理
```javascript
// services/nftService.js
class NFTService {
  // ❌ 移除這些方法
  // async setBatchTier(tier, config) { ... }
  // async getBatchTier(tier) { ... }
  // async getBatchTierLimits(tier) { ... }
  
  // ✅ 保留並簡化這些方法
  async mintHero(user, quantity) {
    // 移除批次等級邏輯
    // 所有鑄造都使用 VRF，稀有度相同
  }
  
  async mintRelic(user, quantity) {
    // 移除批次等級邏輯
  }
}
```

## 🔄 ABI 檔案更新

### 下載新 ABI 的腳本
```bash
#!/bin/bash
# scripts/update-abis.sh

API_KEY="你的BSCScan API Key"
HERO_ADDRESS="0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d"
RELIC_ADDRESS="0x7a9469587ffd28a69d4420d8893e7a0e92ef6316"
ALTAR_ADDRESS="0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1"

# 下載 Hero ABI
curl -s "https://api.bscscan.com/api?module=contract&action=getabi&address=${HERO_ADDRESS}&apikey=${API_KEY}" \
  | jq -r '.result' > abi/Hero.json

# 下載 Relic ABI  
curl -s "https://api.bscscan.com/api?module=contract&action=getabi&address=${RELIC_ADDRESS}&apikey=${API_KEY}" \
  | jq -r '.result' > abi/Relic.json

# 下載 Altar ABI
curl -s "https://api.bscscan.com/api?module=contract&action=getabi&address=${ALTAR_ADDRESS}&apikey=${API_KEY}" \
  | jq -r '.result' > abi/AltarOfAscension.json

echo "✅ ABI 檔案更新完成"
```

## 📊 監控和日誌更新

### 1. 事件監聽器更新
```javascript
// services/eventListener.js
class EventListener {
  async startListening() {
    // 更新合約地址
    const heroContract = new web3.eth.Contract(
      HeroABI, 
      "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d"  // 新地址
    );
    
    const relicContract = new web3.eth.Contract(
      RelicABI,
      "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316"  // 新地址
    );
    
    // ❌ 移除批次等級事件監聽
    // heroContract.events.BatchTierSet(...)
    // relicContract.events.BatchTierSet(...)
    
    // ✅ 保留重要事件監聽
    heroContract.events.HeroMinted({ fromBlock: 56949320 }, ...);
    relicContract.events.RelicMinted({ fromBlock: 56949323 }, ...);
  }
}
```

### 2. 監控腳本更新
```javascript
// scripts/monitor.js
const CONTRACTS = {
  hero: {
    address: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
    startBlock: 56949320
  },
  relic: {
    address: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316", 
    startBlock: 56949323
  },
  altar: {
    address: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
    startBlock: 56949326
  }
};
```

## 🧪 測試更新

### 1. 單元測試
```javascript
// tests/contracts.test.js
describe('Contract Integration', () => {
  it('should use new contract addresses', () => {
    expect(config.contracts.hero).toBe("0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d");
    expect(config.contracts.relic).toBe("0x7a9469587ffd28a69d4420d8893e7a0e92ef6316");
  });
  
  // ❌ 移除批次等級相關測試
  // it('should handle batch tier configuration', () => { ... });
  
  // ✅ 添加 VRF 相關測試
  it('should handle VRF minting', () => { ... });
});
```

### 2. 整合測試
```javascript
// tests/integration/nft.test.js
describe('NFT Minting Integration', () => {
  it('should mint Hero NFT with new contract', async () => {
    const result = await nftService.mintHero(testUser, 1);
    expect(result).toBeDefined();
  });
  
  it('should mint Relic NFT with new contract', async () => {
    const result = await nftService.mintRelic(testUser, 1);
    expect(result).toBeDefined();
  });
});
```

## 🚀 部署流程

### 1. 準備階段
```bash
# 備份現有配置
cp -r config config.backup.$(date +%Y%m%d)

# 更新依賴
npm install

# 運行測試
npm test
```

### 2. 部署階段
```bash
# 更新 ABI 檔案
bash scripts/update-abis.sh

# 運行遷移腳本 (如需要)
npm run migrate

# 重新部署服務
docker-compose down
docker-compose up -d

# 或使用 PM2
pm2 restart all
```

### 3. 驗證階段
```bash
# 檢查服務狀態
curl http://localhost:3000/health

# 測試新合約互動
curl http://localhost:3000/api/contracts/hero/address

# 檢查日誌
tail -f logs/app.log
```

## 📋 檢查清單

### 配置更新
- [ ] 環境變數已更新
- [ ] 配置檔案已更新
- [ ] ABI 檔案已更新
- [ ] Docker 配置已更新

### 代碼更新  
- [ ] 合約地址已替換
- [ ] 批次等級代碼已移除
- [ ] API 端點已清理
- [ ] 測試已更新

### 部署驗證
- [ ] 服務正常啟動
- [ ] 新合約可以正常互動
- [ ] 事件監聽正常
- [ ] API 回應正常
- [ ] 日誌無錯誤

## 🔄 回滾計劃

如果需要回滾：

```bash
# 恢復配置檔案
cp -r config.backup.20250807/* config/

# 恢復舊的 ABI 檔案
git checkout HEAD~1 -- abi/

# 重新部署
docker-compose restart
```

---

**⚡ 立即行動項目:**
1. 🎯 更新所有合約地址配置
2. 🗑️ 移除批次等級相關 API 和代碼
3. 📥 更新 ABI 檔案  
4. 🔄 更新事件監聽器
5. 🧪 完整功能測試
6. 🚀 部署到生產環境

*後端更新完成後，將能與最新的優化合約正常互動！* ⚡
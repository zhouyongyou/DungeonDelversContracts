# 🏗️ DungeonDelvers 合約地址更新完整指南

## 📋 概覽

當智能合約需要重新部署時，需要同步更新所有相關專案中的合約地址。本指南涵蓋完整的更新流程，確保前端、子圖、後端 API 和配置文件的一致性。

## 🎯 更新範圍

### 核心專案路徑
```bash
# 主要專案
/Users/sotadic/Documents/DungeonDelversContracts/           # 智能合約
/Users/sotadic/Documents/GitHub/SoulboundSaga/              # React 前端
/Users/sotadic/Documents/dungeon-delvers-metadata-server/   # Node.js 後端
/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/   # The Graph 子圖
```

## 🔧 Step 1: 合約部署與地址獲取

### 1.1 部署新合約
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts

# 編譯合約
npm run compile

# 部署合約 (使用 0.11 gwei)
npx hardhat run scripts/deploy-[CONTRACT_NAME].js --network bsc

# 記錄新地址
echo "新合約地址已部署，請記錄以下地址："
```

### 1.2 驗證合約
```bash
# BSC 合約驗證
npx hardhat verify --network bsc [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
```

## 🗂️ Step 2: 更新配置管理中心

### 2.1 更新主配置文件
```bash
# 編輯合約配置文件
nano /Users/sotadic/Documents/DungeonDelversContracts/.env
```

```env
# === 核心合約地址 (BSC Mainnet) ===
HERO_CONTRACT_ADDRESS=0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b
RELIC_CONTRACT_ADDRESS=0x7a78a54010b0d201c026ef0f4a9456b464dfce11
PARTY_CONTRACT_ADDRESS=0xb393e482495bacde5aaf08d25323146cc5b9567f
DUNGEON_MASTER_ADDRESS=0xdbee76d1c6e94f93ceecf743a0a0132c57371254
ALTAR_OF_ASCENSION_ADDRESS=0x7f4b3d0ff2994182200fc3b306fb5b035680de3c
PLAYER_VAULT_ADDRESS=0xb8807c99ade19e4e2db5cf48650474f10ff874a3
DUNGEON_CORE_ADDRESS=0x2d234c24e6e8e1e4aa99e3c2e7a18e2a3a8b8a4f
PLAYER_PROFILE_ADDRESS=0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b
VIP_STAKING_ADDRESS=0x409d964675235a5a00f375053535fce9f6e79882

# === Token 合約 ===
SOUL_SHARD_TOKEN_ADDRESS=0x8a1fa5a8e15b5fe9e1e7cccdc2e9ac7b9e5a4d6c

# === 網路配置 ===
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
START_BLOCK=59911082

# === 部署配置 ===
DEPLOYER_PRIVATE_KEY=your_private_key_here
GAS_PRICE=0.11  # gwei (強制使用 0.11)
```

### 2.2 更新合約配置腳本
```bash
nano /Users/sotadic/Documents/DungeonDelversContracts/scripts/update-addresses.js
```

```javascript
// 自動同步地址到所有專案
const fs = require('fs');
const path = require('path');

const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/SoulboundSaga',
  subgraph: '/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server'
};

async function updateAllAddresses() {
  console.log('🚀 開始同步合約地址...');
  
  // 讀取主配置
  const envContent = fs.readFileSync('.env', 'utf8');
  const addresses = parseEnvAddresses(envContent);
  
  // 同步到各專案
  await updateFrontend(addresses);
  await updateSubgraph(addresses);
  await updateBackend(addresses);
  
  console.log('✅ 地址同步完成');
}

updateAllAddresses().catch(console.error);
```

## 🎮 Step 3: 更新前端專案 (SoulboundSaga)

### 3.1 更新前端配置
```bash
cd /Users/sotadic/Documents/GitHub/SoulboundSaga

# 編輯前端環境變數
nano .env
```

```env
# === BSC Mainnet 合約地址 ===
VITE_HERO_CONTRACT_ADDRESS=0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b
VITE_RELIC_CONTRACT_ADDRESS=0x7a78a54010b0d201c026ef0f4a9456b464dfce11
VITE_PARTY_CONTRACT_ADDRESS=0xb393e482495bacde5aaf08d25323146cc5b9567f
VITE_DUNGEON_MASTER_ADDRESS=0xdbee76d1c6e94f93ceecf743a0a0132c57371254
VITE_ALTAR_ADDRESS=0x7f4b3d0ff2994182200fc3b306fb5b035680de3c
VITE_PLAYER_VAULT_ADDRESS=0xb8807c99ade19e4e2db5cf48650474f10ff874a3
VITE_DUNGEON_CORE_ADDRESS=0x2d234c24e6e8e1e4aa99e3c2e7a18e2a3a8b8a4f
VITE_PLAYER_PROFILE_ADDRESS=0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b
VITE_VIP_STAKING_ADDRESS=0x409d964675235a5a00f375053535fce9f6e79882
VITE_SOUL_SHARD_TOKEN_ADDRESS=0x8a1fa5a8e15b5fe9e1e7cccdc2e9ac7b9e5a4d6c

# === 網路配置 ===
VITE_CHAIN_ID=56
VITE_RPC_URL=https://bsc-dataseed1.binance.org/
VITE_BLOCK_EXPLORER=https://bscscan.com
```

### 3.2 更新前端合約配置文件
```bash
nano src/config/contractsWithABI.ts
```

```typescript
// 合約地址配置
export const CONTRACT_ADDRESSES = {
  BSC: {
    HERO: '0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b',
    RELIC: '0x7a78a54010b0d201c026ef0f4a9456b464dfce11',
    PARTY: '0xb393e482495bacde5aaf08d25323146cc5b9567f',
    DUNGEON_MASTER: '0xdbee76d1c6e94f93ceecf743a0a0132c57371254',
    ALTAR_OF_ASCENSION: '0x7f4b3d0ff2994182200fc3b306fb5b035680de3c',
    PLAYER_VAULT: '0xb8807c99ade19e4e2db5cf48650474f10ff874a3',
    DUNGEON_CORE: '0x2d234c24e6e8e1e4aa99e3c2e7a18e2a3a8b8a4f',
    PLAYER_PROFILE: '0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b',
    VIP_STAKING: '0x409d964675235a5a00f375053535fce9f6e79882',
    SOUL_SHARD: '0x8a1fa5a8e15b5fe9e1e7cccdc2e9ac7b9e5a4d6c'
  }
} as const;
```

### 3.3 更新 ABI 文件
```bash
# 複製最新 ABI 到前端
cp /Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts/current/nft/Hero.sol/Hero.json \
   /Users/sotadic/Documents/GitHub/SoulboundSaga/src/contracts/abi/Hero.json

cp /Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts/current/defi/PlayerVault.sol/PlayerVault.json \
   /Users/sotadic/Documents/GitHub/SoulboundSaga/src/contracts/abi/PlayerVault.json

# ... 重複所有需要更新的合約
```

## 📊 Step 4: 更新子圖 (The Graph)

### 4.1 更新子圖配置
```bash
cd /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph

nano subgraph.yaml
```

```yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b"  # 🔄 更新地址
      abi: Hero
      startBlock: 59911082  # 🔄 更新起始區塊
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Hero
      abis:
        - name: Hero
          file: ./abis/Hero.json
      eventHandlers:
        - event: HeroMinted(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroMinted
      file: ./src/hero.ts

  - kind: ethereum/contract
    name: PlayerVault
    network: bsc
    source:
      address: "0xb8807c99ade19e4e2db5cf48650474f10ff874a3"  # 🔄 更新地址
      abi: PlayerVault
      startBlock: 59911082  # 🔄 更新起始區塊
    mapping:
      # ... 事件處理配置
```

### 4.2 更新子圖 ABI
```bash
# 複製最新 ABI 到子圖
cp /Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts/current/defi/PlayerVault.sol/PlayerVault.json \
   ./abis/PlayerVault.json
```

### 4.3 重新部署子圖
```bash
# 生成代碼
npm run codegen

# 構建子圖
npm run build

# 部署到 The Graph Studio
graph deploy --studio dungeon-delvers-subgraph
```

## 🔧 Step 5: 更新後端 API

### 5.1 更新後端配置
```bash
cd /Users/sotadic/Documents/dungeon-delvers-metadata-server

nano .env
```

```env
# === 合約地址配置 ===
HERO_CONTRACT=0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b
RELIC_CONTRACT=0x7a78a54010b0d201c026ef0f4a9456b464dfce11
PARTY_CONTRACT=0xb393e482495bacde5aaf08d25323146cc5b9567f
DUNGEON_MASTER_CONTRACT=0xdbee76d1c6e94f93ceecf743a0a0132c57371254
PLAYER_VAULT_CONTRACT=0xb8807c99ade19e4e2db5cf48650474f10ff874a3

# === 網路配置 ===
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
CHAIN_ID=56
```

### 5.2 更新合約 ABI
```bash
# 創建 ABI 目錄
mkdir -p contracts/abi

# 複製 ABI 文件
cp /Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts/current/nft/Hero.sol/Hero.json \
   ./contracts/abi/Hero.json
```

## 📋 Step 6: 驗證更新

### 6.1 驗證檢查清單
```bash
# 🔍 驗證腳本
#!/bin/bash

echo "🔍 開始驗證合約地址更新..."

# 檢查前端配置
echo "📱 檢查前端配置..."
grep -H "VITE_HERO_CONTRACT_ADDRESS" /Users/sotadic/Documents/GitHub/SoulboundSaga/.env

# 檢查子圖配置
echo "📊 檢查子圖配置..."
grep -H "address:" /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/subgraph.yaml

# 檢查後端配置
echo "🔧 檢查後端配置..."
grep -H "HERO_CONTRACT" /Users/sotadic/Documents/dungeon-delvers-metadata-server/.env

echo "✅ 驗證完成"
```

### 6.2 功能測試
```bash
# 前端測試
cd /Users/sotadic/Documents/GitHub/SoulboundSaga
npm run dev  # 檢查是否正常啟動

# 後端測試  
cd /Users/sotadic/Documents/dungeon-delvers-metadata-server
npm run start  # 檢查 API 連接

# 子圖測試
cd /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph
npm run build  # 檢查構建是否成功
```

## ⚠️ 重要注意事項

### 🚨 Gas Price 強制規範
```bash
# 所有部署腳本必須使用 0.11 gwei
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

# 檢查腳本
grep -r "parseUnits.*gwei" scripts/ | grep -v "0\.11"  # 應該無結果
```

### 🔒 安全檢查
```bash
# 私鑰安全掃描
grep -r "0x[0-9a-fA-F]\{64\}" . --exclude-dir=node_modules --exclude="*.log"

# 環境變數檢查
grep -r "PRIVATE_KEY.*=" . --exclude-dir=node_modules
```

### 📦 部署順序
1. **合約部署** → 獲取新地址
2. **配置更新** → 更新所有配置文件  
3. **ABI 同步** → 複製最新 ABI
4. **子圖部署** → 重新部署索引
5. **前端部署** → 更新前端應用
6. **後端重啟** → 重啟 API 服務
7. **功能測試** → 全面功能驗證

## 🔄 自動化腳本

### 完整更新腳本
```bash
#!/bin/bash
# update-all-addresses.sh

set -e

CONTRACT_NAME=$1
NEW_ADDRESS=$2

if [ -z "$CONTRACT_NAME" ] || [ -z "$NEW_ADDRESS" ]; then
  echo "使用方法: ./update-all-addresses.sh CONTRACT_NAME NEW_ADDRESS"
  exit 1
fi

echo "🚀 開始更新 $CONTRACT_NAME 地址為 $NEW_ADDRESS"

# 1. 更新合約配置
echo "📝 更新合約配置..."
sed -i '' "s/${CONTRACT_NAME}_ADDRESS=.*/${CONTRACT_NAME}_ADDRESS=$NEW_ADDRESS/" \
  /Users/sotadic/Documents/DungeonDelversContracts/.env

# 2. 更新前端配置
echo "📱 更新前端配置..."
sed -i '' "s/VITE_${CONTRACT_NAME}_ADDRESS=.*/VITE_${CONTRACT_NAME}_ADDRESS=$NEW_ADDRESS/" \
  /Users/sotadic/Documents/GitHub/SoulboundSaga/.env

# 3. 更新子圖配置
echo "📊 更新子圖配置..."
sed -i '' "s/address: \".*\" # $CONTRACT_NAME/address: \"$NEW_ADDRESS\" # $CONTRACT_NAME/" \
  /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/subgraph.yaml

# 4. 更新後端配置
echo "🔧 更新後端配置..."
sed -i '' "s/${CONTRACT_NAME}_CONTRACT=.*/${CONTRACT_NAME}_CONTRACT=$NEW_ADDRESS/" \
  /Users/sotadic/Documents/dungeon-delvers-metadata-server/.env

echo "✅ 地址更新完成，請手動驗證並重新部署各服務"
```

---

## 📚 附錄：常用命令

### 快速命令參考
```bash
# 編譯所有合約
npm run compile

# 驗證合約
npx hardhat verify --network bsc ADDRESS ARGS

# 部署子圖
graph deploy --studio dungeon-delvers-subgraph

# 前端構建
npm run build

# 檢查地址配置
grep -r "0x[0-9a-fA-F]\{40\}" .env

# 檢查 gas price 設置  
grep -r "parseUnits.*gwei" scripts/
```

### 緊急回滾
如果新合約有問題，使用此腳本快速回滾：
```bash
# rollback-addresses.sh
git checkout HEAD~1 -- .env
git checkout HEAD~1 -- /Users/sotadic/Documents/GitHub/SoulboundSaga/.env
git checkout HEAD~1 -- /Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/subgraph.yaml
```

---

**⚠️ 重要提醒**：每次地址更新後，務必在測試環境完整驗證所有功能後再更新生產環境。

**🔗 相關文檔**：
- [Hardhat 部署指南](https://hardhat.org/guides/deploying.html)
- [The Graph 子圖部署](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-studio/)
- [BSC 網路配置](https://docs.binance.org/smart-chain/developer/rpc.html)
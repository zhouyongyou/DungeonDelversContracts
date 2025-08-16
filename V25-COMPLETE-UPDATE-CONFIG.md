# 🚀 DungeonDelvers V25 完整系統更新配置

**更新時間**: 2025-08-07 AM 7  
**版本**: V25  
**起始區塊**: 56696666  

## 🆕 V25 新合約地址 (全量)

```javascript
// V25 完整合約地址配置
const V25_ADDRESSES = {
  // 🆕 新部署的合約
  DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEONMASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253", 
  HERO: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
  RELIC: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316",
  ALTAROFASCENSION: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",

  // 🔄 重複使用的合約 (需要重新設置連接)
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787", 
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",

  // 📌 固定使用的合約
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  USD_TOKEN: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE", 
  UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
  VRF_MANAGER_V2PLUS: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
};

// 統一起始區塊
const V25_START_BLOCK = 56696666;
```

## 📊 子圖更新配置 (v3.7.7)

### subgraph.yaml 完整配置
```yaml
specVersion: 0.0.5
description: DungeonDelvers V25
repository: https://github.com/your-repo/dungeon-delvers-subgraph
schema:
  file: ./schema.graphql

dataSources:
  # DungeonCore - 核心合約
  - kind: ethereum/contract
    name: DungeonCore
    network: bsc
    source:
      address: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13"
      abi: DungeonCore
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - DungeonCore
      abis:
        - name: DungeonCore
          file: ./abis/DungeonCore.json
      eventHandlers:
        - event: OwnershipTransferred(indexed address,indexed address)
          handler: handleOwnershipTransferred
      file: ./src/dungeon-core.ts

  # DungeonStorage - 地城數據存儲
  - kind: ethereum/contract
    name: DungeonStorage
    network: bsc
    source:
      address: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468"
      abi: DungeonStorage
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Dungeon
        - PartyStatus
      abis:
        - name: DungeonStorage
          file: ./abis/DungeonStorage.json
      eventHandlers:
        - event: DungeonUpdated(indexed uint256,uint256,uint256,uint8)
          handler: handleDungeonUpdated
      file: ./src/dungeon-storage.ts

  # DungeonMaster - 地城探索
  - kind: ethereum/contract
    name: DungeonMaster
    network: bsc
    source:
      address: "0xE391261741Fad5FCC2D298d00e8c684767021253"
      abi: DungeonMaster
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Expedition
        - ExpeditionResult
      abis:
        - name: DungeonMaster
          file: ./abis/DungeonMaster.json
      eventHandlers:
        - event: ExpeditionFulfilled(indexed address,indexed uint256,bool,uint256,uint256)
          handler: handleExpeditionFulfilled
        - event: ExpeditionCommitted(indexed address,uint256,uint256,uint256)
          handler: handleExpeditionCommitted
      file: ./src/dungeon-master.ts

  # Hero NFT
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d"
      abi: Hero
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Hero
        - HeroMinted
        - MintCommitment
      abis:
        - name: Hero
          file: ./abis/Hero.json
      eventHandlers:
        - event: HeroMinted(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroMinted
        - event: MintCommitted(indexed address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: HeroRevealed(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroRevealed
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
      file: ./src/hero.ts

  # Relic NFT  
  - kind: ethereum/contract
    name: Relic
    network: bsc
    source:
      address: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316"
      abi: Relic
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Relic
        - RelicMinted
        - MintCommitment
      abis:
        - name: Relic
          file: ./abis/Relic.json
      eventHandlers:
        - event: RelicMinted(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicMinted
        - event: MintCommitted(indexed address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: RelicRevealed(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicRevealed
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
      file: ./src/relic.ts

  # Party NFT
  - kind: ethereum/contract
    name: Party
    network: bsc
    source:
      address: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3"
      abi: Party
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Party
        - PartyComposition
      abis:
        - name: Party
          file: ./abis/Party.json
      eventHandlers:
        - event: PartyCreated(indexed uint256,indexed address,uint256[],uint256[])
          handler: handlePartyCreated
        - event: PartyUpdated(indexed uint256,uint256[],uint256[])
          handler: handlePartyUpdated
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
      file: ./src/party.ts

  # AltarOfAscension - 升星系統
  - kind: ethereum/contract
    name: AltarOfAscension
    network: bsc
    source:
      address: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1"
      abi: AltarOfAscension
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - UpgradeAttempt
        - UpgradeCommitment
      abis:
        - name: AltarOfAscension
          file: ./abis/AltarOfAscension.json
      eventHandlers:
        - event: UpgradeAttempted(indexed address,indexed address,uint8,uint8,uint256[],uint256[],uint8,uint256,uint8,uint8)
          handler: handleUpgradeAttempted
        - event: UpgradeCommitted(indexed address,address,uint8,uint256,uint256[])
          handler: handleUpgradeCommitted
      file: ./src/altar.ts

  # PlayerVault - 玩家金庫
  - kind: ethereum/contract
    name: PlayerVault
    network: bsc
    source:
      address: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787"
      abi: PlayerVault
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - PlayerVault
        - Deposit
        - Withdraw
      abis:
        - name: PlayerVault
          file: ./abis/PlayerVault.json
      eventHandlers:
        - event: Deposited(indexed address,uint256)
          handler: handleDeposited
        - event: Withdrawn(indexed address,uint256)
          handler: handleWithdrawn
      file: ./src/player-vault.ts

  # VIPStaking - VIP 質押
  - kind: ethereum/contract
    name: VIPStaking
    network: bsc
    source:
      address: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C"
      abi: VIPStaking
      startBlock: 56696666
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - VIPStaking
        - Stake
        - Unstake
      abis:
        - name: VIPStaking
          file: ./abis/VIPStaking.json
      eventHandlers:
        - event: Staked(indexed address,uint256,uint8)
          handler: handleStaked
        - event: Unstaked(indexed address,uint256)
          handler: handleUnstaked
      file: ./src/vip-staking.ts
```

## 🎨 前端配置更新

### 1. 主配置檔案
```javascript
// src/config/contracts.js
export const CONTRACT_ADDRESSES = {
  // Core contracts
  DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEONMASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253",
  
  // NFT contracts
  HERO: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
  RELIC: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  
  // Game mechanics
  ALTAROFASCENSION: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
  PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  
  // Infrastructure
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  USD_TOKEN: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
  UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
  VRF_MANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
};

export const BLOCK_NUMBERS = {
  V25_START_BLOCK: 56696666
};
```

### 2. 環境變數檔案
```bash
# .env.production
REACT_APP_VERSION=V25
REACT_APP_START_BLOCK=56696666

# Core Contracts
REACT_APP_DUNGEONCORE_ADDRESS=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
REACT_APP_DUNGEONSTORAGE_ADDRESS=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
REACT_APP_DUNGEONMASTER_ADDRESS=0xE391261741Fad5FCC2D298d00e8c684767021253

# NFT Contracts
REACT_APP_HERO_ADDRESS=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d
REACT_APP_RELIC_ADDRESS=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316
REACT_APP_PARTY_ADDRESS=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3

# Game Mechanics
REACT_APP_ALTAR_ADDRESS=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1
REACT_APP_PLAYERVAULT_ADDRESS=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
REACT_APP_PLAYERPROFILE_ADDRESS=0x0f5932e89908400a5AfDC306899A2987b67a3155
REACT_APP_VIPSTAKING_ADDRESS=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C

# Infrastructure  
REACT_APP_ORACLE_ADDRESS=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a
REACT_APP_SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
REACT_APP_USD_ADDRESS=0x7C67Af4EBC6651c95dD688c35d381062263E25a
REACT_APP_VRF_ADDRESS=0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1
```

## 🔧 後端配置更新

### 1. 環境變數配置
```bash
# .env.production
NODE_ENV=production
VERSION=V25
START_BLOCK=56696666

# Core Contracts
DUNGEONCORE_ADDRESS=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
DUNGEONSTORAGE_ADDRESS=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
DUNGEONMASTER_ADDRESS=0xE391261741Fad5FCC2D298d00e8c684767021253

# NFT Contracts
HERO_CONTRACT_ADDRESS=0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d
RELIC_CONTRACT_ADDRESS=0x7a9469587ffd28a69d4420d8893e7a0e92ef6316
PARTY_CONTRACT_ADDRESS=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3

# Game Mechanics
ALTAR_OF_ASCENSION_ADDRESS=0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1
PLAYER_VAULT_ADDRESS=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
PLAYER_PROFILE_ADDRESS=0x0f5932e89908400a5AfDC306899A2987b67a3155
VIP_STAKING_ADDRESS=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C

# Infrastructure
ORACLE_ADDRESS=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a
SOUL_SHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
USD_TOKEN_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VRF_MANAGER_ADDRESS=0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1

# Network Config
BSC_RPC_URL=https://bsc-dataseed.binance.org/
CHAIN_ID=56
```

### 2. 後端服務配置
```javascript
// config/contracts.js
module.exports = {
  bsc: {
    addresses: {
      // Core contracts
      dungeonCore: process.env.DUNGEONCORE_ADDRESS,
      dungeonStorage: process.env.DUNGEONSTORAGE_ADDRESS, 
      dungeonMaster: process.env.DUNGEONMASTER_ADDRESS,
      
      // NFT contracts
      hero: process.env.HERO_CONTRACT_ADDRESS,
      relic: process.env.RELIC_CONTRACT_ADDRESS,
      party: process.env.PARTY_CONTRACT_ADDRESS,
      
      // Game mechanics
      altarOfAscension: process.env.ALTAR_OF_ASCENSION_ADDRESS,
      playerVault: process.env.PLAYER_VAULT_ADDRESS,
      playerProfile: process.env.PLAYER_PROFILE_ADDRESS,
      vipStaking: process.env.VIP_STAKING_ADDRESS,
      
      // Infrastructure
      oracle: process.env.ORACLE_ADDRESS,
      soulShard: process.env.SOUL_SHARD_ADDRESS,
      usdToken: process.env.USD_TOKEN_ADDRESS,
      vrfManager: process.env.VRF_MANAGER_ADDRESS
    },
    startBlock: parseInt(process.env.START_BLOCK || '56696666'),
    rpcUrl: process.env.BSC_RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID || '56')
  }
};
```

### 3. 事件監聽器配置
```javascript
// services/eventListener.js
const { Web3 } = require('web3');
const contractsConfig = require('../config/contracts');

class EventListener {
  constructor() {
    this.web3 = new Web3(contractsConfig.bsc.rpcUrl);
    this.contracts = {};
    this.initializeContracts();
  }

  initializeContracts() {
    const { addresses, startBlock } = contractsConfig.bsc;
    
    // 初始化所有合約
    this.contracts = {
      hero: new this.web3.eth.Contract(require('../abi/Hero.json'), addresses.hero),
      relic: new this.web3.eth.Contract(require('../abi/Relic.json'), addresses.relic),
      party: new this.web3.eth.Contract(require('../abi/Party.json'), addresses.party),
      dungeonMaster: new this.web3.eth.Contract(require('../abi/DungeonMaster.json'), addresses.dungeonMaster),
      altar: new this.web3.eth.Contract(require('../abi/AltarOfAscension.json'), addresses.altarOfAscension),
      playerVault: new this.web3.eth.Contract(require('../abi/PlayerVault.json'), addresses.playerVault),
      vipStaking: new this.web3.eth.Contract(require('../abi/VIPStaking.json'), addresses.vipStaking)
    };

    this.startBlock = startBlock;
  }

  async startListening() {
    console.log(`🎧 開始監聽事件 (從區塊 ${this.startBlock})`);
    
    // Hero events
    this.contracts.hero.events.HeroMinted({ fromBlock: this.startBlock })
      .on('data', this.handleHeroMinted.bind(this));
    
    // Relic events
    this.contracts.relic.events.RelicMinted({ fromBlock: this.startBlock })
      .on('data', this.handleRelicMinted.bind(this));
    
    // Party events
    this.contracts.party.events.PartyCreated({ fromBlock: this.startBlock })
      .on('data', this.handlePartyCreated.bind(this));
    
    // DungeonMaster events
    this.contracts.dungeonMaster.events.ExpeditionFulfilled({ fromBlock: this.startBlock })
      .on('data', this.handleExpeditionFulfilled.bind(this));
    
    // Altar events
    this.contracts.altar.events.UpgradeAttempted({ fromBlock: this.startBlock })
      .on('data', this.handleUpgradeAttempted.bind(this));
  }

  // 事件處理方法...
  handleHeroMinted(event) {
    console.log('🦸 Hero 鑄造:', event.returnValues);
    // 處理邏輯...
  }

  handleRelicMinted(event) {
    console.log('⚡ Relic 鑄造:', event.returnValues);
    // 處理邏輯...
  }

  // 其他事件處理方法...
}

module.exports = EventListener;
```

## 🚀 快速部署腳本

### 子圖部署
```bash
#!/bin/bash
# scripts/deploy-subgraph-v25.sh

echo "🚀 部署 DungeonDelvers V25 子圖..."

# 清理舊文件
rm -rf generated/

# 更新 ABI 檔案
echo "📥 下載最新 ABI 檔案..."
# 這裡需要從 BSCScan 下載或從合約項目複製

# 生成代碼
echo "🔨 生成代碼..."
graph codegen

# 構建
echo "🔧 構建子圖..."
graph build

# 部署
echo "🚀 部署到 The Graph..."
graph deploy --studio dungeon-delvers-v25

echo "✅ 子圖部署完成！"
```

### 前端部署
```bash
#!/bin/bash
# scripts/deploy-frontend-v25.sh

echo "🎨 部署前端 V25..."

# 安裝依賴
npm install

# 構建
echo "🔧 構建前端..."
npm run build

# 部署 (根據你的部署方式調整)
echo "🚀 部署到服務器..."
# npm run deploy 或其他部署指令

echo "✅ 前端部署完成！"
```

### 後端部署
```bash
#!/bin/bash
# scripts/deploy-backend-v25.sh

echo "🔧 部署後端 V25..."

# 停止舊服務
echo "🛑 停止舊服務..."
pm2 stop all || true

# 安裝依賴
npm install

# 更新環境變數
echo "📝 更新環境變數..."
# cp .env.v25 .env.production

# 重新啟動服務
echo "🚀 啟動服務..."
pm2 start ecosystem.config.js --env production

echo "✅ 後端部署完成！"
```

## 📋 部署檢查清單

### 子圖 (v3.7.7)
- [ ] subgraph.yaml 更新所有合約地址
- [ ] 起始區塊設置為 56696666
- [ ] ABI 檔案更新到最新版本
- [ ] 移除批次等級相關代碼
- [ ] 部署到 The Graph

### 前端
- [ ] 所有合約地址更新
- [ ] 環境變數配置更新
- [ ] ABI 檔案更新
- [ ] 移除批次等級 UI 組件
- [ ] 構建和部署

### 後端  
- [ ] 環境變數配置更新
- [ ] 合約配置檔案更新
- [ ] ABI 檔案更新
- [ ] 事件監聽器更新
- [ ] API 端點清理
- [ ] 服務重新啟動

---

**⚡ 立即執行順序:**
1. 🚀 **子圖部署** (第一優先，數據索引需要時間)
2. 🔧 **後端部署** (第二優先，API 服務需要正常)  
3. 🎨 **前端部署** (第三優先，用戶界面更新)

所有系統都使用統一的 V25 配置和起始區塊 56696666，確保數據同步一致！🎯
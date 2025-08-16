const fs = require('fs');
const path = require('path');

console.log("🚀 V25 VRF 系統完整更新\n");

// V25 VRF 合約地址
const VRF_CONTRACTS = {
    Hero: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    Relic: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    DungeonMaster: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    AltarOfAscension: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    Party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    DungeonStorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    
    // 複用的合約
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PlayerVault: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PlayerProfile: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPStaking: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    Oracle: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    
    // 固定合約
    VRFManager: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
    SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    UniswapPool: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
};

// 1. 修正子圖 YAML 的 VRF 事件格式
function fixSubgraphYaml() {
    console.log("📊 修正子圖 VRF 事件格式...");
    
    const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
    let content = fs.readFileSync(subgraphPath, 'utf8');
    
    // 修正錯誤的縮排格式
    content = content.replace(/\s+-\s+event:\s+VRFManagerSet\(indexed address\)/g, 
        '        - event: VRFManagerSet(indexed address)');
    
    // 確保正確的 YAML 結構
    const correctYaml = `# Generated from V25 VRF update on ${new Date().toISOString()}
# V25 Production Deployment - VRF Enabled
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "${VRF_CONTRACTS.Hero}"
      abi: Hero
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Hero
        - Transfer
      abis:
        - name: Hero
          file: ./abis/Hero.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
        - event: HeroMinted(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroMinted
        - event: BatchMintCompleted(indexed address,uint256,uint8,uint256[])
          handler: handleBatchMintCompleted
        - event: HeroBurned(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroBurned
        - event: MintCommitted(indexed address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: HeroRevealed(indexed uint256,indexed address,uint8,uint256)
          handler: handleHeroRevealed
        - event: ForcedRevealExecuted(indexed address,indexed address,uint256)
          handler: handleForcedRevealExecuted
        - event: RevealedByProxy(indexed address,indexed address)
          handler: handleRevealedByProxy
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
      file: ./src/hero.ts
  - kind: ethereum/contract
    name: Relic
    network: bsc
    source:
      address: "${VRF_CONTRACTS.Relic}"
      abi: Relic
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Relic
        - Transfer
      abis:
        - name: Relic
          file: ./abis/Relic.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
        - event: RelicMinted(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicMinted
        - event: BatchMintCompleted(indexed address,uint256,uint8,uint256[])
          handler: handleBatchMintCompleted
        - event: RelicBurned(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicBurned
        - event: MintCommitted(indexed address,uint256,uint256,bool)
          handler: handleMintCommitted
        - event: RelicRevealed(indexed uint256,indexed address,uint8,uint8)
          handler: handleRelicRevealed
        - event: ForcedRevealExecuted(indexed address,indexed address,uint256)
          handler: handleForcedRevealExecuted
        - event: RevealedByProxy(indexed address,indexed address)
          handler: handleRevealedByProxy
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
      file: ./src/relic.ts
  - kind: ethereum/contract
    name: Party
    network: bsc
    source:
      address: "${VRF_CONTRACTS.Party}"
      abi: Party
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Party
        - Transfer
      abis:
        - name: Party
          file: ./abis/Party.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
        - event: PartyCreated(indexed uint256,indexed address,uint256[],uint256[],uint256,uint256,uint8)
          handler: handlePartyCreated
        - event: PartyMemberChanged(indexed uint256,uint256[],uint256[])
          handler: handlePartyMemberChanged
      file: ./src/party.ts
  - kind: ethereum/contract
    name: VIPStaking
    network: bsc
    source:
      address: "${VRF_CONTRACTS.VIPStaking}"
      abi: VIPStaking
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - VIP
        - Transfer
      abis:
        - name: VIPStaking
          file: ./abis/VIPStaking.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
        - event: Staked(indexed address,uint256,uint256)
          handler: handleStaked
        - event: UnstakeRequested(indexed address,uint256,uint256)
          handler: handleUnstakeRequested
        - event: UnstakeClaimed(indexed address,uint256)
          handler: handleUnstakeClaimed
      file: ./src/vip-staking.ts
  - kind: ethereum/contract
    name: PlayerProfile
    network: bsc
    source:
      address: "${VRF_CONTRACTS.PlayerProfile}"
      abi: PlayerProfile
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - PlayerProfile
        - Transfer
      abis:
        - name: PlayerProfile
          file: ./abis/PlayerProfile.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
        - event: ProfileCreated(indexed address,indexed uint256)
          handler: handleProfileCreated
        - event: ExperienceAdded(indexed address,indexed uint256,uint256,uint256)
          handler: handleExperienceAdded
      file: ./src/player-profile.ts
  - kind: ethereum/contract
    name: DungeonMaster
    network: bsc
    source:
      address: "${VRF_CONTRACTS.DungeonMaster}"
      abi: DungeonMaster
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - DungeonExploration
        - Player
      abis:
        - name: DungeonMaster
          file: ./abis/DungeonMaster.json
      eventHandlers:
        - event: ExpeditionFulfilled(indexed address,indexed uint256,bool,uint256,uint256)
          handler: handleExpeditionFulfilled
        - event: ExpeditionCommitted(indexed address,uint256,uint256,uint256)
          handler: handleExpeditionCommitted
        - event: ExpeditionRevealed(indexed address,uint256,bool)
          handler: handleExpeditionRevealed
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
        - event: ForcedRevealExecuted(indexed address,indexed address)
          handler: handleForcedRevealExecuted
        - event: RevealedByProxy(indexed address,indexed address)
          handler: handleRevealedByProxy
      file: ./src/dungeon-master.ts
  - kind: ethereum/contract
    name: PlayerVault
    network: bsc
    source:
      address: "${VRF_CONTRACTS.PlayerVault}"
      abi: PlayerVault
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - PlayerVault
        - Player
      abis:
        - name: PlayerVault
          file: ./abis/PlayerVault.json
      eventHandlers:
        - event: Deposited(indexed address,uint256)
          handler: handleDeposited
        - event: Withdrawn(indexed address,uint256,uint256)
          handler: handleWithdrawn
        - event: CommissionPaid(indexed address,indexed address,uint256)
          handler: handleCommissionPaid
        - event: VirtualGameSpending(indexed address,indexed address,uint256)
          handler: handleVirtualGameSpending
        - event: VirtualCommissionAdded(indexed address,uint256)
          handler: handleVirtualCommissionAdded
        - event: VirtualTaxCollected(uint256)
          handler: handleVirtualTaxCollected
        - event: ReferralSet(indexed address,indexed address)
          handler: handleReferralSet
      file: ./src/player-vault.ts
  - kind: ethereum/contract
    name: AltarOfAscension
    network: bsc
    source:
      address: "${VRF_CONTRACTS.AltarOfAscension}"
      abi: AltarOfAscension
      startBlock: 56631513
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - UpgradeAttempt
      abis:
        - name: AltarOfAscension
          file: ./abis/AltarOfAscension.json
      eventHandlers:
        - event: UpgradeAttempted(indexed address,indexed address,uint8,uint8,uint256[],uint256[],uint8,uint256,uint8,uint8)
          handler: handleUpgradeAttempted
        - event: UpgradeCommitted(indexed address,address,uint8,uint256,uint256[])
          handler: handleUpgradeCommitted
        - event: UpgradeRevealed(indexed address,uint8,uint8)
          handler: handleUpgradeRevealed
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
        - event: UpgradeRequested(indexed address,uint256[],uint256,uint256)
          handler: handleUpgradeRequested
        - event: ForcedRevealExecuted(indexed address,indexed address,uint8)
          handler: handleForcedRevealExecuted
      file: ./src/altar-of-ascension.ts`;
    
    fs.writeFileSync(subgraphPath, correctYaml);
    console.log("✅ 子圖 YAML 已修正並更新");
}

// 2. 更新前端配置
function updateFrontend() {
    console.log("\n🎨 更新前端配置...");
    
    const contractsPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
    
    const contractsContent = `// Generated from V25 VRF update on ${new Date().toISOString()}
// V25 Production Deployment - VRF Enabled

export const CONTRACTS = {
  // VRF Updated NFT Contracts
  Hero: '${VRF_CONTRACTS.Hero}',
  Relic: '${VRF_CONTRACTS.Relic}',
  Party: '${VRF_CONTRACTS.Party}',
  
  // VRF Updated Core Contracts  
  DungeonCore: '${VRF_CONTRACTS.DungeonCore}',
  DungeonMaster: '${VRF_CONTRACTS.DungeonMaster}',
  DungeonStorage: '${VRF_CONTRACTS.DungeonStorage}',
  AltarOfAscension: '${VRF_CONTRACTS.AltarOfAscension}',
  
  // VRF System
  VRFManager: '${VRF_CONTRACTS.VRFManager}',
  
  // DeFi Contracts
  Oracle: '${VRF_CONTRACTS.Oracle}',
  SoulShard: '${VRF_CONTRACTS.SoulShard}',
  USD: '${VRF_CONTRACTS.USD}',
  UniswapPool: '${VRF_CONTRACTS.UniswapPool}',
  
  // Player Contracts
  PlayerVault: '${VRF_CONTRACTS.PlayerVault}',
  PlayerProfile: '${VRF_CONTRACTS.PlayerProfile}',
  VIPStaking: '${VRF_CONTRACTS.VIPStaking}',
} as const;

// VRF Configuration
export const VRF_CONFIG = {
  enabled: true,
  requestPrice: '0.005', // BNB
  platformFee: '0.0003', // BNB per NFT
  revealBlockDelay: 3,
  maxRevealWindow: 255,
};

// Helper function to calculate mint fees
export function calculateMintFee(quantity: number): {
  platformFee: string;
  vrfFee: string;
  total: string;
} {
  const platformFeeWei = BigInt(Math.floor(parseFloat(VRF_CONFIG.platformFee) * 1e18)) * BigInt(quantity);
  const vrfFeeWei = VRF_CONFIG.enabled ? BigInt(Math.floor(parseFloat(VRF_CONFIG.requestPrice) * 1e18)) : BigInt(0);
  const totalWei = platformFeeWei + vrfFeeWei;
  
  return {
    platformFee: (platformFeeWei / BigInt(1e18)).toString() + '.' + (platformFeeWei % BigInt(1e18)).toString().padStart(18, '0').slice(0, 4),
    vrfFee: (vrfFeeWei / BigInt(1e18)).toString() + '.' + (vrfFeeWei % BigInt(1e18)).toString().padStart(18, '0').slice(0, 4),
    total: (totalWei / BigInt(1e18)).toString() + '.' + (totalWei % BigInt(1e18)).toString().padStart(18, '0').slice(0, 4)
  };
}

// Export for type safety
export type ContractName = keyof typeof CONTRACTS;
export type ContractAddress = typeof CONTRACTS[ContractName];`;
    
    fs.writeFileSync(contractsPath, contractsContent);
    console.log("✅ 前端 contracts.ts 已更新");
    
    // 更新環境變數
    const envPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env';
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // 更新或添加 VRF 相關環境變數
        const vrfEnvs = [
            'VITE_VRF_ENABLED=true',
            `VITE_VRF_MANAGER_ADDRESS=${VRF_CONTRACTS.VRFManager}`,
            'VITE_VRF_REQUEST_PRICE=0.005',
            'VITE_PLATFORM_FEE=0.0003'
        ];
        
        vrfEnvs.forEach(env => {
            const key = env.split('=')[0];
            if (envContent.includes(key)) {
                envContent = envContent.replace(new RegExp(`${key}=.*`, 'g'), env);
            } else {
                envContent += `\n${env}`;
            }
        });
        
        fs.writeFileSync(envPath, envContent);
        console.log("✅ 前端 .env 已更新");
    }
}

// 3. 更新後端配置
function updateBackend() {
    console.log("\n🔧 更新後端配置...");
    
    // 更新 contracts.js
    const contractsPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js';
    
    const contractsContent = `// Generated from V25 VRF update on ${new Date().toISOString()}
// V25 Production Deployment - VRF Enabled

module.exports = {
  // VRF Updated NFT Contracts
  HERO: '${VRF_CONTRACTS.Hero}',
  RELIC: '${VRF_CONTRACTS.Relic}',
  PARTY: '${VRF_CONTRACTS.Party}',
  
  // VRF Updated Core Contracts
  DUNGEONCORE: '${VRF_CONTRACTS.DungeonCore}',
  DUNGEONMASTER: '${VRF_CONTRACTS.DungeonMaster}',
  DUNGEONSTORAGE: '${VRF_CONTRACTS.DungeonStorage}',
  ALTAROFASCENSION: '${VRF_CONTRACTS.AltarOfAscension}',
  
  // VRF System
  VRFMANAGER: '${VRF_CONTRACTS.VRFManager}',
  
  // DeFi Contracts
  ORACLE: '${VRF_CONTRACTS.Oracle}',
  SOULSHARD: '${VRF_CONTRACTS.SoulShard}',
  USD: '${VRF_CONTRACTS.USD}',
  UNISWAPPOOL: '${VRF_CONTRACTS.UniswapPool}',
  
  // Player Contracts
  PLAYERVAULT: '${VRF_CONTRACTS.PlayerVault}',
  PLAYERPROFILE: '${VRF_CONTRACTS.PlayerProfile}',
  VIPSTAKING: '${VRF_CONTRACTS.VIPStaking}',
  
  // VRF Configuration
  VRF_CONFIG: {
    enabled: true,
    requestPrice: '0.005',
    platformFee: '0.0003',
    revealBlockDelay: 3,
    maxRevealWindow: 255
  }
};`;
    
    fs.writeFileSync(contractsPath, contractsContent);
    console.log("✅ 後端 contracts.js 已更新");
    
    // 更新 .env
    const envPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env';
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // 更新合約地址
        const updates = [
            { key: 'HERO_CONTRACT_ADDRESS', value: VRF_CONTRACTS.Hero },
            { key: 'RELIC_CONTRACT_ADDRESS', value: VRF_CONTRACTS.Relic },
            { key: 'PARTY_CONTRACT_ADDRESS', value: VRF_CONTRACTS.Party },
            { key: 'DUNGEONMASTER_CONTRACT_ADDRESS', value: VRF_CONTRACTS.DungeonMaster },
            { key: 'ALTAROFASCENSION_CONTRACT_ADDRESS', value: VRF_CONTRACTS.AltarOfAscension },
            { key: 'VRFMANAGER_CONTRACT_ADDRESS', value: VRF_CONTRACTS.VRFManager },
            { key: 'VRF_ENABLED', value: 'true' },
            { key: 'VRF_REQUEST_PRICE', value: '0.005' },
            { key: 'PLATFORM_FEE', value: '0.0003' }
        ];
        
        updates.forEach(({ key, value }) => {
            if (envContent.includes(key)) {
                envContent = envContent.replace(new RegExp(`${key}=.*`, 'g'), `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        });
        
        fs.writeFileSync(envPath, envContent);
        console.log("✅ 後端 .env 已更新");
    }
    
    // 創建 V25 配置文件
    const v25ConfigPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/v25-vrf-config.json';
    const v25Config = {
        version: 'V25',
        timestamp: new Date().toISOString(),
        blockNumber: 56631513,
        contracts: VRF_CONTRACTS,
        features: {
            vrf: {
                enabled: true,
                requestPrice: '0.005',
                platformFee: '0.0003',
                revealBlockDelay: 3,
                maxRevealWindow: 255
            }
        }
    };
    
    fs.writeFileSync(v25ConfigPath, JSON.stringify(v25Config, null, 2));
    console.log("✅ 後端 v25-vrf-config.json 已創建");
}

// 4. 創建主配置文件
function createMasterConfig() {
    console.log("\n📝 創建主配置文件...");
    
    const masterConfig = {
        version: 'V25',
        timestamp: new Date().toISOString(),
        blockNumber: 56631513,
        subgraphVersion: 'v3.6.5',
        network: 'BSC Mainnet',
        chainId: 56,
        contracts: VRF_CONTRACTS,
        features: {
            vrf: {
                enabled: true,
                requestPrice: '0.005',
                platformFee: '0.0003',
                revealBlockDelay: 3,
                maxRevealWindow: 255,
                events: [
                    'VRFManagerSet',
                    'UpgradeRequested',
                    'ExpeditionCommitted',
                    'ExpeditionRevealed',
                    'UpgradeCommitted',
                    'UpgradeRevealed'
                ]
            }
        }
    };
    
    const configPath = path.join(__dirname, '../../v25-vrf-master-config.json');
    fs.writeFileSync(configPath, JSON.stringify(masterConfig, null, 2));
    console.log(`✅ 主配置文件已創建: ${configPath}`);
    
    return masterConfig;
}

// 主函數
async function main() {
    console.log("開始執行 V25 VRF 完整更新...\n");
    
    try {
        // 1. 修正子圖
        fixSubgraphYaml();
        
        // 2. 更新前端
        updateFrontend();
        
        // 3. 更新後端
        updateBackend();
        
        // 4. 創建主配置
        const config = createMasterConfig();
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ V25 VRF 系統更新完成！");
        console.log("=".repeat(60));
        
        console.log("\n📋 更新總結:");
        console.log("1. ✅ 子圖 YAML 已修正，VRF 事件已正確添加");
        console.log("2. ✅ 前端配置已更新，包含 VRF 費用計算");
        console.log("3. ✅ 後端配置已更新，VRF 功能已啟用");
        console.log("4. ✅ 主配置文件已創建");
        
        console.log("\n📝 VRF 事件列表:");
        config.features.vrf.events.forEach(event => {
            console.log(`  - ${event}`);
        });
        
        console.log("\n🎯 下一步操作:");
        console.log("\n1. 部署子圖:");
        console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
        console.log("   npm run codegen");
        console.log("   npm run build");
        console.log("   graph deploy --studio dungeon-delvers --version-label v3.6.5");
        
        console.log("\n2. 部署前端:");
        console.log("   cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
        console.log("   npm run build");
        console.log("   npm run deploy");
        
        console.log("\n3. 重啟後端:");
        console.log("   cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
        console.log("   pm2 restart metadata-server");
        
        console.log("\n✅ 所有配置已更新完成！");
        
    } catch (error) {
        console.error("\n❌ 更新失敗:", error);
        process.exit(1);
    }
}

main();
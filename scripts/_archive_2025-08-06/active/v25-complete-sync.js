const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 V25 完整同步系統\n");
console.log("📅 部署時間: 2025-08-06");
console.log("📦 子圖版本: v3.6.5");
console.log("🔢 部署區塊: 56631513\n");

// V25 最終合約地址
const V25_CONTRACTS = {
    // 新部署的合約（VRF 版本）
    HERO: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    RELIC: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    DUNGEONMASTER: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    ALTAROFASCENSION: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    
    // 複用的合約
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    
    // 固定合約
    VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
};

const DEPLOYMENT_INFO = {
    version: "V25",
    timestamp: new Date().toISOString(),
    blockNumber: 56631513,
    subgraphVersion: "v3.6.5",
    network: "BSC Mainnet",
    chainId: 56
};

// 創建主配置文件
function createMasterConfig() {
    console.log("📝 創建主配置文件...");
    
    const masterConfig = {
        ...DEPLOYMENT_INFO,
        contracts: V25_CONTRACTS,
        features: {
            vrf: true,
            vrfRequestPrice: "0.005",
            platformFee: "0.0003",
            revealBlockDelay: 3,
            maxRevealWindow: 255
        }
    };
    
    const configPath = path.join(__dirname, '../../v25-master-config.json');
    fs.writeFileSync(configPath, JSON.stringify(masterConfig, null, 2));
    console.log(`✅ 主配置已創建: ${configPath}\n`);
    
    return masterConfig;
}

// 同步子圖配置
function syncSubgraph(config) {
    console.log("📊 同步子圖配置...");
    
    const subgraphDir = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';
    
    // 生成 subgraph.yaml
    const subgraphYaml = `# Generated from V25 complete sync on ${new Date().toISOString()}
# V25 Production Deployment - VRF Enabled
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "${config.contracts.HERO}"
      abi: Hero
      startBlock: ${config.blockNumber}
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
      address: "${config.contracts.RELIC}"
      abi: Relic
      startBlock: ${config.blockNumber}
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
      address: "${config.contracts.PARTY}"
      abi: Party
      startBlock: ${config.blockNumber}
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
        - event: PartyMinted(indexed uint256,indexed address,uint256[],uint8[])
          handler: handlePartyMinted
        - event: PartyCompositionChanged(indexed uint256,uint256[],uint8[])
          handler: handlePartyCompositionChanged
        - event: PartyDisbanded(indexed uint256,indexed address)
          handler: handlePartyDisbanded
      file: ./src/party.ts
  - kind: ethereum/contract
    name: DungeonMaster
    network: bsc
    source:
      address: "${config.contracts.DUNGEONMASTER}"
      abi: DungeonMaster
      startBlock: ${config.blockNumber}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Expedition
      abis:
        - name: DungeonMaster
          file: ./abis/DungeonMaster.json
      eventHandlers:
        - event: ExpeditionCommitted(indexed address,uint256,uint256,uint256)
          handler: handleExpeditionCommitted
        - event: ExpeditionRevealed(indexed address,uint256,bool)
          handler: handleExpeditionRevealed
        - event: ExpeditionFulfilled(indexed address,indexed uint256,bool,uint256,uint256)
          handler: handleExpeditionFulfilled
        - event: ForcedRevealExecuted(indexed address,indexed address)
          handler: handleForcedRevealExecuted
        - event: RevealedByProxy(indexed address,indexed address)
          handler: handleRevealedByProxy
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
      file: ./src/dungeonMaster.ts
  - kind: ethereum/contract
    name: AltarOfAscension
    network: bsc
    source:
      address: "${config.contracts.ALTAROFASCENSION}"
      abi: AltarOfAscension
      startBlock: ${config.blockNumber}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Upgrade
      abis:
        - name: AltarOfAscension
          file: ./abis/AltarOfAscension.json
      eventHandlers:
        - event: UpgradeCommitted(indexed address,address,uint8,uint256,uint256[])
          handler: handleUpgradeCommitted
        - event: UpgradeRevealed(indexed address,uint8,uint8)
          handler: handleUpgradeRevealed
        - event: UpgradeAttempted(indexed address,indexed address,uint8,uint8,uint256[],uint256[],uint8,uint256,uint8,uint8)
          handler: handleUpgradeAttempted
        - event: ForcedRevealExecuted(indexed address,indexed address,uint8)
          handler: handleForcedRevealExecuted
        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
        - event: UpgradeRequested(indexed address,uint256[],uint256,uint256)
          handler: handleUpgradeRequested
      file: ./src/altar.ts
  - kind: ethereum/contract
    name: DungeonStorage
    network: bsc
    source:
      address: "${config.contracts.DUNGEONSTORAGE}"
      abi: DungeonStorage
      startBlock: ${config.blockNumber}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Dungeon
        - PartyStatus
      abis:
        - name: DungeonStorage
          file: ./abis/DungeonStorage.json
      eventHandlers:
        - event: DungeonSet(indexed uint256,uint256,uint256,uint8)
          handler: handleDungeonSet
        - event: PartyStatusUpdated(indexed uint256,uint256,uint256,uint256,uint8)
          handler: handlePartyStatusUpdated
      file: ./src/dungeonStorage.ts`;
    
    const subgraphPath = path.join(subgraphDir, 'subgraph.yaml');
    fs.writeFileSync(subgraphPath, subgraphYaml);
    console.log(`✅ 子圖配置已更新: ${subgraphPath}`);
    
    // 更新 handler 文件（如果需要）
    console.log("📝 檢查 VRF handler 函數...");
    
    // 為 Hero 添加 VRF handler
    const heroHandlerPath = path.join(subgraphDir, 'src/hero.ts');
    if (fs.existsSync(heroHandlerPath)) {
        let content = fs.readFileSync(heroHandlerPath, 'utf8');
        if (!content.includes('handleVRFManagerSet')) {
            const vrfHandler = `
// VRF Manager Set Handler
export function handleVRFManagerSet(event: VRFManagerSet): void {
  let id = event.transaction.hash.toHex() + '-' + event.logIndex.toString();
  let vrfConfig = new VRFConfig(id);
  vrfConfig.contract = event.address;
  vrfConfig.vrfManager = event.params.vrfManager;
  vrfConfig.timestamp = event.block.timestamp;
  vrfConfig.blockNumber = event.block.number;
  vrfConfig.save();
}`;
            content += vrfHandler;
            fs.writeFileSync(heroHandlerPath, content);
            console.log("  ✅ Hero VRF handler 已添加");
        }
    }
    
    // 複製 ABI 文件
    console.log("📋 複製 ABI 文件到子圖...");
    const abiSourceDir = path.join(__dirname, '../../artifacts/contracts/current');
    const abiTargetDir = path.join(subgraphDir, 'abis');
    
    const abiFiles = [
        { source: 'nft/Hero.sol/Hero.json', target: 'Hero.json' },
        { source: 'nft/Relic.sol/Relic.json', target: 'Relic.json' },
        { source: 'nft/Party.sol/Party.json', target: 'Party.json' },
        { source: 'core/DungeonMaster.sol/DungeonMaster.json', target: 'DungeonMaster.json' },
        { source: 'core/AltarOfAscension.sol/AltarOfAscension.json', target: 'AltarOfAscension.json' },
        { source: 'core/DungeonStorage.sol/DungeonStorage.json', target: 'DungeonStorage.json' }
    ];
    
    abiFiles.forEach(({ source, target }) => {
        const sourcePath = path.join(abiSourceDir, source);
        const targetPath = path.join(abiTargetDir, target);
        if (fs.existsSync(sourcePath)) {
            const abi = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
            fs.writeFileSync(targetPath, JSON.stringify(abi.abi, null, 2));
            console.log(`  ✅ ${target}`);
        }
    });
    
    console.log("✅ 子圖同步完成\n");
}

// 同步前端配置
function syncFrontend(config) {
    console.log("🎨 同步前端配置...");
    
    const frontendDir = '/Users/sotadic/Documents/GitHub/DungeonDelvers';
    
    // 更新 contracts.ts
    const contractsTs = `// Generated from V25 complete sync on ${new Date().toISOString()}
// V25 Production Deployment - VRF Enabled

export const CONTRACTS = {
  // NFT Contracts
  Hero: '${config.contracts.HERO}',
  Relic: '${config.contracts.RELIC}',
  Party: '${config.contracts.PARTY}',
  
  // Core Contracts  
  DungeonCore: '${config.contracts.DUNGEONCORE}',
  DungeonMaster: '${config.contracts.DUNGEONMASTER}',
  DungeonStorage: '${config.contracts.DUNGEONSTORAGE}',
  AltarOfAscension: '${config.contracts.ALTAROFASCENSION}',
  
  // VRF System (新增)
  VRFManager: '${config.contracts.VRFMANAGER}',
  
  // DeFi Contracts
  Oracle: '${config.contracts.ORACLE}',
  SoulShard: '${config.contracts.SOULSHARD}',
  USD: '${config.contracts.USD}',
  UniswapPool: '${config.contracts.UNISWAP_POOL}',
  
  // Player Contracts
  PlayerVault: '${config.contracts.PLAYERVAULT}',
  PlayerProfile: '${config.contracts.PLAYERPROFILE}',
  VIPStaking: '${config.contracts.VIPSTAKING}',
} as const;

export const DEPLOYMENT_INFO = {
  version: '${config.version}',
  blockNumber: ${config.blockNumber},
  subgraphVersion: '${config.subgraphVersion}',
  network: '${config.network}',
  chainId: ${config.chainId},
  features: {
    vrf: ${config.features.vrf},
    vrfRequestPrice: '${config.features.vrfRequestPrice}',
    platformFee: '${config.features.platformFee}',
    revealBlockDelay: ${config.features.revealBlockDelay},
    maxRevealWindow: ${config.features.maxRevealWindow}
  }
};

// VRF 費用計算輔助函數
export function calculateMintFee(quantity: number): { platformFee: bigint, vrfFee: bigint, total: bigint } {
  const platformFeePerNFT = BigInt(${config.features.platformFee} * 1e18);
  const vrfFeePerRequest = BigInt(${config.features.vrfRequestPrice} * 1e18);
  
  const platformFee = platformFeePerNFT * BigInt(quantity);
  const vrfFee = DEPLOYMENT_INFO.features.vrf ? vrfFeePerRequest : BigInt(0);
  
  return {
    platformFee,
    vrfFee,
    total: platformFee + vrfFee
  };
}`;
    
    const contractsPath = path.join(frontendDir, 'src/config/contracts.ts');
    fs.writeFileSync(contractsPath, contractsTs);
    console.log(`✅ 前端合約配置已更新: ${contractsPath}`);
    
    // 複製 ABI 文件
    console.log("📋 複製 ABI 文件到前端...");
    const frontendAbiDir = path.join(frontendDir, 'src/contracts/abis');
    
    // 確保目錄存在
    if (!fs.existsSync(frontendAbiDir)) {
        fs.mkdirSync(frontendAbiDir, { recursive: true });
    }
    
    const abiSourceDir = path.join(__dirname, '../../artifacts/contracts/current');
    const frontendAbiFiles = [
        { source: 'nft/Hero.sol/Hero.json', target: 'Hero.json' },
        { source: 'nft/Relic.sol/Relic.json', target: 'Relic.json' },
        { source: 'nft/Party.sol/Party.json', target: 'Party.json' },
        { source: 'core/DungeonMaster.sol/DungeonMaster.json', target: 'DungeonMaster.json' },
        { source: 'core/AltarOfAscension.sol/AltarOfAscension.json', target: 'AltarOfAscension.json' },
        { source: 'core/VRFManager.sol/VRFManager.json', target: 'VRFManager.json' },
        { source: 'core/DungeonStorage.sol/DungeonStorage.json', target: 'DungeonStorage.json' }
    ];
    
    frontendAbiFiles.forEach(({ source, target }) => {
        const sourcePath = path.join(abiSourceDir, source);
        const targetPath = path.join(frontendAbiDir, target);
        if (fs.existsSync(sourcePath)) {
            const abi = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
            fs.writeFileSync(targetPath, JSON.stringify(abi.abi, null, 2));
            console.log(`  ✅ ${target}`);
        }
    });
    
    console.log("✅ 前端同步完成\n");
}

// 同步後端配置
function syncBackend(config) {
    console.log("🔧 同步後端配置...");
    
    const backendDir = '/Users/sotadic/Documents/dungeon-delvers-metadata-server';
    
    // 更新 .env
    const envContent = `# Generated from V25 complete sync on ${new Date().toISOString()}
# V25 Production Deployment - VRF Enabled

# Network Configuration
RPC_URL=https://bsc-dataseed1.binance.org/
CHAIN_ID=56

# Contract Addresses (VRF Updated)
HERO_CONTRACT_ADDRESS=${config.contracts.HERO}
RELIC_CONTRACT_ADDRESS=${config.contracts.RELIC}
PARTY_CONTRACT_ADDRESS=${config.contracts.PARTY}
DUNGEONCORE_CONTRACT_ADDRESS=${config.contracts.DUNGEONCORE}
DUNGEONMASTER_CONTRACT_ADDRESS=${config.contracts.DUNGEONMASTER}
DUNGEONSTORAGE_CONTRACT_ADDRESS=${config.contracts.DUNGEONSTORAGE}
ALTAROFASCENSION_CONTRACT_ADDRESS=${config.contracts.ALTAROFASCENSION}
VRFMANAGER_CONTRACT_ADDRESS=${config.contracts.VRFMANAGER}
ORACLE_CONTRACT_ADDRESS=${config.contracts.ORACLE}
SOULSHARD_CONTRACT_ADDRESS=${config.contracts.SOULSHARD}
USD_CONTRACT_ADDRESS=${config.contracts.USD}
PLAYERVAULT_CONTRACT_ADDRESS=${config.contracts.PLAYERVAULT}
PLAYERPROFILE_CONTRACT_ADDRESS=${config.contracts.PLAYERPROFILE}
VIPSTAKING_CONTRACT_ADDRESS=${config.contracts.VIPSTAKING}

# Deployment Info
DEPLOYMENT_VERSION=${config.version}
DEPLOYMENT_BLOCK=${config.blockNumber}
SUBGRAPH_VERSION=${config.subgraphVersion}

# VRF Features
VRF_ENABLED=true
VRF_REQUEST_PRICE=${config.features.vrfRequestPrice}
PLATFORM_FEE=${config.features.platformFee}
REVEAL_BLOCK_DELAY=${config.features.revealBlockDelay}
MAX_REVEAL_WINDOW=${config.features.maxRevealWindow}

# API Configuration
PORT=3000
NODE_ENV=production`;
    
    const envPath = path.join(backendDir, '.env.v25');
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ 後端環境變數已更新: ${envPath}`);
    
    // 創建配置文件
    const backendConfig = {
        ...config,
        apiEndpoints: {
            rpc: 'https://bsc-dataseed1.binance.org/',
            subgraph: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.6.5'
        }
    };
    
    const configPath = path.join(backendDir, 'config/v25-config.json');
    if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(backendConfig, null, 2));
    console.log(`✅ 後端配置文件已創建: ${configPath}`);
    
    console.log("✅ 後端同步完成\n");
}

// 驗證所有配置
function verifySync(config) {
    console.log("🔍 驗證同步狀態...\n");
    
    const results = [];
    
    // 驗證子圖
    console.log("📊 驗證子圖...");
    const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
    if (fs.existsSync(subgraphPath)) {
        const content = fs.readFileSync(subgraphPath, 'utf8');
        const checks = {
            hero: content.includes(config.contracts.HERO),
            relic: content.includes(config.contracts.RELIC),
            vrf: content.includes('VRFManagerSet'),
            upgrade: content.includes('UpgradeRequested'),
            startBlock: content.includes(config.blockNumber.toString())
        };
        
        const allChecks = Object.values(checks).every(v => v);
        
        console.log(`  Hero 地址: ${checks.hero ? '✅' : '❌'}`);
        console.log(`  Relic 地址: ${checks.relic ? '✅' : '❌'}`);
        console.log(`  VRF 事件: ${checks.vrf ? '✅' : '❌'}`);
        console.log(`  Upgrade 事件: ${checks.upgrade ? '✅' : '❌'}`);
        console.log(`  起始區塊: ${checks.startBlock ? '✅' : '❌'}`);
        
        results.push({ 
            component: '子圖', 
            status: allChecks ? '✅' : '❌',
            details: checks
        });
    }
    
    // 驗證前端
    console.log("\n🎨 驗證前端...");
    const frontendPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
    if (fs.existsSync(frontendPath)) {
        const content = fs.readFileSync(frontendPath, 'utf8');
        const checks = {
            hero: content.includes(config.contracts.HERO),
            vrf: content.includes(config.contracts.VRFMANAGER),
            feeCalc: content.includes('calculateMintFee')
        };
        
        const allChecks = Object.values(checks).every(v => v);
        
        console.log(`  Hero 地址: ${checks.hero ? '✅' : '❌'}`);
        console.log(`  VRF Manager: ${checks.vrf ? '✅' : '❌'}`);
        console.log(`  費用計算: ${checks.feeCalc ? '✅' : '❌'}`);
        
        results.push({ 
            component: '前端', 
            status: allChecks ? '✅' : '❌',
            details: checks
        });
    }
    
    // 驗證後端
    console.log("\n🔧 驗證後端...");
    const backendPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env.v25';
    if (fs.existsSync(backendPath)) {
        const content = fs.readFileSync(backendPath, 'utf8');
        const checks = {
            hero: content.includes(config.contracts.HERO),
            vrf: content.includes(config.contracts.VRFMANAGER),
            vrfEnabled: content.includes('VRF_ENABLED=true')
        };
        
        const allChecks = Object.values(checks).every(v => v);
        
        console.log(`  Hero 地址: ${checks.hero ? '✅' : '❌'}`);
        console.log(`  VRF Manager: ${checks.vrf ? '✅' : '❌'}`);
        console.log(`  VRF 啟用: ${checks.vrfEnabled ? '✅' : '❌'}`);
        
        results.push({ 
            component: '後端', 
            status: allChecks ? '✅' : '❌',
            details: checks
        });
    }
    
    console.log("\n📋 同步驗證總結:");
    console.log("================");
    results.forEach(r => {
        console.log(`${r.component}: ${r.status}`);
    });
    
    const allSuccess = results.every(r => r.status === '✅');
    if (allSuccess) {
        console.log("\n🎉 所有組件同步成功！");
    } else {
        console.log("\n⚠️ 部分組件同步失敗，請檢查");
    }
    
    return { success: allSuccess, results };
}

// 主函數
async function main() {
    try {
        // 創建主配置
        const config = createMasterConfig();
        
        // 同步各組件
        syncSubgraph(config);
        syncFrontend(config);
        syncBackend(config);
        
        // 驗證同步
        const verification = verifySync(config);
        
        // 生成部署指令
        console.log("\n📝 後續部署步驟:");
        console.log("================\n");
        
        console.log("1. 部署子圖:");
        console.log("```bash");
        console.log("cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
        console.log("npm run codegen");
        console.log("npm run build");
        console.log("graph deploy --studio dungeon-delvers --version-label v3.6.5");
        console.log("```\n");
        
        console.log("2. 部署前端:");
        console.log("```bash");
        console.log("cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
        console.log("npm run build");
        console.log("npm run deploy");
        console.log("```\n");
        
        console.log("3. 重啟後端:");
        console.log("```bash");
        console.log("cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
        console.log("cp .env.v25 .env");
        console.log("pm2 restart metadata-server");
        console.log("```\n");
        
        // 保存同步記錄
        const syncRecord = {
            timestamp: new Date().toISOString(),
            config,
            verification,
            deploymentSteps: {
                subgraph: "graph deploy --studio dungeon-delvers --version-label v3.6.5",
                frontend: "npm run deploy",
                backend: "pm2 restart metadata-server"
            }
        };
        
        const recordPath = path.join(__dirname, `v25-sync-record-${Date.now()}.json`);
        fs.writeFileSync(recordPath, JSON.stringify(syncRecord, null, 2));
        console.log(`📝 同步記錄已保存: ${recordPath}\n`);
        
        console.log("✅ V25 完整同步完成！");
        
    } catch (error) {
        console.error("❌ 同步失敗:", error);
        process.exit(1);
    }
}

main();
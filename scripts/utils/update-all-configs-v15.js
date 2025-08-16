const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// V15 完整部署地址
const V15_ADDRESSES = {
  TESTUSD_ADDRESS: "0xa095B8c9D9964F62A7dbA3f60AA91dB381A3e074",
  SOULSHARD_ADDRESS: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  HERO_ADDRESS: "0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2",
  RELIC_ADDRESS: "0xaEa78C3FC4bc50966aC41D76331fD0bf219D00ac",
  PARTY_ADDRESS: "0x514AFBb114fa6c77CC025720A31aaeE038fBbcd7",
  DUNGEONCORE_ADDRESS: "0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD",
  DUNGEONMASTER_ADDRESS: "0xaeBd33846a4a88Afd1B1c3ACB5D8C5872796E316",
  DUNGEONSTORAGE_ADDRESS: "0xAfA453cdca0245c858DAeb4d3e21C6360F4d62Eb",
  PLAYERVAULT_ADDRESS: "0x34d94193aa59f8a7E34040Ed4F0Ea5B231811388",
  PLAYERPROFILE_ADDRESS: "0x5d4582266654CBEA6cC6Bdf696B68B8473521b63",
  VIPSTAKING_ADDRESS: "0x9c2fdD1c692116aB5209983e467286844B3b9921",
  ORACLE_ADDRESS: "0x623caa925445BeACd54Cc6C62Bb725B5d93698af",
  ALTAROFASCENSION_ADDRESS: "0x0000000000000000000000000000000000000000",
  DUNGEONMASTERWALLET_ADDRESS: "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
};

// V15 的起始區塊
const V15_START_BLOCK = "45036500"; // 預估區塊號，需要根據實際部署調整

async function updateAllConfigs() {
  log('\n🚀 開始更新所有配置文件到 V15', 'magenta');
  log('='.repeat(70), 'magenta');

  try {
    // 1. 更新主要 .env 文件
    log('\n📝 更新主要 .env 文件...', 'yellow');
    updateMainEnv();

    // 2. 更新共享配置文件
    log('\n📝 更新共享配置文件...', 'yellow');
    updateSharedConfig();

    // 3. 更新已部署地址文件
    log('\n📝 更新已部署地址文件...', 'yellow');
    updateDeployedAddresses();

    // 4. 創建前端環境變數文件
    log('\n📝 創建前端環境變數文件...', 'yellow');
    createFrontendEnv();

    // 5. 創建後端環境變數文件
    log('\n📝 創建後端環境變數文件...', 'yellow');
    createBackendEnv();

    // 6. 創建子圖配置文件
    log('\n📝 創建子圖配置文件...', 'yellow');
    createSubgraphConfig();

    // 7. 創建合約配置檔案
    log('\n📝 更新合約配置文件...', 'yellow');
    updateContractConfig();

    log('\n✅ 所有配置文件更新完成！', 'green');
    log('\n📋 下一步操作指南:', 'cyan');
    log('1. 前端: 複製 deployments/frontend-v15.env 到前端專案的 .env', 'yellow');
    log('2. 後端: 複製 deployments/backend-v15.env 到後端專案的 .env', 'yellow');
    log('3. 子圖: 使用 deployments/subgraph-v15.yaml 更新子圖配置', 'yellow');
    log('4. 執行測試確認所有功能正常', 'yellow');

  } catch (error) {
    log(`\n❌ 更新配置文件失敗: ${error.message}`, 'red');
    console.error(error);
  }
}

function updateMainEnv() {
  const envPath = path.join(__dirname, '../../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // 更新 V15 部署地址
  Object.entries(V15_ADDRESSES).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  // 添加 V15 標記
  if (!envContent.includes('# V15 Deployment')) {
    envContent = `# V15 Deployment (Updated: ${new Date().toISOString()})\n` + envContent;
  }

  fs.writeFileSync(envPath, envContent);
  log('✅ 主要 .env 文件更新完成', 'green');
}

function updateSharedConfig() {
  const configPath = path.join(__dirname, '../../shared-config.json');
  const config = {
    version: "V15",
    network: "BSC Mainnet",
    lastUpdated: new Date().toISOString(),
    contracts: V15_ADDRESSES,
    features: {
      viaIR: true,
      unifiedDependencies: true,
      realTokenIntegration: true,
      oracleEnabled: true
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log('✅ shared-config.json 更新完成', 'green');
}

function updateDeployedAddresses() {
  const addressesPath = path.join(__dirname, '../../deployed-addresses.json');
  const addresses = {
    mainnet: {
      v15: V15_ADDRESSES,
      deploymentDate: "2025-07-23",
      verificationRate: "100%"
    }
  };

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  log('✅ deployed-addresses.json 更新完成', 'green');
}

function createFrontendEnv() {
  const frontendEnvPath = path.join(__dirname, '../../deployments/frontend-v15.env');
  let envContent = `# DungeonDelvers Frontend V15 Configuration
# Generated: ${new Date().toISOString()}
# Network: BSC Mainnet

# React App 環境變數（必須以 REACT_APP_ 開頭）
`;

  Object.entries(V15_ADDRESSES).forEach(([key, value]) => {
    if (key !== 'ALTAROFASCENSION_ADDRESS' || value !== '0x0000000000000000000000000000000000000000') {
      envContent += `REACT_APP_${key}=${value}\n`;
    }
  });

  envContent += `
# 其他配置
REACT_APP_CHAIN_ID=56
REACT_APP_NETWORK_NAME=BSC Mainnet
REACT_APP_RPC_URL=https://bsc-dataseed.binance.org/
REACT_APP_EXPLORER_URL=https://bscscan.com
REACT_APP_VERSION=V15
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  log('✅ 前端環境變數文件創建完成', 'green');
}

function createBackendEnv() {
  const backendEnvPath = path.join(__dirname, '../../deployments/backend-v15.env');
  let envContent = `# DungeonDelvers Backend V15 Configuration
# Generated: ${new Date().toISOString()}
# Network: BSC Mainnet

# 合約地址
`;

  Object.entries(V15_ADDRESSES).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });

  envContent += `
# 網路配置
NETWORK=mainnet
CHAIN_ID=56
RPC_URL=https://bsc-dataseed.binance.org/

# API 配置
PORT=3000
NODE_ENV=production

# 版本資訊
VERSION=V15
DEPLOYMENT_DATE=2025-07-23
`;

  fs.writeFileSync(backendEnvPath, envContent);
  log('✅ 後端環境變數文件創建完成', 'green');
}

function createSubgraphConfig() {
  const subgraphPath = path.join(__dirname, '../../deployments/subgraph-v15.yaml');
  let subgraphContent = `# DungeonDelvers Subgraph V15 Configuration
# Generated: ${new Date().toISOString()}
# Network: BSC Mainnet

specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
`;

  // Hero NFT
  subgraphContent += `  - kind: ethereum/contract
    name: Hero
    network: bsc
    source:
      address: "${V15_ADDRESSES.HERO_ADDRESS}"
      abi: Hero
      startBlock: ${V15_START_BLOCK}
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
          handler: handleHeroTransfer
        - event: HeroMinted(indexed uint256,indexed address,uint8,uint8,uint8,uint8)
          handler: handleHeroMinted
      file: ./src/hero.ts

`;

  // Relic NFT
  subgraphContent += `  - kind: ethereum/contract
    name: Relic
    network: bsc
    source:
      address: "${V15_ADDRESSES.RELIC_ADDRESS}"
      abi: Relic
      startBlock: ${V15_START_BLOCK}
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
          handler: handleRelicTransfer
        - event: RelicMinted(indexed uint256,indexed address,uint8)
          handler: handleRelicMinted
      file: ./src/relic.ts

`;

  // Party NFT
  subgraphContent += `  - kind: ethereum/contract
    name: Party
    network: bsc
    source:
      address: "${V15_ADDRESSES.PARTY_ADDRESS}"
      abi: Party
      startBlock: ${V15_START_BLOCK}
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
          handler: handlePartyTransfer
        - event: PartyFormed(indexed uint256,indexed address,uint256[],uint256[])
          handler: handlePartyFormed
      file: ./src/party.ts

`;

  // VIPStaking
  subgraphContent += `  - kind: ethereum/contract
    name: VIPStaking
    network: bsc
    source:
      address: "${V15_ADDRESSES.VIPSTAKING_ADDRESS}"
      abi: VIPStaking
      startBlock: ${V15_START_BLOCK}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - VIPStake
        - User
      abis:
        - name: VIPStaking
          file: ./abis/VIPStaking.json
      eventHandlers:
        - event: Staked(indexed address,uint256)
          handler: handleStaked
        - event: Unstaked(indexed address,uint256)
          handler: handleUnstaked
      file: ./src/vipstaking.ts

`;

  // PlayerProfile
  subgraphContent += `  - kind: ethereum/contract
    name: PlayerProfile
    network: bsc
    source:
      address: "${V15_ADDRESSES.PLAYERPROFILE_ADDRESS}"
      abi: PlayerProfile
      startBlock: ${V15_START_BLOCK}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Player
        - Referral
      abis:
        - name: PlayerProfile
          file: ./abis/PlayerProfile.json
      eventHandlers:
        - event: ProfileCreated(indexed address,string)
          handler: handleProfileCreated
        - event: ReferralRecorded(indexed address,indexed address)
          handler: handleReferralRecorded
      file: ./src/playerprofile.ts
`;

  fs.writeFileSync(subgraphPath, subgraphContent);
  log('✅ 子圖配置文件創建完成', 'green');
}

function updateContractConfig() {
  // 已經在之前的部署中更新過，這裡確認一下
  const configPath = path.join(__dirname, '../../config/contracts.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (config.version !== 'V15-Complete') {
    config.version = 'V15-Complete';
    config.timestamp = new Date().toISOString().split('T')[0];
    config.contracts = V15_ADDRESSES;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log('✅ config/contracts.json 更新完成', 'green');
  } else {
    log('✅ config/contracts.json 已是最新版本', 'green');
  }
}

// 執行更新
updateAllConfigs();
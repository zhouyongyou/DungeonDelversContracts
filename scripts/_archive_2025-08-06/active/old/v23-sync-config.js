#!/usr/bin/env node

// V23 配置同步腳本 - 更新所有專案到 V23

const fs = require('fs');
const path = require('path');

// 專案路徑
const PATHS = {
  FRONTEND: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  BACKEND: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  SUBGRAPH: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

// 載入 V23 配置
function loadV23Config() {
  const configPath = path.join(__dirname, '..', '..', 'config', 'v23-config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error('找不到 V23 配置文件，請先執行部署和設置腳本');
  }
  return require(configPath);
}

// 生成前端配置
function generateFrontendConfig(v23Config) {
  const contracts = v23Config.contracts;
  
  // 生成 contracts.ts
  const contractsContent = `// Auto-generated from v23-config.js - ${new Date().toLocaleString()}
// Version: ${v23Config.version}
// Network: ${v23Config.network}

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  DUNGEONCORE: "${contracts.DUNGEONCORE.address}",
  ORACLE: "${contracts.ORACLE.address}", // V23 ${contracts.ORACLE.description || 'Oracle'}
  SOULSHARD: "${contracts.SOULSHARD.address}",
  
  // NFT Contracts
  HERO: "${contracts.HERO.address}",
  RELIC: "${contracts.RELIC.address}",
  PARTY: "${contracts.PARTY.address}",
  
  // Game Contracts
  DUNGEONMASTER: "${contracts.DUNGEONMASTER.address}",
  DUNGEONMASTER_WALLET: "${contracts.DUNGEONMASTERWALLET.address}",
  PLAYERVAULT: "${contracts.PLAYERVAULT.address}",
  PLAYERPROFILE: "${contracts.PLAYERPROFILE.address}",
  ALTAROFASCENSION: "${contracts.ALTAROFASCENSION.address}",
  VIPSTAKING: "${contracts.VIPSTAKING.address}",
  DUNGEONSTORAGE: "${contracts.DUNGEONSTORAGE.address}",
  
  // DeFi Contracts
  UNISWAP_POOL: "${contracts.UNISWAP_POOL.address}",
  USD: "${contracts.USD.address}"
} as const;

export const getContract = (name: keyof typeof CONTRACT_ADDRESSES): string => {
  return CONTRACT_ADDRESSES[name];
};

export const getContractAddress = (name: string): string => {
  return CONTRACT_ADDRESSES[name as keyof typeof CONTRACT_ADDRESSES] || '';
};

export const isValidContract = (address: string): boolean => {
  return Object.values(CONTRACT_ADDRESSES).includes(address.toLowerCase());
};

// Metadata Base URIs
export const BASE_URIS = {
  HERO: "https://dungeon-delvers-metadata-server.onrender.com/api/hero/",
  RELIC: "https://dungeon-delvers-metadata-server.onrender.com/api/relic/",
  PARTY: "https://dungeon-delvers-metadata-server.onrender.com/api/party/",
  VIP: "https://dungeon-delvers-metadata-server.onrender.com/api/vip/",
  PROFILE: "https://dungeon-delvers-metadata-server.onrender.com/api/profile/"
} as const;

// Version Info
export const DEPLOYMENT_VERSION = "${v23Config.version}";
export const DEPLOYMENT_DATE = "${v23Config.lastUpdated}";
`;

  return contractsContent;
}

// 生成後端配置
function generateBackendConfig(v23Config) {
  const contracts = v23Config.contracts;
  
  const configContent = `// Auto-generated from v23-config.js - ${new Date().toLocaleString()}
// Version: ${v23Config.version}

module.exports = {
  contracts: {
    // Core
    dungeonCore: "${contracts.DUNGEONCORE.address}",
    oracle: "${contracts.ORACLE.address}", // V23 ${contracts.ORACLE.description || 'Oracle'}
    soulShard: "${contracts.SOULSHARD.address}",
    
    // NFTs
    hero: "${contracts.HERO.address}",
    relic: "${contracts.RELIC.address}",
    party: "${contracts.PARTY.address}",
    
    // Game
    dungeonMaster: "${contracts.DUNGEONMASTER.address}",
    dungeonMasterWallet: "${contracts.DUNGEONMASTERWALLET.address}",
    playerVault: "${contracts.PLAYERVAULT.address}",
    playerProfile: "${contracts.PLAYERPROFILE.address}",
    altarOfAscension: "${contracts.ALTAROFASCENSION.address}",
    vipStaking: "${contracts.VIPSTAKING.address}",
    dungeonStorage: "${contracts.DUNGEONSTORAGE.address}",
    
    // DeFi
    uniswapPool: "${contracts.UNISWAP_POOL.address}",
    usd: "${contracts.USD.address}"
  },
  version: "${v23Config.version}",
  network: "${v23Config.network}",
  deployedAt: "${v23Config.lastUpdated}",
  
  // Base URIs
  baseUris: {
    hero: "https://dungeon-delvers-metadata-server.onrender.com/api/hero/",
    relic: "https://dungeon-delvers-metadata-server.onrender.com/api/relic/",
    party: "https://dungeon-delvers-metadata-server.onrender.com/api/party/",
    vip: "https://dungeon-delvers-metadata-server.onrender.com/api/vip/",
    profile: "https://dungeon-delvers-metadata-server.onrender.com/api/profile/"
  }
};
`;

  return configContent;
}

// 生成子圖配置
function generateSubgraphConfig(v23Config) {
  const contracts = v23Config.contracts;
  
  // 使用預設的起始區塊（可以根據實際部署調整）
  const DEFAULT_START_BLOCK = 48000000;
  
  const networkContent = `{
  "network": "bsc",
  "dungeonCore": {
    "address": "${contracts.DUNGEONCORE.address}",
    "startBlock": ${contracts.DUNGEONCORE.startBlock || DEFAULT_START_BLOCK}
  },
  "oracle": {
    "address": "${contracts.ORACLE.address}",
    "startBlock": ${contracts.ORACLE.startBlock || DEFAULT_START_BLOCK},
    "version": "V23"
  },
  "hero": {
    "address": "${contracts.HERO.address}",
    "startBlock": ${contracts.HERO.startBlock || DEFAULT_START_BLOCK}
  },
  "relic": {
    "address": "${contracts.RELIC.address}",
    "startBlock": ${contracts.RELIC.startBlock || DEFAULT_START_BLOCK}
  },
  "party": {
    "address": "${contracts.PARTY.address}",
    "startBlock": ${contracts.PARTY.startBlock || DEFAULT_START_BLOCK}
  },
  "dungeonMaster": {
    "address": "${contracts.DUNGEONMASTER.address}",
    "startBlock": ${contracts.DUNGEONMASTER.startBlock || DEFAULT_START_BLOCK}
  },
  "playerVault": {
    "address": "${contracts.PLAYERVAULT.address}",
    "startBlock": ${contracts.PLAYERVAULT.startBlock || DEFAULT_START_BLOCK}
  },
  "altarOfAscension": {
    "address": "${contracts.ALTAROFASCENSION.address}",
    "startBlock": ${contracts.ALTAROFASCENSION.startBlock || DEFAULT_START_BLOCK}
  },
  "vipStaking": {
    "address": "${contracts.VIPSTAKING.address}",
    "startBlock": ${contracts.VIPSTAKING.startBlock || DEFAULT_START_BLOCK}
  },
  "soulShard": {
    "address": "${contracts.SOULSHARD.address}",
    "startBlock": ${contracts.SOULSHARD.startBlock || DEFAULT_START_BLOCK}
  },
  "playerProfile": {
    "address": "${contracts.PLAYERPROFILE.address}",
    "startBlock": ${contracts.PLAYERPROFILE.startBlock || DEFAULT_START_BLOCK}
  }
}`;

  return networkContent;
}

// 主函數
async function syncV23Config() {
  console.log('🚀 開始同步 V23 配置到所有專案\n');
  
  let v23Config;
  try {
    v23Config = loadV23Config();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
  
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`📅 部署時間: ${v23Config.lastUpdated}`);
  console.log(`🌐 網路: ${v23Config.network}`);
  console.log(`🔧 部署者: ${v23Config.deployer}\n`);
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  // 1. 更新前端
  console.log('1️⃣ 更新前端配置...');
  try {
    const contractsContent = generateFrontendConfig(v23Config);
    const contractsPath = path.join(PATHS.FRONTEND, 'src/config/contracts.ts');
    
    // 備份原文件
    if (fs.existsSync(contractsPath)) {
      const backupPath = contractsPath + `.backup-${Date.now()}`;
      fs.copyFileSync(contractsPath, backupPath);
      console.log(`   📄 已備份原文件: ${backupPath}`);
    }
    
    // 確保目錄存在
    fs.mkdirSync(path.dirname(contractsPath), { recursive: true });
    
    // 寫入新配置
    fs.writeFileSync(contractsPath, contractsContent);
    console.log(`   ✅ 已更新: ${contractsPath}`);
    
    successCount++;
    results.push({ project: '前端', status: '成功', path: contractsPath });
  } catch (error) {
    console.log(`   ❌ 前端更新失敗: ${error.message}`);
    failCount++;
    results.push({ project: '前端', status: '失敗', error: error.message });
  }
  
  // 2. 更新後端
  console.log('\n2️⃣ 更新後端配置...');
  try {
    const configContent = generateBackendConfig(v23Config);
    const configPath = path.join(PATHS.BACKEND, 'config/contracts.js');
    
    // 備份原文件
    if (fs.existsSync(configPath)) {
      const backupPath = configPath + `.backup-${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      console.log(`   📄 已備份原文件: ${backupPath}`);
    }
    
    // 確保目錄存在
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    
    // 寫入新配置
    fs.writeFileSync(configPath, configContent);
    console.log(`   ✅ 已更新: ${configPath}`);
    
    successCount++;
    results.push({ project: '後端', status: '成功', path: configPath });
  } catch (error) {
    console.log(`   ❌ 後端更新失敗: ${error.message}`);
    failCount++;
    results.push({ project: '後端', status: '失敗', error: error.message });
  }
  
  // 3. 更新子圖
  console.log('\n3️⃣ 更新子圖配置...');
  try {
    const networkContent = generateSubgraphConfig(v23Config);
    const networkPath = path.join(PATHS.SUBGRAPH, 'networks.json');
    
    // 備份原文件
    if (fs.existsSync(networkPath)) {
      const backupPath = networkPath + `.backup-${Date.now()}`;
      fs.copyFileSync(networkPath, backupPath);
      console.log(`   📄 已備份原文件: ${backupPath}`);
    }
    
    // 確保目錄存在
    fs.mkdirSync(path.dirname(networkPath), { recursive: true });
    
    // 寫入新配置
    fs.writeFileSync(networkPath, networkContent);
    console.log(`   ✅ 已更新: ${networkPath}`);
    
    successCount++;
    results.push({ project: '子圖', status: '成功', path: networkPath });
  } catch (error) {
    console.log(`   ❌ 子圖更新失敗: ${error.message}`);
    failCount++;
    results.push({ project: '子圖', status: '失敗', error: error.message });
  }
  
  // 保存同步結果
  const syncResult = {
    version: v23Config.version,
    timestamp: new Date().toISOString(),
    successCount,
    failCount,
    results
  };
  
  const resultPath = path.join(__dirname, '..', 'deployments', `v23-sync-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(syncResult, null, 2));
  
  // 總結
  console.log('\n========== 同步完成 ==========');
  console.log(`✅ 成功: ${successCount} 個專案`);
  console.log(`❌ 失敗: ${failCount} 個專案`);
  console.log(`📋 版本: ${v23Config.version}`);
  console.log(`📄 同步結果: ${resultPath}`);
  console.log('===============================\n');
  
  if (successCount > 0) {
    console.log('📌 下一步:');
    console.log('1. 前端: cd ' + PATHS.FRONTEND + ' && npm run dev');
    console.log('2. 後端: cd ' + PATHS.BACKEND + ' && npm start');
    console.log('3. 子圖: cd ' + PATHS.SUBGRAPH + ' && npm run deploy');
  }
  
  console.log('\n💡 提示:');
  console.log('- 所有舊配置都已備份');
  console.log('- 如需回滾，可使用備份文件');
  console.log('- 確保各專案的 package.json 中有對應的啟動腳本');
}

// 執行
if (require.main === module) {
  syncV23Config().catch(console.error);
}

module.exports = { syncV23Config };
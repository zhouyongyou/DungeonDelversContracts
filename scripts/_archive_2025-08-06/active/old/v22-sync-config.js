#!/usr/bin/env node

// V22 配置同步腳本 - 更新所有專案到 V22

const fs = require('fs');
const path = require('path');

// 載入 V22 配置
const v22Config = require('../config/v22-config');

// 專案路徑
const PATHS = {
  FRONTEND: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  BACKEND: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  SUBGRAPH: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

// 生成前端配置
function generateFrontendConfig() {
  const contracts = v22Config.contracts;
  
  // 生成 contracts.ts
  const contractsContent = `// Auto-generated from v22-config.js - ${new Date().toLocaleString()}
// Version: ${v22Config.version}
// Oracle: Adaptive TWAP (30/15/5/1 min)

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  DUNGEONCORE: "${contracts.DUNGEONCORE.address}",
  ORACLE: "${contracts.ORACLE.address}", // V22 Adaptive
  SOULSHARD: "${contracts.SOULSHARD.address}",
  
  // NFT Contracts
  HERO: "${contracts.HERO.address}",
  RELIC: "${contracts.RELIC.address}",
  PARTY: "${contracts.PARTY.address}",
  
  // Game Contracts
  DUNGEONMASTER: "${contracts.DUNGEONMASTER.address}",
  DUNGEONMASTER_WALLET: "${contracts.DUNGEONMASTER_WALLET.address}",
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

export const ORACLE_VERSION = "V22";
export const ORACLE_FEATURES = ${JSON.stringify(contracts.ORACLE.features, null, 2)};
`;

  // 生成 constants.ts 更新
  const constantsUpdate = `
// Oracle V22 Configuration
export const ORACLE_CONFIG = {
  version: "V22",
  adaptivePeriods: [1800, 900, 300, 60], // 30min, 15min, 5min, 1min
  features: ${JSON.stringify(contracts.ORACLE.features, null, 2)}
};
`;

  return { contractsContent, constantsUpdate };
}

// 生成後端配置
function generateBackendConfig() {
  const contracts = v22Config.contracts;
  
  const configContent = `// Auto-generated from v22-config.js - ${new Date().toLocaleString()}
// Version: ${v22Config.version}

module.exports = {
  contracts: {
    // Core
    dungeonCore: "${contracts.DUNGEONCORE.address}",
    oracle: "${contracts.ORACLE.address}", // V22 Adaptive
    soulShard: "${contracts.SOULSHARD.address}",
    
    // NFTs
    hero: "${contracts.HERO.address}",
    relic: "${contracts.RELIC.address}",
    party: "${contracts.PARTY.address}",
    
    // Game
    dungeonMaster: "${contracts.DUNGEONMASTER.address}",
    dungeonMasterWallet: "${contracts.DUNGEONMASTER_WALLET.address}",
    playerVault: "${contracts.PLAYERVAULT.address}",
    playerProfile: "${contracts.PLAYERPROFILE.address}",
    altarOfAscension: "${contracts.ALTAROFASCENSION.address}",
    vipStaking: "${contracts.VIPSTAKING.address}",
    dungeonStorage: "${contracts.DUNGEONSTORAGE.address}",
    
    // DeFi
    uniswapPool: "${contracts.UNISWAP_POOL.address}",
    usd: "${contracts.USD.address}"
  },
  version: "${v22Config.version}",
  network: "${v22Config.network}",
  oracleVersion: "V22 Adaptive TWAP"
};
`;

  return configContent;
}

// 生成子圖配置
function generateSubgraphConfig() {
  const contracts = v22Config.contracts;
  
  const networkContent = `{
  "network": "bsc",
  "dungeonCore": {
    "address": "${contracts.DUNGEONCORE.address}",
    "startBlock": ${contracts.DUNGEONCORE.startBlock || 0}
  },
  "oracle": {
    "address": "${contracts.ORACLE.address}",
    "startBlock": ${contracts.ORACLE.startBlock || 0},
    "version": "V22"
  },
  "hero": {
    "address": "${contracts.HERO.address}",
    "startBlock": ${contracts.HERO.startBlock || 0}
  },
  "relic": {
    "address": "${contracts.RELIC.address}",
    "startBlock": ${contracts.RELIC.startBlock || 0}
  },
  "party": {
    "address": "${contracts.PARTY.address}",
    "startBlock": ${contracts.PARTY.startBlock || 0}
  },
  "dungeonMaster": {
    "address": "${contracts.DUNGEONMASTER.address}",
    "startBlock": ${contracts.DUNGEONMASTER.startBlock || 0}
  },
  "playerVault": {
    "address": "${contracts.PLAYERVAULT.address}",
    "startBlock": ${contracts.PLAYERVAULT.startBlock || 0}
  },
  "altarOfAscension": {
    "address": "${contracts.ALTAROFASCENSION.address}",
    "startBlock": ${contracts.ALTAROFASCENSION.startBlock || 0}
  },
  "vipStaking": {
    "address": "${contracts.VIPSTAKING.address}",
    "startBlock": ${contracts.VIPSTAKING.startBlock || 0}
  },
  "soulShard": {
    "address": "${contracts.SOULSHARD.address}",
    "startBlock": ${contracts.SOULSHARD.startBlock || 0}
  }
}`;

  return networkContent;
}

// 主函數
async function syncV22Config() {
  console.log('🚀 開始同步 V22 配置到所有專案\n');
  console.log(`📋 版本: ${v22Config.version}`);
  console.log(`📅 時間: ${new Date().toLocaleString()}`);
  console.log(`🔧 Oracle: ${v22Config.contracts.ORACLE.address}`);
  console.log(`📝 特性: ${v22Config.contracts.ORACLE.description}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // 1. 更新前端
  console.log('1️⃣ 更新前端配置...');
  try {
    const { contractsContent, constantsUpdate } = generateFrontendConfig();
    
    // 寫入 contracts.ts
    const contractsPath = path.join(PATHS.FRONTEND, 'src/config/contracts.ts');
    fs.writeFileSync(contractsPath, contractsContent);
    console.log(`   ✅ 已更新: ${contractsPath}`);
    
    // 更新 constants.ts (如果存在)
    const constantsPath = path.join(PATHS.FRONTEND, 'src/config/constants.ts');
    if (fs.existsSync(constantsPath)) {
      let constantsFile = fs.readFileSync(constantsPath, 'utf8');
      
      // 添加或更新 ORACLE_CONFIG
      if (constantsFile.includes('ORACLE_CONFIG')) {
        constantsFile = constantsFile.replace(
          /export const ORACLE_CONFIG = \{[\s\S]*?\};/,
          constantsUpdate.trim()
        );
      } else {
        constantsFile += '\n' + constantsUpdate;
      }
      
      fs.writeFileSync(constantsPath, constantsFile);
      console.log(`   ✅ 已更新: ${constantsPath}`);
    }
    
    successCount++;
  } catch (error) {
    console.log(`   ❌ 前端更新失敗: ${error.message}`);
    failCount++;
  }
  
  // 2. 更新後端
  console.log('\n2️⃣ 更新後端配置...');
  try {
    const configContent = generateBackendConfig();
    const configPath = path.join(PATHS.BACKEND, 'config/contracts.js');
    
    // 備份原文件
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, configPath + '.v21.backup');
    }
    
    fs.writeFileSync(configPath, configContent);
    console.log(`   ✅ 已更新: ${configPath}`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ 後端更新失敗: ${error.message}`);
    failCount++;
  }
  
  // 3. 更新子圖
  console.log('\n3️⃣ 更新子圖配置...');
  try {
    const networkContent = generateSubgraphConfig();
    const networkPath = path.join(PATHS.SUBGRAPH, 'networks.json');
    
    // 備份原文件
    if (fs.existsSync(networkPath)) {
      fs.copyFileSync(networkPath, networkPath + '.v21.backup');
    }
    
    fs.writeFileSync(networkPath, networkContent);
    console.log(`   ✅ 已更新: ${networkPath}`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ 子圖更新失敗: ${error.message}`);
    failCount++;
  }
  
  // 總結
  console.log('\n========== 同步完成 ==========');
  console.log(`✅ 成功: ${successCount} 個專案`);
  console.log(`❌ 失敗: ${failCount} 個專案`);
  console.log(`📋 版本: ${v22Config.version}`);
  console.log(`🔧 Oracle: ${v22Config.contracts.ORACLE.address}`);
  console.log('===============================\n');
  
  if (successCount > 0) {
    console.log('📌 下一步:');
    console.log('1. 前端: cd ' + PATHS.FRONTEND + ' && npm run dev');
    console.log('2. 後端: cd ' + PATHS.BACKEND + ' && npm start');
    console.log('3. 子圖: cd ' + PATHS.SUBGRAPH + ' && npm run deploy');
    console.log('4. 更新 .env 文件，添加: # V22 Deployed at ' + new Date().toISOString());
  }
}

// 執行
syncV22Config().catch(console.error);
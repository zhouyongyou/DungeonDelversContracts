#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 載入 V22 配置
const v22Config = require('../config/v22-config');

// 前端專案路徑
const FRONTEND_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers';

function generateContractsTs() {
  // 將 V22 配置轉換為前端格式
  const contracts = {};
  
  // 添加所有合約地址（轉換為大寫 key）
  for (const [name, data] of Object.entries(v22Config.contracts)) {
    // 跳過舊版本的合約
    if (name.includes('_OLD') || name.includes('_V')) continue;
    
    contracts[name] = data.address;
  }
  
  const content = `// Generated from v22-config.js on ${new Date().toISOString().split('T')[0]}
// DO NOT EDIT MANUALLY - Use npm run sync:config
// Version: ${v22Config.version} - ${v22Config.deployments.V22.description}

export const CONTRACT_ADDRESSES = {
  USD: '${contracts.USD}',
  SOULSHARD: '${contracts.SOULSHARD}',
  ORACLE: '${contracts.ORACLE}',
  PLAYERVAULT: '${contracts.PLAYERVAULT}',
  HERO: '${contracts.HERO}',
  RELIC: '${contracts.RELIC}',
  PARTY: '${contracts.PARTY}',
  VIPSTAKING: '${contracts.VIPSTAKING}',
  PLAYERPROFILE: '${contracts.PLAYERPROFILE}',
  DUNGEONCORE: '${contracts.DUNGEONCORE}',
  DUNGEONMASTER: '${contracts.DUNGEONMASTER}',
  DUNGEONSTORAGE: '${contracts.DUNGEONSTORAGE}',
  ALTAROFASCENSION: '${contracts.ALTAROFASCENSION}',
  DUNGEONMASTERWALLET: '${contracts.DUNGEONMASTERWALLET}',
  UNISWAP_POOL: '${contracts.UNISWAP_POOL}',
} as const;

export const DEPLOYMENT_VERSION = '${v22Config.version}';
export const DEPLOYMENT_DATE = '${v22Config.lastUpdated}';

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 56,
  name: 'BSC Mainnet',
  rpc: 'https://bsc-dataseed.binance.org/',
  explorer: 'https://bscscan.com'
};

// Subgraph Configuration
export const SUBGRAPH_CONFIG = {
  studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.1.0',
  decentralized: 'https://gateway.thegraph.com/api/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
  useDecentralized: import.meta.env.PROD
};

// Oracle V22 Configuration
export const ORACLE_CONFIG = {
  version: "${v22Config.version}",
  adaptivePeriods: ${JSON.stringify(v22Config.parameters.oracle.adaptivePeriods)},
  features: ${JSON.stringify(contracts.ORACLE_FEATURES || [
    "自適應 TWAP 週期",
    "自動降級機制",
    "永不失敗查詢",
    "向後兼容 V21"
  ], null, 2).replace(/\n/g, '\n  ')}
};

// Contract helper functions
export type ContractName = keyof typeof CONTRACT_ADDRESSES;

export interface ContractInfo {
  address: string;
  name: string;
}

/**
 * Get contract information by chain ID and contract name
 * @param chainId - The chain ID (56 for BSC Mainnet)
 * @param contractName - The name of the contract
 * @returns Contract information or undefined if not found
 */
export function getContract(chainId: number, contractName: ContractName | keyof typeof LEGACY_CONTRACT_NAMES): ContractInfo | undefined {
  // Only support BSC Mainnet for now
  if (chainId !== 56) {
    return undefined;
  }

  // Try to get address directly (uppercase format)
  let address = CONTRACT_ADDRESSES[contractName as ContractName];
  let finalContractName = contractName as ContractName;

  // If not found, try legacy name mapping (lowercase format)
  if (!address && contractName in LEGACY_CONTRACT_NAMES) {
    finalContractName = LEGACY_CONTRACT_NAMES[contractName as keyof typeof LEGACY_CONTRACT_NAMES] as ContractName;
    address = CONTRACT_ADDRESSES[finalContractName];
  }

  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return undefined;
  }

  return {
    address,
    name: finalContractName
  };
}

/**
 * Get contract address by name (legacy compatibility)
 * @param contractName - The name of the contract
 * @returns Contract address or undefined
 */
export function getContractAddress(contractName: ContractName): string | undefined {
  const address = CONTRACT_ADDRESSES[contractName];
  return (address && address !== '0x0000000000000000000000000000000000000000') ? address : undefined;
}

// Legacy contract name mappings for backward compatibility
export const LEGACY_CONTRACT_NAMES = {
  soulShard: 'SOULSHARD',
  hero: 'HERO',
  relic: 'RELIC',
  party: 'PARTY',
  dungeonCore: 'DUNGEONCORE',
  dungeonMaster: 'DUNGEONMASTER',
  dungeonStorage: 'DUNGEONSTORAGE',
  playerVault: 'PLAYERVAULT',
  playerProfile: 'PLAYERPROFILE',
  vipStaking: 'VIPSTAKING',
  oracle: 'ORACLE',
  altarOfAscension: 'ALTAROFASCENSION',
  dungeonMasterWallet: 'DUNGEONMASTERWALLET',
  uniswapPool: 'UNISWAP_POOL',
  usd: 'USD'
} as const;
`;

  return content;
}

// 執行同步
function syncV22Config() {
  console.log('🔄 同步 V22 配置到前端...\n');
  console.log(`📋 版本: ${v22Config.version}`);
  console.log(`📅 最後更新: ${v22Config.lastUpdated}`);
  console.log(`🌐 網路: ${v22Config.network}\n`);
  
  // 生成並寫入 contracts.ts
  const contractsTsPath = path.join(FRONTEND_PATH, 'src/config/contracts.ts');
  const content = generateContractsTs();
  
  fs.writeFileSync(contractsTsPath, content, 'utf8');
  console.log(`✅ 已更新: ${contractsTsPath}`);
  
  // 顯示更新的合約
  console.log('\n📄 更新的合約地址:');
  for (const [name, data] of Object.entries(v22Config.contracts)) {
    if (!name.includes('_OLD') && !name.includes('_V')) {
      console.log(`   ${name}: ${data.address}`);
    }
  }
  
  console.log('\n✅ V22 配置同步完成！');
  console.log('\n📌 下一步:');
  console.log('1. 在前端專案執行 npm install');
  console.log('2. 執行 npm run dev 測試');
  console.log('3. 檢查 AdminPage 是否正常顯示參數');
}

// 執行同步
syncV22Config();
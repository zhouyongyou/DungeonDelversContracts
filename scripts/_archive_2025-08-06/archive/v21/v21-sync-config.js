#!/usr/bin/env node

// V21 配置同步工具
// 從中央配置更新所有項目

const fs = require('fs');
const path = require('path');
const config = require('../config/v21-config');

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 生成 TypeScript 格式的配置
function generateTypeScriptConfig() {
  const contracts = config.contracts;
  let tsContent = `// Generated from v21-config.js on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use npm run sync:config

export const CONTRACT_ADDRESSES = {
`;

  for (const [key, value] of Object.entries(contracts)) {
    if (value.address && key !== 'UNISWAP_POOL' && key !== 'DUNGEONMASTERWALLET') {
      tsContent += `  ${key}: '${value.address}',\n`;
    }
  }

  tsContent += `  DUNGEONMASTERWALLET: '${contracts.DUNGEONMASTERWALLET.address}',\n`;
  tsContent += `} as const;\n\n`;
  
  tsContent += `export const DEPLOYMENT_VERSION = '${config.version}';\n`;
  tsContent += `export const DEPLOYMENT_DATE = '${config.lastUpdated}';\n\n`;
  
  // 添加網路配置
  tsContent += `// Network Configuration\n`;
  tsContent += `export const NETWORK_CONFIG = {\n`;
  tsContent += `  chainId: 56,\n`;
  tsContent += `  name: 'BSC Mainnet',\n`;
  tsContent += `  rpc: 'https://bsc-dataseed.binance.org/',\n`;
  tsContent += `  explorer: 'https://bscscan.com'\n`;
  tsContent += `};\n\n`;
  
  // 添加 Subgraph 配置
  tsContent += `// Subgraph Configuration\n`;
  tsContent += `export const SUBGRAPH_CONFIG = {\n`;
  tsContent += `  studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.1.0',\n`;
  tsContent += `  decentralized: 'https://gateway.thegraph.com/api/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',\n`;
  tsContent += `  useDecentralized: import.meta.env.PROD\n`;
  tsContent += `};\n\n`;
  
  // 添加輔助函數和類型
  tsContent += `// Contract helper functions\n`;
  tsContent += `export type ContractName = keyof typeof CONTRACT_ADDRESSES;\n\n`;
  
  tsContent += `export interface ContractInfo {\n`;
  tsContent += `  address: string;\n`;
  tsContent += `  name: string;\n`;
  tsContent += `}\n\n`;
  
  // 添加 getContract 函數
  tsContent += `/**\n`;
  tsContent += ` * Get contract information by chain ID and contract name\n`;
  tsContent += ` * @param chainId - The chain ID (56 for BSC Mainnet)\n`;
  tsContent += ` * @param contractName - The name of the contract\n`;
  tsContent += ` * @returns Contract information or undefined if not found\n`;
  tsContent += ` */\n`;
  tsContent += `export function getContract(chainId: number, contractName: ContractName | keyof typeof LEGACY_CONTRACT_NAMES): ContractInfo | undefined {\n`;
  tsContent += `  // Only support BSC Mainnet for now\n`;
  tsContent += `  if (chainId !== 56) {\n`;
  tsContent += `    return undefined;\n`;
  tsContent += `  }\n\n`;
  tsContent += `  // Try to get address directly (uppercase format)\n`;
  tsContent += `  let address = CONTRACT_ADDRESSES[contractName as ContractName];\n`;
  tsContent += `  let finalContractName = contractName as ContractName;\n\n`;
  tsContent += `  // If not found, try legacy name mapping (lowercase format)\n`;
  tsContent += `  if (!address && contractName in LEGACY_CONTRACT_NAMES) {\n`;
  tsContent += `    finalContractName = LEGACY_CONTRACT_NAMES[contractName as keyof typeof LEGACY_CONTRACT_NAMES] as ContractName;\n`;
  tsContent += `    address = CONTRACT_ADDRESSES[finalContractName];\n`;
  tsContent += `  }\n\n`;
  tsContent += `  if (!address || address === '0x0000000000000000000000000000000000000000') {\n`;
  tsContent += `    return undefined;\n`;
  tsContent += `  }\n\n`;
  tsContent += `  return {\n`;
  tsContent += `    address,\n`;
  tsContent += `    name: finalContractName\n`;
  tsContent += `  };\n`;
  tsContent += `}\n\n`;
  
  // 添加 getContractAddress 函數
  tsContent += `/**\n`;
  tsContent += ` * Get contract address by name (legacy compatibility)\n`;
  tsContent += ` * @param contractName - The name of the contract\n`;
  tsContent += ` * @returns Contract address or undefined\n`;
  tsContent += ` */\n`;
  tsContent += `export function getContractAddress(contractName: ContractName): string | undefined {\n`;
  tsContent += `  const address = CONTRACT_ADDRESSES[contractName];\n`;
  tsContent += `  return (address && address !== '0x0000000000000000000000000000000000000000') ? address : undefined;\n`;
  tsContent += `}\n\n`;
  
  // 添加 Legacy contract names
  tsContent += `// Legacy contract name mappings for backward compatibility\n`;
  tsContent += `export const LEGACY_CONTRACT_NAMES = {\n`;
  tsContent += `  soulShard: 'SOULSHARD',\n`;
  tsContent += `  hero: 'HERO',\n`;
  tsContent += `  relic: 'RELIC',\n`;
  tsContent += `  party: 'PARTY',\n`;
  tsContent += `  dungeonCore: 'DUNGEONCORE',\n`;
  tsContent += `  dungeonMaster: 'DUNGEONMASTER',\n`;
  tsContent += `  dungeonStorage: 'DUNGEONSTORAGE',\n`;
  tsContent += `  playerVault: 'PLAYERVAULT',\n`;
  tsContent += `  playerProfile: 'PLAYERPROFILE',\n`;
  tsContent += `  vipStaking: 'VIPSTAKING',\n`;
  tsContent += `  oracle: 'ORACLE',\n`;
  tsContent += `  altarOfAscension: 'ALTAROFASCENSION',\n`;
  tsContent += `  dungeonMasterWallet: 'DUNGEONMASTERWALLET'\n`;
  tsContent += `} as const;\n`;

  return tsContent;
}

// 生成 .env 格式的配置
function generateEnvConfig() {
  const contracts = config.contracts;
  let envContent = `# Generated from v21-config.js on ${new Date().toISOString()}\n`;
  envContent += `# DO NOT EDIT MANUALLY - Use npm run sync:config\n\n`;
  envContent += `# Version: ${config.version}\n\n`;

  for (const [key, value] of Object.entries(contracts)) {
    if (value.address) {
      envContent += `${key}_ADDRESS=${value.address}\n`;
    }
  }

  return envContent;
}

// 生成 JSON 格式的配置（用於 subgraph）
function generateJsonConfig() {
  const contracts = config.contracts;
  const jsonConfig = {
    network: "bsc",
    contracts: {}
  };

  for (const [key, value] of Object.entries(contracts)) {
    if (value.address) {
      jsonConfig.contracts[key.toLowerCase()] = value.address;
    }
  }

  return JSON.stringify(jsonConfig, null, 2);
}

// 更新 YAML 格式的配置（用於 subgraph）
function updateYamlConfig(existingYaml) {
  const contracts = config.contracts;
  let updatedYaml = existingYaml;
  
  // 更新合約地址
  const contractsToUpdate = [
    { name: 'Hero', key: 'HERO' },
    { name: 'Relic', key: 'RELIC' },
    { name: 'Party', key: 'PARTY' },
    { name: 'VIPStaking', key: 'VIPSTAKING' },
    { name: 'PlayerProfile', key: 'PLAYERPROFILE' },
    { name: 'DungeonMaster', key: 'DUNGEONMASTER' },
    { name: 'DungeonStorage', key: 'DUNGEONSTORAGE' },
    { name: 'AltarOfAscension', key: 'ALTAROFASCENSION' }
  ];
  
  contractsToUpdate.forEach(({ name, key }) => {
    if (contracts[key] && contracts[key].address) {
      const regex = new RegExp(`(name: ${name}[\\s\\S]*?address: )['"]0x[a-fA-F0-9]{40}['"]`, 'g');
      updatedYaml = updatedYaml.replace(regex, `$1'${contracts[key].address}'`);
    }
  });
  
  // 添加更新註釋
  const updateComment = `# Generated from v21-config.js on ${new Date().toISOString()}\n# DO NOT EDIT MANUALLY - Use npm run sync:config\n`;
  if (!updatedYaml.startsWith('# Generated from')) {
    updatedYaml = updateComment + updatedYaml;
  }
  
  return updatedYaml;
}

// 同步配置到目標
async function syncConfig() {
  log('🔄 V21 配置同步工具\n', 'blue');
  log(`版本: ${config.version}`, 'green');
  log(`更新時間: ${config.lastUpdated}\n`, 'green');

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // 同步到各個目標
  for (const [target, settings] of Object.entries(config.syncTargets)) {
    log(`\n📝 同步到 ${target}...`, 'yellow');
    
    try {
      let content;
      
      switch (settings.format) {
        case 'typescript':
          content = generateTypeScriptConfig();
          break;
        case 'env':
          content = generateEnvConfig();
          break;
        case 'json':
          content = generateJsonConfig();
          break;
        case 'yaml':
          // 對於 YAML，需要先讀取現有內容再更新
          const existingYaml = fs.readFileSync(settings.path, 'utf8');
          content = updateYamlConfig(existingYaml);
          break;
        default:
          throw new Error(`未知的格式: ${settings.format}`);
      }
      
      // 檢查目標文件是否存在
      if (!fs.existsSync(settings.path)) {
        log(`   ⚠️ 目標文件不存在: ${settings.path}`, 'yellow');
        results.skipped.push({ target, reason: '文件不存在' });
        continue;
      }
      
      // 備份原文件
      const backupPath = `${settings.path}.backup-${Date.now()}`;
      fs.copyFileSync(settings.path, backupPath);
      log(`   ✅ 備份已創建: ${path.basename(backupPath)}`, 'green');
      
      // 寫入新配置
      if (settings.format === 'env') {
        // 對於 .env 文件，只更新相關部分
        let existingContent = fs.readFileSync(settings.path, 'utf8');
        
        // 移除舊的合約地址部分
        const lines = existingContent.split('\n');
        const filteredLines = lines.filter(line => {
          return !line.trim().match(/^(ORACLE|HERO|RELIC|PARTY|DUNGEONCORE|PLAYERVAULT|VIPSTAKING|PLAYERPROFILE|DUNGEONSTORAGE|DUNGEONMASTER|ALTAROFASCENSION)_ADDRESS=/);
        });
        
        // 添加新的配置
        const finalContent = filteredLines.join('\n') + '\n\n' + content;
        fs.writeFileSync(settings.path, finalContent);
      } else {
        // 直接覆蓋其他格式
        fs.writeFileSync(settings.path, content);
      }
      
      log(`   ✅ 配置已更新`, 'green');
      results.success.push(target);
      
    } catch (error) {
      log(`   ❌ 同步失敗: ${error.message}`, 'red');
      results.failed.push({ target, error: error.message });
    }
  }

  // 顯示總結
  log('\n📊 同步總結:', 'blue');
  log(`   ✅ 成功: ${results.success.length}`, 'green');
  log(`   ❌ 失敗: ${results.failed.length}`, 'red');
  log(`   ⚠️ 跳過: ${results.skipped.length}`, 'yellow');
  
  if (results.failed.length > 0) {
    log('\n失敗詳情:', 'red');
    results.failed.forEach(item => {
      log(`   - ${item.target}: ${item.error}`, 'red');
    });
  }
  
  // 生成同步報告
  const report = {
    timestamp: new Date().toISOString(),
    version: config.version,
    results
  };
  
  const reportPath = path.join(__dirname, '..', 'v21-sync-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 同步報告已保存: ${reportPath}`, 'green');
  
  // 添加到 package.json scripts
  log('\n💡 建議添加到 package.json:', 'yellow');
  log('  "scripts": {');
  log('    "sync:config": "node scripts/v21-sync-config.js",');
  log('    "sync:check": "node scripts/v21-check-config.js"');
  log('  }');
}

// 執行同步
syncConfig().catch(console.error);
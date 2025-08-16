#!/usr/bin/env node

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

// 載入主配置
const masterConfigPath = path.join(__dirname, '../config/master-config.json');
const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));

// 專案路徑
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// 同步函數
async function syncConfigs() {
  log('\n🔄 開始同步配置到所有專案...', 'magenta');
  log(`📋 主配置版本: ${masterConfig.version}`, 'cyan');
  log(`📅 最後更新: ${masterConfig.lastUpdated}`, 'cyan');
  log('='.repeat(70), 'magenta');

  // 1. 更新前端
  updateFrontend();
  
  // 2. 更新後端
  updateBackend();
  
  // 3. 更新合約專案
  updateContracts();

  log('\n✅ 所有配置同步完成！', 'green');
  log('\n📋 下一步：', 'cyan');
  log('1. 提交更改到 Git', 'yellow');
  log('2. 部署前端和後端', 'yellow');
  log('3. 執行功能測試', 'yellow');
}

function updateFrontend() {
  log('\n📱 更新前端配置...', 'yellow');
  
  // 1. 更新 .env
  const frontendEnvPath = path.join(PROJECTS.frontend, '.env');
  let envContent = '';
  
  // 如果存在現有 .env，讀取並保留非合約相關的配置
  if (fs.existsSync(frontendEnvPath)) {
    const existingEnv = fs.readFileSync(frontendEnvPath, 'utf8');
    const lines = existingEnv.split('\n');
    
    // 保留非地址相關的配置
    lines.forEach(line => {
      if (line && !line.includes('_ADDRESS') && !line.includes('GRAPH')) {
        envContent += line + '\n';
      }
    });
  }
  
  // 添加合約地址（使用 VITE_ 前綴）
  envContent += '\n# Contract Addresses (V15)\n';
  Object.entries(masterConfig.contracts.mainnet).forEach(([key, value]) => {
    envContent += `VITE_${key}=${value}\n`;
  });
  
  // 添加子圖配置
  envContent += '\n# The Graph Configuration\n';
  envContent += `VITE_GRAPH_STUDIO_URL=${masterConfig.subgraph.studio.url}\n`;
  envContent += `VITE_GRAPH_DECENTRALIZED_URL=${masterConfig.subgraph.decentralized.url}\n`;
  
  fs.writeFileSync(frontendEnvPath, envContent);
  log('✅ 前端 .env 更新完成', 'green');
  
  // 2. 更新 contracts.ts
  updateFrontendContracts();
  
  // 3. 更新 env.ts
  updateFrontendEnv();
}

function updateFrontendContracts() {
  const contractsPath = path.join(PROJECTS.frontend, 'src/config/contracts.ts');
  
  let content = `// DungeonDelvers Contract Configuration
// Auto-generated from master-config.json
// Version: ${masterConfig.version}
// Updated: ${new Date().toISOString()}

export const CONTRACT_ADDRESSES = {
`;

  Object.entries(masterConfig.contracts.mainnet).forEach(([key, value]) => {
    const name = key.replace('_ADDRESS', '');
    content += `  ${name}: '${value}',\n`;
  });

  content += `} as const;

export const DEPLOYMENT_VERSION = '${masterConfig.version}';
export const DEPLOYMENT_DATE = '${masterConfig.lastUpdated}';

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: ${masterConfig.network.chainId},
  name: '${masterConfig.network.name}',
  rpc: '${masterConfig.network.rpc}',
  explorer: '${masterConfig.network.explorer}'
};

// Subgraph Configuration
export const SUBGRAPH_CONFIG = {
  studio: '${masterConfig.subgraph.studio.url}',
  decentralized: '${masterConfig.subgraph.decentralized.url}',
  useDecentralized: process.env.NODE_ENV === 'production'
};
`;

  fs.writeFileSync(contractsPath, content);
  log('✅ 前端 contracts.ts 更新完成', 'green');
}

function updateFrontendEnv() {
  const envTsPath = path.join(PROJECTS.frontend, 'src/config/env.ts');
  
  if (fs.existsSync(envTsPath)) {
    let content = fs.readFileSync(envTsPath, 'utf8');
    
    // 更新子圖 URL
    content = content.replace(
      /STUDIO_URL:.*'https:\/\/api\.studio\.thegraph\.com.*?'/,
      `STUDIO_URL: import.meta.env.VITE_THE_GRAPH_API_URL || \n                '${masterConfig.subgraph.studio.url}'`
    );
    
    content = content.replace(
      /NETWORK_URL:.*'https:\/\/gateway\.thegraph\.com.*?'/,
      `NETWORK_URL: import.meta.env.VITE_THE_GRAPH_NETWORK_URL ||\n                 '${masterConfig.subgraph.decentralized.url}'`
    );
    
    fs.writeFileSync(envTsPath, content);
    log('✅ 前端 env.ts 更新完成', 'green');
  }
}

function updateBackend() {
  log('\n🖥️  更新後端配置...', 'yellow');
  
  const backendEnvPath = path.join(PROJECTS.backend, '.env');
  let envContent = '';
  
  // 保留現有的非地址配置
  if (fs.existsSync(backendEnvPath)) {
    const existingEnv = fs.readFileSync(backendEnvPath, 'utf8');
    const lines = existingEnv.split('\n');
    
    lines.forEach(line => {
      if (line && !line.includes('_ADDRESS') && !line.includes('VERSION')) {
        envContent += line + '\n';
      }
    });
  }
  
  // 添加合約地址
  envContent += '\n# Contract Addresses (V15)\n';
  Object.entries(masterConfig.contracts.mainnet).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });
  
  // 添加版本信息
  envContent += `\n# Version Info\n`;
  envContent += `VERSION=${masterConfig.version}\n`;
  envContent += `DEPLOYMENT_DATE=${masterConfig.lastUpdated}\n`;
  
  fs.writeFileSync(backendEnvPath, envContent);
  log('✅ 後端 .env 更新完成', 'green');
}

function updateContracts() {
  log('\n📝 更新合約專案配置...', 'yellow');
  
  // 更新 config/contracts.json
  const contractsJsonPath = path.join(PROJECTS.contracts, 'config/contracts.json');
  const contractsJson = {
    version: masterConfig.version,
    network: 'bsc',
    timestamp: masterConfig.lastUpdated,
    contracts: masterConfig.contracts.mainnet
  };
  
  fs.writeFileSync(contractsJsonPath, JSON.stringify(contractsJson, null, 2));
  log('✅ config/contracts.json 更新完成', 'green');
  
  // 更新 .env
  const contractsEnvPath = path.join(PROJECTS.contracts, '.env');
  if (fs.existsSync(contractsEnvPath)) {
    let content = fs.readFileSync(contractsEnvPath, 'utf8');
    
    // 更新地址
    Object.entries(masterConfig.contracts.mainnet).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${value}`);
      }
    });
    
    fs.writeFileSync(contractsEnvPath, content);
    log('✅ 合約 .env 更新完成', 'green');
  }
}

// 執行同步
syncConfigs().catch(error => {
  log(`\n❌ 同步失敗: ${error.message}`, 'red');
  process.exit(1);
});
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 專案路徑（根據 CLAUDE.md）
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers/',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/'
};

async function deployToProjects() {
  log('\n🚀 開始部署 V15 配置到各專案', 'magenta');
  log('='.repeat(70), 'magenta');

  try {
    // 1. 更新前端
    log('\n📱 更新前端專案...', 'yellow');
    updateFrontend();

    // 2. 更新後端
    log('\n🖥️  更新後端專案...', 'yellow');
    updateBackend();

    // 3. 更新子圖
    log('\n📊 更新子圖專案...', 'yellow');
    updateSubgraph();

    log('\n✅ 所有專案更新完成！', 'green');
    log('\n📋 後續步驟:', 'cyan');
    log('1. 前端: cd ' + PROJECTS.frontend + ' && npm run build', 'yellow');
    log('2. 後端: cd ' + PROJECTS.backend + ' && npm restart', 'yellow');
    log('3. 子圖: cd ' + PROJECTS.subgraph + ' && npm run deploy', 'yellow');

  } catch (error) {
    log(`\n❌ 部署失敗: ${error.message}`, 'red');
    console.error(error);
  }
}

function updateFrontend() {
  const frontendEnvPath = path.join(PROJECTS.frontend, '.env');
  const sourceEnvPath = path.join(__dirname, '../../deployments/frontend-v15.env');

  // 備份現有的 .env
  if (fs.existsSync(frontendEnvPath)) {
    const backupPath = frontendEnvPath + '.backup-' + Date.now();
    fs.copyFileSync(frontendEnvPath, backupPath);
    log(`📦 備份前端 .env 到: ${backupPath}`, 'cyan');
  }

  // 複製新的 .env
  fs.copyFileSync(sourceEnvPath, frontendEnvPath);
  log('✅ 前端 .env 更新完成', 'green');

  // 更新 src/config/contracts.ts (如果存在)
  const contractsConfigPath = path.join(PROJECTS.frontend, 'src/config/contracts.ts');
  if (fs.existsSync(contractsConfigPath)) {
    updateFrontendContractsConfig(contractsConfigPath);
  }
}

function updateFrontendContractsConfig(configPath) {
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
    DUNGEONMASTERWALLET_ADDRESS: "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
  };

  let contractsConfig = `// DungeonDelvers V15 Contract Addresses
// Generated: ${new Date().toISOString()}
// Network: BSC Mainnet

export const CONTRACT_ADDRESSES = {
  // Token Contracts
  TESTUSD: "${V15_ADDRESSES.TESTUSD_ADDRESS}",
  SOULSHARD: "${V15_ADDRESSES.SOULSHARD_ADDRESS}",
  
  // NFT Contracts
  HERO: "${V15_ADDRESSES.HERO_ADDRESS}",
  RELIC: "${V15_ADDRESSES.RELIC_ADDRESS}",
  PARTY: "${V15_ADDRESSES.PARTY_ADDRESS}",
  
  // Core Contracts
  DUNGEONCORE: "${V15_ADDRESSES.DUNGEONCORE_ADDRESS}",
  DUNGEONMASTER: "${V15_ADDRESSES.DUNGEONMASTER_ADDRESS}",
  DUNGEONSTORAGE: "${V15_ADDRESSES.DUNGEONSTORAGE_ADDRESS}",
  
  // Player Contracts
  PLAYERVAULT: "${V15_ADDRESSES.PLAYERVAULT_ADDRESS}",
  PLAYERPROFILE: "${V15_ADDRESSES.PLAYERPROFILE_ADDRESS}",
  VIPSTAKING: "${V15_ADDRESSES.VIPSTAKING_ADDRESS}",
  
  // Oracle
  ORACLE: "${V15_ADDRESSES.ORACLE_ADDRESS}",
  
  // Wallet
  DUNGEONMASTERWALLET: "${V15_ADDRESSES.DUNGEONMASTERWALLET_ADDRESS}"
} as const;

export const DEPLOYMENT_VERSION = "V15";
export const DEPLOYMENT_DATE = "2025-07-23";
`;

  fs.writeFileSync(configPath, contractsConfig);
  log('✅ 前端 contracts.ts 更新完成', 'green');
}

function updateBackend() {
  const backendEnvPath = path.join(PROJECTS.backend, '.env');
  const sourceEnvPath = path.join(__dirname, '../../deployments/backend-v15.env');

  // 備份現有的 .env
  if (fs.existsSync(backendEnvPath)) {
    const backupPath = backendEnvPath + '.backup-' + Date.now();
    fs.copyFileSync(backendEnvPath, backupPath);
    log(`📦 備份後端 .env 到: ${backupPath}`, 'cyan');
  }

  // 讀取現有的 .env 保留非合約地址的配置
  let existingEnv = '';
  if (fs.existsSync(backendEnvPath)) {
    existingEnv = fs.readFileSync(backendEnvPath, 'utf8');
  }

  // 讀取新的配置
  const newEnv = fs.readFileSync(sourceEnvPath, 'utf8');

  // 合併配置（保留原有的 API keys 等）
  const mergedEnv = mergeEnvFiles(existingEnv, newEnv);
  fs.writeFileSync(backendEnvPath, mergedEnv);
  log('✅ 後端 .env 更新完成', 'green');

  // 更新 src/index.js 或 src/contractReader.js 中的硬編碼地址
  updateBackendSourceFiles();
}

function mergeEnvFiles(existing, newConfig) {
  const existingLines = existing.split('\n');
  const newLines = newConfig.split('\n');
  
  // 保存現有的非地址配置
  const preservedConfigs = {};
  existingLines.forEach(line => {
    if (line.includes('=') && !line.includes('_ADDRESS')) {
      const [key] = line.split('=');
      if (!['VERSION', 'DEPLOYMENT_DATE'].includes(key.trim())) {
        preservedConfigs[key.trim()] = line;
      }
    }
  });

  // 合併配置
  let merged = newConfig;
  Object.values(preservedConfigs).forEach(line => {
    const [key] = line.split('=');
    const regex = new RegExp(`^${key.trim()}=.*$`, 'gm');
    if (!merged.match(regex)) {
      merged += '\n' + line;
    }
  });

  return merged;
}

function updateBackendSourceFiles() {
  // 更新可能的硬編碼地址文件
  const possibleFiles = [
    'src/index.js',
    'src/contractReader.js',
    'src/config.js',
    'src/contracts.js'
  ];

  possibleFiles.forEach(file => {
    const filePath = path.join(PROJECTS.backend, file);
    if (fs.existsSync(filePath)) {
      updateBackendFile(filePath);
    }
  });
}

function updateBackendFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const oldAddresses = [
    // 舊的 V12 或其他版本地址
    '0xB75BB304AaBfB12B3A428BE77d6a0A9052671925', // 舊 Oracle
    '0xaa3166b87648F10E7C8A59f000E48d21A1A048C1', // 舊 Hero
    // ... 添加其他需要替換的舊地址
  ];

  const V15_MAP = {
    '0xB75BB304AaBfB12B3A428BE77d6a0A9052671925': '0x623caa925445BeACd54Cc6C62Bb725B5d93698af', // Oracle
    '0xaa3166b87648F10E7C8A59f000E48d21A1A048C1': '0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2', // Hero
    // ... 添加其他映射
  };

  let updated = false;
  Object.entries(V15_MAP).forEach(([old, newAddr]) => {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old, 'g'), newAddr);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    log(`✅ 更新 ${path.basename(filePath)} 中的合約地址`, 'green');
  }
}

function updateSubgraph() {
  const subgraphYamlPath = path.join(PROJECTS.subgraph, 'subgraph.yaml');
  const sourceYamlPath = path.join(__dirname, '../../deployments/subgraph-v15.yaml');

  // 備份現有的 subgraph.yaml
  if (fs.existsSync(subgraphYamlPath)) {
    const backupPath = subgraphYamlPath + '.backup-' + Date.now();
    fs.copyFileSync(subgraphYamlPath, backupPath);
    log(`📦 備份子圖配置到: ${backupPath}`, 'cyan');
  }

  // 複製新的配置
  fs.copyFileSync(sourceYamlPath, subgraphYamlPath);
  log('✅ 子圖 subgraph.yaml 更新完成', 'green');

  // 檢查是否需要更新 ABI 文件
  updateSubgraphABIs();
}

function updateSubgraphABIs() {
  const abisSourceDir = path.join(__dirname, '../../artifacts/contracts');
  const abisTargetDir = path.join(PROJECTS.subgraph, 'abis');

  // 確保目標目錄存在
  if (!fs.existsSync(abisTargetDir)) {
    fs.mkdirSync(abisTargetDir, { recursive: true });
  }

  // 需要複製的 ABI 文件
  const abiFiles = [
    { source: 'nft/Hero.sol/Hero.json', target: 'Hero.json' },
    { source: 'nft/Relic.sol/Relic.json', target: 'Relic.json' },
    { source: 'nft/Party.sol/Party.json', target: 'Party.json' },
    { source: 'staking/VIPStaking.sol/VIPStaking.json', target: 'VIPStaking.json' },
    { source: 'player/PlayerProfile.sol/PlayerProfile.json', target: 'PlayerProfile.json' }
  ];

  abiFiles.forEach(({ source, target }) => {
    const sourcePath = path.join(abisSourceDir, source);
    const targetPath = path.join(abisTargetDir, target);

    if (fs.existsSync(sourcePath)) {
      // 讀取完整的 artifact 文件
      const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      // 只提取 ABI 部分
      fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));
      log(`✅ 複製 ABI: ${target}`, 'green');
    } else {
      log(`⚠️  找不到 ABI 文件: ${source}`, 'yellow');
    }
  });
}

// 執行部署
deployToProjects();
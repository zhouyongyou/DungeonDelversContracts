#!/usr/bin/env node
/**
 * 🚀 V25 統一配置同步腳本
 * 
 * 功能：
 * - 從 .env.v25 讀取所有配置
 * - 自動同步到前端、後端、子圖
 * - 複製 ABI 文件到各項目
 * - 驗證同步結果
 * 
 * 使用方法：
 * npm run sync-all
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 開始 V25 統一配置同步...\n');

// 1. 讀取主配置文件
const envFile = path.join(__dirname, '../.env.v25');
if (!fs.existsSync(envFile)) {
  console.error('❌ 找不到 .env.v25 文件');
  process.exit(1);
}

const envContent = fs.readFileSync(envFile, 'utf8');
const config = {};

// 解析 env 文件
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, value] = line.split('=');
    config[key] = value;
  }
});

console.log(`✅ 載入配置: ${Object.keys(config).length} 項設定\n`);

// 2. 同步到前端項目
function syncToFrontend() {
  console.log('🎨 同步前端配置...');
  
  const frontendPath = config.FRONTEND_PATH;
  if (!frontendPath || !fs.existsSync(frontendPath)) {
    console.log('⚠️  前端路徑不存在，跳過');
    return;
  }

  // 創建前端 .env 文件
  const frontendEnv = Object.entries(config)
    .filter(([key]) => key.startsWith('VITE_'))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const frontendEnvHeader = `# Auto-generated from .env.v25
# DO NOT EDIT MANUALLY
# Last sync: ${new Date().toISOString()}

`;

  fs.writeFileSync(
    path.join(frontendPath, '.env'),
    frontendEnvHeader + frontendEnv
  );

  // 同時更新 .env.local (本地開發用)
  fs.writeFileSync(
    path.join(frontendPath, '.env.local'),
    frontendEnvHeader + frontendEnv
  );

  console.log('✅ 前端配置已同步');
}

// 3. 同步到後端項目
function syncToBackend() {
  console.log('🔧 同步後端配置...');
  
  const backendPath = config.BACKEND_PATH;
  if (!backendPath || !fs.existsSync(backendPath)) {
    console.log('⚠️  後端路徑不存在，跳過');
    return;
  }

  // 創建後端配置 JSON
  const backendConfig = {
    network: "bsc",
    chainId: parseInt(config.VITE_CHAIN_ID),
    rpcUrl: "https://bsc-dataseed1.binance.org/",
    contracts: {
      dungeonStorage: config.VITE_DUNGEONSTORAGE_ADDRESS,
      dungeonMaster: config.VITE_DUNGEONMASTER_ADDRESS,
      hero: config.VITE_HERO_ADDRESS,
      relic: config.VITE_RELIC_ADDRESS,
      altarOfAscension: config.VITE_ALTAROFASCENSION_ADDRESS,
      party: config.VITE_PARTY_ADDRESS,
      dungeonCore: config.VITE_DUNGEONCORE_ADDRESS,
      playerVault: config.VITE_PLAYERVAULT_ADDRESS,
      playerProfile: config.VITE_PLAYERPROFILE_ADDRESS,
      vipStaking: config.VITE_VIPSTAKING_ADDRESS,
      oracle: config.VITE_ORACLE_ADDRESS,
      soulShard: config.VITE_SOULSHARD_ADDRESS,
      usd: config.VITE_USD_ADDRESS,
      uniswapPool: config.VITE_UNISWAP_POOL_ADDRESS,
      vrfManagerV2Plus: config.VITE_VRFMANAGER_ADDRESS
    },
    vrf: {
      coordinatorAddress: "0xDA3b641D438362C440Ac5458c57e00a712b66700",
      subscriptionId: "29062",
      keyHash: "0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab6e6e742f88ecdfb8738e",
      callbackGasLimit: "2500000",
      requestConfirmations: "3",
      numWords: "1",
      mode: "subscription"
    },
    subgraph: {
      url: config.VITE_SUBGRAPH_URL,
      version: config.VITE_SUBGRAPH_URL.split('/').pop()
    },
    deployment: {
      version: config.VITE_CONTRACT_VERSION,
      date: config.VITE_DEPLOYMENT_DATE,
      startBlock: config.VITE_START_BLOCK
    }
  };

  fs.writeFileSync(
    path.join(backendPath, 'config', 'contracts.json'),
    JSON.stringify(backendConfig, null, 2)
  );

  console.log('✅ 後端配置已同步');
}

// 4. 同步到子圖項目
function syncToSubgraph() {
  console.log('📊 同步子圖配置...');
  
  const subgraphPath = config.SUBGRAPH_PATH;
  if (!subgraphPath || !fs.existsSync(subgraphPath)) {
    console.log('⚠️  子圖路徑不存在，跳過');
    return;
  }

  // 更新子圖的 config.ts
  const subgraphConfig = `/**
 * Subgraph Configuration
 * Generated on ${new Date().toISOString()}
 * DO NOT EDIT MANUALLY - Use sync-system to update
 */

// Contract addresses
export const HERO_ADDRESS = '${config.VITE_HERO_ADDRESS}';
export const RELIC_ADDRESS = '${config.VITE_RELIC_ADDRESS}';
export const PARTY_ADDRESS = '${config.VITE_PARTY_ADDRESS}';
export const VIP_STAKING_ADDRESS = '${config.VITE_VIPSTAKING_ADDRESS}';
export const PLAYER_PROFILE_ADDRESS = '${config.VITE_PLAYERPROFILE_ADDRESS}';
export const ALTAR_OF_ASCENSION_ADDRESS = '${config.VITE_ALTAROFASCENSION_ADDRESS}';
export const DUNGEON_MASTER_ADDRESS = '${config.VITE_DUNGEONMASTER_ADDRESS}';
export const PLAYER_VAULT_ADDRESS = '${config.VITE_PLAYERVAULT_ADDRESS}';
export const VRF_MANAGER_ADDRESS = '${config.VITE_VRFMANAGER_ADDRESS}';

// Network info
export const NETWORK = 'bsc';
export const START_BLOCK = ${config.VITE_START_BLOCK};
export const VERSION = '${config.VITE_SUBGRAPH_URL.split('/').pop()}';

// Helper function to create consistent entity IDs
export function createEntityId(contractAddress: string, tokenId: string): string {
  return contractAddress.toLowerCase() + '-' + tokenId;
}

// Helper functions to get contract addresses
export function getHeroContractAddress(): string {
  return HERO_ADDRESS.toLowerCase();
}

export function getRelicContractAddress(): string {
  return RELIC_ADDRESS.toLowerCase();
}

export function getPartyContractAddress(): string {
  return PARTY_ADDRESS.toLowerCase();
}
`;

  fs.writeFileSync(
    path.join(subgraphPath, 'src', 'config.ts'),
    subgraphConfig
  );

  console.log('✅ 子圖配置已同步');
}

// 5. 複製 ABI 文件
function syncABIs() {
  console.log('📄 同步 ABI 文件...');
  
  const contractsPath = config.CONTRACTS_PATH;
  const abiSourceDir = path.join(contractsPath, 'abis');
  
  if (!fs.existsSync(abiSourceDir)) {
    console.log('⚠️  ABI 源目錄不存在，跳過');
    return;
  }

  // ABI 文件映射
  const abiFiles = [
    'Hero.json',
    'Relic.json', 
    'Party.json',
    'VIPStaking.json',
    'PlayerProfile.json',
    'DungeonMaster.json',
    'PlayerVault.json',
    'AltarOfAscension.json',
    'VRFManagerV2Plus.json'
  ];

  // 複製到前端
  const frontendPath = config.FRONTEND_PATH;
  if (frontendPath && fs.existsSync(frontendPath)) {
    const frontendAbiDir = path.join(frontendPath, 'src', 'abis');
    if (!fs.existsSync(frontendAbiDir)) {
      fs.mkdirSync(frontendAbiDir, { recursive: true });
    }

    abiFiles.forEach(file => {
      const sourcePath = path.join(abiSourceDir, file);
      const destPath = path.join(frontendAbiDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✅ 複製 ${file} 到前端`);
      }
    });
  }

  // 複製到子圖
  const subgraphPath = config.SUBGRAPH_PATH;
  if (subgraphPath && fs.existsSync(subgraphPath)) {
    const subgraphAbiDir = path.join(subgraphPath, 'abis');
    
    abiFiles.forEach(file => {
      const sourcePath = path.join(abiSourceDir, file);
      const destPath = path.join(subgraphAbiDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✅ 複製 ${file} 到子圖`);
      }
    });
  }

  console.log('✅ ABI 文件同步完成');
}

// 6. 驗證同步結果
function verifySyncResult() {
  console.log('\n🔍 驗證同步結果...');
  
  const checks = [
    {
      name: '前端 .env 文件',
      path: path.join(config.FRONTEND_PATH || '', '.env'),
      check: (content) => content.includes(config.VITE_HERO_ADDRESS)
    },
    {
      name: '後端配置文件', 
      path: path.join(config.BACKEND_PATH || '', 'config', 'contracts.json'),
      check: (content) => content.includes(config.VITE_HERO_ADDRESS)
    },
    {
      name: '子圖配置文件',
      path: path.join(config.SUBGRAPH_PATH || '', 'src', 'config.ts'),  
      check: (content) => content.includes(config.VITE_HERO_ADDRESS)
    }
  ];

  let allPassed = true;
  
  checks.forEach(({ name, path: filePath, check }) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (check(content)) {
        console.log(`✅ ${name}: 同步成功`);
      } else {
        console.log(`❌ ${name}: 同步失败`);
        allPassed = false;
      }
    } else {
      console.log(`⚠️  ${name}: 文件不存在`);
    }
  });

  return allPassed;
}

// 執行同步
async function main() {
  try {
    syncToFrontend();
    syncToBackend(); 
    syncToSubgraph();
    syncABIs();
    
    const success = verifySyncResult();
    
    if (success) {
      console.log('\n🎉 V25 配置同步完成！');
      console.log('\n📝 下一步：');
      console.log('1. 檢查各項目配置是否正確');
      console.log('2. 重新構建和部署各項目');
      console.log('3. 驗證功能是否正常');
    } else {
      console.log('\n⚠️  部分同步失敗，請檢查錯誤信息');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 同步過程中發生錯誤:', error.message);
    process.exit(1);
  }
}

main();
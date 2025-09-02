const fs = require('fs');
const path = require('path');

/**
 * V25.0.3 Configuration Sync Script
 * 
 * 自動同步配置到：
 * - 前端項目
 * - 後端項目  
 * - 子圖項目
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function syncConfiguration() {
  console.log(`${colors.cyan}🔄 V25.0.3 Configuration Sync${colors.reset}`);
  console.log('=' . repeat(70));

  // 讀取部署配置
  const envPath = path.join(__dirname, '..', '.env.v25.0.3');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ Error: .env.v25.0.3 not found. Please run deployment first.${colors.reset}`);
    process.exit(1);
  }

  console.log(`📖 Reading configuration from: .env.v25.0.3`);
  
  // 解析配置
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });

  // 項目路徑
  const FRONTEND_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers';
  const BACKEND_PATH = '/Users/sotadic/Documents/dungeon-delvers-metadata-server';
  const SUBGRAPH_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}1. Syncing to Frontend${colors.reset}`);
  console.log('=' . repeat(70));

  // 更新前端 .env.local
  const frontendEnvPath = path.join(FRONTEND_PATH, '.env.local');
  const frontendEnvContent = `# V25.0.3 Frontend Configuration
# Auto-generated from deployment
# Updated: ${new Date().toISOString()}

# ==================== Contract Addresses ====================
${Object.entries(config)
  .filter(([key]) => key.startsWith('VITE_'))
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}

# ==================== Additional Frontend Config ====================
# Add any frontend-specific configurations below
`;

  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log(`${colors.green}✅ Updated: ${frontendEnvPath}${colors.reset}`);

  // 更新前端 public/config/latest.json
  const frontendConfigJson = {
    version: config.VITE_CONTRACT_VERSION || 'V25.0.3',
    network: 'BSC Mainnet',
    chainId: 56,
    startBlock: parseInt(config.VITE_START_BLOCK || '58266666'),
    deploymentDate: config.VITE_DEPLOYMENT_DATE,
    contracts: {
      hero: config.VITE_HERO_ADDRESS,
      relic: config.VITE_RELIC_ADDRESS,
      party: config.VITE_PARTY_ADDRESS,
      dungeonMaster: config.VITE_DUNGEONMASTER_ADDRESS,
      dungeonStorage: config.VITE_DUNGEONSTORAGE_ADDRESS,
      altarOfAscension: config.VITE_ALTAROFASCENSION_ADDRESS,
      dungeonCore: config.VITE_DUNGEONCORE_ADDRESS,
      oracle: config.VITE_ORACLE_ADDRESS,
      playerVault: config.VITE_PLAYERVAULT_ADDRESS,
      playerProfile: config.VITE_PLAYERPROFILE_ADDRESS,
      vipStaking: config.VITE_VIPSTAKING_ADDRESS,
      vrfManager: config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
      soulShard: config.VITE_SOULSHARD_ADDRESS,
      usd: config.VITE_USD_ADDRESS
    },
    vrf: {
      coordinator: config.VITE_VRF_COORDINATOR,
      keyHash: config.VITE_VRF_KEY_HASH,
      subscriptionId: config.VITE_VRF_SUBSCRIPTION_ID,
      callbackGasLimit: parseInt(config.VITE_VRF_CALLBACK_GAS_LIMIT || '2500000')
    },
    subgraph: {
      studio: config.VITE_SUBGRAPH_STUDIO_URL,
      decentralized: config.VITE_SUBGRAPH_DECENTRALIZED_URL
    },
    backend: config.VITE_BACKEND_URL
  };

  const frontendConfigPath = path.join(FRONTEND_PATH, 'public', 'config', 'latest.json');
  fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfigJson, null, 2));
  console.log(`${colors.green}✅ Updated: ${frontendConfigPath}${colors.reset}`);

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}2. Syncing to Backend${colors.reset}`);
  console.log('=' . repeat(70));

  // 更新後端配置
  const backendConfigPath = path.join(BACKEND_PATH, 'config', 'contracts.json');
  const backendConfig = {
    version: 'V25.0.3',
    network: 'BSC Mainnet',
    chainId: 56,
    updatedAt: new Date().toISOString(),
    contracts: {
      hero: config.VITE_HERO_ADDRESS,
      relic: config.VITE_RELIC_ADDRESS,
      party: config.VITE_PARTY_ADDRESS,
      dungeonMaster: config.VITE_DUNGEONMASTER_ADDRESS,
      dungeonStorage: config.VITE_DUNGEONSTORAGE_ADDRESS,
      altarOfAscension: config.VITE_ALTAROFASCENSION_ADDRESS,
      dungeonCore: config.VITE_DUNGEONCORE_ADDRESS,
      oracle: config.VITE_ORACLE_ADDRESS,
      playerVault: config.VITE_PLAYERVAULT_ADDRESS,
      playerProfile: config.VITE_PLAYERPROFILE_ADDRESS,
      vipStaking: config.VITE_VIPSTAKING_ADDRESS,
      vrfManager: config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
      soulShard: config.VITE_SOULSHARD_ADDRESS,
      usd: config.VITE_USD_ADDRESS
    },
    vrf: {
      coordinator: config.VITE_VRF_COORDINATOR,
      keyHash: config.VITE_VRF_KEY_HASH,
      subscriptionId: config.VITE_VRF_SUBSCRIPTION_ID
    },
    subgraph: {
      studio: config.VITE_SUBGRAPH_STUDIO_URL,
      decentralized: config.VITE_SUBGRAPH_DECENTRALIZED_URL,
      version: 'v3.9.4'
    },
    deployment: {
      startBlock: 58266666,
      deploymentDate: config.VITE_DEPLOYMENT_DATE,
      adminWallet: config.VITE_ADMIN_WALLET
    }
  };

  fs.mkdirSync(path.dirname(backendConfigPath), { recursive: true });
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
  console.log(`${colors.green}✅ Updated: ${backendConfigPath}${colors.reset}`);

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}3. Preparing Subgraph${colors.reset}`);
  console.log('=' . repeat(70));

  // 更新子圖 networks.json
  const subgraphNetworksPath = path.join(SUBGRAPH_PATH, 'networks.json');
  const subgraphNetworks = {
    "bsc": {
      "Hero": {
        "address": config.VITE_HERO_ADDRESS,
        "startBlock": 58266666
      },
      "Relic": {
        "address": config.VITE_RELIC_ADDRESS,
        "startBlock": 58266666
      },
      "Party": {
        "address": config.VITE_PARTY_ADDRESS,
        "startBlock": 58266666
      },
      "DungeonMaster": {
        "address": config.VITE_DUNGEONMASTER_ADDRESS,
        "startBlock": 58266666
      },
      "DungeonStorage": {
        "address": config.VITE_DUNGEONSTORAGE_ADDRESS,
        "startBlock": 58266666
      },
      "AltarOfAscension": {
        "address": config.VITE_ALTAROFASCENSION_ADDRESS,
        "startBlock": 58266666
      },
      "PlayerVault": {
        "address": config.VITE_PLAYERVAULT_ADDRESS,
        "startBlock": 58146943
      },
      "PlayerProfile": {
        "address": config.VITE_PLAYERPROFILE_ADDRESS,
        "startBlock": 58146943
      },
      "VIPStaking": {
        "address": config.VITE_VIPSTAKING_ADDRESS,
        "startBlock": 58146943
      }
    }
  };

  fs.writeFileSync(subgraphNetworksPath, JSON.stringify(subgraphNetworks, null, 2));
  console.log(`${colors.green}✅ Updated: ${subgraphNetworksPath}${colors.reset}`);

  // 複製 ABI 文件到子圖
  console.log('\n📋 Copying ABI files to subgraph...');
  const abiContracts = ['Hero', 'Relic', 'Party', 'DungeonMaster', 'DungeonStorage', 'AltarOfAscension'];
  const contractsPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'current');
  const subgraphAbiPath = path.join(SUBGRAPH_PATH, 'abis');

  fs.mkdirSync(subgraphAbiPath, { recursive: true });

  for (const contractName of abiContracts) {
    try {
      const sourcePath = path.join(contractsPath, 'nft', `${contractName}.sol`, `${contractName}.json`);
      let artifactPath = sourcePath;
      
      // 嘗試不同的路徑
      if (!fs.existsSync(sourcePath)) {
        // 嘗試 game 目錄
        artifactPath = path.join(contractsPath, 'game', `${contractName}.sol`, `${contractName}.json`);
      }
      if (!fs.existsSync(artifactPath)) {
        // 嘗試 altar 目錄
        artifactPath = path.join(contractsPath, 'altar', `${contractName}.sol`, `${contractName}.json`);
      }
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const abiOnly = { abi: artifact.abi };
        const destPath = path.join(subgraphAbiPath, `${contractName}.json`);
        fs.writeFileSync(destPath, JSON.stringify(abiOnly, null, 2));
        console.log(`  ✅ Copied ${contractName}.json`);
      } else {
        console.log(`  ⚠️  Warning: ${contractName}.json not found`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error copying ${contractName}.json:`, error.message);
    }
  }

  // 更新子圖 subgraph.yaml（顯示需要的變更）
  console.log('\n📝 Subgraph Configuration Updates:');
  console.log(`${colors.yellow}Please update subgraph.yaml with:${colors.reset}`);
  console.log(`  - New contract addresses from networks.json`);
  console.log(`  - Start block: 58266666`);
  console.log(`  - Version: v3.9.4`);

  // 顯示編譯命令
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}4. Subgraph Compilation Commands${colors.reset}`);
  console.log('=' . repeat(70));
  console.log(`\n${colors.cyan}To compile the subgraph:${colors.reset}`);
  console.log(`  cd ${SUBGRAPH_PATH}`);
  console.log(`  npm run codegen`);
  console.log(`  npm run build`);
  console.log(`\n${colors.yellow}Note: Subgraph deployment will be done manually by you${colors.reset}`);

  // 完成總結
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 SYNC COMPLETE!${colors.reset}`);
  console.log('=' . repeat(70));
  
  console.log('\n📊 Sync Summary:');
  console.log(`  ${colors.green}✅${colors.reset} Frontend configuration updated`);
  console.log(`  ${colors.green}✅${colors.reset} Backend configuration updated`);
  console.log(`  ${colors.green}✅${colors.reset} Subgraph networks.json updated`);
  console.log(`  ${colors.green}✅${colors.reset} ABI files copied to subgraph`);
  
  console.log('\n⏭️ Next Steps:');
  console.log('1. Restart frontend dev server');
  console.log('2. Restart backend server');
  console.log('3. Compile subgraph (npm run codegen && npm run build)');
  console.log('4. Deploy subgraph manually');
  
  console.log('\n' + '=' . repeat(70));
}

// 執行同步
syncConfiguration().catch(error => {
  console.error(`${colors.red}❌ Sync failed:${colors.reset}`, error);
  process.exit(1);
});
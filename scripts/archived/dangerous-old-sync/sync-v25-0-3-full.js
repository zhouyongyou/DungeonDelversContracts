const fs = require('fs');
const path = require('path');

/**
 * V25.0.3 完整配置同步腳本
 * 
 * 自動同步所有合約配置到：
 * - 前端項目 (DungeonDelvers)
 * - 後端項目 (dungeon-delvers-metadata-server)
 * - 子圖項目 (DDgraphql/dungeon-delvers)
 */

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

async function syncConfiguration() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              V25.0.3 配置同步 - 全面更新所有項目                     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('=' . repeat(70));

  // 讀取部署配置
  const envPath = path.join(__dirname, '..', '.env.v25.0.3');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ 錯誤: .env.v25.0.3 未找到。請先執行部署腳本。${colors.reset}`);
    process.exit(1);
  }

  console.log(`📖 讀取配置從: .env.v25.0.3`);
  
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
  const FRONTEND_SOULBOUND_PATH = '/Users/sotadic/Documents/GitHub/SoulboundSaga'; // 新前端項目
  const BACKEND_PATH = '/Users/sotadic/Documents/dungeon-delvers-metadata-server';
  const SUBGRAPH_PATH = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.magenta}1. 同步到前端項目${colors.reset}`);
  console.log('=' . repeat(70));

  // 更新兩個前端項目
  const frontendPaths = [
    { name: 'DungeonDelvers', path: FRONTEND_PATH },
    { name: 'SoulboundSaga', path: FRONTEND_SOULBOUND_PATH }
  ];

  for (const frontend of frontendPaths) {
    if (!fs.existsSync(frontend.path)) {
      console.log(`${colors.yellow}⚠️  跳過 ${frontend.name}：目錄不存在${colors.reset}`);
      continue;
    }

    console.log(`\n📁 更新 ${frontend.name}...`);

    // 更新 .env.local
    const frontendEnvPath = path.join(frontend.path, '.env.local');
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
    console.log(`  ${colors.green}✅ 更新: ${frontendEnvPath}${colors.reset}`);

    // 更新 public/config/latest.json
    const frontendConfigJson = {
      version: 'V25.0.3',
      network: 'BSC Mainnet',
      chainId: 56,
      startBlock: 58266666,
      deploymentDate: config.VITE_DEPLOYMENT_DATE,
      contracts: {
        // 代幣
        soulShard: config.VITE_SOULSHARD_ADDRESS,
        usd: config.VITE_USD_ADDRESS,
        
        // 核心
        dungeonCore: config.VITE_DUNGEONCORE_ADDRESS,
        oracle: config.VITE_ORACLE_ADDRESS,
        vrfManager: config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
        
        // NFT
        hero: config.VITE_HERO_ADDRESS,
        relic: config.VITE_RELIC_ADDRESS,
        party: config.VITE_PARTY_ADDRESS,
        
        // 遊戲邏輯
        dungeonMaster: config.VITE_DUNGEONMASTER_ADDRESS,
        dungeonStorage: config.VITE_DUNGEONSTORAGE_ADDRESS,
        altarOfAscension: config.VITE_ALTAROFASCENSION_ADDRESS,
        playerVault: config.VITE_PLAYERVAULT_ADDRESS,
        playerProfile: config.VITE_PLAYERPROFILE_ADDRESS,
        vipStaking: config.VITE_VIPSTAKING_ADDRESS
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
      backend: config.VITE_BACKEND_URL,
      adminWallet: config.VITE_ADMIN_WALLET
    };

    const frontendConfigPath = path.join(frontend.path, 'public', 'config', 'latest.json');
    fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
    fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfigJson, null, 2));
    console.log(`  ${colors.green}✅ 更新: ${frontendConfigPath}${colors.reset}`);
  }

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.magenta}2. 同步到後端項目${colors.reset}`);
  console.log('=' . repeat(70));

  // 更新後端配置
  const backendConfigPath = path.join(BACKEND_PATH, 'config', 'contracts.json');
  const backendConfig = {
    version: 'V25.0.3',
    network: 'BSC Mainnet',
    chainId: 56,
    updatedAt: new Date().toISOString(),
    contracts: {
      // 代幣
      soulShard: config.VITE_SOULSHARD_ADDRESS,
      usd: config.VITE_USD_ADDRESS,
      
      // 核心
      dungeonCore: config.VITE_DUNGEONCORE_ADDRESS,
      oracle: config.VITE_ORACLE_ADDRESS,
      vrfManager: config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
      
      // NFT
      hero: config.VITE_HERO_ADDRESS,
      relic: config.VITE_RELIC_ADDRESS,
      party: config.VITE_PARTY_ADDRESS,
      
      // 遊戲邏輯
      dungeonMaster: config.VITE_DUNGEONMASTER_ADDRESS,
      dungeonStorage: config.VITE_DUNGEONSTORAGE_ADDRESS,
      altarOfAscension: config.VITE_ALTAROFASCENSION_ADDRESS,
      playerVault: config.VITE_PLAYERVAULT_ADDRESS,
      playerProfile: config.VITE_PLAYERPROFILE_ADDRESS,
      vipStaking: config.VITE_VIPSTAKING_ADDRESS
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
  console.log(`${colors.green}✅ 更新: ${backendConfigPath}${colors.reset}`);

  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.magenta}3. 準備子圖${colors.reset}`);
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
        "startBlock": 58266666
      },
      "PlayerProfile": {
        "address": config.VITE_PLAYERPROFILE_ADDRESS,
        "startBlock": 58266666
      },
      "VIPStaking": {
        "address": config.VITE_VIPSTAKING_ADDRESS,
        "startBlock": 58266666
      },
      "DungeonCore": {
        "address": config.VITE_DUNGEONCORE_ADDRESS,
        "startBlock": 58266666
      },
      "Oracle": {
        "address": config.VITE_ORACLE_ADDRESS,
        "startBlock": 58266666
      },
      "VRFConsumerV2Plus": {
        "address": config.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
        "startBlock": 58266666
      }
    }
  };

  fs.writeFileSync(subgraphNetworksPath, JSON.stringify(subgraphNetworks, null, 2));
  console.log(`${colors.green}✅ 更新: ${subgraphNetworksPath}${colors.reset}`);

  // 複製 ABI 文件到子圖
  console.log('\n📋 複製 ABI 文件到子圖...');
  const allContracts = [
    'Hero', 'Relic', 'Party', 
    'DungeonMaster', 'DungeonStorage', 'AltarOfAscension',
    'PlayerVault', 'PlayerProfile', 'VIPStaking',
    'DungeonCore', 'Oracle', 'VRFConsumerV2Plus'
  ];
  
  const contractsPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'current');
  const subgraphAbiPath = path.join(SUBGRAPH_PATH, 'abis');

  fs.mkdirSync(subgraphAbiPath, { recursive: true });

  for (const contractName of allContracts) {
    try {
      // 嘗試不同的目錄結構
      const possiblePaths = [
        path.join(contractsPath, 'nft', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, 'game', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, 'altar', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, 'defi', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, 'core', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, 'vrf', `${contractName}.sol`, `${contractName}.json`),
        path.join(contractsPath, `${contractName}.sol`, `${contractName}.json`)
      ];
      
      let found = false;
      for (const artifactPath of possiblePaths) {
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          const abiOnly = { abi: artifact.abi };
          const destPath = path.join(subgraphAbiPath, `${contractName}.json`);
          fs.writeFileSync(destPath, JSON.stringify(abiOnly, null, 2));
          console.log(`  ${colors.green}✅ 複製 ${contractName}.json${colors.reset}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(`  ${colors.yellow}⚠️  警告: ${contractName}.json 未找到${colors.reset}`);
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ 錯誤複製 ${contractName}.json: ${error.message}${colors.reset}`);
    }
  }

  // 複製 ABI 到前端項目
  console.log('\n📋 複製 ABI 文件到前端...');
  for (const frontend of frontendPaths) {
    if (!fs.existsSync(frontend.path)) continue;
    
    const frontendAbiPath = path.join(frontend.path, 'src', 'contracts', 'abi');
    fs.mkdirSync(frontendAbiPath, { recursive: true });
    
    console.log(`\n  更新 ${frontend.name} ABI...`);
    for (const contractName of allContracts) {
      const sourceAbi = path.join(subgraphAbiPath, `${contractName}.json`);
      if (fs.existsSync(sourceAbi)) {
        const destAbi = path.join(frontendAbiPath, `${contractName}.json`);
        fs.copyFileSync(sourceAbi, destAbi);
        console.log(`    ✅ ${contractName}.json`);
      }
    }
  }

  // 顯示子圖配置更新提示
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.magenta}4. 子圖編譯指令${colors.reset}`);
  console.log('=' . repeat(70));
  
  console.log(`\n${colors.cyan}編譯子圖:${colors.reset}`);
  console.log(`  cd ${SUBGRAPH_PATH}`);
  console.log(`  npm run codegen`);
  console.log(`  npm run build`);
  console.log(`\n${colors.yellow}注意: 子圖部署將由您手動完成${colors.reset}`);

  // 完成總結
  console.log('\n' + '=' . repeat(70));
  console.log(`${colors.green}🎉 同步完成！${colors.reset}`);
  console.log('=' . repeat(70));
  
  console.log('\n📊 同步總結:');
  console.log(`  ${colors.green}✅${colors.reset} 前端配置已更新 (DungeonDelvers & SoulboundSaga)`);
  console.log(`  ${colors.green}✅${colors.reset} 後端配置已更新`);
  console.log(`  ${colors.green}✅${colors.reset} 子圖 networks.json 已更新`);
  console.log(`  ${colors.green}✅${colors.reset} ABI 文件已複製到所有項目`);
  
  console.log('\n⏭️ 下一步操作:');
  console.log('1. 重啟前端開發服務器');
  console.log('2. 重啟後端服務器');
  console.log('3. 編譯子圖 (npm run codegen && npm run build)');
  console.log('4. 手動部署子圖到 v3.9.4');
  console.log('5. 測試所有功能');
  
  console.log('\n' + '=' . repeat(70));
}

// 執行同步
syncConfiguration().catch(error => {
  console.error(`${colors.red}❌ 同步失敗:${colors.reset}`, error);
  process.exit(1);
});
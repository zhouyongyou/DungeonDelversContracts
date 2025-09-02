#!/usr/bin/env node

/**
 * V25 統一地址管理架構部署腳本
 * 
 * 架構特點：
 * 1. DungeonCore 作為中央地址註冊表
 * 2. 所有合約從 DungeonCore 查詢地址（查詢模式）
 * 3. VRF 智能授權系統自動管理權限
 * 4. 最小化手動配置，最大化自動化
 * 
 * 使用方式：
 * npx hardhat run scripts/deploy-v25-unified.js --network bsc
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// ==================== 配置區 ====================

// 複用的現有合約（不重新部署）
const REUSED_CONTRACTS = {
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
};

// VRF 配置 (BSC Mainnet) - 完整配置，部署時自動設定
const VRF_CONFIG = {
  // 您提供的正確訂閱 ID
  SUBSCRIPTION_ID: '88422796721004450630713121079263696788635490871993157345476848872165866246915',
  // BSC Mainnet VRF Coordinator V2.5
  COORDINATOR: '0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9',
  // 200 Gwei Key Hash for BSC
  KEY_HASH: '0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4',
  // 2.5M gas limit (足夠 50 個 NFT 批量鑄造)
  CALLBACK_GAS_LIMIT: 2500000,
  // 6 個區塊確認 (約 18 秒)
  REQUEST_CONFIRMATIONS: 6,
  // 每次請求 1 個隨機數
  NUM_WORDS: 1
};

// 需要部署的合約（按依賴順序）
const CONTRACTS_TO_DEPLOY = [
  'Oracle',            // 價格預言機
  'DungeonCore',       // 核心管理合約（必須早於其他合約）
  'DungeonStorage',    // 存儲合約
  'VRFConsumerV2Plus', // VRF Manager（統一隨機數）
  'Hero',              // 英雄 NFT
  'Relic',             // 聖物 NFT
  'Party',             // 隊伍 NFT
  'PlayerVault',       // 玩家金庫
  'PlayerProfile',     // 玩家檔案
  'VIPStaking',        // VIP 質押
  'DungeonMaster',     // 地城邏輯
  'AltarOfAscension'   // 升星祭壇
];

// 遊戲參數
const GAME_CONFIG = {
  mintPriceUSD: 2,
  platformFee: '0.0003',
  partyFee: '0.001',
  vipCooldown: 15,
  
  baseURIs: {
    Hero: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/',
    Relic: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/',
    Party: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/party/',
    VIPStaking: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/vip/',
    PlayerProfile: 'https://dungeon-delvers-metadata-server.onrender.com/metadata/profile/'
  },
  
  contractURIs: {
    Hero: 'https://www.dungeondelvers.xyz/metadata/hero-collection.json',
    Relic: 'https://www.dungeondelvers.xyz/metadata/relic-collection.json',
    Party: 'https://www.dungeondelvers.xyz/metadata/party-collection.json',
    VIPStaking: 'https://www.dungeondelvers.xyz/metadata/vip-collection.json',
    PlayerProfile: 'https://www.dungeondelvers.xyz/metadata/profile-collection.json'
  },
  
  dungeons: [
    { id: 1, power: 300, rewardUSD: 6, rate: 89 },
    { id: 2, power: 600, rewardUSD: 12, rate: 84 },
    { id: 3, power: 900, rewardUSD: 20, rate: 79 },
    { id: 4, power: 1200, rewardUSD: 33, rate: 74 },
    { id: 5, power: 1500, rewardUSD: 52, rate: 69 },
    { id: 6, power: 1800, rewardUSD: 78, rate: 64 },
    { id: 7, power: 2100, rewardUSD: 113, rate: 59 },
    { id: 8, power: 2400, rewardUSD: 156, rate: 54 },
    { id: 9, power: 2700, rewardUSD: 209, rate: 49 },
    { id: 10, power: 3000, rewardUSD: 225, rate: 44 },
    { id: 11, power: 3300, rewardUSD: 320, rate: 39 },
    { id: 12, power: 3600, rewardUSD: 450, rate: 34 }
  ]
};

// ==================== 工具函數 ====================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    title: `${colors.bright}${colors.cyan}`
  };
  
  if (type === 'title') {
    console.log(`${prefix[type]}${message}${colors.reset}`);
  } else {
    console.log(`${prefix[type]} ${message}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTx(tx, description = '') {
  log(`等待交易確認${description ? ': ' + description : ''}...`);
  const receipt = await tx.wait();
  if (receipt.status === 1) {
    log(`交易成功: ${receipt.hash}`, 'success');
  } else {
    throw new Error(`交易失敗: ${receipt.hash}`);
  }
  return receipt;
}

// ==================== 部署邏輯 ====================

async function getConstructorArgs(contractName, deployerAddress, deployedContracts) {
  switch (contractName) {
    case 'Oracle':
      return [
        REUSED_CONTRACTS.UNISWAP_POOL,
        REUSED_CONTRACTS.SOULSHARD,
        REUSED_CONTRACTS.USD
      ];
    
    case 'DungeonCore':
      return [
        deployerAddress,
        REUSED_CONTRACTS.USD,
        REUSED_CONTRACTS.SOULSHARD
      ];
    
    case 'VRFConsumerV2Plus':
      // Zero-config deployment! All parameters are hardcoded in the contract
      return [];
    
    // 其他合約都只需要 initialOwner
    default:
      return [deployerAddress];
  }
}

async function deployContract(contractName, deployerAddress, deployedContracts) {
  log(`部署 ${contractName}...`);
  
  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const args = await getConstructorArgs(contractName, deployerAddress, deployedContracts);
  
  const contract = await ContractFactory.deploy(...args);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  log(`${contractName} 已部署到: ${address}`, 'success');
  
  return { contract, address, args };
}

async function setupDungeonCore(dungeonCore, contracts) {
  log('\n配置 DungeonCore 地址註冊表...');
  
  const settings = [
    ['setOracle', contracts.Oracle.address],
    ['setHeroContract', contracts.Hero.address],
    ['setRelicContract', contracts.Relic.address],
    ['setPartyContract', contracts.Party.address],
    ['setDungeonMaster', contracts.DungeonMaster.address],
    ['setPlayerVault', contracts.PlayerVault.address],
    ['setPlayerProfile', contracts.PlayerProfile.address],
    ['setVipStaking', contracts.VIPStaking.address],
    ['setAltarOfAscension', contracts.AltarOfAscension.address],
    ['setVRFManager', contracts.VRFConsumerV2Plus.address]
  ];
  
  for (const [method, address] of settings) {
    const tx = await dungeonCore[method](address);
    await waitForTx(tx, `DungeonCore.${method}`);
  }
  
  log('DungeonCore 配置完成', 'success');
}

async function setupModuleDungeonCore(contracts, dungeonCoreAddress) {
  log('\n配置各模組的 DungeonCore 地址...');
  
  const modules = [
    'Hero', 'Relic', 'Party',
    'VIPStaking', 'PlayerProfile', 'PlayerVault',
    'DungeonMaster', 'AltarOfAscension', 'DungeonStorage',
    'VRFConsumerV2Plus'
  ];
  
  for (const moduleName of modules) {
    const module = contracts[moduleName]?.contract;
    if (module && module.setDungeonCore) {
      const tx = await module.setDungeonCore(dungeonCoreAddress);
      await waitForTx(tx, `${moduleName}.setDungeonCore`);
    }
  }
  
  log('模組 DungeonCore 設置完成', 'success');
}

async function setupSpecialConnections(contracts) {
  log('\n設置特殊連接...');
  
  // DungeonMaster <-> DungeonStorage
  const dungeonMaster = contracts.DungeonMaster.contract;
  const dungeonStorage = contracts.DungeonStorage.contract;
  
  if (dungeonMaster && dungeonStorage) {
    // DungeonMaster 設置 Storage
    let tx = await dungeonMaster.setDungeonStorage(contracts.DungeonStorage.address);
    await waitForTx(tx, 'DungeonMaster.setDungeonStorage');
    
    // Storage 設置 LogicContract
    tx = await dungeonStorage.setLogicContract(contracts.DungeonMaster.address);
    await waitForTx(tx, 'DungeonStorage.setLogicContract');
  }
  
  log('特殊連接設置完成', 'success');
}

async function setupVRF(vrfConsumer) {
  log('\n配置 VRF 參數...');
  
  const tx = await vrfConsumer.setVRFParams(
    VRF_CONFIG.KEY_HASH,
    VRF_CONFIG.CALLBACK_GAS_LIMIT,
    VRF_CONFIG.REQUEST_CONFIRMATIONS,
    VRF_CONFIG.NUM_WORDS
  );
  await waitForTx(tx, 'VRF 參數設置');
  
  log('VRF 配置完成（智能授權已自動啟用）', 'success');
}

async function initializeGameParams(contracts) {
  log('\n初始化遊戲參數...');
  
  // 設置 NFT 鑄造價格
  for (const name of ['Hero', 'Relic']) {
    const contract = contracts[name]?.contract;
    if (contract) {
      const tx1 = await contract.setMintPriceUSD(GAME_CONFIG.mintPriceUSD);
      await waitForTx(tx1, `${name} 鑄造價格`);
      
      const tx2 = await contract.setPlatformFee(hre.ethers.parseEther(GAME_CONFIG.platformFee));
      await waitForTx(tx2, `${name} 平台費用`);
    }
  }
  
  // 設置 Party 費用
  if (contracts.Party?.contract) {
    const tx = await contracts.Party.contract.setPlatformFee(
      hre.ethers.parseEther(GAME_CONFIG.partyFee)
    );
    await waitForTx(tx, 'Party 創建費用');
  }
  
  // 設置 VIP 冷卻期
  if (contracts.VIPStaking?.contract) {
    const tx = await contracts.VIPStaking.contract.setUnstakeCooldown(GAME_CONFIG.vipCooldown);
    await waitForTx(tx, 'VIP 解鎖冷卻期');
  }
  
  // 設置 BaseURI
  for (const [name, uri] of Object.entries(GAME_CONFIG.baseURIs)) {
    const contract = contracts[name]?.contract;
    if (contract && contract.setBaseURI) {
      const tx = await contract.setBaseURI(uri);
      await waitForTx(tx, `${name} BaseURI`);
    }
  }
  
  // 設置 ContractURI
  for (const [name, uri] of Object.entries(GAME_CONFIG.contractURIs)) {
    const contract = contracts[name]?.contract;
    if (contract && contract.setContractURI) {
      const tx = await contract.setContractURI(uri);
      await waitForTx(tx, `${name} ContractURI`);
    }
  }
  
  // 初始化地城
  const dungeonMaster = contracts.DungeonMaster?.contract;
  if (dungeonMaster) {
    for (const dungeon of GAME_CONFIG.dungeons) {
      const tx = await dungeonMaster.setDungeon(
        dungeon.id,
        dungeon.power,
        hre.ethers.parseUnits(dungeon.rewardUSD.toString(), 18),
        dungeon.rate
      );
      await waitForTx(tx, `地城 ${dungeon.id} 配置`);
    }
  }
  
  log('遊戲參數初始化完成', 'success');
}

async function verifyDeployment(contracts) {
  log('\n驗證部署...');
  
  let allSuccess = true;
  for (const [name, data] of Object.entries(contracts)) {
    const code = await hre.ethers.provider.getCode(data.address);
    if (code === '0x') {
      log(`${name} 驗證失敗: 無合約代碼`, 'error');
      allSuccess = false;
    } else {
      log(`${name} 驗證通過`, 'success');
    }
  }
  
  return allSuccess;
}

async function saveDeploymentData(contracts, startBlock, deployer) {
  log('\n保存部署數據...');
  
  const timestamp = Date.now();
  const deploymentData = {
    version: 'V25-Unified',
    timestamp: new Date().toISOString(),
    network: 'BSC Mainnet',
    deployer: deployer.address,
    startBlock,
    contracts: {},
    reusedContracts: REUSED_CONTRACTS,
    vrfConfig: VRF_CONFIG,
    gameConfig: GAME_CONFIG
  };
  
  // 添加合約地址
  for (const [name, data] of Object.entries(contracts)) {
    deploymentData.contracts[name] = {
      address: data.address,
      constructorArgs: data.args || []
    };
  }
  
  // 保存 JSON 配置
  const configPath = path.join(__dirname, '../deployments', `v25-unified-${timestamp}.json`);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(deploymentData, null, 2));
  log(`配置已保存: ${configPath}`, 'success');
  
  // 更新 .env.v25
  await updateEnvFile(contracts, startBlock);
  
  // 生成部署報告
  await generateReport(deploymentData, timestamp);
}

async function updateEnvFile(contracts, startBlock) {
  const envPath = path.join(__dirname, '../.env.v25');
  
  if (!fs.existsSync(envPath)) {
    log('.env.v25 不存在，跳過更新', 'warning');
    return;
  }
  
  let content = fs.readFileSync(envPath, 'utf8');
  
  // 更新地址
  const updates = {
    'VITE_ORACLE_ADDRESS': contracts.Oracle?.address,
    'VITE_DUNGEONCORE_ADDRESS': contracts.DungeonCore?.address,
    'VITE_HERO_ADDRESS': contracts.Hero?.address,
    'VITE_RELIC_ADDRESS': contracts.Relic?.address,
    'VITE_PARTY_ADDRESS': contracts.Party?.address,
    'VITE_DUNGEONMASTER_ADDRESS': contracts.DungeonMaster?.address,
    'VITE_DUNGEONSTORAGE_ADDRESS': contracts.DungeonStorage?.address,
    'VITE_ALTAROFASCENSION_ADDRESS': contracts.AltarOfAscension?.address,
    'VITE_PLAYERVAULT_ADDRESS': contracts.PlayerVault?.address,
    'VITE_PLAYERPROFILE_ADDRESS': contracts.PlayerProfile?.address,
    'VITE_VIPSTAKING_ADDRESS': contracts.VIPStaking?.address,
    'VITE_VRFMANAGER_ADDRESS': contracts.VRFConsumerV2Plus?.address,
    'VITE_START_BLOCK': startBlock.toString(),
    'VITE_DEPLOYMENT_DATE': new Date().toISOString()
  };
  
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    }
  }
  
  fs.writeFileSync(envPath, content);
  log('.env.v25 已更新', 'success');
}

async function generateReport(deploymentData, timestamp) {
  const reportPath = path.join(__dirname, '../deployments', `v25-unified-report-${timestamp}.md`);
  
  let report = `# V25 統一地址管理架構部署報告

生成時間: ${new Date().toLocaleString()}

## 🎯 架構特點

### 統一地址管理
- DungeonCore 作為中央地址註冊表
- 所有合約通過查詢模式獲取地址
- 消除了 80+ 個手動設置函數

### 智能授權系統
- VRF 自動信任核心遊戲合約
- 無需手動授權配置
- 動態權限管理

## 📋 部署信息

- **網路**: BSC Mainnet
- **部署者**: ${deploymentData.deployer}
- **起始區塊**: ${deploymentData.startBlock}
- **部署時間**: ${deploymentData.timestamp}

## 📍 合約地址

### 複用合約
| 合約 | 地址 |
|-----|------|
`;

  for (const [name, address] of Object.entries(REUSED_CONTRACTS)) {
    report += `| ${name} | \`${address}\` |\n`;
  }
  
  report += `\n### 新部署合約\n| 合約 | 地址 |\n|-----|------|\n`;
  
  for (const [name, data] of Object.entries(deploymentData.contracts)) {
    report += `| ${name} | \`${data.address}\` |\n`;
  }
  
  report += `\n## ⚡ 下一步行動

1. 執行配置同步
   \`\`\`bash
   cd /Users/sotadic/Documents/DungeonDelversContracts
   node scripts/ultimate-config-system.js sync
   \`\`\`

2. 驗證合約
   \`\`\`bash
   npx hardhat run scripts/verify-contracts.js --network bsc
   \`\`\`

3. 測試核心功能
   - Hero/Relic 鑄造
   - Party 創建
   - 地城探索
   - VRF 隨機數

4. 監控 Gas 使用情況

## ⚠️ 重要提醒

- 確保前端和子圖使用最新 ABI
- 所有地址查詢現在通過 DungeonCore
- VRF 智能授權自動管理權限
- 測試環境 VIP 冷卻期設為 15 秒
`;
  
  fs.writeFileSync(reportPath, report);
  log(`部署報告已生成: ${reportPath}`, 'success');
}

// ==================== 主函數 ====================

async function main() {
  console.log('\n');
  log('================================================', 'title');
  log('     V25 統一地址管理架構部署腳本', 'title');
  log('================================================', 'title');
  console.log('\n');
  
  try {
    // 獲取部署者
    const [deployer] = await hre.ethers.getSigners();
    log(`部署者地址: ${deployer.address}`);
    
    // 檢查餘額
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    log(`錢包餘額: ${hre.ethers.formatEther(balance)} BNB`);
    
    if (parseFloat(hre.ethers.formatEther(balance)) < 0.5) {
      throw new Error('BNB 餘額不足（建議至少 0.5 BNB）');
    }
    
    // 記錄起始區塊
    const startBlock = await hre.ethers.provider.getBlockNumber();
    log(`起始區塊: ${startBlock}`);
    
    // 部署合約
    log('\n📦 開始部署合約...', 'title');
    const deployedContracts = {};
    
    for (const contractName of CONTRACTS_TO_DEPLOY) {
      const result = await deployContract(contractName, deployer.address, deployedContracts);
      deployedContracts[contractName] = result;
      await sleep(1000); // 避免太快
    }
    
    // 設置連接
    log('\n🔗 設置合約連接...', 'title');
    
    // 1. 配置 DungeonCore
    await setupDungeonCore(
      deployedContracts.DungeonCore.contract,
      deployedContracts
    );
    
    // 2. 設置各模組的 DungeonCore
    await setupModuleDungeonCore(
      deployedContracts,
      deployedContracts.DungeonCore.address
    );
    
    // 3. 設置特殊連接
    await setupSpecialConnections(deployedContracts);
    
    // 4. 配置 VRF
    await setupVRF(deployedContracts.VRFConsumerV2Plus.contract);
    
    // 初始化參數
    log('\n⚙️ 初始化遊戲參數...', 'title');
    await initializeGameParams(deployedContracts);
    
    // 驗證部署
    log('\n✅ 驗證部署...', 'title');
    const success = await verifyDeployment(deployedContracts);
    
    if (!success) {
      throw new Error('部署驗證失敗');
    }
    
    // 保存數據
    await saveDeploymentData(deployedContracts, startBlock, deployer);
    
    log('\n================================================', 'title');
    log('        🎉 部署成功完成！', 'title');
    log('================================================', 'title');
    
    // 顯示重要地址
    console.log('\n📌 重要合約地址：');
    console.log(`  DungeonCore: ${deployedContracts.DungeonCore.address}`);
    console.log(`  VRF Manager: ${deployedContracts.VRFConsumerV2Plus.address}`);
    console.log(`  Hero NFT: ${deployedContracts.Hero.address}`);
    console.log(`  Relic NFT: ${deployedContracts.Relic.address}`);
    
  } catch (error) {
    log(`\n部署失敗: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 執行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * V25 完整同步腳本 - 2025-08-07 PM6 部署
 * 同步所有平台的合約地址、ABI 和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// V25 最新部署地址 (2025-08-07 PM6)
const V25_CONTRACTS = {
  // 新部署的合約
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  DUNGEONMASTER: '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a',
  HERO: '0x671d937b171e2ba2c4dc23c133b07e4449f283ef',
  RELIC: '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da',
  ALTAROFASCENSION: '0xa86749237d4631ad92ba859d0b0df4770f6147ba',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  
  // 重複使用的合約
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  
  // 代幣和其他
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  USD_TOKEN: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82',
  
  // VRF Manager (訂閱模式 V2.5)
  VRFMANAGER: '0x980d224ec4d198d94f34a8af76a19c00dabe2436'
};

// 子圖配置
const SUBGRAPH_CONFIG = {
  version: 'v3.8.0',
  startBlock: 56757876,
  network: 'bsc'
};

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 更新 master-config.json
function updateMasterConfig() {
  log('\n📝 更新主配置文件...', 'cyan');
  
  const configPath = path.join(__dirname, '../config/master-config.json');
  
  const masterConfig = {
    version: 'V25',
    deployment: {
      date: '2025-08-07',
      time: '18:00:00',
      startBlock: SUBGRAPH_CONFIG.startBlock,
      network: 'bsc-mainnet',
      chainId: 56
    },
    contracts: {
      mainnet: Object.keys(V25_CONTRACTS).reduce((acc, key) => {
        acc[`${key}_ADDRESS`] = V25_CONTRACTS[key];
        return acc;
      }, {})
    },
    subgraph: {
      version: SUBGRAPH_CONFIG.version,
      studio: {
        slug: 'dungeon-delvers',
        version: SUBGRAPH_CONFIG.version,
        queryUrl: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/' + SUBGRAPH_CONFIG.version
      }
    },
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(configPath, JSON.stringify(masterConfig, null, 2));
  log('  ✅ master-config.json 已更新', 'green');
}

// 更新前端配置
function updateFrontend() {
  log('\n🎨 更新前端配置...', 'cyan');
  
  const frontendPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers';
  const contractsPath = path.join(frontendPath, 'src/config/contracts.ts');
  
  if (!fs.existsSync(contractsPath)) {
    log('  ❌ 前端配置文件不存在', 'red');
    return;
  }
  
  let content = fs.readFileSync(contractsPath, 'utf8');
  
  // 更新合約地址
  Object.entries(V25_CONTRACTS).forEach(([name, address]) => {
    const pattern = new RegExp(`(${name}:\\s*['"])([^'"]+)(['"])`, 'g');
    content = content.replace(pattern, `$1${address}$3`);
    log(`  ✅ 更新 ${name}: ${address}`, 'green');
  });
  
  fs.writeFileSync(contractsPath, content);
  log('  💾 前端配置已保存', 'green');
}

// 更新子圖配置
function updateSubgraph() {
  log('\n📊 更新子圖配置...', 'cyan');
  
  const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';
  const yamlPath = path.join(subgraphPath, 'subgraph.yaml');
  
  if (!fs.existsSync(yamlPath)) {
    log('  ❌ 子圖配置文件不存在', 'red');
    return;
  }
  
  let content = fs.readFileSync(yamlPath, 'utf8');
  
  // 更新合約地址和起始區塊
  const updates = [
    { name: 'Hero', address: V25_CONTRACTS.HERO },
    { name: 'Relic', address: V25_CONTRACTS.RELIC },
    { name: 'PartyV3', address: V25_CONTRACTS.PARTY },
    { name: 'VIPStaking', address: V25_CONTRACTS.VIPSTAKING },
    { name: 'PlayerProfile', address: V25_CONTRACTS.PLAYERPROFILE },
    { name: 'DungeonMaster', address: V25_CONTRACTS.DUNGEONMASTER },
    { name: 'PlayerVault', address: V25_CONTRACTS.PLAYERVAULT },
    { name: 'AltarOfAscension', address: V25_CONTRACTS.ALTAROFASCENSION },
    { name: 'VRFManagerV2Plus', address: V25_CONTRACTS.VRFMANAGER }
  ];
  
  updates.forEach(({ name, address }) => {
    // 更新地址
    const addressPattern = new RegExp(
      `(name: ${name}[\\s\\S]*?source:[\\s\\S]*?address:\\s*)["']0x[a-fA-F0-9]{40}["']`,
      'g'
    );
    content = content.replace(addressPattern, `$1"${address}"`);
    
    // 更新起始區塊
    const blockPattern = new RegExp(
      `(name: ${name}[\\s\\S]*?source:[\\s\\S]*?startBlock:\\s*)\\d+`,
      'g'
    );
    content = content.replace(blockPattern, `$1${SUBGRAPH_CONFIG.startBlock}`);
    
    log(`  ✅ 更新 ${name}: ${address}`, 'green');
  });
  
  fs.writeFileSync(yamlPath, content);
  log(`  ✅ 起始區塊: ${SUBGRAPH_CONFIG.startBlock}`, 'green');
  log(`  ✅ 子圖版本: ${SUBGRAPH_CONFIG.version}`, 'green');
  log('  💾 subgraph.yaml 已保存', 'green');
}

// 更新後端配置
function updateBackend() {
  log('\n🖥️  更新後端配置...', 'cyan');
  
  const backendPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server';
  const envPath = path.join(backendPath, '.env');
  
  if (!fs.existsSync(envPath)) {
    log('  ❌ 後端 .env 文件不存在', 'red');
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新環境變數
  Object.entries(V25_CONTRACTS).forEach(([name, address]) => {
    const envKey = `${name}_ADDRESS`;
    const pattern = new RegExp(`^${envKey}=.*$`, 'gm');
    
    if (pattern.test(envContent)) {
      envContent = envContent.replace(pattern, `${envKey}=${address}`);
    } else {
      envContent += `\n${envKey}=${address}`;
    }
    log(`  ✅ 更新 ${envKey}: ${address}`, 'green');
  });
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  log('  💾 後端 .env 已保存', 'green');
}

// 複製 ABI 文件
function copyABIs() {
  log('\n📦 複製 ABI 文件...', 'cyan');
  
  const artifactsPath = '/Users/sotadic/Documents/DungeonDelversContracts/artifacts/contracts';
  const subgraphAbiPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis';
  
  const abiMappings = [
    { from: 'current/nft/Hero.sol/Hero.json', to: 'Hero/Hero.json' },
    { from: 'current/nft/Relic.sol/Relic.json', to: 'Relic/Relic.json' },
    { from: 'current/nft/PartyV3.sol/PartyV3.json', to: 'PartyV3/PartyV3.json' },
    { from: 'current/AltarOfAscension.sol/AltarOfAscension.json', to: 'AltarOfAscension/AltarOfAscensionVRF.json' },
    { from: 'current/DungeonMaster.sol/DungeonMaster.json', to: 'DungeonMaster/DungeonMaster.json' },
    { from: 'current/VRFManagerV2Plus.sol/VRFManagerV2Plus.json', to: 'VRFManagerV2Plus/VRFManagerV2Plus.json' }
  ];
  
  abiMappings.forEach(({ from, to }) => {
    const sourcePath = path.join(artifactsPath, from);
    const destPath = path.join(subgraphAbiPath, to);
    
    if (fs.existsSync(sourcePath)) {
      const sourceJson = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // 只複製 ABI 部分
      fs.writeFileSync(destPath, JSON.stringify(sourceJson.abi, null, 2));
      log(`  ✅ 複製 ${path.basename(to)}`, 'green');
    } else {
      log(`  ⚠️  找不到源文件: ${from}`, 'yellow');
    }
  });
}

// 驗證同步
function verifySync() {
  log('\n🔍 驗證同步狀態...', 'cyan');
  
  let allGood = true;
  const issues = [];
  
  // 檢查前端
  try {
    const contractsPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
    const content = fs.readFileSync(contractsPath, 'utf8');
    
    ['HERO', 'RELIC', 'DUNGEONMASTER'].forEach(name => {
      if (!content.includes(V25_CONTRACTS[name])) {
        issues.push(`前端缺少 ${name}: ${V25_CONTRACTS[name]}`);
        allGood = false;
      }
    });
  } catch (error) {
    issues.push(`無法檢查前端: ${error.message}`);
    allGood = false;
  }
  
  // 檢查子圖
  try {
    const yamlPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
    const content = fs.readFileSync(yamlPath, 'utf8');
    
    if (!content.includes(V25_CONTRACTS.HERO)) {
      issues.push(`子圖缺少 Hero 地址`);
      allGood = false;
    }
    
    if (!content.includes(SUBGRAPH_CONFIG.startBlock.toString())) {
      issues.push(`子圖起始區塊不正確`);
      allGood = false;
    }
  } catch (error) {
    issues.push(`無法檢查子圖: ${error.message}`);
    allGood = false;
  }
  
  if (allGood) {
    log('  ✅ 所有配置已同步！', 'green');
  } else {
    log('  ⚠️  發現問題：', 'yellow');
    issues.forEach(issue => log(`    - ${issue}`, 'yellow'));
  }
  
  return allGood;
}

// 主函數
async function main() {
  log('🚀 V25 完整同步 - 2025-08-07 PM6 部署', 'bright');
  log('=========================================', 'bright');
  
  log('\n📋 部署信息：', 'blue');
  log(`  版本: V25`, 'yellow');
  log(`  時間: 2025-08-07 PM6`, 'yellow');
  log(`  起始區塊: ${SUBGRAPH_CONFIG.startBlock}`, 'yellow');
  log(`  子圖版本: ${SUBGRAPH_CONFIG.version}`, 'yellow');
  
  // 執行同步
  updateMasterConfig();
  updateFrontend();
  updateSubgraph();
  updateBackend();
  copyABIs();
  
  // 驗證
  const success = verifySync();
  
  if (success) {
    log('\n✅ V25 同步完成！', 'green');
    log('\n📌 下一步：', 'cyan');
    log('  1. 在子圖目錄運行: npm run codegen && npm run build', 'yellow');
    log('  2. 部署子圖: graph deploy --studio dungeon-delvers', 'yellow');
    log('  3. 重啟後端服務', 'yellow');
    log('  4. 清除前端緩存並重新構建', 'yellow');
  } else {
    log('\n⚠️  同步完成但有警告，請檢查上述問題', 'yellow');
  }
}

// 執行
main().catch(error => {
  log(`\n❌ 錯誤: ${error.message}`, 'red');
  process.exit(1);
});
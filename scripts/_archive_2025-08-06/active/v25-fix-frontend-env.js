#!/usr/bin/env node

/**
 * V25 Frontend 環境變數修復腳本
 * 
 * 修復前端 .env 檔案中錯誤的 V22 地址
 * 更新為正確的 V25 合約地址
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// V25 正確的合約地址
const V25_ADDRESSES = {
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  DUNGEONCORE: '0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a',
  DUNGEONMASTER: '0xd06470d4C6F62F6747cf02bD2b2De0981489034F',
  DUNGEONSTORAGE: '0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  HERO: '0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db',
  RELIC: '0xcfB83d8545D68b796a236290b3C1bc7e4A140B11',
  PARTY: '0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69',
  ALTAROFASCENSION: '0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
  UNISWAP_POOL: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
};

// 環境變數映射
const ENV_MAPPING = {
  'VITE_SOULSHARD_ADDRESS': 'SOULSHARD',
  'VITE_ORACLE_ADDRESS': 'ORACLE',
  'VITE_DUNGEONCORE_ADDRESS': 'DUNGEONCORE',
  'VITE_DUNGEONMASTER_ADDRESS': 'DUNGEONMASTER',
  'VITE_DUNGEONSTORAGE_ADDRESS': 'DUNGEONSTORAGE',
  'VITE_PLAYERVAULT_ADDRESS': 'PLAYERVAULT',
  'VITE_PLAYERPROFILE_ADDRESS': 'PLAYERPROFILE',
  'VITE_VIPSTAKING_ADDRESS': 'VIPSTAKING',
  'VITE_HERO_ADDRESS': 'HERO',
  'VITE_RELIC_ADDRESS': 'RELIC',
  'VITE_PARTY_ADDRESS': 'PARTY',
  'VITE_ALTAROFASCENSION_ADDRESS': 'ALTAROFASCENSION',
  'VITE_USD_ADDRESS': 'USD',
  'VITE_TESTUSD_ADDRESS': 'USD', // 使用相同的 USD 地址
  'VITE_UNISWAP_POOL_ADDRESS': 'UNISWAP_POOL'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    warning: `${colors.yellow}[WARNING]${colors.reset}`
  };
  
  console.log(`${prefix[type]} ${timestamp} ${message}`);
}

async function fixFrontendEnv() {
  console.log(`${colors.bright}
==================================================
🔧 V25 Frontend 環境變數修復
==================================================
${colors.reset}`);

  // Frontend 專案路徑
  const frontendPaths = [
    '/Users/sotadic/Documents/GitHub/DungeonDelvers',
    '/Users/sotadic/Documents/dungeondelvers',
    '/Users/sotadic/Documents/DungeonDelvers' // 其他可能的路徑
  ];

  let frontendPath = null;
  
  // 找到實際存在的前端專案
  for (const testPath of frontendPaths) {
    if (fs.existsSync(testPath)) {
      frontendPath = testPath;
      log(`找到前端專案: ${frontendPath}`, 'success');
      break;
    }
  }

  if (!frontendPath) {
    log('找不到前端專案目錄', 'error');
    process.exit(1);
  }

  // 處理多個環境檔案
  const envFiles = ['.env', '.env.production', '.env.local'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(frontendPath, envFile);
    
    if (!fs.existsSync(envPath)) {
      log(`跳過不存在的檔案: ${envFile}`, 'warning');
      continue;
    }

    log(`\n處理檔案: ${envFile}`, 'info');
    
    // 備份原檔案
    const backupPath = `${envPath}.backup-${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    log(`已備份到: ${backupPath}`, 'success');

    // 讀取檔案內容
    let content = fs.readFileSync(envPath, 'utf8');
    const originalContent = content;
    
    // 記錄變更
    const changes = [];
    
    // 更新每個地址
    for (const [envKey, addressKey] of Object.entries(ENV_MAPPING)) {
      const newAddress = V25_ADDRESSES[addressKey];
      if (!newAddress) continue;
      
      // 使用正則表達式找到並替換地址
      const regex = new RegExp(`^(${envKey}\\s*=\\s*)0x[a-fA-F0-9]{40}`, 'm');
      const match = content.match(regex);
      
      if (match) {
        const oldLine = match[0];
        const newLine = `${match[1]}${newAddress}`;
        content = content.replace(oldLine, newLine);
        
        if (oldLine !== newLine) {
          changes.push({
            key: envKey,
            old: oldLine.split('=')[1].trim(),
            new: newAddress
          });
        }
      }
    }
    
    // 如果有變更，寫入檔案
    if (changes.length > 0) {
      fs.writeFileSync(envPath, content);
      log(`✅ 更新了 ${changes.length} 個地址:`, 'success');
      
      for (const change of changes) {
        log(`  ${change.key}:`, 'info');
        log(`    舊: ${change.old}`, 'warning');
        log(`    新: ${change.new}`, 'success');
      }
    } else {
      log(`✅ ${envFile} 已經是最新的 V25 地址`, 'success');
    }
  }

  // 檢查 public/config/v25.json
  const v25ConfigPath = path.join(frontendPath, 'public/config/v25.json');
  if (fs.existsSync(v25ConfigPath)) {
    log('\n更新 public/config/v25.json...', 'info');
    
    const v25Config = {
      version: "V25",
      lastUpdated: new Date().toISOString(),
      network: "BSC Mainnet",
      contracts: V25_ADDRESSES,
      metadata: {
        HERO_BASE_URI: "https://dungeon-delvers-metadata-server.onrender.com/api/hero/",
        RELIC_BASE_URI: "https://dungeon-delvers-metadata-server.onrender.com/api/relic/",
        PARTY_BASE_URI: "https://dungeon-delvers-metadata-server.onrender.com/api/party/",
        VIP_BASE_URI: "https://dungeon-delvers-metadata-server.onrender.com/api/vip/",
        PROFILE_BASE_URI: "https://dungeon-delvers-metadata-server.onrender.com/api/profile/"
      },
      subgraph: {
        url: "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.6.0",
        version: "v3.6.0"
      }
    };
    
    fs.writeFileSync(v25ConfigPath, JSON.stringify(v25Config, null, 2));
    log('✅ v25.json 配置已更新', 'success');
  }

  log('\n✅ Frontend 環境變數修復完成！', 'success');
  log('\n下一步：', 'info');
  log('1. 重新啟動前端開發服務器', 'info');
  log('2. 清除瀏覽器快取', 'info');
  log('3. 測試所有功能是否正常', 'info');
}

// 執行修復
fixFrontendEnv().catch(error => {
  console.error('修復失敗:', error);
  process.exit(1);
});
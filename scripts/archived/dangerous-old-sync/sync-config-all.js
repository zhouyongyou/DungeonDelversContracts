#!/usr/bin/env node

/**
 * 🎯 DungeonDelvers 統一配置同步腳本
 * 從主配置 .env.master 同步到所有專案
 * 
 * 使用方法：
 * npm run sync:config:all
 * 或
 * node scripts/sync-config-all.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.master' });

// 顏色輸出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`)
};

class ConfigSyncManager {
  constructor() {
    this.masterConfig = this.loadMasterConfig();
    this.syncResults = {
      frontend: false,
      backend: false,
      subgraph: false
    };
  }

  loadMasterConfig() {
    const masterPath = path.join(__dirname, '..', '.env.master');
    if (!fs.existsSync(masterPath)) {
      throw new Error('主配置文件 .env.master 不存在');
    }

    const content = fs.readFileSync(masterPath, 'utf-8');
    const config = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return config;
  }

  // 同步到前端
  syncToFrontend() {
    log.info('同步配置到前端...');
    
    const frontendPath = this.masterConfig.FRONTEND_PATH;
    if (!frontendPath || !fs.existsSync(frontendPath)) {
      log.error('前端專案路徑不存在');
      return false;
    }

    const envLocalPath = path.join(frontendPath, '.env.local');
    
    // 構建前端環境變數
    const frontendEnv = this.buildFrontendEnv();
    
    try {
      fs.writeFileSync(envLocalPath, frontendEnv);
      log.success('前端配置同步完成');
      return true;
    } catch (error) {
      log.error(`前端配置同步失敗: ${error.message}`);
      return false;
    }
  }

  buildFrontendEnv() {
    const header = `# V25 統一配置 - 從主配置自動生成
# 自動生成時間: ${new Date().toISOString()}
# ⚠️ 請勿手動編輯此文件，所有變更請在主配置 .env.master 中進行

# ==================== 合約地址 ====================`;

    const contracts = [
      'VITE_HERO_ADDRESS',
      'VITE_RELIC_ADDRESS', 
      'VITE_PARTY_ADDRESS',
      'VITE_DUNGEONMASTER_ADDRESS',
      'VITE_DUNGEONSTORAGE_ADDRESS',
      'VITE_ALTAROFASCENSION_ADDRESS',
      'VITE_DUNGEONCORE_ADDRESS',
      'VITE_PLAYERVAULT_ADDRESS',
      'VITE_PLAYERPROFILE_ADDRESS',
      'VITE_VIPSTAKING_ADDRESS',
      'VITE_ORACLE_ADDRESS',
      'VITE_VRFMANAGER_ADDRESS',
      'VITE_SOULSHARD_ADDRESS',
      'VITE_USD_ADDRESS',
      'VITE_UNISWAP_POOL_ADDRESS'
    ];

    const contractSection = contracts
      .map(key => `${key}=${this.masterConfig[key] || ''}`)
      .join('\n');

    const services = `
# ==================== 服務端點 ====================
VITE_SUBGRAPH_URL=${this.masterConfig.SUBGRAPH_STUDIO_URL}
VITE_BACKEND_URL=${this.masterConfig.BACKEND_URL}

# ==================== 部署信息 ====================
VITE_CONTRACT_VERSION=${this.masterConfig.CONFIG_VERSION}
VITE_START_BLOCK=${this.masterConfig.START_BLOCK}
VITE_DEPLOYMENT_DATE=${this.masterConfig.DEPLOYMENT_DATE}
VITE_NETWORK=${this.masterConfig.NETWORK}
VITE_CHAIN_ID=${this.masterConfig.CHAIN_ID}

# ==================== VRF 配置 ====================
VITE_VRF_ENABLED=true
VITE_VRF_SUBSCRIPTION_ID=${this.masterConfig.VRF_SUBSCRIPTION_ID}

# ==================== 開發配置 ====================
VITE_DEBUG_MODE=${this.masterConfig.DEBUG_MODE}`;

    return `${header}\n${contractSection}${services}`;
  }

  // 同步到後端
  syncToBackend() {
    log.info('同步配置到後端...');
    
    const backendPath = this.masterConfig.BACKEND_PATH;
    if (!backendPath || !fs.existsSync(backendPath)) {
      log.error('後端專案路徑不存在');
      return false;
    }

    const configPath = path.join(backendPath, 'config', 'contracts.json');
    
    // 構建後端配置
    const backendConfig = this.buildBackendConfig();
    
    try {
      // 確保目錄存在
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(backendConfig, null, 2));
      log.success('後端配置同步完成');
      return true;
    } catch (error) {
      log.error(`後端配置同步失敗: ${error.message}`);
      return false;
    }
  }

  buildBackendConfig() {
    return {
      network: "bsc",
      chainId: parseInt(this.masterConfig.CHAIN_ID),
      rpcUrl: this.masterConfig.BSC_RPC_URL,
      contracts: {
        hero: this.masterConfig.VITE_HERO_ADDRESS,
        relic: this.masterConfig.VITE_RELIC_ADDRESS,
        party: this.masterConfig.VITE_PARTY_ADDRESS,
        dungeonmaster: this.masterConfig.VITE_DUNGEONMASTER_ADDRESS,
        dungeonstorage: this.masterConfig.VITE_DUNGEONSTORAGE_ADDRESS,
        altarOfAscension: this.masterConfig.VITE_ALTAROFASCENSION_ADDRESS,
        playervault: this.masterConfig.VITE_PLAYERVAULT_ADDRESS,
        playerprofile: this.masterConfig.VITE_PLAYERPROFILE_ADDRESS,
        vipstaking: this.masterConfig.VITE_VIPSTAKING_ADDRESS,
        vrfManagerV2Plus: this.masterConfig.VITE_VRFMANAGER_ADDRESS,
        dungeoncore: this.masterConfig.VITE_DUNGEONCORE_ADDRESS,
        oracle: this.masterConfig.VITE_ORACLE_ADDRESS,
        soulshard: this.masterConfig.VITE_SOULSHARD_ADDRESS,
        usd: this.masterConfig.VITE_USD_ADDRESS,
        uniswap_pool: this.masterConfig.VITE_UNISWAP_POOL_ADDRESS
      },
      vrf: {
        subscriptionId: this.masterConfig.VRF_SUBSCRIPTION_ID,
        coordinator: this.masterConfig.VRF_COORDINATOR,
        keyHash: this.masterConfig.VRF_KEY_HASH
      },
      subgraph: {
        url: this.masterConfig.SUBGRAPH_STUDIO_URL,
        version: "v3.9.0"
      },
      deployment: {
        version: this.masterConfig.CONFIG_VERSION,
        date: this.masterConfig.DEPLOYMENT_DATE,
        startBlock: this.masterConfig.START_BLOCK
      }
    };
  }

  // 同步到子圖
  syncToSubgraph() {
    log.info('同步配置到子圖...');
    
    const subgraphPath = this.masterConfig.SUBGRAPH_PATH;
    if (!subgraphPath || !fs.existsSync(subgraphPath)) {
      log.error('子圖專案路徑不存在');
      return false;
    }

    const networksPath = path.join(subgraphPath, 'networks.json');
    
    // 構建子圖配置
    const subgraphConfig = this.buildSubgraphConfig();
    
    try {
      fs.writeFileSync(networksPath, JSON.stringify(subgraphConfig, null, 2));
      log.success('子圖配置同步完成');
      return true;
    } catch (error) {
      log.error(`子圖配置同步失敗: ${error.message}`);
      return false;
    }
  }

  buildSubgraphConfig() {
    return {
      bsc: {
        startBlock: parseInt(this.masterConfig.START_BLOCK),
        contracts: {
          hero: this.masterConfig.VITE_HERO_ADDRESS,
          relic: this.masterConfig.VITE_RELIC_ADDRESS,
          party: this.masterConfig.VITE_PARTY_ADDRESS,
          dungeonmaster: this.masterConfig.VITE_DUNGEONMASTER_ADDRESS,
          dungeonstorage: this.masterConfig.VITE_DUNGEONSTORAGE_ADDRESS,
          altarofascension: this.masterConfig.VITE_ALTAROFASCENSION_ADDRESS,
          playervault: this.masterConfig.VITE_PLAYERVAULT_ADDRESS,
          playerprofile: this.masterConfig.VITE_PLAYERPROFILE_ADDRESS,
          vipstaking: this.masterConfig.VITE_VIPSTAKING_ADDRESS,
          vrfmanager: this.masterConfig.VITE_VRFMANAGER_ADDRESS,
          dungeoncore: this.masterConfig.VITE_DUNGEONCORE_ADDRESS,
          oracle: this.masterConfig.VITE_ORACLE_ADDRESS,
          soulshard: this.masterConfig.VITE_SOULSHARD_ADDRESS,
          usd: this.masterConfig.VITE_USD_ADDRESS,
          uniswap_pool: this.masterConfig.VITE_UNISWAP_POOL_ADDRESS
        }
      }
    };
  }

  // 執行完整同步
  async syncAll() {
    console.log(`${colors.cyan}🎯 DungeonDelvers 配置同步開始${colors.reset}`);
    console.log(`${colors.cyan}版本: ${this.masterConfig.CONFIG_VERSION}${colors.reset}`);
    console.log(`${colors.cyan}時間: ${new Date().toISOString()}${colors.reset}\n`);

    // 並行同步
    const results = await Promise.allSettled([
      Promise.resolve(this.syncToFrontend()),
      Promise.resolve(this.syncToBackend()),
      Promise.resolve(this.syncToSubgraph())
    ]);

    this.syncResults.frontend = results[0].value;
    this.syncResults.backend = results[1].value;
    this.syncResults.subgraph = results[2].value;

    this.printSummary();
  }

  printSummary() {
    console.log(`\n${colors.cyan}📊 同步結果總結${colors.reset}`);
    console.log('='.repeat(50));
    
    Object.entries(this.syncResults).forEach(([project, success]) => {
      const status = success ? `${colors.green}✅ 成功${colors.reset}` : `${colors.red}❌ 失敗${colors.reset}`;
      console.log(`${project.padEnd(15)}: ${status}`);
    });

    const allSuccess = Object.values(this.syncResults).every(Boolean);
    
    if (allSuccess) {
      console.log(`\n${colors.green}🎉 所有配置同步完成！${colors.reset}`);
      console.log(`\n${colors.yellow}⚠️  請手動執行以下操作：${colors.reset}`);
      console.log('1. 更新子圖 subgraph.yaml 的起始區塊');
      console.log('2. 編譯並部署子圖');
      console.log('3. 重啟前端和後端服務器');
    } else {
      console.log(`\n${colors.red}❌ 部分配置同步失敗，請檢查錯誤信息${colors.reset}`);
    }
  }
}

// 主程序
async function main() {
  try {
    const syncManager = new ConfigSyncManager();
    await syncManager.syncAll();
  } catch (error) {
    log.error(`配置同步失敗: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}

module.exports = ConfigSyncManager;
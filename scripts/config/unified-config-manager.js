#!/usr/bin/env node

/**
 * 統一配置管理器
 * 
 * 功能：
 * 1. 自動偵測最新的 vXX-config.js
 * 2. 將其作為單一真相來源
 * 3. 自動生成所有衍生配置格式
 * 
 * 設計原則：
 * - vXX-config.js 是唯一的源頭配置
 * - 其他格式都是自動生成的
 * - 支援版本追蹤和回滾
 */

const fs = require('fs');
const path = require('path');

class UnifiedConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, '../../config');
    this.projectRoot = path.join(__dirname, '../..');
    this.currentConfig = null;
    this.configVersion = null;
  }

  // 自動偵測最新的 vXX-config.js
  async detectLatestConfig() {
    const files = fs.readdirSync(this.configDir);
    const configFiles = files.filter(f => /^v\d+-config\.js$/.test(f));
    
    if (configFiles.length === 0) {
      throw new Error('找不到任何 vXX-config.js 配置文件');
    }
    
    // 按版本號排序，取最新的
    configFiles.sort((a, b) => {
      const versionA = parseInt(a.match(/v(\d+)/)[1]);
      const versionB = parseInt(b.match(/v(\d+)/)[1]);
      return versionB - versionA;
    });
    
    const latestFile = configFiles[0];
    this.configVersion = latestFile.match(/v(\d+)/)[1];
    
    console.log(`🔍 偵測到最新配置: ${latestFile}`);
    return path.join(this.configDir, latestFile);
  }

  // 載入配置
  async loadConfig(configPath) {
    // 清除 require cache 以確保載入最新內容
    delete require.cache[require.resolve(configPath)];
    this.currentConfig = require(configPath);
    console.log(`✅ 已載入配置 V${this.configVersion}`);
  }

  // 生成 master-config.json
  generateMasterConfig() {
    const masterConfig = {
      version: `V${this.configVersion}`,
      lastUpdated: new Date().toISOString(),
      description: `DungeonDelvers 主配置文件 - V${this.configVersion} (自動生成)`,
      sourceConfig: `v${this.configVersion}-config.js`,
      
      contracts: {
        mainnet: {}
      },
      
      subgraph: {
        studio: {
          url: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.1.0',
          version: 'v3.1.0'
        },
        decentralized: {
          url: 'https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
          subgraphId: 'Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs',
          deploymentId: 'QmaDf5fWXxGyb6oky2611NBfthvs35vR6DrFnhHMkuuRzV'
        }
      },
      
      network: {
        chainId: 56,
        name: 'BSC Mainnet',
        rpc: 'https://bsc-dataseed.binance.org/',
        explorer: 'https://bscscan.com'
      },
      
      services: {
        frontend: 'https://dungeondelvers.xyz',
        backend: 'https://dungeon-delvers-metadata-server.onrender.com'
      },
      
      tokens: {
        real: {
          USD_ADDRESS: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
          SOUL_ADDRESS: this.currentConfig.contracts.SOULSHARD?.address,
          POOL_ADDRESS: this.currentConfig.contracts.UNISWAP_POOL?.address
        }
      }
    };

    // 轉換合約地址格式
    for (const [key, data] of Object.entries(this.currentConfig.contracts)) {
      masterConfig.contracts.mainnet[`${key}_ADDRESS`] = data.address;
    }

    // 特殊處理
    masterConfig.contracts.mainnet.TESTUSD_ADDRESS = '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE';
    masterConfig.contracts.mainnet.DUNGEONMASTERWALLET_ADDRESS = this.currentConfig.deployer;

    return masterConfig;
  }

  // 生成 CDN 配置
  generateCDNConfig() {
    const cdnConfig = {
      version: `V${this.configVersion}`,
      lastUpdated: new Date().toISOString(),
      network: this.currentConfig.network,
      contracts: {},
      subgraph: {
        studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.1.0',
        decentralized: 'https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs'
      }
    };

    // 簡化合約資訊
    for (const [key, data] of Object.entries(this.currentConfig.contracts)) {
      cdnConfig.contracts[key] = data.address;
    }

    return cdnConfig;
  }

  // 生成配置讀取器（供其他腳本使用）
  generateConfigReader() {
    const readerContent = `// 自動生成的配置讀取器
// 總是指向最新的 vXX-config.js

const path = require('path');

// 載入最新配置
const latestConfig = require('./v${this.configVersion}-config.js');

// 提供向後相容的介面
module.exports = {
  // 原始配置
  raw: latestConfig,
  
  // 版本資訊
  version: 'V${this.configVersion}',
  
  // 快速存取
  contracts: latestConfig.contracts,
  deployer: latestConfig.deployer,
  network: latestConfig.network,
  startBlock: latestConfig.startBlock,
  
  // 取得合約地址
  getAddress(contractName) {
    return latestConfig.contracts[contractName]?.address;
  },
  
  // 取得所有地址（扁平化）
  getAllAddresses() {
    const addresses = {};
    for (const [key, data] of Object.entries(latestConfig.contracts)) {
      addresses[\`\${key}_ADDRESS\`] = data.address;
    }
    return addresses;
  }
};
`;

    return readerContent;
  }

  // 寫入配置文件
  async saveConfigs() {
    console.log('\n📝 生成衍生配置文件...');

    // 不再生成 master-config.json，改為提示使用 config-reader.js
    console.log('ℹ️  不再生成 master-config.json');
    console.log('📌 請使用 config/config-reader.js 讀取配置');

    // 2. 保存 CDN 配置
    const cdnDir = path.join(this.projectRoot, 'public/configs');
    if (!fs.existsSync(cdnDir)) {
      fs.mkdirSync(cdnDir, { recursive: true });
    }

    const cdnConfig = this.generateCDNConfig();
    
    // v{version}.json
    fs.writeFileSync(
      path.join(cdnDir, `v${this.configVersion}.json`),
      JSON.stringify(cdnConfig, null, 2)
    );
    console.log(`✅ 已生成 v${this.configVersion}.json`);

    // latest.json
    fs.writeFileSync(
      path.join(cdnDir, 'latest.json'),
      JSON.stringify(cdnConfig, null, 2)
    );
    console.log('✅ 已生成 latest.json');

    // 3. 保存配置讀取器
    const readerPath = path.join(this.configDir, 'config-reader.js');
    fs.writeFileSync(readerPath, this.generateConfigReader());
    console.log('✅ 已生成 config-reader.js');

    // 4. 創建 .env 範例
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envContent = `# DungeonDelvers 環境變數範例
# 配置版本: V${this.configVersion}
# 更新時間: ${new Date().toISOString()}

# ========== 部署相關 ==========
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# ========== 網路設定 ==========
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# ========== 配置版本 ==========
CONFIG_VERSION=V${this.configVersion}

# 注意：合約地址現在從 config/v${this.configVersion}-config.js 自動載入
# 不需要在 .env 中設置合約地址
`;

    fs.writeFileSync(envExamplePath, envContent);
    console.log('✅ 已更新 .env.example');
  }

  // 生成配置文檔
  async generateDocs() {
    console.log('\n📚 生成配置文檔...');

    const docContent = `# 配置管理系統文檔

## 當前版本: V${this.configVersion}

更新時間: ${new Date().toISOString()}

## 配置架構

\`\`\`
v${this.configVersion}-config.js (源頭配置)
    ├── master-config.json (自動生成)
    ├── config-reader.js (自動生成)
    ├── public/configs/
    │   ├── v${this.configVersion}.json (CDN配置)
    │   └── latest.json (CDN最新版)
    └── .env.example (環境變數範例)
\`\`\`

## 使用方式

### 1. 在 Node.js 腳本中讀取配置

\`\`\`javascript
// 方法 1: 使用配置讀取器（推薦）
const config = require('./config/config-reader');

console.log(config.version); // 'V${this.configVersion}'
console.log(config.getAddress('HERO')); // Hero 合約地址
console.log(config.getAllAddresses()); // 所有合約地址

// 方法 2: 直接載入源頭配置
const v${this.configVersion}Config = require('./config/v${this.configVersion}-config');
\`\`\`

### 2. 在前端讀取配置

\`\`\`javascript
// 從 CDN 載入
const response = await fetch('/configs/latest.json');
const config = await response.json();
\`\`\`

### 3. 更新配置

當部署新版本後：

\`\`\`bash
# 1. 部署會自動生成新的 vXX-config.js
npm run deploy

# 2. 執行統一配置管理器
node scripts/config/unified-config-manager.js

# 3. 所有衍生配置會自動更新
\`\`\`

## 配置文件說明

| 文件 | 用途 | 格式 |
|------|------|------|
| v${this.configVersion}-config.js | 源頭配置（部署自動生成） | JS |
| master-config.json | 主配置（向後相容） | JSON |
| config-reader.js | 配置讀取器 | JS |
| v${this.configVersion}.json | CDN 版本配置 | JSON |
| latest.json | CDN 最新配置 | JSON |

## 合約地址

${this.generateContractTable()}

## 注意事項

1. **不要手動編輯** master-config.json 或其他衍生配置
2. 所有配置修改應該在部署時自動生成
3. 使用 config-reader.js 可以確保總是讀取最新配置
`;

    const docPath = path.join(this.projectRoot, 'docs/CONFIG_MANAGEMENT.md');
    const docsDir = path.dirname(docPath);
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(docPath, docContent);
    console.log('✅ 已生成配置文檔: docs/CONFIG_MANAGEMENT.md');
  }

  // 生成合約地址表格
  generateContractTable() {
    let table = '| 合約 | 地址 | 部署區塊 |\n';
    table += '|------|------|----------|\n';
    
    for (const [name, data] of Object.entries(this.currentConfig.contracts)) {
      table += `| ${name} | \`${data.address}\` | ${data.deploymentBlock || 'N/A'} |\n`;
    }
    
    return table;
  }

  // 主執行函數
  async run() {
    try {
      console.log('🚀 統一配置管理器啟動\n');

      // 1. 偵測最新配置
      const configPath = await this.detectLatestConfig();

      // 2. 載入配置
      await this.loadConfig(configPath);

      // 3. 生成所有衍生配置
      await this.saveConfigs();

      // 4. 生成文檔
      await this.generateDocs();

      console.log('\n✅ 配置管理完成！');
      console.log(`\n所有系統現在都指向 v${this.configVersion}-config.js`);
      
      return {
        version: this.configVersion,
        configPath,
        success: true
      };

    } catch (error) {
      console.error('❌ 配置管理失敗:', error.message);
      throw error;
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const manager = new UnifiedConfigManager();
  manager.run()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = UnifiedConfigManager;
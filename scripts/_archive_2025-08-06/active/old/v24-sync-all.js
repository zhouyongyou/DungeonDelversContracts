#!/usr/bin/env node

/**
 * V24 配置同步腳本
 * 將合約地址和 ABI 同步到前端、後端和子圖
 * 
 * 使用方式：
 * node scripts/active/v24-sync-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

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

class V24Syncer {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/v24-config.js');
    this.config = null;
    this.paths = {
      frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
      backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
      subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARNING]${colors.reset}`
    };
    console.log(`${prefix[type]} ${timestamp} ${message}`);
  }

  async sync() {
    console.log(`${colors.bright}
==================================================
🔄 V24 配置同步腳本
==================================================
${colors.reset}`);

    try {
      // 1. 載入配置
      await this.loadConfig();
      
      // 2. 編譯合約以生成 ABI
      await this.compileContracts();
      
      // 3. 同步 ABI
      await this.syncABIs();
      
      // 4. 同步配置
      await this.syncConfigs();
      
      // 5. 更新子圖
      await this.updateSubgraph();
      
      this.log('\\n✅ V24 同步完成！', 'success');
      
    } catch (error) {
      this.log(`同步失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async loadConfig() {
    this.log('載入 V24 配置...', 'info');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error('找不到 V24 配置文件，請先執行部署腳本');
    }
    
    this.config = require(this.configPath);
    this.log(`已載入配置: ${Object.keys(this.config.contracts).length} 個合約`, 'info');
  }

  async compileContracts() {
    this.log('\\n編譯合約以生成 ABI...', 'info');
    
    try {
      execSync('npx hardhat compile', { stdio: 'inherit' });
      this.log('✅ 合約編譯成功', 'success');
    } catch (error) {
      this.log('❌ 合約編譯失敗', 'error');
      throw error;
    }
  }

  async syncABIs() {
    this.log('\\n同步 ABI 文件...', 'info');
    
    const abiMapping = {
      HERO: { artifact: 'Hero', targets: ['frontend', 'subgraph'] },
      RELIC: { artifact: 'Relic', targets: ['frontend', 'subgraph'] },
      PARTY: { artifact: 'Party', targets: ['frontend', 'subgraph'] },
      VIPSTAKING: { artifact: 'VIPStaking', targets: ['frontend', 'subgraph'] },
      PLAYERPROFILE: { artifact: 'PlayerProfile', targets: ['frontend', 'subgraph'] },
      ALTAROFASCENSION: { artifact: 'AltarOfAscensionV2Fixed', targets: ['frontend', 'subgraph'] },
      DUNGEONMASTER: { artifact: 'DungeonMasterV2_Fixed', targets: ['subgraph'] },
      DUNGEONCORE: { artifact: 'DungeonCore', targets: ['frontend'] },
      ORACLE: { artifact: 'Oracle', targets: ['frontend'] },
      SOULSHARD: { artifact: 'SoulShard', targets: ['frontend'] }
    };
    
    for (const [contractName, info] of Object.entries(abiMapping)) {
      this.log(`\\n處理 ${contractName} ABI...`, 'info');
      
      // 查找 artifact
      const artifactPath = this.findArtifact(info.artifact);
      if (!artifactPath) {
        this.log(`找不到 ${contractName} 的 artifact`, 'warning');
        continue;
      }
      
      // 讀取 ABI
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const abi = artifact.abi;
      
      // 複製到目標位置
      for (const target of info.targets) {
        if (target === 'frontend') {
          const targetPath = path.join(this.paths.frontend, 'src/config/abis', `${info.artifact}.json`);
          this.backupAndWrite(targetPath, JSON.stringify(abi, null, 2));
          this.log(`✅ ${contractName} ABI 已複製到前端`, 'success');
        }
        
        if (target === 'subgraph') {
          const targetPath = path.join(this.paths.subgraph, 'abis', `${info.artifact}.json`);
          this.backupAndWrite(targetPath, JSON.stringify(abi, null, 2));
          this.log(`✅ ${contractName} ABI 已複製到子圖`, 'success');
        }
      }
    }
  }

  findArtifact(contractName) {
    const basePath = path.join(__dirname, '../../artifacts/contracts');
    
    // 搜索可能的位置
    const possiblePaths = [
      `current/nft/${contractName}.sol/${contractName}.json`,
      `current/core/${contractName}.sol/${contractName}.json`,
      `current/defi/${contractName}.sol/${contractName}.json`,
      `defi/${contractName}.sol/${contractName}.json`,
      `nft/${contractName}.sol/${contractName}.json`,
      `core/${contractName}.sol/${contractName}.json`
    ];
    
    for (const p of possiblePaths) {
      const fullPath = path.join(basePath, p);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return null;
  }

  async syncConfigs() {
    this.log('\\n同步配置文件...', 'info');
    
    // 1. 更新前端配置
    this.updateFrontendConfig();
    
    // 2. 更新後端配置
    this.updateBackendConfig();
    
    // 3. 更新子圖 networks.json
    this.updateSubgraphNetworks();
  }

  updateFrontendConfig() {
    this.log('\\n更新前端配置...', 'info');
    
    const contractsPath = path.join(this.paths.frontend, 'src/config/contracts.ts');
    
    // 生成新的配置內容
    const content = `// V24 合約配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  DUNGEONCORE: "${this.config.contracts.DUNGEONCORE.address}",
  ORACLE: "${this.config.contracts.ORACLE.address}",
  
  // NFT Contracts  
  HERO: "${this.config.contracts.HERO.address}",
  RELIC: "${this.config.contracts.RELIC.address}",
  PARTY: "${this.config.contracts.PARTY.address}",
  
  // DeFi Contracts
  SOULSHARD: "${this.config.contracts.SOULSHARD.address}",
  
  // Game Mechanics
  DUNGEONMASTER: "${this.config.contracts.DUNGEONMASTER.address}",
  DUNGEONMASTER_WALLET: "${this.config.deployer}",
  PLAYERVAULT: "${this.config.contracts.PLAYERVAULT.address}",
  PLAYERPROFILE: "${this.config.contracts.PLAYERPROFILE.address}",
  ALTAROFASCENSION: "${this.config.contracts.ALTAROFASCENSION.address}",
  VIPSTAKING: "${this.config.contracts.VIPSTAKING.address}",
  DUNGEONSTORAGE: "${this.config.contracts.DUNGEONSTORAGE.address}",
} as const;

export const getContract = (name: keyof typeof CONTRACT_ADDRESSES): string => {
  return CONTRACT_ADDRESSES[name];
};

export const getContractAddress = (name: string): string => {
  return CONTRACT_ADDRESSES[name as keyof typeof CONTRACT_ADDRESSES] || '';
};

// Export contract info for debugging
export const CONTRACT_INFO = {
  version: "${this.config.version}",
  network: "${this.config.network}",
  deploymentBlock: ${this.config.startBlock},
  lastUpdated: "${this.config.lastUpdated}"
};`;
    
    this.backupAndWrite(contractsPath, content);
    this.log('✅ 前端配置已更新', 'success');
  }

  updateBackendConfig() {
    this.log('\\n更新後端配置...', 'info');
    
    const configPath = path.join(this.paths.backend, 'config/contracts.js');
    
    const content = `// V24 合約配置 - ${new Date().toISOString()}
// 自動生成，請勿手動修改

module.exports = {
  contracts: {
    hero: '${this.config.contracts.HERO.address}',
    relic: '${this.config.contracts.RELIC.address}',
    party: '${this.config.contracts.PARTY.address}',
    vipStaking: '${this.config.contracts.VIPSTAKING.address}',
    playerProfile: '${this.config.contracts.PLAYERPROFILE.address}',
    dungeonCore: '${this.config.contracts.DUNGEONCORE.address}',
    dungeonMaster: '${this.config.contracts.DUNGEONMASTER.address}',
    playerVault: '${this.config.contracts.PLAYERVAULT.address}',
    altarOfAscension: '${this.config.contracts.ALTAROFASCENSION.address}',
    oracle: '${this.config.contracts.ORACLE.address}',
    soulShard: '${this.config.contracts.SOULSHARD.address}'
  },
  network: {
    name: '${this.config.network}',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
  },
  version: '${this.config.version}',
  deploymentBlock: ${this.config.startBlock}
};`;
    
    this.backupAndWrite(configPath, content);
    this.log('✅ 後端配置已更新', 'success');
  }

  updateSubgraphNetworks() {
    this.log('\\n更新子圖 networks.json...', 'info');
    
    const networksPath = path.join(this.paths.subgraph, 'networks.json');
    
    const networks = {
      bsc: {
        Hero: {
          address: this.config.contracts.HERO.address,
          startBlock: this.config.startBlock
        },
        Relic: {
          address: this.config.contracts.RELIC.address,
          startBlock: this.config.startBlock
        },
        Party: {
          address: this.config.contracts.PARTY.address,
          startBlock: this.config.startBlock
        },
        VIPStaking: {
          address: this.config.contracts.VIPSTAKING.address,
          startBlock: this.config.startBlock
        },
        PlayerProfile: {
          address: this.config.contracts.PLAYERPROFILE.address,
          startBlock: this.config.startBlock
        },
        AltarOfAscensionV2Fixed: {
          address: this.config.contracts.ALTAROFASCENSION.address,
          startBlock: this.config.startBlock
        },
        DungeonMaster: {
          address: this.config.contracts.DUNGEONMASTER.address,
          startBlock: this.config.startBlock
        }
      }
    };
    
    this.backupAndWrite(networksPath, JSON.stringify(networks, null, 2));
    this.log('✅ 子圖 networks.json 已更新', 'success');
  }

  async updateSubgraph() {
    this.log('\\n更新子圖 YAML...', 'info');
    
    const yamlPath = path.join(this.paths.subgraph, 'subgraph.yaml');
    
    // 讀取現有 YAML
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const subgraph = yaml.load(yamlContent);
    
    // 備份
    this.backupFile(yamlPath);
    
    // 更新地址和起始區塊
    const addressMap = {
      'Hero': this.config.contracts.HERO.address,
      'Relic': this.config.contracts.RELIC.address,
      'Party': this.config.contracts.PARTY.address,
      'VIPStaking': this.config.contracts.VIPSTAKING.address,
      'PlayerProfile': this.config.contracts.PLAYERPROFILE.address,
      'AltarOfAscension': this.config.contracts.ALTAROFASCENSION.address
    };
    
    // 更新數據源
    subgraph.dataSources.forEach(dataSource => {
      const name = dataSource.name;
      if (addressMap[name]) {
        dataSource.source.address = addressMap[name];
        dataSource.source.startBlock = this.config.startBlock;
        this.log(`✅ 更新 ${name} 地址和起始區塊`, 'success');
      }
    });
    
    // 添加或更新 DungeonMaster
    const hasDungeonMaster = subgraph.dataSources.some(ds => ds.name === 'DungeonMaster' || ds.name === 'DungeonMasterV8');
    
    if (!hasDungeonMaster) {
      const dungeonMasterDataSource = {
        kind: 'ethereum/contract',
        name: 'DungeonMaster',
        network: 'bsc',
        source: {
          address: this.config.contracts.DUNGEONMASTER.address,
          abi: 'DungeonMaster',
          startBlock: this.config.startBlock
        },
        mapping: {
          kind: 'ethereum/events',
          apiVersion: '0.0.6',
          language: 'wasm/assemblyscript',
          entities: [
            'DungeonExploration',
            'Player'
          ],
          abis: [{
            name: 'DungeonMaster',
            file: './abis/DungeonMaster.json'
          }],
          eventHandlers: [
            {
              event: 'ExpeditionFulfilled(indexed uint256,indexed uint256,bool,uint256,uint256,uint256)',
              handler: 'handleExpeditionFulfilled'
            },
            {
              event: 'RewardsBanked(indexed address,uint256)',
              handler: 'handleRewardsBanked'
            }
          ],
          file: './src/dungeon-master.ts'
        }
      };
      
      subgraph.dataSources.push(dungeonMasterDataSource);
      this.log('✅ 添加 DungeonMaster 數據源', 'success');
    }
    
    // 添加 header
    const header = `# Generated from v24-config.js on ${new Date().toISOString()}\\n# V24 Production Deployment\\n`;
    
    // 寫回文件
    const newYamlContent = header + yaml.dump(subgraph, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    
    fs.writeFileSync(yamlPath, newYamlContent);
    this.log('✅ 子圖 YAML 已更新', 'success');
    
    console.log(`\\n${colors.bright}下一步:${colors.reset}`);
    console.log('1. 前端: cd ' + this.paths.frontend + ' && npm run dev');
    console.log('2. 後端: cd ' + this.paths.backend + ' && npm start');
    console.log('3. 子圖:');
    console.log('   cd ' + this.paths.subgraph);
    console.log('   npm run codegen');
    console.log('   npm run build');
    console.log('   npm run deploy');
  }

  backupAndWrite(filePath, content) {
    this.backupFile(filePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  backupFile(filePath) {
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      this.log(`📋 已備份: ${path.basename(backupPath)}`, 'info');
    }
  }
}

// 執行同步
if (require.main === module) {
  const syncer = new V24Syncer();
  syncer.sync().catch(console.error);
}

module.exports = V24Syncer;
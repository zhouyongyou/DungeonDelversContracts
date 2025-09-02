/**
 * 後端更新器
 * 專門處理 Node.js 後端項目的配置更新
 */

const { PathResolver } = require('../config/project-paths');

class BackendUpdater {
  constructor(logger, fileOps, backupManager) {
    this.logger = logger.child('BACKEND');
    this.fileOps = fileOps;
    this.backupManager = backupManager;
  }

  async updateAll(config, subgraphVersion = null) {
    this.logger.section('🎯 更新後端配置...');
    
    const results = [];
    
    try {
      // 1. 更新後端合約配置
      const contractsResult = await this.updateBackendContracts(config);
      results.push(contractsResult);
      
      // 2. 更新後端環境變數
      const envResult = await this.updateBackendEnv(config, subgraphVersion);
      results.push(envResult);
      
      // 3. 更新共享配置
      const sharedResult = await this.updateSharedConfig(config, subgraphVersion);
      results.push(sharedResult);
      
      const successCount = results.filter(r => r.success).length;
      this.logger.success(`✅ 後端更新完成: ${successCount}/${results.length}`);
      
    } catch (error) {
      this.logger.error('後端更新失敗', error);
      throw error;
    }
    
    return results;
  }

  async updateBackendContracts(config) {
    this.logger.info('更新後端 contracts.js...');
    
    try {
      const contractsPath = PathResolver.getConfigFilePath('backend', 'contracts');
      
      if (!this.fileOps.exists(contractsPath)) {
        this.logger.warning('後端 contracts.js 不存在，跳過');
        return { type: 'backend-contracts', success: true, skipped: true };
      }
      
      // 備份
      this.backupManager.backup(contractsPath, 'backend-contracts-update');
      
      // 生成新配置內容
      const newContent = this.generateBackendContractsJS(config);
      
      // 寫入文件
      this.fileOps.writeFile(contractsPath, newContent);
      
      this.logger.success('✅ 後端 contracts.js 已更新');
      return { type: 'backend-contracts', success: true, file: contractsPath };
      
    } catch (error) {
      this.logger.error('更新後端 contracts.js 失敗', error);
      return { type: 'backend-contracts', success: false, error: error.message };
    }
  }

  generateBackendContractsJS(config) {
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return `/**
 * V25 Contract Configuration for Backend
 * Generated on ${new Date().toISOString()}
 * DO NOT EDIT MANUALLY - Use sync-system to update
 */

const contracts = {
  bsc: {
    // Core Contracts
    DUNGEONCORE: '${addresses.DUNGEONCORE || ''}',
    ORACLE: '${addresses.ORACLE || ''}',
    
    // Token Contracts
    SOULSHARD: '${addresses.SOULSHARD || ''}',
    
    // NFT Contracts
    HERO: '${addresses.HERO || ''}',
    RELIC: '${addresses.RELIC || ''}',
    PARTY: '${addresses.PARTY || ''}',
    
    // Game Contracts
    DUNGEONMASTER: '${addresses.DUNGEONMASTER || ''}',
    DUNGEONSTORAGE: '${addresses.DUNGEONSTORAGE || ''}',
    PLAYERVAULT: '${addresses.PLAYERVAULT || ''}',
    PLAYERPROFILE: '${addresses.PLAYERPROFILE || ''}',
    
    // Feature Contracts
    VIPSTAKING: '${addresses.VIPSTAKING || ''}',
    ALTAROFASCENSION: '${addresses.ALTAROFASCENSION || ''}',
    
    // External
    DUNGEONMASTERWALLET: '${addresses.DUNGEONMASTERWALLET || '0xEbCF4A36Ad1485A9737025e9d72186b604487274'}',
    
    // Network Info
    NETWORK_ID: 56,
    NETWORK_NAME: 'BSC Mainnet',
    VERSION: '${config.version}'
  }
};

// Helper function to get contract address
const getContractAddress = (contractName) => {
  return contracts.bsc[contractName] || null;
};

// Export for CommonJS
module.exports = {
  contracts,
  getContractAddress,
  CONTRACT_VERSION: '${config.version}',
  DEPLOYMENT_BLOCK: ${config.startBlock}
};
`;
  }

  async updateBackendEnv(config, subgraphVersion) {
    this.logger.info('更新後端 .env 文件...');
    
    try {
      const envPath = PathResolver.getConfigFilePath('backend', 'env');
      
      if (!this.fileOps.exists(envPath)) {
        this.logger.warning('後端 .env 不存在，跳過');
        return { type: 'backend-env', success: true, skipped: true };
      }
      
      // 備份
      this.backupManager.backup(envPath, 'backend-env-update');
      
      // 準備替換規則
      const replacements = this.generateBackendEnvReplacements(config, subgraphVersion);
      
      // 執行替換
      const result = this.fileOps.replaceInFile(envPath, replacements, false);
      
      if (result.success) {
        this.logger.success(`✅ 後端 .env 已更新`);
        return { type: 'backend-env', success: true };
      } else {
        this.logger.warning(`⚠️ 後端 .env 沒有變更`);
        return { type: 'backend-env', success: true, noChanges: true };
      }
      
    } catch (error) {
      this.logger.error('更新後端 .env 失敗', error);
      return { type: 'backend-env', success: false, error: error.message };
    }
  }

  generateBackendEnvReplacements(config, subgraphVersion) {
    const version = subgraphVersion || config.subgraphVersion || 'v3.6.1';
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    const replacements = [
      // 子圖 URL 更新
      {
        pattern: /THE_GRAPH_DECENTRALIZED_URL=.*/,
        replacement: `THE_GRAPH_DECENTRALIZED_URL=https://gateway-arbitrum.network.thegraph.com/api/[api-key]/subgraphs/id/...`,
        description: 'Decentralized Graph URL'
      },
      {
        pattern: /THE_GRAPH_STUDIO_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `THE_GRAPH_STUDIO_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
        description: 'Studio API URL'
      },
      {
        pattern: /THE_GRAPH_STUDIO_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `THE_GRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
        description: 'Studio URL (alternative)'
      },
      {
        pattern: /THE_GRAPH_NETWORK_URL=.*/,
        replacement: `THE_GRAPH_NETWORK_URL=https://api.thegraph.com/subgraphs/name/dungeon-delvers`,
        description: 'Network URL'
      }
    ];

    // 添加合約地址更新
    for (const [contractName, address] of Object.entries(addresses)) {
      replacements.push({
        pattern: new RegExp(`${contractName}_ADDRESS=0x[a-fA-F0-9]{40}`),
        replacement: `${contractName}_ADDRESS=${address}`,
        description: `${contractName} 合約地址`
      });
    }

    return replacements;
  }

  async updateSharedConfig(config, subgraphVersion) {
    this.logger.info('更新 shared-config.json...');
    
    try {
      const sharedConfigPath = PathResolver.getConfigFilePath('backend', 'sharedConfig');
      
      if (!this.fileOps.exists(sharedConfigPath)) {
        this.logger.info('shared-config.json 不存在，創建新文件');
      } else {
        // 備份現有文件
        this.backupManager.backup(sharedConfigPath, 'shared-config-update');
      }
      
      // 生成共享配置
      const sharedConfig = this.generateSharedConfig(config, subgraphVersion);
      
      // 寫入文件
      this.fileOps.writeJSON(sharedConfigPath, sharedConfig);
      
      this.logger.success('✅ shared-config.json 已更新');
      return { type: 'shared-config', success: true, file: sharedConfigPath };
      
    } catch (error) {
      this.logger.error('更新 shared-config.json 失敗', error);
      return { type: 'shared-config', success: false, error: error.message };
    }
  }

  generateSharedConfig(config, subgraphVersion) {
    const version = subgraphVersion || config.subgraphVersion || 'v3.6.1';
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return {
      version: config.version,
      network: {
        name: 'BSC Mainnet',
        chainId: 56,
        rpcUrl: 'https://bsc-dataseed.binance.org/'
      },
      contracts: addresses,
      subgraph: {
        studio: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
        version: version
      },
      services: {
        subgraph: {
          url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
          id: 'dungeon-delvers'
        },
        metadataServer: {
          url: 'https://dungeon-delvers-metadata-server.vercel.app'
        }
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async validateBackendConfig(config) {
    this.logger.info('驗證後端配置...');
    
    const issues = [];
    
    try {
      // 檢查 contracts.js
      const contractsPath = PathResolver.getConfigFilePath('backend', 'contracts');
      if (this.fileOps.exists(contractsPath)) {
        const content = this.fileOps.readFile(contractsPath);
        
        for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
          if (!content.includes(contractInfo.address)) {
            issues.push(`contracts.js: ${contractName} 地址不匹配`);
          }
        }
      }
      
      // 檢查 .env
      const envPath = PathResolver.getConfigFilePath('backend', 'env');
      if (this.fileOps.exists(envPath)) {
        const envContent = this.fileOps.readFile(envPath);
        const version = config.subgraphVersion || 'v3.6.1';
        
        if (!envContent.includes(version)) {
          issues.push(`.env: 子圖版本不是 ${version}`);
        }
      }
      
    } catch (error) {
      issues.push(`驗證失敗: ${error.message}`);
    }
    
    if (issues.length === 0) {
      this.logger.success('✅ 後端配置驗證通過');
    } else {
      this.logger.warning(`⚠️ 發現 ${issues.length} 個後端配置問題`);
      issues.forEach(issue => this.logger.warning(`  - ${issue}`));
    }
    
    return { success: issues.length === 0, issues };
  }
}

module.exports = BackendUpdater;
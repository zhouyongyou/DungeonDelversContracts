/**
 * 配置載入器
 * 統一載入和管理所有配置來源
 */

const { PathResolver } = require('../config/project-paths');

class ConfigLoader {
  constructor(logger, fileOps) {
    this.logger = logger;
    this.fileOps = fileOps;
    this.cache = new Map();
  }

  loadMasterConfig() {
    const cacheKey = 'master-config';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = PathResolver.getConfigFilePath('contracts', 'masterConfig');
      
      if (!this.fileOps.exists(configPath)) {
        throw new Error(`Master config not found: ${configPath}`);
      }

      const masterConfig = this.fileOps.readJSON(configPath);
      
      // 驗證必要字段
      this.validateMasterConfig(masterConfig);
      
      // 轉換為標準格式
      const v25Config = this.convertToV25Format(masterConfig);
      
      this.cache.set(cacheKey, v25Config);
      this.logger.success(`✅ 已載入主配置: ${Object.keys(v25Config.contracts).length} 個合約`);
      
      return v25Config;
      
    } catch (error) {
      this.logger.error('Failed to load master config', error);
      throw error;
    }
  }

  validateMasterConfig(config) {
    const requiredFields = ['version', 'lastUpdated', 'contracts'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field in master config: ${field}`);
      }
    }

    if (!config.contracts.mainnet) {
      throw new Error('Master config missing mainnet contracts');
    }

    // 驗證必要的合約地址
    const requiredContracts = [
      'DUNGEONCORE_ADDRESS', 'ORACLE_ADDRESS', 'HERO_ADDRESS', 
      'RELIC_ADDRESS', 'PARTY_ADDRESS', 'DUNGEONMASTER_ADDRESS'
    ];

    for (const contract of requiredContracts) {
      if (!config.contracts.mainnet[contract]) {
        throw new Error(`Missing required contract: ${contract}`);
      }
    }
  }

  convertToV25Format(masterConfig) {
    const contracts = {};
    
    // 轉換合約地址格式
    for (const [key, address] of Object.entries(masterConfig.contracts.mainnet)) {
      const contractName = key.replace('_ADDRESS', '');
      contracts[contractName] = {
        address,
        deploymentBlock: masterConfig.deployment?.startBlock || masterConfig.deployment?.blockNumber || 56664525,
        contractName
      };
    }

    return {
      version: masterConfig.version,
      lastUpdated: masterConfig.lastUpdated,
      network: masterConfig.network?.name || 'BSC Mainnet',
      deployer: masterConfig.contracts.mainnet.DUNGEONMASTERWALLET_ADDRESS || '0x10925A7138649C7E1794CE646182eeb5BF8ba647',
      startBlock: masterConfig.deployment?.startBlock || masterConfig.deployment?.blockNumber || 56664525,
      contracts,
      subgraphVersion: masterConfig.subgraph?.studio?.version || null
    };
  }

  validateAddresses(config) {
    this.logger.info('驗證地址唯一性...');
    
    const addresses = [];
    const duplicates = [];

    for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
      const address = contractInfo.address.toLowerCase();
      
      if (addresses.includes(address)) {
        duplicates.push({ address, contracts: [contractName] });
      } else {
        addresses.push(address);
      }
    }

    if (duplicates.length > 0) {
      this.logger.error('發現重複地址:', duplicates);
      throw new Error('Address validation failed: duplicate addresses found');
    }

    this.logger.success('✅ 地址唯一性驗證通過');
    return true;
  }

  getSubgraphConfig(subgraphVersion = null) {
    const masterConfig = this.loadMasterConfig();
    
    return {
      studio: {
        version: subgraphVersion || masterConfig.subgraphVersion || 'v3.6.1',
        url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${subgraphVersion || masterConfig.subgraphVersion || 'v3.6.1'}`
      },
      decentralized: {
        url: 'https://gateway-arbitrum.network.thegraph.com/api/[api-key]/subgraphs/id/...'
      }
    };
  }

  getCDNConfig() {
    const config = this.loadMasterConfig();
    const subgraphConfig = this.getSubgraphConfig(config.subgraphVersion);
    
    return {
      version: config.version,
      lastUpdated: config.lastUpdated,
      network: config.network,
      contracts: Object.fromEntries(
        Object.entries(config.contracts).map(([name, info]) => [name, info.address])
      ),
      subgraph: subgraphConfig,
      services: {
        subgraph: {
          url: subgraphConfig.studio.url,
          id: "dungeon-delvers"
        },
        metadataServer: {
          url: "https://dungeon-delvers-metadata-server.vercel.app"
        }
      }
    };
  }

  getContractAddresses() {
    const config = this.loadMasterConfig();
    return Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );
  }

  clearCache() {
    this.cache.clear();
    this.logger.debug('Configuration cache cleared');
  }

  reloadConfig() {
    this.clearCache();
    return this.loadMasterConfig();
  }
}

module.exports = ConfigLoader;
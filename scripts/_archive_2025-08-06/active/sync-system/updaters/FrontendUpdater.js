/**
 * 前端更新器
 * 專門處理 React 前端項目的配置更新
 */

const { PathResolver } = require('../config/project-paths');

class FrontendUpdater {
  constructor(logger, fileOps, backupManager) {
    this.logger = logger.child('FRONTEND');
    this.fileOps = fileOps;
    this.backupManager = backupManager;
  }

  async updateAll(config, subgraphVersion = null) {
    this.logger.section('🎯 更新前端配置...');
    
    const results = [];
    
    try {
      // 1. 更新合約配置文件
      const contractsResult = await this.updateContractsConfig(config);
      results.push(contractsResult);
      
      // 2. 更新帶 ABI 的合約配置
      const contractsWithABIResult = await this.updateContractsWithABI(config);
      results.push(contractsWithABIResult);
      
      // 3. 更新環境變數文件
      const envResult = await this.updateEnvironmentFiles(config, subgraphVersion);
      results.push(envResult);
      
      // 4. 更新硬編碼的子圖 URL
      if (subgraphVersion) {
        const hardcodedResult = await this.updateHardcodedURLs(subgraphVersion);
        results.push(hardcodedResult);
      }
      
      // 5. 生成 CDN 配置
      const cdnResult = await this.generateCDNConfigs(config, subgraphVersion);
      results.push(cdnResult);
      
      const successCount = results.filter(r => r.success).length;
      this.logger.success(`✅ 前端更新完成: ${successCount}/${results.length}`);
      
    } catch (error) {
      this.logger.error('前端更新失敗', error);
      throw error;
    }
    
    return results;
  }

  async updateContractsConfig(config) {
    this.logger.info('更新 contracts.ts...');
    
    try {
      const contractsPath = PathResolver.getConfigFilePath('frontend', 'contracts');
      
      if (!this.fileOps.exists(contractsPath)) {
        throw new Error(`Contracts config not found: ${contractsPath}`);
      }
      
      // 備份
      this.backupManager.backup(contractsPath, 'contracts-update');
      
      // 生成新配置內容
      const newContent = this.generateContractsTS(config);
      
      // 寫入文件
      this.fileOps.writeFile(contractsPath, newContent);
      
      this.logger.success('✅ contracts.ts 已更新');
      return { type: 'contracts-config', success: true, file: contractsPath };
      
    } catch (error) {
      this.logger.error('更新 contracts.ts 失敗', error);
      return { type: 'contracts-config', success: false, error: error.message };
    }
  }

  generateContractsTS(config) {
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return `// V25 Contract Configuration
// Generated on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY - Use v25-sync-all.js to update

export const CONTRACTS = {
  56: { // BSC Mainnet
    // Core Contracts
    DUNGEONCORE: '${addresses.DUNGEONCORE}',
    ORACLE: '${addresses.ORACLE}',
    
    // Token Contracts
    SOULSHARD: '${addresses.SOULSHARD}',
    
    // NFT Contracts
    HERO: '${addresses.HERO}',
    RELIC: '${addresses.RELIC}',
    PARTY: '${addresses.PARTY}',
    
    // Game Contracts
    DUNGEONMASTER: '${addresses.DUNGEONMASTER}',
    DUNGEONSTORAGE: '${addresses.DUNGEONSTORAGE}',
    PLAYERVAULT: '${addresses.PLAYERVAULT}',
    PLAYERPROFILE: '${addresses.PLAYERPROFILE}',
    
    // Feature Contracts
    VIPSTAKING: '${addresses.VIPSTAKING}',
    ALTAROFASCENSION: '${addresses.ALTAROFASCENSION}',
    
    // External
    DUNGEONMASTERWALLET: '${addresses.DUNGEONMASTERWALLET}',
  }
} as const;

// Contract version for tracking
export const CONTRACT_VERSION = '${config.version}';

// Export individual addresses for convenience
export const {
  DUNGEONCORE,
  ORACLE,
  SOULSHARD,
  HERO,
  RELIC,
  PARTY,
  DUNGEONMASTER,
  DUNGEONSTORAGE,
  PLAYERVAULT,
  PLAYERPROFILE,
  VIPSTAKING,
  ALTAROFASCENSION,
  DUNGEONMASTERWALLET,
} = CONTRACTS[56];

// Legacy compatibility - for V24 format
export const CONTRACT_ADDRESSES = CONTRACTS[56];

// Helper functions for backward compatibility
export const getContract = (name: keyof typeof CONTRACT_ADDRESSES): string => {
  return CONTRACT_ADDRESSES[name];
};

export const getContractAddress = (name: string): string => {
  return CONTRACT_ADDRESSES[name as keyof typeof CONTRACT_ADDRESSES] || '';
};

// Export contract info for debugging
export const CONTRACT_INFO = {
  version: CONTRACT_VERSION,
  network: "${config.network}",
  deploymentBlock: ${config.startBlock},
  lastUpdated: "${config.lastUpdated}"
};

// Legacy contract name mappings for backward compatibility
export const LEGACY_CONTRACT_NAMES = {
  soulShardToken: 'SOULSHARD',
  testUsd: 'USD'
} as const;
`;
  }

  async updateContractsWithABI(config) {
    this.logger.info('更新 contractsWithABI.ts...');
    
    try {
      const contractsWithABIPath = PathResolver.getConfigFilePath('frontend', 'contractsWithABI');
      
      if (!this.fileOps.exists(contractsWithABIPath)) {
        this.logger.warning('contractsWithABI.ts 不存在，跳過更新');
        return { type: 'contracts-with-abi', success: true, skipped: true };
      }
      
      // 備份
      this.backupManager.backup(contractsWithABIPath, 'contracts-abi-update');
      
      // 讀取現有內容並更新地址
      let content = this.fileOps.readFile(contractsWithABIPath);
      
      // 更新合約地址
      for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
        const addressPattern = new RegExp(
          `(${contractName}\\s*:\\s*{[^}]*address\\s*:\\s*)['"\`][^'"\`]+['"\`]`,
          'g'
        );
        content = content.replace(addressPattern, `$1'${contractInfo.address}'`);
      }
      
      // 更新時間戳
      content = content.replace(
        /Generated on [^\\n]+/,
        `Generated on ${new Date().toISOString()}`
      );
      
      this.fileOps.writeFile(contractsWithABIPath, content);
      
      this.logger.success('✅ contractsWithABI.ts 已更新');
      return { type: 'contracts-with-abi', success: true, file: contractsWithABIPath };
      
    } catch (error) {
      this.logger.error('更新 contractsWithABI.ts 失敗', error);
      return { type: 'contracts-with-abi', success: false, error: error.message };
    }
  }

  async updateEnvironmentFiles(config, subgraphVersion) {
    this.logger.info('更新環境變數文件...');
    
    const results = [];
    const envFiles = ['.env', '.env.local'];
    
    for (const envFile of envFiles) {
      try {
        const envPath = PathResolver.getProjectPath('frontend') + '/' + envFile;
        
        if (!this.fileOps.exists(envPath)) {
          this.logger.info(`${envFile} 不存在，跳過`);
          continue;
        }
        
        // 備份
        this.backupManager.backup(envPath, 'env-update');
        
        // 準備替換規則
        const replacements = this.generateEnvReplacements(config, subgraphVersion);
        
        // 執行替換
        const result = this.fileOps.replaceInFile(envPath, replacements, false);
        
        if (result.success) {
          this.logger.success(`✅ ${envFile} 已更新`);
          results.push({ file: envFile, success: true });
        } else {
          this.logger.warning(`⚠️ ${envFile} 沒有變更`);
          results.push({ file: envFile, success: true, noChanges: true });
        }
        
      } catch (error) {
        this.logger.error(`更新 ${envFile} 失敗`, error);
        results.push({ file: envFile, success: false, error: error.message });
      }
    }
    
    return { type: 'environment-files', success: true, details: results };
  }

  generateEnvReplacements(config, subgraphVersion) {
    const version = subgraphVersion || 'v3.6.1';
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return [
      // 子圖 URL 更新
      {
        pattern: /VITE_THE_GRAPH_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `VITE_THE_GRAPH_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
        description: 'Studio API URL'
      },
      {
        pattern: /VITE_THE_GRAPH_STUDIO_API_URL=https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+/,
        replacement: `VITE_THE_GRAPH_STUDIO_API_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
        description: 'Studio API URL (alternative)'
      },
      // 合約地址更新
      ...Object.entries(addresses).map(([name, address]) => ({
        pattern: new RegExp(`VITE_${name}_ADDRESS=0x[a-fA-F0-9]{40}`),
        replacement: `VITE_${name}_ADDRESS=${address}`,
        description: `${name} 合約地址`
      }))
    ];
  }

  async updateHardcodedURLs(subgraphVersion) {
    this.logger.info('更新硬編碼子圖 URL...');
    
    const results = [];
    const filesToUpdate = [
      { path: 'src/config/configLoader.ts', patterns: this.getConfigLoaderPatterns(subgraphVersion) },
      { path: 'src/config/graphql.ts', patterns: this.getGraphQLPatterns(subgraphVersion) }
    ];
    
    for (const { path: relativePath, patterns } of filesToUpdate) {
      try {
        const fullPath = PathResolver.getProjectPath('frontend') + '/' + relativePath;
        
        if (!this.fileOps.exists(fullPath)) {
          this.logger.warning(`${relativePath} 不存在`);
          continue;
        }
        
        // 備份
        this.backupManager.backup(fullPath, 'hardcoded-url-update');
        
        // 執行替換
        const result = this.fileOps.replaceInFile(fullPath, patterns, false);
        
        if (result.success) {
          this.logger.success(`✅ 更新 ${relativePath}`);
          results.push({ file: relativePath, success: true });
        } else {
          this.logger.warning(`⚠️ ${relativePath} 沒有找到匹配模式`);
          results.push({ file: relativePath, success: true, noChanges: true });
        }
        
      } catch (error) {
        this.logger.error(`更新 ${relativePath} 失敗`, error);
        results.push({ file: relativePath, success: false, error: error.message });
      }
    }
    
    return { type: 'hardcoded-urls', success: true, details: results };
  }

  getConfigLoaderPatterns(version) {
    return [
      {
        pattern: /studio:\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
        replacement: `studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}'`,
        description: 'Studio URL in configLoader'
      }
    ];
  }

  getGraphQLPatterns(version) {
    return [
      {
        pattern: /url:\s*import\.meta\.env\.VITE_THE_GRAPH_STUDIO_API_URL\s*\|\|\s*\n\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers(?:---bsc)?\/v\d+\.\d+\.\d+'/,
        replacement: `url: import.meta.env.VITE_THE_GRAPH_STUDIO_API_URL || \n         'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}'`,
        description: 'GraphQL client URL'
      }
    ];
  }

  async generateCDNConfigs(config, subgraphVersion) {
    this.logger.info('生成 CDN 配置文件...');
    
    try {
      const cdnConfigPath = PathResolver.getConfigFilePath('frontend', 'cdnConfigs');
      
      // 確保目錄存在
      this.fileOps.ensureDirectory(cdnConfigPath);
      
      // 生成配置內容
      const cdnConfig = this.generateCDNConfigContent(config, subgraphVersion);
      
      // 寫入文件
      const v25Path = cdnConfigPath + '/v25.json';
      const latestPath = cdnConfigPath + '/latest.json';
      
      this.fileOps.writeJSON(v25Path, cdnConfig);
      this.fileOps.writeJSON(latestPath, cdnConfig);
      
      this.logger.success('✅ CDN 配置文件已生成');
      return { 
        type: 'cdn-configs', 
        success: true, 
        files: [v25Path, latestPath] 
      };
      
    } catch (error) {
      this.logger.error('生成 CDN 配置失敗', error);
      return { type: 'cdn-configs', success: false, error: error.message };
    }
  }

  generateCDNConfigContent(config, subgraphVersion) {
    const version = subgraphVersion || config.subgraphVersion || 'v3.6.1';
    
    return {
      version: config.version,
      lastUpdated: config.lastUpdated,
      network: config.network,
      contracts: Object.fromEntries(
        Object.entries(config.contracts).map(([name, info]) => [name, info.address])
      ),
      subgraph: {
        studio: {
          version,
          url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`
        },
        decentralized: {
          url: 'https://gateway-arbitrum.network.thegraph.com/api/[api-key]/subgraphs/id/...'
        }
      },
      services: {
        subgraph: {
          url: `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}`,
          id: 'dungeon-delvers'
        },
        metadataServer: {
          url: 'https://dungeon-delvers-metadata-server.vercel.app'
        }
      }
    };
  }
}

module.exports = FrontendUpdater;
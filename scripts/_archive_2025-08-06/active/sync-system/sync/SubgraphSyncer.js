/**
 * 子圖同步器
 * 專門處理 Graph Protocol 子圖的配置更新
 */

const { PathResolver } = require('../config/project-paths');
const yaml = require('js-yaml');

class SubgraphSyncer {
  constructor(logger, fileOps, backupManager) {
    this.logger = logger.child('SUBGRAPH');
    this.fileOps = fileOps;
    this.backupManager = backupManager;
  }

  async syncAll(config, subgraphVersion = null) {
    this.logger.section('📊 同步子圖配置...');
    
    const results = [];
    
    try {
      // 1. 更新 networks.json
      const networksResult = await this.updateNetworks(config);
      results.push(networksResult);
      
      // 2. 更新 subgraph.yaml
      const yamlResult = await this.updateSubgraphYaml(config);
      results.push(yamlResult);
      
      // 3. 更新 config.ts
      const configResult = await this.updateSubgraphConfig(config, subgraphVersion);
      results.push(configResult);
      
      // 4. 更新 package.json 版本
      if (subgraphVersion) {
        const packageResult = await this.updatePackageVersion(subgraphVersion);
        results.push(packageResult);
      }
      
      const successCount = results.filter(r => r.success).length;
      this.logger.success(`✅ 子圖同步完成: ${successCount}/${results.length}`);
      
    } catch (error) {
      this.logger.error('子圖同步失敗', error);
      throw error;
    }
    
    return results;
  }

  async updateNetworks(config) {
    this.logger.info('更新子圖 networks.json...');
    
    try {
      const networksPath = PathResolver.getConfigFilePath('subgraph', 'networks');
      
      if (!this.fileOps.exists(networksPath)) {
        this.logger.warning('networks.json 不存在，創建新文件');
      } else {
        // 備份現有文件
        this.backupManager.backup(networksPath, 'networks-update');
      }
      
      // 生成 networks 配置
      const networksConfig = this.generateNetworksConfig(config);
      
      // 寫入文件
      this.fileOps.writeJSON(networksPath, networksConfig);
      
      this.logger.success('✅ 子圖 networks.json 已更新');
      return { type: 'subgraph-networks', success: true, file: networksPath };
      
    } catch (error) {
      this.logger.error('更新 networks.json 失敗', error);
      return { type: 'subgraph-networks', success: false, error: error.message };
    }
  }

  generateNetworksConfig(config) {
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return {
      bsc: {
        // 合約地址（帶 _ADDRESS 後綴，符合子圖慣例）
        HERO_ADDRESS: addresses.HERO,
        RELIC_ADDRESS: addresses.RELIC,
        PARTY_ADDRESS: addresses.PARTY,
        VIPSTAKING_ADDRESS: addresses.VIPSTAKING,
        PLAYERPROFILE_ADDRESS: addresses.PLAYERPROFILE,
        ALTAROFASCENSION_ADDRESS: addresses.ALTAROFASCENSION,
        DUNGEONMASTER_ADDRESS: addresses.DUNGEONMASTER,
        PLAYERVAULT_ADDRESS: addresses.PLAYERVAULT,
        
        // 起始區塊
        HERO_START_BLOCK: config.startBlock,
        RELIC_START_BLOCK: config.startBlock,
        PARTY_START_BLOCK: config.startBlock,
        VIPSTAKING_START_BLOCK: config.startBlock,
        PLAYERPROFILE_START_BLOCK: config.startBlock,
        ALTAROFASCENSION_START_BLOCK: config.startBlock,
        DUNGEONMASTER_START_BLOCK: config.startBlock,
        PLAYERVAULT_START_BLOCK: config.startBlock,
        
        // 網絡信息
        network: 'bsc',
        chainId: 56
      }
    };
  }

  async updateSubgraphYaml(config) {
    this.logger.info('更新子圖 YAML...');
    
    try {
      const yamlPath = PathResolver.getConfigFilePath('subgraph', 'yaml');
      
      if (!this.fileOps.exists(yamlPath)) {
        this.logger.error('subgraph.yaml 不存在');
        return { type: 'subgraph-yaml', success: false, error: 'File not found' };
      }
      
      // 備份
      this.backupManager.backup(yamlPath, 'yaml-update');
      
      // 讀取現有 YAML
      let yamlContent = this.fileOps.readFile(yamlPath);
      
      // 更新地址和起始區塊
      const replacements = this.generateYamlReplacements(config);
      
      for (const { pattern, replacement, description } of replacements) {
        const originalContent = yamlContent;
        yamlContent = yamlContent.replace(pattern, replacement);
        
        if (yamlContent !== originalContent) {
          this.logger.success(`✅ 更新 ${description}`);
        }
      }
      
      // 寫回文件
      this.fileOps.writeFile(yamlPath, yamlContent);
      
      this.logger.success('✅ 子圖 YAML 已更新');
      return { type: 'subgraph-yaml', success: true, file: yamlPath };
      
    } catch (error) {
      this.logger.error('更新 subgraph.yaml 失敗', error);
      return { type: 'subgraph-yaml', success: false, error: error.message };
    }
  }

  generateYamlReplacements(config) {
    const replacements = [];
    
    // 合約地址和起始區塊的映射
    const contractMappings = [
      { name: 'Hero', key: 'HERO' },
      { name: 'Relic', key: 'RELIC' },
      { name: 'PartyV3', key: 'PARTY' },
      { name: 'VIPStaking', key: 'VIPSTAKING' },
      { name: 'PlayerProfile', key: 'PLAYERPROFILE' },
      { name: 'AltarOfAscension', key: 'ALTAROFASCENSION' },
      { name: 'DungeonMaster', key: 'DUNGEONMASTER' },
      { name: 'PlayerVault', key: 'PLAYERVAULT' }
    ];

    for (const mapping of contractMappings) {
      const contractInfo = config.contracts[mapping.key];
      if (!contractInfo) continue;

      // 更新地址
      replacements.push({
        pattern: new RegExp(`(name: ${mapping.name}[\\s\\S]*?address:)\\s*['"]0x[a-fA-F0-9]{40}['"]`, 'g'),
        replacement: `$1 "${contractInfo.address}"`,
        description: `${mapping.name} 地址`
      });

      // 更新起始區塊
      replacements.push({
        pattern: new RegExp(`(name: ${mapping.name}[\\s\\S]*?startBlock:)\\s*\\d+`, 'g'),
        replacement: `$1 ${config.startBlock}`,
        description: `${mapping.name} 起始區塊`
      });
    }

    return replacements;
  }

  async updateSubgraphConfig(config, subgraphVersion) {
    this.logger.info('更新子圖 config.ts...');
    
    try {
      const configPath = PathResolver.getConfigFilePath('subgraph', 'config');
      
      if (!this.fileOps.exists(configPath)) {
        this.logger.warning('config.ts 不存在，創建新文件');
      } else {
        // 備份
        this.backupManager.backup(configPath, 'config-update');
      }
      
      // 生成配置內容
      const configContent = this.generateSubgraphConfigTS(config, subgraphVersion);
      
      // 寫入文件
      this.fileOps.writeFile(configPath, configContent);
      
      this.logger.success('✅ 子圖 config.ts 已更新');
      return { type: 'subgraph-config', success: true, file: configPath };
      
    } catch (error) {
      this.logger.error('更新 config.ts 失敗', error);
      return { type: 'subgraph-config', success: false, error: error.message };
    }
  }

  generateSubgraphConfigTS(config, subgraphVersion) {
    const version = subgraphVersion || config.subgraphVersion || 'v3.6.1';
    const addresses = Object.fromEntries(
      Object.entries(config.contracts).map(([name, info]) => [name, info.address])
    );

    return `/**
 * Subgraph Configuration
 * Generated on ${new Date().toISOString()}
 * DO NOT EDIT MANUALLY - Use sync-system to update
 */

export const config = {
  network: 'bsc',
  version: '${version}',
  
  contracts: {
    hero: '${addresses.HERO}',
    relic: '${addresses.RELIC}',
    party: '${addresses.PARTY}',
    vipStaking: '${addresses.VIPSTAKING}',
    playerProfile: '${addresses.PLAYERPROFILE}',
    altarOfAscension: '${addresses.ALTAROFASCENSION}',
    dungeonMaster: '${addresses.DUNGEONMASTER}',
    playerVault: '${addresses.PLAYERVAULT}'
  },
  
  startBlock: ${config.startBlock},
  
  // Subgraph endpoints
  endpoints: {
    studio: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${version}',
    decentralized: 'https://gateway-arbitrum.network.thegraph.com/api/[api-key]/subgraphs/id/...'
  },
  
  // Features
  features: {
    trackTransfers: true,
    trackMinting: true,
    trackBurning: true,
    trackStaking: true,
    trackDungeonRuns: true
  }
};

// Export individual contracts for convenience
export const contracts = config.contracts;
export const startBlock = config.startBlock;
export const network = config.network;
`;
  }

  async updatePackageVersion(subgraphVersion) {
    this.logger.info('更新子圖 package.json 版本...');
    
    try {
      const packagePath = PathResolver.getConfigFilePath('subgraph', 'packageJson');
      
      if (!this.fileOps.exists(packagePath)) {
        this.logger.warning('package.json 不存在');
        return { type: 'subgraph-package', success: true, skipped: true };
      }
      
      // 備份
      this.backupManager.backup(packagePath, 'package-update');
      
      // 讀取並更新
      const packageJson = this.fileOps.readJSON(packagePath);
      const oldVersion = packageJson.version;
      
      // 將版本號格式化（移除 v 前綴）
      const newVersion = subgraphVersion.replace(/^v/, '');
      
      if (oldVersion === newVersion) {
        this.logger.warning(`⚠️ 子圖版本已經是 ${newVersion}，無需更新`);
        return { type: 'subgraph-package', success: true, noChanges: true };
      }
      
      packageJson.version = newVersion;
      this.fileOps.writeJSON(packagePath, packageJson);
      
      this.logger.success(`✅ 子圖 package.json 版本已更新: ${oldVersion} → ${newVersion}`);
      return { 
        type: 'subgraph-package', 
        success: true, 
        oldVersion, 
        newVersion 
      };
      
    } catch (error) {
      this.logger.error('更新 package.json 失敗', error);
      return { type: 'subgraph-package', success: false, error: error.message };
    }
  }

  async validateSubgraphConfig(config) {
    this.logger.info('驗證子圖配置...');
    
    const issues = [];
    
    try {
      // 檢查 networks.json
      const networksPath = PathResolver.getConfigFilePath('subgraph', 'networks');
      if (this.fileOps.exists(networksPath)) {
        const networks = this.fileOps.readJSON(networksPath);
        
        for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
          const addressKey = `${contractName}_ADDRESS`;
          if (networks.bsc && networks.bsc[addressKey] !== contractInfo.address) {
            issues.push(`networks.json: ${contractName} 地址不匹配`);
          }
        }
      }
      
      // 檢查 subgraph.yaml
      const yamlPath = PathResolver.getConfigFilePath('subgraph', 'yaml');
      if (this.fileOps.exists(yamlPath)) {
        const yamlContent = this.fileOps.readFile(yamlPath);
        
        for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
          if (!yamlContent.includes(contractInfo.address)) {
            issues.push(`subgraph.yaml: ${contractName} 地址未找到`);
          }
        }
      }
      
    } catch (error) {
      issues.push(`驗證失敗: ${error.message}`);
    }
    
    if (issues.length === 0) {
      this.logger.success('✅ 子圖配置驗證通過');
    } else {
      this.logger.warning(`⚠️ 發現 ${issues.length} 個子圖配置問題`);
      issues.forEach(issue => this.logger.warning(`  - ${issue}`));
    }
    
    return { success: issues.length === 0, issues };
  }

  async prepareDeploymentCommand(subgraphVersion) {
    const version = subgraphVersion || 'v3.6.1';
    
    const commands = [
      'cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
      'npm run codegen',
      'npm run build',
      `graph deploy --studio dungeon-delvers --version ${version}`
    ];
    
    this.logger.info('📝 子圖部署命令:');
    commands.forEach(cmd => console.log(`  ${cmd}`));
    
    return commands;
  }
}

module.exports = SubgraphSyncer;
/**
 * 項目路徑配置
 * 集中管理所有項目的路徑和配置文件位置
 */

const path = require('path');

// 基礎項目路徑
const PROJECT_PATHS = {
  frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

// 配置文件路徑映射
const CONFIG_FILES = {
  // 合約項目
  contracts: {
    masterConfig: 'config/master-config.json',
    configReader: 'config/config-reader.js',
    abiArtifacts: 'artifacts/contracts'
  },

  // 前端項目
  frontend: {
    contracts: 'src/config/contracts.ts',
    contractsWithABI: 'src/config/contractsWithABI.ts',
    env: '.env',
    envLocal: '.env.local',
    cdnConfigs: 'public/config',
    abis: 'src/abis'
  },

  // 後端項目
  backend: {
    contracts: 'config/contracts.js',
    env: '.env',
    sharedConfig: 'config/shared-config.json'
  },

  // 子圖項目
  subgraph: {
    config: 'src/config.ts',
    networks: 'networks.json',
    yaml: 'subgraph.yaml',
    packageJson: 'package.json',
    abis: 'abis'
  }
};

// ABI 同步配置
const ABI_SYNC_CONFIG = [
  {
    contractName: 'HERO',
    artifactName: 'Hero',
    destinations: [
      { type: 'frontend', path: 'src/abis/Hero.json' },
      { type: 'subgraph', path: 'abis/Hero.json' }
    ]
  },
  {
    contractName: 'RELIC',
    artifactName: 'Relic',
    destinations: [
      { type: 'frontend', path: 'src/abis/Relic.json' },
      { type: 'subgraph', path: 'abis/Relic.json' }
    ]
  },
  {
    contractName: 'PARTY',
    artifactName: 'PartyV3',
    contractFile: 'Party',
    destinations: [
      { type: 'frontend', path: 'src/abis/Party.json' },
      { type: 'subgraph', path: 'abis/PartyV3.json' }
    ]
  },
  {
    contractName: 'VIPSTAKING',
    artifactName: 'VIPStaking',
    contractFile: 'VIPStaking',
    destinations: [
      { type: 'frontend', path: 'src/abis/VIPStaking.json' },
      { type: 'subgraph', path: 'abis/VIPStaking.json' }
    ]
  },
  {
    contractName: 'PLAYERPROFILE',
    artifactName: 'PlayerProfile',
    contractFile: 'PlayerProfile',
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerProfile.json' },
      { type: 'subgraph', path: 'abis/PlayerProfile.json' }
    ]
  },
  {
    contractName: 'ALTAROFASCENSION',
    artifactName: 'AltarOfAscensionV2Fixed',
    contractFile: 'AltarOfAscension',
    destinations: [
      { type: 'frontend', path: 'src/abis/AltarOfAscension.json' },
      { type: 'subgraph', path: 'abis/AltarOfAscensionV2Fixed.json' }
    ]
  },
  {
    contractName: 'DUNGEONMASTER',
    artifactName: 'DungeonMasterV2_Fixed',
    contractFile: 'DungeonMaster',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonMaster.json' },
      { type: 'subgraph', path: 'abis/DungeonMaster.json' }
    ]
  },
  {
    contractName: 'DUNGEONCORE',
    artifactName: 'DungeonCore',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonCore.json' }
    ]
  },
  {
    contractName: 'ORACLE',
    artifactName: 'Oracle',
    destinations: [
      { type: 'frontend', path: 'src/abis/Oracle.json' }
    ]
  },
  {
    contractName: 'PLAYERVAULT',
    artifactName: 'PlayerVault',
    destinations: [
      { type: 'frontend', path: 'src/abis/PlayerVault.json' },
      { type: 'subgraph', path: 'abis/PlayerVault.json' }
    ]
  },
  {
    contractName: 'DUNGEONSTORAGE',
    artifactName: 'DungeonStorage',
    destinations: [
      { type: 'frontend', path: 'src/abis/DungeonStorage.json' }
    ]
  },
  {
    contractName: 'SOULSHARD',
    artifactName: 'SoulShardToken',
    destinations: [
      { type: 'frontend', path: 'src/abis/SoulShardToken.json' }
    ]
  }
];

class PathResolver {
  static getProjectPath(projectName) {
    if (!PROJECT_PATHS[projectName]) {
      throw new Error(`Unknown project: ${projectName}`);
    }
    return PROJECT_PATHS[projectName];
  }

  static getConfigFilePath(projectName, configType) {
    const projectPath = this.getProjectPath(projectName);
    const configPath = CONFIG_FILES[projectName]?.[configType];
    
    if (!configPath) {
      throw new Error(`Unknown config type: ${configType} for project: ${projectName}`);
    }
    
    return path.join(projectPath, configPath);
  }

  static getABIArtifactPath(contractFile, artifactName) {
    const contractsPath = this.getProjectPath('contracts');
    let artifactPath;
    
    if (contractFile) {
      // 根據合約文件查找
      const possiblePaths = [
        `artifacts/contracts/current/core/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/current/nft/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/current/game/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/current/token/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/current/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/core/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/nft/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/game/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/token/${contractFile}.sol/${artifactName}.json`,
        `artifacts/contracts/${contractFile}.sol/${artifactName}.json`
      ];
      
      for (const possiblePath of possiblePaths) {
        const fullPath = path.join(contractsPath, possiblePath);
        if (require('fs').existsSync(fullPath)) {
          artifactPath = fullPath;
          break;
        }
      }
    }
    
    if (!artifactPath) {
      throw new Error(`ABI artifact not found: ${artifactName} (${contractFile})`);
    }
    
    return artifactPath;
  }

  static getABIDestinationPath(projectType, relativePath) {
    const projectPath = this.getProjectPath(projectType);
    return path.join(projectPath, relativePath);
  }
}

module.exports = {
  PROJECT_PATHS,
  CONFIG_FILES,
  ABI_SYNC_CONFIG,
  PathResolver
};
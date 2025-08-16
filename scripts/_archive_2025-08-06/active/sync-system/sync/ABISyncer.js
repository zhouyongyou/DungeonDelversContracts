/**
 * ABI 同步器
 * 專門處理智能合約 ABI 文件的同步
 */

const { execSync } = require('child_process');
const { ABI_SYNC_CONFIG, PathResolver } = require('../config/project-paths');

class ABISyncer {
  constructor(logger, fileOps, backupManager) {
    this.logger = logger.child('ABI');
    this.fileOps = fileOps;
    this.backupManager = backupManager;
  }

  async syncAll() {
    this.logger.section('🔄 同步 ABI 文件...');
    
    // 1. 確保合約已編譯
    await this.compileContracts();
    
    // 2. 同步每個合約的 ABI
    const results = [];
    for (const config of ABI_SYNC_CONFIG) {
      try {
        const result = await this.syncContract(config);
        results.push({ ...result, success: true });
      } catch (error) {
        this.logger.error(`ABI 同步失敗: ${config.contractName}`, error);
        results.push({ 
          contractName: config.contractName, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    this.logger.success(`✅ ABI 同步完成: ${successCount}/${results.length}`);
    
    return results;
  }

  async compileContracts() {
    this.logger.info('編譯智能合約...');
    
    try {
      const contractsPath = PathResolver.getProjectPath('contracts');
      execSync('npx hardhat compile', { 
        cwd: contractsPath, 
        stdio: 'pipe' 
      });
      
      this.logger.success('✅ 合約編譯完成');
    } catch (error) {
      this.logger.error('合約編譯失敗', error);
      throw new Error(`Contract compilation failed: ${error.message}`);
    }
  }

  async syncContract(config) {
    this.logger.info(`處理 ${config.contractName} ABI...`);
    
    // 1. 找到 ABI 源文件
    const abiSourcePath = this.findABISource(config);
    
    // 2. 讀取 ABI 內容
    const abiData = this.fileOps.readJSON(abiSourcePath);
    
    // 3. 同步到各個目標位置
    const destinations = [];
    for (const dest of config.destinations) {
      const destPath = PathResolver.getABIDestinationPath(dest.type, dest.path);
      
      // 備份現有文件
      if (this.fileOps.exists(destPath)) {
        this.backupManager.backup(destPath, 'abi-sync');
      }
      
      // 寫入新 ABI
      this.fileOps.writeJSON(destPath, abiData);
      destinations.push(destPath);
      
      this.logger.success(`✅ ${config.contractName} ABI 已複製到 ${dest.type}`);
    }
    
    return {
      contractName: config.contractName,
      sourceFile: abiSourcePath,
      destinations,
      abiSize: JSON.stringify(abiData).length
    };
  }

  findABISource(config) {
    try {
      return PathResolver.getABIArtifactPath(
        config.contractFile, 
        config.artifactName
      );
    } catch (error) {
      // 如果找不到，嘗試常見位置
      const contractsPath = PathResolver.getProjectPath('contracts');
      const commonPaths = [
        `artifacts/contracts/current/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/current/core/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/current/game/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/current/nft/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/current/token/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/core/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/game/${config.artifactName}.sol/${config.artifactName}.json`,
        `artifacts/contracts/nft/${config.artifactName}.sol/${config.artifactName}.json`
      ];
      
      for (const commonPath of commonPaths) {
        const fullPath = require('path').join(contractsPath, commonPath);
        if (this.fileOps.exists(fullPath)) {
          return fullPath;
        }
      }
      
      throw new Error(`ABI source not found for ${config.contractName} (${config.artifactName})`);
    }
  }

  async validateABIs() {
    this.logger.info('驗證 ABI 文件...');
    
    const issues = [];
    
    for (const config of ABI_SYNC_CONFIG) {
      try {
        // 檢查源文件
        const sourcePath = this.findABISource(config);
        const sourceABI = this.fileOps.readJSON(sourcePath);
        
        if (!sourceABI.abi || !Array.isArray(sourceABI.abi)) {
          issues.push(`${config.contractName}: 源 ABI 格式無效`);
          continue;
        }
        
        // 檢查目標文件
        for (const dest of config.destinations) {
          const destPath = PathResolver.getABIDestinationPath(dest.type, dest.path);
          
          if (!this.fileOps.exists(destPath)) {
            issues.push(`${config.contractName}: 目標文件不存在 (${dest.type})`);
            continue;
          }
          
          const destABI = this.fileOps.readJSON(destPath);
          
          // 比較 ABI 是否一致
          if (JSON.stringify(sourceABI.abi) !== JSON.stringify(destABI.abi)) {
            issues.push(`${config.contractName}: ABI 不一致 (${dest.type})`);
          }
        }
        
      } catch (error) {
        issues.push(`${config.contractName}: 驗證失敗 - ${error.message}`);
      }
    }
    
    if (issues.length === 0) {
      this.logger.success('✅ 所有 ABI 驗證通過');
    } else {
      this.logger.warning(`⚠️ 發現 ${issues.length} 個 ABI 問題`);
      issues.forEach(issue => this.logger.warning(`  - ${issue}`));
    }
    
    return { success: issues.length === 0, issues };
  }

  async getABIStats() {
    const stats = {
      totalContracts: ABI_SYNC_CONFIG.length,
      totalDestinations: ABI_SYNC_CONFIG.reduce((sum, config) => sum + config.destinations.length, 0),
      abiSizes: {},
      lastUpdated: new Date().toISOString()
    };
    
    for (const config of ABI_SYNC_CONFIG) {
      try {
        const sourcePath = this.findABISource(config);
        const abiData = this.fileOps.readJSON(sourcePath);
        stats.abiSizes[config.contractName] = {
          functions: abiData.abi.filter(item => item.type === 'function').length,
          events: abiData.abi.filter(item => item.type === 'event').length,
          totalSize: JSON.stringify(abiData).length
        };
      } catch (error) {
        stats.abiSizes[config.contractName] = { error: error.message };
      }
    }
    
    return stats;
  }

  async syncSpecificContract(contractName) {
    const config = ABI_SYNC_CONFIG.find(c => c.contractName === contractName);
    
    if (!config) {
      throw new Error(`Unknown contract: ${contractName}`);
    }
    
    this.logger.info(`同步特定合約: ${contractName}`);
    return await this.syncContract(config);
  }
}

module.exports = ABISyncer;
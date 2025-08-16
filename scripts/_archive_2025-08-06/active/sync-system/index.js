#!/usr/bin/env node

/**
 * V25 同步系統 - 主入口點
 * 
 * 模組化的配置同步系統，替代原本的單體腳本
 * 
 * 使用方式：
 * node index.js                    # 完整同步
 * node index.js v3.6.1            # 指定子圖版本同步
 * node index.js --rollback         # 回滾到上次備份
 * node index.js --validate-only    # 僅執行驗證
 */

const Logger = require('./core/Logger');
const FileOperations = require('./utils/FileOperations');
const BackupManager = require('./core/BackupManager');
const ConfigLoader = require('./core/ConfigLoader');
const ValidationEngine = require('./core/ValidationEngine');
const ABISyncer = require('./sync/ABISyncer');
const SubgraphSyncer = require('./sync/SubgraphSyncer');
const FrontendUpdater = require('./updaters/FrontendUpdater');
const BackendUpdater = require('./updaters/BackendUpdater');

class V25SyncSystem {
  constructor() {
    this.logger = new Logger('V25-SYNC');
    this.fileOps = new FileOperations(this.logger);
    this.backupManager = new BackupManager(this.logger, this.fileOps);
    this.configLoader = new ConfigLoader(this.logger, this.fileOps);
    this.validationEngine = new ValidationEngine(this.logger, this.fileOps, this.configLoader);
    this.abiSyncer = new ABISyncer(this.logger, this.fileOps, this.backupManager);
    this.subgraphSyncer = new SubgraphSyncer(this.logger, this.fileOps, this.backupManager);
    this.frontendUpdater = new FrontendUpdater(this.logger, this.fileOps, this.backupManager);
    this.backendUpdater = new BackendUpdater(this.logger, this.fileOps, this.backupManager);
    
    this.parseArguments();
  }

  parseArguments() {
    const args = process.argv.slice(2);
    
    this.options = {
      rollback: args.includes('--rollback'),
      validateOnly: args.includes('--validate-only'),
      verbose: args.includes('--verbose'),
      subgraphVersion: args.find(arg => arg.match(/^v\d+\.\d+\.\d+$/)) || null
    };

    // 如果沒有指定版本且不是特殊操作，提示用戶
    if (!this.options.subgraphVersion && !this.options.rollback && !this.options.validateOnly) {
      this.promptForVersion();
    }
  }

  promptForVersion() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('請輸入子圖版本 (如 v3.6.1) 或按 Enter 使用默認版本: ', (answer) => {
        if (answer.trim() && answer.match(/^v\d+\.\d+\.\d+$/)) {
          this.options.subgraphVersion = answer.trim();
        }
        rl.close();
        resolve();
      });
    });
  }

  async run() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🔄 V25 同步系統 v2.0                      ║
║                      模組化配置同步器                          ║
╚══════════════════════════════════════════════════════════════╝
`);

    try {
      if (this.options.rollback) {
        return await this.performRollback();
      }

      if (this.options.validateOnly) {
        return await this.performValidation();
      }

      return await this.performFullSync();

    } catch (error) {
      this.logger.error('同步系統執行失敗', error);
      
      // 嘗試自動回滾
      if (this.backupManager.backups.size > 0) {
        this.logger.info('嘗試自動回滾...');
        try {
          await this.performRollback();
        } catch (rollbackError) {
          this.logger.error('自動回滾失敗', rollbackError);
        }
      }
      
      process.exit(1);
    }
  }

  async performFullSync() {
    this.logger.section('🚀 開始完整同步...');
    
    if (this.options.subgraphVersion) {
      this.logger.info(`子圖版本: ${this.options.subgraphVersion}`);
    }

    const startTime = Date.now();
    const results = {
      configLoad: null,
      validation: null,
      abiSync: null,
      frontendUpdate: null,
      finalValidation: null
    };

    try {
      // 1. 載入配置
      this.logger.section('📖 載入配置...');
      const config = this.configLoader.loadMasterConfig();
      this.configLoader.validateAddresses(config);
      results.configLoad = { success: true };

      // 2. 初始驗證
      this.logger.section('🔍 初始驗證...');
      const initialValidation = await this.validationEngine.validateAll();
      results.validation = initialValidation;

      if (!initialValidation.success && initialValidation.issues.length > 10) {
        this.logger.warning('檢測到大量配置問題，建議先手動檢查');
        this.showValidationIssues(initialValidation.issues.slice(0, 10));
        
        const proceed = await this.confirmProceed();
        if (!proceed) {
          this.logger.info('用戶取消同步操作');
          return;
        }
      }

      // 3. 更新子圖版本到主配置
      if (this.options.subgraphVersion) {
        await this.updateMasterConfigSubgraphVersion();
      }

      // 4. 同步 ABI 文件
      this.logger.section('📋 同步 ABI 文件...');
      const abiResults = await this.abiSyncer.syncAll();
      results.abiSync = { success: true, details: abiResults };

      // 5. 更新前端配置
      this.logger.section('🎯 更新前端配置...');
      const frontendResults = await this.frontendUpdater.updateAll(config, this.options.subgraphVersion);
      results.frontendUpdate = { success: true, details: frontendResults };

      // 6. 更新後端配置
      this.logger.section('🎯 更新後端配置...');
      const backendResults = await this.backendUpdater.updateAll(config, this.options.subgraphVersion);
      results.backendUpdate = { success: true, details: backendResults };

      // 7. 同步子圖配置
      this.logger.section('📊 同步子圖配置...');
      const subgraphResults = await this.subgraphSyncer.syncAll(config, this.options.subgraphVersion);
      results.subgraphSync = { success: true, details: subgraphResults };

      // 8. 最終驗證
      this.logger.section('✅ 最終驗證...');
      const finalValidation = await this.validationEngine.validateAll();
      results.finalValidation = finalValidation;

      // 9. 生成報告
      await this.generateSyncReport(results, Date.now() - startTime);

      // 10. 顯示後續步驟
      this.showNextSteps();

      this.logger.success(`🎉 同步完成！耗時: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    } catch (error) {
      this.logger.error('同步過程中發生錯誤', error);
      throw error;
    }

    return results;
  }

  async updateMasterConfigSubgraphVersion() {
    this.logger.info(`更新主配置子圖版本: ${this.options.subgraphVersion}`);
    
    try {
      const masterConfigPath = require('./config/project-paths').PathResolver.getConfigFilePath('contracts', 'masterConfig');
      
      // 備份
      this.backupManager.backup(masterConfigPath, 'subgraph-version-update');
      
      // 更新配置
      const masterConfig = this.fileOps.readJSON(masterConfigPath);
      
      if (!masterConfig.subgraph) {
        masterConfig.subgraph = {};
      }
      if (!masterConfig.subgraph.studio) {
        masterConfig.subgraph.studio = {};
      }
      
      const oldVersion = masterConfig.subgraph.studio.version || '未知';
      masterConfig.subgraph.studio.version = this.options.subgraphVersion;
      masterConfig.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/${this.options.subgraphVersion}`;
      masterConfig.lastUpdated = new Date().toISOString();
      
      this.fileOps.writeJSON(masterConfigPath, masterConfig);
      
      this.logger.success(`✅ 主配置已更新: ${oldVersion} → ${this.options.subgraphVersion}`);
      
      // 重新載入配置
      this.configLoader.clearCache();
      
    } catch (error) {
      this.logger.error('更新主配置子圖版本失敗', error);
      throw error;
    }
  }

  async performValidation() {
    this.logger.section('🔍 執行驗證模式...');
    
    const validation = await this.validationEngine.validateAll();
    
    console.log(`\n驗證結果: ${validation.success ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`問題數量: ${validation.issues.length}`);
    
    if (validation.issues.length > 0) {
      console.log('\n發現的問題:');
      validation.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    // 生成詳細報告
    const report = await this.validationEngine.generateValidationReport();
    const reportPath = require('path').join(__dirname, '../deployments', `validation-report-${Date.now()}.json`);
    this.fileOps.writeJSON(reportPath, report);
    
    this.logger.info(`📋 詳細報告已生成: ${reportPath}`);
    
    return validation;
  }

  async performRollback() {
    this.logger.section('🔄 執行回滾操作...');
    
    try {
      const results = this.backupManager.restoreAll();
      const successCount = results.filter(r => r.success).length;
      
      this.logger.success(`✅ 回滾完成: ${successCount}/${results.length} 個文件`);
      
      if (results.length - successCount > 0) {
        this.logger.warning('部分文件回滾失敗，請手動檢查');
      }
      
      return results;
      
    } catch (error) {
      this.logger.error('回滾操作失敗', error);
      throw error;
    }
  }

  showValidationIssues(issues) {
    console.log('\n⚠️  發現的主要問題:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log(`\n... 還有 ${Math.max(0, issues.length - 10)} 個其他問題`);
  }

  async confirmProceed() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n是否繼續執行同步？ (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async generateSyncReport(results, executionTime) {
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
      subgraphVersion: this.options.subgraphVersion,
      results,
      backupInfo: this.backupManager.getBackupInfo(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd()
      }
    };

    const reportPath = require('path').join(__dirname, '../deployments', `sync-report-${Date.now()}.json`);
    this.fileOps.writeJSON(reportPath, report);
    
    this.logger.success(`📋 同步報告已生成: ${reportPath}`);
    
    // 生成回滾腳本
    this.backupManager.createRestoreScript();
    
    return reportPath;
  }

  showNextSteps() {
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│                        🚀 下一步建議                         │
├─────────────────────────────────────────────────────────────┤
│ 1. 測試前端：npm run dev                                     │
│ 2. 檢查類型：npm run type-check                              │  
│ 3. 代碼檢查：npm run lint                                    │
│ 4. 子圖部署：cd DDgraphql/dungeon-delvers && npm run build  │
└─────────────────────────────────────────────────────────────┘
`);

    if (this.options.subgraphVersion) {
      console.log(`🔄 子圖版本已更新到: ${this.options.subgraphVersion}`);
    }
  }
}

// 主執行邏輯
if (require.main === module) {
  const syncSystem = new V25SyncSystem();
  
  // 優雅處理退出
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  收到中斷信號，正在清理...');
    syncSystem.backupManager.cleanup();
    process.exit(0);
  });
  
  // 如果需要提示版本，等待用戶輸入
  if (!syncSystem.options.subgraphVersion && !syncSystem.options.rollback && !syncSystem.options.validateOnly) {
    syncSystem.promptForVersion().then(() => {
      syncSystem.run();
    });
  } else {
    syncSystem.run();
  }
}

module.exports = V25SyncSystem;
/**
 * 備份管理器
 * 統一管理所有文件的備份和回滾操作
 */

const path = require('path');

class BackupManager {
  constructor(logger, fileOps) {
    this.logger = logger;
    this.fileOps = fileOps;
    this.backups = new Map(); // filePath -> backupPath
    this.sessionId = Date.now();
  }

  backup(filePath, context = 'sync') {
    if (!this.fileOps.exists(filePath)) {
      this.logger.warning(`Cannot backup non-existent file: ${filePath}`);
      return null;
    }

    const backupSuffix = `${context}-${this.sessionId}`;
    const backupPath = this.fileOps.backup(filePath, backupSuffix);
    
    if (backupPath) {
      this.backups.set(filePath, backupPath);
      this.logger.info(`📋 已備份: ${path.basename(filePath)}`);
    }
    
    return backupPath;
  }

  backupMultiple(filePaths, context = 'sync') {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const backupPath = this.backup(filePath, context);
        results.push({ filePath, backupPath, success: true });
      } catch (error) {
        results.push({ filePath, backupPath: null, success: false, error });
        this.logger.error(`Backup failed for: ${filePath}`, error);
      }
    }
    
    return results;
  }

  restore(filePath) {
    const backupPath = this.backups.get(filePath);
    
    if (!backupPath) {
      throw new Error(`No backup found for: ${filePath}`);
    }

    try {
      this.fileOps.restore(filePath, backupPath);
      this.logger.success(`✅ 已回滾: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to restore: ${filePath}`, error);
      throw error;
    }
  }

  restoreAll() {
    this.logger.section('🔄 執行完整回滾...');
    
    const results = [];
    for (const [filePath, backupPath] of this.backups) {
      try {
        this.fileOps.restore(filePath, backupPath);
        results.push({ filePath, success: true });
        this.logger.success(`✅ 已回滾: ${path.basename(filePath)}`);
      } catch (error) {
        results.push({ filePath, success: false, error });
        this.logger.error(`回滾失敗: ${filePath}`, error);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    this.logger.info(`回滾完成: ${successCount}/${totalCount} 個文件`);
    
    return results;
  }

  cleanup() {
    this.logger.debug('Cleaning up backup files...');
    
    for (const [filePath, backupPath] of this.backups) {
      try {
        if (this.fileOps.exists(backupPath)) {
          // 注意：在生產環境中可能想要保留備份文件
          // fs.unlinkSync(backupPath);
          this.logger.debug(`Backup preserved: ${backupPath}`);
        }
      } catch (error) {
        this.logger.warning(`Failed to cleanup backup: ${backupPath}`);
      }
    }
  }

  getBackupInfo() {
    const info = {
      sessionId: this.sessionId,
      totalBackups: this.backups.size,
      backups: []
    };

    for (const [filePath, backupPath] of this.backups) {
      const stats = this.fileOps.getFileStats(backupPath);
      info.backups.push({
        originalFile: filePath,
        backupFile: backupPath,
        backupSize: stats?.size || 0,
        backupTime: stats?.created || new Date()
      });
    }

    return info;
  }

  hasBackup(filePath) {
    return this.backups.has(filePath);
  }

  getBackupPath(filePath) {
    return this.backups.get(filePath);
  }

  createRestoreScript() {
    const scriptPath = path.join(
      __dirname, 
      '../../deployments', 
      `restore-${this.sessionId}.sh`
    );

    const commands = Array.from(this.backups.entries()).map(
      ([original, backup]) => `cp "${backup}" "${original}"`
    );

    const script = `#!/bin/bash
# Auto-generated restore script
# Session ID: ${this.sessionId}
# Generated: ${new Date().toISOString()}

set -e

echo "🔄 Restoring ${this.backups.size} files..."

${commands.join('\n')}

echo "✅ Restore completed!"
`;

    this.fileOps.writeFile(scriptPath, script);
    
    // Make executable
    const fs = require('fs');
    fs.chmodSync(scriptPath, '755');
    
    this.logger.info(`📄 回滾腳本已生成: ${scriptPath}`);
    
    return scriptPath;
  }
}

module.exports = BackupManager;
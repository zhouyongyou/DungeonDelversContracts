/**
 * 文件操作工具
 * 統一處理所有文件讀寫、備份、驗證操作
 */

const fs = require('fs');
const path = require('path');

class FileOperations {
  constructor(logger) {
    this.logger = logger;
  }

  exists(filePath) {
    return fs.existsSync(filePath);
  }

  readFile(filePath, encoding = 'utf8') {
    try {
      if (!this.exists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return fs.readFileSync(filePath, encoding);
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  writeFile(filePath, content, encoding = 'utf8') {
    try {
      const dir = path.dirname(filePath);
      if (!this.exists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, encoding);
      this.logger.debug(`File written: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  readJSON(filePath) {
    try {
      const content = this.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Failed to parse JSON: ${filePath}`, error);
      throw error;
    }
  }

  writeJSON(filePath, data, pretty = true) {
    try {
      const content = pretty ? 
        JSON.stringify(data, null, 2) : 
        JSON.stringify(data);
      this.writeFile(filePath, content);
    } catch (error) {
      this.logger.error(`Failed to write JSON: ${filePath}`, error);
      throw error;
    }
  }

  backup(filePath, backupSuffix = null) {
    if (!this.exists(filePath)) {
      this.logger.warning(`Cannot backup non-existent file: ${filePath}`);
      return null;
    }

    const suffix = backupSuffix || `backup-${Date.now()}`;
    const backupPath = `${filePath}.${suffix}`;
    
    try {
      fs.copyFileSync(filePath, backupPath);
      this.logger.debug(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error(`Failed to create backup: ${filePath}`, error);
      throw error;
    }
  }

  restore(originalPath, backupPath) {
    if (!this.exists(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    try {
      fs.copyFileSync(backupPath, originalPath);
      this.logger.info(`Restored from backup: ${originalPath}`);
    } catch (error) {
      this.logger.error(`Failed to restore from backup: ${backupPath}`, error);
      throw error;
    }
  }

  copyFile(source, destination) {
    try {
      const dir = path.dirname(destination);
      if (!this.exists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.copyFileSync(source, destination);
      this.logger.debug(`File copied: ${source} → ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${source} → ${destination}`, error);
      throw error;
    }
  }

  findFiles(directory, pattern) {
    if (!this.exists(directory)) {
      return [];
    }

    try {
      const files = [];
      const entries = fs.readdirSync(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findFiles(fullPath, pattern));
        } else if (pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
      
      return files;
    } catch (error) {
      this.logger.error(`Failed to scan directory: ${directory}`, error);
      return [];
    }
  }

  replaceInFile(filePath, replacements, createBackup = true) {
    if (!this.exists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    let backupPath = null;
    if (createBackup) {
      backupPath = this.backup(filePath);
    }

    try {
      let content = this.readFile(filePath);
      let hasChanges = false;

      for (const { pattern, replacement, description } of replacements) {
        const originalContent = content;
        content = content.replace(pattern, replacement);
        
        if (content !== originalContent) {
          hasChanges = true;
          this.logger.success(`  ✓ ${description || 'Pattern replaced'}`);
        }
      }

      if (hasChanges) {
        this.writeFile(filePath, content);
        return { success: true, backupPath, changesCount: replacements.length };
      } else {
        this.logger.warning(`No changes made to: ${filePath}`);
        return { success: false, backupPath: null, changesCount: 0 };
      }

    } catch (error) {
      if (backupPath) {
        this.restore(filePath, backupPath);
      }
      throw error;
    }
  }

  ensureDirectory(dirPath) {
    if (!this.exists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.logger.debug(`Directory created: ${dirPath}`);
    }
  }

  getFileStats(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = FileOperations;
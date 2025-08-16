#!/usr/bin/env node

/**
 * 子圖版本更新腳本
 * 
 * 用於更新 master-config.json 中的子圖版本號
 * 並同步到所有相關專案
 * 
 * 使用方式：
 * node scripts/active/update-subgraph-version.js v3.2.1
 * node scripts/active/update-subgraph-version.js --check
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

class SubgraphVersionUpdater {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/master-config.json');
    this.errors = [];
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

  async run() {
    const args = process.argv.slice(2);
    
    if (args[0] === '--check') {
      await this.checkCurrentVersion();
    } else if (args[0] && args[0].match(/^v\d+\.\d+\.\d+$/)) {
      await this.updateVersion(args[0]);
    } else {
      this.showHelp();
    }
  }

  showHelp() {
    console.log(`
${colors.bright}子圖版本更新工具${colors.reset}

使用方式:
  node update-subgraph-version.js <version>    更新子圖版本
  node update-subgraph-version.js --check       檢查當前版本

範例:
  node update-subgraph-version.js v3.2.1       更新到 v3.2.1
  node update-subgraph-version.js --check       查看當前版本

版本格式: v<major>.<minor>.<patch> (例如: v3.2.1)
    `);
  }

  async checkCurrentVersion() {
    this.log('檢查當前子圖版本...', 'info');
    
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      const currentVersion = config.subgraph?.studio?.version || '未設定';
      
      console.log(`\n當前子圖版本: ${colors.cyan}${currentVersion}${colors.reset}`);
      console.log(`Studio URL: ${config.subgraph?.studio?.url || '未設定'}`);
      console.log(`Decentralized URL: ${config.subgraph?.decentralized?.url || '未設定'}`);
      
      // 檢查其他地方的版本
      this.log('\n檢查其他配置文件...', 'info');
      
      // 檢查 config-reader.js
      const configReaderPath = path.join(__dirname, '../../config/config-reader.js');
      const configReaderContent = fs.readFileSync(configReaderPath, 'utf8');
      const configReaderMatch = configReaderContent.match(/version:\s*'(v\d+\.\d+\.\d+)'/);
      if (configReaderMatch) {
        console.log(`config-reader.js: ${configReaderMatch[1]}`);
      }
      
      // 檢查前端硬編碼
      this.log('\n檢查前端硬編碼位置...', 'info');
      const frontendPaths = [
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/env.ts',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/configLoader.ts',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/subgraph.ts'
      ];
      
      for (const filePath of frontendPaths) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(/v\d+\.\d+\.\d+/g);
          if (matches) {
            console.log(`${path.basename(filePath)}: ${matches.join(', ')}`);
          }
        }
      }
      
    } catch (error) {
      this.log(`讀取配置失敗: ${error.message}`, 'error');
    }
  }

  async updateVersion(newVersion) {
    this.log(`準備更新子圖版本到 ${newVersion}...`, 'info');
    
    try {
      // 1. 更新 master-config.json
      this.log('更新 master-config.json...', 'info');
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      const oldVersion = config.subgraph?.studio?.version || '未知';
      
      if (!config.subgraph) {
        config.subgraph = {};
      }
      if (!config.subgraph.studio) {
        config.subgraph.studio = {};
      }
      
      config.subgraph.studio.version = newVersion;
      config.subgraph.studio.url = `https://api.studio.thegraph.com/query/115633/dungeon-delvers/${newVersion}`;
      config.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.log(`✅ master-config.json 已更新: ${oldVersion} → ${newVersion}`, 'success');
      
      // 2. 更新 config-reader.js
      this.log('更新 config-reader.js...', 'info');
      const configReaderPath = path.join(__dirname, '../../config/config-reader.js');
      let configReaderContent = fs.readFileSync(configReaderPath, 'utf8');
      
      // 更新 URL
      configReaderContent = configReaderContent.replace(
        /url:\s*'https:\/\/api\.studio\.thegraph\.com\/query\/115633\/dungeon-delvers\/v\d+\.\d+\.\d+'/,
        `url: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/${newVersion}'`
      );
      
      // 更新版本號
      configReaderContent = configReaderContent.replace(
        /version:\s*'v\d+\.\d+\.\d+'/,
        `version: '${newVersion}'`
      );
      
      fs.writeFileSync(configReaderPath, configReaderContent);
      this.log('✅ config-reader.js 已更新', 'success');
      
      // 3. 執行同步腳本
      this.log('\n執行同步腳本更新所有專案...', 'info');
      execSync('node scripts/active/v25-sync-all.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });
      
      // 4. 顯示完成訊息
      console.log(`\n${colors.green}✅ 子圖版本更新完成！${colors.reset}`);
      console.log(`\n版本已從 ${colors.yellow}${oldVersion}${colors.reset} 更新到 ${colors.cyan}${newVersion}${colors.reset}`);
      console.log('\n已更新的位置:');
      console.log('- master-config.json');
      console.log('- config-reader.js');
      console.log('- 前端 CDN 配置 (v25.json, latest.json)');
      console.log('- 所有硬編碼位置（通過同步腳本）');
      
      console.log(`\n${colors.yellow}下一步:${colors.reset}`);
      console.log('1. 提交這些更改到 Git');
      console.log('2. 部署前端以使用新的子圖版本');
      console.log('3. 如需回滾，可使用: npm run sync:rollback');
      
    } catch (error) {
      this.log(`更新失敗: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 執行
const updater = new SubgraphVersionUpdater();
updater.run().catch(error => {
  console.error(error);
  process.exit(1);
});
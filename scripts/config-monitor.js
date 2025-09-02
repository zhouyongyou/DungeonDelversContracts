#!/usr/bin/env node

/**
 * 🎛️ 配置同步監控系統
 * 自動監控主配置變更，並觸發同步和驗證
 * 提供完整的配置管理自動化流程
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

class ConfigMonitor {
    constructor() {
        // 主配置文件
        this.masterConfigPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
        
        // 腳本路徑
        this.scriptsPath = '/Users/sotadic/Documents/DungeonDelversContracts/scripts';
        this.syncScript = path.join(this.scriptsPath, 'ultimate-config-system.js');
        this.validatorScript = path.join(this.scriptsPath, 'config-validator.js');
        this.auditScript = path.join(this.scriptsPath, 'hardcoded-audit.js');
        
        // 監控項目的服務器進程
        this.serverProcesses = {
            frontend: null,
            backend: null
        };
        
        // 項目路徑
        this.projectPaths = {
            frontend: '/Users/sotadic/Documents/GitHub/SoulboundSaga',
            backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
            subgraph: '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers'
        };
        
        // 監控狀態
        this.isMonitoring = false;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        
        // 配置變更隊列
        this.changeQueue = [];
        this.debounceTimer = null;
        
        // 統計數據
        this.stats = {
            syncCount: 0,
            validationCount: 0,
            errors: 0,
            warnings: 0
        };
    }

    // 啟動監控系統
    async startMonitoring() {
        log('🎛️ 啟動配置同步監控系統', 'bright');
        log('=====================================', 'cyan');
        
        // 檢查必要文件
        if (!this.checkPrerequisites()) {
            return false;
        }

        // 初始同步和驗證
        await this.performInitialSync();
        
        // 開始監控
        this.setupFileWatching();
        this.setupPeriodicChecks();
        
        this.isMonitoring = true;
        log('✅ 監控系統已啟動', 'green');
        this.displayStatus();
        
        return true;
    }

    // 檢查先決條件
    checkPrerequisites() {
        log('🔍 檢查系統先決條件...', 'blue');
        
        const requiredFiles = [
            { path: this.masterConfigPath, name: '主配置文件' },
            { path: this.syncScript, name: '同步腳本' },
            { path: this.validatorScript, name: '驗證腳本' }
        ];

        let allGood = true;
        
        for (const file of requiredFiles) {
            if (fs.existsSync(file.path)) {
                log(`  ✅ ${file.name}: 存在`, 'green');
            } else {
                log(`  ❌ ${file.name}: 不存在 (${file.path})`, 'red');
                allGood = false;
            }
        }

        // 檢查項目目錄
        for (const [name, projectPath] of Object.entries(this.projectPaths)) {
            if (fs.existsSync(projectPath)) {
                log(`  ✅ ${name} 項目: 存在`, 'green');
            } else {
                log(`  ⚠️  ${name} 項目: 不存在 (${projectPath})`, 'yellow');
            }
        }

        return allGood;
    }

    // 執行初始同步
    async performInitialSync() {
        log('🚀 執行初始同步...', 'blue');
        
        try {
            // 執行同步
            await this.runSyncScript();
            
            // 執行驗證
            await this.runValidation();
            
            log('✅ 初始同步完成', 'green');
        } catch (error) {
            log(`❌ 初始同步失敗: ${error.message}`, 'red');
            this.stats.errors++;
        }
    }

    // 設置文件監控
    setupFileWatching() {
        log('👁️  設置文件監控...', 'blue');
        
        // 監控主配置文件
        if (fs.existsSync(this.masterConfigPath)) {
            fs.watchFile(this.masterConfigPath, { interval: 1000 }, (curr, prev) => {
                if (curr.mtime !== prev.mtime) {
                    this.handleConfigChange('master', this.masterConfigPath);
                }
            });
            log(`  👀 監控: ${path.basename(this.masterConfigPath)}`, 'dim');
        }

        // 監控項目配置文件
        const additionalWatchFiles = [
            '/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local',
            '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
            '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers/networks.json'
        ];

        for (const filePath of additionalWatchFiles) {
            if (fs.existsSync(filePath)) {
                fs.watchFile(filePath, { interval: 2000 }, (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        this.handleConfigChange('project', filePath);
                    }
                });
                log(`  👀 監控: ${path.basename(filePath)}`, 'dim');
            }
        }
    }

    // 設置定期檢查
    setupPeriodicChecks() {
        log('⏰ 設置定期檢查...', 'blue');
        
        // 每5分鐘驗證一次配置
        setInterval(async () => {
            if (!this.syncInProgress) {
                log('🔍 定期配置驗證', 'dim');
                await this.runValidation();
            }
        }, 5 * 60 * 1000);

        // 每小時進行一次完整審計
        setInterval(async () => {
            if (!this.syncInProgress) {
                log('📊 每小時配置審計', 'dim');
                await this.runAudit();
            }
        }, 60 * 60 * 1000);

        log('  ⏱️  定期檢查已設置', 'dim');
    }

    // 處理配置變更
    handleConfigChange(type, filePath) {
        const fileName = path.basename(filePath);
        log(`📝 檢測到配置變更: ${fileName} (${type})`, 'yellow');
        
        // 將變更添加到隊列
        this.changeQueue.push({
            type,
            filePath,
            timestamp: new Date()
        });

        // 設置防抖處理
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
            await this.processChangeQueue();
        }, 2000); // 2秒防抖
    }

    // 處理變更隊列
    async processChangeQueue() {
        if (this.changeQueue.length === 0 || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        log(`🔄 處理 ${this.changeQueue.length} 個配置變更...`, 'blue');

        try {
            const masterChanges = this.changeQueue.filter(c => c.type === 'master');
            const projectChanges = this.changeQueue.filter(c => c.type === 'project');

            if (masterChanges.length > 0) {
                log('🎯 主配置已變更，執行完整同步', 'cyan');
                await this.runSyncScript();
                await this.runValidation();
            } else if (projectChanges.length > 0) {
                log('📂 項目配置已變更，執行驗證', 'cyan');
                await this.runValidation();
            }

            // 清空隊列
            this.changeQueue = [];
            
        } catch (error) {
            log(`❌ 處理配置變更失敗: ${error.message}`, 'red');
            this.stats.errors++;
        } finally {
            this.syncInProgress = false;
        }
    }

    // 執行同步腳本
    async runSyncScript() {
        return new Promise((resolve, reject) => {
            log('🔄 執行配置同步...', 'blue');
            
            const child = spawn('node', [this.syncScript, 'sync'], {
                cwd: path.dirname(this.syncScript),
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    log('✅ 配置同步完成', 'green');
                    this.stats.syncCount++;
                    this.lastSyncTime = new Date();
                    resolve(output);
                } else {
                    log(`❌ 配置同步失敗 (exit code: ${code})`, 'red');
                    if (errorOutput) log(`錯誤: ${errorOutput}`, 'red');
                    this.stats.errors++;
                    reject(new Error(`Sync failed with code ${code}`));
                }
            });
        });
    }

    // 執行驗證
    async runValidation() {
        return new Promise((resolve, reject) => {
            log('🔍 執行配置驗證...', 'dim');
            
            const child = spawn('node', [this.validatorScript, 'validate'], {
                cwd: path.dirname(this.validatorScript),
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    log('✅ 配置驗證通過', 'green');
                    this.stats.validationCount++;
                    resolve(output);
                } else {
                    log(`⚠️  配置驗證發現問題`, 'yellow');
                    this.stats.warnings++;
                    resolve(output); // 不拒絕，因為可能只是警告
                }
            });
        });
    }

    // 執行審計
    async runAudit() {
        return new Promise((resolve, reject) => {
            log('📊 執行硬編碼審計...', 'dim');
            
            const child = spawn('node', [this.auditScript, 'audit'], {
                cwd: path.dirname(this.auditScript),
                stdio: 'pipe'
            });

            let output = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.on('close', (code) => {
                log('📋 硬編碼審計完成', 'dim');
                resolve(output);
            });
        });
    }

    // 顯示系統狀態
    displayStatus() {
        log('\n🎛️ 監控系統狀態', 'bright');
        log('=====================================', 'cyan');
        log(`📍 主配置: ${path.basename(this.masterConfigPath)}`, 'blue');
        log(`🔄 監控狀態: ${this.isMonitoring ? '運行中' : '停止'}`, this.isMonitoring ? 'green' : 'red');
        log(`⏱️  最後同步: ${this.lastSyncTime ? this.lastSyncTime.toLocaleString() : '未同步'}`, 'dim');
        log(`📊 同步次數: ${this.stats.syncCount}`, 'dim');
        log(`🔍 驗證次數: ${this.stats.validationCount}`, 'dim');
        log(`❌ 錯誤次數: ${this.stats.errors}`, this.stats.errors > 0 ? 'red' : 'green');
        log(`⚠️  警告次數: ${this.stats.warnings}`, this.stats.warnings > 0 ? 'yellow' : 'green');
        
        log('\n💡 控制命令:', 'yellow');
        log('  Ctrl+C: 停止監控', 'dim');
        log('  Ctrl+S: 手動同步 (如支援)', 'dim');
        log('  Ctrl+V: 手動驗證 (如支援)', 'dim');
    }

    // 停止監控
    stopMonitoring() {
        log('\n🛑 停止監控系統...', 'yellow');
        
        this.isMonitoring = false;
        
        // 清理 watchFile
        fs.unwatchFile(this.masterConfigPath);
        
        // 停止服務器進程
        for (const [name, process] of Object.entries(this.serverProcesses)) {
            if (process) {
                log(`  停止 ${name} 服務器`, 'dim');
                process.kill();
            }
        }
        
        log('✅ 監控系統已停止', 'green');
        this.displayFinalStats();
    }

    // 顯示最終統計
    displayFinalStats() {
        log('\n📊 監控統計總結', 'bright');
        log('=====================================', 'cyan');
        log(`運行時間: ${this.getUptime()}`, 'blue');
        log(`同步執行: ${this.stats.syncCount} 次`, 'dim');
        log(`驗證執行: ${this.stats.validationCount} 次`, 'dim');
        log(`處理錯誤: ${this.stats.errors} 個`, this.stats.errors > 0 ? 'red' : 'green');
        log(`處理警告: ${this.stats.warnings} 個`, this.stats.warnings > 0 ? 'yellow' : 'green');
    }

    // 獲取運行時間
    getUptime() {
        // 簡化版本，實際應用中可以記錄啟動時間
        return '未記錄';
    }

    // 手動觸發同步
    async manualSync() {
        if (this.syncInProgress) {
            log('⚠️  同步正在進行中，請稍候', 'yellow');
            return;
        }

        log('🔄 手動觸發同步...', 'blue');
        await this.runSyncScript();
        await this.runValidation();
    }

    // 手動觸發驗證
    async manualValidation() {
        if (this.syncInProgress) {
            log('⚠️  操作正在進行中，請稍候', 'yellow');
            return;
        }

        log('🔍 手動觸發驗證...', 'blue');
        await this.runValidation();
    }
}

// CLI 入口
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    
    const monitor = new ConfigMonitor();
    
    // 設置信號處理
    process.on('SIGINT', () => {
        monitor.stopMonitoring();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        monitor.stopMonitoring();
        process.exit(0);
    });

    switch (command) {
        case 'start':
        case 'monitor':
            await monitor.startMonitoring();
            
            // 保持進程運行
            const keepAlive = () => {
                if (monitor.isMonitoring) {
                    setTimeout(keepAlive, 1000);
                }
            };
            keepAlive();
            break;
            
        case 'sync':
            await monitor.runSyncScript();
            break;
            
        case 'validate':
            await monitor.runValidation();
            break;
            
        case 'audit':
            await monitor.runAudit();
            break;
            
        case 'status':
            monitor.displayStatus();
            break;
            
        default:
            log('🎛️ 配置同步監控系統', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  start     - 啟動監控系統 (預設)', 'dim');
            log('  monitor   - 同 start', 'dim');
            log('  sync      - 手動執行同步', 'dim');
            log('  validate  - 手動執行驗證', 'dim');
            log('  audit     - 手動執行審計', 'dim');
            log('  status    - 顯示系統狀態', 'dim');
            log('\n💡 推薦使用:', 'yellow');
            log('  開發環境: node scripts/config-monitor.js start', 'dim');
            log('  部署前: node scripts/config-monitor.js validate', 'dim');
            log('\n🎯 監控功能:', 'blue');
            log('  - 自動檢測主配置變更並同步', 'dim');
            log('  - 定期驗證配置一致性', 'dim');
            log('  - 每小時執行硬編碼審計', 'dim');
            log('  - 防抖處理避免頻繁同步', 'dim');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ConfigMonitor;
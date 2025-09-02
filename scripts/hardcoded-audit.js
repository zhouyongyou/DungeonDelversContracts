#!/usr/bin/env node

/**
 * 🔍 硬編碼地址審計工具
 * 專注於前端、後端、子圖項目的硬編碼地址掃描
 * 跳過合約項目的舊版本文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

class HardcodedAuditor {
    constructor() {
        // 項目配置
        this.projects = {
            frontend: {
                path: '/Users/sotadic/Documents/GitHub/SoulboundSaga',
                name: '前端項目',
                priority: 'high'
            },
            backend: {
                path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
                name: '後端項目',
                priority: 'high'
            },
            subgraph: {
                path: '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers',
                name: '子圖項目',
                priority: 'high'
            },
            contracts: {
                path: '/Users/sotadic/Documents/DungeonDelversContracts',
                name: '合約項目',
                priority: 'low'
            }
        };

        // 需要跳過的目錄
        this.skipDirs = [
            'node_modules', '.git', '.next', 'dist', 'build', '.vercel',
            'coverage', '.nyc_output', 'artifacts', 'cache', 'typechain-types',
            'deployments/old', 'deployments/archive', 'deployments/backup',
            'scripts/old', 'scripts/archive', 'scripts/backup',
            'test/old', 'test/archive'
        ];

        // 跳過的文件類型
        this.skipExtensions = [
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.woff', '.woff2', '.ttf', '.eot',
            '.zip', '.tar', '.gz', '.map'
        ];

        // 地址模式（BSC 地址）
        this.addressPattern = /0x[a-fA-F0-9]{40}/g;
        
        // V25 最新地址
        this.v25Addresses = new Set([
            '0xe90d442458931690C057D5ad819EBF94A4eD7c8c', // HERO
            '0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B', // RELIC
            '0x629B386D8CfdD13F27164a01fCaE83CB07628FB9', // PARTY
            '0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0', // DUNGEONMASTER
            '0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542', // DUNGEONSTORAGE
            '0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1', // ALTAROFASCENSION
            '0x26BDBCB8Fd349F313c74B691B878f10585c7813E', // DUNGEONCORE
            '0xb2AfF26dc59ef41A22963D037C29550ed113b060', // PLAYERVAULT
            '0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1', // PLAYERPROFILE
            '0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28', // VIPSTAKING
            '0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8', // ORACLE
            '0xdd14eD07598BA1001cf2888077FE0721941d06A8', // VRFMANAGER
            '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF', // SOULSHARD
            '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE', // USD
            '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'  // UNISWAP_POOL
        ]);

        // 已知舊地址（標記為過時）
        this.deprecatedAddresses = new Set([
            '0x671d937b171e2ba2c4dc23c133b07e4449f283ef', // 舊 HERO
            '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da', // 舊 RELIC
            '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3', // 舊 PARTY
            '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a', // 舊 DUNGEONMASTER
            '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468', // 舊 DUNGEONSTORAGE
            '0xa86749237d4631ad92ba859d0b0df4770f6147ba'  // 舊 ALTAROFASCENSION
        ]);

        // 審計結果
        this.results = {
            projects: {},
            summary: {
                totalFiles: 0,
                totalAddresses: 0,
                currentAddresses: 0,
                deprecatedAddresses: 0,
                unknownAddresses: 0,
                criticalIssues: []
            }
        };
    }

    // 檢查文件是否應該跳過
    shouldSkipFile(filePath, relativePath) {
        // 檢查擴展名
        const ext = path.extname(filePath);
        if (this.skipExtensions.includes(ext)) return true;

        // 檢查目錄
        for (const skipDir of this.skipDirs) {
            if (relativePath.includes(skipDir)) return true;
        }

        // 對於合約項目，跳過舊版本文件
        if (filePath.includes('DungeonDelversContracts')) {
            // 跳過包含版本號的舊文件
            if (/v[0-9]+|V[0-9]+|old|archive|backup|deprecated/.test(relativePath)) {
                return true;
            }
            
            // 跳過測試和部署記錄（保留當前版本）
            if (relativePath.includes('test') || 
                (relativePath.includes('deployments') && !relativePath.includes('v25'))) {
                return true;
            }
        }

        return false;
    }

    // 掃描文件中的地址
    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const matches = content.match(this.addressPattern) || [];
            
            if (matches.length === 0) return null;

            const addresses = [...new Set(matches)]; // 去重
            const result = {
                path: filePath,
                addressCount: addresses.length,
                addresses: [],
                issues: []
            };

            for (const address of addresses) {
                const addressInfo = {
                    address,
                    line: this.findAddressLine(content, address),
                    type: 'unknown'
                };

                if (this.v25Addresses.has(address)) {
                    addressInfo.type = 'current';
                } else if (this.deprecatedAddresses.has(address)) {
                    addressInfo.type = 'deprecated';
                    result.issues.push(`過時地址: ${address}`);
                } else {
                    addressInfo.type = 'unknown';
                }

                result.addresses.push(addressInfo);
            }

            return result;
        } catch (error) {
            return null;
        }
    }

    // 找到地址在文件中的行號
    findAddressLine(content, address) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(address)) {
                return i + 1;
            }
        }
        return -1;
    }

    // 掃描項目
    async scanProject(projectKey, projectConfig) {
        log(`\n🔍 掃描 ${projectConfig.name}...`, 'blue');
        
        if (!fs.existsSync(projectConfig.path)) {
            log(`  ❌ 項目路徑不存在: ${projectConfig.path}`, 'red');
            return;
        }

        const result = {
            name: projectConfig.name,
            path: projectConfig.path,
            priority: projectConfig.priority,
            files: [],
            summary: {
                totalFiles: 0,
                filesWithAddresses: 0,
                totalAddresses: 0,
                currentAddresses: 0,
                deprecatedAddresses: 0,
                unknownAddresses: 0,
                criticalFiles: []
            }
        };

        await this.scanDirectory(projectConfig.path, projectConfig.path, result);
        this.results.projects[projectKey] = result;

        // 輸出項目摘要
        log(`  📊 ${projectConfig.name} 掃描完成:`, 'cyan');
        log(`    文件數: ${result.summary.totalFiles}`, 'dim');
        log(`    包含地址的文件: ${result.summary.filesWithAddresses}`, 'dim');
        log(`    總地址數: ${result.summary.totalAddresses}`, 'dim');
        if (result.summary.deprecatedAddresses > 0) {
            log(`    ⚠️  過時地址: ${result.summary.deprecatedAddresses}`, 'yellow');
        }
    }

    // 遞歸掃描目錄
    async scanDirectory(dirPath, basePath, result) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const relativePath = path.relative(basePath, itemPath);
                
                if (this.shouldSkipFile(itemPath, relativePath)) {
                    continue;
                }

                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    await this.scanDirectory(itemPath, basePath, result);
                } else if (stat.isFile()) {
                    result.summary.totalFiles++;
                    
                    const fileResult = this.scanFile(itemPath);
                    if (fileResult) {
                        result.summary.filesWithAddresses++;
                        result.summary.totalAddresses += fileResult.addressCount;
                        
                        // 統計地址類型
                        for (const addr of fileResult.addresses) {
                            switch (addr.type) {
                                case 'current':
                                    result.summary.currentAddresses++;
                                    break;
                                case 'deprecated':
                                    result.summary.deprecatedAddresses++;
                                    break;
                                case 'unknown':
                                    result.summary.unknownAddresses++;
                                    break;
                            }
                        }

                        // 標記有問題的文件
                        if (fileResult.issues.length > 0) {
                            result.summary.criticalFiles.push({
                                file: relativePath,
                                issues: fileResult.issues
                            });
                        }

                        result.files.push({
                            ...fileResult,
                            relativePath
                        });
                    }
                }
            }
        } catch (error) {
            // 跳過無法讀取的目錄
        }
    }

    // 執行完整審計
    async runAudit() {
        log('🔍 開始硬編碼地址審計', 'bright');
        log('=====================================', 'cyan');
        log('🎯 重點項目: 前端、後端、子圖', 'yellow');
        log('📦 合約項目: 跳過舊版本文件', 'dim');
        log('=====================================', 'cyan');

        // 按優先級掃描項目
        const highPriorityProjects = Object.entries(this.projects)
            .filter(([_, config]) => config.priority === 'high');
        
        const lowPriorityProjects = Object.entries(this.projects)
            .filter(([_, config]) => config.priority === 'low');

        // 優先掃描重點項目
        for (const [key, config] of highPriorityProjects) {
            await this.scanProject(key, config);
        }

        // 再掃描合約項目（如有需要）
        for (const [key, config] of lowPriorityProjects) {
            await this.scanProject(key, config);
        }

        this.generateSummary();
        this.generateReport();
        this.generateActionItems();
    }

    // 生成總結
    generateSummary() {
        log('\n=====================================', 'cyan');
        log('📊 審計總結', 'bright');
        log('=====================================', 'cyan');

        let totalFiles = 0;
        let totalAddresses = 0;
        let totalDeprecated = 0;
        let criticalIssues = 0;

        for (const [projectKey, projectResult] of Object.entries(this.results.projects)) {
            const { summary } = projectResult;
            totalFiles += summary.totalFiles;
            totalAddresses += summary.totalAddresses;
            totalDeprecated += summary.deprecatedAddresses;
            criticalIssues += summary.criticalFiles.length;

            log(`\n📁 ${projectResult.name}:`, 'blue');
            log(`  掃描文件: ${summary.totalFiles}`, 'dim');
            log(`  硬編碼地址: ${summary.totalAddresses}`, summary.totalAddresses > 0 ? 'yellow' : 'green');
            
            if (summary.deprecatedAddresses > 0) {
                log(`  ⚠️  過時地址: ${summary.deprecatedAddresses}`, 'red');
            }
            
            if (summary.criticalFiles.length > 0) {
                log(`  🚨 問題文件: ${summary.criticalFiles.length}`, 'red');
            }
        }

        this.results.summary = {
            totalFiles,
            totalAddresses,
            deprecatedAddresses: totalDeprecated,
            criticalIssues
        };

        log('\n📈 總計:', 'cyan');
        log(`  掃描文件: ${totalFiles}`, 'dim');
        log(`  硬編碼地址: ${totalAddresses}`, totalAddresses > 0 ? 'yellow' : 'green');
        log(`  過時地址: ${totalDeprecated}`, totalDeprecated > 0 ? 'red' : 'green');
        log(`  問題文件: ${criticalIssues}`, criticalIssues > 0 ? 'red' : 'green');
    }

    // 生成詳細報告
    generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `../reports/hardcoded-audit-${timestamp}.json`);
        
        // 確保報告目錄存在
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            v25Addresses: Array.from(this.v25Addresses),
            deprecatedAddresses: Array.from(this.deprecatedAddresses),
            results: this.results
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log(`\n📋 詳細報告已生成: ${reportPath}`, 'green');
    }

    // 生成行動項目
    generateActionItems() {
        log('\n=====================================', 'cyan');
        log('🎯 立即行動項目', 'bright');
        log('=====================================', 'cyan');

        const actions = [];

        // 檢查過時地址
        for (const [projectKey, projectResult] of Object.entries(this.results.projects)) {
            if (projectResult.summary.deprecatedAddresses > 0) {
                actions.push({
                    priority: 'high',
                    project: projectResult.name,
                    action: `更新 ${projectResult.summary.deprecatedAddresses} 個過時地址`,
                    files: projectResult.summary.criticalFiles.length
                });
            }
        }

        // 檢查配置文件
        const configFiles = this.findConfigFiles();
        if (configFiles.length > 0) {
            actions.push({
                priority: 'medium',
                project: '配置管理',
                action: `統一 ${configFiles.length} 個配置文件`,
                description: '使用環境變數替代硬編碼'
            });
        }

        if (actions.length === 0) {
            log('🎉 沒有發現需要立即處理的問題！', 'green');
        } else {
            log('\n🚨 高優先級:', 'red');
            actions.filter(a => a.priority === 'high').forEach((action, i) => {
                log(`  ${i + 1}. ${action.project}: ${action.action}`, 'red');
            });

            log('\n⚠️  中優先級:', 'yellow');
            actions.filter(a => a.priority === 'medium').forEach((action, i) => {
                log(`  ${i + 1}. ${action.project}: ${action.action}`, 'yellow');
            });
        }

        log('\n💡 建議解決方案:', 'blue');
        log('  1. 執行配置同步: node scripts/ultimate-config-system.js sync', 'dim');
        log('  2. 使用 .env 變數替代硬編碼地址', 'dim');
        log('  3. 移除或註釋過時的配置文件', 'dim');
        log('  4. 設置自動配置驗證流程', 'dim');
    }

    // 查找配置文件
    findConfigFiles() {
        const configFiles = [];
        
        for (const [_, projectResult] of Object.entries(this.results.projects)) {
            for (const file of projectResult.files) {
                const fileName = path.basename(file.path).toLowerCase();
                if (fileName.includes('config') || 
                    fileName.includes('.env') || 
                    fileName.includes('constants')) {
                    configFiles.push(file.relativePath);
                }
            }
        }
        
        return configFiles;
    }

    // 生成修復腳本建議
    generateFixScript() {
        log('\n=====================================', 'cyan');
        log('🔧 自動修復建議', 'bright');
        log('=====================================', 'cyan');

        log('\n1. 統一配置同步:', 'blue');
        log('cd /Users/sotadic/Documents/DungeonDelversContracts', 'dim');
        log('node scripts/ultimate-config-system.js sync', 'dim');

        log('\n2. 驗證配置正確性:', 'blue');
        log('node scripts/ultimate-config-system.js validate', 'dim');

        log('\n3. 清理過時文件 (建議手動確認):', 'blue');
        const deprecatedFiles = [];
        for (const [_, projectResult] of Object.entries(this.results.projects)) {
            for (const file of projectResult.files) {
                if (file.issues && file.issues.length > 0) {
                    deprecatedFiles.push(file.relativePath);
                }
            }
        }

        if (deprecatedFiles.length > 0) {
            log('需要檢查的文件:', 'yellow');
            deprecatedFiles.slice(0, 5).forEach(file => {
                log(`  - ${file}`, 'dim');
            });
            if (deprecatedFiles.length > 5) {
                log(`  ... 還有 ${deprecatedFiles.length - 5} 個文件`, 'dim');
            }
        }
    }
}

// CLI 入口
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'audit';
    
    const auditor = new HardcodedAuditor();
    
    switch (command) {
        case 'audit':
        case 'scan':
            await auditor.runAudit();
            auditor.generateFixScript();
            break;
            
        case 'report':
            await auditor.runAudit();
            break;
            
        case 'fix':
            log('🔧 自動修復功能開發中...', 'yellow');
            log('請先運行: node scripts/ultimate-config-system.js sync', 'dim');
            break;
            
        default:
            log('🔍 硬編碼地址審計工具', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  audit     - 執行完整審計 (預設)', 'dim');
            log('  scan      - 同 audit', 'dim');
            log('  report    - 生成詳細報告', 'dim');
            log('  fix       - 自動修復 (開發中)', 'dim');
            log('\n💡 使用說明:', 'yellow');
            log('  此工具專注於前端、後端、子圖項目', 'dim');
            log('  會跳過合約項目的舊版本文件', 'dim');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = HardcodedAuditor;
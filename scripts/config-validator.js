#!/usr/bin/env node

/**
 * 🔍 配置驗證自動化工具
 * 確保所有項目的配置與主配置文件一致
 * 重點監控前端、後端、子圖項目
 */

const fs = require('fs');
const path = require('path');

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

class ConfigValidator {
    constructor() {
        // 主配置文件
        this.masterConfigPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
        
        // 項目配置路徑
        this.projectConfigs = {
            frontend: {
                name: '前端項目',
                configPaths: [
                    '/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local',
                    '/Users/sotadic/Documents/GitHub/SoulboundSaga/public/config/latest.json',
                    '/Users/sotadic/Documents/GitHub/SoulboundSaga/src/config/constants.ts'
                ],
                priority: 'critical'
            },
            backend: {
                name: '後端項目', 
                configPaths: [
                    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
                    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env'
                ],
                priority: 'critical'
            },
            subgraph: {
                name: '子圖項目',
                configPaths: [
                    '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers/networks.json',
                    '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers/subgraph.yaml'
                ],
                priority: 'critical'
            }
        };

        // V25 標準地址映射
        this.v25Addresses = {
            'HERO': '0xe90d442458931690C057D5ad819EBF94A4eD7c8c',
            'RELIC': '0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B',
            'PARTY': '0x629B386D8CfdD13F27164a01fCaE83CB07628FB9',
            'DUNGEONMASTER': '0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0',
            'DUNGEONSTORAGE': '0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542',
            'ALTAROFASCENSION': '0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1',
            'DUNGEONCORE': '0x26BDBCB8Fd349F313c74B691B878f10585c7813E',
            'PLAYERVAULT': '0xb2AfF26dc59ef41A22963D037C29550ed113b060',
            'PLAYERPROFILE': '0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1',
            'VIPSTAKING': '0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28',
            'ORACLE': '0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8',
            'VRFMANAGER': '0xdd14eD07598BA1001cf2888077FE0721941d06A8',
            'SOULSHARD': '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
            'USD': '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
            'UNISWAP_POOL': '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
        };

        // 已知過時地址
        this.deprecatedAddresses = {
            '0x671d937b171e2ba2c4dc23c133b07e4449f283ef': 'HERO (V24)',
            '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da': 'RELIC (V24)',
            '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3': 'PARTY (V24)',
            '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a': 'DUNGEONMASTER (V24)',
            '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468': 'DUNGEONSTORAGE (V24)',
            '0xa86749237d4631ad92ba859d0b0df4770f6147ba': 'ALTAROFASCENSION (V24)'
        };

        // 驗證結果
        this.validationResults = {
            masterConfig: null,
            projects: {},
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                warnings: 0,
                deprecated: 0
            }
        };
    }

    // 載入並解析主配置
    async loadMasterConfig() {
        log('📖 載入主配置文件...', 'blue');
        
        if (!fs.existsSync(this.masterConfigPath)) {
            throw new Error(`主配置文件不存在: ${this.masterConfigPath}`);
        }

        try {
            const content = fs.readFileSync(this.masterConfigPath, 'utf8');
            const config = this.parseEnvContent(content);
            
            this.validationResults.masterConfig = {
                path: this.masterConfigPath,
                config,
                lastModified: fs.statSync(this.masterConfigPath).mtime,
                isValid: true
            };

            log(`  ✅ 主配置載入成功 (${Object.keys(config.contracts).length} 個合約)`, 'green');
            return config;
        } catch (error) {
            log(`  ❌ 主配置載入失敗: ${error.message}`, 'red');
            throw error;
        }
    }

    // 解析 ENV 內容
    parseEnvContent(content) {
        const config = {
            contracts: {},
            network: {},
            vrf: {},
            endpoints: {}
        };

        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            
            if (key.endsWith('_ADDRESS')) {
                const contractName = key.replace('VITE_', '').replace('_ADDRESS', '');
                config.contracts[contractName] = value;
            } else if (key.includes('CHAIN_ID')) {
                config.network.chainId = parseInt(value);
            } else if (key.includes('NETWORK')) {
                config.network.name = value;
            } else if (key.includes('SUBGRAPH')) {
                config.endpoints.subgraph = value;
            } else if (key.includes('BACKEND')) {
                config.endpoints.backend = value;
            } else if (key.includes('VRF_SUBSCRIPTION_ID')) {
                config.vrf.subscriptionId = value;
            }
        }
        
        return config;
    }

    // 驗證單個項目
    async validateProject(projectKey, projectConfig) {
        log(`\n🔍 驗證 ${projectConfig.name}...`, 'blue');
        
        const result = {
            name: projectConfig.name,
            priority: projectConfig.priority,
            files: [],
            issues: [],
            warnings: [],
            deprecated: []
        };

        for (const configPath of projectConfig.configPaths) {
            const fileResult = await this.validateConfigFile(configPath, projectKey);
            if (fileResult) {
                result.files.push(fileResult);
                
                // 彙總問題
                result.issues.push(...fileResult.issues);
                result.warnings.push(...fileResult.warnings);
                result.deprecated.push(...fileResult.deprecated);
            }
        }

        this.validationResults.projects[projectKey] = result;

        // 顯示項目摘要
        const issueCount = result.issues.length;
        const warningCount = result.warnings.length;
        const deprecatedCount = result.deprecated.length;

        if (issueCount === 0 && warningCount === 0 && deprecatedCount === 0) {
            log(`  ✅ ${projectConfig.name} 配置正確`, 'green');
        } else {
            if (issueCount > 0) log(`  ❌ 嚴重問題: ${issueCount}`, 'red');
            if (deprecatedCount > 0) log(`  ⚠️  過時地址: ${deprecatedCount}`, 'yellow');
            if (warningCount > 0) log(`  💡 警告: ${warningCount}`, 'dim');
        }

        return result;
    }

    // 驗證配置文件
    async validateConfigFile(filePath, projectKey) {
        if (!fs.existsSync(filePath)) {
            return {
                path: filePath,
                exists: false,
                issues: [`配置文件不存在: ${path.basename(filePath)}`],
                warnings: [],
                deprecated: []
            };
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const ext = path.extname(filePath);
            
            const result = {
                path: filePath,
                exists: true,
                issues: [],
                warnings: [],
                deprecated: [],
                addresses: []
            };

            // 根據文件類型驗證
            if (ext === '.json') {
                await this.validateJsonConfig(content, result, projectKey);
            } else if (ext === '.yaml' || ext === '.yml') {
                await this.validateYamlConfig(content, result);
            } else if (ext === '.ts' || ext === '.js') {
                await this.validateCodeConfig(content, result);
            } else {
                await this.validateEnvConfig(content, result);
            }

            return result;
        } catch (error) {
            return {
                path: filePath,
                exists: true,
                issues: [`文件解析錯誤: ${error.message}`],
                warnings: [],
                deprecated: []
            };
        }
    }

    // 驗證 JSON 配置
    async validateJsonConfig(content, result, projectKey) {
        try {
            const config = JSON.parse(content);
            
            // 檢查合約地址
            if (config.contracts) {
                this.validateContractAddresses(config.contracts, result, 'camelCase');
            }
            
            // 檢查 public/config/latest.json 特殊格式
            if (result.path.includes('latest.json') && config.contracts) {
                for (const [key, address] of Object.entries(config.contracts)) {
                    this.checkAddress(address, key, result);
                }
            }

            // 檢查 backend contracts.json
            if (projectKey === 'backend' && config.contracts) {
                for (const [key, address] of Object.entries(config.contracts)) {
                    this.checkAddress(address, key, result);
                }
            }

            // 檢查子圖 networks.json
            if (result.path.includes('networks.json') && config.bsc?.contracts) {
                this.validateContractAddresses(config.bsc.contracts, result, 'lowercase');
            }

        } catch (error) {
            result.issues.push(`JSON 解析錯誤: ${error.message}`);
        }
    }

    // 驗證 YAML 配置 (subgraph.yaml)
    async validateYamlConfig(content, result) {
        // 簡單的地址提取（不完整解析 YAML）
        const addressPattern = /0x[a-fA-F0-9]{40}/g;
        const matches = content.match(addressPattern) || [];
        
        for (const address of matches) {
            this.checkAddress(address, 'unknown', result);
        }
    }

    // 驗證代碼文件中的配置
    async validateCodeConfig(content, result) {
        const addressPattern = /0x[a-fA-F0-9]{40}/g;
        const matches = content.match(addressPattern) || [];
        
        for (const address of matches) {
            // 跳過註釋中的地址
            if (this.isInComment(content, address)) continue;
            
            this.checkAddress(address, 'hardcoded', result);
        }
    }

    // 驗證 ENV 配置
    async validateEnvConfig(content, result) {
        const masterConfig = this.validationResults.masterConfig.config;
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            
            if (key.endsWith('_ADDRESS')) {
                const contractName = key.replace('VITE_', '').replace('_ADDRESS', '');
                const expectedAddress = masterConfig.contracts[contractName];
                
                if (expectedAddress && value !== expectedAddress) {
                    result.issues.push(`${contractName} 地址不一致: 預期 ${expectedAddress}, 實際 ${value}`);
                }
                
                this.checkAddress(value, contractName, result);
            }
        }
    }

    // 驗證合約地址對象
    validateContractAddresses(contracts, result, namingStyle) {
        for (const [key, address] of Object.entries(contracts)) {
            // 轉換命名風格到標準格式
            const standardKey = this.convertToStandardNaming(key, namingStyle);
            this.checkAddress(address, standardKey, result);
        }
    }

    // 檢查單個地址
    checkAddress(address, contractKey, result) {
        if (!address || typeof address !== 'string') return;
        
        result.addresses.push({ address, contract: contractKey });

        // 檢查是否為當前 V25 地址
        const isCurrentAddress = Object.values(this.v25Addresses).includes(address);
        if (isCurrentAddress) return;

        // 檢查是否為過時地址
        if (this.deprecatedAddresses[address]) {
            result.deprecated.push({
                address,
                contract: contractKey,
                description: this.deprecatedAddresses[address]
            });
            return;
        }

        // 檢查地址格式
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            result.issues.push(`無效地址格式: ${address} (${contractKey})`);
            return;
        }

        // 未知地址
        result.warnings.push(`未知地址: ${address} (${contractKey})`);
    }

    // 轉換命名風格
    convertToStandardNaming(key, fromStyle) {
        switch (fromStyle) {
            case 'camelCase':
                return key.toUpperCase();
            case 'lowercase':
                return key.toUpperCase();
            default:
                return key;
        }
    }

    // 檢查地址是否在註釋中
    isInComment(content, address) {
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.includes(address)) {
                const trimmed = line.trim();
                if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
                    return true;
                }
            }
        }
        return false;
    }

    // 執行完整驗證
    async runValidation() {
        log('🔍 開始配置驗證', 'bright');
        log('=====================================', 'cyan');

        try {
            // 載入主配置
            await this.loadMasterConfig();

            // 驗證各項目
            for (const [projectKey, projectConfig] of Object.entries(this.projectConfigs)) {
                await this.validateProject(projectKey, projectConfig);
            }

            // 生成總結
            this.generateSummary();
            this.generateRecommendations();
            
            return true;
        } catch (error) {
            log(`❌ 驗證失敗: ${error.message}`, 'red');
            return false;
        }
    }

    // 生成總結
    generateSummary() {
        log('\n=====================================', 'cyan');
        log('📊 驗證總結', 'bright');
        log('=====================================', 'cyan');

        let totalIssues = 0;
        let totalWarnings = 0;
        let totalDeprecated = 0;
        let criticalProjects = 0;

        for (const [projectKey, result] of Object.entries(this.validationResults.projects)) {
            const issueCount = result.issues.length;
            const warningCount = result.warnings.length;
            const deprecatedCount = result.deprecated.length;

            totalIssues += issueCount;
            totalWarnings += warningCount;
            totalDeprecated += deprecatedCount;

            if (issueCount > 0 || deprecatedCount > 0) {
                criticalProjects++;
            }

            log(`\n📁 ${result.name}:`, 'blue');
            if (issueCount === 0 && deprecatedCount === 0) {
                log(`  ✅ 配置正確`, 'green');
            } else {
                if (issueCount > 0) log(`  ❌ 嚴重問題: ${issueCount}`, 'red');
                if (deprecatedCount > 0) log(`  ⚠️  過時地址: ${deprecatedCount}`, 'yellow');
                if (warningCount > 0) log(`  💡 警告: ${warningCount}`, 'dim');
            }
        }

        this.validationResults.summary = {
            totalIssues,
            criticalIssues: totalIssues + totalDeprecated,
            warnings: totalWarnings,
            deprecated: totalDeprecated,
            criticalProjects
        };

        log('\n📈 總計:', 'cyan');
        log(`  嚴重問題: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green');
        log(`  過時地址: ${totalDeprecated}`, totalDeprecated > 0 ? 'yellow' : 'green');
        log(`  警告: ${totalWarnings}`, totalWarnings > 0 ? 'dim' : 'green');
        log(`  問題項目: ${criticalProjects}/3`, criticalProjects > 0 ? 'red' : 'green');
    }

    // 生成修復建議
    generateRecommendations() {
        log('\n=====================================', 'cyan');
        log('🔧 修復建議', 'bright');
        log('=====================================', 'cyan');

        const { summary } = this.validationResults;

        if (summary.criticalIssues === 0) {
            log('🎉 所有配置都正確！', 'green');
            log('\n💡 建議:', 'blue');
            log('  - 定期執行驗證: node scripts/config-validator.js', 'dim');
            log('  - 部署前自動驗證: 添加到 CI/CD 流程', 'dim');
            return;
        }

        log('\n🚨 立即修復:', 'red');
        
        if (summary.deprecated > 0) {
            log('  1. 執行配置同步:', 'red');
            log('     cd /Users/sotadic/Documents/DungeonDelversContracts', 'dim');
            log('     node scripts/ultimate-config-system.js sync', 'dim');
        }

        if (summary.totalIssues > 0) {
            log('  2. 手動檢查配置文件:', 'red');
            for (const [_, result] of Object.entries(this.validationResults.projects)) {
                if (result.issues.length > 0) {
                    log(`     ${result.name}: ${result.issues.length} 個問題`, 'dim');
                }
            }
        }

        log('\n💡 預防措施:', 'blue');
        log('  - 只編輯主配置文件: .env', 'dim');
        log('  - 同步後驗證: config-validator.js', 'dim');
        log('  - 設置自動檢查: Git hooks', 'dim');

        // 生成修復腳本
        this.generateFixCommands();
    }

    // 生成修復命令
    generateFixCommands() {
        log('\n🔧 修復命令:', 'green');
        log('# 1. 同步配置', 'dim');
        log('cd /Users/sotadic/Documents/DungeonDelversContracts', 'dim');
        log('node scripts/ultimate-config-system.js sync', 'dim');
        
        log('\n# 2. 重新驗證', 'dim');
        log('node scripts/config-validator.js', 'dim');
        
        log('\n# 3. 重啟服務器', 'dim');
        log('# 前端: cd /Users/sotadic/Documents/GitHub/SoulboundSaga && npm run dev', 'dim');
        log('# 後端: cd /Users/sotadic/Documents/dungeon-delvers-metadata-server && npm start', 'dim');
    }

    // 監控模式
    async watchMode() {
        log('👁️  開始配置監控模式...', 'blue');
        log('監控文件變更，自動驗證配置', 'dim');
        log('按 Ctrl+C 退出', 'dim');

        const watchPaths = [
            this.masterConfigPath,
            ...Object.values(this.projectConfigs).flatMap(p => p.configPaths)
        ];

        for (const watchPath of watchPaths) {
            if (fs.existsSync(watchPath)) {
                fs.watchFile(watchPath, { interval: 2000 }, async () => {
                    log(`\n📝 檢測到 ${path.basename(watchPath)} 變更`, 'yellow');
                    await this.runValidation();
                });
            }
        }

        // 初始驗證
        await this.runValidation();
    }
}

// CLI 入口
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'validate';
    
    const validator = new ConfigValidator();
    
    switch (command) {
        case 'validate':
        case 'check':
            await validator.runValidation();
            break;
            
        case 'watch':
        case 'monitor':
            await validator.watchMode();
            break;
            
        case 'quick':
            // 快速檢查（只檢查主要配置文件）
            log('⚡ 快速配置檢查', 'bright');
            await validator.loadMasterConfig();
            await validator.validateProject('frontend', validator.projectConfigs.frontend);
            break;
            
        default:
            log('🔍 配置驗證工具', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  validate  - 執行完整驗證 (預設)', 'dim');
            log('  check     - 同 validate', 'dim');
            log('  watch     - 監控模式', 'dim');
            log('  quick     - 快速檢查', 'dim');
            log('\n💡 建議使用:', 'yellow');
            log('  部署前: node scripts/config-validator.js', 'dim');
            log('  開發時: node scripts/config-validator.js watch', 'dim');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ConfigValidator;
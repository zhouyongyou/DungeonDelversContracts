#!/usr/bin/env node

/**
 * 配置管理器 - 中央化配置管理
 * 解決同步腳本經常出錯的問題
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ConfigManager {
    constructor() {
        this.masterConfigPath = path.join(__dirname, '../deployments/v25-master.json');
        this.logPath = path.join(__dirname, '../deployments/sync-log.json');
        this.config = null;
        this.syncLog = [];
    }
    
    // 載入主配置
    loadMasterConfig() {
        try {
            if (fs.existsSync(this.masterConfigPath)) {
                this.config = JSON.parse(fs.readFileSync(this.masterConfigPath, 'utf8'));
                return true;
            }
        } catch (error) {
            console.error('❌ 無法載入主配置:', error.message);
        }
        return false;
    }
    
    // 保存主配置
    saveMasterConfig(config) {
        try {
            fs.writeFileSync(this.masterConfigPath, JSON.stringify(config, null, 2));
            this.config = config;
            return true;
        } catch (error) {
            console.error('❌ 無法保存主配置:', error.message);
            return false;
        }
    }
    
    // 計算文件校驗和
    getFileChecksum(filePath) {
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    // 記錄同步操作
    logSync(operation) {
        const entry = {
            timestamp: new Date().toISOString(),
            ...operation
        };
        
        this.syncLog.push(entry);
        
        // 保存日誌
        try {
            let existingLog = [];
            if (fs.existsSync(this.logPath)) {
                existingLog = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
            }
            existingLog.push(entry);
            
            // 只保留最近100條
            if (existingLog.length > 100) {
                existingLog = existingLog.slice(-100);
            }
            
            fs.writeFileSync(this.logPath, JSON.stringify(existingLog, null, 2));
        } catch (error) {
            console.error('⚠️  無法保存同步日誌');
        }
    }
    
    // 同步策略配置
    getSyncStrategies() {
        return {
            frontend: {
                env: {
                    pattern: 'REACT_APP_{CONTRACT}_CONTRACT={ADDRESS}',
                    contracts: ['HERO', 'RELIC', 'PARTY', 'DUNGEONMASTER', 'DUNGEONSTORAGE']
                },
                typescript: {
                    pattern: '{contract}: "{address}"',
                    contracts: ['hero', 'relic', 'party', 'dungeonMaster', 'dungeonStorage']
                }
            },
            backend: {
                env: {
                    pattern: '{CONTRACT}_ADDRESS={ADDRESS}',
                    contracts: ['HERO', 'RELIC', 'PARTY', 'DUNGEONMASTER', 'DUNGEONSTORAGE']
                },
                json: {
                    directReplace: true,
                    preserveStructure: true
                }
            },
            subgraph: {
                yaml: {
                    pattern: 'address: "{address}"',
                    preserveIndentation: true
                }
            }
        };
    }
    
    // 生成配置文件
    generateConfigFile(type, format) {
        if (!this.config) {
            console.error('❌ 請先載入主配置');
            return null;
        }
        
        const strategies = this.getSyncStrategies();
        let output = '';
        
        switch(type) {
            case 'frontend-env':
                for (const [key, value] of Object.entries(this.config.contracts)) {
                    output += `REACT_APP_${key}_CONTRACT=${value}\n`;
                }
                output += `REACT_APP_SUBGRAPH_URL=${this.config.subgraphEndpoint}\n`;
                break;
                
            case 'frontend-ts':
                output = `// V25 Configuration - Auto Generated\n`;
                output += `// Generated: ${new Date().toISOString()}\n\n`;
                output += `export const contractAddresses = {\n`;
                for (const [key, value] of Object.entries(this.config.contracts)) {
                    const camelKey = key.charAt(0).toLowerCase() + key.slice(1).toLowerCase();
                    output += `  ${camelKey}: '${value}',\n`;
                }
                output += `};\n\n`;
                output += `export const config = {\n`;
                output += `  version: '${this.config.version}',\n`;
                output += `  network: '${this.config.network}',\n`;
                output += `  subgraphUrl: '${this.config.subgraphEndpoint}',\n`;
                output += `};\n`;
                break;
                
            case 'backend-env':
                for (const [key, value] of Object.entries(this.config.contracts)) {
                    output += `${key}_ADDRESS=${value}\n`;
                }
                output += `SUBGRAPH_URL=${this.config.subgraphEndpoint}\n`;
                break;
                
            case 'backend-json':
                output = JSON.stringify({
                    version: this.config.version,
                    network: this.config.network,
                    contracts: this.config.contracts,
                    subgraph: {
                        endpoint: this.config.subgraphEndpoint,
                        version: this.config.subgraphVersion
                    }
                }, null, 2);
                break;
                
            default:
                console.error('❌ 未知的配置類型');
                return null;
        }
        
        return output;
    }
    
    // 比較配置差異
    compareConfigs(file1, file2) {
        const diffs = [];
        
        // 提取地址進行比較
        const extractAddresses = (content) => {
            const pattern = /0x[a-fA-F0-9]{40}/g;
            return content.match(pattern) || [];
        };
        
        const addr1 = extractAddresses(file1);
        const addr2 = extractAddresses(file2);
        
        // 找出差異
        const unique1 = addr1.filter(a => !addr2.includes(a));
        const unique2 = addr2.filter(a => !addr1.includes(a));
        
        return {
            onlyInFile1: unique1,
            onlyInFile2: unique2,
            common: addr1.filter(a => addr2.includes(a))
        };
    }
    
    // 驗證配置一致性
    async validateConsistency() {
        const results = {
            consistent: true,
            issues: [],
            files: {}
        };
        
        const filesToCheck = [
            {
                path: '/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local',
                type: 'frontend-env'
            },
            {
                path: '/Users/sotadic/Documents/GitHub/SoulboundSaga/src/config/contracts.ts',
                type: 'frontend-ts'
            },
            {
                path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
                type: 'backend-json'
            }
        ];
        
        for (const file of filesToCheck) {
            if (!fs.existsSync(file.path)) {
                results.issues.push(`文件不存在: ${file.path}`);
                continue;
            }
            
            const content = fs.readFileSync(file.path, 'utf8');
            const expected = this.generateConfigFile(file.type);
            
            // 簡單比較關鍵地址
            const expectedAddresses = Object.values(this.config.contracts);
            let foundCount = 0;
            let missingAddresses = [];
            
            for (const addr of expectedAddresses) {
                if (content.includes(addr)) {
                    foundCount++;
                } else {
                    missingAddresses.push(addr);
                }
            }
            
            results.files[file.path] = {
                found: foundCount,
                total: expectedAddresses.length,
                missing: missingAddresses
            };
            
            if (missingAddresses.length > 0) {
                results.consistent = false;
                results.issues.push(`${path.basename(file.path)}: 缺少 ${missingAddresses.length} 個地址`);
            }
        }
        
        return results;
    }
}

// CLI 界面
async function cli() {
    const manager = new ConfigManager();
    const args = process.argv.slice(2);
    const command = args[0];
    
    console.log('🎯 配置管理器 V25\n');
    
    // 初始化 V25 主配置
    const V25_CONFIG = {
        version: 'V25',
        timestamp: '2025-08-07 18:00',
        network: 'BSC Mainnet',
        chainId: 56,
        startBlock: 56757876,
        subgraphVersion: 'v3.8.0',
        subgraphEndpoint: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0',
        contracts: {
            DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
            DUNGEONMASTER: '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a',
            HERO: '0x671d937b171e2ba2c4dc23c133b07e4449f283ef',
            RELIC: '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da',
            ALTAROFASCENSION: '0xa86749237d4631ad92ba859d0b0df4770f6147ba',
            PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
            DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
            PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
            PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
            VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
            ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
            SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
            USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
            VRF_MANAGER: '0x980d224ec4d198d94f34a8af76a19c00dabe2436'
        }
    };
    
    switch(command) {
        case 'init':
            console.log('📝 初始化 V25 主配置...');
            if (manager.saveMasterConfig(V25_CONFIG)) {
                console.log('✅ 主配置已創建');
            }
            break;
            
        case 'validate':
            console.log('🔍 驗證配置一致性...\n');
            if (!manager.loadMasterConfig()) {
                console.log('❌ 請先運行 node config-manager.js init');
                break;
            }
            
            const validation = await manager.validateConsistency();
            
            if (validation.consistent) {
                console.log('✅ 所有配置文件一致！');
            } else {
                console.log('⚠️  發現不一致：');
                validation.issues.forEach(issue => {
                    console.log(`  - ${issue}`);
                });
            }
            
            console.log('\n📊 文件詳情：');
            for (const [file, info] of Object.entries(validation.files)) {
                console.log(`  ${path.basename(file)}: ${info.found}/${info.total} 地址正確`);
                if (info.missing.length > 0) {
                    console.log(`    缺少: ${info.missing.join(', ')}`);
                }
            }
            break;
            
        case 'generate':
            const type = args[1];
            if (!type) {
                console.log('用法: node config-manager.js generate [frontend-env|frontend-ts|backend-env|backend-json]');
                break;
            }
            
            if (!manager.loadMasterConfig()) {
                console.log('❌ 請先運行 node config-manager.js init');
                break;
            }
            
            const output = manager.generateConfigFile(type);
            if (output) {
                console.log('📄 生成的配置：\n');
                console.log(output);
                
                // 保存到文件
                const outputFile = path.join(__dirname, `../deployments/generated-${type}.txt`);
                fs.writeFileSync(outputFile, output);
                console.log(`\n💾 已保存到: ${outputFile}`);
            }
            break;
            
        case 'help':
        default:
            console.log('📚 可用命令：\n');
            console.log('  init     - 初始化 V25 主配置');
            console.log('  validate - 驗證所有配置文件的一致性');
            console.log('  generate [type] - 生成特定格式的配置文件');
            console.log('    類型: frontend-env, frontend-ts, backend-env, backend-json');
            console.log('\n範例:');
            console.log('  node config-manager.js init');
            console.log('  node config-manager.js validate');
            console.log('  node config-manager.js generate frontend-env');
            break;
    }
}

// 執行 CLI
if (require.main === module) {
    cli().catch(console.error);
}

module.exports = ConfigManager;
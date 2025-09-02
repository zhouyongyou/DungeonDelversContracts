#!/usr/bin/env node

/**
 * 統一配置同步工具
 * 自動同步合約地址到前端、子圖、後端
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置檔案路徑
const CONFIG_PATHS = {
    // 主配置文件
    master: '/Users/sotadic/Documents/DungeonDelversContracts/master-config.json',
    
    // 前端配置
    frontend: {
        contracts: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
        env: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local'
    },
    
    // 子圖配置
    subgraph: {
        yaml: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml',
        config: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/config/config.json'
    },
    
    // 後端配置
    backend: {
        env: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env',
        config: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json'
    }
};

// V25 合約地址（最新部署）
const V25_ADDRESSES = {
    Hero: '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
    Relic: '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
    AltarOfAscension: '0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1',
    VRFManager: '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1',
    DungeonCore: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
    SoulShard: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    Oracle: '0x67989939163bCFC57302767722E1988FFac46d64',
    PlayerVault: '0x39523e8eeB6c54fCe65D62ec696cA5ad888eF25c',
    PlayerProfile: '0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7',
    VIPStaking: '0x186a89e5418645459ed0a469FF97C9d4B2ca5355',
    DungeonStorage: '0x88EF98E7F9095610d7762C30165854f271525B97',
    DungeonMaster: '0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703',
    Party: '0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5'
};

// 顏色輸出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 讀取主配置
function readMasterConfig() {
    try {
        if (fs.existsSync(CONFIG_PATHS.master)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATHS.master, 'utf8'));
        }
    } catch (error) {
        log(`Warning: Could not read master config: ${error.message}`, 'yellow');
    }
    return null;
}

// 寫入主配置
function writeMasterConfig(config) {
    try {
        fs.writeFileSync(
            CONFIG_PATHS.master,
            JSON.stringify(config, null, 2)
        );
        log('✅ Master config updated', 'green');
    } catch (error) {
        log(`❌ Failed to write master config: ${error.message}`, 'red');
    }
}

// 更新前端配置
function updateFrontendConfig(addresses) {
    log('\n📱 Updating Frontend Configuration...', 'blue');
    
    // 更新 contracts.ts
    try {
        const contractsPath = CONFIG_PATHS.frontend.contracts;
        let content = fs.readFileSync(contractsPath, 'utf8');
        
        // 更新地址
        Object.entries(addresses).forEach(([name, address]) => {
            const regex = new RegExp(`${name}:\\s*["']0x[a-fA-F0-9]{40}["']`, 'g');
            content = content.replace(regex, `${name}: "${address}"`);
        });
        
        fs.writeFileSync(contractsPath, content);
        log('  ✅ contracts.ts updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update contracts.ts: ${error.message}`, 'red');
    }
    
    // 更新 .env.local
    try {
        const envPath = CONFIG_PATHS.frontend.env;
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // 更新或添加環境變數
        Object.entries(addresses).forEach(([name, address]) => {
            const envKey = `VITE_${name.toUpperCase()}_ADDRESS`;
            const regex = new RegExp(`^${envKey}=.*$`, 'gm');
            
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${envKey}=${address}`);
            } else {
                envContent += `\n${envKey}=${address}`;
            }
        });
        
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        log('  ✅ .env.local updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update .env.local: ${error.message}`, 'red');
    }
}

// 更新子圖配置
function updateSubgraphConfig(addresses) {
    log('\n📊 Updating Subgraph Configuration...', 'blue');
    
    // 更新 subgraph.yaml
    try {
        const yamlPath = CONFIG_PATHS.subgraph.yaml;
        let content = fs.readFileSync(yamlPath, 'utf8');
        
        // 更新 Hero 地址
        content = content.replace(
            /address:\s*["']0x[a-fA-F0-9]{40}["']\s*#\s*Hero/g,
            `address: "${addresses.Hero}" # Hero`
        );
        content = content.replace(
            /(\s+- kind: ethereum\/contract\s+name: Hero[\s\S]*?source:\s+address:\s*)["']0x[a-fA-F0-9]{40}["']/,
            `$1"${addresses.Hero}"`
        );
        
        // 更新 Relic 地址
        content = content.replace(
            /(\s+- kind: ethereum\/contract\s+name: Relic[\s\S]*?source:\s+address:\s*)["']0x[a-fA-F0-9]{40}["']/,
            `$1"${addresses.Relic}"`
        );
        
        // 更新 AltarOfAscension 地址
        content = content.replace(
            /(\s+- kind: ethereum\/contract\s+name: AltarOfAscension[\s\S]*?source:\s+address:\s*)["']0x[a-fA-F0-9]{40}["']/,
            `$1"${addresses.AltarOfAscension}"`
        );
        
        // 更新 VRFManager 地址
        content = content.replace(
            /(\s+- kind: ethereum\/contract\s+name: VRFManagerV2Plus[\s\S]*?source:\s+address:\s*)["']0x[a-fA-F0-9]{40}["']/,
            `$1"${addresses.VRFManager}"`
        );
        
        fs.writeFileSync(yamlPath, content);
        log('  ✅ subgraph.yaml updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update subgraph.yaml: ${error.message}`, 'red');
    }
    
    // 更新 config.json
    try {
        const configPath = CONFIG_PATHS.subgraph.config;
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const config = {
            network: 'bsc',
            addresses: addresses,
            startBlock: 56696666,
            version: 'V25',
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        log('  ✅ config.json updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update config.json: ${error.message}`, 'red');
    }
}

// 更新後端配置
function updateBackendConfig(addresses) {
    log('\n🖥️  Updating Backend Configuration...', 'blue');
    
    // 更新 .env
    try {
        const envPath = CONFIG_PATHS.backend.env;
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // 更新或添加環境變數
        Object.entries(addresses).forEach(([name, address]) => {
            const envKey = `${name.toUpperCase()}_ADDRESS`;
            const regex = new RegExp(`^${envKey}=.*$`, 'gm');
            
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${envKey}=${address}`);
            } else {
                envContent += `\n${envKey}=${address}`;
            }
        });
        
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        log('  ✅ .env updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update .env: ${error.message}`, 'red');
    }
    
    // 更新 contracts.json
    try {
        const configPath = CONFIG_PATHS.backend.config;
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const config = {
            network: 'bsc-mainnet',
            chainId: 56,
            contracts: addresses,
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        log('  ✅ contracts.json updated', 'green');
    } catch (error) {
        log(`  ❌ Failed to update contracts.json: ${error.message}`, 'red');
    }
}

// 驗證配置一致性
function verifySync() {
    log('\n🔍 Verifying Configuration Sync...', 'blue');
    
    let allSynced = true;
    const issues = [];
    
    // 檢查前端
    try {
        const content = fs.readFileSync(CONFIG_PATHS.frontend.contracts, 'utf8');
        Object.entries(V25_ADDRESSES).forEach(([name, address]) => {
            if (!content.includes(address)) {
                issues.push(`Frontend missing ${name}: ${address}`);
                allSynced = false;
            }
        });
    } catch (error) {
        issues.push(`Cannot check frontend: ${error.message}`);
        allSynced = false;
    }
    
    // 檢查子圖
    try {
        const content = fs.readFileSync(CONFIG_PATHS.subgraph.yaml, 'utf8');
        ['Hero', 'Relic', 'AltarOfAscension'].forEach(name => {
            if (!content.includes(V25_ADDRESSES[name])) {
                issues.push(`Subgraph missing ${name}: ${V25_ADDRESSES[name]}`);
                allSynced = false;
            }
        });
    } catch (error) {
        issues.push(`Cannot check subgraph: ${error.message}`);
        allSynced = false;
    }
    
    if (allSynced) {
        log('  ✅ All configurations are in sync!', 'green');
    } else {
        log('  ⚠️  Configuration issues found:', 'yellow');
        issues.forEach(issue => log(`    - ${issue}`, 'yellow'));
    }
    
    return allSynced;
}

// 主函數
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'sync';
    
    log('🔄 Configuration Sync Tool', 'bright');
    log('==========================', 'bright');
    
    switch (command) {
        case 'sync':
            log('\n🚀 Starting full sync...', 'blue');
            
            // 更新主配置
            const masterConfig = {
                version: 'V25',
                network: 'bsc-mainnet',
                chainId: 56,
                addresses: V25_ADDRESSES,
                deploymentDate: '2025-08-02',
                lastSync: new Date().toISOString()
            };
            writeMasterConfig(masterConfig);
            
            // 同步到各專案
            updateFrontendConfig(V25_ADDRESSES);
            updateSubgraphConfig(V25_ADDRESSES);
            updateBackendConfig(V25_ADDRESSES);
            
            // 驗證同步
            verifySync();
            
            log('\n✅ Sync completed!', 'green');
            break;
            
        case 'verify':
            verifySync();
            break;
            
        case 'show':
            log('\n📋 Current V25 Addresses:', 'blue');
            Object.entries(V25_ADDRESSES).forEach(([name, address]) => {
                log(`  ${name}: ${address}`, 'yellow');
            });
            break;
            
        default:
            log('\nUsage:', 'yellow');
            log('  node sync-config.js [command]', 'yellow');
            log('\nCommands:', 'yellow');
            log('  sync    - Sync all configurations (default)', 'yellow');
            log('  verify  - Verify configuration consistency', 'yellow');
            log('  show    - Show current addresses', 'yellow');
    }
}

// 執行
main();
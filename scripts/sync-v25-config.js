#!/usr/bin/env node

/**
 * V25 配置同步工具
 * 自動同步合約地址到前端、子圖、後端
 * 版本：V25 (2025-08-07 pm6)
 */

const fs = require('fs');
const path = require('path');

// V25 正確地址（2025-08-07 pm6）
const V25_CONFIG = {
    version: 'V25',
    timestamp: '2025-08-07 18:00',
    network: 'BSC Mainnet',
    chainId: 56,
    startBlock: 56757876,
    subgraphVersion: 'v3.8.0',
    subgraphEndpoint: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0',
    
    contracts: {
        // 核心合約
        DungeonCore: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        DungeonStorage: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
        DungeonMaster: '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a',
        
        // NFT 合約（這些是新的！）
        Hero: '0x671d937b171e2ba2c4dc23c133b07e4449f283ef',
        Relic: '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da',
        Party: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
        AltarOfAscension: '0xa86749237d4631ad92ba859d0b0df4770f6147ba',
        
        // 輔助合約
        PlayerVault: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
        PlayerProfile: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
        VipStaking: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
        Oracle: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
        
        // Token & VRF
        SoulShard: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
        VRFManager: '0x980d224ec4d198d94f34a8af76a19c00dabe2436',
        UniswapPool: '0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82'
    },
    
    vrf: {
        subscriptionId: 29062,
        coordinator: '0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9',
        keyHash: '0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4'
    }
};

// 配置檔案路徑
const CONFIG_PATHS = {
    // 主配置文件
    master: path.join(__dirname, '../deployments/master-config-v25.json'),
    
    // 前端配置（可能的位置）
    frontend: [
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.js',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/constants/addresses.ts',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/constants/addresses.js',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.production'
    ],
    
    // 子圖配置
    subgraph: [
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/networks.json',
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/config/config.json'
    ],
    
    // 後端配置
    backend: [
        '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env',
        '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
        '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/config/contracts.ts'
    ]
};

// 顏色輸出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 寫入主配置
function writeMasterConfig() {
    try {
        fs.writeFileSync(
            CONFIG_PATHS.master,
            JSON.stringify(V25_CONFIG, null, 2)
        );
        log('✅ Master config V25 created', 'green');
        return true;
    } catch (error) {
        log(`❌ Failed to write master config: ${error.message}`, 'red');
        return false;
    }
}

// 更新前端配置
function updateFrontendConfig() {
    log('\n📱 Updating Frontend Configuration...', 'blue');
    
    let updated = false;
    
    for (const configPath of CONFIG_PATHS.frontend) {
        if (!fs.existsSync(configPath)) {
            continue;
        }
        
        try {
            const ext = path.extname(configPath);
            let content = fs.readFileSync(configPath, 'utf8');
            let originalContent = content;
            
            if (ext === '.ts' || ext === '.js') {
                // 更新 TypeScript/JavaScript 配置
                for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                    // 多種可能的格式
                    const patterns = [
                        new RegExp(`${key}:\\s*['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi'),
                        new RegExp(`${key.toUpperCase()}:\\s*['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi'),
                        new RegExp(`${key.toLowerCase()}:\\s*['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi'),
                        new RegExp(`export const ${key} = ['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi'),
                        new RegExp(`const ${key} = ['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi')
                    ];
                    
                    for (const pattern of patterns) {
                        if (pattern.test(content)) {
                            const replacement = content.match(pattern)[0].replace(/0x[a-fA-F0-9]{40}/i, address);
                            content = content.replace(pattern, replacement);
                        }
                    }
                }
                
                // 更新子圖端點
                if (V25_CONFIG.subgraphEndpoint) {
                    content = content.replace(
                        /https:\/\/api\.studio\.thegraph\.com\/query\/[^'"` ]*/g,
                        V25_CONFIG.subgraphEndpoint
                    );
                }
            } else if (configPath.includes('.env')) {
                // 更新環境變數
                for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                    const envKey = `REACT_APP_${key.toUpperCase()}_CONTRACT`;
                    const pattern = new RegExp(`${envKey}=0x[a-fA-F0-9]{40}`, 'gi');
                    if (pattern.test(content)) {
                        content = content.replace(pattern, `${envKey}=${address}`);
                    } else if (!content.includes(envKey)) {
                        content += `\n${envKey}=${address}`;
                    }
                }
                
                // 更新子圖端點
                if (!content.includes('REACT_APP_SUBGRAPH_URL')) {
                    content += `\nREACT_APP_SUBGRAPH_URL=${V25_CONFIG.subgraphEndpoint}`;
                } else {
                    content = content.replace(
                        /REACT_APP_SUBGRAPH_URL=.*/g,
                        `REACT_APP_SUBGRAPH_URL=${V25_CONFIG.subgraphEndpoint}`
                    );
                }
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(configPath, content);
                log(`  ✅ Updated: ${path.basename(configPath)}`, 'green');
                updated = true;
            }
        } catch (error) {
            log(`  ⚠️  Error updating ${path.basename(configPath)}: ${error.message}`, 'yellow');
        }
    }
    
    if (!updated) {
        log('  ⚠️  No frontend config files found or no changes needed', 'yellow');
    }
}

// 更新子圖配置
function updateSubgraphConfig() {
    log('\n📊 Updating Subgraph Configuration...', 'blue');
    
    let updated = false;
    
    for (const configPath of CONFIG_PATHS.subgraph) {
        if (!fs.existsSync(configPath)) {
            continue;
        }
        
        try {
            let content = fs.readFileSync(configPath, 'utf8');
            let originalContent = content;
            
            if (configPath.endsWith('.yaml')) {
                // 更新 subgraph.yaml
                for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                    const pattern = new RegExp(`address:\\s*['"]?0x[a-fA-F0-9]{40}['"]?`, 'gi');
                    const namePattern = new RegExp(`name:\\s*${key}`, 'i');
                    
                    if (namePattern.test(content)) {
                        // 找到對應的合約區塊，更新地址
                        const lines = content.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].includes(`name: ${key}`)) {
                                // 找到接下來的 address 行
                                for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                                    if (lines[j].includes('address:')) {
                                        lines[j] = lines[j].replace(/0x[a-fA-F0-9]{40}/i, address);
                                        break;
                                    }
                                }
                            }
                        }
                        content = lines.join('\n');
                    }
                }
                
                // 更新起始區塊
                content = content.replace(/startBlock:\s*\d+/g, `startBlock: ${V25_CONFIG.startBlock}`);
            } else if (configPath.endsWith('.json')) {
                // 更新 JSON 配置
                const config = JSON.parse(content);
                
                // 更新合約地址
                if (config.contracts) {
                    for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                        if (config.contracts[key]) {
                            config.contracts[key] = address;
                        }
                    }
                }
                
                // 更新網絡配置
                if (config.network) {
                    config.network.startBlock = V25_CONFIG.startBlock;
                }
                
                content = JSON.stringify(config, null, 2);
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(configPath, content);
                log(`  ✅ Updated: ${path.basename(configPath)}`, 'green');
                updated = true;
            }
        } catch (error) {
            log(`  ⚠️  Error updating ${path.basename(configPath)}: ${error.message}`, 'yellow');
        }
    }
    
    if (!updated) {
        log('  ⚠️  No subgraph config files found or no changes needed', 'yellow');
    }
}

// 更新後端配置
function updateBackendConfig() {
    log('\n🖥️  Updating Backend Configuration...', 'blue');
    
    let updated = false;
    
    for (const configPath of CONFIG_PATHS.backend) {
        if (!fs.existsSync(configPath)) {
            continue;
        }
        
        try {
            const ext = path.extname(configPath);
            let content = fs.readFileSync(configPath, 'utf8');
            let originalContent = content;
            
            if (configPath.endsWith('.env')) {
                // 更新環境變數
                for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                    const envKey = key.toUpperCase() + '_ADDRESS';
                    const pattern = new RegExp(`${envKey}=0x[a-fA-F0-9]{40}`, 'gi');
                    if (pattern.test(content)) {
                        content = content.replace(pattern, `${envKey}=${address}`);
                    } else if (!content.includes(envKey)) {
                        content += `\n${envKey}=${address}`;
                    }
                }
                
                // 更新子圖端點
                if (!content.includes('SUBGRAPH_URL')) {
                    content += `\nSUBGRAPH_URL=${V25_CONFIG.subgraphEndpoint}`;
                } else {
                    content = content.replace(
                        /SUBGRAPH_URL=.*/g,
                        `SUBGRAPH_URL=${V25_CONFIG.subgraphEndpoint}`
                    );
                }
            } else if (ext === '.json') {
                // 更新 JSON 配置
                const config = JSON.parse(content);
                config.contracts = V25_CONFIG.contracts;
                config.subgraph = {
                    endpoint: V25_CONFIG.subgraphEndpoint,
                    version: V25_CONFIG.subgraphVersion
                };
                content = JSON.stringify(config, null, 2);
            } else if (ext === '.ts' || ext === '.js') {
                // 更新 TypeScript/JavaScript 配置
                for (const [key, address] of Object.entries(V25_CONFIG.contracts)) {
                    const patterns = [
                        new RegExp(`${key}:\\s*['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi'),
                        new RegExp(`${key.toUpperCase()}:\\s*['"\`]0x[a-fA-F0-9]{40}['"\`]`, 'gi')
                    ];
                    
                    for (const pattern of patterns) {
                        if (pattern.test(content)) {
                            const replacement = content.match(pattern)[0].replace(/0x[a-fA-F0-9]{40}/i, address);
                            content = content.replace(pattern, replacement);
                        }
                    }
                }
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(configPath, content);
                log(`  ✅ Updated: ${path.basename(configPath)}`, 'green');
                updated = true;
            }
        } catch (error) {
            log(`  ⚠️  Error updating ${path.basename(configPath)}: ${error.message}`, 'yellow');
        }
    }
    
    if (!updated) {
        log('  ⚠️  No backend config files found or no changes needed', 'yellow');
    }
}

// 顯示配置摘要
function showSummary() {
    log('\n=====================================', 'cyan');
    log('📋 V25 Configuration Summary', 'cyan');
    log('=====================================', 'cyan');
    
    console.log('\n🔹 Version:', V25_CONFIG.version);
    console.log('🔹 Network:', V25_CONFIG.network);
    console.log('🔹 Start Block:', V25_CONFIG.startBlock);
    console.log('🔹 Subgraph Version:', V25_CONFIG.subgraphVersion);
    
    console.log('\n📝 Key Contract Updates:');
    console.log('  Hero:', V25_CONFIG.contracts.Hero);
    console.log('  Relic:', V25_CONFIG.contracts.Relic);
    console.log('  Party:', V25_CONFIG.contracts.Party);
    console.log('  DungeonMaster:', V25_CONFIG.contracts.DungeonMaster);
    console.log('  DungeonStorage:', V25_CONFIG.contracts.DungeonStorage);
    
    console.log('\n🔗 Subgraph Endpoint:');
    console.log(' ', V25_CONFIG.subgraphEndpoint);
    
    log('\n=====================================', 'cyan');
}

// 主函數
function main() {
    log('🚀 V25 Configuration Sync Tool', 'bright');
    log('=====================================\n', 'cyan');
    
    // 1. 寫入主配置
    writeMasterConfig();
    
    // 2. 更新前端配置
    updateFrontendConfig();
    
    // 3. 更新子圖配置
    updateSubgraphConfig();
    
    // 4. 更新後端配置
    updateBackendConfig();
    
    // 5. 顯示摘要
    showSummary();
    
    log('\n✅ Configuration sync completed!', 'green');
    log('\n⚠️  Please verify and restart services:', 'yellow');
    log('  1. Restart frontend dev server', 'yellow');
    log('  2. Redeploy subgraph if needed', 'yellow');
    log('  3. Restart backend services', 'yellow');
}

// 執行
main();
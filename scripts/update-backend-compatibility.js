#!/usr/bin/env node

/**
 * 後端兼容性更新腳本
 * 讓後端支援多種配置格式（大寫、駝峰式、帶_ADDRESS後綴）
 */

const fs = require('fs');
const path = require('path');

// 需要更新的後端文件
const BACKEND_FILES = [
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/contractReader.js',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/index.js',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/config/index.js'
];

// V25 合約映射
const CONTRACT_MAPPINGS = {
    'hero': ['HERO', 'Hero', 'HERO_ADDRESS'],
    'relic': ['RELIC', 'Relic', 'RELIC_ADDRESS'],
    'dungeonCore': ['DUNGEONCORE', 'DungeonCore', 'DUNGEONCORE_ADDRESS'],
    'dungeonMaster': ['DUNGEONMASTER', 'DungeonMaster', 'DUNGEONMASTER_ADDRESS'],
    'dungeonStorage': ['DUNGEONSTORAGE', 'DungeonStorage', 'DUNGEONSTORAGE_ADDRESS'],
    'party': ['PARTY', 'Party', 'PARTY_ADDRESS'],
    'altarOfAscension': ['ALTAROFASCENSION', 'AltarOfAscension', 'ALTAROFASCENSION_ADDRESS'],
    'playerVault': ['PLAYERVAULT', 'PlayerVault', 'PLAYERVAULT_ADDRESS'],
    'playerProfile': ['PLAYERPROFILE', 'PlayerProfile', 'PLAYERPROFILE_ADDRESS'],
    'vipStaking': ['VIPSTAKING', 'VipStaking', 'VIPSTAKING_ADDRESS'],
    'oracle': ['ORACLE', 'Oracle', 'ORACLE_ADDRESS'],
    'soulShard': ['SOULSHARD', 'SoulShard', 'SOULSHARD_ADDRESS'],
    'vrfManager': ['VRFMANAGER', 'VRFManager', 'VRF_MANAGER', 'VRFMANAGER_ADDRESS']
};

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

// 生成兼容性代碼
function generateCompatibilityCode(varName, possibleKeys) {
    const conditions = possibleKeys.map(key => `config.contracts.${key}`).join(' || ');
    return `${varName} = ${conditions}`;
}

// 更新 contractReader.js
function updateContractReader() {
    const filePath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/contractReader.js';
    
    if (!fs.existsSync(filePath)) {
        log(`  ⚠️  文件不存在: ${filePath}`, 'yellow');
        return false;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // 更新各個合約地址讀取邏輯
        for (const [contractVar, possibleKeys] of Object.entries(CONTRACT_MAPPINGS)) {
            // 查找現有的賦值語句
            const patterns = [
                new RegExp(`CONTRACTS\\.${contractVar}\\s*=\\s*config\\.contracts\\.[A-Z_]+(?:\\s*\\|\\|[^;]+)?;`, 'g'),
                new RegExp(`const ${contractVar}\\s*=\\s*config\\.contracts\\.[A-Z_]+(?:\\s*\\|\\|[^;]+)?;`, 'g')
            ];
            
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    const newAssignment = generateCompatibilityCode(`CONTRACTS.${contractVar}`, possibleKeys);
                    content = content.replace(pattern, `${newAssignment};`);
                }
            }
        }
        
        // 如果沒有變化，添加新的兼容性函數
        if (content === originalContent) {
            // 在文件開頭添加兼容性函數
            const compatibilityFunction = `
// V25 配置兼容性函數
function getContractAddress(config, contractName) {
    const mappings = ${JSON.stringify(CONTRACT_MAPPINGS, null, 2)};
    
    if (mappings[contractName]) {
        for (const key of mappings[contractName]) {
            if (config.contracts && config.contracts[key]) {
                return config.contracts[key];
            }
        }
    }
    
    // 嘗試直接訪問
    return config.contracts && config.contracts[contractName];
}

// 更新合約地址（兼容多種格式）
function updateContractsFromConfig(config) {
    if (!config || !config.contracts) return;
    
    for (const [contractVar, possibleKeys] of Object.entries(${JSON.stringify(CONTRACT_MAPPINGS, null, 2)})) {
        for (const key of possibleKeys) {
            if (config.contracts[key]) {
                CONTRACTS[contractVar] = config.contracts[key];
                break;
            }
        }
    }
}
`;
            
            // 在 require 語句後添加
            const requirePattern = /const.*=.*require\(.*\);/g;
            const lastRequire = content.match(requirePattern);
            if (lastRequire && lastRequire.length > 0) {
                const lastRequireStatement = lastRequire[lastRequire.length - 1];
                content = content.replace(
                    lastRequireStatement,
                    lastRequireStatement + '\n' + compatibilityFunction
                );
            }
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            log(`  ✅ 更新: contractReader.js`, 'green');
            return true;
        } else {
            log(`  ℹ️  contractReader.js 無需更新`, 'blue');
            return false;
        }
        
    } catch (error) {
        log(`  ❌ 更新失敗: ${error.message}`, 'red');
        return false;
    }
}

// 創建配置加載器
function createConfigLoader() {
    const loaderPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/utils/configLoader.js';
    
    const loaderContent = `/**
 * 配置加載器 - 支援多種配置格式
 * V25 兼容性更新
 */

// 合約名稱映射表
const CONTRACT_MAPPINGS = ${JSON.stringify(CONTRACT_MAPPINGS, null, 2)};

/**
 * 從配置中獲取合約地址
 * 支援多種命名格式：大寫、駝峰式、帶_ADDRESS後綴
 */
function getContractAddress(config, contractName) {
    if (!config || !config.contracts) return null;
    
    // 如果有映射，嘗試所有可能的格式
    if (CONTRACT_MAPPINGS[contractName]) {
        for (const key of CONTRACT_MAPPINGS[contractName]) {
            if (config.contracts[key]) {
                return config.contracts[key];
            }
        }
    }
    
    // 直接嘗試合約名
    if (config.contracts[contractName]) {
        return config.contracts[contractName];
    }
    
    // 嘗試大寫版本
    const upperName = contractName.toUpperCase();
    if (config.contracts[upperName]) {
        return config.contracts[upperName];
    }
    
    // 嘗試加 _ADDRESS 後綴
    if (config.contracts[\`\${upperName}_ADDRESS\`]) {
        return config.contracts[\`\${upperName}_ADDRESS\`];
    }
    
    return null;
}

/**
 * 載入所有合約地址
 */
function loadAllContracts(config) {
    const contracts = {};
    
    for (const [contractVar, possibleKeys] of Object.entries(CONTRACT_MAPPINGS)) {
        const address = getContractAddress(config, contractVar);
        if (address) {
            contracts[contractVar] = address;
        }
    }
    
    return contracts;
}

/**
 * 驗證配置完整性
 */
function validateConfig(config) {
    const required = ['hero', 'relic', 'dungeonCore', 'dungeonMaster'];
    const missing = [];
    
    for (const contract of required) {
        if (!getContractAddress(config, contract)) {
            missing.push(contract);
        }
    }
    
    if (missing.length > 0) {
        console.warn('⚠️  配置缺少必要的合約地址:', missing.join(', '));
        return false;
    }
    
    return true;
}

module.exports = {
    getContractAddress,
    loadAllContracts,
    validateConfig,
    CONTRACT_MAPPINGS
};
`;
    
    try {
        // 確保目錄存在
        const dir = path.dirname(loaderPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(loaderPath, loaderContent);
        log(`  ✅ 創建: configLoader.js`, 'green');
        return true;
    } catch (error) {
        log(`  ❌ 創建失敗: ${error.message}`, 'red');
        return false;
    }
}

// 主函數
function main() {
    log('🔧 後端兼容性更新工具', 'bright');
    log('=====================================\n', 'blue');
    
    log('📝 更新後端文件以支援多種配置格式...', 'blue');
    
    // 1. 更新 contractReader.js
    updateContractReader();
    
    // 2. 創建配置加載器
    createConfigLoader();
    
    log('\n=====================================', 'blue');
    log('✅ 兼容性更新完成！', 'green');
    
    log('\n📋 更新內容：', 'yellow');
    log('  1. 後端現在支援三種格式：', 'yellow');
    log('     - 大寫: HERO, RELIC, DUNGEONCORE', 'yellow');
    log('     - 駝峰: Hero, Relic, DungeonCore', 'yellow');
    log('     - 後綴: HERO_ADDRESS, RELIC_ADDRESS', 'yellow');
    
    log('\n  2. 創建了配置加載器工具', 'yellow');
    log('     - 自動處理格式差異', 'yellow');
    log('     - 驗證配置完整性', 'yellow');
    
    log('\n💡 使用方式：', 'cyan');
    log('  const { getContractAddress } = require("./utils/configLoader");', 'cyan');
    log('  const heroAddress = getContractAddress(config, "hero");', 'cyan');
    
    log('\n⚠️  請重啟後端服務以應用更改', 'yellow');
}

// 執行
main();
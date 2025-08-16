#!/usr/bin/env node

/**
 * V25 完整性檢查工具
 * 檢查所有可能遺漏的配置位置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// V25 正確地址
const V25_ADDRESSES = {
    Hero: '0x671d937b171e2ba2c4dc23c133b07e4449f283ef',
    Relic: '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da',
    Party: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
    DungeonStorage: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
    DungeonMaster: '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a',
    AltarOfAscension: '0xa86749237d4631ad92ba859d0b0df4770f6147ba',
    VRFManager: '0x980d224ec4d198d94f34a8af76a19c00dabe2436'
};

// 舊地址（需要被替換的）
const OLD_ADDRESSES = {
    Hero: [
        '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
        '0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0',
        '0x162b0b673f38C11732b0bc0B4B026304e563e8e2'
    ],
    Relic: [
        '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
        '0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366',
        '0x15c2454A31Abc0063ef4a71d0640057d71847a22'
    ],
    Party: [
        '0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5',
        '0xab07E90d44c34FB62313C74F3C7b4b343E52a253'
    ],
    DungeonStorage: [
        '0x88EF98E7F9095610d7762C30165854f271525B97',
        '0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47'
    ],
    DungeonMaster: [
        '0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703',
        '0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9'
    ]
};

// 可能的配置文件位置
const POSSIBLE_LOCATIONS = [
    // 合約專案
    '/Users/sotadic/Documents/DungeonDelversContracts/.env',
    '/Users/sotadic/Documents/DungeonDelversContracts/hardhat.config.js',
    '/Users/sotadic/Documents/DungeonDelversContracts/hardhat.config.ts',
    '/Users/sotadic/Documents/DungeonDelversContracts/scripts/**/*.js',
    '/Users/sotadic/Documents/DungeonDelversContracts/scripts/**/*.ts',
    '/Users/sotadic/Documents/DungeonDelversContracts/deployments/**/*.json',
    '/Users/sotadic/Documents/DungeonDelversContracts/deployments/**/*.env',
    
    // 前端專案
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/**/*.env*',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/**/*.js',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/**/*.ts',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/**/*.jsx',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/**/*.tsx',
    
    // 子圖專案
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/**/*.yaml',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/**/*.yml',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/**/*.json',
    '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/**/*.ts',
    
    // 後端專案
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/**/*.env*',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/**/*.json',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/**/*.js',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/**/*.ts'
];

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 檢查文件中的地址
function checkFileForAddresses(filePath) {
    if (!fs.existsSync(filePath)) return null;
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];
        
        // 檢查是否包含舊地址
        for (const [contract, oldAddressList] of Object.entries(OLD_ADDRESSES)) {
            for (const oldAddress of oldAddressList) {
                if (content.toLowerCase().includes(oldAddress.toLowerCase())) {
                    issues.push({
                        contract,
                        oldAddress,
                        newAddress: V25_ADDRESSES[contract],
                        line: getLineNumber(content, oldAddress)
                    });
                }
            }
        }
        
        // 檢查是否缺少新地址
        for (const [contract, newAddress] of Object.entries(V25_ADDRESSES)) {
            // 如果文件提到合約名但沒有新地址，可能是問題
            const contractMentioned = new RegExp(contract, 'i').test(content);
            const hasNewAddress = content.toLowerCase().includes(newAddress.toLowerCase());
            
            if (contractMentioned && !hasNewAddress && issues.length > 0) {
                // 只在已經有問題的文件中報告缺少新地址
                issues.push({
                    contract,
                    type: 'missing',
                    newAddress
                });
            }
        }
        
        return issues.length > 0 ? issues : null;
    } catch (error) {
        return null;
    }
}

// 獲取行號
function getLineNumber(content, searchStr) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(searchStr.toLowerCase())) {
            return i + 1;
        }
    }
    return null;
}

// 使用 glob 展開路徑
function expandGlob(pattern) {
    try {
        const result = execSync(`find ${pattern} -type f 2>/dev/null || true`, { 
            encoding: 'utf8',
            shell: '/bin/bash'
        });
        return result.split('\n').filter(f => f);
    } catch {
        return [];
    }
}

// 檢查鏈上設置
async function checkOnChainSettings() {
    log('\n🔗 檢查鏈上合約設置...', 'cyan');
    
    try {
        // 這裡可以添加實際的鏈上檢查
        // 例如讀取 DungeonCore 的設置等
        log('  ℹ️  需要運行專門的鏈上檢查腳本', 'yellow');
    } catch (error) {
        log('  ❌ 鏈上檢查失敗: ' + error.message, 'red');
    }
}

// 主函數
async function main() {
    log('🔍 V25 完整性檢查工具', 'bright');
    log('=====================================\n', 'cyan');
    
    const allIssues = new Map();
    
    // 展開所有可能的文件路徑
    log('📂 掃描配置文件...', 'blue');
    const allFiles = new Set();
    
    for (const pattern of POSSIBLE_LOCATIONS) {
        if (pattern.includes('*')) {
            // 處理 glob 模式
            const basePath = pattern.split('*')[0];
            const files = expandGlob(basePath);
            files.forEach(f => allFiles.add(f));
        } else {
            // 直接添加文件
            if (fs.existsSync(pattern)) {
                allFiles.add(pattern);
            }
        }
    }
    
    log(`  找到 ${allFiles.size} 個文件\n`, 'cyan');
    
    // 檢查每個文件
    for (const file of allFiles) {
        const issues = checkFileForAddresses(file);
        if (issues) {
            allIssues.set(file, issues);
        }
    }
    
    // 顯示結果
    if (allIssues.size === 0) {
        log('\n✅ 太棒了！沒有發現遺漏的配置', 'green');
    } else {
        log(`\n⚠️  發現 ${allIssues.size} 個文件需要更新：`, 'yellow');
        
        for (const [file, issues] of allIssues) {
            const relativePath = file.replace('/Users/sotadic/Documents/', '');
            log(`\n📄 ${relativePath}:`, 'yellow');
            
            for (const issue of issues) {
                if (issue.type === 'missing') {
                    log(`   ⚠️  缺少 ${issue.contract}: ${issue.newAddress}`, 'yellow');
                } else {
                    const line = issue.line ? ` (Line ${issue.line})` : '';
                    log(`   ❌ ${issue.contract}${line}:`, 'red');
                    log(`      舊: ${issue.oldAddress}`, 'red');
                    log(`      新: ${issue.newAddress}`, 'green');
                }
            }
        }
        
        log('\n💡 建議執行以下命令修復：', 'cyan');
        log('   node scripts/sync-v25-config.js', 'cyan');
    }
    
    // 檢查特定的關鍵配置
    log('\n🔑 關鍵配置檢查：', 'cyan');
    
    // 檢查 Hardhat 配置
    const hardhatConfig = '/Users/sotadic/Documents/DungeonDelversContracts/hardhat.config.js';
    if (fs.existsSync(hardhatConfig)) {
        const content = fs.readFileSync(hardhatConfig, 'utf8');
        if (content.includes('0x')) {
            log('  ⚠️  Hardhat 配置包含硬編碼地址，建議使用環境變數', 'yellow');
        } else {
            log('  ✅ Hardhat 配置正確使用環境變數', 'green');
        }
    }
    
    // 檢查主配置文件
    const masterConfig = '/Users/sotadic/Documents/DungeonDelversContracts/deployments/master-config-v25.json';
    if (fs.existsSync(masterConfig)) {
        const config = JSON.parse(fs.readFileSync(masterConfig, 'utf8'));
        if (config.version === 'V25') {
            log('  ✅ 主配置文件版本正確 (V25)', 'green');
        } else {
            log('  ❌ 主配置文件版本錯誤', 'red');
        }
    } else {
        log('  ⚠️  主配置文件不存在', 'yellow');
    }
    
    // 檢查鏈上設置
    await checkOnChainSettings();
    
    log('\n=====================================', 'cyan');
    log('檢查完成！', 'bright');
    
    if (allIssues.size > 0) {
        log(`\n發現 ${allIssues.size} 個文件需要更新`, 'yellow');
        process.exit(1);
    } else {
        log('\n所有配置都是最新的 V25！', 'green');
        process.exit(0);
    }
}

// 執行
main().catch(console.error);
#!/usr/bin/env node

/**
 * 安全同步工具 V25
 * 1. 先備份
 * 2. 顯示將要修改的內容
 * 3. 請求確認
 * 4. 執行修改
 * 5. 自動驗證
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// V25 官方配置（單一事實來源）
const V25_MASTER_CONFIG = {
    version: 'V25',
    timestamp: '2025-08-07 18:00',
    network: 'BSC Mainnet',
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

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    dim: '\x1b[2m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 創建備份
function createBackup(filePath) {
    if (!fs.existsSync(filePath)) return null;
    
    const backupDir = path.join(__dirname, '../backups', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);
    
    try {
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
    } catch (error) {
        log(`  ⚠️  無法備份: ${error.message}`, 'yellow');
        return null;
    }
}

// 檢測文件中的地址
function detectAddresses(content) {
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const matches = content.match(addressPattern) || [];
    const uniqueAddresses = [...new Set(matches)];
    
    const categorized = {
        correct: [],
        incorrect: [],
        unknown: []
    };
    
    const correctAddresses = Object.values(V25_MASTER_CONFIG.contracts);
    
    for (const addr of uniqueAddresses) {
        if (correctAddresses.includes(addr)) {
            categorized.correct.push(addr);
        } else if (isKnownOldAddress(addr)) {
            categorized.incorrect.push(addr);
        } else {
            categorized.unknown.push(addr);
        }
    }
    
    return categorized;
}

// 已知的舊地址
function isKnownOldAddress(address) {
    const oldAddresses = [
        // 舊 Hero
        '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d',
        '0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0',
        // 舊 Relic
        '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316',
        '0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366',
        // 舊 Party
        '0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5',
        // 舊 DungeonStorage
        '0x88EF98E7F9095610d7762C30165854f271525B97',
        // 舊 DungeonMaster
        '0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703'
    ];
    
    return oldAddresses.some(old => old.toLowerCase() === address.toLowerCase());
}

// 生成更改預覽
function generateChangePreview(content) {
    const changes = [];
    
    // 檢查每個已知的舊地址
    const oldToNew = {
        '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d': V25_MASTER_CONFIG.contracts.HERO,
        '0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0': V25_MASTER_CONFIG.contracts.HERO,
        '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316': V25_MASTER_CONFIG.contracts.RELIC,
        '0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366': V25_MASTER_CONFIG.contracts.RELIC,
        '0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5': V25_MASTER_CONFIG.contracts.PARTY,
        '0x88EF98E7F9095610d7762C30165854f271525B97': V25_MASTER_CONFIG.contracts.DUNGEONSTORAGE,
        '0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703': V25_MASTER_CONFIG.contracts.DUNGEONMASTER
    };
    
    for (const [oldAddr, newAddr] of Object.entries(oldToNew)) {
        const regex = new RegExp(oldAddr, 'gi');
        if (regex.test(content)) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.toLowerCase().includes(oldAddr.toLowerCase())) {
                    changes.push({
                        lineNumber: index + 1,
                        oldLine: line,
                        newLine: line.replace(regex, newAddr),
                        oldAddress: oldAddr,
                        newAddress: newAddr
                    });
                }
            });
        }
    }
    
    return changes;
}

// 應用更改
function applyChanges(filePath, changes) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // 按照舊地址到新地址的映射進行替換
    for (const change of changes) {
        const regex = new RegExp(change.oldAddress, 'gi');
        newContent = newContent.replace(regex, change.newAddress);
    }
    
    fs.writeFileSync(filePath, newContent);
    return true;
}

// 驗證文件
function verifyFile(filePath) {
    if (!fs.existsSync(filePath)) return { success: false, message: '文件不存在' };
    
    const content = fs.readFileSync(filePath, 'utf8');
    const detected = detectAddresses(content);
    
    if (detected.incorrect.length > 0) {
        return {
            success: false,
            message: `還有 ${detected.incorrect.length} 個錯誤地址`,
            incorrect: detected.incorrect
        };
    }
    
    return {
        success: true,
        message: '所有地址都正確',
        correct: detected.correct.length
    };
}

// 詢問用戶確認
function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// 處理單個文件
async function processFile(filePath, fileName) {
    log(`\n📄 處理 ${fileName}`, 'cyan');
    log('-------------------------------------', 'dim');
    
    if (!fs.existsSync(filePath)) {
        log('  ⚠️  文件不存在，跳過', 'yellow');
        return { skipped: true };
    }
    
    // 1. 檢測當前狀態
    const content = fs.readFileSync(filePath, 'utf8');
    const detected = detectAddresses(content);
    
    log('\n  📊 當前狀態:', 'blue');
    log(`     ✅ 正確地址: ${detected.correct.length} 個`, 'green');
    log(`     ❌ 錯誤地址: ${detected.incorrect.length} 個`, 'red');
    log(`     ❓ 未知地址: ${detected.unknown.length} 個`, 'yellow');
    
    if (detected.incorrect.length === 0) {
        log('\n  ✅ 此文件無需修改', 'green');
        return { success: true, modified: false };
    }
    
    // 2. 生成更改預覽
    const changes = generateChangePreview(content);
    
    if (changes.length === 0) {
        log('\n  ℹ️  沒有找到需要更改的內容', 'blue');
        return { success: true, modified: false };
    }
    
    log('\n  📝 將進行以下更改:', 'yellow');
    for (const change of changes.slice(0, 3)) {  // 只顯示前3個
        log(`     行 ${change.lineNumber}:`, 'dim');
        log(`       - ${change.oldAddress}`, 'red');
        log(`       + ${change.newAddress}`, 'green');
    }
    if (changes.length > 3) {
        log(`     ... 還有 ${changes.length - 3} 處更改`, 'dim');
    }
    
    // 3. 詢問確認
    const confirm = await askConfirmation('\n  是否應用這些更改？(y/n): ');
    
    if (!confirm) {
        log('  ⏭️  跳過此文件', 'yellow');
        return { success: true, modified: false };
    }
    
    // 4. 創建備份
    const backupPath = createBackup(filePath);
    if (backupPath) {
        log(`  💾 已備份到: ${path.basename(backupPath)}`, 'dim');
    }
    
    // 5. 應用更改
    try {
        applyChanges(filePath, changes);
        log('  ✅ 更改已應用', 'green');
    } catch (error) {
        log(`  ❌ 應用更改失敗: ${error.message}`, 'red');
        if (backupPath) {
            log(`  💡 可以從備份恢復: ${backupPath}`, 'yellow');
        }
        return { success: false, error: error.message };
    }
    
    // 6. 驗證結果
    const verification = verifyFile(filePath);
    if (verification.success) {
        log(`  ✅ 驗證通過: ${verification.message}`, 'green');
        return { success: true, modified: true };
    } else {
        log(`  ⚠️  驗證失敗: ${verification.message}`, 'red');
        if (verification.incorrect) {
            log(`     錯誤地址: ${verification.incorrect.join(', ')}`, 'red');
        }
        return { success: false, verification: verification };
    }
}

// 主函數
async function main() {
    log('🛡️  安全同步工具 V25', 'bright');
    log('=====================================', 'cyan');
    log('此工具會:', 'dim');
    log('  1. 顯示將要修改的內容', 'dim');
    log('  2. 請求您的確認', 'dim');
    log('  3. 自動備份原文件', 'dim');
    log('  4. 驗證修改結果', 'dim');
    log('=====================================\n', 'cyan');
    
    // 目標文件列表
    const targets = [
        {
            path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local',
            name: '前端 .env.local'
        },
        {
            path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
            name: '前端 contracts.ts'
        },
        {
            path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
            name: '後端 contracts.json'
        },
        {
            path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env',
            name: '後端 .env'
        }
    ];
    
    const results = {
        processed: 0,
        modified: 0,
        skipped: 0,
        failed: 0
    };
    
    // 處理每個文件
    for (const target of targets) {
        const result = await processFile(target.path, target.name);
        
        results.processed++;
        if (result.skipped) {
            results.skipped++;
        } else if (result.modified) {
            results.modified++;
        } else if (!result.success) {
            results.failed++;
        }
    }
    
    // 最終總結
    log('\n=====================================', 'cyan');
    log('📊 同步總結', 'cyan');
    log('=====================================', 'cyan');
    
    log(`\n處理文件: ${results.processed} 個`, 'blue');
    log(`✅ 修改成功: ${results.modified} 個`, 'green');
    log(`⏭️  跳過: ${results.skipped} 個`, 'yellow');
    log(`❌ 失敗: ${results.failed} 個`, 'red');
    
    if (results.failed === 0) {
        log('\n🎉 同步完成！', 'green');
        
        // 自動運行驗證
        log('\n正在運行最終驗證...', 'cyan');
        require('./verify-v25-config.js');
    } else {
        log('\n⚠️  部分文件同步失敗，請檢查錯誤信息', 'red');
    }
    
    log('\n💡 提示:', 'yellow');
    log('  - 備份保存在 backups/ 目錄', 'dim');
    log('  - 運行 node scripts/verify-v25-config.js 進行驗證', 'dim');
    log('  - 如需恢復，使用備份文件', 'dim');
}

// 執行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { V25_MASTER_CONFIG, verifyFile };
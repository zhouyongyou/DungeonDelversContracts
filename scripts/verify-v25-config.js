#!/usr/bin/env node

/**
 * V25 配置驗證工具
 * 檢查所有配置是否正確，不做修改
 */

const fs = require('fs');
const path = require('path');

// V25 官方正確地址
const V25_CORRECT = {
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
    VRF_MANAGER: '0x980d224ec4d198d94f34a8af76a19c00dabe2436'
};

// 需要檢查的文件
const FILES_TO_CHECK = [
    {
        name: '前端 .env.local',
        path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env.local',
        type: 'env'
    },
    {
        name: '前端 contracts.ts',
        path: '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts',
        type: 'typescript'
    },
    {
        name: '後端 contracts.json',
        path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
        type: 'json'
    },
    {
        name: '後端 .env',
        path: '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env',
        type: 'env'
    }
];

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 檢查單個文件
function checkFile(fileInfo) {
    if (!fs.existsSync(fileInfo.path)) {
        log(`  ❌ 文件不存在`, 'red');
        return { exists: false };
    }
    
    const content = fs.readFileSync(fileInfo.path, 'utf8');
    const results = {};
    const issues = [];
    
    // 檢查每個合約地址
    for (const [contract, correctAddress] of Object.entries(V25_CORRECT)) {
        let found = false;
        let foundAddress = null;
        
        // 根據文件類型使用不同的搜索模式
        if (fileInfo.type === 'env') {
            // 環境變數格式
            const patterns = [
                new RegExp(`REACT_APP_${contract}(?:_CONTRACT|_ADDRESS)?=([0-9a-fA-Fx]+)`, 'i'),
                new RegExp(`${contract}_ADDRESS=([0-9a-fA-Fx]+)`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match) {
                    found = true;
                    foundAddress = match[1];
                    break;
                }
            }
        } else if (fileInfo.type === 'json') {
            // JSON 格式
            try {
                const json = JSON.parse(content);
                if (json.contracts) {
                    // 嘗試不同的 key 格式
                    foundAddress = json.contracts[contract] || 
                                  json.contracts[contract.toLowerCase()] ||
                                  json.contracts[contract.charAt(0).toUpperCase() + contract.slice(1).toLowerCase()];
                    found = !!foundAddress;
                }
            } catch (e) {
                // JSON 解析失敗
            }
        } else if (fileInfo.type === 'typescript' || fileInfo.type === 'javascript') {
            // TypeScript/JavaScript 格式
            const patterns = [
                new RegExp(`${contract}[:\\s]*['"\`]([0-9a-fA-Fx]+)['"\`]`, 'i'),
                new RegExp(`['"]${contract}['"][:\\s]*['"\`]([0-9a-fA-Fx]+)['"\`]`, 'i')
            ];
            
            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match) {
                    found = true;
                    foundAddress = match[1];
                    break;
                }
            }
        }
        
        // 記錄結果
        if (found) {
            const isCorrect = foundAddress && 
                             foundAddress.toLowerCase() === correctAddress.toLowerCase();
            results[contract] = {
                found: true,
                address: foundAddress,
                correct: isCorrect
            };
            
            if (!isCorrect) {
                issues.push({
                    contract,
                    current: foundAddress,
                    correct: correctAddress
                });
            }
        } else {
            results[contract] = {
                found: false
            };
        }
    }
    
    return { exists: true, results, issues };
}

// 生成手動修改指南
function generateManualGuide(allResults) {
    log('\n📝 手動修改指南', 'cyan');
    log('=====================================', 'cyan');
    
    for (const [fileName, fileResult] of Object.entries(allResults)) {
        if (fileResult.issues && fileResult.issues.length > 0) {
            log(`\n📄 ${fileName}:`, 'yellow');
            
            for (const issue of fileResult.issues) {
                log(`\n  ${issue.contract}:`, 'red');
                log(`    當前: ${issue.current}`, 'dim');
                log(`    改為: ${issue.correct}`, 'green');
            }
        }
    }
    
    log('\n💡 複製用配置:', 'cyan');
    log('\n// TypeScript/JavaScript 格式:', 'dim');
    console.log(JSON.stringify(V25_CORRECT, null, 2));
    
    log('\n# 環境變數格式:', 'dim');
    for (const [key, value] of Object.entries(V25_CORRECT)) {
        console.log(`REACT_APP_${key}_CONTRACT=${value}`);
    }
}

// 主函數
function main() {
    log('🔍 V25 配置驗證工具', 'bright');
    log('=====================================\n', 'cyan');
    
    const allResults = {};
    let totalIssues = 0;
    
    // 檢查每個文件
    for (const fileInfo of FILES_TO_CHECK) {
        log(`\n📁 檢查 ${fileInfo.name}...`, 'blue');
        
        const result = checkFile(fileInfo);
        allResults[fileInfo.name] = result;
        
        if (!result.exists) {
            continue;
        }
        
        // 顯示結果
        let correctCount = 0;
        let incorrectCount = 0;
        let notFoundCount = 0;
        
        for (const [contract, status] of Object.entries(result.results)) {
            if (!status.found) {
                notFoundCount++;
            } else if (status.correct) {
                correctCount++;
            } else {
                incorrectCount++;
                totalIssues++;
            }
        }
        
        if (incorrectCount === 0 && notFoundCount === 0) {
            log(`  ✅ 所有地址正確！`, 'green');
        } else {
            if (correctCount > 0) {
                log(`  ✅ ${correctCount} 個地址正確`, 'green');
            }
            if (incorrectCount > 0) {
                log(`  ❌ ${incorrectCount} 個地址錯誤`, 'red');
                for (const issue of result.issues) {
                    log(`     - ${issue.contract}: ${issue.current} → ${issue.correct}`, 'yellow');
                }
            }
            if (notFoundCount > 0) {
                log(`  ⚠️  ${notFoundCount} 個地址未找到`, 'yellow');
            }
        }
    }
    
    // 總結
    log('\n=====================================', 'cyan');
    log('📊 驗證總結', 'cyan');
    log('=====================================', 'cyan');
    
    if (totalIssues === 0) {
        log('\n✅ 太棒了！所有配置都是正確的 V25 地址！', 'green');
    } else {
        log(`\n⚠️  發現 ${totalIssues} 個地址需要修正`, 'yellow');
        
        // 生成手動修改指南
        generateManualGuide(allResults);
    }
    
    log('\n=====================================', 'cyan');
    
    // 顯示正確的配置供複製
    log('\n📋 V25 正確配置（供複製）:', 'cyan');
    log('=====================================', 'cyan');
    
    console.log('\n主要合約:');
    console.log(`HERO: ${V25_CORRECT.HERO}`);
    console.log(`RELIC: ${V25_CORRECT.RELIC}`);
    console.log(`PARTY: ${V25_CORRECT.PARTY}`);
    console.log(`DUNGEONMASTER: ${V25_CORRECT.DUNGEONMASTER}`);
    console.log(`DUNGEONSTORAGE: ${V25_CORRECT.DUNGEONSTORAGE}`);
    console.log(`ALTAROFASCENSION: ${V25_CORRECT.ALTAROFASCENSION}`);
}

// 執行
main();
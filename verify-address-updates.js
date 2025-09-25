// verify-address-updates.js - 驗證地址更新是否完整和正確
const fs = require('fs');
const path = require('path');

// === 📋 期望的最新地址 ===
const EXPECTED_ADDRESSES = {
    DUNGEONCORE: '0x6c900a1cf182aa5960493bf4646c9efc8eaed16b',
    DUNGEONMASTER: '0xa573ccf8332a5b1e830ea04a87856a28c99d9b53',
    DUNGEONSTORAGE: '0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791',
    ALTAROFASCENSION: '0x3dfd80271eb96c3be8d1e841643746954ffda11d', // 最新地址
    VRF_MANAGER_V2PLUS: '0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c',
    HERO: '0xc09b6613c32a505bf05f97ed2f567b4959914396',
    RELIC: '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6',
    PARTY: '0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129',
    PLAYERPROFILE: '0xea827e472937abd1117f0d4104a76e173724a061',
    VIPSTAKING: '0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d',
    PLAYERVAULT: '0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0'
};

// === 🚫 應該已經被替換的舊地址 ===
const OLD_ADDRESSES_TO_CHECK = [
    '0x1357c546ce8cd529a1914e53f98405e1ebfbfc53', // 舊 AltarOfAscension
    '0x6d4393ad1507012039a6f1364f70b8de3afcb3bd', // 舊 Hero
    '0x3bcb4af9d94b343b1f154a253a6047b707ba74bd'  // 舊 Relic
];

// === 📋 需要檢查的起始區塊號碼 ===
const EXPECTED_START_BLOCK = '62385903';
const OLD_START_BLOCKS = ['61800862'];

// === 🎯 關鍵檔案檢查 ===
const CRITICAL_FILES_TO_CHECK = [
    '/Users/sotadic/Documents/DungeonDelversContracts/CONTRACT_DEPLOYMENT_CONFIGURATION.md',
    '/Users/sotadic/Documents/DungeonDelversContracts/scripts/essential/batch-address-updater.js',
    '/Users/sotadic/Documents/DungeonDelversContracts/scripts/essential/complete-config-manager.js',
    '/Users/sotadic/Documents/DungeonDelversContracts/script/SetupCoreConnections.s.sol',
    '/Users/sotadic/Documents/DungeonDelversContracts/script/VerifyConnections.s.sol'
];

// === 工具函數 ===
function checkFileForOldAddresses(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { exists: false };
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];

        // 檢查舊地址
        OLD_ADDRESSES_TO_CHECK.forEach(oldAddress => {
            if (content.toLowerCase().includes(oldAddress.toLowerCase())) {
                issues.push({
                    type: 'old_address',
                    value: oldAddress,
                    message: `發現舊地址: ${oldAddress}`
                });
            }
        });

        // 檢查舊起始區塊
        OLD_START_BLOCKS.forEach(oldBlock => {
            if (content.includes(oldBlock)) {
                issues.push({
                    type: 'old_block',
                    value: oldBlock,
                    message: `發現舊起始區塊: ${oldBlock}`
                });
            }
        });

        // 檢查是否有期望的新地址
        const foundAddresses = {};
        Object.entries(EXPECTED_ADDRESSES).forEach(([name, address]) => {
            if (content.toLowerCase().includes(address.toLowerCase())) {
                foundAddresses[name] = address;
            }
        });

        return {
            exists: true,
            issues,
            foundAddresses,
            hasIssues: issues.length > 0
        };

    } catch (error) {
        return {
            exists: true,
            error: error.message
        };
    }
}

function findAllProjectFiles() {
    const files = [];
    const projectRoot = '/Users/sotadic/Documents/DungeonDelversContracts';

    function scanDirectory(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // 跳過這些目錄
                    if (!['node_modules', '.git', 'cache', 'out', 'archive'].includes(entry.name)) {
                        scanDirectory(fullPath);
                    }
                } else {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.js', '.ts', '.sol', '.md', '.json'].includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ 無法掃描目錄: ${dir}`);
        }
    }

    scanDirectory(projectRoot);
    return files;
}

function main() {
    console.log('🔍 DungeonDelvers 地址更新驗證工具');
    console.log('=' .repeat(60));

    const results = {
        totalFiles: 0,
        filesWithIssues: 0,
        totalIssues: 0,
        criticalFileStatus: {},
        allIssues: []
    };

    // === 1. 檢查關鍵檔案 ===
    console.log('🎯 檢查關鍵檔案狀態:');
    console.log('-'.repeat(40));

    CRITICAL_FILES_TO_CHECK.forEach(filePath => {
        const relativePath = path.relative('/Users/sotadic/Documents/DungeonDelversContracts', filePath);
        const result = checkFileForOldAddresses(filePath);

        console.log(`\n📁 ${relativePath}`);

        if (!result.exists) {
            console.log('  ❌ 檔案不存在');
            results.criticalFileStatus[relativePath] = 'missing';
        } else if (result.error) {
            console.log(`  ❌ 讀取錯誤: ${result.error}`);
            results.criticalFileStatus[relativePath] = 'error';
        } else if (result.hasIssues) {
            console.log('  ⚠️ 發現問題:');
            result.issues.forEach(issue => {
                console.log(`    - ${issue.message}`);
            });
            results.criticalFileStatus[relativePath] = 'has_issues';
            results.filesWithIssues++;
            results.totalIssues += result.issues.length;
            results.allIssues.push(...result.issues.map(issue => ({ file: relativePath, ...issue })));
        } else {
            console.log('  ✅ 檢查通過');
            results.criticalFileStatus[relativePath] = 'ok';

            // 顯示找到的新地址
            const addressCount = Object.keys(result.foundAddresses).length;
            if (addressCount > 0) {
                console.log(`  📍 找到 ${addressCount} 個新地址`);
            }
        }
    });

    // === 2. 掃描所有檔案尋找遺漏的舊地址 ===
    console.log('\n\n🔍 掃描所有檔案尋找遺漏的舊地址:');
    console.log('-'.repeat(40));

    const allFiles = findAllProjectFiles();
    results.totalFiles = allFiles.length;

    console.log(`📊 掃描 ${allFiles.length} 個檔案...`);

    let filesWithOldAddresses = [];

    allFiles.forEach(filePath => {
        const result = checkFileForOldAddresses(filePath);
        if (result.exists && !result.error && result.hasIssues) {
            const relativePath = path.relative('/Users/sotadic/Documents/DungeonDelversContracts', filePath);
            filesWithOldAddresses.push({
                path: relativePath,
                issues: result.issues
            });
        }
    });

    if (filesWithOldAddresses.length > 0) {
        console.log(`\n⚠️ 發現 ${filesWithOldAddresses.length} 個檔案仍包含舊地址:`);
        filesWithOldAddresses.forEach(file => {
            console.log(`\n📁 ${file.path}`);
            file.issues.forEach(issue => {
                console.log(`  - ${issue.message}`);
            });
        });
    } else {
        console.log('✅ 所有檔案都已更新完成！');
    }

    // === 3. 生成摘要報告 ===
    console.log('\n' + '='.repeat(60));
    console.log('📊 驗證結果摘要');
    console.log('='.repeat(60));

    console.log(`📁 檢查檔案總數: ${results.totalFiles}`);
    console.log(`🎯 關鍵檔案狀態:`);

    Object.entries(results.criticalFileStatus).forEach(([file, status]) => {
        const statusEmoji = {
            'ok': '✅',
            'has_issues': '⚠️',
            'missing': '❌',
            'error': '💥'
        };
        console.log(`  ${statusEmoji[status] || '❓'} ${file}`);
    });

    const problemFiles = filesWithOldAddresses.length;
    if (problemFiles > 0) {
        console.log(`\n⚠️ 仍有問題的檔案: ${problemFiles}`);
        console.log('🔧 建議執行: node fix-missing-addresses.js');
    } else {
        console.log('\n🎉 所有地址更新已完成！');
    }

    // === 4. 提供後續步驟建議 ===
    console.log('\n📋 後續步驟檢查清單:');
    console.log('□ 驗證合約連接配置是否正確');
    console.log('□ 檢查子圖配置是否需要更新');
    console.log('□ 檢查前端環境變數');
    console.log('□ 檢查後端 contracts.json');
    console.log('□ 執行整合測試');
    console.log('□ 清理備份檔案');

    return results;
}

// 執行驗證
if (require.main === module) {
    try {
        const results = main();
        process.exit(results.filesWithIssues > 0 ? 1 : 0);
    } catch (error) {
        console.error('💥 驗證過程發生嚴重錯誤:', error);
        process.exit(1);
    }
}

module.exports = { main, checkFileForOldAddresses, EXPECTED_ADDRESSES };
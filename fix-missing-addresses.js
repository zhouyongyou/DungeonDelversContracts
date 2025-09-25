// fix-missing-addresses.js - 修復遺漏的舊版本地址配置
const fs = require('fs');
const path = require('path');

// === 🎯 需要更新的地址映射 ===
const MISSING_ADDRESS_UPDATES = {
    // AltarOfAscension: 舊地址 → 新地址
    '0x3dfd80271eb96c3be8d1e841643746954ffda11d': '0x3dfd80271eb96c3be8d1e841643746954ffda11d',

    // Hero: 舊地址 → 新地址 (已更新過的檔案可能仍有遺漏)
    '0xc09b6613c32a505bf05f97ed2f567b4959914396': '0xc09b6613c32a505bf05f97ed2f567b4959914396',

    // Relic: 舊地址 → 新地址 (已更新過的檔案可能仍有遺漏)
    '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6': '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6'
};

// === 🎯 區塊號碼更新 ===
const BLOCK_NUMBER_UPDATES = {
    '62385903': '62385903'
};

// === 📁 需要檢查的所有檔案類型 ===
const FILE_EXTENSIONS = ['.js', '.ts', '.sol', '.json', '.md', '.yml', '.yaml', '.env'];

// === 🚫 排除的目錄 ===
const EXCLUDED_DIRS = ['node_modules', '.git', 'broadcast', 'cache', 'out', 'archive'];

// === 工具函數 ===
function shouldProcessFile(filePath) {
    // 檢查副檔名
    const ext = path.extname(filePath).toLowerCase();
    if (!FILE_EXTENSIONS.includes(ext)) return false;

    // 檢查是否在排除目錄中
    const pathParts = filePath.split(path.sep);
    for (const excludedDir of EXCLUDED_DIRS) {
        if (pathParts.includes(excludedDir)) return false;
    }

    return true;
}

function findAllFiles(dir) {
    const files = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!EXCLUDED_DIRS.includes(entry.name)) {
                    files.push(...findAllFiles(fullPath));
                }
            } else if (shouldProcessFile(fullPath)) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`⚠️ 無法讀取目錄: ${dir} - ${error.message}`);
    }

    return files;
}

function updateFileContent(filePath, replacements) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        let totalChanges = 0;
        const changes = [];

        // 執行所有替換
        Object.entries(replacements).forEach(([oldValue, newValue]) => {
            const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = content.match(regex);

            if (matches && matches.length > 0) {
                newContent = newContent.replace(regex, newValue);
                totalChanges += matches.length;
                changes.push({
                    from: oldValue,
                    to: newValue,
                    count: matches.length
                });
            }
        });

        return {
            hasChanges: totalChanges > 0,
            newContent,
            changes,
            totalChanges
        };

    } catch (error) {
        console.error(`❌ 讀取檔案失敗: ${filePath} - ${error.message}`);
        return { hasChanges: false, error: error.message };
    }
}

function createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup-${timestamp}`;

    try {
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
    } catch (error) {
        console.error(`❌ 創建備份失敗: ${filePath} - ${error.message}`);
        return null;
    }
}

function main() {
    console.log('🔍 DungeonDelvers 地址修復工具');
    console.log('=' .repeat(60));

    // 合併所有需要替換的內容
    const allReplacements = { ...MISSING_ADDRESS_UPDATES, ...BLOCK_NUMBER_UPDATES };

    console.log('📋 將執行的替換:');
    Object.entries(allReplacements).forEach(([old, new_]) => {
        console.log(`  ${old} → ${new_}`);
    });

    // 找到所有需要檢查的檔案
    console.log('\n🔍 掃描專案檔案...');
    const projectRoot = '/Users/sotadic/Documents/DungeonDelversContracts';
    const allFiles = findAllFiles(projectRoot);

    console.log(`📁 找到 ${allFiles.length} 個檔案需要檢查`);

    // 統計結果
    const results = {
        totalFiles: allFiles.length,
        updatedFiles: 0,
        totalChanges: 0,
        errors: 0,
        backups: []
    };

    console.log('\n🔄 開始處理檔案...\n');

    // 處理每個檔案
    allFiles.forEach((filePath, index) => {
        const relativePath = path.relative(projectRoot, filePath);

        // 顯示進度
        if (index % 50 === 0 || index === allFiles.length - 1) {
            console.log(`📊 處理進度: ${index + 1}/${allFiles.length} (${Math.round((index + 1) / allFiles.length * 100)}%)`);
        }

        const result = updateFileContent(filePath, allReplacements);

        if (result.error) {
            results.errors++;
            return;
        }

        if (result.hasChanges) {
            console.log(`\n✨ ${relativePath}`);

            // 創建備份
            const backupPath = createBackup(filePath);
            if (backupPath) {
                results.backups.push(path.relative(projectRoot, backupPath));
            }

            // 顯示變更詳情
            result.changes.forEach(change => {
                console.log(`  📝 ${change.from.slice(0, 20)}... → ${change.to.slice(0, 20)}... (${change.count}x)`);
            });

            try {
                // 寫入更新後的內容
                fs.writeFileSync(filePath, result.newContent, 'utf8');
                results.updatedFiles++;
                results.totalChanges += result.totalChanges;
                console.log(`  ✅ 已更新 ${result.totalChanges} 處`);
            } catch (error) {
                console.error(`  ❌ 寫入失敗: ${error.message}`);
                results.errors++;
            }
        }
    });

    // 顯示最終結果
    console.log('\n' + '='.repeat(60));
    console.log('📊 修復完成摘要');
    console.log('='.repeat(60));
    console.log(`📁 檢查檔案: ${results.totalFiles}`);
    console.log(`✅ 更新檔案: ${results.updatedFiles}`);
    console.log(`🔢 總變更數: ${results.totalChanges}`);
    console.log(`❌ 錯誤數量: ${results.errors}`);
    console.log(`📋 備份檔案: ${results.backups.length}`);

    if (results.backups.length > 0) {
        console.log('\n📂 備份檔案清單:');
        results.backups.forEach(backup => {
            console.log(`  📄 ${backup}`);
        });
    }

    if (results.updatedFiles > 0) {
        console.log('\n🚀 後續步驟建議:');
        console.log('1. 檢查更新的檔案是否正確');
        console.log('2. 執行測試確保功能正常');
        console.log('3. 提交變更到版本控制');
        console.log('4. 清理備份檔案');

        console.log('\n🧹 清理備份檔案指令:');
        console.log('find . -name "*.backup-*" -delete');
    }

    // 特別注意事項
    console.log('\n⚠️ 特別注意:');
    console.log('1. AltarOfAscension 地址已從 0x1357...53 更新為 0x3dfd...1d');
    console.log('2. 起始區塊已從 62385903 更新為 62385903');
    console.log('3. 請確認相關服務需要重新部署');

    return results;
}

// 執行修復
if (require.main === module) {
    try {
        const results = main();
        process.exit(results.errors > 0 ? 1 : 0);
    } catch (error) {
        console.error('💥 修復過程發生嚴重錯誤:', error);
        process.exit(1);
    }
}

module.exports = { main, MISSING_ADDRESS_UPDATES, BLOCK_NUMBER_UPDATES };
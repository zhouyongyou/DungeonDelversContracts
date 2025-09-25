// final-cleanup-report.js - 生成最終的地址更新完成報告
const fs = require('fs');
const path = require('path');

// === 📋 更新摘要 ===
const UPDATE_SUMMARY = {
    addresses: {
        altarOfAscension: {
            old: '0x1357c546ce8cd529a1914e53f98405e1ebfbfc53',
            new: '0x3dfd80271eb96c3be8d1e841643746954ffda11d',
            description: 'AltarOfAscension NFT升級系統'
        },
        hero: {
            old: '0x6d4393ad1507012039a6f1364f70b8de3afcb3bd',
            new: '0xc09b6613c32a505bf05f97ed2f567b4959914396',
            description: 'Hero NFT合約'
        },
        relic: {
            old: '0x3bcb4af9d94b343b1f154a253a6047b707ba74bd',
            new: '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6',
            description: 'Relic NFT合約'
        }
    },
    blockNumbers: {
        startBlock: {
            old: '61800862',
            new: '62385903',
            description: '子圖起始區塊號碼'
        }
    }
};

// === 📁 已更新的檔案清單 ===
const UPDATED_FILES = [
    'CONTRACT_DEPLOYMENT_CONFIGURATION.md',
    'scripts/essential/batch-address-updater.js',
    'scripts/essential/check-address-sync.js',
    'scripts/essential/complete-config-manager.js',
    'scripts/essential/verify-complete-config.js',
    'scripts/fix-altar-connections.js',
    'scripts/setup-core-connections.js',
    'script/SetupCoreConnections.s.sol',
    'script/SetupCoreConnectionsSimple.s.sol',
    'script/VerifyConnections.s.sol',
    'update-env-with-new-contracts.js',
    'deployment-results/direct-deploy-1758349327403.json'
];

// === 🚫 保留舊地址的檔案 (正常情況) ===
const FILES_WITH_OLD_ADDRESSES_OK = [
    'broadcast/SetupCoreConnectionsSimple.s.sol/56/run-latest.json',
    'broadcast/SetupCoreConnectionsSimple.s.sol/56/run-1758355436.json'
];

// === 工具函數 ===
function generateReport() {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalAddressUpdates: Object.keys(UPDATE_SUMMARY.addresses).length,
            totalBlockUpdates: Object.keys(UPDATE_SUMMARY.blockNumbers).length,
            totalFilesUpdated: UPDATED_FILES.length
        },
        details: UPDATE_SUMMARY,
        updatedFiles: UPDATED_FILES,
        notesOnRemainingOldAddresses: FILES_WITH_OLD_ADDRESSES_OK,
        nextSteps: [
            '檢查子圖配置是否需要重新部署',
            '檢查前端環境變數配置',
            '檢查後端 contracts.json 配置',
            '執行整合測試確保所有系統正常',
            '清理備份檔案'
        ]
    };

    return report;
}

function checkBackupFiles() {
    const backupFiles = [];

    function findBackups(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
                    findBackups(fullPath);
                } else if (entry.name.includes('.backup-')) {
                    backupFiles.push(path.relative('/Users/sotadic/Documents/DungeonDelversContracts', fullPath));
                }
            }
        } catch (error) {
            console.warn(`⚠️ 無法掃描目錄: ${dir}`);
        }
    }

    findBackups('/Users/sotadic/Documents/DungeonDelversContracts');
    return backupFiles;
}

function main() {
    console.log('📋 DungeonDelvers 地址更新完成報告');
    console.log('=' .repeat(60));

    const report = generateReport();

    // === 1. 顯示更新摘要 ===
    console.log('✅ 更新完成摘要:');
    console.log(`📍 地址更新: ${report.summary.totalAddressUpdates} 個`);
    console.log(`📊 區塊號更新: ${report.summary.totalBlockUpdates} 個`);
    console.log(`📁 檔案更新: ${report.summary.totalFilesUpdated} 個`);

    console.log('\n📝 地址更新詳情:');
    Object.entries(UPDATE_SUMMARY.addresses).forEach(([key, info]) => {
        console.log(`\n🔄 ${info.description}:`);
        console.log(`  舊地址: ${info.old}`);
        console.log(`  新地址: ${info.new}`);
    });

    console.log('\n📊 區塊號更新詳情:');
    Object.entries(UPDATE_SUMMARY.blockNumbers).forEach(([key, info]) => {
        console.log(`\n🔄 ${info.description}:`);
        console.log(`  舊區塊: ${info.old}`);
        console.log(`  新區塊: ${info.new}`);
    });

    // === 2. 檢查備份檔案 ===
    console.log('\n📂 備份檔案狀態:');
    const backups = checkBackupFiles();

    if (backups.length > 0) {
        console.log(`📋 找到 ${backups.length} 個備份檔案:`);
        backups.forEach(backup => {
            console.log(`  📄 ${backup}`);
        });

        console.log('\n🧹 清理備份檔案指令:');
        console.log('find . -name "*.backup-*" -delete');
    } else {
        console.log('✅ 沒有找到備份檔案');
    }

    // === 3. 剩餘舊地址說明 ===
    console.log('\n📝 關於剩餘舊地址的說明:');
    console.log('以下檔案包含舊地址屬於正常情況:');
    FILES_WITH_OLD_ADDRESSES_OK.forEach(file => {
        console.log(`  📄 ${file} (部署歷史記錄)`);
    });

    // === 4. 後續步驟 ===
    console.log('\n🚀 後續步驟檢查清單:');
    report.nextSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });

    // === 5. 關鍵配置驗證 ===
    console.log('\n⚠️ 重要提醒:');
    console.log('請確保以下系統使用新地址:');
    console.log('🔸 前端 (SoulboundSaga): 環境變數更新');
    console.log('🔸 子圖 (dungeon-delvers-subgraph): subgraph.yaml 配置');
    console.log('🔸 後端 (metadata-server): contracts.json 配置');
    console.log('🔸 白皮書: 智能合約章節更新');

    // === 6. 生成 JSON 報告 ===
    const reportPath = '/Users/sotadic/Documents/DungeonDelversContracts/address-update-report.json';

    try {
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n📄 詳細報告已保存: ${path.relative('/Users/sotadic/Documents/DungeonDelversContracts', reportPath)}`);
    } catch (error) {
        console.error(`❌ 保存報告失敗: ${error.message}`);
    }

    console.log('\n🎉 地址更新任務完成！');

    return report;
}

// 執行報告生成
if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('💥 生成報告時發生錯誤:', error);
        process.exit(1);
    }
}

module.exports = { main, UPDATE_SUMMARY, UPDATED_FILES };
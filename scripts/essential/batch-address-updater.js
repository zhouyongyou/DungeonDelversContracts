// batch-address-updater.js - 自動更新各項目中的合約地址
const fs = require('fs');
const path = require('path');

// 地址映射
const ADDRESS_MAPPING = {
    '0xc09b6613c32a505bf05f97ed2f567b4959914396': '0xc09b6613c32a505bf05f97ed2f567b4959914396', // HERO
    '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6': '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6', // RELIC
    '0xbdc1413268d55d1aa694f610783cac1ea4fed07a': '0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129', // PARTY
    '0x0440634aa6e4028efafefe7683b39e3a7bec0ebc': '0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d', // VIPSTAKING
    '0x6fe7d8a3771bca13b9b9b11cdfd30edba5ed3c2e': '0xea827e472937abd1117f0d4104a76e173724a061', // PLAYERPROFILE
    '0xaf333612398f061fc9f17b4574d66b5ca550ada4': '0x3dfd80271eb96c3be8d1e841643746954ffda11d', // ALTAROFASCENSION
    '0xdfdeb32633232b15fa22dd25407fb2e485a33700': '0xa573ccf8332a5b1e830ea04a87856a28c99d9b53', // DUNGEONMASTER
    '0x67614515b159d80caadd04027687fc10372c2dc5': '0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791', // DUNGEONSTORAGE
    '0xdc4089a4fb178dd826bf7dcd08210afaefc4b6ce': '0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0', // PLAYERVAULT
    '0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40': '0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c'  // VRF_MANAGER_V2PLUS
};

// 版本映射
const VERSION_MAPPING = {
    'v1.3.6': 'v1.4.0.3',
    'v1.3.7': 'v1.4.0.3',
    '60555454': '60663015'
};

// 關鍵文件列表（需要立即更新的）
const CRITICAL_FILES = [
    '/Users/sotadic/Documents/GitHub/SoulboundSaga/src/utils/envLogger.ts',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json',
    '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/utils/envLogger.js',
    '/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/ARCHITECTURE.md',
    '/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph/CLAUDE.md',
    '/Users/sotadic/Documents/GitHub/dungeon-delvers-whitepaper/13-smart-contracts.md'
];

function updateFile(filePath, replacements) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ 文件不存在: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let changes = 0;

        // 執行替換
        Object.entries(replacements).forEach(([oldValue, newValue]) => {
            const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const beforeCount = (content.match(regex) || []).length;
            content = content.replace(regex, newValue);
            const afterCount = (content.match(new RegExp(newValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
            
            if (beforeCount > 0) {
                changes += beforeCount;
                console.log(`  ${oldValue} → ${newValue} (${beforeCount} 次)`);
            }
        });

        if (changes > 0) {
            // 創建備份
            const backupPath = filePath + '.backup';
            fs.copyFileSync(filePath, backupPath);
            
            // 寫入更新內容
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath} - ${changes} 處更新完成`);
            return true;
        } else {
            console.log(`ℹ️ ${filePath} - 無需更新`);
            return false;
        }

    } catch (error) {
        console.error(`❌ 更新失敗 ${filePath}: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('🔄 開始自動更新 v1.4.0.3 地址和版本');
    console.log('='.repeat(60));

    const results = {
        updated: 0,
        skipped: 0,
        errors: 0
    };

    // 合併所有替換規則
    const allReplacements = { ...ADDRESS_MAPPING, ...VERSION_MAPPING };

    console.log('📋 將執行的替換:');
    Object.entries(allReplacements).forEach(([old, new_]) => {
        console.log(`  ${old} → ${new_}`);
    });

    console.log('\\n🎯 更新關鍵文件:');
    
    CRITICAL_FILES.forEach(filePath => {
        console.log(`\\n📁 ${filePath}`);
        const updated = updateFile(filePath, allReplacements);
        
        if (updated) {
            results.updated++;
        } else {
            results.skipped++;
        }
    });

    console.log('\\n' + '='.repeat(60));
    console.log('📊 更新結果摘要');
    console.log('='.repeat(60));
    console.log(`✅ 已更新: ${results.updated} 個文件`);
    console.log(`ℹ️ 跳過: ${results.skipped} 個文件`);
    console.log(`❌ 錯誤: ${results.errors} 個文件`);

    if (results.updated > 0) {
        console.log('\\n🔄 後續步驟:');
        console.log('1. 檢查備份文件 (.backup)');
        console.log('2. 測試更新後的功能');
        console.log('3. 提交更改到 Git');
        console.log('4. 重新部署相關服務');
    }

    console.log('\\n📝 手動檢查建議:');
    console.log('1. 前端環境變數是否正確載入');
    console.log('2. 子圖配置是否需要重新部署');
    console.log('3. 後端服務是否需要重啟');
}

main();
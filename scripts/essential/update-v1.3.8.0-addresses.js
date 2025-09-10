// update-v1.3.8.0-addresses.js - 自動更新各項目中的合約地址
const fs = require('fs');
const path = require('path');

// 地址映射
const ADDRESS_MAPPING = {
    '0x4a5aaf3ec310e56e13c541b2b23ab88ab6b75c90': '0x6d4393ad1507012039a6f1364f70b8de3afcb3bd', // HERO
    '0xa4871c0ebddb67c9c5fcbbda1910af9fc0a7b938': '0x3bcb4af9d94b343b1f154a253a6047b707ba74bd', // RELIC
    '0xbdc1413268d55d1aa694f610783cac1ea4fed07a': '0x0d93b2c10d5ff944b3bb47c75b52fca75c92a4cc', // PARTY
    '0x33664da450b069012b28f90183c76b9c85382ffe': '0x0440634aa6e4028efafefe7683b39e3a7bec0ebc', // VIPSTAKING
    '0x6fe7d8a3771bca13b9b9b11cdfd30edba5ed3c2e': '0xa7aab98223268f8049430bdba6d1ba36cbef424a', // PLAYERPROFILE
    '0xaf333612398f061fc9f17b4574d66b5ca550ada4': '0xda7fb30cb2a2311ca3326ad2a4f826dcdac8bd7b', // ALTAROFASCENSION
    '0xdfdeb32633232b15fa22dd25407fb2e485a33700': '0x35a765d767d3fc2dfd6968e6faa7ffe7a303a77e', // DUNGEONMASTER
    '0x67614515b159d80caadd04027687fc10372c2dc5': '0x063a9de0dac8b68c03c9d77f41fe8b20a2fe7683', // DUNGEONSTORAGE
    '0xdc4089a4fb178dd826bf7dcd08210afaefc4b6ce': '0x72205a7dca3dbd7a8656107797b0b0604e781413', // PLAYERVAULT
    '0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40': '0xfc88901b6bb94d677884edc1dad143c2add2a1c5'  // VRF_MANAGER_V2PLUS
};

// 版本映射
const VERSION_MAPPING = {
    'v4.2.2': 'v1.3.8.0',
    'v1.3.6': 'v1.3.8.0',
    'v1.3.7': 'v1.3.8.0',
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
    console.log('🔄 開始自動更新 v1.3.8.0 地址和版本');
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
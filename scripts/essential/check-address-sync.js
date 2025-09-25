// check-address-sync.js - 檢查所有項目中的合約地址同步狀態
const fs = require('fs');
const path = require('path');

// v1.4.0.3 新地址（統一小寫）
const NEW_ADDRESSES = {
    HERO: '0xc09b6613c32a505bf05f97ed2f567b4959914396',
    RELIC: '0xf4ae79568a34af621bbea06b716e8fb84b5b41b6',
    PARTY: '0x2d32d9b03f4febe9f2e1d1ef2cc5f6a0239f6129',
    VIPSTAKING: '0xeee539746a302ac5c08f4fe4bbc55878d57a1d6d',
    PLAYERPROFILE: '0xea827e472937abd1117f0d4104a76e173724a061',
    ALTAROFASCENSION: '0x3dfd80271eb96c3be8d1e841643746954ffda11d',
    DUNGEONMASTER: '0xa573ccf8332a5b1e830ea04a87856a28c99d9b53',
    DUNGEONSTORAGE: '0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791',
    PLAYERVAULT: '0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0',
    VRF_MANAGER_V2PLUS: '0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c'
};

// v1.3.x 舊地址（需要被替換的）
const OLD_ADDRESSES = {
    HERO: '0x4a5aaf3ec310e56e13c541b2b23ab88ab6b75c90',
    RELIC: '0xa4871c0ebddb67c9c5fcbbda1910af9fc0a7b938',
    PARTY: '0xbdc1413268d55d1aa694f610783cac1ea4fed07a',
    VIPSTAKING: '0x33664da450b069012b28f90183c76b9c85382ffe',
    PLAYERPROFILE: '0x6fe7d8a3771bca13b9b9b11cdfd30edba5ed3c2e',
    ALTAROFASCENSION: '0xaf333612398f061fc9f17b4574d66b5ca550ada4',
    DUNGEONMASTER: '0xdfdeb32633232b15fa22dd25407fb2e485a33700',
    DUNGEONSTORAGE: '0x67614515b159d80caadd04027687fc10372c2dc5',
    PLAYERVAULT: '0xdc4089a4fb178dd826bf7dcd08210afaefc4b6ce',
    VRF_MANAGER_V2PLUS: '0x601f0a1e5a0cacfa39b502fd7a9ac5024f53ae40'
};

// 項目路徑
const PROJECT_PATHS = {
    FRONTEND: '/Users/sotadic/Documents/GitHub/SoulboundSaga',
    SUBGRAPH: '/Users/sotadic/Documents/GitHub/dungeon-delvers-subgraph',
    BACKEND: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
    CONTRACTS: '/Users/sotadic/Documents/DungeonDelversContracts',
    WHITEPAPER: '/Users/sotadic/Documents/GitHub/dungeon-delvers-whitepaper'
};

// 需要檢查的文件類型
const FILE_PATTERNS = ['.env', '.json', '.yaml', '.yml', '.ts', '.tsx', '.js', '.jsx', '.md', '.sol'];

function searchInFile(filePath, searchTexts) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const results = [];
        
        Object.entries(searchTexts).forEach(([name, address]) => {
            const regex = new RegExp(address.toLowerCase(), 'gi');
            const matches = content.toLowerCase().match(regex);
            if (matches) {
                results.push({
                    contractName: name,
                    address: address,
                    matches: matches.length,
                    filePath: filePath
                });
            }
        });
        
        return results;
    } catch (error) {
        return [];
    }
}

function scanDirectory(dirPath, searchTexts, excludeDirs = ['node_modules', '.git', 'build', 'dist', 'artifacts']) {
    const results = [];
    
    try {
        if (!fs.existsSync(dirPath)) {
            console.log(`⚠️ 目錄不存在: ${dirPath}`);
            return results;
        }
        
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                if (!excludeDirs.includes(item) && !item.startsWith('.')) {
                    results.push(...scanDirectory(itemPath, searchTexts, excludeDirs));
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item);
                if (FILE_PATTERNS.includes(ext) || item === '.env') {
                    const fileResults = searchInFile(itemPath, searchTexts);
                    results.push(...fileResults);
                }
            }
        }
    } catch (error) {
        console.log(`⚠️ 掃描目錄失敗: ${dirPath} - ${error.message}`);
    }
    
    return results;
}

async function main() {
    console.log('🔍 DungeonDelvers v1.4.0.3 地址同步檢查');
    console.log('='.repeat(60));
    
    const allResults = {};
    
    // 檢查各個項目中的舊地址殘留
    for (const [projectName, projectPath] of Object.entries(PROJECT_PATHS)) {
        console.log(`\\n📁 檢查 ${projectName}: ${projectPath}`);
        
        const oldAddressResults = scanDirectory(projectPath, OLD_ADDRESSES);
        
        if (oldAddressResults.length > 0) {
            console.log(`❌ 發現 ${oldAddressResults.length} 個舊地址殘留:`);
            allResults[projectName] = { oldAddresses: oldAddressResults, newAddresses: [] };
            
            // 按合約分組顯示
            const grouped = {};
            oldAddressResults.forEach(result => {
                if (!grouped[result.contractName]) {
                    grouped[result.contractName] = [];
                }
                grouped[result.contractName].push(result);
            });
            
            Object.entries(grouped).forEach(([contractName, results]) => {
                console.log(`  📍 ${contractName}:`);
                results.forEach(result => {
                    const relativePath = result.filePath.replace(projectPath, '');
                    console.log(`    ${relativePath} (${result.matches} 次)`);
                });
            });
        } else {
            console.log('✅ 無舊地址殘留');
            allResults[projectName] = { oldAddresses: [], newAddresses: [] };
        }
        
        // 檢查新地址是否已更新
        const newAddressResults = scanDirectory(projectPath, NEW_ADDRESSES);
        allResults[projectName].newAddresses = newAddressResults;
        
        if (newAddressResults.length > 0) {
            console.log(`✅ 新地址已更新: ${newAddressResults.length} 個`);
        }
    }
    
    // 版本檢查
    console.log('\\n' + '='.repeat(60));
    console.log('📊 版本配置檢查');
    console.log('='.repeat(60));
    
    const versionPatterns = {
        'v1.3.6': 'v1.3.6',
        'v1.3.7': 'v1.3.7',
        'v1-4-0-3': 'v1-4-0-3',  // 子圖版本
        '60976874': '60976874', // 舊區塊
    };
    
    for (const [projectName, projectPath] of Object.entries(PROJECT_PATHS)) {
        console.log(`\\n📁 ${projectName} 版本檢查:`);
        const versionResults = scanDirectory(projectPath, versionPatterns);
        
        if (versionResults.length > 0) {
            console.log('⚠️ 發現舊版本配置:');
            versionResults.forEach(result => {
                const relativePath = result.filePath.replace(projectPath, '');
                console.log(`  ${result.contractName}: ${relativePath}`);
            });
        } else {
            console.log('✅ 版本配置正確');
        }
    }
    
    // 總結
    console.log('\\n' + '='.repeat(60));
    console.log('📊 檢查總結');
    console.log('='.repeat(60));
    
    const totalOldAddresses = Object.values(allResults).reduce((sum, project) => sum + project.oldAddresses.length, 0);
    const totalNewAddresses = Object.values(allResults).reduce((sum, project) => sum + project.newAddresses.length, 0);
    
    console.log(`舊地址殘留: ${totalOldAddresses} 個`);
    console.log(`新地址已更新: ${totalNewAddresses} 個`);
    
    if (totalOldAddresses === 0) {
        console.log('\\n🎉 所有項目地址同步完成！');
    } else {
        console.log('\\n⚠️ 需要手動更新舊地址殘留');
        
        console.log('\\n🔧 建議執行的更新:');
        Object.entries(allResults).forEach(([projectName, results]) => {
            if (results.oldAddresses.length > 0) {
                console.log(`\\n${projectName}:`);
                const grouped = {};
                results.oldAddresses.forEach(result => {
                    if (!grouped[result.contractName]) {
                        grouped[result.contractName] = [];
                    }
                    grouped[result.contractName].push(result);
                });
                
                Object.entries(grouped).forEach(([contractName, results]) => {
                    const oldAddr = OLD_ADDRESSES[contractName];
                    const newAddr = NEW_ADDRESSES[contractName];
                    console.log(`  ${contractName}: ${oldAddr} → ${newAddr}`);
                    results.forEach(result => {
                        const relativePath = result.filePath.replace(PROJECT_PATHS[projectName], '');
                        console.log(`    更新文件: ${relativePath}`);
                    });
                });
            }
        });
    }
}

main().catch(console.error);
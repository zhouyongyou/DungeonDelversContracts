const fs = require('fs');
const path = require('path');

console.log("🔄 同步 V25 ABI 文件到子圖\n");

// ABI 文件對照表
const ABI_MAPPINGS = [
    {
        source: 'contracts/current/nft/Hero.sol/Hero.json',
        target: 'Hero.json'
    },
    {
        source: 'contracts/current/nft/Relic.sol/Relic.json',
        target: 'Relic.json'
    },
    {
        source: 'contracts/current/nft/Party.sol/PartyV3.json',
        target: 'PartyV3.json'
    },
    {
        source: 'contracts/current/core/DungeonMaster.sol/DungeonMaster.json',
        target: 'DungeonMaster.json'
    },
    {
        source: 'contracts/current/core/AltarOfAscension.sol/AltarOfAscensionVRF.json',
        target: 'AltarOfAscensionVRF.json'
    },
    {
        source: 'contracts/current/player/PlayerVault.sol/PlayerVault.json',
        target: 'PlayerVault.json'
    },
    {
        source: 'contracts/current/player/PlayerProfile.sol/PlayerProfile.json',
        target: 'PlayerProfile.json'
    },
    {
        source: 'contracts/current/staking/VIPStaking.sol/VIPStaking.json',
        target: 'VIPStaking.json'
    }
];

// 源目錄和目標目錄
const SOURCE_BASE = '/Users/sotadic/Documents/DungeonDelversContracts/artifacts';
const TARGET_BASE = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis';

// 同步 ABI 文件
ABI_MAPPINGS.forEach(mapping => {
    const sourcePath = path.join(SOURCE_BASE, mapping.source);
    const targetPath = path.join(TARGET_BASE, mapping.target);
    
    try {
        if (fs.existsSync(sourcePath)) {
            // 讀取原始 ABI 文件
            const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
            
            // 只提取 ABI 部分
            const abi = sourceContent.abi;
            
            // 備份現有文件（如果存在）
            if (fs.existsSync(targetPath)) {
                const backupPath = targetPath + '.backup-' + Date.now();
                fs.copyFileSync(targetPath, backupPath);
                console.log(`💾 備份: ${mapping.target}`);
            }
            
            // 寫入新的 ABI
            fs.writeFileSync(targetPath, JSON.stringify(abi, null, 2));
            console.log(`✅ 同步: ${mapping.source} -> ${mapping.target}`);
        } else {
            console.log(`⚠️  找不到源文件: ${mapping.source}`);
        }
    } catch (error) {
        console.error(`❌ 同步失敗 ${mapping.target}: ${error.message}`);
    }
});

console.log("\n🏁 ABI 同步完成！");
console.log("\n下一步:");
console.log("1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
console.log("2. graph codegen");
console.log("3. graph build");
console.log("4. graph deploy --studio dungeon-delvers --version-label v3.6.5");
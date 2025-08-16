// extractABI.js - 提取編譯後的 ABI

const fs = require('fs');
const path = require('path');

// 合約對應的檔案路徑
const contractPaths = {
    'DungeonMasterV8': 'contracts/core/DungeonMaster_V8.sol:DungeonMasterV8',
    'PlayerVault': 'contracts/defi/PlayerVault.sol:PlayerVault'
};

// 輸出目錄
const outputDirs = {
    frontend: path.join(__dirname, '../../DungeonDelvers/src/abi'),
    subgraph: path.join(__dirname, '../../DungeonDelvers/DDgraphql/dungeon-delvers/abis'),
    backend: path.join(__dirname, '../../dungeon-delvers-metadata-server/src/abi')
};

function extractABI(contractName) {
    const contractPath = contractPaths[contractName];
    if (!contractPath) {
        console.error(`❌ 未找到合約 ${contractName} 的路徑配置`);
        return;
    }

    // 讀取編譯後的 artifact
    const [contractFile, contractNameOnly] = contractPath.split(':');
    const artifactPath = path.join(__dirname, '../artifacts', contractFile, contractNameOnly + '.json');
    
    if (!fs.existsSync(artifactPath)) {
        console.error(`❌ 未找到編譯後的檔案: ${artifactPath}`);
        console.log('請先執行 npx hardhat compile');
        return;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;

    console.log(`✅ 成功提取 ${contractName} 的 ABI (${abi.length} 個函數/事件)`);

    // 儲存到各個位置
    Object.entries(outputDirs).forEach(([name, dir]) => {
        // 創建目錄（如果不存在）
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const outputPath = path.join(dir, `${contractName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
        console.log(`📁 已儲存到 ${name}: ${outputPath}`);
    });

    // 顯示新增的函數
    const setCooldownPeriod = abi.find(item => item.name === 'setCooldownPeriod');
    if (setCooldownPeriod) {
        console.log('\n🆕 新增的函數:');
        console.log('- setCooldownPeriod(uint256)');
        
        const cooldownPeriodSetEvent = abi.find(item => item.name === 'CooldownPeriodSet');
        if (cooldownPeriodSetEvent) {
            console.log('\n🆕 新增的事件:');
            console.log('- CooldownPeriodSet(uint256)');
        }
    }

    // 顯示變更的變數
    const cooldownPeriod = abi.find(item => item.name === 'cooldownPeriod');
    if (cooldownPeriod) {
        console.log('\n🔄 變更的變數:');
        console.log('- cooldownPeriod: constant -> public (可修改)');
    }
}

// 執行
const contractName = process.argv[2] || 'DungeonMasterV8';
console.log(`\n📋 提取 ${contractName} 的 ABI...\n`);
extractABI(contractName);
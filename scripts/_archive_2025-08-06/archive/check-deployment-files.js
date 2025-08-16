const fs = require('fs');
const path = require('path');

async function main() {
    console.log("=== 檢查部署文件 ===\n");
    
    // 檢查部署文件
    const deploymentDir = path.join(__dirname, '..', 'deployments', 'localhost');
    
    console.log("1. 檢查部署目錄:");
    console.log("路徑:", deploymentDir);
    
    if (fs.existsSync(deploymentDir)) {
        console.log("✓ 部署目錄存在\n");
        
        // 列出所有部署文件
        const files = fs.readdirSync(deploymentDir);
        console.log("部署文件列表:");
        files.forEach(file => {
            console.log(`- ${file}`);
        });
        
        // 檢查 DungeonCore.json
        console.log("\n2. 檢查 DungeonCore 部署信息:");
        const dungeonCorePath = path.join(deploymentDir, 'DungeonCore.json');
        if (fs.existsSync(dungeonCorePath)) {
            const dungeonCoreData = JSON.parse(fs.readFileSync(dungeonCorePath, 'utf-8'));
            console.log("合約地址:", dungeonCoreData.address);
            console.log("交易哈希:", dungeonCoreData.transactionHash);
            console.log("區塊編號:", dungeonCoreData.receipt?.blockNumber);
            
            // 檢查構造函數參數
            if (dungeonCoreData.args && dungeonCoreData.args.length > 0) {
                console.log("\n構造函數參數:");
                dungeonCoreData.args.forEach((arg, index) => {
                    console.log(`參數 ${index}:`, arg);
                });
            }
        } else {
            console.log("✗ DungeonCore.json 不存在");
        }
        
        // 檢查 DungeonMaster.json
        console.log("\n3. 檢查 DungeonMaster 部署信息:");
        const dungeonMasterPath = path.join(deploymentDir, 'DungeonMaster.json');
        if (fs.existsSync(dungeonMasterPath)) {
            const dungeonMasterData = JSON.parse(fs.readFileSync(dungeonMasterPath, 'utf-8'));
            console.log("合約地址:", dungeonMasterData.address);
            console.log("交易哈希:", dungeonMasterData.transactionHash);
        } else {
            console.log("✗ DungeonMaster.json 不存在");
        }
        
        // 檢查 .chainId 文件
        console.log("\n4. 檢查鏈 ID:");
        const chainIdPath = path.join(deploymentDir, '.chainId');
        if (fs.existsSync(chainIdPath)) {
            const chainId = fs.readFileSync(chainIdPath, 'utf-8').trim();
            console.log("鏈 ID:", chainId);
        }
    } else {
        console.log("✗ 部署目錄不存在");
    }
    
    // 檢查 deploy-config.json
    console.log("\n5. 檢查部署配置文件:");
    const configPath = path.join(__dirname, '..', 'deploy-config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log("✓ deploy-config.json 存在");
        console.log("\n配置內容:");
        console.log(JSON.stringify(config, null, 2));
    } else {
        console.log("✗ deploy-config.json 不存在");
    }
    
    // 檢查 ABI 文件
    console.log("\n6. 檢查 ABI 文件:");
    const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
    
    // 檢查兩個可能的位置
    const possiblePaths = [
        path.join(artifactsDir, 'core', 'DungeonCore.sol', 'DungeonCore.json'),
        path.join(artifactsDir, 'current', 'core', 'DungeonCore.sol', 'DungeonCore.json')
    ];
    
    for (const abiPath of possiblePaths) {
        if (fs.existsSync(abiPath)) {
            console.log(`✓ ABI 文件存在: ${abiPath}`);
            const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
            
            // 檢查是否有 dungeonMaster 函數
            const hasDungeonMaster = artifact.abi.some(item => 
                item.type === 'function' && item.name === 'dungeonMaster'
            );
            console.log(`dungeonMaster 函數: ${hasDungeonMaster ? '✓ 存在' : '✗ 不存在'}`);
            
            // 檢查是否有 dungeonParams 函數
            const hasDungeonParams = artifact.abi.some(item => 
                item.type === 'function' && item.name === 'dungeonParams'
            );
            console.log(`dungeonParams 函數: ${hasDungeonParams ? '✓ 存在' : '✗ 不存在'}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
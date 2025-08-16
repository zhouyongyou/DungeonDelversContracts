// 不需要 ethers，只處理檔案操作
import fs from "fs";
import path from "path";

async function main() {
    console.log("🔄 更新 DungeonMasterV5 ABI 到各個系統...");
    
    // 1. 確保 ABI 檔案存在
    const abiPath = path.join(process.cwd(), 'abi', 'DungeonMasterV5.json');
    if (!fs.existsSync(abiPath)) {
        console.error("❌ 找不到 ABI 檔案:", abiPath);
        console.log("請先執行部署腳本或編譯合約");
        process.exit(1);
    }
    
    const abi = fs.readFileSync(abiPath, 'utf8');
    console.log("✅ 讀取 ABI 成功");
    
    // 2. 更新前端 ABI
    const frontendPaths = [
        '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/abis/dungeonMasterV5.json',
        '/Users/sotadic/src/config/abis/dungeonMasterV5.json' // 備用路徑
    ];
    
    for (const frontendPath of frontendPaths) {
        try {
            const dir = path.dirname(frontendPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(frontendPath, abi);
            console.log("✅ 前端 ABI 已更新:", frontendPath);
            break;
        } catch (error) {
            console.log("⚠️  無法更新:", frontendPath);
        }
    }
    
    // 3. 更新子圖 ABI
    const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/abis/DungeonMasterV5.json';
    try {
        const dir = path.dirname(subgraphPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(subgraphPath, abi);
        console.log("✅ 子圖 ABI 已更新:", subgraphPath);
    } catch (error) {
        console.log("⚠️  無法更新子圖 ABI:", error);
    }
    
    // 4. 更新後端 ABI
    const backendPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/src/abis/DungeonMasterV5.json';
    try {
        const dir = path.dirname(backendPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(backendPath, abi);
        console.log("✅ 後端 ABI 已更新:", backendPath);
    } catch (error) {
        console.log("⚠️  無法更新後端 ABI:", error);
    }
    
    // 5. 創建更新摘要
    const updateSummary = {
        timestamp: new Date().toISOString(),
        contract: "DungeonMasterV5",
        updates: {
            frontend: frontendPaths[0],
            subgraph: subgraphPath,
            backend: backendPath
        },
        nextSteps: [
            "前端: 更新 contracts.ts 中的 ABI import",
            "子圖: 執行 graph codegen && graph build",
            "後端: 重啟服務以載入新 ABI"
        ]
    };
    
    const summaryPath = path.join(process.cwd(), 'abi', 'update-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(updateSummary, null, 2));
    
    console.log("\n");
    console.log("=".repeat(50));
    console.log("📋 更新摘要");
    console.log("=".repeat(50));
    console.log(JSON.stringify(updateSummary, null, 2));
    console.log("=".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
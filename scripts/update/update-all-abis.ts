// scripts/update-all-abis.ts
import * as fs from "fs";
import * as path from "path";

const log = (message: string) => console.log(`\n\x1b[34m${message}\x1b[0m`);
const logSuccess = (message: string) => console.log(`\x1b[32m${message}\x1b[0m`);
const logInfo = (message: string) => console.log(`  \x1b[37m> ${message}\x1b[0m`);

async function main() {
    log("📋 更新所有 ABI 文件...");
    
    // 1. 更新前端的 DungeonMaster ABI
    log("1. 更新前端 ABI...");
    const dungeonMasterABI = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/DungeonMaster.sol/DungeonMasterV2.json"),
            "utf8"
        )
    ).abi;
    
    // 前端路徑
    const frontendPaths = [
        "/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/abis.ts",
        "/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/dungeonmaster-v2-abi.json",
        "/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/dungeonmaster-v2-abi.ts"
    ];
    
    for (const frontendPath of frontendPaths) {
        if (fs.existsSync(frontendPath)) {
            logInfo(`更新 ${path.basename(frontendPath)}...`);
            
            if (frontendPath.endsWith('.ts')) {
                // TypeScript 文件
                const content = fs.readFileSync(frontendPath, 'utf8');
                const updatedContent = content.replace(
                    /export const dungeonMasterABI = \[[\s\S]*?\] as const;/,
                    `export const dungeonMasterABI = ${JSON.stringify(dungeonMasterABI, null, 2)} as const;`
                );
                fs.writeFileSync(frontendPath, updatedContent);
            } else {
                // JSON 文件
                fs.writeFileSync(frontendPath, JSON.stringify(dungeonMasterABI, null, 2));
            }
        }
    }
    
    // 2. 更新子圖 ABI
    log("\n2. 更新子圖 ABI...");
    const subgraphABIPath = "/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/DungeonMaster.json";
    if (fs.existsSync(subgraphABIPath)) {
        fs.writeFileSync(subgraphABIPath, JSON.stringify(dungeonMasterABI, null, 2));
        logInfo("✅ 子圖 DungeonMaster.json 已更新");
    }
    
    // 3. 更新 interfaces.sol 的 ABI
    log("\n3. 更新 interfaces.sol 編譯後的 ABI...");
    const interfacesABI = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/interfaces.sol/IParty.json"),
            "utf8"
        )
    ).abi;
    
    // 檢查前端是否需要更新 IParty 接口
    logInfo("IParty 接口已包含 partyCompositions 函數");
    
    logSuccess("\n✅ 所有 ABI 更新完成！");
    
    log("\n📋 需要檢查的其他更新：");
    logInfo("1. 前端 .env: VITE_MAINNET_DUNGEONMASTER_ADDRESS=0xa4B105Af2211FDaA2F8f20E6D43d0ab838483792");
    logInfo("2. 後端 .env: 更新 dungeonMaster 地址");
    logInfo("3. 子圖 subgraph.yaml: 更新 DungeonMaster 地址和起始區塊");
    logInfo("4. 重新部署前端到 Vercel");
    logInfo("5. 重新部署子圖到 The Graph");
}

main().catch((error) => {
    console.error("❌ 錯誤:", error);
    process.exitCode = 1;
});
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("📦 提取並更新 ABI 檔案...");
    
    // 定義需要提取的合約
    const contracts = [
        { name: "DungeonMasterV4", artifactPath: "contracts/DungeonMasterV4.sol/DungeonMasterV4.json" },
        { name: "DungeonCore", artifactPath: "contracts/DungeonCore.sol/DungeonCore.json" },
        { name: "DungeonStorage", artifactPath: "contracts/DungeonStorage.sol/DungeonStorage.json" },
        { name: "Hero", artifactPath: "contracts/Hero.sol/Hero.json" },
        { name: "Party", artifactPath: "contracts/Party.sol/Party.json" },
        { name: "PlayerProfile", artifactPath: "contracts/PlayerProfile.sol/PlayerProfile.json" },
        { name: "PlayerVault", artifactPath: "contracts/PlayerVault.sol/PlayerVault.json" },
        { name: "VIPStaking", artifactPath: "contracts/VIPStaking.sol/VIPStaking.json" },
        { name: "Oracle", artifactPath: "contracts/Oracle.sol/Oracle.json" },
        { name: "Relic", artifactPath: "contracts/Relic.sol/Relic.json" },
        { name: "AltarOfAscension", artifactPath: "contracts/AltarOfAscension_V2.sol/AltarOfAscension.json" }
    ];
    
    // 創建 ABI 目錄
    const abiDir = path.join(process.cwd(), "abi");
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir);
    }
    
    // 前端 ABI 目錄（假設前端在同級目錄）
    const frontendAbiPath = path.join(process.cwd(), "../DungeonDelversFrontend/src/abi");
    const backendAbiPath = path.join(process.cwd(), "../DungeonDelversBackend/abi");
    const subgraphAbiPath = path.join(process.cwd(), "../dungeon-delvers-subgraph/abis");
    
    // 提取每個合約的 ABI
    for (const contract of contracts) {
        try {
            const artifactPath = path.join(process.cwd(), "artifacts", contract.artifactPath);
            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            const abi = artifact.abi;
            
            // 保存到本地 abi 目錄
            const localAbiPath = path.join(abiDir, `${contract.name}.json`);
            fs.writeFileSync(localAbiPath, JSON.stringify(abi, null, 2));
            console.log(`✅ 已提取 ${contract.name} ABI`);
            
            // 複製到前端（如果存在）
            if (fs.existsSync(frontendAbiPath)) {
                const frontendPath = path.join(frontendAbiPath, `${contract.name}.json`);
                fs.writeFileSync(frontendPath, JSON.stringify(abi, null, 2));
                console.log(`  ↳ 已更新前端 ABI`);
            }
            
            // 複製到後端（如果存在）
            if (fs.existsSync(backendAbiPath)) {
                const backendPath = path.join(backendAbiPath, `${contract.name}.json`);
                fs.writeFileSync(backendPath, JSON.stringify(abi, null, 2));
                console.log(`  ↳ 已更新後端 ABI`);
            }
            
            // 複製到子圖（如果存在）
            if (fs.existsSync(subgraphAbiPath)) {
                // 子圖可能使用不同的命名，特別是 DungeonMaster
                let subgraphName = contract.name;
                if (contract.name === "DungeonMasterV4") {
                    subgraphName = "DungeonMaster";
                }
                const subgraphPath = path.join(subgraphAbiPath, `${subgraphName}.json`);
                fs.writeFileSync(subgraphPath, JSON.stringify(abi, null, 2));
                console.log(`  ↳ 已更新子圖 ABI`);
            }
            
        } catch (error: any) {
            console.error(`❌ 無法提取 ${contract.name} ABI:`, error.message);
        }
    }
    
    console.log("\n📄 ABI 提取完成！");
    
    // 生成合約地址配置
    const addressConfig = {
        DUNGEONMASTER_ADDRESS: process.env.DUNGEONMASTER_ADDRESS,
        DUNGEONCORE_ADDRESS: process.env.DUNGEONCORE_ADDRESS,
        DUNGEONSTORAGE_ADDRESS: process.env.DUNGEONSTORAGE_ADDRESS,
        HERO_ADDRESS: process.env.HERO_ADDRESS,
        PARTY_ADDRESS: process.env.PARTY_ADDRESS,
        PLAYERPROFILE_ADDRESS: process.env.PLAYERPROFILE_ADDRESS,
        PLAYERVAULT_ADDRESS: process.env.PLAYERVAULT_ADDRESS,
        VIPSTAKING_ADDRESS: process.env.VIPSTAKING_ADDRESS,
        ORACLE_ADDRESS: process.env.ORACLE_ADDRESS,
        RELIC_ADDRESS: process.env.RELIC_ADDRESS,
        ALTAROFASCENSION_ADDRESS: process.env.ALTAROFASCENSION_ADDRESS,
        SOUL_SHARD_TOKEN_ADDRESS: process.env.SOUL_SHARD_TOKEN_ADDRESS,
        USD_TOKEN_ADDRESS: process.env.USD_TOKEN_ADDRESS
    };
    
    // 保存地址配置
    const configPath = path.join(process.cwd(), "deployed-addresses.json");
    fs.writeFileSync(configPath, JSON.stringify(addressConfig, null, 2));
    console.log("\n✅ 已生成地址配置檔案: deployed-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// V25.1.6 RequestId 更新地址同步腳本
// 自動同步新合約地址到前端、後端、子圖項目

const fs = require('fs');
const path = require('path');

// 新合約地址
const newAddresses = {
    VITE_HERO_ADDRESS: "0x67DdB736D1D9F7aecDfd0D5eDC84331Dd8684454",
    VITE_RELIC_ADDRESS: "0xd4692e9f113624B4fA901d8BBAD0616a25bBD958", 
    VITE_ALTAROFASCENSION_ADDRESS: "0xB2680EB761096F5599955F36Db59202c503dF5bC",
    VITE_DUNGEONMASTER_ADDRESS: "0x4af1C93Df44266Ed27Cf93Ce641bbc46e7ffFDB5",
    VITE_START_BLOCK: "58628204",
    VITE_CONTRACT_VERSION: "V25.1.6",
    VITE_DEPLOYMENT_DATE: "2025-08-23T17:17:00.000Z",
    VITE_SUBGRAPH_STUDIO_VERSION: "v4.0.9"
};

// 項目路徑
const paths = {
    frontend: "/Users/sotadic/Documents/GitHub/SoulboundSaga",
    backend: "/Users/sotadic/Documents/dungeon-delvers-metadata-server", 
    subgraph: "/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers"
};

async function main() {
    console.log("🔄 開始同步 V25.1.6 RequestId 更新地址");
    
    try {
        // 1. 更新前端 .env.local
        console.log("\n=== 1. 更新前端項目 ===");
        await updateFrontend();
        
        // 2. 更新後端配置
        console.log("\n=== 2. 更新後端項目 ===");
        await updateBackend();
        
        // 3. 更新子圖配置
        console.log("\n=== 3. 更新子圖項目 ===");
        await updateSubgraph();
        
        console.log("\n🎉 === 同步完成 ===");
        console.log("✅ 前端項目地址已更新");
        console.log("✅ 後端項目地址已更新");
        console.log("✅ 子圖項目地址已更新");
        
        console.log("\n🔄 下一步操作:");
        console.log("1. 重啟前端開發服務器: npm run dev");
        console.log("2. 重啟後端服務器");
        console.log("3. 部署新版子圖 v4.0.9");
        console.log("4. 測試 RequestId 匹配功能");
        
        return true;
        
    } catch (error) {
        console.error("❌ 同步過程中發生錯誤:", error);
        return false;
    }
}

async function updateFrontend() {
    const envPath = path.join(paths.frontend, '.env.local');
    
    try {
        // 讀取現有的 .env.local
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // 更新地址
        Object.entries(newAddresses).forEach(([key, value]) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const newLine = `${key}=${value}`;
            
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, newLine);
            } else {
                envContent += `\\n${newLine}`;
            }
        });
        
        // 添加註釋
        const header = `# V25.1.6 RequestId 更新配置 - 自動同步於 ${new Date().toISOString()}\\n# 四個核心合約已重新部署並支援 RequestId 精準匹配\\n\\n`;
        
        fs.writeFileSync(envPath, header + envContent);
        console.log("✅ 前端 .env.local 已更新");
        
        // 更新 public/config/latest.json
        const configPath = path.join(paths.frontend, 'public/config/latest.json');
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const config = {
            version: newAddresses.VITE_CONTRACT_VERSION,
            deployment_date: newAddresses.VITE_DEPLOYMENT_DATE,
            contracts: {
                hero: newAddresses.VITE_HERO_ADDRESS,
                relic: newAddresses.VITE_RELIC_ADDRESS,
                altar: newAddresses.VITE_ALTAROFASCENSION_ADDRESS,
                dungeonMaster: newAddresses.VITE_DUNGEONMASTER_ADDRESS
            },
            start_block: parseInt(newAddresses.VITE_START_BLOCK),
            subgraph: {
                version: newAddresses.VITE_SUBGRAPH_STUDIO_VERSION,
                features: ["requestId_matching", "batch_mint_events", "reliable_tracking"]
            }
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("✅ 前端 public/config/latest.json 已更新");
        
    } catch (error) {
        console.error("❌ 更新前端配置失敗:", error);
        throw error;
    }
}

async function updateBackend() {
    const configPath = path.join(paths.backend, 'config/contracts.json');
    
    try {
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // 更新合約地址
        config.contracts = {
            ...config.contracts,
            hero: newAddresses.VITE_HERO_ADDRESS,
            relic: newAddresses.VITE_RELIC_ADDRESS,
            altarOfAscension: newAddresses.VITE_ALTAROFASCENSION_ADDRESS,
            dungeonMaster: newAddresses.VITE_DUNGEONMASTER_ADDRESS
        };
        
        // 更新部署信息
        config.deployment = {
            version: newAddresses.VITE_CONTRACT_VERSION,
            date: newAddresses.VITE_DEPLOYMENT_DATE,
            startBlock: parseInt(newAddresses.VITE_START_BLOCK),
            features: ["requestId_support", "batch_events", "precise_matching"]
        };
        
        // 更新子圖信息
        config.subgraph = {
            ...config.subgraph,
            version: newAddresses.VITE_SUBGRAPH_STUDIO_VERSION
        };
        
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("✅ 後端 config/contracts.json 已更新");
        
    } catch (error) {
        console.error("❌ 更新後端配置失敗:", error);
        throw error;
    }
}

async function updateSubgraph() {
    const networksPath = path.join(paths.subgraph, 'networks.json');
    
    try {
        let networks = {};
        if (fs.existsSync(networksPath)) {
            networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
        }
        
        // 更新 BSC 網路配置
        if (!networks.bsc) {
            networks.bsc = {};
        }
        
        networks.bsc.Hero = {
            address: newAddresses.VITE_HERO_ADDRESS,
            startBlock: parseInt(newAddresses.VITE_START_BLOCK)
        };
        
        networks.bsc.Relic = {
            address: newAddresses.VITE_RELIC_ADDRESS,
            startBlock: parseInt(newAddresses.VITE_START_BLOCK)
        };
        
        networks.bsc.AltarOfAscension = {
            address: newAddresses.VITE_ALTAROFASCENSION_ADDRESS,
            startBlock: parseInt(newAddresses.VITE_START_BLOCK)
        };
        
        networks.bsc.DungeonMaster = {
            address: newAddresses.VITE_DUNGEONMASTER_ADDRESS,
            startBlock: parseInt(newAddresses.VITE_START_BLOCK)
        };
        
        fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
        console.log("✅ 子圖 networks.json 已更新");
        
        // 更新 subgraph.yaml 中的地址（如果需要）
        const subgraphYamlPath = path.join(paths.subgraph, 'subgraph.yaml');
        if (fs.existsSync(subgraphYamlPath)) {
            let yamlContent = fs.readFileSync(subgraphYamlPath, 'utf8');
            
            // 更新 Hero 地址
            yamlContent = yamlContent.replace(
                /address: "0x[a-fA-F0-9]{40}".*# Hero/g,
                `address: "${newAddresses.VITE_HERO_ADDRESS}" # Hero`
            );
            
            // 更新 Relic 地址
            yamlContent = yamlContent.replace(
                /address: "0x[a-fA-F0-9]{40}".*# Relic/g,
                `address: "${newAddresses.VITE_RELIC_ADDRESS}" # Relic`
            );
            
            // 更新起始區塊
            yamlContent = yamlContent.replace(
                /startBlock: \\d+/g,
                `startBlock: ${newAddresses.VITE_START_BLOCK}`
            );
            
            fs.writeFileSync(subgraphYamlPath, yamlContent);
            console.log("✅ 子圖 subgraph.yaml 已更新");
        }
        
    } catch (error) {
        console.error("❌ 更新子圖配置失敗:", error);
        throw error;
    }
}

main()
    .then((success) => {
        if (success) {
            console.log("\\n✅ V25.1.6 地址同步完成");
            process.exit(0);
        } else {
            console.log("\\n❌ V25.1.6 地址同步失敗");
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });
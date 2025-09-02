#!/usr/bin/env node

/**
 * PlayerVault、Hero、Relic (PVH) 新部署地址同步腳本
 * 將最新的 PVH 合約地址同步到前端、後端、子圖項目
 */

const fs = require('fs');
const path = require('path');

// 從當前 .env 文件中讀取最新地址
function readCurrentAddresses() {
    const envPath = '/Users/sotadic/Documents/DungeonDelversContracts/.env';
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const addresses = {};
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
        if (line.startsWith('VITE_') && line.includes('=')) {
            const [key, value] = line.split('=', 2);
            addresses[key] = value;
        }
    });
    
    return addresses;
}

// 項目路徑配置
const paths = {
    frontend: "/Users/sotadic/Documents/GitHub/SoulboundSaga",
    backend: "/Users/sotadic/Documents/dungeon-delvers-metadata-server",
    subgraph: "/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers"
};

async function main() {
    console.log("🔄 開始同步 PVH (PlayerVault、Hero、Relic) 新部署地址");
    console.log("=" * 60);
    
    try {
        // 讀取當前最新地址
        const currentAddresses = readCurrentAddresses();
        console.log("📋 當前合約地址:");
        console.log(`  Hero: ${currentAddresses.VITE_HERO_ADDRESS}`);
        console.log(`  Relic: ${currentAddresses.VITE_RELIC_ADDRESS}`);
        console.log(`  PlayerVault: ${currentAddresses.VITE_PLAYERVAULT_ADDRESS}`);
        console.log(`  Version: ${currentAddresses.VITE_CONTRACT_VERSION}`);
        
        // 1. 更新前端項目
        console.log("\n=== 1. 同步前端項目 ===");
        await updateFrontend(currentAddresses);
        
        // 2. 更新後端項目
        console.log("\n=== 2. 同步後端項目 ===");
        await updateBackend(currentAddresses);
        
        // 3. 更新子圖項目
        console.log("\n=== 3. 同步子圖項目 ===");
        await updateSubgraph(currentAddresses);
        
        console.log("\n🎉 === 同步完成 ===");
        console.log("✅ 前端項目地址已更新");
        console.log("✅ 後端項目地址已更新");
        console.log("✅ 子圖項目地址已更新");
        
        console.log("\n🔄 後續操作建議:");
        console.log("1. 重啟前端開發服務器: cd SoulboundSaga && npm run dev");
        console.log("2. 重啟後端服務器");
        console.log("3. 更新子圖版本並重新部署");
        console.log("4. 測試 PVH 合約的 Username 系統功能");
        
        return true;
        
    } catch (error) {
        console.error("❌ 同步過程中發生錯誤:", error);
        return false;
    }
}

async function updateFrontend(addresses) {
    const envPath = path.join(paths.frontend, '.env.local');
    
    try {
        // 讀取現有的 .env.local
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // 重點更新的合約地址
        const keyAddressesToUpdate = [
            'VITE_HERO_ADDRESS',
            'VITE_RELIC_ADDRESS',
            'VITE_PLAYERVAULT_ADDRESS',
            'VITE_CONTRACT_VERSION',
            'VITE_DEPLOYMENT_DATE',
            'VITE_START_BLOCK'
        ];
        
        // 更新地址
        keyAddressesToUpdate.forEach(key => {
            if (addresses[key]) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                const newLine = `${key}=${addresses[key]}`;
                
                if (regex.test(envContent)) {
                    envContent = envContent.replace(regex, newLine);
                    console.log(`  ✓ 更新 ${key}`);
                } else {
                    envContent += `\n${newLine}`;
                    console.log(`  ➕ 添加 ${key}`);
                }
            }
        });
        
        // 添加配置更新標記
        const updateHeader = `# PVH 合約重新部署 - 同步於 ${new Date().toISOString()}\n# PlayerVault 支援 Username 系統，Hero 和 Relic 已優化\n\n`;
        
        // 移除舊的更新標記，添加新的
        envContent = envContent.replace(/^# .*合約.*同步於.*\n.*\n\n/gm, '');
        envContent = updateHeader + envContent;
        
        fs.writeFileSync(envPath, envContent);
        console.log("✅ 前端 .env.local 已更新");
        
        // 更新 public/config/latest.json
        const configPath = path.join(paths.frontend, 'public/config/latest.json');
        const configDir = path.dirname(configPath);
        
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const config = {
            version: addresses.VITE_CONTRACT_VERSION,
            deployment_date: addresses.VITE_DEPLOYMENT_DATE,
            start_block: addresses.VITE_START_BLOCK,
            contracts: {
                hero: addresses.VITE_HERO_ADDRESS,
                relic: addresses.VITE_RELIC_ADDRESS,
                playerVault: addresses.VITE_PLAYERVAULT_ADDRESS,
                dungeonCore: addresses.VITE_DUNGEONCORE_ADDRESS,
                dungeonMaster: addresses.VITE_DUNGEONMASTER_ADDRESS
            },
            features: [
                "username_system",
                "optimized_vrf",
                "enhanced_error_messages"
            ]
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("✅ 前端 public/config/latest.json 已更新");
        
    } catch (error) {
        console.error("❌ 更新前端失敗:", error);
        throw error;
    }
}

async function updateBackend(addresses) {
    const configPath = path.join(paths.backend, 'config/contracts.json');
    
    try {
        let config = {};
        
        // 讀取現有配置
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // 更新合約地址
        config.contracts = {
            ...config.contracts,
            hero: addresses.VITE_HERO_ADDRESS,
            relic: addresses.VITE_RELIC_ADDRESS,
            playerVault: addresses.VITE_PLAYERVAULT_ADDRESS,
            dungeonCore: addresses.VITE_DUNGEONCORE_ADDRESS,
            dungeonMaster: addresses.VITE_DUNGEONMASTER_ADDRESS
        };
        
        // 更新版本資訊
        config.version = addresses.VITE_CONTRACT_VERSION;
        config.deployment_date = addresses.VITE_DEPLOYMENT_DATE;
        config.start_block = addresses.VITE_START_BLOCK;
        config.last_sync = new Date().toISOString();
        
        // 添加新功能標記
        config.features = {
            username_system: true,
            optimized_vrf: true,
            enhanced_errors: true
        };
        
        // 確保目錄存在
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("✅ 後端 config/contracts.json 已更新");
        
    } catch (error) {
        console.error("❌ 更新後端失敗:", error);
        throw error;
    }
}

async function updateSubgraph(addresses) {
    const networkPath = path.join(paths.subgraph, 'networks.json');
    
    try {
        let networks = {};
        
        // 讀取現有配置
        if (fs.existsSync(networkPath)) {
            networks = JSON.parse(fs.readFileSync(networkPath, 'utf8'));
        }
        
        // 確保有 mainnet 配置
        if (!networks.mainnet) {
            networks.mainnet = {};
        }
        
        // 更新合約地址和起始區塊
        networks.mainnet = {
            ...networks.mainnet,
            Hero: {
                address: addresses.VITE_HERO_ADDRESS,
                startBlock: addresses.VITE_START_BLOCK
            },
            Relic: {
                address: addresses.VITE_RELIC_ADDRESS,
                startBlock: addresses.VITE_START_BLOCK
            },
            PlayerVault: {
                address: addresses.VITE_PLAYERVAULT_ADDRESS,
                startBlock: addresses.VITE_START_BLOCK
            },
            DungeonMaster: {
                address: addresses.VITE_DUNGEONMASTER_ADDRESS,
                startBlock: addresses.VITE_START_BLOCK
            }
        };
        
        fs.writeFileSync(networkPath, JSON.stringify(networks, null, 2));
        console.log("✅ 子圖 networks.json 已更新");
        
        // 提示需要更新子圖版本
        console.log("⚠️  請考慮更新子圖版本號並重新部署");
        
    } catch (error) {
        console.error("❌ 更新子圖失敗:", error);
        throw error;
    }
}

// 執行同步
if (require.main === module) {
    main()
        .then(success => {
            if (success) {
                console.log("\n🎯 同步成功完成！");
                console.log("所有項目已使用最新的 PVH 合約地址");
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error("\n💥 同步失敗:", error);
            process.exit(1);
        });
}

module.exports = { main, readCurrentAddresses };
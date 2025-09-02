#!/usr/bin/env node

/**
 * V25.1.4 配置同步腳本
 * 同步新部署的 NFT 合約地址到所有相關項目
 */

const fs = require('fs');
const path = require('path');

// V25.1.4 新部署的合約地址
const V25_1_4_CONTRACTS = {
    // 新部署的 NFT 合約
    VITE_HERO_ADDRESS: "0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662",
    VITE_RELIC_ADDRESS: "0x9A682D761ef20377e46136a45f10C3B2a8A76CeF",
    VITE_PARTY_ADDRESS: "0xd5A1dd4Da7F0609042EeBAE3b1a5eceb0A996e25",
    VITE_DUNGEONMASTER_ADDRESS: "0xb1c3ff1A3192B38Ff95C093992d244fc3b75abE0",
    VITE_PLAYERPROFILE_ADDRESS: "0x7DEBfb8334c0aF31f6241f7aB2f78a9907823400",
    VITE_VIPSTAKING_ADDRESS: "0xa4f98938ECfc8DBD586F7eE1d51B3c1FaDDDd5da",
    
    // 元數據
    VITE_CONTRACT_VERSION: "V25.1.4",
    VITE_START_BLOCK: "58517800",
    VITE_DEPLOYMENT_DATE: "2025-08-23T12:00:00.000Z"
};

// 項目路徑配置
const PATHS = {
    // 前端項目 (SoulboundSaga)
    frontend: "/Users/sotadic/Documents/GitHub/SoulboundSaga",
    frontendEnv: "/Users/sotadic/Documents/GitHub/SoulboundSaga/.env.local",
    
    // 後端項目
    backend: "/Users/sotadic/Documents/dungeon-delvers-metadata-server",
    backendConfig: "/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.json",
    
    // 子圖項目
    subgraph: "/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers",
    subgraphNetworks: "/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers/networks.json"
};

async function syncFrontendConfig() {
    console.log("🎨 同步前端配置...");
    
    if (!fs.existsSync(PATHS.frontendEnv)) {
        console.log("⚠️ 前端 .env.local 文件不存在，跳過");
        return;
    }
    
    try {
        let envContent = fs.readFileSync(PATHS.frontendEnv, 'utf8');
        
        // 更新所有相關的合約地址
        Object.entries(V25_1_4_CONTRACTS).forEach(([key, value]) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
                console.log(`  ✅ 更新 ${key}=${value}`);
            } else {
                // 如果不存在，添加到文件末尾
                envContent += `\n${key}=${value}`;
                console.log(`  ➕ 添加 ${key}=${value}`);
            }
        });
        
        fs.writeFileSync(PATHS.frontendEnv, envContent);
        console.log("✅ 前端配置同步完成");
    } catch (error) {
        console.error("❌ 前端配置同步失敗:", error.message);
    }
}

async function syncBackendConfig() {
    console.log("🔧 同步後端配置...");
    
    if (!fs.existsSync(PATHS.backendConfig)) {
        console.log("⚠️ 後端配置文件不存在，跳過");
        return;
    }
    
    try {
        const config = JSON.parse(fs.readFileSync(PATHS.backendConfig, 'utf8'));
        
        // 更新合約地址
        config.contracts = config.contracts || {};
        config.contracts.hero = V25_1_4_CONTRACTS.VITE_HERO_ADDRESS;
        config.contracts.relic = V25_1_4_CONTRACTS.VITE_RELIC_ADDRESS;
        config.contracts.party = V25_1_4_CONTRACTS.VITE_PARTY_ADDRESS;
        config.contracts.dungeonMaster = V25_1_4_CONTRACTS.VITE_DUNGEONMASTER_ADDRESS;
        config.contracts.playerProfile = V25_1_4_CONTRACTS.VITE_PLAYERPROFILE_ADDRESS;
        config.contracts.vipStaking = V25_1_4_CONTRACTS.VITE_VIPSTAKING_ADDRESS;
        
        // 更新版本信息
        config.deployment = config.deployment || {};
        config.deployment.version = V25_1_4_CONTRACTS.VITE_CONTRACT_VERSION;
        config.deployment.startBlock = parseInt(V25_1_4_CONTRACTS.VITE_START_BLOCK);
        config.deployment.date = V25_1_4_CONTRACTS.VITE_DEPLOYMENT_DATE;
        
        fs.writeFileSync(PATHS.backendConfig, JSON.stringify(config, null, 2));
        console.log("✅ 後端配置同步完成");
    } catch (error) {
        console.error("❌ 後端配置同步失敗:", error.message);
    }
}

async function syncSubgraphConfig() {
    console.log("📊 同步子圖配置...");
    
    if (!fs.existsSync(PATHS.subgraphNetworks)) {
        console.log("⚠️ 子圖 networks.json 文件不存在，跳過");
        return;
    }
    
    try {
        const networks = JSON.parse(fs.readFileSync(PATHS.subgraphNetworks, 'utf8'));
        
        // 更新 BSC 主網配置
        if (networks.mainnet) {
            networks.mainnet.Hero.address = V25_1_4_CONTRACTS.VITE_HERO_ADDRESS;
            networks.mainnet.Relic.address = V25_1_4_CONTRACTS.VITE_RELIC_ADDRESS;
            networks.mainnet.Party.address = V25_1_4_CONTRACTS.VITE_PARTY_ADDRESS;
            networks.mainnet.DungeonMaster.address = V25_1_4_CONTRACTS.VITE_DUNGEONMASTER_ADDRESS;
            networks.mainnet.PlayerProfile.address = V25_1_4_CONTRACTS.VITE_PLAYERPROFILE_ADDRESS;
            networks.mainnet.VIPStaking.address = V25_1_4_CONTRACTS.VITE_VIPSTAKING_ADDRESS;
            
            // 更新起始區塊
            const startBlock = parseInt(V25_1_4_CONTRACTS.VITE_START_BLOCK);
            Object.values(networks.mainnet).forEach(contract => {
                if (contract.address && typeof contract === 'object') {
                    contract.startBlock = startBlock;
                }
            });
        }
        
        fs.writeFileSync(PATHS.subgraphNetworks, JSON.stringify(networks, null, 2));
        console.log("✅ 子圖配置同步完成");
    } catch (error) {
        console.error("❌ 子圖配置同步失敗:", error.message);
    }
}

async function main() {
    console.log("🚀 開始 V25.1.4 配置同步...\n");
    
    console.log("📋 新部署的合約地址:");
    Object.entries(V25_1_4_CONTRACTS).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    console.log();
    
    try {
        await syncFrontendConfig();
        console.log();
        
        await syncBackendConfig();
        console.log();
        
        await syncSubgraphConfig();
        console.log();
        
        console.log("🎉 V25.1.4 配置同步完成！\n");
        console.log("📝 後續步驟:");
        console.log("1. 重啟前端開發服務器: cd frontend && npm run dev");
        console.log("2. 重啟後端服務器: cd backend && npm restart");
        console.log("3. 重新部署子圖: cd subgraph && graph deploy");
        console.log("4. 更新前端 ABI 文件");
        
    } catch (error) {
        console.error("❌ 配置同步失敗:", error);
        process.exit(1);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    main();
}

module.exports = {
    V25_1_4_CONTRACTS,
    PATHS,
    syncFrontendConfig,
    syncBackendConfig,
    syncSubgraphConfig
};
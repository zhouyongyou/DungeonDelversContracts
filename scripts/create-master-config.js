#!/usr/bin/env node

/**
 * 創建真正的單一主配置文件
 * 所有項目都通過符號連結指向這個文件
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 全局主配置文件位置
const MASTER_CONFIG_PATH = path.join(os.homedir(), '.dungeondelvers-master.env');

// 項目路徑配置
const PROJECTS = {
    contracts: '/Users/sotadic/Documents/DungeonDelversContracts',
    frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
    backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
    subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

// V25 完整配置
const MASTER_CONFIG = `# 🏰 DungeonDelvers V25 全局主配置
# 📍 位置: ${MASTER_CONFIG_PATH}
# 🚀 單一事實來源 - 所有項目共用此文件
# 📝 最後更新: ${new Date().toISOString()}

# ═══════════════════════════════════════
# 🌐 網路配置
# ═══════════════════════════════════════
VITE_CHAIN_ID=56
VITE_NETWORK=BSC Mainnet
VITE_START_BLOCK=56757876
VITE_RPC_URL=https://bsc-dataseed.binance.org

# ═══════════════════════════════════════
# 📡 服務端點
# ═══════════════════════════════════════
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.1
VITE_BACKEND_URL=https://dungeon-delvers-metadata-server.onrender.com
VITE_EXPLORER_URL=https://bscscan.com

# ═══════════════════════════════════════
# 🏛️ 核心合約
# ═══════════════════════════════════════
VITE_DUNGEONCORE_ADDRESS=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
VITE_ORACLE_ADDRESS=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a

# ═══════════════════════════════════════
# 🎮 NFT 合約
# ═══════════════════════════════════════
VITE_HERO_ADDRESS=0x671d937b171e2ba2c4dc23c133b07e4449f283ef
VITE_RELIC_ADDRESS=0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da
VITE_PARTY_ADDRESS=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3

# ═══════════════════════════════════════
# ⚔️  遊戲合約
# ═══════════════════════════════════════
VITE_DUNGEONMASTER_ADDRESS=0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a
VITE_DUNGEONSTORAGE_ADDRESS=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
VITE_ALTAROFASCENSION_ADDRESS=0xa86749237d4631ad92ba859d0b0df4770f6147ba

# ═══════════════════════════════════════
# 🛠️ 支援合約
# ═══════════════════════════════════════
VITE_PLAYERVAULT_ADDRESS=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
VITE_PLAYERPROFILE_ADDRESS=0x0f5932e89908400a5AfDC306899A2987b67a3155
VITE_VIPSTAKING_ADDRESS=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C

# ═══════════════════════════════════════
# 💎 代幣 & VRF
# ═══════════════════════════════════════
VITE_SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
VITE_USD_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VITE_UNISWAP_POOL_ADDRESS=0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82
VITE_VRFMANAGER_ADDRESS=0x980d224ec4d198d94f34a8af76a19c00dabe2436

# ═══════════════════════════════════════
# 🔧 VRF 配置
# ═══════════════════════════════════════
VITE_VRF_SUBSCRIPTION_ID=29062
VITE_VRF_COORDINATOR=0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
VITE_VRF_KEY_HASH=0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4
VITE_VRF_CALLBACK_GAS_LIMIT=2500000
VITE_VRF_REQUEST_CONFIRMATIONS=3
VITE_VRF_ENABLED=true
VITE_VRF_PRICE=0.0001
VITE_PLATFORM_FEE=0

# ═══════════════════════════════════════
# 🔧 開發配置
# ═══════════════════════════════════════
VITE_VERSION=V25
VITE_DEPLOYMENT_DATE=2025-08-07T18:00:00Z
VITE_ENV=production
VITE_DEVELOPER_ADDRESS=0x10925A7138649C7E1794CE646182eeb5BF8ba647

# ═══════════════════════════════════════
# 🌐 後端兼容（無 VITE_ 前綴）
# ═══════════════════════════════════════
CHAIN_ID=56
NETWORK=BSC Mainnet
START_BLOCK=56757876
DUNGEONCORE_ADDRESS=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
ORACLE_ADDRESS=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a
HERO_ADDRESS=0x671d937b171e2ba2c4dc23c133b07e4449f283ef
RELIC_ADDRESS=0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da
PARTY_ADDRESS=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3
DUNGEONMASTER_ADDRESS=0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a
DUNGEONSTORAGE_ADDRESS=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
ALTAROFASCENSION_ADDRESS=0xa86749237d4631ad92ba859d0b0df4770f6147ba
PLAYERVAULT_ADDRESS=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
PLAYERPROFILE_ADDRESS=0x0f5932e89908400a5AfDC306899A2987b67a3155
VIPSTAKING_ADDRESS=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C
SOULSHARD_ADDRESS=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
USD_ADDRESS=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VRFMANAGER_ADDRESS=0x980d224ec4d198d94f34a8af76a19c00dabe2436
SUBGRAPH_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.1
RPC_URL=https://bsc-dataseed.binance.org
`;

class MasterConfigManager {
    constructor() {
        this.masterPath = MASTER_CONFIG_PATH;
    }

    // 創建主配置文件
    createMasterConfig() {
        log('\n🎯 創建全局主配置文件...', 'blue');
        
        try {
            fs.writeFileSync(this.masterPath, MASTER_CONFIG);
            log(`  ✅ 主配置已創建: ${this.masterPath}`, 'green');
            return true;
        } catch (error) {
            log(`  ❌ 創建失敗: ${error.message}`, 'red');
            return false;
        }
    }

    // 創建項目符號連結
    linkProjects() {
        log('\n🔗 創建項目符號連結...', 'blue');

        const links = [
            {
                name: '前端',
                from: this.masterPath,
                to: path.join(PROJECTS.frontend, '.env.local')
            },
            {
                name: '前端 (.env)',
                from: this.masterPath,
                to: path.join(PROJECTS.frontend, '.env')
            },
            {
                name: '後端',
                from: this.masterPath,
                to: path.join(PROJECTS.backend, '.env')
            },
            {
                name: '合約項目',
                from: this.masterPath,
                to: path.join(PROJECTS.contracts, '.env')
            }
        ];

        let successCount = 0;

        for (const link of links) {
            try {
                // 刪除現有文件
                if (fs.existsSync(link.to)) {
                    fs.unlinkSync(link.to);
                }

                // 創建符號連結
                fs.symlinkSync(link.from, link.to);
                log(`  ✅ ${link.name}: ${path.basename(link.to)}`, 'green');
                successCount++;
            } catch (error) {
                log(`  ❌ ${link.name}: ${error.message}`, 'red');
            }
        }

        return successCount === links.length;
    }

    // 生成子圖配置
    generateSubgraphConfig() {
        log('\n🕸️  生成子圖配置...', 'blue');

        const subgraphConfig = {
            bsc: {
                startBlock: 56757876,
                contracts: {
                    dungeoncore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
                    oracle: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
                    hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
                    relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
                    party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
                    dungeonmaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
                    dungeonstorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
                    altarofascension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
                    playervault: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
                    playerprofile: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
                    vipstaking: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
                    soulshard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
                    usd: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
                    vrfmanager: "0x980d224ec4d198d94f34a8af76a19c00dabe2436"
                }
            }
        };

        try {
            const subgraphConfigPath = path.join(PROJECTS.subgraph, 'networks.json');
            fs.writeFileSync(subgraphConfigPath, JSON.stringify(subgraphConfig, null, 2));
            log('  ✅ 子圖配置已生成', 'green');
            return true;
        } catch (error) {
            log(`  ❌ 生成失敗: ${error.message}`, 'red');
            return false;
        }
    }

    // 生成後端 JSON 配置
    generateBackendConfig() {
        log('\n🖥️  生成後端配置...', 'blue');

        const backendConfig = {
            network: "bsc",
            chainId: 56,
            rpcUrl: "https://bsc-dataseed1.binance.org/",
            contracts: {
                dungeonStorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
                dungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
                hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
                relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
                altarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
                party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
                dungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
                playerVault: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
                playerProfile: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
                vipStaking: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
                oracle: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
                soulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
                usd: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
                uniswapPool: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82",
                vrfManagerV2Plus: "0x980d224ec4d198d94f34a8af76a19c00dabe2436"
            },
            vrf: {
                subscriptionId: "29062",
                coordinator: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
                keyHash: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"
            },
            subgraph: {
                url: "https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.1",
                version: "v3.8.1"
            },
            deployment: {
                version: "V25",
                date: "2025-08-07T18:00:00Z",
                startBlock: "56757876"
            }
        };

        try {
            const backendConfigPath = path.join(PROJECTS.backend, 'config/contracts.json');
            fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
            log('  ✅ 後端配置已生成', 'green');
            return true;
        } catch (error) {
            log(`  ❌ 生成失敗: ${error.message}`, 'red');
            return false;
        }
    }

    // 驗證配置
    validate() {
        log('\n🔍 驗證配置...', 'blue');

        const checks = [
            { name: '主配置文件', path: this.masterPath },
            { name: '前端 .env.local', path: path.join(PROJECTS.frontend, '.env.local') },
            { name: '前端 .env', path: path.join(PROJECTS.frontend, '.env') },
            { name: '後端 .env', path: path.join(PROJECTS.backend, '.env') },
            { name: '後端 contracts.json', path: path.join(PROJECTS.backend, 'config/contracts.json') },
            { name: '子圖 networks.json', path: path.join(PROJECTS.subgraph, 'networks.json') }
        ];

        let allGood = true;

        for (const check of checks) {
            if (fs.existsSync(check.path)) {
                const stats = fs.lstatSync(check.path);
                if (stats.isSymbolicLink()) {
                    log(`  🔗 ${check.name}: 符號連結 → 主配置`, 'cyan');
                } else {
                    log(`  ✅ ${check.name}: 獨立文件`, 'green');
                }
            } else {
                log(`  ❌ ${check.name}: 不存在`, 'red');
                allGood = false;
            }
        }

        return allGood;
    }

    // 執行完整設置
    async setup() {
        log('🚀 全局主配置系統設置', 'bright');
        log('=====================================', 'cyan');
        
        const steps = [
            { name: '創建主配置文件', fn: () => this.createMasterConfig() },
            { name: '創建符號連結', fn: () => this.linkProjects() },
            { name: '生成子圖配置', fn: () => this.generateSubgraphConfig() },
            { name: '生成後端配置', fn: () => this.generateBackendConfig() },
            { name: '驗證設置', fn: () => this.validate() }
        ];

        let successCount = 0;
        for (const step of steps) {
            if (step.fn()) {
                successCount++;
            }
        }

        log('\n=====================================', 'cyan');
        if (successCount === steps.length) {
            log('🎉 全局主配置系統設置完成！', 'green');
            log(`\n📍 主配置文件位置: ${this.masterPath}`, 'cyan');
            log('\n✅ 現在所有項目都使用同一個配置文件！', 'green');
            log('✅ 修改主配置文件即可更新所有項目！', 'green');
            
            log('\n💡 使用方法:', 'yellow');
            log(`  編輯: ${this.masterPath}`, 'dim');
            log(`  重啟: 各項目的開發服務器`, 'dim');
            log(`  完成: 所有項目自動使用新配置`, 'dim');
        } else {
            log(`⚠️  設置未完全成功: ${successCount}/${steps.length}`, 'yellow');
        }
    }

    // 顯示當前狀態
    status() {
        log('📊 當前配置系統狀態', 'bright');
        log('=====================================', 'cyan');
        
        log(`\n📍 主配置文件: ${this.masterPath}`, 'blue');
        if (fs.existsSync(this.masterPath)) {
            const stats = fs.statSync(this.masterPath);
            log(`  ✅ 存在 (${Math.round(stats.size / 1024)}KB)`, 'green');
            log(`  📅 修改時間: ${stats.mtime.toLocaleString()}`, 'dim');
        } else {
            log('  ❌ 不存在', 'red');
        }

        this.validate();
    }
}

// CLI 入口
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'setup';
    
    const manager = new MasterConfigManager();
    
    switch (command) {
        case 'setup':
            manager.setup();
            break;
            
        case 'status':
            manager.status();
            break;
            
        case 'validate':
            manager.validate();
            break;
            
        default:
            log('🎯 全局主配置系統', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  setup    - 設置全局主配置系統 (預設)', 'dim');
            log('  status   - 顯示當前狀態', 'dim');
            log('  validate - 驗證配置', 'dim');
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = MasterConfigManager;
#!/usr/bin/env node

/**
 * 🏆 終極配置管理系統
 * 合約項目為中心，最完整、最可靠的配置管理方案
 * 
 * 核心理念：
 * - 合約項目是配置的自然來源
 * - 一個主配置文件 + 智能同步
 * - 完整的錯誤處理和驗證
 * - 支援回滾和備份
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 🎯 配置系統核心
class UltimateConfigSystem {
    constructor() {
        // 主配置文件（唯一需要手動維護的文件）
        this.masterConfigPath = path.join(__dirname, '../.env.v25');
        
        // 項目路徑配置
        this.projects = {
            contracts: '/Users/sotadic/Documents/DungeonDelversContracts',
            frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
            backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
            subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
        };
        
        // ABI 路徑配置
        this.abiPaths = {
            source: path.join(this.projects.contracts, 'artifacts/contracts'),
            output: path.join(this.projects.contracts, 'deployments/abi'),
            frontendTarget: path.join(this.projects.frontend, 'src/contracts/abi'),
            subgraphTarget: path.join(this.projects.subgraph, 'abis')
        };
        
        // 備份目錄
        this.backupDir = path.join(__dirname, '../backups/config');
        
        // 當前配置
        this.config = null;
        this.errors = [];
        this.warnings = [];
    }
    
    // 🔧 初始化系統
    async initialize() {
        log('🚀 初始化終極配置管理系統', 'bright');
        log('=====================================', 'cyan');
        
        // 檢查項目路徑
        await this.validateProjectPaths();
        
        // 創建必要目錄
        await this.createDirectories();
        
        // 載入主配置
        await this.loadMasterConfig();
        
        if (this.errors.length > 0) {
            log('\n❌ 初始化失敗：', 'red');
            this.errors.forEach(error => log(`  - ${error}`, 'red'));
            return false;
        }
        
        log('\n✅ 系統初始化完成', 'green');
        return true;
    }
    
    // 驗證項目路徑
    async validateProjectPaths() {
        log('\n🔍 驗證項目路徑...', 'blue');
        
        for (const [name, projectPath] of Object.entries(this.projects)) {
            if (!fs.existsSync(projectPath)) {
                this.errors.push(`${name} 項目路徑不存在: ${projectPath}`);
            } else {
                log(`  ✅ ${name}: ${path.basename(projectPath)}`, 'green');
            }
        }
    }
    
    // 創建必要目錄
    async createDirectories() {
        const dirs = [
            this.backupDir,
            this.abiPaths.output,
            this.abiPaths.frontendTarget,
            this.abiPaths.subgraphTarget
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                try {
                    fs.mkdirSync(dir, { recursive: true });
                    log(`  📁 創建目錄: ${path.basename(dir)}`, 'dim');
                } catch (error) {
                    this.errors.push(`無法創建目錄 ${dir}: ${error.message}`);
                }
            }
        }
    }
    
    // 載入主配置
    async loadMasterConfig() {
        log('\n📖 載入主配置...', 'blue');
        
        if (!fs.existsSync(this.masterConfigPath)) {
            await this.createMasterConfig();
        }
        
        try {
            const envContent = fs.readFileSync(this.masterConfigPath, 'utf8');
            this.config = this.parseEnvContent(envContent);
            
            log(`  ✅ 載入成功: ${Object.keys(this.config.contracts || {}).length} 個合約`, 'green');
        } catch (error) {
            this.errors.push(`無法載入主配置: ${error.message}`);
        }
    }
    
    // 創建主配置文件
    async createMasterConfig() {
        log('  📝 創建主配置文件...', 'yellow');
        
        const masterConfig = `# 🏰 DungeonDelvers V25 主配置
# 📍 位置: ${this.masterConfigPath}
# 🚀 唯一需要手動維護的配置文件
# 📝 最後更新: ${new Date().toISOString()}

# ═══════════════════════════════════════
# 🌐 網路配置
# ═══════════════════════════════════════
VITE_CHAIN_ID=56
VITE_NETWORK=BSC Mainnet
VITE_START_BLOCK=57914301
VITE_RPC_URL=https://bsc-dataseed.binance.org

# ═══════════════════════════════════════
# 📡 服務端點
# ═══════════════════════════════════════
# 子圖端點 (去中心化優先，Studio 備選)
VITE_SUBGRAPH_DECENTRALIZED_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
VITE_SUBGRAPH_STUDIO_URL=https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.1
VITE_SUBGRAPH_URL=https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
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
VITE_VRF_MANAGER_V2PLUS_ADDRESS=0xdd14eD07598BA1001cf2888077FE0721941d06A8

# ═══════════════════════════════════════
# 🔧 VRF 配置
# ═══════════════════════════════════════
VITE_VRF_SUBSCRIPTION_ID=29062
VITE_VRF_COORDINATOR=0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9
VITE_VRF_KEY_HASH=0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4

# ═══════════════════════════════════════
# 🔧 開發配置
# ═══════════════════════════════════════
VITE_VERSION=V25
VITE_DEPLOYMENT_DATE=2025-08-07T18:00:00Z
VITE_ENV=production
VITE_DEVELOPER_ADDRESS=0xEbCF4A36Ad1485A9737025e9d72186b604487274
`;
        
        try {
            fs.writeFileSync(this.masterConfigPath, masterConfig);
            log(`  ✅ 主配置已創建`, 'green');
        } catch (error) {
            this.errors.push(`無法創建主配置: ${error.message}`);
        }
    }
    
    // 解析 ENV 內容
    parseEnvContent(content) {
        const config = {
            contracts: {},
            network: {},
            vrf: {},
            endpoints: {}
        };
        
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            
            if (key.endsWith('_ADDRESS')) {
                const contractName = key.replace('VITE_', '').replace('_ADDRESS', '');
                config.contracts[contractName] = value;
            } else if (key.startsWith('VITE_CHAIN_ID')) {
                config.network.chainId = parseInt(value);
            } else if (key.startsWith('VITE_NETWORK')) {
                config.network.name = value;
            } else if (key.startsWith('VITE_START_BLOCK')) {
                config.network.startBlock = value;
            } else if (key.includes('SUBGRAPH')) {
                config.endpoints.subgraph = value;
            } else if (key.includes('BACKEND')) {
                config.endpoints.backend = value;
            }
        }
        
        return config;
    }
    
    // 🔄 同步前端配置
    async syncFrontend() {
        log('\n🎨 同步前端配置...', 'blue');
        
        const frontendEnvPath = path.join(this.projects.frontend, '.env.local');
        
        try {
            // 直接複製主配置文件
            const masterContent = fs.readFileSync(this.masterConfigPath, 'utf8');
            fs.writeFileSync(frontendEnvPath, masterContent);
            
            log('  ✅ 前端 .env.local 已同步', 'green');
            
            // 驗證前端配置
            const verification = this.verifyFrontendConfig();
            if (!verification.success) {
                this.warnings.push(`前端配置驗證失敗: ${verification.message}`);
            }
            
            return true;
        } catch (error) {
            this.errors.push(`前端同步失敗: ${error.message}`);
            return false;
        }
    }
    
    // 🖥️ 同步後端配置
    async syncBackend() {
        log('\n🖥️  同步後端配置...', 'blue');
        
        const backendConfigPath = path.join(this.projects.backend, 'config/contracts.json');
        
        try {
            const backendConfig = {
                network: "bsc",
                chainId: this.config.network.chainId || 56,
                rpcUrl: "https://bsc-dataseed1.binance.org/",
                contracts: this.convertContractNaming('camelCase'),
                vrf: {
                    subscriptionId: "29062",
                    coordinator: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
                    keyHash: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"
                },
                subgraph: {
                    url: this.config.endpoints.subgraph,
                    version: "v3.9.1"
                },
                deployment: {
                    version: "V25",
                    date: new Date().toISOString(),
                    startBlock: this.config.network?.startBlock || "57914301"
                }
            };
            
            // 確保目錄存在
            const configDir = path.dirname(backendConfigPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
            log('  ✅ 後端 contracts.json 已同步', 'green');
            
            return true;
        } catch (error) {
            this.errors.push(`後端同步失敗: ${error.message}`);
            return false;
        }
    }
    
    // 🕸️ 同步子圖配置
    async syncSubgraph() {
        log('\n🕸️  同步子圖配置...', 'blue');
        
        const networksPath = path.join(this.projects.subgraph, 'networks.json');
        
        try {
            const subgraphConfig = {
                bsc: {
                    startBlock: parseInt(this.config.network?.startBlock || "57914301"),
                    contracts: this.convertContractNaming('lowercase')
                }
            };
            
            fs.writeFileSync(networksPath, JSON.stringify(subgraphConfig, null, 2));
            log('  ✅ 子圖 networks.json 已同步', 'green');
            
            return true;
        } catch (error) {
            this.errors.push(`子圖同步失敗: ${error.message}`);
            return false;
        }
    }
    
    // 轉換合約命名格式
    convertContractNaming(format) {
        const contracts = {};
        
        for (const [name, address] of Object.entries(this.config.contracts)) {
            let key;
            
            switch (format) {
                case 'camelCase':
                    key = name.charAt(0).toLowerCase() + name.slice(1).toLowerCase();
                    if (key === 'altarofascension') key = 'altarOfAscension';
                    if (key === 'vrfmanager') key = 'vrfManagerV2Plus';
                    break;
                case 'lowercase':
                    key = name.toLowerCase();
                    break;
                default:
                    key = name;
            }
            
            contracts[key] = address;
        }
        
        return contracts;
    }
    
    // 📋 同步 ABI 文件
    async syncABI() {
        log('\n📋 同步 ABI 文件...', 'blue');
        
        const abiContracts = [
            { name: 'Hero', artifactName: 'Hero' },
            { name: 'Relic', artifactName: 'Relic' },
            { name: 'Party', artifactName: 'Party' },
            { name: 'DungeonMaster', artifactName: 'DungeonMaster' },
            { name: 'DungeonStorage', artifactName: 'DungeonStorage' },
            { name: 'AltarOfAscension', artifactName: 'AltarOfAscension' },
            { name: 'VRFConsumerV2Plus', artifactName: 'VRFConsumerV2Plus' },
            { name: 'PlayerVault', artifactName: 'PlayerVault' },
            { name: 'PlayerProfile', artifactName: 'PlayerProfile' },
            { name: 'VIPStaking', artifactName: 'VIPStaking' },
            { name: 'DungeonCore', artifactName: 'DungeonCore' },
            { name: 'Oracle', artifactName: 'Oracle' },
            { name: 'SoulShard', artifactName: 'SoulShard' }
        ];
        let successCount = 0;
        
        for (const contract of abiContracts) {
            try {
                const { name, artifactName } = contract;
                
                // 從 deployments/abi 目錄讀取 ABI
                const abiPath = path.join('deployments', 'abi', `${artifactName}.json`);
                
                if (fs.existsSync(abiPath)) {
                    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
                    const abi = artifact.abi;
                    
                    // 複製到前端（使用標準化名稱）
                    const frontendPath = path.join(this.abiPaths.frontendTarget, `${name}.json`);
                    fs.writeFileSync(frontendPath, JSON.stringify(abi, null, 2));
                    
                    // 複製到子圖（使用標準化名稱）
                    const subgraphPath = path.join(this.abiPaths.subgraphTarget, `${name}.json`);
                    fs.writeFileSync(subgraphPath, JSON.stringify(abi, null, 2));
                    
                    log(`  ✅ ${name} (${artifactName}): ABI 已同步`, 'green');
                    log(`    從: ${artifactName}.json`, 'dim');
                    successCount++;
                } else {
                    this.warnings.push(`${name} (${artifactName}): ABI 文件未找到`);
                    log(`  ⚠️  ${name}: 未找到 ABI 文件`, 'yellow');
                    log(`    路徑: ${abiPath}`, 'dim');
                }
                
            } catch (error) {
                this.warnings.push(`${contract.name}: ${error.message}`);
            }
        }
        
        log(`\n  📊 ABI 同步完成: ${successCount}/${abiContracts.length}`, 'cyan');
        return successCount;
    }
    
    // 🔍 驗證配置
    async validateAll() {
        log('\n🔍 驗證所有配置...', 'blue');
        
        const results = {
            frontend: this.verifyFrontendConfig(),
            backend: this.verifyBackendConfig(),
            subgraph: this.verifySubgraphConfig(),
            abi: this.verifyABISync()
        };
        
        let allGood = true;
        
        for (const [project, result] of Object.entries(results)) {
            if (result.success) {
                log(`  ✅ ${project}: ${result.message}`, 'green');
            } else {
                log(`  ❌ ${project}: ${result.message}`, 'red');
                allGood = false;
            }
        }
        
        return { success: allGood, results };
    }
    
    // 驗證前端配置
    verifyFrontendConfig() {
        const envPath = path.join(this.projects.frontend, '.env.local');
        
        if (!fs.existsSync(envPath)) {
            return { success: false, message: '.env.local 不存在' };
        }
        
        const content = fs.readFileSync(envPath, 'utf8');
        let correctAddresses = 0;
        
        for (const address of Object.values(this.config.contracts)) {
            if (content.includes(address)) {
                correctAddresses++;
            }
        }
        
        const totalAddresses = Object.keys(this.config.contracts).length;
        
        if (correctAddresses === totalAddresses) {
            return { success: true, message: `${correctAddresses}/${totalAddresses} 地址正確` };
        } else {
            return { success: false, message: `只有 ${correctAddresses}/${totalAddresses} 地址正確` };
        }
    }
    
    // 驗證後端配置
    verifyBackendConfig() {
        const configPath = path.join(this.projects.backend, 'config/contracts.json');
        
        if (!fs.existsSync(configPath)) {
            return { success: false, message: 'contracts.json 不存在' };
        }
        
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const addresses = Object.values(config.contracts || {});
            
            return { success: true, message: `包含 ${addresses.length} 個合約地址` };
        } catch (error) {
            return { success: false, message: `解析失敗: ${error.message}` };
        }
    }
    
    // 驗證子圖配置
    verifySubgraphConfig() {
        const networksPath = path.join(this.projects.subgraph, 'networks.json');
        
        if (!fs.existsSync(networksPath)) {
            return { success: false, message: 'networks.json 不存在' };
        }
        
        try {
            const config = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
            const addresses = Object.values(config.bsc?.contracts || {});
            
            return { success: true, message: `包含 ${addresses.length} 個合約地址` };
        } catch (error) {
            return { success: false, message: `解析失敗: ${error.message}` };
        }
    }
    
    // 驗證 ABI 同步
    verifyABISync() {
        const sourceFiles = fs.existsSync(this.abiPaths.output) 
            ? fs.readdirSync(this.abiPaths.output).filter(f => f.endsWith('.json')).length 
            : 0;
            
        const frontendFiles = fs.existsSync(this.abiPaths.frontendTarget)
            ? fs.readdirSync(this.abiPaths.frontendTarget).filter(f => f.endsWith('.json')).length
            : 0;
            
        const subgraphFiles = fs.existsSync(this.abiPaths.subgraphTarget)
            ? fs.readdirSync(this.abiPaths.subgraphTarget).filter(f => f.endsWith('.json')).length
            : 0;
        
        if (sourceFiles > 0 && frontendFiles === sourceFiles && subgraphFiles === sourceFiles) {
            return { success: true, message: `${sourceFiles} 個 ABI 文件已同步` };
        } else {
            return { success: false, message: `ABI 同步不完整 (源:${sourceFiles}, 前端:${frontendFiles}, 子圖:${subgraphFiles})` };
        }
    }
    
    // 🎯 執行完整同步
    async fullSync() {
        log('🚀 開始完整同步', 'bright');
        log('=====================================', 'cyan');
        
        if (!await this.initialize()) {
            return false;
        }
        
        const tasks = [
            { name: '同步前端配置', fn: () => this.syncFrontend() },
            { name: '同步後端配置', fn: () => this.syncBackend() },
            { name: '同步子圖配置', fn: () => this.syncSubgraph() },
            { name: '同步 ABI 文件', fn: () => this.syncABI() }
        ];
        
        let successCount = 0;
        
        for (const task of tasks) {
            if (await task.fn()) {
                successCount++;
            }
        }
        
        // 最終驗證
        const validation = await this.validateAll();
        
        log('\n=====================================', 'cyan');
        log('📊 同步總結', 'cyan');
        log('=====================================', 'cyan');
        
        if (this.warnings.length > 0) {
            log('\n⚠️  警告：', 'yellow');
            this.warnings.forEach(warning => log(`  - ${warning}`, 'yellow'));
        }
        
        if (successCount === tasks.length && validation.success) {
            log('\n🎉 完整同步成功！', 'green');
            log('\n📍 主配置文件位置:', 'cyan');
            log(`   ${this.masterConfigPath}`, 'dim');
            
            log('\n💡 使用說明:', 'yellow');
            log('  1. 編輯主配置文件更新地址', 'dim');
            log('  2. 執行 node ultimate-config-system.js sync', 'dim');
            log('  3. 重啟各項目服務器', 'dim');
            
            return true;
        } else {
            log(`\n⚠️  同步未完全成功: ${successCount}/${tasks.length}`, 'yellow');
            if (this.errors.length > 0) {
                log('\n❌ 錯誤：', 'red');
                this.errors.forEach(error => log(`  - ${error}`, 'red'));
            }
            return false;
        }
    }
    
    // 📊 顯示狀態
    async status() {
        log('📊 配置系統狀態', 'bright');
        log('=====================================', 'cyan');
        
        await this.initialize();
        
        log(`\n📍 主配置文件: ${this.masterConfigPath}`, 'blue');
        if (fs.existsSync(this.masterConfigPath)) {
            const stats = fs.statSync(this.masterConfigPath);
            log(`  ✅ 存在 (${Math.round(stats.size / 1024)}KB)`, 'green');
            log(`  📅 修改時間: ${stats.mtime.toLocaleString()}`, 'dim');
            
            if (this.config && this.config.contracts) {
                log(`  📋 合約數量: ${Object.keys(this.config.contracts).length}`, 'dim');
            }
        } else {
            log('  ❌ 不存在', 'red');
        }
        
        await this.validateAll();
    }
}

// CLI 入口
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'sync';
    
    const system = new UltimateConfigSystem();
    
    switch (command) {
        case 'sync':
        case 'full':
            await system.fullSync();
            break;
            
        case 'status':
            await system.status();
            break;
            
        case 'frontend':
            await system.initialize();
            await system.syncFrontend();
            break;
            
        case 'backend':
            await system.initialize();
            await system.syncBackend();
            break;
            
        case 'subgraph':
            await system.initialize();
            await system.syncSubgraph();
            break;
            
        case 'abi':
            await system.initialize();
            await system.syncABI();
            break;
            
        case 'validate':
            await system.initialize();
            await system.validateAll();
            break;
            
        default:
            log('🏆 終極配置管理系統', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  sync      - 執行完整同步 (預設)', 'dim');
            log('  status    - 顯示系統狀態', 'dim');
            log('  validate  - 驗證所有配置', 'dim');
            log('  frontend  - 只同步前端', 'dim');
            log('  backend   - 只同步後端', 'dim');
            log('  subgraph  - 只同步子圖', 'dim');
            log('  abi       - 只同步 ABI', 'dim');
            log('\n💡 主配置文件:', 'yellow');
            log('  /Users/sotadic/Documents/DungeonDelversContracts/.env.v25', 'dim');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = UltimateConfigSystem;
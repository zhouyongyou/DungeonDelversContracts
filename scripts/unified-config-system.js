#!/usr/bin/env node

/**
 * 🚀 統一配置管理系統 V2.0
 * ENV + ABI 完全自動化管理
 * 解決前端、子圖、後端的所有同步問題
 */

const fs = require('fs');
const path = require('path');

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

// V25 統一配置模板
const V25_UNIFIED_CONFIG = {
    // 版本信息
    version: 'V25',
    timestamp: '2025-08-07 18:00',
    network: 'BSC Mainnet',
    chainId: 56,
    startBlock: 56757876,
    
    // 合約地址
    contracts: {
        // Core Contracts
        DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
        
        // NFT Contracts
        HERO: '0x671d937b171e2ba2c4dc23c133b07e4449f283ef',
        RELIC: '0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da',
        PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
        
        // Game Contracts
        DUNGEONMASTER: '0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a',
        DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
        ALTAROFASCENSION: '0xa86749237d4631ad92ba859d0b0df4770f6147ba',
        
        // Support Contracts
        PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
        PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
        VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
        
        // Tokens & VRF
        SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
        VRFMANAGER: '0x980d224ec4d198d94f34a8af76a19c00dabe2436'
    },
    
    // 服務端點
    endpoints: {
        subgraph: 'https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0',
        backend: 'https://dungeon-delvers-metadata-server.onrender.com',
        rpc: 'https://bsc-dataseed.binance.org'
    },
    
    // ABI 管理配置
    abi: {
        source: 'artifacts/contracts',
        output: 'deployments/abi',
        contracts: ['Hero', 'Relic', 'Party', 'DungeonMaster', 'DungeonStorage', 'AltarOfAscension', 'VRFConsumerV2Plus']
    }
};

// 項目路徑配置
const PROJECTS = {
    contracts: '/Users/sotadic/Documents/DungeonDelversContracts',
    frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
    backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
    subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers'
};

class UnifiedConfigManager {
    constructor() {
        this.masterConfigPath = path.join(__dirname, '../deployments/.env.v25');
        this.abiOutputPath = path.join(__dirname, '../deployments/abi');
    }
    
    // 創建主 ENV 文件
    createMasterEnv() {
        log('\n🎯 創建主 ENV 配置文件...', 'blue');
        
        let envContent = `# 🏰 DungeonDelvers V25 統一配置
# 🚀 單一事實來源 - 所有項目共用此文件
# 📝 最後更新: ${V25_UNIFIED_CONFIG.timestamp}

# ═══════════════════════════════════════
# 🌐 網路配置
# ═══════════════════════════════════════
VITE_CHAIN_ID=${V25_UNIFIED_CONFIG.chainId}
VITE_NETWORK=${V25_UNIFIED_CONFIG.network}
VITE_START_BLOCK=${V25_UNIFIED_CONFIG.startBlock}

# ═══════════════════════════════════════
# 📡 服務端點
# ═══════════════════════════════════════
VITE_SUBGRAPH_URL=${V25_UNIFIED_CONFIG.endpoints.subgraph}
VITE_BACKEND_URL=${V25_UNIFIED_CONFIG.endpoints.backend}
VITE_RPC_URL=${V25_UNIFIED_CONFIG.endpoints.rpc}

# ═══════════════════════════════════════
# 🏛️ 核心合約
# ═══════════════════════════════════════
VITE_DUNGEONCORE_ADDRESS=${V25_UNIFIED_CONFIG.contracts.DUNGEONCORE}
VITE_ORACLE_ADDRESS=${V25_UNIFIED_CONFIG.contracts.ORACLE}

# ═══════════════════════════════════════
# 🎮 NFT 合約
# ═══════════════════════════════════════
VITE_HERO_ADDRESS=${V25_UNIFIED_CONFIG.contracts.HERO}
VITE_RELIC_ADDRESS=${V25_UNIFIED_CONFIG.contracts.RELIC}
VITE_PARTY_ADDRESS=${V25_UNIFIED_CONFIG.contracts.PARTY}

# ═══════════════════════════════════════
# ⚔️  遊戲合約
# ═══════════════════════════════════════
VITE_DUNGEONMASTER_ADDRESS=${V25_UNIFIED_CONFIG.contracts.DUNGEONMASTER}
VITE_DUNGEONSTORAGE_ADDRESS=${V25_UNIFIED_CONFIG.contracts.DUNGEONSTORAGE}
VITE_ALTAROFASCENSION_ADDRESS=${V25_UNIFIED_CONFIG.contracts.ALTAROFASCENSION}

# ═══════════════════════════════════════
# 🛠️ 支援合約
# ═══════════════════════════════════════
VITE_PLAYERVAULT_ADDRESS=${V25_UNIFIED_CONFIG.contracts.PLAYERVAULT}
VITE_PLAYERPROFILE_ADDRESS=${V25_UNIFIED_CONFIG.contracts.PLAYERPROFILE}
VITE_VIPSTAKING_ADDRESS=${V25_UNIFIED_CONFIG.contracts.VIPSTAKING}

# ═══════════════════════════════════════
# 💎 代幣 & VRF
# ═══════════════════════════════════════
VITE_SOULSHARD_ADDRESS=${V25_UNIFIED_CONFIG.contracts.SOULSHARD}
VITE_USD_ADDRESS=${V25_UNIFIED_CONFIG.contracts.USD}
VITE_VRFMANAGER_ADDRESS=${V25_UNIFIED_CONFIG.contracts.VRFMANAGER}

# ═══════════════════════════════════════
# 🔧 開發配置
# ═══════════════════════════════════════
VITE_VERSION=${V25_UNIFIED_CONFIG.version}
VITE_ENV=production

`;
        
        try {
            fs.writeFileSync(this.masterConfigPath, envContent);
            log(`  ✅ 主配置文件已創建: ${path.basename(this.masterConfigPath)}`, 'green');
            return true;
        } catch (error) {
            log(`  ❌ 創建失敗: ${error.message}`, 'red');
            return false;
        }
    }
    
    // 提取和整理 ABI
    extractABIs() {
        log('\n📋 提取合約 ABI...', 'blue');
        
        // 確保輸出目錄存在
        if (!fs.existsSync(this.abiOutputPath)) {
            fs.mkdirSync(this.abiOutputPath, { recursive: true });
        }
        
        const artifactsPath = path.join(__dirname, '../artifacts/contracts');
        const extractedAbis = {};
        let successCount = 0;
        
        for (const contractName of V25_UNIFIED_CONFIG.abi.contracts) {
            try {
                // 嘗試多種可能的路徑
                const possiblePaths = [
                    path.join(artifactsPath, `current/nft/${contractName}.sol/${contractName}.json`),
                    path.join(artifactsPath, `current/core/${contractName}.sol/${contractName}.json`),
                    path.join(artifactsPath, `current/game/${contractName}.sol/${contractName}.json`),
                    path.join(artifactsPath, `current/support/${contractName}.sol/${contractName}.json`)
                ];
                
                let artifactFound = false;
                for (const artifactPath of possiblePaths) {
                    if (fs.existsSync(artifactPath)) {
                        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
                        const abi = artifact.abi;
                        
                        // 保存單獨的 ABI 文件
                        const abiPath = path.join(this.abiOutputPath, `${contractName}.json`);
                        fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
                        
                        extractedAbis[contractName] = abi;
                        log(`  ✅ ${contractName}: ABI 已提取`, 'green');
                        successCount++;
                        artifactFound = true;
                        break;
                    }
                }
                
                if (!artifactFound) {
                    log(`  ⚠️  ${contractName}: 未找到 artifact`, 'yellow');
                }
                
            } catch (error) {
                log(`  ❌ ${contractName}: ${error.message}`, 'red');
            }
        }
        
        // 創建統一的 ABI 集合文件
        const unifiedAbiPath = path.join(this.abiOutputPath, 'unified-abis.json');
        fs.writeFileSync(unifiedAbiPath, JSON.stringify(extractedAbis, null, 2));
        
        log(`\n  📊 ABI 提取完成: ${successCount}/${V25_UNIFIED_CONFIG.abi.contracts.length}`, 'cyan');
        return extractedAbis;
    }
    
    // 同步前端配置
    syncFrontend() {
        log('\n🎨 同步前端配置...', 'blue');
        
        const frontendEnvPath = path.join(PROJECTS.frontend, '.env');
        const frontendEnvLocalPath = path.join(PROJECTS.frontend, '.env.local');
        
        try {
            // 創建符號連結或複製文件
            if (fs.existsSync(frontendEnvPath)) fs.unlinkSync(frontendEnvPath);
            if (fs.existsSync(frontendEnvLocalPath)) fs.unlinkSync(frontendEnvLocalPath);
            
            // 複製主配置文件
            const masterContent = fs.readFileSync(this.masterConfigPath, 'utf8');
            fs.writeFileSync(frontendEnvPath, masterContent);
            fs.writeFileSync(frontendEnvLocalPath, masterContent);
            
            log('  ✅ 前端 ENV 文件已同步', 'green');
            
            // 同步 ABI 到前端
            const frontendAbiPath = path.join(PROJECTS.frontend, 'src/contracts/abi');
            if (!fs.existsSync(frontendAbiPath)) {
                fs.mkdirSync(frontendAbiPath, { recursive: true });
            }
            
            // 複製 ABI 文件
            const abiFiles = fs.readdirSync(this.abiOutputPath);
            for (const abiFile of abiFiles) {
                const sourcePath = path.join(this.abiOutputPath, abiFile);
                const targetPath = path.join(frontendAbiPath, abiFile);
                fs.copyFileSync(sourcePath, targetPath);
            }
            
            log('  ✅ 前端 ABI 文件已同步', 'green');
            return true;
            
        } catch (error) {
            log(`  ❌ 前端同步失敗: ${error.message}`, 'red');
            return false;
        }
    }
    
    // 同步後端配置
    syncBackend() {
        log('\n🖥️  同步後端配置...', 'blue');
        
        try {
            // 創建後端配置文件
            const backendConfig = {
                version: V25_UNIFIED_CONFIG.version,
                timestamp: V25_UNIFIED_CONFIG.timestamp,
                network: V25_UNIFIED_CONFIG.network,
                chainId: V25_UNIFIED_CONFIG.chainId,
                startBlock: V25_UNIFIED_CONFIG.startBlock,
                contracts: V25_UNIFIED_CONFIG.contracts,
                endpoints: V25_UNIFIED_CONFIG.endpoints
            };
            
            const backendConfigPath = path.join(PROJECTS.backend, 'config/contracts.json');
            fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2));
            
            log('  ✅ 後端配置文件已更新', 'green');
            
            // 創建後端 ENV 文件（如果需要）
            const backendEnvPath = path.join(PROJECTS.backend, '.env');
            let backendEnvContent = `# DungeonDelvers 後端配置\n\n`;
            
            // 添加合約地址環境變數
            for (const [name, address] of Object.entries(V25_UNIFIED_CONFIG.contracts)) {
                backendEnvContent += `${name}_ADDRESS=${address}\n`;
            }
            
            // 添加端點配置
            backendEnvContent += `\nSUBGRAPH_URL=${V25_UNIFIED_CONFIG.endpoints.subgraph}\n`;
            backendEnvContent += `RPC_URL=${V25_UNIFIED_CONFIG.endpoints.rpc}\n`;
            
            fs.writeFileSync(backendEnvPath, backendEnvContent);
            log('  ✅ 後端 ENV 文件已創建', 'green');
            
            return true;
            
        } catch (error) {
            log(`  ❌ 後端同步失敗: ${error.message}`, 'red');
            return false;
        }
    }
    
    // 同步子圖配置
    syncSubgraph() {
        log('\n🕸️  同步子圖配置...', 'blue');
        
        try {
            // 創建子圖地址配置
            const subgraphAddresses = {};
            for (const [name, address] of Object.entries(V25_UNIFIED_CONFIG.contracts)) {
                // 子圖通常使用小寫格式
                subgraphAddresses[name.toLowerCase()] = address;
            }
            
            const subgraphConfigPath = path.join(PROJECTS.subgraph, 'networks.json');
            const subgraphConfig = {
                bsc: {
                    startBlock: V25_UNIFIED_CONFIG.startBlock,
                    contracts: subgraphAddresses
                }
            };
            
            fs.writeFileSync(subgraphConfigPath, JSON.stringify(subgraphConfig, null, 2));
            log('  ✅ 子圖配置文件已更新', 'green');
            
            // 同步 ABI 到子圖
            const subgraphAbiPath = path.join(PROJECTS.subgraph, 'abis');
            if (!fs.existsSync(subgraphAbiPath)) {
                fs.mkdirSync(subgraphAbiPath, { recursive: true });
            }
            
            const abiFiles = fs.readdirSync(this.abiOutputPath);
            for (const abiFile of abiFiles.filter(f => f.endsWith('.json') && f !== 'unified-abis.json')) {
                const sourcePath = path.join(this.abiOutputPath, abiFile);
                const targetPath = path.join(subgraphAbiPath, abiFile);
                fs.copyFileSync(sourcePath, targetPath);
            }
            
            log('  ✅ 子圖 ABI 文件已同步', 'green');
            return true;
            
        } catch (error) {
            log(`  ❌ 子圖同步失敗: ${error.message}`, 'red');
            return false;
        }
    }
    
    // 驗證配置一致性
    validateSync() {
        log('\n🔍 驗證配置一致性...', 'blue');
        
        const results = {
            frontend: { env: false, abi: false },
            backend: { config: false, env: false },
            subgraph: { config: false, abi: false }
        };
        
        // 檢查前端
        try {
            const frontendEnv = path.join(PROJECTS.frontend, '.env');
            const frontendAbi = path.join(PROJECTS.frontend, 'src/contracts/abi');
            
            results.frontend.env = fs.existsSync(frontendEnv);
            results.frontend.abi = fs.existsSync(frontendAbi) && fs.readdirSync(frontendAbi).length > 0;
        } catch (error) {
            log(`  ⚠️  前端檢查錯誤: ${error.message}`, 'yellow');
        }
        
        // 檢查後端
        try {
            const backendConfig = path.join(PROJECTS.backend, 'config/contracts.json');
            const backendEnv = path.join(PROJECTS.backend, '.env');
            
            results.backend.config = fs.existsSync(backendConfig);
            results.backend.env = fs.existsSync(backendEnv);
        } catch (error) {
            log(`  ⚠️  後端檢查錯誤: ${error.message}`, 'yellow');
        }
        
        // 檢查子圖
        try {
            const subgraphConfig = path.join(PROJECTS.subgraph, 'networks.json');
            const subgraphAbi = path.join(PROJECTS.subgraph, 'abis');
            
            results.subgraph.config = fs.existsSync(subgraphConfig);
            results.subgraph.abi = fs.existsSync(subgraphAbi) && fs.readdirSync(subgraphAbi).length > 0;
        } catch (error) {
            log(`  ⚠️  子圖檢查錯誤: ${error.message}`, 'yellow');
        }
        
        // 顯示結果
        log('\n  📊 同步狀態檢查:', 'cyan');
        log(`    前端 ENV: ${results.frontend.env ? '✅' : '❌'}  ABI: ${results.frontend.abi ? '✅' : '❌'}`, 'dim');
        log(`    後端 配置: ${results.backend.config ? '✅' : '❌'}  ENV: ${results.backend.env ? '✅' : '❌'}`, 'dim');
        log(`    子圖 配置: ${results.subgraph.config ? '✅' : '❌'}  ABI: ${results.subgraph.abi ? '✅' : '❌'}`, 'dim');
        
        const allGood = Object.values(results).every(project => 
            Object.values(project).every(check => check)
        );
        
        if (allGood) {
            log('\n  🎉 所有配置同步成功！', 'green');
        } else {
            log('\n  ⚠️  部分配置需要檢查', 'yellow');
        }
        
        return results;
    }
    
    // 執行完整同步
    async fullSync() {
        log('🚀 開始統一配置管理系統同步', 'bright');
        log('=====================================', 'cyan');
        
        const steps = [
            { name: '創建主 ENV 文件', fn: () => this.createMasterEnv() },
            { name: '提取合約 ABI', fn: () => this.extractABIs() },
            { name: '同步前端配置', fn: () => this.syncFrontend() },
            { name: '同步後端配置', fn: () => this.syncBackend() },
            { name: '同步子圖配置', fn: () => this.syncSubgraph() },
            { name: '驗證配置一致性', fn: () => this.validateSync() }
        ];
        
        let successCount = 0;
        for (const step of steps) {
            try {
                if (step.fn()) {
                    successCount++;
                }
            } catch (error) {
                log(`❌ ${step.name} 失敗: ${error.message}`, 'red');
            }
        }
        
        log('\n=====================================', 'cyan');
        log('📊 同步總結', 'cyan');
        log('=====================================', 'cyan');
        
        if (successCount === steps.length) {
            log('\n🎉 統一配置系統部署完成！', 'green');
            log('\n✅ 現在你可以：', 'green');
            log('  • 修改 .env.v25 文件更新所有項目', 'dim');
            log('  • 運行 npm run sync:config 重新同步', 'dim');
            log('  • 使用 npm run validate:config 驗證一致性', 'dim');
            
            // 創建快捷命令腳本
            this.createShortcutScripts();
            
        } else {
            log(`\n⚠️  同步完成度: ${successCount}/${steps.length}`, 'yellow');
            log('請檢查錯誤信息並重新運行', 'yellow');
        }
    }
    
    // 創建快捷命令腳本
    createShortcutScripts() {
        const packageJsonPath = path.join(__dirname, '../package.json');
        
        try {
            let packageJson = {};
            if (fs.existsSync(packageJsonPath)) {
                packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            }
            
            if (!packageJson.scripts) packageJson.scripts = {};
            
            // 添加配置管理腳本
            packageJson.scripts['sync:config'] = 'node scripts/unified-config-system.js sync';
            packageJson.scripts['validate:config'] = 'node scripts/unified-config-system.js validate';
            packageJson.scripts['extract:abi'] = 'node scripts/unified-config-system.js abi';
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            log('\n  🔧 快捷命令已添加到 package.json', 'cyan');
            
        } catch (error) {
            log(`  ⚠️  無法添加快捷命令: ${error.message}`, 'yellow');
        }
    }
}

// CLI 入口
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'full';
    
    const manager = new UnifiedConfigManager();
    
    switch (command) {
        case 'sync':
        case 'full':
            manager.fullSync();
            break;
            
        case 'abi':
            manager.extractABIs();
            break;
            
        case 'validate':
            manager.validateSync();
            break;
            
        case 'frontend':
            manager.createMasterEnv();
            manager.syncFrontend();
            break;
            
        case 'backend':
            manager.createMasterEnv();
            manager.syncBackend();
            break;
            
        case 'subgraph':
            manager.createMasterEnv();
            manager.syncSubgraph();
            break;
            
        default:
            log('🎯 統一配置管理系統', 'bright');
            log('=====================================', 'cyan');
            log('可用命令:', 'blue');
            log('  full      - 執行完整同步 (預設)', 'dim');
            log('  sync      - 執行完整同步', 'dim');
            log('  abi       - 只提取 ABI', 'dim');
            log('  validate  - 只驗證配置', 'dim');
            log('  frontend  - 只同步前端', 'dim');
            log('  backend   - 只同步後端', 'dim');
            log('  subgraph  - 只同步子圖', 'dim');
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = UnifiedConfigManager;
// verify-deployment-connections.js - 驗證部署後的合約連接完整性
// 支援 V26 完整部署和 V25.1 部分更新的驗證

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 開始驗證合約連接完整性...\n");
    
    // 檢查是否有指定配置文件
    const args = process.argv.slice(2);
    let configFile = '.env'; // 預設使用當前 .env
    
    if (args.length > 0) {
        configFile = args[0];
        console.log(`📋 使用配置文件: ${configFile}`);
    }
    
    // 讀取環境變數
    require('dotenv').config({ path: configFile });
    
    // 從環境變數讀取合約地址
    const CONTRACTS = {
        // 核心系統
        DungeonCore: process.env.VITE_DUNGEONCORE_ADDRESS,
        Oracle: process.env.VITE_ORACLE_ADDRESS,
        
        // NFT 合約
        Hero: process.env.VITE_HERO_ADDRESS,
        Relic: process.env.VITE_RELIC_ADDRESS,
        Party: process.env.VITE_PARTY_ADDRESS,
        
        // 遊戲合約
        DungeonMaster: process.env.VITE_DUNGEONMASTER_ADDRESS,
        DungeonStorage: process.env.VITE_DUNGEONSTORAGE_ADDRESS,
        AltarOfAscension: process.env.VITE_ALTAROFASCENSION_ADDRESS,
        PlayerVault: process.env.VITE_PLAYERVAULT_ADDRESS,
        PlayerProfile: process.env.VITE_PLAYERPROFILE_ADDRESS,
        VIPStaking: process.env.VITE_VIPSTAKING_ADDRESS,
        
        // 代幣合約
        SoulShard: process.env.VITE_SOULSHARD_ADDRESS,
        USD: process.env.VITE_USD_ADDRESS,
        
        // VRF 系統
        VRFManager: process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS
    };
    
    console.log(`📦 合約版本: ${process.env.VITE_CONTRACT_VERSION || '未指定'}`);
    console.log(`🌐 網路: ${process.env.VITE_NETWORK || 'BSC Mainnet'}`);
    console.log(`🏗️ 管理員: ${process.env.VITE_ADMIN_WALLET || '未指定'}`);
    console.log("=" .repeat(60));
    
    const verificationResults = {
        timestamp: new Date().toISOString(),
        configFile: configFile,
        version: process.env.VITE_CONTRACT_VERSION,
        network: hre.network.name,
        results: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        }
    };
    
    // 輔助函數：記錄結果
    function recordResult(category, test, status, message, details = null) {
        if (!verificationResults.results[category]) {
            verificationResults.results[category] = [];
        }
        
        verificationResults.results[category].push({
            test,
            status, // 'pass', 'fail', 'warning'
            message,
            details
        });
        
        verificationResults.summary.total++;
        if (status === 'pass') verificationResults.summary.passed++;
        else if (status === 'fail') verificationResults.summary.failed++;
        else if (status === 'warning') verificationResults.summary.warnings++;
        
        const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
        console.log(`${icon} ${test}: ${message}`);
        if (details) console.log(`   詳情: ${details}`);
    }
    
    try {
        // ===========================================
        // 1. 基本合約存在性檢查
        // ===========================================
        console.log("\n🏗️ 第1階段: 基本合約存在性檢查");
        console.log("-".repeat(40));
        
        for (const [name, address] of Object.entries(CONTRACTS)) {
            if (!address) {
                recordResult('basic', `${name} 地址配置`, 'fail', '地址未配置');
                continue;
            }
            
            try {
                const code = await hre.ethers.provider.getCode(address);
                if (code === '0x') {
                    recordResult('basic', `${name} 合約存在`, 'fail', '合約未部署', address);
                } else {
                    recordResult('basic', `${name} 合約存在`, 'pass', '合約已部署', address.slice(0, 10) + '...');
                }
            } catch (error) {
                recordResult('basic', `${name} 合約檢查`, 'fail', '檢查失敗', error.message);
            }
        }
        
        // ===========================================
        // 2. 合約 Owner 檢查
        // ===========================================
        console.log("\n👑 第2階段: 合約 Owner 檢查");
        console.log("-".repeat(40));
        
        const expectedOwner = process.env.VITE_ADMIN_WALLET;
        const contractsWithOwner = ['Hero', 'Relic', 'Party', 'DungeonCore', 'DungeonMaster', 'VRFManager'];
        
        for (const contractName of contractsWithOwner) {
            if (!CONTRACTS[contractName]) continue;
            
            try {
                const contract = new hre.ethers.Contract(CONTRACTS[contractName], ['function owner() view returns (address)'], hre.ethers.provider);
                const owner = await contract.owner();
                
                if (expectedOwner && owner.toLowerCase() === expectedOwner.toLowerCase()) {
                    recordResult('ownership', `${contractName} Owner`, 'pass', '正確的 Owner', owner);
                } else {
                    recordResult('ownership', `${contractName} Owner`, 'warning', '非預期的 Owner', `實際: ${owner}, 預期: ${expectedOwner}`);
                }
            } catch (error) {
                recordResult('ownership', `${contractName} Owner`, 'warning', '無法讀取 Owner', error.message);
            }
        }
        
        // ===========================================
        // 3. DungeonCore 模組連接檢查
        // ===========================================
        console.log("\n🏛️ 第3階段: DungeonCore 模組連接檢查");
        console.log("-".repeat(40));
        
        if (CONTRACTS.DungeonCore) {
            const coreABI = [
                'function heroContractAddress() view returns (address)',
                'function relicContractAddress() view returns (address)',
                'function partyContractAddress() view returns (address)',
                'function dungeonMasterAddress() view returns (address)',
                'function altarOfAscensionAddress() view returns (address)',
                'function playerVaultAddress() view returns (address)',
                'function playerProfileAddress() view returns (address)',
                'function vipStakingAddress() view returns (address)',
                'function oracleAddress() view returns (address)',
                'function soulShardTokenAddress() view returns (address)'
            ];
            
            try {
                const core = new hre.ethers.Contract(CONTRACTS.DungeonCore, coreABI, hre.ethers.provider);
                
                const coreConnections = [
                    { getter: 'heroContractAddress', expected: CONTRACTS.Hero, name: 'Hero' },
                    { getter: 'relicContractAddress', expected: CONTRACTS.Relic, name: 'Relic' },
                    { getter: 'partyContractAddress', expected: CONTRACTS.Party, name: 'Party' },
                    { getter: 'dungeonMasterAddress', expected: CONTRACTS.DungeonMaster, name: 'DungeonMaster' },
                    { getter: 'altarOfAscensionAddress', expected: CONTRACTS.AltarOfAscension, name: 'AltarOfAscension' },
                    { getter: 'playerVaultAddress', expected: CONTRACTS.PlayerVault, name: 'PlayerVault' },
                    { getter: 'playerProfileAddress', expected: CONTRACTS.PlayerProfile, name: 'PlayerProfile' },
                    { getter: 'vipStakingAddress', expected: CONTRACTS.VIPStaking, name: 'VIPStaking' },
                    { getter: 'oracleAddress', expected: CONTRACTS.Oracle, name: 'Oracle' },
                    { getter: 'soulShardTokenAddress', expected: CONTRACTS.SoulShard, name: 'SoulShard' }
                ];
                
                for (const connection of coreConnections) {
                    try {
                        const actual = await core[connection.getter]();
                        if (connection.expected && actual.toLowerCase() === connection.expected.toLowerCase()) {
                            recordResult('dungeoncore', `DungeonCore -> ${connection.name}`, 'pass', '連接正確', actual.slice(0, 10) + '...');
                        } else {
                            recordResult('dungeoncore', `DungeonCore -> ${connection.name}`, 'fail', '連接錯誤', `實際: ${actual}, 預期: ${connection.expected}`);
                        }
                    } catch (error) {
                        recordResult('dungeoncore', `DungeonCore -> ${connection.name}`, 'warning', '無法讀取連接', error.message);
                    }
                }
            } catch (error) {
                recordResult('dungeoncore', 'DungeonCore 連接檢查', 'fail', '合約連接失敗', error.message);
            }
        } else {
            recordResult('dungeoncore', 'DungeonCore 地址', 'fail', 'DungeonCore 地址未配置');
        }
        
        // ===========================================
        // 4. 各合約的 DungeonCore 反向引用檢查
        // ===========================================
        console.log("\n🔄 第4階段: 各合約的 DungeonCore 反向引用檢查");
        console.log("-".repeat(40));
        
        const contractsWithCoreRef = ['Hero', 'Relic', 'Party', 'DungeonMaster', 'PlayerVault', 'PlayerProfile', 'VIPStaking'];
        
        for (const contractName of contractsWithCoreRef) {
            if (!CONTRACTS[contractName]) continue;
            
            try {
                // 嘗試不同的函數名稱
                const possibleFunctions = [
                    'function dungeonCore() view returns (address)',
                    'function core() view returns (address)',
                    'function dungeonCoreAddress() view returns (address)'
                ];
                
                let coreAddress = null;
                let functionUsed = null;
                
                for (const funcDef of possibleFunctions) {
                    try {
                        const contract = new hre.ethers.Contract(CONTRACTS[contractName], [funcDef], hre.ethers.provider);
                        coreAddress = await contract[funcDef.split(' ')[1].split('(')[0]]();
                        functionUsed = funcDef.split(' ')[1].split('(')[0];
                        break;
                    } catch (e) {
                        // 繼續嘗試下一個函數
                    }
                }
                
                if (coreAddress) {
                    if (CONTRACTS.DungeonCore && coreAddress.toLowerCase() === CONTRACTS.DungeonCore.toLowerCase()) {
                        recordResult('reverse_ref', `${contractName} -> DungeonCore`, 'pass', '反向引用正確', `使用函數: ${functionUsed}`);
                    } else {
                        recordResult('reverse_ref', `${contractName} -> DungeonCore`, 'fail', '反向引用錯誤', `實際: ${coreAddress}, 預期: ${CONTRACTS.DungeonCore}`);
                    }
                } else {
                    recordResult('reverse_ref', `${contractName} -> DungeonCore`, 'warning', '無法讀取反向引用', '找不到相關函數');
                }
            } catch (error) {
                recordResult('reverse_ref', `${contractName} -> DungeonCore`, 'warning', '反向引用檢查失敗', error.message);
            }
        }
        
        // ===========================================
        // 5. VRF 系統連接檢查
        // ===========================================
        console.log("\n📡 第5階段: VRF 系統連接檢查");
        console.log("-".repeat(40));
        
        if (CONTRACTS.VRFManager) {
            try {
                const vrfABI = ['function authorized(address) view returns (bool)'];
                const vrf = new hre.ethers.Contract(CONTRACTS.VRFManager, vrfABI, hre.ethers.provider);
                
                const vrfClients = ['Hero', 'Relic', 'DungeonMaster', 'AltarOfAscension'];
                for (const clientName of vrfClients) {
                    if (!CONTRACTS[clientName]) continue;
                    
                    try {
                        const isAuthorized = await vrf.authorized(CONTRACTS[clientName]);
                        if (isAuthorized) {
                            recordResult('vrf', `VRF 授權 ${clientName}`, 'pass', '已授權');
                        } else {
                            recordResult('vrf', `VRF 授權 ${clientName}`, 'fail', '未授權');
                        }
                    } catch (error) {
                        recordResult('vrf', `VRF 授權 ${clientName}`, 'warning', '無法檢查授權', error.message);
                    }
                }
                
                // 檢查 NFT 合約的 VRF Manager 引用
                const nftContracts = ['Hero', 'Relic'];
                for (const nftName of nftContracts) {
                    if (!CONTRACTS[nftName]) continue;
                    
                    try {
                        const nftContract = new hre.ethers.Contract(CONTRACTS[nftName], ['function vrfManager() view returns (address)'], hre.ethers.provider);
                        const vrfManagerAddr = await nftContract.vrfManager();
                        
                        if (vrfManagerAddr.toLowerCase() === CONTRACTS.VRFManager.toLowerCase()) {
                            recordResult('vrf', `${nftName} VRF Manager 引用`, 'pass', '引用正確');
                        } else {
                            recordResult('vrf', `${nftName} VRF Manager 引用`, 'fail', '引用錯誤', `實際: ${vrfManagerAddr}, 預期: ${CONTRACTS.VRFManager}`);
                        }
                    } catch (error) {
                        recordResult('vrf', `${nftName} VRF Manager 引用`, 'warning', '無法檢查引用', error.message);
                    }
                }
            } catch (error) {
                recordResult('vrf', 'VRF Manager 檢查', 'fail', 'VRF Manager 連接失敗', error.message);
            }
        } else {
            recordResult('vrf', 'VRF Manager 地址', 'fail', 'VRF Manager 地址未配置');
        }
        
        // ===========================================
        // 6. Oracle 系統檢查
        // ===========================================
        console.log("\n🔮 第6階段: Oracle 系統檢查");
        console.log("-".repeat(40));
        
        if (CONTRACTS.Oracle) {
            try {
                const oracleABI = [
                    'function soulShardToken() view returns (address)',
                    'function usdToken() view returns (address)'
                ];
                const oracle = new hre.ethers.Contract(CONTRACTS.Oracle, oracleABI, hre.ethers.provider);
                
                // 檢查 SoulShard 連接
                try {
                    const soulShardAddr = await oracle.soulShardToken();
                    if (CONTRACTS.SoulShard && soulShardAddr.toLowerCase() === CONTRACTS.SoulShard.toLowerCase()) {
                        recordResult('oracle', 'Oracle SoulShard 連接', 'pass', '連接正確');
                    } else {
                        recordResult('oracle', 'Oracle SoulShard 連接', 'fail', '連接錯誤', `實際: ${soulShardAddr}, 預期: ${CONTRACTS.SoulShard}`);
                    }
                } catch (error) {
                    recordResult('oracle', 'Oracle SoulShard 連接', 'warning', '無法檢查連接', error.message);
                }
                
                // 檢查 USD 連接
                try {
                    const usdAddr = await oracle.usdToken();
                    if (CONTRACTS.USD && usdAddr.toLowerCase() === CONTRACTS.USD.toLowerCase()) {
                        recordResult('oracle', 'Oracle USD 連接', 'pass', '連接正確');
                    } else {
                        recordResult('oracle', 'Oracle USD 連接', 'fail', '連接錯誤', `實際: ${usdAddr}, 預期: ${CONTRACTS.USD}`);
                    }
                } catch (error) {
                    recordResult('oracle', 'Oracle USD 連接', 'warning', '無法檢查連接', error.message);
                }
            } catch (error) {
                recordResult('oracle', 'Oracle 檢查', 'fail', 'Oracle 連接失敗', error.message);
            }
        } else {
            recordResult('oracle', 'Oracle 地址', 'fail', 'Oracle 地址未配置');
        }
        
        // ===========================================
        // 7. DungeonMaster 特殊連接檢查
        // ===========================================
        console.log("\n🧙 第7階段: DungeonMaster 特殊連接檢查");
        console.log("-".repeat(40));
        
        if (CONTRACTS.DungeonMaster && CONTRACTS.DungeonStorage) {
            try {
                const dmABI = ['function dungeonStorage() view returns (address)'];
                const dm = new hre.ethers.Contract(CONTRACTS.DungeonMaster, dmABI, hre.ethers.provider);
                
                const storageAddr = await dm.dungeonStorage();
                if (storageAddr.toLowerCase() === CONTRACTS.DungeonStorage.toLowerCase()) {
                    recordResult('special', 'DungeonMaster -> DungeonStorage', 'pass', '連接正確');
                } else {
                    recordResult('special', 'DungeonMaster -> DungeonStorage', 'fail', '連接錯誤', `實際: ${storageAddr}, 預期: ${CONTRACTS.DungeonStorage}`);
                }
            } catch (error) {
                recordResult('special', 'DungeonMaster -> DungeonStorage', 'warning', '無法檢查連接', error.message);
            }
        }
        
        // ===========================================
        // 8. 基本功能測試
        // ===========================================
        console.log("\n🧪 第8階段: 基本功能測試");
        console.log("-".repeat(40));
        
        // 測試 Hero 合約基本函數
        if (CONTRACTS.Hero) {
            try {
                const heroABI = [
                    'function mintPriceUSD() view returns (uint256)',
                    'function platformFee() view returns (uint256)',
                    'function paused() view returns (bool)'
                ];
                const hero = new hre.ethers.Contract(CONTRACTS.Hero, heroABI, hre.ethers.provider);
                
                const mintPrice = await hero.mintPriceUSD();
                const platformFee = await hero.platformFee();
                const isPaused = await hero.paused();
                
                recordResult('functionality', 'Hero 基本函數', 'pass', '可正常調用', `價格: ${hre.ethers.formatEther(mintPrice)} ETH, 費用: ${hre.ethers.formatEther(platformFee)} ETH, 暫停: ${isPaused}`);
            } catch (error) {
                recordResult('functionality', 'Hero 基本函數', 'warning', '無法調用部分函數', error.message);
            }
        }
        
        // 測試 Relic 合約基本函數
        if (CONTRACTS.Relic) {
            try {
                const relicABI = [
                    'function mintPriceUSD() view returns (uint256)',
                    'function platformFee() view returns (uint256)',
                    'function paused() view returns (bool)'
                ];
                const relic = new hre.ethers.Contract(CONTRACTS.Relic, relicABI, hre.ethers.provider);
                
                const mintPrice = await relic.mintPriceUSD();
                const platformFee = await relic.platformFee();
                const isPaused = await relic.paused();
                
                recordResult('functionality', 'Relic 基本函數', 'pass', '可正常調用', `價格: ${hre.ethers.formatEther(mintPrice)} ETH, 費用: ${hre.ethers.formatEther(platformFee)} ETH, 暫停: ${isPaused}`);
            } catch (error) {
                recordResult('functionality', 'Relic 基本函數', 'warning', '無法調用部分函數', error.message);
            }
        }
        
        // ===========================================
        // 保存驗證報告
        // ===========================================
        console.log("\n💾 保存驗證報告...");
        
        const reportDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const reportFile = path.join(reportDir, `verification-report-${timestamp}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(verificationResults, null, 2));
        
        // ===========================================
        // 最終總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("📊 驗證結果總結");
        console.log("=".repeat(60));
        
        const { total, passed, failed, warnings } = verificationResults.summary;
        console.log(`📋 總測試項目: ${total}`);
        console.log(`✅ 通過: ${passed} (${(passed/total*100).toFixed(1)}%)`);
        console.log(`❌ 失敗: ${failed} (${(failed/total*100).toFixed(1)}%)`);
        console.log(`⚠️ 警告: ${warnings} (${(warnings/total*100).toFixed(1)}%)`);
        
        if (failed === 0) {
            console.log("\n🎉 所有關鍵檢查都通過了！合約連接配置正確。");
        } else if (failed <= 3) {
            console.log("\n⚠️ 發現少量問題，建議檢查並修復失敗項目。");
        } else {
            console.log("\n❌ 發現多個嚴重問題，需要立即修復後重新驗證。");
        }
        
        console.log(`\n📄 詳細報告已保存: ${reportFile}`);
        
        // 按類別顯示失敗和警告
        console.log("\n🔍 問題詳情:");
        for (const [category, tests] of Object.entries(verificationResults.results)) {
            const categoryFails = tests.filter(t => t.status === 'fail');
            const categoryWarnings = tests.filter(t => t.status === 'warning');
            
            if (categoryFails.length > 0 || categoryWarnings.length > 0) {
                console.log(`\n📂 ${category.toUpperCase()}:`);
                
                categoryFails.forEach(test => {
                    console.log(`  ❌ ${test.test}: ${test.message}`);
                    if (test.details) console.log(`     ${test.details}`);
                });
                
                categoryWarnings.forEach(test => {
                    console.log(`  ⚠️ ${test.test}: ${test.message}`);
                    if (test.details) console.log(`     ${test.details}`);
                });
            }
        }
        
        console.log("\n🚀 下一步建議:");
        if (failed > 0) {
            console.log("1. 修復上述失敗項目");
            console.log("2. 重新運行此驗證腳本");
            console.log("3. 確認所有連接正常後進行功能測試");
        } else {
            console.log("1. 執行功能測試: node scripts/test-basic-functions.js");
            console.log("2. 更新前端配置: node scripts/ultimate-config-system.js sync");
            console.log("3. 部署子圖更新");
        }
        
        console.log("\n✨ 驗證完成！");
        
        // 根據結果設定 exit code
        if (failed > 5) {
            process.exit(1); // 嚴重問題
        } else {
            process.exit(0); // 正常或僅有輕微問題
        }
        
    } catch (error) {
        console.error("\n❌ 驗證過程中發生錯誤:");
        console.error(error.message);
        console.error(error.stack);
        
        const errorReport = {
            error: error.message,
            stack: error.stack,
            configFile: configFile,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/verification-error-${Date.now()}.json`);
        fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
        console.log(`💾 錯誤記錄已保存: ${errorFile}`);
        
        process.exit(1);
    }
}

// 檢查命令行參數
if (require.main === module) {
    main();
}

module.exports = main;
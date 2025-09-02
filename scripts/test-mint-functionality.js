// test-mint-functionality.js - 測試鑄造功能完整性
// 支援 Hero 和 Relic NFT 的基本鑄造流程測試

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🧪 開始測試鑄造功能完整性...\n");
    
    // 檢查是否有指定配置文件
    const args = process.argv.slice(2);
    let configFile = '.env'; // 預設使用當前 .env
    
    if (args.length > 0) {
        configFile = args[0];
        console.log(`📋 使用配置文件: ${configFile}`);
    }
    
    // 讀取環境變數
    require('dotenv').config({ path: configFile });
    
    const [tester] = await hre.ethers.getSigners();
    console.log("🔑 測試錢包:", tester.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(tester.address)), "BNB");
    
    // 從環境變數讀取合約地址
    const CONTRACTS = {
        Hero: process.env.VITE_HERO_ADDRESS,
        Relic: process.env.VITE_RELIC_ADDRESS,
        SoulShard: process.env.VITE_SOULSHARD_ADDRESS,
        VRFManager: process.env.VITE_VRF_MANAGER_V2PLUS_ADDRESS,
        DungeonCore: process.env.VITE_DUNGEONCORE_ADDRESS
    };
    
    console.log("📋 測試合約:");
    for (const [name, address] of Object.entries(CONTRACTS)) {
        console.log(`${name}: ${address || '未配置'}`);
    }
    console.log("=" .repeat(60));
    
    const testResults = {
        timestamp: new Date().toISOString(),
        configFile: configFile,
        version: process.env.VITE_CONTRACT_VERSION,
        tester: tester.address,
        tests: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        }
    };
    
    // 輔助函數：記錄測試結果
    function recordTest(category, test, status, message, details = null) {
        if (!testResults.tests[category]) {
            testResults.tests[category] = [];
        }
        
        testResults.tests[category].push({
            test,
            status, // 'pass', 'fail', 'skip'
            message,
            details,
            timestamp: new Date().toISOString()
        });
        
        testResults.summary.total++;
        if (status === 'pass') testResults.summary.passed++;
        else if (status === 'fail') testResults.summary.failed++;
        else if (status === 'skip') testResults.summary.skipped++;
        
        const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${icon} ${test}: ${message}`);
        if (details) console.log(`   詳情: ${details}`);
    }
    
    try {
        // ===========================================
        // 1. 前置條件檢查
        // ===========================================
        console.log("\n🔍 第1階段: 前置條件檢查");
        console.log("-".repeat(40));
        
        // 檢查必要合約存在
        const requiredContracts = ['Hero', 'Relic', 'SoulShard', 'VRFManager'];
        let prerequisitesPassed = true;
        
        for (const contractName of requiredContracts) {
            if (!CONTRACTS[contractName]) {
                recordTest('prerequisites', `${contractName} 地址配置`, 'fail', '地址未配置');
                prerequisitesPassed = false;
                continue;
            }
            
            try {
                const code = await hre.ethers.provider.getCode(CONTRACTS[contractName]);
                if (code === '0x') {
                    recordTest('prerequisites', `${contractName} 合約存在`, 'fail', '合約未部署');
                    prerequisitesPassed = false;
                } else {
                    recordTest('prerequisites', `${contractName} 合約存在`, 'pass', '合約已部署');
                }
            } catch (error) {
                recordTest('prerequisites', `${contractName} 合約檢查`, 'fail', '檢查失敗', error.message);
                prerequisitesPassed = false;
            }
        }
        
        if (!prerequisitesPassed) {
            console.log("\n❌ 前置條件檢查失敗，無法繼續測試");
            return;
        }
        
        // ===========================================
        // 2. SoulShard 代幣準備
        // ===========================================
        console.log("\n🪙 第2階段: SoulShard 代幣準備");
        console.log("-".repeat(40));
        
        let soulShardContract;
        try {
            const soulABI = [
                'function balanceOf(address) view returns (uint256)',
                'function transfer(address, uint256) returns (bool)',
                'function approve(address, uint256) returns (bool)',
                'function allowance(address, address) view returns (uint256)',
                'function totalSupply() view returns (uint256)',
                'function owner() view returns (address)'
            ];
            soulShardContract = new hre.ethers.Contract(CONTRACTS.SoulShard, soulABI, tester);
            
            const balance = await soulShardContract.balanceOf(tester.address);
            recordTest('soulShard', 'SoulShard 餘額查詢', 'pass', `餘額: ${hre.ethers.formatEther(balance)} SOUL`);
            
            const totalSupply = await soulShardContract.totalSupply();
            recordTest('soulShard', 'SoulShard 總供應量', 'pass', `總供應量: ${hre.ethers.formatEther(totalSupply)} SOUL`);
            
            // 如果餘額不足，嘗試檢查是否可以獲得代幣
            if (balance === 0n) {
                try {
                    const owner = await soulShardContract.owner();
                    if (owner.toLowerCase() === tester.address.toLowerCase()) {
                        recordTest('soulShard', 'SoulShard 權限', 'pass', '測試錢包是代幣 Owner，可以 mint');
                    } else {
                        recordTest('soulShard', 'SoulShard 權限', 'skip', '測試錢包非代幣 Owner，無法 mint', `Owner: ${owner}`);
                    }
                } catch (error) {
                    recordTest('soulShard', 'SoulShard 權限檢查', 'skip', '無法檢查權限', error.message);
                }
            }
        } catch (error) {
            recordTest('soulShard', 'SoulShard 合約連接', 'fail', '無法連接 SoulShard 合約', error.message);
            return;
        }
        
        // ===========================================
        // 3. Hero NFT 鑄造測試
        // ===========================================
        console.log("\n⚔️ 第3階段: Hero NFT 鑄造測試");
        console.log("-".repeat(40));
        
        let heroContract;
        try {
            const heroABI = [
                'function mintPriceUSD() view returns (uint256)',
                'function platformFee() view returns (uint256)',
                'function paused() view returns (bool)',
                'function canMint(address) view returns (bool)',
                'function getRequiredSoulShardAmount(uint256) view returns (uint256)',
                'function userRequests(address) view returns (uint256, uint256, bool, uint8, bool, uint256[])',
                'function vrfManager() view returns (address)',
                'function nextTokenId() view returns (uint256)',
                'function dungeonCore() view returns (address)'
            ];
            heroContract = new hre.ethers.Contract(CONTRACTS.Hero, heroABI, tester);
            
            // 檢查基本配置
            const mintPriceUSD = await heroContract.mintPriceUSD();
            const platformFee = await heroContract.platformFee();
            const isPaused = await heroContract.paused();
            
            recordTest('hero', 'Hero 配置檢查', 'pass', `價格: ${hre.ethers.formatEther(mintPriceUSD)} USD, 費用: ${hre.ethers.formatEther(platformFee)} BNB, 暫停: ${isPaused}`);
            
            if (isPaused) {
                recordTest('hero', 'Hero 暫停狀態', 'skip', '合約已暫停，無法測試鑄造');
            } else {
                // 檢查鑄造權限
                try {
                    const canMint = await heroContract.canMint(tester.address);
                    recordTest('hero', 'Hero canMint 檢查', canMint ? 'pass' : 'fail', canMint ? '可以鑄造' : '無法鑄造');
                    
                    // 檢查用戶請求狀態
                    const userRequest = await heroContract.userRequests(tester.address);
                    const hasActiveRequest = userRequest[0] > 0 && !userRequest[2]; // quantity > 0 && !fulfilled
                    
                    if (hasActiveRequest) {
                        recordTest('hero', 'Hero 用戶請求狀態', 'skip', `有進行中的請求，數量: ${userRequest[0]}, 已完成: ${userRequest[2]}`);
                    } else {
                        recordTest('hero', 'Hero 用戶請求狀態', 'pass', '無進行中的請求，可以開始新的鑄造');
                    }
                } catch (error) {
                    recordTest('hero', 'Hero canMint 檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查所需 SoulShard 數量
                try {
                    const requiredSoul = await heroContract.getRequiredSoulShardAmount(1);
                    recordTest('hero', 'Hero SoulShard 需求', 'pass', `鑄造 1 個需要: ${hre.ethers.formatEther(requiredSoul)} SOUL`);
                    
                    const currentBalance = await soulShardContract.balanceOf(tester.address);
                    if (currentBalance >= requiredSoul) {
                        recordTest('hero', 'Hero SoulShard 餘額充足性', 'pass', '餘額充足，可以鑄造');
                    } else {
                        recordTest('hero', 'Hero SoulShard 餘額充足性', 'fail', `餘額不足，需要: ${hre.ethers.formatEther(requiredSoul)}, 當前: ${hre.ethers.formatEther(currentBalance)}`);
                    }
                } catch (error) {
                    recordTest('hero', 'Hero SoulShard 需求檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查 VRF Manager 連接
                try {
                    const vrfManager = await heroContract.vrfManager();
                    if (vrfManager.toLowerCase() === CONTRACTS.VRFManager.toLowerCase()) {
                        recordTest('hero', 'Hero VRF Manager 連接', 'pass', 'VRF Manager 正確');
                    } else {
                        recordTest('hero', 'Hero VRF Manager 連接', 'fail', `VRF Manager 錯誤，實際: ${vrfManager}, 預期: ${CONTRACTS.VRFManager}`);
                    }
                } catch (error) {
                    recordTest('hero', 'Hero VRF Manager 檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查 DungeonCore 連接
                try {
                    const coreAddress = await heroContract.dungeonCore();
                    if (CONTRACTS.DungeonCore && coreAddress.toLowerCase() === CONTRACTS.DungeonCore.toLowerCase()) {
                        recordTest('hero', 'Hero DungeonCore 連接', 'pass', 'DungeonCore 連接正確');
                    } else {
                        recordTest('hero', 'Hero DungeonCore 連接', 'fail', `DungeonCore 連接錯誤，實際: ${coreAddress}, 預期: ${CONTRACTS.DungeonCore}`);
                    }
                } catch (error) {
                    recordTest('hero', 'Hero DungeonCore 檢查', 'fail', '檢查失敗', error.message);
                }
            }
        } catch (error) {
            recordTest('hero', 'Hero 合約連接', 'fail', '無法連接 Hero 合約', error.message);
        }
        
        // ===========================================
        // 4. Relic NFT 鑄造測試
        // ===========================================
        console.log("\n💎 第4階段: Relic NFT 鑄造測試");
        console.log("-".repeat(40));
        
        let relicContract;
        try {
            const relicABI = [
                'function mintPriceUSD() view returns (uint256)',
                'function platformFee() view returns (uint256)',
                'function paused() view returns (bool)',
                'function canMint(address) view returns (bool)',
                'function getRequiredSoulShardAmount(uint256) view returns (uint256)',
                'function userRequests(address) view returns (uint256, uint256, bool, uint8, bool, uint256[])',
                'function vrfManager() view returns (address)',
                'function nextTokenId() view returns (uint256)',
                'function dungeonCore() view returns (address)'
            ];
            relicContract = new hre.ethers.Contract(CONTRACTS.Relic, relicABI, tester);
            
            // 檢查基本配置
            const mintPriceUSD = await relicContract.mintPriceUSD();
            const platformFee = await relicContract.platformFee();
            const isPaused = await relicContract.paused();
            
            recordTest('relic', 'Relic 配置檢查', 'pass', `價格: ${hre.ethers.formatEther(mintPriceUSD)} USD, 費用: ${hre.ethers.formatEther(platformFee)} BNB, 暫停: ${isPaused}`);
            
            if (isPaused) {
                recordTest('relic', 'Relic 暫停狀態', 'skip', '合約已暫停，無法測試鑄造');
            } else {
                // 檢查鑄造權限
                try {
                    const canMint = await relicContract.canMint(tester.address);
                    recordTest('relic', 'Relic canMint 檢查', canMint ? 'pass' : 'fail', canMint ? '可以鑄造' : '無法鑄造');
                    
                    // 檢查用戶請求狀態
                    const userRequest = await relicContract.userRequests(tester.address);
                    const hasActiveRequest = userRequest[0] > 0 && !userRequest[2]; // quantity > 0 && !fulfilled
                    
                    if (hasActiveRequest) {
                        recordTest('relic', 'Relic 用戶請求狀態', 'skip', `有進行中的請求，數量: ${userRequest[0]}, 已完成: ${userRequest[2]}`);
                    } else {
                        recordTest('relic', 'Relic 用戶請求狀態', 'pass', '無進行中的請求，可以開始新的鑄造');
                    }
                } catch (error) {
                    recordTest('relic', 'Relic canMint 檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查所需 SoulShard 數量
                try {
                    const requiredSoul = await relicContract.getRequiredSoulShardAmount(1);
                    recordTest('relic', 'Relic SoulShard 需求', 'pass', `鑄造 1 個需要: ${hre.ethers.formatEther(requiredSoul)} SOUL`);
                    
                    const currentBalance = await soulShardContract.balanceOf(tester.address);
                    if (currentBalance >= requiredSoul) {
                        recordTest('relic', 'Relic SoulShard 餘額充足性', 'pass', '餘額充足，可以鑄造');
                    } else {
                        recordTest('relic', 'Relic SoulShard 餘額充足性', 'fail', `餘額不足，需要: ${hre.ethers.formatEther(requiredSoul)}, 當前: ${hre.ethers.formatEther(currentBalance)}`);
                    }
                } catch (error) {
                    recordTest('relic', 'Relic SoulShard 需求檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查 VRF Manager 連接
                try {
                    const vrfManager = await relicContract.vrfManager();
                    if (vrfManager.toLowerCase() === CONTRACTS.VRFManager.toLowerCase()) {
                        recordTest('relic', 'Relic VRF Manager 連接', 'pass', 'VRF Manager 正確');
                    } else {
                        recordTest('relic', 'Relic VRF Manager 連接', 'fail', `VRF Manager 錯誤，實際: ${vrfManager}, 預期: ${CONTRACTS.VRFManager}`);
                    }
                } catch (error) {
                    recordTest('relic', 'Relic VRF Manager 檢查', 'fail', '檢查失敗', error.message);
                }
                
                // 檢查 DungeonCore 連接
                try {
                    const coreAddress = await relicContract.dungeonCore();
                    if (CONTRACTS.DungeonCore && coreAddress.toLowerCase() === CONTRACTS.DungeonCore.toLowerCase()) {
                        recordTest('relic', 'Relic DungeonCore 連接', 'pass', 'DungeonCore 連接正確');
                    } else {
                        recordTest('relic', 'Relic DungeonCore 連接', 'fail', `DungeonCore 連接錯誤，實際: ${coreAddress}, 預期: ${CONTRACTS.DungeonCore}`);
                    }
                } catch (error) {
                    recordTest('relic', 'Relic DungeonCore 檢查', 'fail', '檢查失敗', error.message);
                }
            }
        } catch (error) {
            recordTest('relic', 'Relic 合約連接', 'fail', '無法連接 Relic 合約', error.message);
        }
        
        // ===========================================
        // 5. VRF 系統測試
        // ===========================================
        console.log("\n📡 第5階段: VRF 系統測試");
        console.log("-".repeat(40));
        
        try {
            const vrfABI = [
                'function authorized(address) view returns (bool)',
                'function lastRequestIdByAddress(address) view returns (uint256)',
                'function s_requests(uint256) view returns (bool, bool, uint256[], address, uint256)',
                'function owner() view returns (address)'
            ];
            const vrfContract = new hre.ethers.Contract(CONTRACTS.VRFManager, vrfABI, tester);
            
            // 檢查 VRF Manager Owner
            try {
                const vrfOwner = await vrfContract.owner();
                recordTest('vrf', 'VRF Manager Owner', 'pass', `Owner: ${vrfOwner}`);
            } catch (error) {
                recordTest('vrf', 'VRF Manager Owner', 'fail', '無法讀取 Owner', error.message);
            }
            
            // 檢查各合約的 VRF 授權
            const vrfClients = [
                { name: 'Hero', address: CONTRACTS.Hero },
                { name: 'Relic', address: CONTRACTS.Relic }
            ];
            
            for (const client of vrfClients) {
                if (!client.address) continue;
                
                try {
                    const isAuthorized = await vrfContract.authorized(client.address);
                    recordTest('vrf', `VRF 授權 ${client.name}`, isAuthorized ? 'pass' : 'fail', isAuthorized ? '已授權' : '未授權');
                } catch (error) {
                    recordTest('vrf', `VRF 授權 ${client.name}`, 'fail', '檢查失敗', error.message);
                }
            }
            
            // 檢查測試錢包的最後請求 ID
            try {
                const lastRequestId = await vrfContract.lastRequestIdByAddress(tester.address);
                if (lastRequestId > 0) {
                    recordTest('vrf', '測試錢包 VRF 歷史', 'pass', `最後請求 ID: ${lastRequestId}`);
                    
                    // 檢查請求狀態
                    try {
                        const requestStatus = await vrfContract.s_requests(lastRequestId);
                        recordTest('vrf', '最後請求狀態', 'pass', `已完成: ${requestStatus[0]}, 存在: ${requestStatus[1]}, 隨機數數量: ${requestStatus[2].length}`);
                    } catch (error) {
                        recordTest('vrf', '最後請求狀態', 'skip', '無法讀取請求狀態', error.message);
                    }
                } else {
                    recordTest('vrf', '測試錢包 VRF 歷史', 'pass', '無歷史請求');
                }
            } catch (error) {
                recordTest('vrf', '測試錢包 VRF 歷史', 'fail', '檢查失敗', error.message);
            }
        } catch (error) {
            recordTest('vrf', 'VRF Manager 連接', 'fail', '無法連接 VRF Manager', error.message);
        }
        
        // ===========================================
        // 6. 模擬鑄造準備度檢查
        // ===========================================
        console.log("\n🎯 第6階段: 模擬鑄造準備度檢查");
        console.log("-".repeat(40));
        
        // 檢查 BNB 餘額是否足夠支付 gas
        const gasBalance = await hre.ethers.provider.getBalance(tester.address);
        const minGasRequired = hre.ethers.parseEther("0.005"); // 最少需要 0.005 BNB
        
        if (gasBalance >= minGasRequired) {
            recordTest('readiness', 'Gas 費用準備', 'pass', `BNB 餘額充足: ${hre.ethers.formatEther(gasBalance)} BNB`);
        } else {
            recordTest('readiness', 'Gas 費用準備', 'fail', `BNB 餘額不足，需要至少 0.005 BNB，當前: ${hre.ethers.formatEther(gasBalance)} BNB`);
        }
        
        // 綜合鑄造準備度評估
        const heroTestsPassed = testResults.tests.hero?.filter(t => t.status === 'pass').length || 0;
        const heroTestsTotal = testResults.tests.hero?.length || 0;
        const relicTestsPassed = testResults.tests.relic?.filter(t => t.status === 'pass').length || 0;
        const relicTestsTotal = testResults.tests.relic?.length || 0;
        
        if (heroTestsPassed >= heroTestsTotal * 0.8) {
            recordTest('readiness', 'Hero 鑄造準備度', 'pass', `通過 ${heroTestsPassed}/${heroTestsTotal} 項檢查`);
        } else {
            recordTest('readiness', 'Hero 鑄造準備度', 'fail', `僅通過 ${heroTestsPassed}/${heroTestsTotal} 項檢查`);
        }
        
        if (relicTestsPassed >= relicTestsTotal * 0.8) {
            recordTest('readiness', 'Relic 鑄造準備度', 'pass', `通過 ${relicTestsPassed}/${relicTestsTotal} 項檢查`);
        } else {
            recordTest('readiness', 'Relic 鑄造準備度', 'fail', `僅通過 ${relicTestsPassed}/${relicTestsTotal} 項檢查`);
        }
        
        // ===========================================
        // 保存測試報告
        // ===========================================
        console.log("\n💾 保存測試報告...");
        
        const reportDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const reportFile = path.join(reportDir, `mint-functionality-test-${timestamp}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
        
        // ===========================================
        // 最終總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("📊 鑄造功能測試結果總結");
        console.log("=".repeat(60));
        
        const { total, passed, failed, skipped } = testResults.summary;
        console.log(`📋 總測試項目: ${total}`);
        console.log(`✅ 通過: ${passed} (${(passed/total*100).toFixed(1)}%)`);
        console.log(`❌ 失敗: ${failed} (${(failed/total*100).toFixed(1)}%)`);
        console.log(`⏭️ 跳過: ${skipped} (${(skipped/total*100).toFixed(1)}%)`);
        
        // 計算總體準備度分數
        const readinessScore = (passed / (passed + failed)) * 100;
        
        console.log(`\n🎯 鑄造功能準備度: ${readinessScore.toFixed(1)}%`);
        
        if (readinessScore >= 90) {
            console.log("🎉 鑄造功能完全準備就緒！可以進行實際鑄造測試。");
        } else if (readinessScore >= 70) {
            console.log("⚠️ 鑄造功能基本準備就緒，但有一些問題需要解決。");
        } else {
            console.log("❌ 鑄造功能尚未準備就緒，需要解決多個關鍵問題。");
        }
        
        console.log(`\n📄 詳細報告已保存: ${reportFile}`);
        
        // 按類別顯示失敗項目
        console.log("\n🔍 失敗項目詳情:");
        for (const [category, tests] of Object.entries(testResults.tests)) {
            const categoryFails = tests.filter(t => t.status === 'fail');
            
            if (categoryFails.length > 0) {
                console.log(`\n📂 ${category.toUpperCase()}:`);
                categoryFails.forEach(test => {
                    console.log(`  ❌ ${test.test}: ${test.message}`);
                    if (test.details) console.log(`     ${test.details}`);
                });
            }
        }
        
        console.log("\n🚀 建議的下一步:");
        if (readinessScore >= 80) {
            console.log("1. 嘗試實際鑄造測試 (小數量)");
            console.log("2. 監控 VRF 回調完成情況");
            console.log("3. 驗證 NFT 元數據正確性");
        } else {
            console.log("1. 修復上述失敗項目");
            console.log("2. 重新運行此測試腳本");
            console.log("3. 檢查合約配置和權限設置");
        }
        
        console.log("4. 更新前端配置以匹配新合約");
        console.log("5. 部署子圖更新");
        
        console.log("\n✨ 鑄造功能測試完成！");
        
        // 根據結果設定 exit code
        if (readinessScore < 60) {
            process.exit(1); // 嚴重問題
        } else {
            process.exit(0); // 正常或僅有輕微問題
        }
        
    } catch (error) {
        console.error("\n❌ 測試過程中發生錯誤:");
        console.error(error.message);
        console.error(error.stack);
        
        const errorReport = {
            error: error.message,
            stack: error.stack,
            configFile: configFile,
            timestamp: new Date().toISOString()
        };
        
        const errorFile = path.join(__dirname, `../deployments/mint-test-error-${Date.now()}.json`);
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
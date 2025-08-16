const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");

console.log("🚀 V25 最終同步驗證");
console.log("📅 部署時間: 2025-08-06 PM 5:00");
console.log("📦 子圖版本: v3.6.5");
console.log("🔢 部署區塊: 56631513\n");

// V25 最終確認的合約地址
const V25_FINAL_CONTRACTS = {
    // 新部署的 VRF 合約
    DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    DUNGEONMASTER: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    HERO: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    RELIC: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    ALTAROFASCENSION: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    
    // 複用的合約（測試階段）
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    
    // 固定使用的合約
    VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
};

const results = {
    subgraph: { status: '❓', details: [], errors: [] },
    frontend: { status: '❓', details: [], errors: [] },
    backend: { status: '❓', details: [], errors: [] },
    onchain: { status: '❓', details: [], errors: [] }
};

// 1. 驗證子圖配置
function verifySubgraph() {
    console.log("📊 驗證子圖配置...");
    const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
    
    if (fs.existsSync(subgraphPath)) {
        const content = fs.readFileSync(subgraphPath, 'utf8');
        
        // 檢查每個合約地址
        const contracts = [
            { name: 'Hero', address: V25_FINAL_CONTRACTS.HERO },
            { name: 'Relic', address: V25_FINAL_CONTRACTS.RELIC },
            { name: 'DungeonMaster', address: V25_FINAL_CONTRACTS.DUNGEONMASTER },
            { name: 'AltarOfAscension', address: V25_FINAL_CONTRACTS.ALTAROFASCENSION },
            { name: 'Party', address: V25_FINAL_CONTRACTS.PARTY },
            { name: 'PlayerVault', address: V25_FINAL_CONTRACTS.PLAYERVAULT },
            { name: 'PlayerProfile', address: V25_FINAL_CONTRACTS.PLAYERPROFILE },
            { name: 'VIPStaking', address: V25_FINAL_CONTRACTS.VIPSTAKING }
        ];
        
        contracts.forEach(contract => {
            const hasAddress = content.includes(contract.address);
            results.subgraph.details.push({
                name: `${contract.name} 地址`,
                expected: contract.address,
                status: hasAddress ? '✅' : '❌'
            });
            if (!hasAddress) {
                results.subgraph.errors.push(`${contract.name} 地址不匹配`);
            }
        });
        
        // 檢查 VRF 事件
        const vrfEvents = [
            'VRFManagerSet',
            'UpgradeRequested',
            'ExpeditionCommitted',
            'ExpeditionRevealed',
            'UpgradeCommitted',
            'UpgradeRevealed'
        ];
        
        vrfEvents.forEach(event => {
            const hasEvent = content.includes(event);
            results.subgraph.details.push({
                name: `${event} 事件`,
                status: hasEvent ? '✅' : '❌'
            });
            if (!hasEvent) {
                results.subgraph.errors.push(`缺少 ${event} 事件`);
            }
        });
        
        // 檢查區塊高度
        const hasCorrectBlock = content.includes('56631513');
        results.subgraph.details.push({
            name: '起始區塊',
            expected: '56631513',
            status: hasCorrectBlock ? '✅' : '❌'
        });
        
        const hasErrors = results.subgraph.errors.length > 0;
        results.subgraph.status = hasErrors ? '❌' : '✅';
    } else {
        results.subgraph.status = '❌';
        results.subgraph.errors.push('找不到 subgraph.yaml 文件');
    }
}

// 2. 驗證前端配置
function verifyFrontend() {
    console.log("\n🎨 驗證前端配置...");
    const contractsPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
    const envPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/.env';
    
    if (fs.existsSync(contractsPath)) {
        const content = fs.readFileSync(contractsPath, 'utf8');
        
        // 檢查關鍵合約地址
        const criticalContracts = [
            { name: 'Hero', address: V25_FINAL_CONTRACTS.HERO },
            { name: 'Relic', address: V25_FINAL_CONTRACTS.RELIC },
            { name: 'DungeonMaster', address: V25_FINAL_CONTRACTS.DUNGEONMASTER },
            { name: 'AltarOfAscension', address: V25_FINAL_CONTRACTS.ALTAROFASCENSION },
            { name: 'VRFManager', address: V25_FINAL_CONTRACTS.VRFMANAGER }
        ];
        
        criticalContracts.forEach(contract => {
            const hasAddress = content.includes(contract.address);
            results.frontend.details.push({
                name: `${contract.name} 地址`,
                expected: contract.address,
                status: hasAddress ? '✅' : '❌'
            });
            if (!hasAddress) {
                results.frontend.errors.push(`${contract.name} 地址不匹配`);
            }
        });
        
        // 檢查 VRF 功能
        const hasVRFConfig = content.includes('VRF_CONFIG') || content.includes('calculateMintFee');
        results.frontend.details.push({
            name: 'VRF 費用計算',
            status: hasVRFConfig ? '✅' : '❌'
        });
        
        // 檢查環境變數
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const hasVRFEnabled = envContent.includes('VITE_VRF_ENABLED=true');
            results.frontend.details.push({
                name: 'VRF 啟用設定',
                status: hasVRFEnabled ? '✅' : '❌'
            });
        }
        
        const hasErrors = results.frontend.errors.length > 0;
        results.frontend.status = hasErrors ? '❌' : '✅';
    } else {
        results.frontend.status = '❌';
        results.frontend.errors.push('找不到 contracts.ts 文件');
    }
}

// 3. 驗證後端配置
function verifyBackend() {
    console.log("\n🔧 驗證後端配置...");
    const contractsPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js';
    const envPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env';
    
    if (fs.existsSync(contractsPath)) {
        const content = fs.readFileSync(contractsPath, 'utf8');
        
        // 檢查合約地址
        const contracts = [
            { name: 'HERO', address: V25_FINAL_CONTRACTS.HERO },
            { name: 'RELIC', address: V25_FINAL_CONTRACTS.RELIC },
            { name: 'DUNGEONMASTER', address: V25_FINAL_CONTRACTS.DUNGEONMASTER },
            { name: 'ALTAROFASCENSION', address: V25_FINAL_CONTRACTS.ALTAROFASCENSION },
            { name: 'VRFMANAGER', address: V25_FINAL_CONTRACTS.VRFMANAGER }
        ];
        
        contracts.forEach(contract => {
            const hasAddress = content.includes(contract.address);
            results.backend.details.push({
                name: `${contract.name} 地址`,
                expected: contract.address,
                status: hasAddress ? '✅' : '❌'
            });
            if (!hasAddress) {
                results.backend.errors.push(`${contract.name} 地址不匹配`);
            }
        });
        
        // 檢查 VRF 配置
        const hasVRFConfig = content.includes('VRF_CONFIG');
        results.backend.details.push({
            name: 'VRF 配置',
            status: hasVRFConfig ? '✅' : '❌'
        });
        
        // 檢查環境變數
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const hasVRFEnabled = envContent.includes('VRF_ENABLED=true');
            results.backend.details.push({
                name: 'VRF 啟用',
                status: hasVRFEnabled ? '✅' : '❌'
            });
        }
        
        const hasErrors = results.backend.errors.length > 0;
        results.backend.status = hasErrors ? '❌' : '✅';
    } else {
        results.backend.status = '❌';
        results.backend.errors.push('找不到 contracts.js 文件');
    }
}

// 4. 驗證鏈上狀態
async function verifyOnchain() {
    console.log("\n⛓️ 驗證鏈上合約部署狀態...");
    try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
        
        // 檢查關鍵合約是否部署
        const contractsToCheck = [
            { name: 'Hero', address: V25_FINAL_CONTRACTS.HERO },
            { name: 'Relic', address: V25_FINAL_CONTRACTS.RELIC },
            { name: 'DungeonMaster', address: V25_FINAL_CONTRACTS.DUNGEONMASTER },
            { name: 'AltarOfAscension', address: V25_FINAL_CONTRACTS.ALTAROFASCENSION },
            { name: 'VRFManager', address: V25_FINAL_CONTRACTS.VRFMANAGER }
        ];
        
        for (const contract of contractsToCheck) {
            const code = await provider.getCode(contract.address);
            const isDeployed = code !== '0x' && code !== '0x0';
            results.onchain.details.push({
                name: `${contract.name} 已部署`,
                address: contract.address,
                status: isDeployed ? '✅' : '❌'
            });
            if (!isDeployed) {
                results.onchain.errors.push(`${contract.name} 未部署`);
            }
        }
        
        const hasErrors = results.onchain.errors.length > 0;
        results.onchain.status = hasErrors ? '❌' : '✅';
    } catch (error) {
        console.log("  ⚠️ 無法驗證鏈上狀態:", error.message);
        results.onchain.status = '❓';
        results.onchain.errors.push('無法連接到 BSC 網路');
    }
}

// 主函數
async function main() {
    console.log("=".repeat(60));
    console.log("開始執行 V25 最終同步驗證...\n");
    
    // 執行所有驗證
    verifySubgraph();
    verifyFrontend();
    verifyBackend();
    await verifyOnchain();
    
    // 生成報告
    console.log("\n" + "=".repeat(60));
    console.log("📋 V25 最終同步驗證報告");
    console.log("=".repeat(60));
    
    // 顯示各組件狀態
    const components = [
        { name: '子圖', result: results.subgraph },
        { name: '前端', result: results.frontend },
        { name: '後端', result: results.backend },
        { name: '鏈上', result: results.onchain }
    ];
    
    console.log("\n🎯 組件狀態總覽:");
    components.forEach(comp => {
        console.log(`${comp.name}: ${comp.result.status}`);
    });
    
    // 顯示詳細問題
    console.log("\n📝 詳細檢查結果:");
    components.forEach(comp => {
        console.log(`\n${comp.name}:`);
        comp.result.details.forEach(detail => {
            console.log(`  ${detail.name}: ${detail.status}`);
            if (detail.expected && detail.status === '❌') {
                console.log(`    預期: ${detail.expected}`);
            }
        });
        if (comp.result.errors.length > 0) {
            console.log(`  ❌ 錯誤:`);
            comp.result.errors.forEach(error => {
                console.log(`    - ${error}`);
            });
        }
    });
    
    // 判斷整體狀態
    const allSuccess = components.every(c => c.result.status === '✅');
    const hasErrors = components.some(c => c.result.status === '❌');
    
    console.log("\n" + "=".repeat(60));
    if (allSuccess) {
        console.log("🎉 所有組件已正確同步 V25 配置！");
        console.log("✅ 系統已準備就緒，可以進行部署");
    } else if (hasErrors) {
        console.log("⚠️ 發現同步問題，請檢查以下項目:");
        
        components.forEach(comp => {
            if (comp.result.errors.length > 0) {
                console.log(`\n${comp.name} 需要修復:`);
                comp.result.errors.forEach(error => {
                    console.log(`  - ${error}`);
                });
            }
        });
        
        console.log("\n🔧 建議修復步驟:");
        if (results.subgraph.status === '❌') {
            console.log("\n子圖修復:");
            console.log("1. 執行: node scripts/active/v25-complete-update.js");
            console.log("2. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
            console.log("3. npm run codegen && npm run build");
            console.log("4. graph deploy --studio dungeon-delvers --version-label v3.6.5");
        }
        if (results.frontend.status === '❌') {
            console.log("\n前端修復:");
            console.log("1. 執行: node scripts/active/v25-complete-update.js");
            console.log("2. cd /Users/sotadic/Documents/GitHub/DungeonDelvers");
            console.log("3. npm run build && npm run deploy");
        }
        if (results.backend.status === '❌') {
            console.log("\n後端修復:");
            console.log("1. 執行: node scripts/active/v25-complete-update.js");
            console.log("2. cd /Users/sotadic/Documents/dungeon-delvers-metadata-server");
            console.log("3. pm2 restart metadata-server");
        }
    } else {
        console.log("✅ 基本配置完成，部分功能需要確認");
    }
    
    // 保存報告
    const report = {
        timestamp: new Date().toISOString(),
        version: 'V25',
        blockNumber: 56631513,
        subgraphVersion: 'v3.6.5',
        contracts: V25_FINAL_CONTRACTS,
        results,
        summary: {
            allSuccess,
            hasErrors,
            components: components.map(c => ({ name: c.name, status: c.result.status }))
        }
    };
    
    const reportPath = path.join(__dirname, `v25-final-sync-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 驗證報告已保存: ${reportPath}`);
    
    console.log("\n✅ V25 最終同步驗證完成！");
}

main().catch(error => {
    console.error("\n❌ 驗證失敗:", error);
    process.exit(1);
});
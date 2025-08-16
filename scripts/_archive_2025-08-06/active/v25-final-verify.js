const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");

console.log("🔍 V25 VRF 系統最終驗證\n");
console.log("📅 部署時間: 2025-08-06");
console.log("📦 子圖版本: v3.6.5");
console.log("🔢 部署區塊: 56631513\n");

// V25 最終合約地址
const EXPECTED_CONTRACTS = {
    // VRF 更新的合約
    HERO: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    RELIC: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    DUNGEONMASTER: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    ALTAROFASCENSION: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    DUNGEONSTORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    
    // 複用的合約
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PLAYERVAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
    PLAYERPROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
    VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
    ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
    
    // 固定合約
    VRFMANAGER: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
    SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    USD: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
};

const results = {
    subgraph: { status: '❓', details: [] },
    frontend: { status: '❓', details: [] },
    backend: { status: '❓', details: [] },
    onchain: { status: '❓', details: [] }
};

// 1. 驗證子圖配置
console.log("📊 驗證子圖配置...");
const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
if (fs.existsSync(subgraphPath)) {
    const content = fs.readFileSync(subgraphPath, 'utf8');
    
    // 檢查合約地址
    const heroMatch = content.includes(EXPECTED_CONTRACTS.HERO);
    const relicMatch = content.includes(EXPECTED_CONTRACTS.RELIC);
    const dungeonMasterMatch = content.includes(EXPECTED_CONTRACTS.DUNGEONMASTER);
    const altarMatch = content.includes(EXPECTED_CONTRACTS.ALTAROFASCENSION);
    const partyMatch = content.includes(EXPECTED_CONTRACTS.PARTY);
    
    // 檢查 VRF 事件
    const vrfEventMatch = content.includes('VRFManagerSet');
    const upgradeRequestMatch = content.includes('UpgradeRequested');
    const expeditionCommittedMatch = content.includes('ExpeditionCommitted');
    
    // 檢查區塊高度
    const blockMatch = content.includes('56631513');
    
    results.subgraph.details = [
        { name: 'Hero 地址', status: heroMatch ? '✅' : '❌' },
        { name: 'Relic 地址', status: relicMatch ? '✅' : '❌' },
        { name: 'DungeonMaster 地址', status: dungeonMasterMatch ? '✅' : '❌' },
        { name: 'AltarOfAscension 地址', status: altarMatch ? '✅' : '❌' },
        { name: 'Party 地址', status: partyMatch ? '✅' : '❌' },
        { name: 'VRF 事件', status: vrfEventMatch ? '✅' : '❌' },
        { name: 'Upgrade 事件', status: upgradeRequestMatch ? '✅' : '❌' },
        { name: 'Expedition 事件', status: expeditionCommittedMatch ? '✅' : '❌' },
        { name: '起始區塊', status: blockMatch ? '✅' : '❌' }
    ];
    
    const allPass = results.subgraph.details.every(d => d.status === '✅');
    results.subgraph.status = allPass ? '✅' : '❌';
    
    console.log(`  子圖狀態: ${results.subgraph.status}`);
    results.subgraph.details.forEach(d => {
        console.log(`    ${d.name}: ${d.status}`);
    });
}

// 2. 驗證前端配置
console.log("\n🎨 驗證前端配置...");
const frontendPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/src/config/contracts.ts';
if (fs.existsSync(frontendPath)) {
    const content = fs.readFileSync(frontendPath, 'utf8');
    
    const heroMatch = content.includes(EXPECTED_CONTRACTS.HERO);
    const relicMatch = content.includes(EXPECTED_CONTRACTS.RELIC);
    const vrfManagerMatch = content.includes(EXPECTED_CONTRACTS.VRFMANAGER);
    const feeCalcMatch = content.includes('calculateMintFee') || content.includes('vrfFee');
    
    results.frontend.details = [
        { name: 'Hero 地址', status: heroMatch ? '✅' : '❌' },
        { name: 'Relic 地址', status: relicMatch ? '✅' : '❌' },
        { name: 'VRF Manager', status: vrfManagerMatch ? '✅' : '❌' },
        { name: 'VRF 費用計算', status: feeCalcMatch ? '✅' : '❓' }
    ];
    
    const allPass = results.frontend.details.filter(d => d.status === '❌').length === 0;
    results.frontend.status = allPass ? '✅' : '❌';
    
    console.log(`  前端狀態: ${results.frontend.status}`);
    results.frontend.details.forEach(d => {
        console.log(`    ${d.name}: ${d.status}`);
    });
}

// 3. 驗證後端配置
console.log("\n🔧 驗證後端配置...");
const backendEnvPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/.env';
const backendConfigPath = '/Users/sotadic/Documents/dungeon-delvers-metadata-server/config/contracts.js';

if (fs.existsSync(backendEnvPath) || fs.existsSync(backendConfigPath)) {
    let content = '';
    if (fs.existsSync(backendEnvPath)) {
        content += fs.readFileSync(backendEnvPath, 'utf8');
    }
    if (fs.existsSync(backendConfigPath)) {
        content += fs.readFileSync(backendConfigPath, 'utf8');
    }
    
    const heroMatch = content.includes(EXPECTED_CONTRACTS.HERO);
    const vrfManagerMatch = content.includes(EXPECTED_CONTRACTS.VRFMANAGER);
    const vrfEnabledMatch = content.includes('VRF_ENABLED=true') || content.includes('vrf: true');
    
    results.backend.details = [
        { name: 'Hero 地址', status: heroMatch ? '✅' : '❌' },
        { name: 'VRF Manager', status: vrfManagerMatch ? '✅' : '❌' },
        { name: 'VRF 啟用', status: vrfEnabledMatch ? '✅' : '❓' }
    ];
    
    const allPass = results.backend.details.filter(d => d.status === '❌').length === 0;
    results.backend.status = allPass ? '✅' : '❌';
    
    console.log(`  後端狀態: ${results.backend.status}`);
    results.backend.details.forEach(d => {
        console.log(`    ${d.name}: ${d.status}`);
    });
}

// 4. 驗證鏈上狀態（可選）
console.log("\n⛓️ 驗證鏈上狀態...");
async function verifyOnchain() {
    try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
        
        // 檢查合約是否部署
        const heroCode = await provider.getCode(EXPECTED_CONTRACTS.HERO);
        const vrfCode = await provider.getCode(EXPECTED_CONTRACTS.VRFMANAGER);
        
        results.onchain.details = [
            { name: 'Hero 合約已部署', status: heroCode !== '0x' ? '✅' : '❌' },
            { name: 'VRF Manager 已部署', status: vrfCode !== '0x' ? '✅' : '❌' }
        ];
        
        const allPass = results.onchain.details.every(d => d.status === '✅');
        results.onchain.status = allPass ? '✅' : '❌';
        
        console.log(`  鏈上狀態: ${results.onchain.status}`);
        results.onchain.details.forEach(d => {
            console.log(`    ${d.name}: ${d.status}`);
        });
    } catch (error) {
        console.log("  ⚠️ 無法驗證鏈上狀態:", error.message);
        results.onchain.status = '❓';
    }
}

// 執行驗證
(async () => {
    await verifyOnchain();
    
    // 總結
    console.log("\n" + "=".repeat(60));
    console.log("📋 V25 VRF 系統驗證總結");
    console.log("=".repeat(60));
    
    const components = [
        { name: '子圖', status: results.subgraph.status },
        { name: '前端', status: results.frontend.status },
        { name: '後端', status: results.backend.status },
        { name: '鏈上', status: results.onchain.status }
    ];
    
    components.forEach(c => {
        console.log(`${c.name}: ${c.status}`);
    });
    
    const allSuccess = components.every(c => c.status === '✅');
    const hasErrors = components.some(c => c.status === '❌');
    
    console.log("\n" + "=".repeat(60));
    
    if (allSuccess) {
        console.log("🎉 所有組件已正確配置 VRF 系統！");
    } else if (hasErrors) {
        console.log("⚠️ 部分組件需要更新，請檢查上述詳情");
    } else {
        console.log("✅ 基本配置完成，部分功能需要進一步確認");
    }
    
    // 保存驗證報告
    const report = {
        timestamp: new Date().toISOString(),
        version: 'V25',
        blockNumber: 56631513,
        subgraphVersion: 'v3.6.5',
        results,
        contracts: EXPECTED_CONTRACTS,
        summary: {
            allSuccess,
            hasErrors,
            components
        }
    };
    
    const reportPath = path.join(__dirname, `v25-verification-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 驗證報告已保存: ${reportPath}`);
    
    // 提供後續步驟建議
    if (!allSuccess) {
        console.log("\n🔧 建議的修復步驟:");
        
        if (results.subgraph.status !== '✅') {
            console.log("\n子圖修復:");
            console.log("1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
            console.log("2. npm run codegen");
            console.log("3. npm run build");
            console.log("4. graph deploy --studio dungeon-delvers --version-label v3.6.5");
        }
        
        if (results.frontend.status !== '✅') {
            console.log("\n前端修復:");
            console.log("1. 更新 src/config/contracts.ts");
            console.log("2. 添加 VRF 費用計算邏輯");
            console.log("3. npm run build && npm run deploy");
        }
        
        if (results.backend.status !== '✅') {
            console.log("\n後端修復:");
            console.log("1. 更新 .env 文件");
            console.log("2. 重啟服務: pm2 restart metadata-server");
        }
    }
    
    console.log("\n✅ V25 VRF 系統驗證完成！");
})();